import { VideoControllerButton } from './videoControllerButton';
import { Resources } from '../resources';

export class PictureInPictureButton extends VideoControllerButton {
    override updateControl() {
        this.setIcon(
            document.pictureInPictureElement
                ? Resources.imagePictureInPictureExit
                : Resources.imagePictureInPictureEnter
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
