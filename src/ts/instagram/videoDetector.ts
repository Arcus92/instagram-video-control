import {Settings} from "../shared/settings";
import {VideoPlayer} from "./videoPlayer";
import {PlaybackManager} from "./playbackManager";

// Detects changes of <video> tags and attaches the custom video players to the Instagram page.
export class VideoDetector implements PlaybackManager {

    // The extension settings.
    private readonly settings = Settings.shared;


    // List of all video players by source.
    private videosBySource: { [source: string]: VideoPlayer } = {}

    // Starts the video detector and adds the control bar.
    public start() {
        this.settings.load();

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

    //#region Volume

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
        video.muted = this.settings.lastPlaybackMuted;
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
        }, 10)


        // Make sure we apply the last used volume settings.
        this.updateVolumeForVideo(video);
    }

    // Must be called whenever a video volume was changed.
    public notifyVideoVolumeChange(video: HTMLVideoElement) {
        // Not changed, so no need to update the other videos.
        if (this.settings.lastPlaybackVolume === video.volume &&
            this.settings.lastPlaybackMuted === video.muted)
            return;

        // To fix an issue with Reels, we sometimes have to ignore and undo volume events.
        if (this.ignoreNextVolumeChange) {
            this.updateVolumeForVideo(video);
            return;
        }

        this.settings.lastPlaybackVolume = video.volume;
        this.settings.lastPlaybackMuted = video.muted;
        this.settings.save();

        // Sync the volume across all other video players.
        this.updateVolumeForVideos();
    }

    //#endregion

}