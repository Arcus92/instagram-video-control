import { Utils } from "../shared/utils";
import { VideoType } from "./videoType";
import { PlaybackManager } from "./playbackManager";
import { Settings } from "../shared/settings";
import { VideoControlMode } from "../shared/videoControlMode";
import { VideoController } from "./controller/videoController";
import { NativeVideoController } from "./controller/nativeVideoController";
import { CustomVideoController } from "./controller/customVideoController";
import { VideoAutoplayMode } from "../shared/videoAutoplayMode";

// The custom video player for Instagram video tags.
export class VideoPlayer {

    // The playback manager to report events to.
    public readonly playbackManager: PlaybackManager;

    // The original video HTML element.
    public readonly videoElement: HTMLVideoElement;

    // Has the user already interacted with the video player?
    private userInteractedWithVideo: boolean = false;

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

        this.initHover();

        this.checkAutoplay();
        this.updateLoopSetting();
    }

    // Detaches the custom player from the video tag. Removes all custom element and events.
    public detach() {
        this.unregisterEvents();

        this.removeVideoControl();
    }

    //#region Events

    // Register all video events.
    private registerEvents() {

        this.videoElement.addEventListener("play", this.onPlay);
        this.videoElement.addEventListener("pause", this.onPause);
        this.videoElement.addEventListener("ended", this.onEnded);
        this.videoElement.addEventListener("timeupdate", this.onTimeUpdate);
        this.videoElement.addEventListener("volumechange", this.onVolumeChange);
        this.videoElement.addEventListener("ratechange", this.onRateChange);
        document.addEventListener("fullscreenchange", this.onFullscreenChange);
        this.videoElement.addEventListener("enterpictureinpicture", this.onPictureInPictureChange);
        this.videoElement.addEventListener("leavepictureinpicture", this.onPictureInPictureChange);
        this.videoRootElement?.addEventListener("mouseenter", this.onMouseEnter);
        this.videoRootElement?.addEventListener("mouseleave", this.onMouseLeave);
        this.nativeControlsElement?.addEventListener("click", this.onNativeControlClick);

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
        this.videoElement.removeEventListener("play", this.onPlay);
        this.videoElement.removeEventListener("pause", this.onPause);
        this.videoElement.removeEventListener("ended", this.onEnded);
        this.videoElement.removeEventListener("timeupdate", this.onTimeUpdate);
        this.videoElement.removeEventListener("volumechange", this.onVolumeChange);
        this.videoElement.removeEventListener("ratechange", this.onRateChange);
        document.removeEventListener("fullscreenchange", this.onFullscreenChange);
        this.videoElement.removeEventListener("enterpictureinpicture", this.onPictureInPictureChange);
        this.videoElement.removeEventListener("leavepictureinpicture", this.onPictureInPictureChange);
        this.videoRootElement?.removeEventListener("mouseenter", this.onMouseEnter);
        this.videoRootElement?.removeEventListener("mouseleave", this.onMouseLeave);
        this.nativeControlsElement?.removeEventListener("click", this.onNativeControlClick);
    }

    // Handles video play event.
    private onPlay = () => {
        this.videoController?.onPlay();

        this.playbackManager.notifyVideoPlay(this.videoElement);

        this.checkAutoplay();
    }

    // Handles video pause event.
    private onPause = () => {
        this.videoController?.onPause();

        // If not registered, the site will show a 'you need to log in to replay' banner.
        // This makes sure it is removed, so you regain control.
        setTimeout(() => {
            this.removeNotRegisteredOverlayElement();
        });
    }

    // Handles video end-of-playback event.
    private onEnded = () => {
        // Instagram handles the re-start on loops manually and ignores the `loop` property. We simply pause again.
        if (!this.videoElement.loop) {
            this.videoElement.pause();
        }
    }

    // Handles video time update event.
    private onTimeUpdate = () => {
        this.videoController?.onTimeUpdate();
    }

    // Handles video volume changes.
    private onVolumeChange = () => {
        this.videoController?.onVolumeChange();

        // We don't want to react to volume changes from the page itself.
        //if (!event.isTrusted) return;

        this.playbackManager.notifyVideoVolumeChange(this.videoElement);
    }

    // Handles video rate changes.
    private onRateChange = () => {
        this.videoController?.onRateChange();
    }

    // Handles fullscreen changes.
    private onFullscreenChange = () => {
        this.videoController?.onFullscreenChange();
    }

    // Handles Picture-in-Picture changes.
    private onPictureInPictureChange = () => {
        this.videoController?.onPictureInPictureChange();
    }

    // Mouse enters the player element.
    private onMouseEnter = () => {
        this.videoController?.setHover(true);
    }

    // Mouse leaves the player element.
    private onMouseLeave = () => {
        this.videoController?.setHover(false);
    }

    // Mouse clicked the native player element
    private onNativeControlClick = () => {
        if (this.userInteractedWithVideo) return;
        this.userInteractedWithVideo = true;

        // There is an issue with stopped playback and the Reel player. Instagram assumes that playback autostarts and
        // that the big play button is invisible on load.
        // On stopped playback the video is paused and need player interaction to start. The first click toggles video
        // playback and because Instagram assumes the video is already playing the video is stopped and the big play
        // button is shown again. A second click is required to start playback.
        // The following code bypasses the second click on the first interaction by just starting the video again.
        // This will make the play button quickly pop-in and pop-out, but it's the best we can do to make it seamless.
        if (this.videoElement.paused) {
            setTimeout(() => {
                this.videoElement.play().then();
            });

        }
    }

    //#endregion

    //#region Video

    // The video origin.
    public videoType: VideoType = VideoType.post;

    // Is the video on an embedded (iframe) page.
    public isEmbedded: boolean = false;

    // The native root element of the video area with all controls.
    public videoRootElement: HTMLElement | undefined;

    // The native Instagram overlay element.
    public overlayElement: HTMLElement | undefined;

    // The native Instagram control element.
    public nativeControlsElement: HTMLElement | undefined;

    // The native Instagram reply element for stories.
    public replyElement: HTMLElement | undefined;

    // The native clickable areas for mobile Story controls.
    public clickEventElement: HTMLElement | undefined;

    // The native mute button.
    public muteElement: HTMLElement | undefined;

    // The overlay elements used for Reels on mobile.
    public mobileOverlayElement: HTMLElement | undefined;


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
        this.nativeControlsElement = this.overlayElement?.firstChild as HTMLElement;

        this.replyElement = undefined;
        this.clickEventElement = undefined;

        // Navigate to the overlay buttons. They are five layers deep in the structure.
        // The overlay buttons are used for Stories in mobile mode. These are two hidden links that overlay the video.
        // If you click left you go to the previous Story element. If you click right you go to the next one.
        // These are only present in the mobile view (aka small screen width) mode. Otherwise, this element still
        // exists, but it is empty.
        const clickEventElement =
            Utils.elementParent(this.videoElement, 5)?.nextElementSibling;
        if (clickEventElement instanceof HTMLElement) {
            this.clickEventElement = clickEventElement;
        }

        // Navigate to the social buttons. They are seven layers deep in the structure.
        // Instagram added a new layer, so we need an additional `firstChild`.
        const socialElement =
            Utils.elementParent(this.videoElement, 7)?.nextElementSibling;

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
                this.replyElement = socialElement?.firstChild as HTMLElement;
            }
        }

        // Finds the native mute button in posts.
        if (this.nativeControlsElement) {
            // Normal posts have a simpler structure. All the different elements are on the first level.
            if (this.nativeControlsElement.childElementCount > 1) {

                // The position of the mute button can change. It is not always the second element.
                // But it is the first element that contains a <button> tag.
                // The second <button> tag is the marked accounts icon.
                for (const element of this.nativeControlsElement.children) {
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

        // Detect the mobile controls for Reels.
        const mobileOverlayElement =
            Utils.elementParent(this.videoElement, 4)?.nextElementSibling?.firstChild as HTMLElement;
        if (mobileOverlayElement) {
            this.mobileOverlayElement = mobileOverlayElement;
        }

        // Finds the video root element used for fullscreen.
        const videoRootElement =
            Utils.elementParent(this.videoElement, 1);
        if (videoRootElement instanceof HTMLElement) {
            this.videoRootElement = videoRootElement;
        }
    }

    // #endregion

    // #region Controls

    // The current created controller.
    private videoController: VideoController | undefined;

    // Creates the video controls.
    private createVideoControl() {
        switch (Settings.shared.videoControlMode) {
            case VideoControlMode.native:
                this.videoController = new NativeVideoController(this);
                break;
            case VideoControlMode.custom:
                this.videoController = new CustomVideoController(this);
                break;
        }
        this.videoController?.create();
    }

    // Removes the video controls
    private removeVideoControl() {
        if (!this.videoController) return;
        this.videoController.remove();
        this.videoController = undefined;
    }


    private removeNotRegisteredOverlayElement() {
        if (this.nativeControlsElement) {
            // The site adds an overlay still frame when playback ends and forces you to log in to re-watch.
            // We'll remove that.
            if (this.nativeControlsElement.firstChild instanceof HTMLImageElement) {
                const thumbnailElement = this.nativeControlsElement.firstChild;
                thumbnailElement.remove();
            }
        }
    }

    // Checks if the mouse already hovers over the video on initialization. Otherwise, the controls would only show up
    // when the mouse exits and enters again.
    private initHover() {
        if (!this.videoRootElement) return;
        const hover = this.videoRootElement.matches(':hover');
        this.videoController?.setHover(hover);
    }

    // Is called when any control setting was changed. We should update all dynamic controls.
    public updateControlSetting() {
        this.videoController?.onUpdateSettings();

        this.updateLoopSetting();
    }

    // Is called when the control mode was changed. This rebuilds the UI.
    public updateControlMode() {
        this.detach();
        this.attach();
    }

    // Checks the autoplay setting and pauses the video if needed.
    private checkAutoplay() {
        if (Settings.shared.autoplayMode === VideoAutoplayMode.stopped && !this.userInteractedWithVideo) {
            this.videoElement.pause();
            this.videoElement.currentTime = 0; // Jump back to start
            this.videoElement.muted = false; // Continue with audio
        }
    }

    // Updates the video's loop property from the settings.
    private updateLoopSetting() {
        this.videoElement.loop = Settings.shared.loopPlayback;
    }

    //#endregion Controls
}
