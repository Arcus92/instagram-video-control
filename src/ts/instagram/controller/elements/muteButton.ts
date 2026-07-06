import { VideoControllerButton } from './videoControllerButton';
import { Resources } from '../../resources';

export class MuteButton extends VideoControllerButton {
    override updateControl() {
        this.setIcon(
            this.videoElement?.muted
                ? Resources.shared.urls.images.speakerOff
                : Resources.shared.urls.images.speakerOn
        );
    }

    override onClick() {
        if (!this.videoElement) return;
        this.videoElement.muted = !this.videoElement.muted;

        // Fallback when volume is still set to zero
        if (!this.videoElement.muted && this.videoElement.volume === 0) {
            this.videoElement.volume = 0.1;
        }
    }

    override onVolumeChange() {
        this.updateControl();
    }
}
