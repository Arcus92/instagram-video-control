import { Browser } from '../shared/browser';
import { Settings, SettingsData } from '../shared/settings';
import { VideoControlMode } from '../shared/videoControlMode';
import { VideoAutoplayMode } from '../shared/videoAutoplayMode';
import { VideoDetectionMethod } from '../shared/videoDetectionMethod';

// Code class for the settings menu in the extension icon.
export class Popup {
    // The extension settings.
    private readonly settings = Settings.shared;

    // Initialize the settings popup.
    public async init() {
        this.replaceLocaleTags();
        this.showBrowserTags();

        // Loads the settings.
        await this.settings.init();
        this.settings.changed.subscribe((name) => this.onSettingChange(name));

        this.initSettingControls();
    }

    // Finds all setting controls, sets up the values and events.
    private initSettingControls() {
        // Video control mode
        this.initSettingSelectElement(
            'option_video_control_mode',
            (e) =>
                (this.settings.videoControlMode = e.value as VideoControlMode),
            (e) => (e.value = this.settings.videoControlMode)
        );

        // Auto hide control bar
        this.initSettingInputElement(
            'option_auto_hide_control_bar',
            (e) => (this.settings.autoHideControlBar = e.checked),
            (e) => (e.checked = this.settings.autoHideControlBar)
        );

        // Time code option
        this.initSettingInputElement(
            'option_show_time_code',
            (e) => (this.settings.showTimeCodeText = e.checked),
            (e) => (e.checked = this.settings.showTimeCodeText)
        );

        // Auto play option
        this.initSettingSelectElement(
            'option_autoplay_mode',
            (e) => (this.settings.autoplayMode = e.value as VideoAutoplayMode),
            (e) => (e.value = this.settings.autoplayMode)
        );

        // Fullscreen option
        if (Browser.isFullscreenSupported) {
            this.initSettingInputElement(
                'option_show_fullscreen',
                (e) => (this.settings.showFullscreenButton = e.checked),
                (e) => (e.checked = this.settings.showFullscreenButton)
            );
        } else {
            // Hide the setting if not supported.
            this.setSettingControlVisibility('option_show_fullscreen', false);
        }

        // Picture-in-Picture option
        if (Browser.isPictureInPictureSupported) {
            this.initSettingInputElement(
                'option_show_picture_in_picture',
                (e) => (this.settings.showPictureInPictureButton = e.checked),
                (e) => (e.checked = this.settings.showPictureInPictureButton)
            );
        } else {
            // Hide the setting if not supported.
            this.setSettingControlVisibility(
                'option_show_picture_in_picture',
                false
            );
        }

        // Playback speed option
        this.initSettingInputElement(
            'option_show_playback_speed',
            (e) => (this.settings.showPlaybackSpeedOption = e.checked),
            (e) => (e.checked = this.settings.showPlaybackSpeedOption)
        );

        // Loop playback option (can be used to disable default auto-loop on Instagram)
        this.initSettingInputElement(
            'option_loop_playback',
            (e) => (this.settings.loopPlayback = e.checked),
            (e) => (e.checked = this.settings.loopPlayback)
        );

        // Video detection method
        this.initSettingSelectElement(
            'option_video_detection_method',
            (e) =>
                (this.settings.videoDetectionMethod =
                    e.value as VideoDetectionMethod),
            (e) => (e.value = this.settings.videoDetectionMethod)
        );

        this.updateOptionAutoUnmuteHint();
        this.updateOptionVideoDetectionMethodHint();
    }

    // Handler for setting changes of input elements.
    private initSettingInputElement(
        name: string,
        store: (e: HTMLInputElement) => void,
        restore: (e: HTMLInputElement) => void
    ) {
        this.initSettingElement<HTMLInputElement>(
            `input[name="${name}"]`,
            store,
            restore
        );
    }

    // Handler for setting changes of select elements.
    private initSettingSelectElement(
        name: string,
        store: (e: HTMLSelectElement) => void,
        restore: (e: HTMLSelectElement) => void
    ) {
        this.initSettingElement<HTMLSelectElement>(
            `select[name="${name}"]`,
            store,
            restore
        );
    }

    // Generic handler for setting changes.
    private initSettingElement<T extends HTMLElement>(
        selector: string,
        store: (e: T) => void,
        restore: (e: T) => void
    ) {
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
    private setSettingControlVisibility(name: string, visibility: boolean) {
        const element = document.querySelector(
            `li:has([name="${name}"])`
        ) as HTMLElement;
        if (!element) return;
        element.style.display = visibility ? 'inherit' : 'none';
    }

    // Hide a setting hint.
    private setSettingHintVisibility(name: string, visibility: boolean) {
        let element = document.querySelector(
            `li:has([name="${name}"]) .hint`
        ) as HTMLElement;

        if (!element) {
            element = document.querySelector(
                `[data-hint="${name}"]`
            ) as HTMLElement;
        }

        if (!element) return;
        element.style.display = visibility ? 'inherit' : 'none';
    }

    // Replaces the content of all tags like `<span data-locale="test"></span>` with translated locale text.
    private replaceLocaleTags() {
        const elements = document.querySelectorAll('[data-locale]');
        if (!elements) return;
        for (const element of elements) {
            if (!(element instanceof HTMLElement)) continue;

            const locale = element.dataset.locale;
            if (!locale) continue;

            element.innerText = this.translate(locale);
        }
    }

    // Shows all browser tags like `<div data-browser="firefox">` for the current platform. Hides all other elements.
    private showBrowserTags() {
        const elements = document.querySelectorAll('[data-browser]');
        if (!elements) return;
        for (const element of elements) {
            if (!(element instanceof HTMLElement)) continue;

            const browser = element.dataset.browser ?? '';
            let visible = false;

            if (browser === 'firefox' && Browser.isFirefox()) {
                visible = true;
            }
            if (browser === 'chrome' && Browser.isChrome()) {
                visible = true;
            }

            // Removes the element if not visible
            if (!visible) {
                element.remove();
            }
        }
    }

    // A setting was changed.
    private onSettingChange(name: keyof SettingsData) {
        switch (name) {
            case 'autoplayMode':
                this.updateOptionAutoUnmuteHint();
                break;
            case 'videoDetectionMethod':
                this.updateOptionVideoDetectionMethodHint();
                break;
        }
    }

    private updateOptionAutoUnmuteHint() {
        this.setSettingHintVisibility(
            'option_autoplay_mode',
            this.settings.autoplayMode === VideoAutoplayMode.unmuted
        );
    }

    private updateOptionVideoDetectionMethodHint() {
        this.setSettingHintVisibility(
            'option_use_interval_video_detection',
            this.settings.videoDetectionMethod === VideoDetectionMethod.interval
        );
        this.setSettingHintVisibility(
            'option_use_observer_video_detection',
            this.settings.videoDetectionMethod === VideoDetectionMethod.observer
        );
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
