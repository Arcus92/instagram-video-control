import {Browser} from "./browser";
import {EventDispatcher} from "./eventDispatcher";
import {VideoControlMode} from "./videoControlMode";
import StorageChangeChrome = chrome.storage.StorageChange;
import StorageChangeBrowser = browser.storage.StorageChange;
import {Utils} from "./utils";

// Settings data struct.
export interface SettingsData {
    videoControlMode: VideoControlMode;
    lastPlaybackVolume: number;
    autoUnmutePlayback: boolean;
    showTimeCodeText: boolean;
    showFullscreenButton: boolean;
    showPictureInPictureButton: boolean;
}

// Handle extension settings.
export class Settings implements SettingsData {
    // The shares setting instance.
    public static shared: Settings = new Settings();

    //#region Data

    private readonly names: string[] = [
        'videoControlMode', 'lastPlaybackVolume', 'autoUnmutePlayback', 'showTimeCodeText', 'showFullscreenButton',
        'showPictureInPictureButton'
    ];
    private _videoControlMode: VideoControlMode = VideoControlMode.custom;
    private _lastPlaybackVolume: number = 0.0;
    private _autoUnmutePlayback: boolean = false;
    private _showTimeCodeText: boolean = true;
    private _showFullscreenButton: boolean = true;
    private _showPictureInPictureButton: boolean = false;

    // The video control mode
    public get videoControlMode(): VideoControlMode {
        return this._videoControlMode;
    }
    public set videoControlMode(value: VideoControlMode) {
        if (this._videoControlMode === value) return;
        this._videoControlMode = value;

        this.onChange('videoControlMode');
    }

    // The last playback volume.
    public get lastPlaybackVolume(): number {
        return this._lastPlaybackVolume;
    }
    public set lastPlaybackVolume(value: number) {
        if (this._lastPlaybackVolume === value) return;
        this._lastPlaybackVolume = value;

        this.onChange('lastPlaybackVolume');
    }

    // Should the playback be unmuted on page load?
    public get autoUnmutePlayback(): boolean {
        return this._autoUnmutePlayback;
    }
    public set autoUnmutePlayback(value: boolean) {
        if (this._autoUnmutePlayback === value) return;
        this._autoUnmutePlayback = value;

        this.onChange('autoUnmutePlayback');
    }

    // Should the time code text be visible in the player controls?
    public get showTimeCodeText(): boolean {
        return this._showTimeCodeText;
    }
    public set showTimeCodeText(value: boolean) {
        if (this._showTimeCodeText === value) return;
        this._showTimeCodeText = value;

        this.onChange('showTimeCodeText');
    }

    // Should the fullscreen button be visible in the player controls?
    public get showFullscreenButton(): boolean {
        return this._showFullscreenButton;
    }
    public set showFullscreenButton(value: boolean) {
        if (this._showFullscreenButton === value) return;
        this._showFullscreenButton = value;

        this.onChange('showFullscreenButton');
    }

    // Should the picture-in-picture button be visible in the player controls?
    public get showPictureInPictureButton(): boolean {
        return this._showPictureInPictureButton;
    }
    public set showPictureInPictureButton(value: boolean) {
        if (this._showPictureInPictureButton === value) return;
        this._showPictureInPictureButton = value;

        this.onChange('showPictureInPictureButton');
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
    public readonly changed= new EventDispatcher<keyof SettingsData>();

    // Invokes the change event.
    private onChange(name: keyof SettingsData) {
        // Invokes the change event.
        this.changed.invoke(name);

        // Write changes to storage.
        const change: { [p: string]: unknown } = {};
        change[name] = this[name];
        Browser.storage.sync.set(change).then();
    }

    // Loads the volume settings from storage.
    private async load() {
        const data = await Browser.storage.sync.get(this.names);
        this.storeValues(data);
    }

    // Event that is called whenever a settings was changed from the storage.
    private onStorageChanged(changes: { [p: string]: StorageChangeChrome | StorageChangeBrowser }, area: string) {
        if (area !== 'sync') return;

        // Converts the changes structure to a simple key-value pair.
        const data = Utils.mapObject(changes,
            (change) => change.newValue);
        this.storeValues(data);
    }

    // Stores the data in the settings.
    private storeValues(data: { [p: string]: unknown }) {
        if (typeof data.videoControlMode === 'string')
        {
            this.videoControlMode = data.videoControlMode as VideoControlMode;
        }
        if (typeof data.lastPlaybackVolume === 'number')
        {
            this.lastPlaybackVolume = data.lastPlaybackVolume;
        }
        if (typeof data.autoUnmutePlayback === 'boolean')
        {
            this.autoUnmutePlayback = data.autoUnmutePlayback;
        }
        if (typeof data.showTimeCodeText === 'boolean')
        {
            this.showTimeCodeText = data.showTimeCodeText;
        }
        if (typeof data.showFullscreenButton === 'boolean')
        {
            this.showFullscreenButton = data.showFullscreenButton;
        }
        if (typeof data.showPictureInPictureButton === 'boolean')
        {
            this.showPictureInPictureButton = data.showPictureInPictureButton;
        }
    }

    //#endregion Changes
}