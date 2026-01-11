import { Settings, SettingsData } from '../shared/settings';
import { VideoPlayer } from './videoPlayer';
import { PlaybackManager } from './playbackManager';
import { Browser } from '../shared/browser';
import { VideoAutoplayMode } from '../shared/videoAutoplayMode';

// Detects changes of <video> tags and attaches the custom video players to the Instagram page.
export class VideoDetector implements PlaybackManager {
    // The extension settings.
    private readonly settings = Settings.shared;

    // List of all video players by source.
    private videosBySource: { [source: string]: VideoPlayer } = {};

    // Initialize the video detector.
    public async init() {
        // Loads the settings and subscribe for setting changes.
        await this.settings.init();
        this.settings.changed.subscribe((name) => this.onSettingChanged(name));

        // If the user really want's to unmute the videos on page-load, we let him do that.
        if (this.settings.autoplayMode === VideoAutoplayMode.unmuted) {
            this.checkAndEnableAutoplayWithAudio();
        } else if (this.settings.autoplayMode === VideoAutoplayMode.stopped) {
            // When autoplay is disabled, we can unmute by default. Videos only start on user-interaction so nobody
            // will be annoyed with sudden audio playback.
            this.lastPlaybackMuted = false;
        }

        // Starts the detector.
        this.start();
    }

    // Starts the video detector and adds the control bar.
    private start() {
        // Instagram is a single-page-application and loads posts asynchronously. We'll check every second for new videos.
        // MutationObserver is too slow, because there are to many nodes and changes on that site.
        setInterval(() => {
            this.checkForVideosAndAttachControls();
        }, 1000);
    }

    // Checks the page for new or removed video players and attaches / detaches them.
    private checkForVideosAndAttachControls() {
        const videos = document.getElementsByTagName('video');

        // Detect new videos...
        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            if (this.videosBySource[video.src]) continue;

            const player = new VideoPlayer(this, video);
            this.videosBySource[video.src] = player;

            player.attach();

            // Update the initial volume and speed.
            this.updateVolumeForVideo(player.videoElement);
            this.updatePlaybackSpeedForVideo(player.videoElement);
        }

