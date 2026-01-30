import { VideoControllerButton } from './videoControllerButton';

export abstract class VideoControllerDropDownButton<
    T extends string | number | symbol,
> extends VideoControllerButton {
    private dropDownElement: HTMLUListElement | undefined;
    private readonly dropDownItemElement = new Map<T, HTMLLIElement>();

    override onCreate(parentElement: HTMLElement) {
        super.onCreate(parentElement);
        if (!this.element) return;

        this.dropDownElement = document.createElement('ul');
        this.dropDownElement.classList.add('ivc-control-dropdown', 'hidden');
        this.element.appendChild(this.dropDownElement);

        this.element.onpointerdown = () => {
            this.setDropDownVisibility(true);
        };
        this.element.onmouseenter = () => {
            this.setDropDownVisibility(true);
        };
        this.element.onmouseleave = () => {
            this.setDropDownVisibility(false);
        };
    }

    // Clears all drop-down items.
    protected clearItems() {
        if (!this.dropDownElement) return;

        for (const element of this.dropDownItemElement.values()) {
            this.dropDownElement.removeChild(element);
        }
        this.dropDownItemElement.clear();
    }

    // Adds a new drop-down item.
    protected addItem(value: T, label: string) {
        if (!this.dropDownElement) return;

        const element = document.createElement('li');
        element.textContent = label;
        this.dropDownElement.appendChild(element);

        // Update the layout
        element.classList.toggle('active', value === this.selectedItem);

        element.onpointerdown = (ev) => {
            ev.stopPropagation();

            this.setSelectedItem(value);
            this.onItemChange(value);
        };

        this.dropDownItemElement.set(value, element);
    }

    private selectedItem: T | undefined;

    // Sets the selected item value and updates the ui.
    protected setSelectedItem(selectedItem: T | undefined) {
        this.selectedItem = selectedItem;
        for (const [value, element] of this.dropDownItemElement) {
            element.classList.toggle('active', value === selectedItem);
        }
    }

    // A new drop-down item was clicked.
    protected abstract onItemChange(value: T): void;

    override onClick() {}

    private dropDownDelayTimeout: number = -1;

    // Sets the drop-down visibility.
    protected setDropDownVisibility(visibility: boolean) {
        if (!this.dropDownElement) return;

        if (visibility) {
            clearTimeout(this.dropDownDelayTimeout);
            this.dropDownElement.classList.toggle('hidden', false);
        } else {
            this.dropDownDelayTimeout = setTimeout(() => {
                if (!this.dropDownElement) return;
                this.dropDownElement.classList.toggle('hidden', true);
            }, 400);
        }
    }
}
