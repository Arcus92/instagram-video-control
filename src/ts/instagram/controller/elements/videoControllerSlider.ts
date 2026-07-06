import { VideoControllerElementBase } from './videoControllerElement';

export abstract class VideoControllerSlider extends VideoControllerElementBase<HTMLDivElement> {
    // The background element of the slider
    protected backgroundElement?: HTMLDivElement;

    // The progress element of the slider
    protected progressElement?: HTMLDivElement;

    override onCreate(parentElement: HTMLElement): void {
        this.element = document.createElement('div');
        this.element.classList.add('ivc-control-element', 'ivc-control-bar');
        parentElement.appendChild(this.element);

        this.backgroundElement = document.createElement('div');
        this.backgroundElement.classList.add('ivc-control-bar-background');
        this.element.appendChild(this.backgroundElement);

        this.progressElement = document.createElement('div');
        this.progressElement.classList.add('ivc-control-bar-progress');
        this.backgroundElement.appendChild(this.progressElement);

        // Handle click event

        this.element.addEventListener('click', (ev) => {
            this.handleClick(ev, true);
        });

        // Handle drag event

        this.element.addEventListener('mousedown', () => this.onDragStart());
        this.element.addEventListener('touchstart', () => this.onDragStart());

        this.element.addEventListener('mousemove', (ev) => this.onDrag(ev));
        this.element.addEventListener('touchmove', (ev) => this.onDrag(ev));

        this.element.addEventListener('mouseup', (ev) => this.onDragEnd(ev));
        this.element.addEventListener('touchend', (ev) => this.onDragEnd(ev));
        this.element.addEventListener('mouseleave', (ev) => this.onDragEnd(ev));
    }

    // Sets the value of the bar.
    protected setValue(value: number) {
        if (!this.progressElement) return;
        this.progressElement.style.width = `${Math.round(value * 100)}%`;
    }

    // Is called when the value of the bar is changed by the user.
    abstract onValueChange(value: number): void;

    // Sub function to submit the current bar value
    private handleClick(event: MouseEvent | TouchEvent, invoke: boolean) {
        if (!this.backgroundElement || !this.progressElement) return;
        const rect = this.backgroundElement.getBoundingClientRect();

        const clientX =
            event instanceof MouseEvent
                ? event.clientX
                : event.changedTouches[0].clientX;
        const relativeX = clientX - rect.left;
        const value = Math.max(Math.min(relativeX / rect.width, 1), 0);

        this.setValue(value);

        if (invoke) this.onValueChange(value);
    }

    // The user is dragging the slider
    protected isDragging = false;

    // Is set onValueChange will be called on every drag event
    protected invokeOnDrag = false;

    private onDragStart() {
        this.isDragging = true;
    }

    private onDragEnd(ev: MouseEvent | TouchEvent) {
        if (!this.isDragging) return;
        this.handleClick(ev, true);
        this.isDragging = false;
    }

    private onDrag(ev: MouseEvent | TouchEvent) {
        if (!this.isDragging) return;
        this.handleClick(ev, this.invokeOnDrag);
    }
}
