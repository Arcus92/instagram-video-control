import { VideoControllerButton } from './videoControllerButton';
import { Resources } from '../../resources';

export class PlayButton extends VideoControllerButton {
    override updateControl() {
        this.setIcon(
            this.videoElement?.paused
                ? Resources.shared.urls.images.play
                : Resources.shared.urls.images.pause
        );
    }

    override onClick() {
        if (!this.videoElement) return;

        // Tell the player that the user stated playback in case auto-playback is disabled.
        if (this.videoPlayer) {
            this.videoPlayer.setUserInteractedWithVideo();
        }

        if (this.videoElement.paused) {
            this.videoElement.play().then();
        } else {
            this.videoElement.pause();
        }
    }

    override onPause() {
        this.updateControl();
    }

    override onPlay() {
        this.updateControl();
    }
}
