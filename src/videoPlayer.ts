import {Utils} from "./utils";
import {VideoType} from "./videoType";
import {PlaybackManager} from "./playbackManager";

// The custom video player for Instagram video tags.
export class VideoPlayer {

    // The playback manager to report events to.
    public readonly playbackManager: PlaybackManager;

    // The original video HTML element.
    public readonly videoElement: HTMLVideoElement;

    public constructor(playbackManager: PlaybackManager, videoElement: HTMLVideoElement) {
        this.playbackManager = playbackManager;
        this.videoElement = videoElement;
    }

    // Attaches to the video player and adds custom element and events.
    public attach() {
        this.detectVideo();

        // Do not add controls to the Explore page. This page contains a grid of many small preview videos.
        if (this.videoType === VideoType.explore) return;

        this.createVideoControl();

        this.registerEvents();
    }

    // Detaches the custom player from the video tag. Removes all custom element and events.
    public detach() {
        this.unregisterEvents();
    }

    //#region Events

    // If we add a handler to a class function in TypeScript, we are losing the `this` context.
    // We can use lambda function to get around this.
    // However, we need to store the lambda function, so we can remove it on detach.
    // If you - yes, you - know a better way to implement this, please call me.

    private onPlayHandler: (() => void) | undefined;
    private onPauseHandler: (() => void) | undefined;
    private onTimeUpdateHandler: (() => void) | undefined;
    private onVolumeChangeHandler: (() => void) | undefined;

