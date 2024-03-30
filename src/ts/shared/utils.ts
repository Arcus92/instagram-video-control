export class Utils {

    // Disables all events for the given element by stop propagation.
    public static disableAllEventListeners(element: HTMLElement | Document, type: string) {
        // There is no way to remove event handlers, so we add an aggressive event, that stops propagation.
        element.addEventListener(type, (event) => {
            event.stopImmediatePropagation();
        }, true);
    }

    // Returns a readable timestamp a format like "m:ss".
    public static formatTime(totalSeconds: number): string {
        if (isNaN(totalSeconds)) return '0:00';

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds - minutes * 60);

        return `${minutes}:${seconds >= 10 ? seconds : '0' + seconds}`;
    }

    // Returns the n-th parent of the given element.
    public static elementParent(element: HTMLElement, layers: number = 1): HTMLElement | undefined {
        for (let i=0; i<layers; i++) {
            if (!(element.parentElement instanceof HTMLElement)) return undefined;
            element = element.parentElement;
        }
        return element;
    }
}