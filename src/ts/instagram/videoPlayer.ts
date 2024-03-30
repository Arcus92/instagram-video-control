import {Utils} from "../shared/utils";
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
    public videoType: VideoType = VideoType.post;

    // Is the video on an embedded (iframe) page.
    public isEmbedded: boolean = false;

    // The native Instagram overlay element.
    private overlayElement: HTMLElement | undefined;

    // The native Instagram reply element for stories.
    private replyElement: HTMLElement | undefined;

    // The native clickable areas for mobile Story controls.
    private clickEventElement: HTMLElement | undefined;

    // The native mute button.
    private muteElement: HTMLElement | undefined;


    // Detects the video type and finds all native components.
    private detectVideo() {
        // We assume Reels are the default.
        this.videoType = VideoType.reel;

        // It is not easy to detect the video type. We can only guess by checking the node parent chain for clues.
        let currentElement = this.videoElement as HTMLElement;
        while (currentElement) {

            // If we find an <article> tag, we know this is a post in the main feed.
            if (currentElement.tagName === 'ARTICLE') {
                this.videoType = VideoType.post;
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
        this.clickEventElement = undefined;

        // Navigate to the overlay buttons. They are five layers deep in the structure.
        // The overlay buttons are used for Stories in mobile mode. These are two hidden links that overlay the video.
        // If you click left you go to the previous Story element. If you click right you go to the next one.
        // These are only present in the mobile view (aka small screen width) mode. Otherwise, this element still
        // exists, but it is empty.
        const clickEventElement = this.videoElement
            ?.parentElement?.parentElement?.parentElement?.parentElement
            ?.parentElement?.nextElementSibling;
        if (clickEventElement instanceof HTMLElement) {
            this.clickEventElement = clickEventElement;
        }

        // Navigate to the social buttons. They are seven layers deep in the structure.
        const socialElement = this.videoElement
            ?.parentElement?.parentElement?.parentElement?.parentElement
            ?.parentElement?.parentElement?.parentElement?.nextElementSibling;

        if (socialElement) {
            // I was checking if a <textarea> exists in the reply section to detect stories. However, you can disable
            // users from reply to your stories via a privacy setting. This creates Stories without textarea.
            // The new detection is not as smart:
            // - In Stories the Like and Share buttons are two div-layers deep followed by a <span>.
            // - In Reals they are just one div-layer deep.
            // If the second child is still a <div>, we can assume this is a Story.
            const socialIconsElement = socialElement.firstChild?.firstChild;
            if (socialIconsElement instanceof HTMLDivElement) {
                // There is another issue. Stories have a different layout and controls scheme when viewed on a slim
                // device / viewport. Only the mobile layout has two clickable areas (next and previous buttons).
                if (this.clickEventElement &&
                    this.clickEventElement.childElementCount > 0) {
                    this.videoType = VideoType.mobileStory;
                } else {
                    // No clickable elements are used. We are not in mobile layout.
                    this.videoType = VideoType.story;
                }
                this.replyElement = socialElement as HTMLElement;
            }
        }

        // Finds the native mute button in posts.
        const nativeControlsElement = this.overlayElement.firstChild as HTMLElement;
        if (nativeControlsElement) {
            // Normal posts have a simpler structure. All the different elements are on the first level.
            if (nativeControlsElement.childElementCount > 1) {

                // The position of the mute button can change. It is not always the second element.
                // But it is the first element that contains a <button> tag.
                // The second <button> tag is the marked accounts icon.
                for (const element of nativeControlsElement.children) {
                    if (!(element instanceof HTMLElement)) continue;

                    // Check if this contains a button.
                    if (element.firstChild instanceof HTMLButtonElement) {
                        this.videoType = VideoType.post;
                        this.muteElement = element;
                        break;
                    }
                }
            }
        }
    }

    // #endregion

    // #region Controls

    // Created elements by the video controls.
    private videoControlElement: HTMLElement | undefined;
    private playButtonElement: HTMLElement | undefined;
    private seekBarProgressElement: HTMLElement | undefined;
    private positionTextElement: HTMLElement | undefined;
    private muteButtonElement: HTMLElement | undefined;
    private volumeBarProgressElement: HTMLElement | undefined;

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
            // The social controls in mobile Stories are placed below the post and don't overlap by default.
            if (this.videoType !== VideoType.mobileStory) {
                this.replyElement.style.marginBottom = '32px';
            }
        }

        // If clickable overlays are used, we want to add a margin, so we can interact with our controls without
        // activating the overlay buttons.
        if (this.clickEventElement) {
            this.clickEventElement.style.marginBottom = '32px';
        }

        // Hide the native mute button.
        if (this.muteElement) {
            this.muteElement.style.display = 'none';
        }

        // Creating the actual player...


        this.videoControlElement = document.createElement("div");
        this.videoControlElement.classList.add("ivc-controls");
        if (this.videoType === VideoType.reel) {
            this.videoControlElement.classList.add("ivc-reel");
        }
        if (this.videoType === VideoType.story) {
            this.videoControlElement.classList.add("ivc-story");
        }
        this.overlayElement.appendChild(this.videoControlElement);

        // Play button
        this.playButtonElement = document.createElement("button");
        this.playButtonElement.classList.add("ivc-control-element", "ivc-icon-button");
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
        this.positionTextElement.classList.add("ivc-control-element", "ivc-control-text");
        this.videoControlElement.appendChild(this.positionTextElement);

        // Seekbar
        const elementSeekbar = document.createElement("div");
        elementSeekbar.classList.add("ivc-control-element", "ivc-control-bar", "ivc-seek-bar");
        this.videoControlElement.appendChild(elementSeekbar);

        const elementSeekbarBackground = document.createElement("div");
        elementSeekbarBackground.classList.add("ivc-control-bar-background");
        elementSeekbar.appendChild(elementSeekbarBackground);

        this.seekBarProgressElement = document.createElement("div");
        this.seekBarProgressElement.classList.add("ivc-control-bar-progress");
        elementSeekbarBackground.appendChild(this.seekBarProgressElement);

        elementSeekbar.addEventListener("click", (event) => {
            const rect = elementSeekbarBackground.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const percentage = Math.max(Math.min(x / rect.width, 1), 0);
            video.currentTime = percentage * video.duration;
        });

        // Mute
        this.muteButtonElement = document.createElement("button");
        this.muteButtonElement.classList.add("ivc-control-element", "ivc-icon-button");
        this.videoControlElement.appendChild(this.muteButtonElement);

        this.muteButtonElement.onclick = () => {
            video.muted = !video.muted;
        };

        // Volume
        const elementVolume = document.createElement("div");
        elementVolume.classList.add("ivc-control-element", "ivc-control-bar", "ivc-volume-bar");
        this.videoControlElement.appendChild(elementVolume);

        const elementVolumeBackground = document.createElement("div");
        elementVolumeBackground.classList.add("ivc-control-bar-background");
        elementVolume.appendChild(elementVolumeBackground);

        this.volumeBarProgressElement = document.createElement("div");
        this.volumeBarProgressElement.classList.add("ivc-control-bar-progress");
        elementVolumeBackground.appendChild(this.volumeBarProgressElement);

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
        if (!this.seekBarProgressElement || !this.positionTextElement) return;

        const progress = this.videoElement.currentTime / this.videoElement.duration;
        this.seekBarProgressElement.style.width = `${Math.round(progress * 100)}%`

        this.positionTextElement.innerText =
            `${Utils.formatTime(this.videoElement.currentTime)} / ${Utils.formatTime(this.videoElement.duration)}`;
    }

    private updateVolumeControl() {
        if (!this.muteButtonElement || !this.volumeBarProgressElement) return;
        this.muteButtonElement.innerText = this.videoElement.muted ? "🔇" : "🔊";
        this.volumeBarProgressElement.style.width = `${Math.round(this.videoElement.volume * 100)}%`
    }

    //#endregion
}