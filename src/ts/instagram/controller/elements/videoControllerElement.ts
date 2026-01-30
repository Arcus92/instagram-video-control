// Base class for video controller elements like buttons and bars
import { CustomVideoController } from '../customVideoController';
import { VideoPlayer } from '../../videoPlayer';

export abstract class VideoControllerElement {
    // The parent video controller
    private videoController?: CustomVideoController;

    // Shortcut to the video player
    protected get videoPlayer(): VideoPlayer | undefined {
        return this.videoController?.videoPlayer;
    }

    // Shortcut to the video element
    protected get videoElement(): HTMLVideoElement | undefined {
        return this.videoController?.videoElement;
    }

    public constructor(videoController: CustomVideoController) {
        this.videoController = videoController;
    }

    // Creates the controller element
    public create(parentElement: HTMLElement) {
        this.onCreate(parentElement);
        this.updateControl();
    }

    // Abstract creation method
    protected abstract onCreate(parentElement: HTMLElement): void;

    // Removes the created element again
    public abstract remove(): void;

    // Updates the control element
    protected abstract updateControl(): void;

    // Changes the visibility of the control
    public abstract setVisibility(visible: boolean): void;

    // #region Events

    public onPlay() {}
    public onPause() {}
    public onTimeUpdate() {}
    public onVolumeChange() {}
    public onPlaybackSpeedChange() {}
    public onFullscreenChange() {}
    public onPictureInPictureChange() {}

    // #endregion Events
}

export abstract class VideoControllerElementBase<
    T extends HTMLElement,
> extends VideoControllerElement {
    protected element?: T;

    // Removes the created element again
    public override remove() {
        if (!this.element) return;
        this.element.remove();
    }

    // Changes the visibility of the text.
    public override setVisibility(visible: boolean) {
        if (!this.element) return;
        this.element.style.display = visible ? 'block' : 'none';
    }
}
