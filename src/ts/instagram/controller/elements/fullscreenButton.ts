import { VideoControllerButton } from './videoControllerButton';
import { Resources } from '../resources';

export class FullscreenButton extends VideoControllerButton {
    override updateControl() {
        this.setIcon(
            document.fullscreenElement
                ? Resources.imageFullscreenExit
                : Resources.imageFullscreenEnter
        );
    }

    override onClick() {
        if (!this.videoPlayer?.videoRootElement) return;

        // Toggle fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen().then();
        } else {
            this.videoPlayer.videoRootElement.requestFullscreen().then();
        }
    }

    override onPictureInPictureChange() {
        this.updateControl();
    }
}
