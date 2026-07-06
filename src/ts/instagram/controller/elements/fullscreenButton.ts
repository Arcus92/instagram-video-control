import { VideoControllerButton } from './videoControllerButton';
import { Resources } from '../../resources';

export class FullscreenButton extends VideoControllerButton {
    override updateControl() {
        this.setIcon(
            document.fullscreenElement
                ? Resources.shared.urls.images.fullscreenExit
                : Resources.shared.urls.images.fullscreenEnter
        );
    }

    override onClick() {
        const videoRootElement = this.videoPlayer?.videoRootElementRef?.deref();
        if (!videoRootElement) return;

        // Toggle fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen().then();
        } else {
            videoRootElement.requestFullscreen().then();
        }
    }

    override onPictureInPictureChange() {
        this.updateControl();
    }
}
