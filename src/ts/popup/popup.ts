import {Browser} from "../shared/browser";
import {Settings} from "../shared/settings";
import {VideoControlMode} from "../shared/videoControlMode";

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
        // Video control mode
        this.initSettingSelectElement('option_video_control_mode',
            (e) => this.settings.videoControlMode = e.value as VideoControlMode,
            (e) => e.value = this.settings.videoControlMode);

        // Time code option
        this.initSettingInputElement('option_show_time_code',
            (e) => this.settings.showTimeCodeText = e.checked,
            (e) => e.checked = this.settings.showTimeCodeText);

        // Fullscreen option
        if (Browser.isFullscreenSupported) {
            this.initSettingInputElement('option_show_fullscreen',
                (e) => this.settings.showFullscreenButton = e.checked,
                (e) => e.checked = this.settings.showFullscreenButton);
        } else {
            // Hide the setting if not supported.
            this.hideSettingControl('option_show_fullscreen');
        }

        // Picture-in-Picture option
        if (Browser.isPictureInPictureSupported) {
            this.initSettingInputElement('option_show_picture_in_picture',
                (e) => this.settings.showPictureInPictureButton = e.checked,
                (e) => e.checked = this.settings.showPictureInPictureButton);
        } else {
            // Hide the setting if not supported.
            this.hideSettingControl('option_show_picture_in_picture');
        }
    }

    // Handler for setting changes of input elements.
    private initSettingInputElement(name: string,
                                    store: (e: HTMLInputElement) => void,
                                    restore: (e: HTMLInputElement) => void) {
        this.initSettingElement<HTMLInputElement>(`input[name="${name}"]`, store, restore);
    }

    // Handler for setting changes of select elements.
    private initSettingSelectElement(name: string,
                                    store: (e: HTMLSelectElement) => void,
                                    restore: (e: HTMLSelectElement) => void) {
        this.initSettingElement<HTMLSelectElement>(`select[name="${name}"]`, store, restore);
    }

    // Generic handler for setting changes.
    private initSettingElement<T extends HTMLElement>(selector: string,
                               store: (e: T) => void,
                               restore: (e: T) => void) {
        const element = document.querySelector(selector) as T;
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

    // Hide a setting.
    private hideSettingControl(name: string) {
        const element = document.querySelector(`li:has(input[name="${name}"])`) as HTMLElement;
        if (!element) return;
        element.style.display = 'none';
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