import {Utils} from "./utils";
import {VideoType} from "./videoType";

// The custom video player for Instagram video tags.
export class VideoPlayer {

    // The original video HTML element.
    public readonly videoElement: HTMLVideoElement;

    // The video origin.
    public videoType: VideoType = VideoType.feed;

    // Is the video on an embedded (iframe) page.
    public isEmbedded: boolean = false;

    // The native Instagram overlay element.
    private overlayElement: HTMLElement | undefined;

    // The native Instagram reply element for stories.
    private replyElement: HTMLElement | undefined;
    public constructor(videoElement: HTMLVideoElement) {
        this.videoElement = videoElement;
    }

    // Attaches to the video player and adds custom element and events.
    public attach() {
        this.detectVideo();

        // Do not add controls to the Explore page. This page contains a grid of many small preview videos.
        if (this.videoType === VideoType.explore) return;

        this.createVideoControl();

        if (this.isEmbedded) {
            // We need to overwrite the video-end event. Instagram will show you a 'watch again on Instagram' message and
            // hide the video. We want to give the user the option to replay the video even after it finished.
            Utils.disableAllEventListeners(this.videoElement, "ended");
            // The embedded page will also force you to open Instagram once you started the video and then lost focus.
            // For example: Playing the video and then switching the tab or scrolling down.
            // This might cause other issues, and we may need to remove this later.
            Utils.disableAllEventListeners(document, "visibilitychange");
        }
    }

    // Detaches the custom player from the video tag. Removes all custom element and events.
    public detach() {

    }

    // Detects the video type and finds all native components.
    private detectVideo() {
        // We assume Reels are the default.
        this.videoType = VideoType.reel;

        // It is not easy to detect the video type. We can only guess by checking the node parent chain for clues.
        let currentElement = this.videoElement as HTMLElement;
        while (currentElement) {

            // If we find an <article> tag, we know this is a feed video.
            if (currentElement.tagName === 'ARTICLE') {
                this.videoType = VideoType.feed;
                break;
            }

            // If we find an <a> tag, we know it must be on the Explore page.
            if (currentElement.tagName === 'A') {
                this.videoType = VideoType.explore;
                break;
            }

            currentElement = currentElement.parentNode as HTMLElement;
        }

        // Check for embedded videos.
        this.isEmbedded = this.videoElement.parentElement?.parentElement?.parentElement?.classList?.contains("EmbedVideo") ?? false;

        // Detect the native overlay.
        this.overlayElement = this.videoElement.nextElementSibling as HTMLElement;

        this.replyElement = undefined;

        // Navigate to the social buttons. They are seven layers deep in the structure.
        const socialElement = this.videoElement
            ?.parentElement?.parentElement?.parentElement?.parentElement
            ?.parentElement?.parentElement?.parentElement?.nextElementSibling;

        if (socialElement) {
            // If the inner element is an <textarea>, we now this is a Story video.
            const textarea = socialElement.firstChild?.firstChild?.firstChild?.firstChild;
            if (textarea instanceof HTMLTextAreaElement) {
                this.videoType = VideoType.story;
                this.replyElement = socialElement as HTMLElement;
            }
        }
    }


    // Create the video controls with play/pause buttons, seekbar and volume control.
    private createVideoControl() {
        if (!this.overlayElement) return;
        const video = this.videoElement;


        // Adjusting the existing controls...


        // Removes the height of the controls from the inner overlay to not block mouse clicks.
        if (this.overlayElement.firstChild instanceof HTMLElement) {
            this.overlayElement.firstChild.style.height = "calc(100% - 32px)";
        }

        // For Stories, we also add a margin to the reply element to not overlay the controls.
        if (this.replyElement) {
            this.replyElement.style.marginBottom = '32px';
        }


        // Creating the actual player...


        const elementVideoControl = document.createElement("div");
        elementVideoControl.classList.add("videoControls");
        if (this.videoType === VideoType.reel) {
            elementVideoControl.classList.add("videoControlsInReels");
        }
        if (this.videoType === VideoType.story) {
            elementVideoControl.classList.add("videoControlsInStory");
        }
        this.overlayElement.appendChild(elementVideoControl);

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

}