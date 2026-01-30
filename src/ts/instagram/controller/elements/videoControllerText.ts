import { VideoControllerElementBase } from './videoControllerElement';

export abstract class VideoControllerText extends VideoControllerElementBase<HTMLDivElement> {
    // Changes the text.
    protected setText(text: string) {
        if (!this.element) return;
        this.element.innerText = text;
    }

    override onCreate(parentElement: HTMLElement): void {
        this.element = document.createElement('div');
        this.element.classList.add('ivc-control-element', 'ivc-control-text');
        parentElement.appendChild(this.element);

        this.updateControl();
    }
}
