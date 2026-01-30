import { VideoControllerText } from './videoControllerText';
import { Utils } from '../../../shared/utils';

export class PositionText extends VideoControllerText {
    override updateControl(): void {
        if (!this.videoElement) return;
        this.setText(
            `${Utils.formatTime(this.videoElement.currentTime)} / ${Utils.formatTime(this.videoElement.duration)}`
        );
    }

    override onTimeUpdate() {
        this.updateControl();
    }
}
