import { Resources } from '../resources';
import { VideoControllerDropDownButton } from './videoControllerDropDownButton';

export class PlaybackSpeedButton extends VideoControllerDropDownButton<number> {
    private readonly playbackSpeeds = [
        0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0,
    ];

    override create(parentElement: HTMLElement) {
        super.create(parentElement);

        this.clearItems();
        for (const speed of this.playbackSpeeds) {
            this.addItem(speed, `${speed}x`);
        }
    }

    protected onItemChange(value: number): void {
        if (!this.videoElement) return;

        this.videoElement.playbackRate = value;
    }

    override updateControl() {
        this.setIcon(Resources.imagePlaybackSpeed);

        this.setSelectedItem(this.videoElement?.playbackRate);
    }

    override onPlaybackSpeedChange() {
        this.updateControl();
    }
}
