export interface IEventDispatcher<T> {
    subscribe(handler: { (data: T): void }): void;
    unsubscribe(handler: { (data: T): void }): void;
}

// A very simple implementation for a custom event dispatcher.
export class EventDispatcher<T> implements IEventDispatcher<T> {
    // The registered event handlers.
    private readonly handlers: { (data: T): void }[] = [];

    // Subscribe to the event.
    public subscribe(handler: { (data: T): void }) {
        this.handlers.push(handler);
    }

    // Unsubscribe from the event.
    public unsubscribe(handler: { (data: T): void }) {
        const index = this.handlers.indexOf(handler);
        if (index < 0) return;
        this.handlers.splice(index, 1);
    }

    // Invokes all registered handlers.
    public invoke(data: T) {
        for (const handler of this.handlers) {
            handler(data);
        }
    }
}
