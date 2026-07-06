import { VideoControllerButton } from './videoControllerButton';
import { Resources } from '../../resources';

export class PictureInPictureButton extends VideoControllerButton {
    override updateControl() {
        this.setIcon(
            document.pictureInPictureElement
                ? Resources.shared.urls.images.pictureInPictureExit
                : Resources.shared.urls.images.pictureInPictureEnter
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
