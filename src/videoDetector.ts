import {Settings} from "./settings";
import {VideoPlayer} from "./videoPlayer";

// Detects changes of <video> tags and attaches the custom video players to the Instagram page.
export class VideoDetector {

    private ignoreNextVolumeChange = false

    private registeredVideos: HTMLVideoElement[] = [];

    // Starts the video detector and adds the control bar.
    public start() {
        Settings.shared.load();

        // Instagram is a single-page-application and loads posts asynchronously. We'll check every second for new videos.
        // MutationObserver is too slow, because there are to many nodes and changes on that site.
        setInterval(() => {
            this.checkForVideosAndAttachControls();
        }, 1000);
    }


    // Is called when a new video element was detected on the page.
    private registerVideoElement(video: HTMLVideoElement) {
        // Update volume
        this.updateVolumeForVideo(video);


        video.addEventListener("volumechange", (event) => this.onVolumeChanged(event));
        video.addEventListener("play", (event) => this.onPlay(event));
    }

    // Is called when a video element was removed from the page.
    private unregisterVideoElement(video: HTMLVideoElement) {
        video.removeEventListener("volumechange", (event) => this.onVolumeChanged(event));
        video.removeEventListener("play", (event) => this.onPlay(event));
    }


    // Applies the stored volume to all registered videos.
    private updateVolumeForVideos() {
        for (const video of this.registeredVideos) {
            this.updateVolumeForVideo(video);
        }
    }

    // Applies the stored volume to the given video.
    private updateVolumeForVideo(video: HTMLVideoElement) {
        video.volume = Settings.shared.lastPlaybackVolume;
        video.muted = Settings.shared.lastPlaybackMuted;
    }

    // Is called when the volume was changed of any registered video.
    private onVolumeChanged(event: Event) {
        // We don't want to react to volume changes from the page itself.
        if (!event.isTrusted) return;

        const video = event.target as HTMLVideoElement;

        // Not changed, so no need to update the other videos.
        if (Settings.shared.lastPlaybackVolume === video.volume &&
            Settings.shared.lastPlaybackMuted === video.muted)
            return;

        // To fix an issue with Reels, we sometimes have to ignore and undo volume events.
        if (this.ignoreNextVolumeChange) {
            this.updateVolumeForVideo(video);
            return;
        }

        Settings.shared.lastPlaybackVolume = video.volume;
        Settings.shared.lastPlaybackMuted = video.muted;
        Settings.shared.save();

        // Sync the volume across all other video players.
        this.updateVolumeForVideos();
    }

    // Is called when a video is starting playback.
    private onPlay(event: Event) {
        const video = event.target as HTMLVideoElement;

        // Instagram will mute videos in Reels as soon as playback starts. To counter this we will ignore the next volume
        // change event and undo the volume / mute change.
        this.ignoreNextVolumeChange = true;
        setTimeout(() => {
            this.ignoreNextVolumeChange = false
        }, 10)


        // Make sure we apply the last used volume settings.
        this.updateVolumeForVideo(video);
    }

    // List of all video players by source.
    private videosBySource: { [source: string]: VideoPlayer } = {}

    // Checks the page for new or removed video players and attaches / detaches them.
    private checkForVideosAndAttachControls() {
        const videos = document.getElementsByTagName('video');

        // Detect new videos...
        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            if (this.videosBySource[video.src]) continue;

            const player = new VideoPlayer(video);
            this.videosBySource[video.src] = player;

            player.attach();
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

}