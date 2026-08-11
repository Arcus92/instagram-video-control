import { VideoControllerButton } from './videoControllerButton';
import { Resources } from '../../resources';

export class PictureInPictureButton extends VideoControllerButton {
    override updateControl() {
        const isPictureInPicture = !!document.pictureInPictureElement;
        this.setIcon(
            isPictureInPicture
                ? Resources.shared.urls.images.pictureInPictureExit
                : Resources.shared.urls.images.pictureInPictureEnter
        );
        this.setTitle(
            isPictureInPicture
                ? Resources.shared.locales.leavePictureInPictureTooltip
                : Resources.shared.locales.enterPictureInPictureTooltip
        );
    }

    override onClick() {
        if (!this.videoElement) return;

        if (document.pictureInPictureElement) {
            document.exitPictureInPicture().then();
        } else {
            this.videoElement.requestPictureInPicture().then();
        }
    }

    override onPictureInPictureChange() {
        this.updateControl();
    }
}
