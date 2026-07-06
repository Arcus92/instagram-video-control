import { Browser } from './browser';
import { EventDispatcher } from './eventDispatcher';
import { VideoControlMode } from './videoControlMode';
import { Utils } from './utils';
import { VideoAutoplayMode } from './videoAutoplayMode';
import StorageChangeChrome = chrome.storage.StorageChange;
import StorageChangeBrowser = browser.storage.StorageChange;

// Settings data struct.
export interface SettingsData {
    videoControlMode: VideoControlMode;
    lastPlaybackVolume: number;
    lastPlaybackSpeed: number;
    autoplayMode: VideoAutoplayMode;
    showTimeCodeText: boolean;
    showFullscreenButton: boolean;
    showPictureInPictureButton: boolean;
    showDownloadButton: boolean;
    showPlaybackSpeedOption: boolean;
    autoHideControlBar: boolean;
    loopPlayback: boolean;
}

// Handle extension settings.
export class Settings implements SettingsData {
    // The shares setting instance.
    public static shared: Settings = new Settings();

    //#region Data

    // The data object containing the raw values.
    public data: SettingsData = {
        videoControlMode: VideoControlMode.custom,
        lastPlaybackVolume: 0.0,
        lastPlaybackSpeed: 1.0,
        autoplayMode: VideoAutoplayMode.muted,
        showTimeCodeText: true,
        showFullscreenButton: true,
        showPictureInPictureButton: false,
        showDownloadButton: false,
        showPlaybackSpeedOption: true,
        autoHideControlBar: false,
        loopPlayback: true,
    };

    // The video control mode
    public get videoControlMode(): VideoControlMode {
        return this.data.videoControlMode;
    }
    public set videoControlMode(value: VideoControlMode) {
        if (this.data.videoControlMode === value) return;
        this.data.videoControlMode = value;

        this.onChange('videoControlMode');
    }

    // The last playback volume.
    public get lastPlaybackVolume(): number {
        return this.data.lastPlaybackVolume;
    }
    public set lastPlaybackVolume(value: number) {
        if (this.data.lastPlaybackVolume === value) return;
        this.data.lastPlaybackVolume = value;

        this.onChange('lastPlaybackVolume');
    }

    // The last playback speed.
    public get lastPlaybackSpeed(): number {
        return this.data.lastPlaybackSpeed;
    }
    public set lastPlaybackSpeed(value: number) {
        if (this.data.lastPlaybackSpeed === value) return;
        this.data.lastPlaybackSpeed = value;

        this.onChange('lastPlaybackSpeed');
    }

    // The autoplayer option (muted, unmuted, stopped)
    public get autoplayMode(): VideoAutoplayMode {
        return this.data.autoplayMode;
    }
    public set autoplayMode(value: VideoAutoplayMode) {
        if (this.data.autoplayMode === value) return;
        this.data.autoplayMode = value;

        this.onChange('autoplayMode');
    }

    // Should the time code text be visible in the player controls?
    public get showTimeCodeText(): boolean {
        return this.data.showTimeCodeText;
    }
    public set showTimeCodeText(value: boolean) {
        if (this.data.showTimeCodeText === value) return;
        this.data.showTimeCodeText = value;

        this.onChange('showTimeCodeText');
    }

    // Should the fullscreen button be visible in the player controls?
    public get showFullscreenButton(): boolean {
        return this.data.showFullscreenButton;
    }
    public set showFullscreenButton(value: boolean) {
        if (this.data.showFullscreenButton === value) return;
        this.data.showFullscreenButton = value;

        this.onChange('showFullscreenButton');
    }

    // Should the picture-in-picture button be visible in the player controls?
    public get showPictureInPictureButton(): boolean {
        return this.data.showPictureInPictureButton;
    }
    public set showPictureInPictureButton(value: boolean) {
        if (this.data.showPictureInPictureButton === value) return;
        this.data.showPictureInPictureButton = value;

        this.onChange('showPictureInPictureButton');
    }

    // Should the download button be visible in the player controls?
    public get showDownloadButton(): boolean {
        return this.data.showDownloadButton;
    }
    public set showDownloadButton(value: boolean) {
        if (this.data.showDownloadButton === value) return;
        this.data.showDownloadButton = value;

        this.onChange('showDownloadButton');
    }