    // Register all video events.
    private registerEvents() {

        // Creating our event handlers
        this.onPlayHandler = () => this.onPlay();
        this.onPauseHandler = () => this.onPause();
        this.onTimeUpdateHandler = () => this.onTimeUpdate();
        this.onVolumeChangeHandler = () => this.onVolumeChange();

        this.videoElement.addEventListener("play", this.onPlayHandler);
        this.videoElement.addEventListener("pause", this.onPauseHandler);
        this.videoElement.addEventListener("timeupdate", this.onTimeUpdateHandler);
        this.videoElement.addEventListener("volumechange", this.onVolumeChangeHandler);

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

    // Unregisters all video events.
    private unregisterEvents() {
        if (this.onPlayHandler) this.videoElement.removeEventListener("play", this.onPlayHandler);
        if (this.onPauseHandler) this.videoElement.removeEventListener("pause", this.onPauseHandler);
        if (this.onTimeUpdateHandler) this.videoElement.removeEventListener("timeupdate", this.onTimeUpdateHandler);
        if (this.onVolumeChangeHandler) this.videoElement.removeEventListener("volumechange", this.onVolumeChangeHandler);
    }

    // Handles video play event.
    private onPlay() {
        this.updatePlayControl();

        this.playbackManager.notifyVideoPlay(this.videoElement);
    }

    // Handles video pause event.
    private onPause() {
        this.updatePlayControl();
    }

    // Handles video time update event.
    private onTimeUpdate() {
        this.updatePositionControl();
    }

    // Handles video volume changes.
    private onVolumeChange() {
        this.updateVolumeControl();

        // We don't want to react to volume changes from the page itself.
        //if (!event.isTrusted) return;

        this.playbackManager.notifyVideoVolumeChange(this.videoElement);
    }

    //#endregion

    //#region Video

    // The video origin.
    public videoType: VideoType = VideoType.feed;

    // Is the video on an embedded (iframe) page.
    public isEmbedded: boolean = false;

    // The native Instagram overlay element.
    private overlayElement: HTMLElement | undefined;

    // The native Instagram reply element for stories.
    private replyElement: HTMLElement | undefined;


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

    // #endregion

    // #region Controls

    // Created elements by the video controls.
    private videoControlElement: HTMLElement | undefined;
    private playButtonElement: HTMLElement | undefined;
    private seekbarProgressElement: HTMLElement | undefined;
    private positionTextElement: HTMLElement | undefined;
    private muteButtonElement: HTMLElement | undefined;
    private volumeProgressElement: HTMLElement | undefined;

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


        this.videoControlElement = document.createElement("div");
        this.videoControlElement.classList.add("videoControls");
        if (this.videoType === VideoType.reel) {
            this.videoControlElement.classList.add("videoControlsInReels");
        }
        if (this.videoType === VideoType.story) {
            this.videoControlElement.classList.add("videoControlsInStory");
        }
        this.overlayElement.appendChild(this.videoControlElement);

        // Play button
        this.playButtonElement = document.createElement("button");
        this.playButtonElement.classList.add("videoControlElement", "videoControlButton");
        this.videoControlElement.appendChild(this.playButtonElement);

        this.playButtonElement.onclick = () => {
            if (video.paused) {
                video.play().then();
            } else {
                video.pause();
            }
        };

        // Position text
        this.positionTextElement = document.createElement("div");
        this.positionTextElement.classList.add("videoControlElement", "videoControlText");
        this.videoControlElement.appendChild(this.positionTextElement);

        // Seekbar
        const elementSeekbar = document.createElement("div");
        elementSeekbar.classList.add("videoControlElement", "videoControlBar", "videoControlSeekbar");
        this.videoControlElement.appendChild(elementSeekbar);

        const elementSeekbarBackground = document.createElement("div");
        elementSeekbarBackground.classList.add("videoControlBarBackground");
        elementSeekbar.appendChild(elementSeekbarBackground);

        this.seekbarProgressElement = document.createElement("div");
        this.seekbarProgressElement.classList.add("videoControlBarProgress");
        elementSeekbarBackground.appendChild(this.seekbarProgressElement);

        elementSeekbar.addEventListener("click", (event) => {
            const rect = elementSeekbarBackground.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const percentage = Math.max(Math.min(x / rect.width, 1), 0);
            video.currentTime = percentage * video.duration;
        });

        // Mute
        this.muteButtonElement = document.createElement("button");
        this.muteButtonElement.classList.add("videoControlElement", "videoControlButton");
        this.videoControlElement.appendChild(this.muteButtonElement);

        this.muteButtonElement.onclick = () => {
            video.muted = !video.muted;
        };

        // Volume
        const elementVolume = document.createElement("div");
        elementVolume.classList.add("videoControlElement", "videoControlBar", "videoControlVolume");
        this.videoControlElement.appendChild(elementVolume);

        const elementVolumeBackground = document.createElement("div");
        elementVolumeBackground.classList.add("videoControlBarBackground");
        elementVolume.appendChild(elementVolumeBackground);

        this.volumeProgressElement = document.createElement("div");
        this.volumeProgressElement.classList.add("videoControlBarProgress");
        elementVolumeBackground.appendChild(this.volumeProgressElement);

        elementVolume.addEventListener("click", (event) => {
            const rect = elementVolumeBackground.getBoundingClientRect();
            const x = event.clientX - rect.left;
            video.volume = Math.max(Math.min(x / rect.width, 1), 0);
            video.muted = video.volume <= 0;
        });

        // Init update
        this.updatePlayControl();
        this.updatePositionControl();
        this.updateVolumeControl();
    }

    private updatePlayControl() {
        if (!this.playButtonElement) return;
        this.playButtonElement.innerText = this.videoElement.paused ? "▶" : "⏸";
    }

    private updatePositionControl() {
        if (!this.seekbarProgressElement || !this.positionTextElement) return;

        const progress = this.videoElement.currentTime / this.videoElement.duration;
        this.seekbarProgressElement.style.width = `${Math.round(progress * 100)}%`

        this.positionTextElement.innerText =
            `${Utils.formatTime(this.videoElement.currentTime)} / ${Utils.formatTime(this.videoElement.duration)}`;
    }

    private updateVolumeControl() {
        if (!this.muteButtonElement || !this.volumeProgressElement) return;
        this.muteButtonElement.innerText = this.videoElement.muted ? "🔇" : "🔊";
        this.volumeProgressElement.style.width = `${Math.round(this.videoElement.volume * 100)}%`
    }

    //#endregion
}