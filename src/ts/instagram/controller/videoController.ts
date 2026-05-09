import { VideoPlayer } from '../videoPlayer';
import { VideoType } from '../videoType';
import { Settings } from '../../shared/settings';

// Base class for video the different controllers.
export abstract class VideoController {
    public constructor(videoPlayer: VideoPlayer) {
        this.videoPlayer = videoPlayer;
    }

    // The video player.
    protected readonly videoPlayer: VideoPlayer;

    // Shortcut to the video element.
    protected get videoElement(): HTMLVideoElement | undefined {
        return this.videoPlayer.videoElementRef?.deref();
    }

    //#region Control

    // Creates the video controller.
    public abstract create(): void;

    // The main control background element.
    protected videoControlElement: HTMLElement | undefined;

    // Create the control background.
    protected createVideoControlBackground() {
        const videoRootElement = this.videoPlayer.videoRootElementRef?.deref();
        if (!videoRootElement) return;

        this.videoControlElement = document.createElement('div');
        this.videoControlElement.classList.add('ivc-controls');
        if (this.videoPlayer.videoType === VideoType.reel) {
            this.videoControlElement.classList.add('ivc-reel');
        }
        if (this.videoPlayer.videoType === VideoType.story) {
            this.videoControlElement.classList.add('ivc-story');
        }
        videoRootElement.appendChild(this.videoControlElement);
    }

    // Adjust the control bar height for the background and all native elements.
    protected adjustVideoControlHeight(controlHeight: number) {
        // Removes the height of the controls from the inner overlay to not block mouse clicks.

        // Adjusting the controller background.
        if (this.videoControlElement) {
            this.videoControlElement.style.height = `${controlHeight}px`;
        }

        // Adjust the overlay margin
        const nativeOverlayElement =
            this.videoPlayer.nativeOverlayElementRef?.deref();
        if (nativeOverlayElement) {
            nativeOverlayElement.style.bottom = `${controlHeight}px`;
        }

        // Hide the native mute button.
        const nativeVolumeControlElement =
            this.videoPlayer.nativeVolumeControlElementRef?.deref();
        if (nativeVolumeControlElement) {
            nativeVolumeControlElement.style.display = 'none';
        }
    }

    // Removes the video controls
    public remove() {
        if (!this.videoElement) return;

        // Remove controls
        this.videoElement.controls = false;

        if (this.videoControlElement) {
            this.videoControlElement.remove();
            this.videoControlElement = undefined;
        }

        // Resets the overlay margins
        const nativeOverlayElement =
            this.videoPlayer.nativeOverlayElementRef?.deref();
        if (nativeOverlayElement) {
            nativeOverlayElement.style.bottom = '';
        }

        // Restore original mute button
        const nativeVolumeControlElement =
            this.videoPlayer.nativeVolumeControlElementRef?.deref();
        if (nativeVolumeControlElement) {
            nativeVolumeControlElement.style.display = '';
        }
    }

    //#endregion Control

    //#region Events

    public abstract onPlay(): void;
    public abstract onPause(): void;
    public abstract onTimeUpdate(): void;
    public abstract onVolumeChange(): void;
    public abstract onPlaybackSpeedChange(): void;
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

    // Sets the control visibility.
    protected abstract setVisibility(visibility: boolean): void;

    //#endregion Hover

    //#region Utils

    // Changes the visibility of a control element.
    public static setElementVisibility(element: HTMLElement, visible: boolean) {
        element.style.display = visible ? 'block' : 'none';
    }

    //#endregion Utils
}