    // Should the playback-speed option be visible in the player controls?
    public get showPlaybackSpeedOption(): boolean {
        return this.data.showPlaybackSpeedOption;
    }
    public set showPlaybackSpeedOption(value: boolean) {
        if (this.data.showPlaybackSpeedOption === value) return;
        this.data.showPlaybackSpeedOption = value;

        this.onChange('showPlaybackSpeedOption');
    }

    // If enabled, the controls will hide if the mouse is outside the video area.
    public get autoHideControlBar(): boolean {
        return this.data.autoHideControlBar;
    }
    public set autoHideControlBar(value: boolean) {
        if (this.data.autoHideControlBar === value) return;
        this.data.autoHideControlBar = value;

        this.onChange('autoHideControlBar');
    }

    // If enabled, the videos will auto-loop at the end of playback (Instagram default).
    public get loopPlayback(): boolean {
        return this.data.loopPlayback;
    }
    public set loopPlayback(value: boolean) {
        if (this.data.loopPlayback === value) return;
        this.data.loopPlayback = value;

        this.onChange('loopPlayback');
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
        Browser.storage.onChanged.addListener((changes, area) =>
            this.onStorageChanged(changes, area)
        );
    }

    //#endregion Init

    //#region Changes

    // The setting-changed event is called whenever a setting was changed in or outside of this class.
    public readonly changed = new EventDispatcher<keyof SettingsData>();

    // Invokes the change event.
    private onChange(name: keyof SettingsData) {
        // Invokes the change event.
        this.changed.invoke(name);

        if (!this.initialized) return;

        // Write changes to storage.
        const change: { [p: string]: unknown } = {};
        change[name] = this[name];
        Browser.storage.sync.set(change).then();
    }

    // Loads the volume settings from storage.
    private async load() {
        const names = Object.keys(this.data);
        const data = await Browser.storage.sync.get(names);
        this.storeValues(data);
    }

    // Event that is called whenever settings were changed from the storage.
    private onStorageChanged(
        changes: { [p: string]: StorageChangeChrome | StorageChangeBrowser },
        area: string
    ) {
        if (area !== 'sync') return;

        // Converts the change structure to a simple key-value pair.
        const data = Utils.mapObject(changes, (change) => change.newValue);
        this.storeValues(data);
    }

    // Stores the data in the settings.
    private storeValues(data: { [p: string]: unknown }) {
        if (typeof data.videoControlMode === 'string') {
            this.videoControlMode = data.videoControlMode as VideoControlMode;
        }
        if (typeof data.lastPlaybackVolume === 'number') {
            this.lastPlaybackVolume = data.lastPlaybackVolume;
        }
        if (typeof data.lastPlaybackSpeed === 'number') {
            this.lastPlaybackSpeed = data.lastPlaybackSpeed;
        }
        if (typeof data.autoplayMode === 'string') {
            this.autoplayMode = data.autoplayMode as VideoAutoplayMode;
        }
        if (typeof data.showTimeCodeText === 'boolean') {
            this.showTimeCodeText = data.showTimeCodeText;
        }
        if (typeof data.showFullscreenButton === 'boolean') {
            this.showFullscreenButton = data.showFullscreenButton;
        }
        if (typeof data.showPictureInPictureButton === 'boolean') {
            this.showPictureInPictureButton = data.showPictureInPictureButton;
        }
        if (typeof data.showDownloadButton === 'boolean') {
            this.showDownloadButton = data.showDownloadButton;
        }
        if (typeof data.showPlaybackSpeedOption === 'boolean') {
            this.showPlaybackSpeedOption = data.showPlaybackSpeedOption;
        }
        if (typeof data.autoHideControlBar === 'boolean') {
            this.autoHideControlBar = data.autoHideControlBar;
        }
        if (typeof data.loopPlayback === 'boolean') {
            this.loopPlayback = data.loopPlayback;
        }
    }

    public applyChanges(data: Partial<SettingsData>) {
        this.storeValues(data);
    }

    //#endregion Changes
}