        // Detect removed videos...
        for (const source in this.videosBySource) {
            let found = false;
            for (let n = 0; n < videos.length; n++) {
                if (videos[n].src === source) {
                    found = true;
                    break;
                }
            }
            if (found) continue;

            const video = this.videosBySource[source];
            video.detach();

            delete this.videosBySource[source];
        }
    }

    //#region Settings

    // An extension setting was changed.
    private onSettingChanged(name: keyof SettingsData) {
        switch (name) {
            case 'showTimeCodeText':
            case 'showFullscreenButton':
            case 'showPictureInPictureButton':
            case 'showPlaybackSpeedOption':
            case 'autoHideControlBar':
            case 'loopPlayback':
                this.updateControlSettingForVideos();
                break;
            case 'videoControlMode':
                this.updateControlModeForVideos();
                break;
        }
    }

    // Notify all players that a control setting was changed.
    private updateControlSettingForVideos() {
        for (const source in this.videosBySource) {
            const videoPlayer = this.videosBySource[source];
            videoPlayer.updateControlSetting();
        }
    }

    // Notify all players that a control mode was changed.
    private updateControlModeForVideos() {
        for (const source in this.videosBySource) {
            const videoPlayer = this.videosBySource[source];
            videoPlayer.updateControlMode();
        }
    }

    //#endregion Settings

    //#region Volume

    // Stores the last muted state. We can not load it from the settings. We cannot unmute and autoplay in modern
    // browsers. Instagram will always autoplay. If we unmute by default, without user interaction, the video will stop.
    // It is possible to overwrite this using `this.settings.autoUnmutePlayback` in the settings menu.
    private lastPlaybackMuted: boolean = true;

    // Sometimes Instagram resets the volume on play. We want to ignore it, since it isn't a user event.
    private ignoreNextVolumeChange = false;

    // Applies the stored volume to all registered videos.
    private updateVolumeForVideos() {
        for (const source in this.videosBySource) {
            const videoPlayer = this.videosBySource[source];
            this.updateVolumeForVideo(videoPlayer.videoElement);
        }
    }

    // Applies the stored volume to the given video.
    private updateVolumeForVideo(video: HTMLVideoElement) {
        video.volume = this.settings.lastPlaybackVolume;
        video.muted = this.lastPlaybackMuted;
    }

    //#endregion

    //#region Speed

    // Applies the stored playback speed to all registered videos.
    private updatePlaybackSpeedForVideos() {
        for (const source in this.videosBySource) {
            const videoPlayer = this.videosBySource[source];
            this.updatePlaybackSpeedForVideo(videoPlayer.videoElement);
        }
    }

    // Applies the stored playback speed to the given video.
    private updatePlaybackSpeedForVideo(video: HTMLVideoElement) {
        video.playbackRate = this.settings.lastPlaybackSpeed;
    }

    //#endregion

    //#region Autoplay

    private checkAndEnableAutoplayWithAudio() {
        // Check if autoplay is available.
        this.checkForAutoplay((autoplayEnabled) => {
            // Failed...
            if (!autoplayEnabled) {
                console.error(
                    'The browser is blocking autoplay with audio. Make sure to enable autoplay in the website settings!'
                );
                return;
            }

            // Disable the mute for all videos.
            this.lastPlaybackMuted = false;
        });
    }

    // This checks if audio-autoplay is allowed for this website.
    private checkForAutoplay(callback: (autoplayEnabled: boolean) => void) {
        // I know the is this new experimental api `Navigator.getAutoplayPolicy()` and this is just a hack.
        // However, this has the benefit of requesting autoplay in Firefox. This adds the website permission settings
        // icon to the url bar, where the user can actually enable audio autoplay.
        // How it works: We simply add a silent audio track to the page, enable unmuted autoplay and check if it starts
        // playback within 100ms.
        const audio = document.createElement('audio');
        audio.style.display = 'none';
        audio.autoplay = true;
        audio.defaultMuted = false;
        audio.src = Browser.getUrl('audio/silence.mp3');
        document.body.appendChild(audio);

        const timerId = setTimeout(() => {
            audio.remove();

            callback(false);
        }, 100);

        audio.addEventListener('play', () => {
            audio.remove();
            clearTimeout(timerId);

            callback(true);
        });
    }

    //#endregion

    //#region PlaybackManager implementation

    // Must be called whenever a video playback was started.
    public notifyVideoPlay(video: HTMLVideoElement) {
        // Instagram will mute videos in Reels as soon as playback starts. To counter this we will ignore the next volume
        // change event and undo the volume / mute change.
        this.ignoreNextVolumeChange = true;
        setTimeout(() => {
            this.ignoreNextVolumeChange = false;
        }, 50);

        // Make sure we apply the last used volume settings.
        this.updateVolumeForVideo(video);
    }

    // Must be called whenever a video volume was changed.
    public notifyVideoVolumeChange(video: HTMLVideoElement) {
        // Not changed, so no need to update the other videos.
        if (
            this.settings.lastPlaybackVolume === video.volume &&
            this.lastPlaybackMuted === video.muted
        )
            return;

        // To fix an issue with Reels, we sometimes have to ignore and undo volume events.
        if (this.ignoreNextVolumeChange) {
            this.updateVolumeForVideo(video);
            return;
        }

        this.settings.lastPlaybackVolume = video.volume;
        this.lastPlaybackMuted = video.muted;

        // Sync the volume across all other video players.
        this.updateVolumeForVideos();
    }

    // Must be called whenever a video playback speed was changed.
    public notifyVideoPlaybackSpeedChange(video: HTMLVideoElement) {
        this.settings.lastPlaybackSpeed = video.playbackRate;

        // Sync the speed across all other video players.
        this.updatePlaybackSpeedForVideos();
    }

    //#endregion
}
