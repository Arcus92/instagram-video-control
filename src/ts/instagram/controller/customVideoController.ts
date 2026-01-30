import { VideoController } from './videoController';
import { VideoControllerElement } from './elements/videoControllerElement';
import { PlayButton } from './elements/playButton';
import { MuteButton } from './elements/muteButton';
import { PictureInPictureButton } from './elements/pictureInPictureButton';
import { FullscreenButton } from './elements/fullscreenButton';
import { PositionText } from './elements/positionText';
import { PlaybackSpeedButton } from './elements/playbackSpeedButton';
import { VolumeBar } from './elements/volumeBar';
import { SeekBar } from './elements/seekBar';
import { Settings } from '../../shared/settings';

// The custom video controller.
export class CustomVideoController extends VideoController {
    //#region Control

    // The parent element for the control items.
    private controlElement: HTMLElement | undefined;

    // The control elements.
    private controls: VideoControllerElement[] = [];

    /**
     * Create the video controls.
     */
    public create() {
        if (!this.videoPlayer.overlayElement) return;
        const controlHeight = 32;

        this.createVideoControlBackground();
        this.adjustVideoControlHeight(controlHeight);

        // Creating the actual player...
        if (!this.videoControlElement) return;

        this.controlElement = document.createElement('div');
        this.controlElement.classList.add('ivc-controls-content');
        this.videoControlElement.appendChild(this.controlElement);

        this.rebuildControlElements();

        // Init update
        this.updateControlBarVisibility();
    }

    /**
     * Recreates the control elements.
     */
    private rebuildControlElements() {
        if (!this.controlElement) return;

        // Remove previous controls
        for (const control of this.controls) {
            control.remove();
        }

        this.controls = this.getActiveControlElements();

        // Create the control elements
        for (const control of this.controls) {
            control.create(this.controlElement);
        }
    }

    /**
     * Build the list of controls to spawn in the UI from the settings.
     */
    private getActiveControlElements(): VideoControllerElement[] {
        const settings = Settings.shared;
        const controls = [];

        controls.push(new PlayButton(this));
        controls.push(new MuteButton(this));
        controls.push(new VolumeBar(this));
        if (settings.showTimeCodeText) {
            controls.push(new PositionText(this));
        }
        controls.push(new SeekBar(this));
        if (settings.showPlaybackSpeedOption) {
            controls.push(new PlaybackSpeedButton(this));
        }
        if (
            document.pictureInPictureEnabled &&
            settings.showPictureInPictureButton
        ) {
            controls.push(new PictureInPictureButton(this));
        }
        if (document.fullscreenEnabled && settings.showFullscreenButton) {
            controls.push(new FullscreenButton(this));
        }

        return controls;
    }

    //#endregion Control

    //#region Events

    public override onPlay() {
        for (const control of this.controls) {
            control.onPlay();
        }
    }
    public override onPause() {
        for (const control of this.controls) {
            control.onPause();
        }
    }
    public override onTimeUpdate() {
        for (const control of this.controls) {
            control.onTimeUpdate();
        }
    }
    public override onVolumeChange() {
        for (const control of this.controls) {
            control.onVolumeChange();
        }
    }
    public override onPlaybackSpeedChange() {
        for (const control of this.controls) {
            control.onPlaybackSpeedChange();
        }
    }
    public override onFullscreenChange() {
        for (const control of this.controls) {
            control.onFullscreenChange();
        }
    }
    public override onPictureInPictureChange() {
        for (const control of this.controls) {
            control.onPictureInPictureChange();
        }
    }
    public onUpdateSettings() {
        this.rebuildControlElements();
        this.updateControlBarVisibility();
    }

    //#endregion Events

    //#region Update

    protected setVisibility(visibility: boolean) {
        if (!this.videoControlElement) return;
        this.videoControlElement.classList.toggle('hidden', !visibility);
    }

    //#endregion Update
}
