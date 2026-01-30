import { VideoControllerElementBase } from './videoControllerElement';

export abstract class VideoControllerButton extends VideoControllerElementBase<HTMLButtonElement> {
    override onCreate(parentElement: HTMLElement): void {
        this.element = document.createElement('button');
        this.element.classList.add('ivc-control-element', 'ivc-icon-button');
        this.element.appendChild(document.createElement('img'));
        parentElement.appendChild(this.element);

        this.element.onclick = (ev: MouseEvent) => {
            this.onClick(ev);
        };
    }

    // The button was clicked
    protected abstract onClick(ev: MouseEvent): void;

    // Changes the icon of the button.
    protected setIcon(url: string) {
        if (!this.element) return;
        const img = this.element.firstChild as HTMLImageElement;
        if (!img) return;
        img.src = url;
    }
}
