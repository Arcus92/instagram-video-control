import {Settings} from "./settings";
import {Utils} from "./utils";

export class VideoDetector {

    private ignoreNextVolumeChange = false

    private registeredVideos: HTMLVideoElement[] = [];

    // Starts the video detector and adds the control bar.
    public start() {
        Settings.shared.load();

        // Instagram is a single-page-application and loads posts asynchronously. We'll check every second for new videos.
        // MutationObserver is too slow, because there are to many nodes and changes on that site.
        setInterval(() => {
            this.checkForVideosAndEnableHtmlControls();
        }, 1000);
    }


    // Is called when a new video element was detected on the page.
    private registerVideoElement(video: HTMLVideoElement) {
        // Enable Html controls
        video.controls = true;

        // Update volume
        this.updateVolumeForVideo(video);

        // Instead of removing the Instagram controls, we change the height and remove the height of the native video
        // controls. This lets the user click the bottom of the video / interact with the video controls AND use the
        // Instagram controls like sharing, following, channel links, etc.
        const elementAfterVideo = video.nextElementSibling as HTMLElement;
        if (elementAfterVideo) {
            if (elementAfterVideo.firstChild instanceof HTMLElement) {
                elementAfterVideo.firstChild.style.height = "calc(100% - 40px)";
            }
        }

        // Detect if this video is embedded. We need to apply special rules for embedded videos.
        const isEmbedded = video.parentElement?.parentElement?.parentElement?.classList?.contains("EmbedVideo") ?? false;
        if (isEmbedded) {
            // The pause handler for embedded videos is a layer deeper than on usual videos.
            // We need to delete this, otherwise the video is covered by these invisible elements and not clickable.
            while (video.parentElement?.nextElementSibling)
            {
                video.parentElement.nextElementSibling.remove();
            }

            // We need to overwrite the video-end event. Instagram will show you a 'watch again on Instagram' message and
            // hide the video. We want to give the user the option to replay the video even after it finished.
            Utils.disableAllEventListeners(video, "ended");
            // The embedded page will also force you to open Instagram once you started the video and then lost focus.
            // For example: Playing the video and then switching the tab or scrolling down.
            // This might cause other issues, and we may need to remove this later.
            Utils.disableAllEventListeners(document, "visibilitychange");
        }


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
    private onVolumeChanged(event: Event){
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

    // Checks for new video elements on the page.
    private checkForVideosAndEnableHtmlControls() {
        const videos = document.getElementsByTagName('video');

        // Detect new videos...
        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            if (this.registeredVideos.includes(video)) continue;
            if (VideoDetector.isVideoInExplorePage(video)) continue;

            this.registeredVideos.push(video);
            this.registerVideoElement(video);
        }

        // Detect removed videos...
        for (let i = 0; i < this.registeredVideos.length; i++) {
            const video = this.registeredVideos[i];
            let found = false;
            for (let n = 0; n < videos.length; n++) {
                if (videos[n] === video) {
                    found = true;
                    break;
                }
            }
            if (found) continue;
            this.registeredVideos.splice(i, 1);
            this.unregisterVideoElement(video);
            i--;
        }
    }



    // Returns if the given video is from the explore page. Video controls in the explore page looks wrong, and we don't
    // want to unmute multiple videos there. We simply ignore them.
    private static isVideoInExplorePage(video: HTMLVideoElement): boolean {

        // Since Instagram is obfuscated, the best way to test for it, is to check for a video embedded in an a-tag.
        // The explore videos are like buttons that takes you to the actual view page.
        let parent = video.parentNode as HTMLElement;
        while (parent)
        {
            if (parent.tagName === 'A') {
                return true;
            }
            parent = parent.parentNode as HTMLElement;
        }

        return false;
    }
}