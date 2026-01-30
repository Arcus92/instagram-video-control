import { VideoControllerSlider } from './videoControllerSlider';

export class SeekBar extends VideoControllerSlider {
    override onCreate(parentElement: HTMLElement) {
        super.onCreate(parentElement);

        if (!this.element) return;
        this.element.classList.add('ivc-seek-bar');
    }

    override updateControl() {
        if (!this.videoElement) return;

        // Ignore updates if the user is dragging the bar
        if (this.isDragging) return;
        const progress =
            this.videoElement.currentTime / this.videoElement.duration;
        this.setValue(progress);
    }

    override onValueChange(value: number): void {
        if (!this.videoElement) return;
        this.videoElement.currentTime = value * this.videoElement.duration;
    }

    override onTimeUpdate() {
        this.updateControl();
    }
}
