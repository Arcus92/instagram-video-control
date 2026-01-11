import {VideoController} from "./videoController";

// The native browser video controller.
export class NativeVideoController extends VideoController {

    //#region Control

    public create() {
        if (!this.videoPlayer.overlayElement) return;

        // The controls in Chrome are higher than in Firefox.
        const controlHeight = window.chrome ? 70 : 40;

        this.createVideoControlBackground();
        this.adjustVideoControlHeight(controlHeight);
        this.updateControlBarVisibility();
    }

    //#endregion Control

    //#region Events

    public override onPlay() {}
    public override onPause() {}
    public override onTimeUpdate() {}
    public override onVolumeChange() {}
    public override onPlaybackSpeedChange() {}
    public override onFullscreenChange() {}
    public override onPictureInPictureChange() {}

    public onUpdateSettings() {
        this.updateControlBarVisibility();
    }

    protected setVisibility(visibility: boolean) {
        if (!this.videoElement) return;
        this.videoElement.controls = visibility;
    }

    //#endregion Events
}
