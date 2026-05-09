import { Settings, SettingsData } from '../shared/settings';
import { Resources } from '../instagram/resources';

export class CommunicationManager {
    // The extension settings.
    private readonly settings = Settings.shared;

    // The extension resources.
    private readonly resources = Resources.shared;

    public async init() {
        // Loads the settings and subscribe for setting changes.
        await this.settings.init();
        this.settings.changed.subscribe((name) => this.onSettingChanged(name));

        // Loads the resources.
        this.resources.init();

        // Send the initial settings and then the initialized message.
        this.sendMessageSettings(this.settings.data);
        this.sendMessageInitialized();
    }

    // An extension setting was changed.
    private onSettingChanged(name: keyof SettingsData) {
        const value = this.settings[name];
        this.sendMessageSettings({ [name]: value });
    }

    // Informs the page that the extension is initialized.
    private sendMessageInitialized() {
        window.postMessage({
            type: 'vci-initialized',
            // Since the main DOM cannot access the extension resource, we provide a list of all urls on startup.
            resourceUrls: this.resources.urls,
        });
    }

    // Informs the page about extension setting changes.
    private sendMessageSettings(data: Partial<SettingsData>) {
        window.postMessage({
            type: 'vci-settings',
            data: data,
        });
    }
}
