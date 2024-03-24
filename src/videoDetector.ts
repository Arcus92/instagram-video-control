import {Settings} from "./settings";
import {Utils} from "./utils";

export class VideoDetector {

    private ignoreNextVolumeChange = false

    private registeredVideos: HTMLVideoElement[] = [];
    private videoControlMap: { [src: string]: HTMLElement } = {};

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
        // Update volume
        this.updateVolumeForVideo(video);

        // Create the custom video control bar
        this.createVideoControl(video);

        // Instead of removing the Instagram controls, we change the height and remove the height of the native video
        // controls. This lets the user click the bottom of the video / interact with the video controls AND use the
        // Instagram controls like sharing, following, channel links, etc.
        const elementAfterVideo = video.nextElementSibling as HTMLElement;
        if (elementAfterVideo) {
            if (elementAfterVideo.firstChild instanceof HTMLElement) {
                elementAfterVideo.firstChild.style.height = "calc(100% - 32px)";
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

        // Removes the custom controls
        this.removeVideoControl(video);
    }

    // Create the video controls with play/pause buttons, seekbar and volume control.
    private createVideoControl(video: HTMLVideoElement) {
        const elementAfterVideo = video.nextElementSibling;
        if (!elementAfterVideo) return;

        let currentElement = video as HTMLElement;
        let videoType = "reel";
        while (currentElement) {
            if (currentElement.tagName === "ARTICLE") {
                videoType = "post";
                break;
            }
            currentElement = currentElement.parentNode as HTMLElement;
        }

        const elementVideoControl = document.createElement("div");
        elementVideoControl.classList.add("videoControls");
        if (videoType === "reel") {
            elementVideoControl.classList.add("videoControlsInReels");
        }
        elementAfterVideo.appendChild(elementVideoControl);
        this.videoControlMap[video.src] = elementVideoControl;

        // Play button
        const elementPlayButton = document.createElement("button");
        elementPlayButton.classList.add("videoControlElement", "videoControlButton");
        elementVideoControl.appendChild(elementPlayButton);

        elementPlayButton.onclick = () => {
            if (video.paused) {
                video.play().then();
            } else {
                video.pause();
            }
        };

        function updatePlayButton() {
            elementPlayButton.innerText = video.paused ? "▶" : "⏸";
        }
        updatePlayButton();

        video.addEventListener("play", updatePlayButton);
        video.addEventListener("pause", updatePlayButton);

        // Position text
        const elementPosition = document.createElement("div");
        elementPosition.classList.add("videoControlElement", "videoControlText");
        elementVideoControl.appendChild(elementPosition);

        // Seekbar
        const elementSeekbar = document.createElement("div");
        elementSeekbar.classList.add("videoControlElement", "videoControlBar", "videoControlSeekbar");
        elementVideoControl.appendChild(elementSeekbar);

        const elementSeekbarBackground = document.createElement("div");
        elementSeekbarBackground.classList.add("videoControlBarBackground");
        elementSeekbar.appendChild(elementSeekbarBackground);

        const elementSeekbarProgress = document.createElement("div");
        elementSeekbarProgress.classList.add("videoControlBarProgress");
        elementSeekbarBackground.appendChild(elementSeekbarProgress);

        function updateSeekbar() {
            const progress = video.currentTime / video.duration;
            elementSeekbarProgress.style.width = `${Math.round(progress * 100)}%`

            elementPosition.innerText = `${Utils.formatTime(video.currentTime)} / ${Utils.formatTime(video.duration)}`;
        }
        updateSeekbar();
        video.addEventListener("timeupdate", updateSeekbar);

        elementSeekbar.addEventListener("click", (event) => {
            const rect = elementSeekbarBackground.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const percentage = Math.max(Math.min(x / rect.width, 1), 0);
            video.currentTime = percentage * video.duration;
        });

        // Mute
        const elementMuteButton = document.createElement("button");
        elementMuteButton.classList.add("videoControlElement", "videoControlButton");
        elementMuteButton.innerText = "🔊";
        elementVideoControl.appendChild(elementMuteButton);

        elementMuteButton.onclick = () => {
            video.muted = !video.muted;
        };

        // Volume
        const elementVolume = document.createElement("div");
        elementVolume.classList.add("videoControlElement", "videoControlBar", "videoControlVolume");
        elementVideoControl.appendChild(elementVolume);

        const elementVolumeBackground = document.createElement("div");
        elementVolumeBackground.classList.add("videoControlBarBackground");
        elementVolume.appendChild(elementVolumeBackground);

        const elementVolumeProgress = document.createElement("div");
        elementVolumeProgress.classList.add("videoControlBarProgress");
        elementVolumeBackground.appendChild(elementVolumeProgress);

        function updateVolume() {
            elementMuteButton.innerText = video.muted ? "🔇" : "🔊";
            elementVolumeProgress.style.width = `${Math.round(video.volume * 100)}%`
        }
        updateVolume();
        video.addEventListener("volumechange", updateVolume);

        elementVolume.addEventListener("click", (event) => {
            const rect = elementVolumeBackground.getBoundingClientRect();
            const x = event.clientX - rect.left;
            video.volume = Math.max(Math.min(x / rect.width, 1), 0);
            video.muted = video.volume <= 0;
        });
    }

    // Removes the videos controls.
    private removeVideoControl(video: HTMLVideoElement) {
        const element = this.videoControlMap[video.src];
        if (element) {
            element.remove();
            delete this.videoControlMap[video.src];
        }
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