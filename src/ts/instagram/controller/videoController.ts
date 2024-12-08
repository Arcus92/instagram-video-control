import {VideoPlayer} from "../videoPlayer";
import {VideoType} from "../videoType";
import {Settings} from "../../shared/settings";

// Base class for video the different controllers.
export abstract class VideoController {

    public constructor(videoPlayer: VideoPlayer) {
        this.videoPlayer = videoPlayer;
    }

    // The video player.
    protected readonly videoPlayer: VideoPlayer;

    // Shortcut to the video element.
    protected get videoElement(): HTMLVideoElement {
        return this.videoPlayer.videoElement;
    }


    //#region Control

    // Creates the video controller.
    public abstract create(): void;

    // The main control background element.
    protected videoControlElement: HTMLElement | undefined;

    // Create the control background.
    protected createVideoControlBackground() {
        if (!this.videoPlayer.overlayElement) return;

        this.videoControlElement = document.createElement("div");
        this.videoControlElement.classList.add("ivc-controls");
        if (this.videoPlayer.videoType === VideoType.reel) {
            this.videoControlElement.classList.add("ivc-reel");
        }
        if (this.videoPlayer.videoType === VideoType.story) {
            this.videoControlElement.classList.add("ivc-story");
        }
        this.videoPlayer.overlayElement.appendChild(this.videoControlElement);
    }

    // Adjust the control bar height for the background and all native elements.
    protected adjustVideoControlHeight(controlHeight: number) {
        if (!this.videoPlayer.overlayElement) return;

        // Removes the height of the controls from the inner overlay to not block mouse clicks.
        if (this.videoPlayer.overlayElement.firstChild instanceof HTMLElement) {
            this.videoPlayer.overlayElement.firstChild.style.height = `calc(100% - ${controlHeight}px)`;
        }

        // For Stories, we also add a margin to the reply element to not overlay the controls.
        if (this.videoPlayer.replyElement) {
            // The social controls in mobile Stories are placed below the post and don't overlap by default.
            if (this.videoPlayer.videoType !== VideoType.mobileStory) {
                this.videoPlayer.replyElement.style.marginBottom = `${controlHeight}px`;
            }
        }

        // For Reels on mobile, these are different elements with absolut position.
        if (this.videoPlayer.mobileOverlayElement) {
            this.videoPlayer.mobileOverlayElement.style.bottom = `${controlHeight}px`;
        }

        // If clickable overlays are used, we want to add a margin, so we can interact with our controls without
        // activating the overlay buttons.
        if (this.videoPlayer.clickEventElement) {
            this.videoPlayer.clickEventElement.style.marginBottom = `${controlHeight}px`;
        }

        // Hide the native mute button.
        if (this.videoPlayer.muteElement) {
            this.videoPlayer.muteElement.style.display = 'none';
        }

        // Adjusting the controller background.
        if (this.videoControlElement) {
            this.videoControlElement.style.height = `${controlHeight}px`;
        }
    }

    // Removes the video controls
    public remove() {

        // Remove controls
        this.videoElement.controls = false;

        // Restore overlay margin
        if (this.videoPlayer.overlayElement && this.videoPlayer.overlayElement.firstChild instanceof HTMLElement) {
            this.videoPlayer.overlayElement.firstChild.style.height = '';
        }

        // Restore reply controls
        if (this.videoPlayer.replyElement) {
            this.videoPlayer.replyElement.style.marginBottom = '';
        }

        // Restore Reels controls
        if (this.videoPlayer.mobileOverlayElement) {
            this.videoPlayer.mobileOverlayElement.style.bottom = '';
        }

        // Restore click handler
        if (this.videoPlayer.clickEventElement) {
            this.videoPlayer.clickEventElement.style.marginBottom = '';
        }

        // Restore original mute button
        if (this.videoPlayer.muteElement) {
            this.videoPlayer.muteElement.style.display = '';
        }

        if (this.videoControlElement) {
            this.videoControlElement.remove();
            this.videoControlElement = undefined;
        }
    }

    //#endregion Control

    //#region Events

    public abstract onPlay(): void;
    public abstract onPause(): void;
    public abstract onTimeUpdate(): void;
    public abstract onVolumeChange(): void;
    public abstract onFullscreenChange(): void;
    public abstract onPictureInPictureChange(): void;

    // The extension settings were changed.
    public abstract onUpdateSettings(): void;

    //#endregion Events

    //#region Hover

    // Mouse is hovering the player element.
    private hover: boolean = false;

    public setHover(hover: boolean) {
        this.hover = hover;
        this.updateControlBarVisibility();
    }

    protected updateControlBarVisibility() {
        const visibility = !Settings.shared.autoHideControlBar || this.hover;
        this.setVisibility(visibility);
    }

    // Sets the controls visibility.
    protected abstract setVisibility(visibility: boolean): void;

    //#endregion Hover

    //#region Utils

    // Changes the visibility of a control element.
    public static setElementVisibility(element: HTMLElement, visible: boolean) {
        element.style.display = visible ? 'block' : 'none';
    }

    //#endregion Utils
}
