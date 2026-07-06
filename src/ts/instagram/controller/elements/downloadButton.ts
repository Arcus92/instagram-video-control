import { VideoControllerButton } from './videoControllerButton';
import { Resources } from '../../resources';

export class DownloadButton extends VideoControllerButton {
    override updateControl() {
        this.setIcon(Resources.shared.urls.images.download);
    }

    override onClick() {
        const polarisFiber = this.videoPlayer?.polarisFiber;
        if (!polarisFiber) return;

        const props = polarisFiber?.memoizedProps;
        if (!props || typeof props !== 'object') return;
        const hdSrc = 'hdSrc' in props ? (props.hdSrc as string) : undefined;
        if (!hdSrc) return;

        this.startDownloadFromUrl(hdSrc).then();
    }

    async startDownloadFromUrl(url: string): Promise<void> {
        try {
            const result = await fetch(url);
            const blob = await result.blob();

            const blobUrl = window.URL.createObjectURL(blob);

            // Create an a-tag to trigger a download event
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = 'instagram-download'; // The browser will take care of the extension
            document.body.appendChild(a);

            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (ex) {
            console.error(
                '[VideoControlInstagram] Unable to download video from url',
                url,
                ex
            );
            return;
        }
    }

    override onPictureInPictureChange() {
        this.updateControl();
    }
}
