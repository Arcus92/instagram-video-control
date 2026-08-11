import { VideoControllerButton } from './videoControllerButton';
import { Resources } from '../../resources';

export class FullscreenButton extends VideoControllerButton {
    override updateControl() {
        const isFullscreen = !!document.fullscreenElement;
        this.setIcon(
            isFullscreen
                ? Resources.shared.urls.images.fullscreenExit
                : Resources.shared.urls.images.fullscreenEnter
        );
        this.setTitle(
            isFullscreen
                ? Resources.shared.locales.leaveFullscreenTooltip
                : Resources.shared.locales.enterFullscreenTooltip
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
