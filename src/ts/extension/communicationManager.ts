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

        // Listing for messages from the website.
        window.addEventListener('message', (ev) => this.onMessageHandler(ev));
    }

    // Set while changes sent by the website are applied.
    private applyingWebsiteChanges = false;

    // An extension setting was changed.
    private onSettingChanged(name: keyof SettingsData) {
        // The website already has the values it sent us. Sending them back would start a ping-pong between both
        // sides as soon as two changes are in flight.
        if (this.applyingWebsiteChanges) return;

        const value = this.settings[name];
        this.sendMessageSettings({ [name]: value });
    }

    // Handling messages from the website.
    private onMessageHandler(ev: MessageEvent) {
        if (typeof ev.data !== 'object' || !ev.data.type) return;
        switch (ev.data.type) {
            // Handle setting updates from the website. This must not be `vci-settings`: both sides share the same
            // window, so we would also receive our own `vci-settings` messages and apply outdated values.
            case 'vci-store-settings':
                this.applyingWebsiteChanges = true;
                try {
                    this.settings.applyChanges(ev.data.data);
                } finally {
                    this.applyingWebsiteChanges = false;
                }
                break;
        }
    }

    // Informs the page that the extension is initialized.
    private sendMessageInitialized() {
        window.postMessage({
            type: 'vci-initialized',
            // Since the main DOM cannot access the extension resource, we provide a list of all urls on startup.
            resourceUrls: this.resources.urls,
            localeTexts: this.resources.locales,
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
