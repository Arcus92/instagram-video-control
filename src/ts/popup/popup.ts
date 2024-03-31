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

    // The option to enable/disable the fullscreen button.
    private optionShowFullscreenElement: HTMLInputElement | undefined;

    // Finds all setting controls, sets up the values and events.
    private initSettingControls() {
        // Fullscreen option
        this.optionShowFullscreenElement = document.querySelector('input[name="option_show_fullscreen"]') as HTMLInputElement;
        if (this.optionShowFullscreenElement) {
            this.optionShowFullscreenElement.addEventListener('change', () => {
                if (this.optionShowFullscreenElement) {
                    this.settings.showFullscreenButton = this.optionShowFullscreenElement.checked;
                }
            });
        }

        // Update the initial values.
        this.updateSettingValues();

        // Listen for future setting changes.
        this.settings.changed.subscribe(() => {
            this.updateSettingValues();
        });
    }

    // Applies the settings values to the controls.
    private updateSettingValues() {
        if (this.optionShowFullscreenElement) {
            this.optionShowFullscreenElement.checked = this.settings.showFullscreenButton;
        }
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