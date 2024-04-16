import {Settings, SettingsData} from "../shared/settings";
import {VideoPlayer} from "./videoPlayer";
import {PlaybackManager} from "./playbackManager";

// Detects changes of <video> tags and attaches the custom video players to the Instagram page.
export class VideoDetector implements PlaybackManager {

    // The extension settings.
    private readonly settings = Settings.shared;

    // List of all video players by source.
    private videosBySource: { [source: string]: VideoPlayer } = {}

    // Initialize the video detector.
    public async init() {
        // Loads the settings and subscribe for setting changes.
        await this.settings.init();
        this.settings.changed.subscribe((name) => this.onSettingChanged(name));

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

            // Update the initial volume.
            this.updateVolumeForVideo(player.videoElement);
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

    //#region PlaybackManager implementation

    // Must be called whenever a video playback was started.
    public notifyVideoPlay(video: HTMLVideoElement) {
        // Instagram will mute videos in Reels as soon as playback starts. To counter this we will ignore the next volume
        // change event and undo the volume / mute change.
        this.ignoreNextVolumeChange = true;
        setTimeout(() => {
            this.ignoreNextVolumeChange = false
        }, 50)


        // Make sure we apply the last used volume settings.
        this.updateVolumeForVideo(video);
    }

    // Must be called whenever a video volume was changed.
    public notifyVideoVolumeChange(video: HTMLVideoElement) {
        // Not changed, so no need to update the other videos.
        if (this.settings.lastPlaybackVolume === video.volume &&
            this.lastPlaybackMuted === video.muted)
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

    //#endregion

}