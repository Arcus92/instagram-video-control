import {Browser} from "./browser";
import StorageChangeChrome = chrome.storage.StorageChange;
import StorageChangeBrowser = browser.storage.StorageChange;
import {EventDispatcher} from "./eventDispatcher";

// Handle extension settings.
export class Settings {
    // The shares setting instance.
    public static shared: Settings = new Settings();

    //#region Data

    private readonly names: string[] = ["lastPlaybackVolume", "showFullscreenButton"];
    private _lastPlaybackVolume: number = 0.0;
    private _showFullscreenButton: boolean = true;

    // The last playback volume.
    public get lastPlaybackVolume(): number {
        return this._lastPlaybackVolume;
    }
    public set lastPlaybackVolume(value: number) {
        if (this._lastPlaybackVolume === value) return;
        this._lastPlaybackVolume = value;

        this.onChange('lastPlaybackVolume');
    }

    // Should the fullscreen button be visible in the player controls.
    public get showFullscreenButton(): boolean {
        return this._showFullscreenButton;
    }
    public set showFullscreenButton(value: boolean) {
        if (this._showFullscreenButton === value) return;
        this._showFullscreenButton = value;

        this.onChange('showFullscreenButton');
    }

    //#endregion Data

    //#region Init

    // Is `init` already called?
    private initialized: boolean = false;

    // Loads and hooks the settings.
    public async init() {
        if (this.initialized) return;
        this.initialized = true;

        // Loads the initial data...
        await this.load();

        // Listen for changes...
        Browser.storage.onChanged.addListener(
            (changes, area) => this.onStorageChanged(changes, area))
    }

    //#endregion Init

    //#region Changes

    // The setting changed event is called, whenever a setting was changed in or outside of this class.
    public readonly changed= new EventDispatcher<string>();

    // Invokes the change event.
    private onChange(name: string) {
        // Invokes the change event.
        this.changed.invoke(name);

        // Write to storage.
        this.save().then();
    }

    // Loads the volume settings from storage.
    private async load() {
        const data = await Browser.storage.sync.get(this.names);
        if (typeof data.lastPlaybackVolume === 'number')
        {
            this._lastPlaybackVolume = data.lastPlaybackVolume;
        }
        if (typeof data.showFullscreenButton === 'boolean')
        {
            this._showFullscreenButton = data.showFullscreenButton;
        }
    }

    // Saves the current volume settings to storage.
    private async save() {
        await Browser.storage.sync.set({
            lastPlaybackVolume: this._lastPlaybackVolume,
            showFullscreenButton: this._showFullscreenButton
        });
    }

    // Event that is called whenever a settings was changed from the storage.
    private onStorageChanged(changes: { [p: string]: StorageChangeChrome | StorageChangeBrowser }, area: string) {
        if (area !== 'sync') return;


        // Update our local values.
        if (typeof changes.lastPlaybackVolume?.newValue === 'number')
        {
            this.lastPlaybackVolume = changes.lastPlaybackVolume?.newValue;
        }
        if (typeof changes.showFullscreenButton?.newValue === 'boolean')
        {
            this.showFullscreenButton = changes.showFullscreenButton?.newValue;
        }
    }

    //#endregion Changes
}