import {Browser} from "../shared/browser";
import {Settings} from "../shared/settings";

// Code class for the settings menu in the extension icon.
export class Popup {

    // The extension settings.
    private readonly settings = Settings.shared;

    // Initialize the settings popup.
    public async init() {
        this.replaceLocaleTags();

        // Loads the settings.
        await this.settings.init();

        this.initSettingControls();
    }

    // Finds all setting controls, sets up the values and events.
    private initSettingControls() {
        // Time code option
        this.initSettingControl('option_show_time_code',
            (e) => this.settings.showTimeCodeText = e.checked,
            (e) => e.checked = this.settings.showTimeCodeText);

        // Fullscreen option
        this.initSettingControl('option_show_fullscreen',
            (e) => this.settings.showFullscreenButton = e.checked,
            (e) => e.checked = this.settings.showFullscreenButton);
    }

    // Generic handler for setting changes.
    private initSettingControl(name: string,
                               store: (e: HTMLInputElement) => void,
                               restore: (e: HTMLInputElement) => void) {
        const element = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
        if (!element) return;

        // Handling the control updates
        element.addEventListener('change', () => {
            if (element) {
                store(element);
            }
        });

        // Listen for future setting changes.
        this.settings.changed.subscribe(() => {
            if (element) {
                restore(element);
            }
        });

        // Init default value
        restore(element);
    }


    // Replaces the content of all tags like `<span data-locale="test"></span>` with translated locale text.
    private replaceLocaleTags() {
        const elements = document.querySelectorAll('[data-locale]');
        if (!elements) return;
        for (const element of elements) {
            if (!(element instanceof HTMLElement)) continue;

            const locale = element.dataset.locale;
            if (!locale) continue;

            element.innerText = this.translate(locale)
        }
    }

    // Translates the locale into a text.
    private translate(locale: string): string {
        switch (locale) {
            // Build in variables.
            case '__name__':
                return Browser.getManifest().name;
            case '__version__':
                return Browser.getManifest().version;

            // Try to translate other locales.
            default:
                return Browser.i18n.getMessage(locale) ?? locale;
        }
    }
}