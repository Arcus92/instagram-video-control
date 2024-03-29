// Handle extension settings.
export class Settings {
    // The last playback volume.
    public lastPlaybackVolume: number = 0.0;

    // The last playback muted state.
    public lastPlaybackMuted: boolean = true;

    // The shares setting instance.
    public static shared: Settings = new Settings();


    // Saves the current volume settings to storage.
    public save() {
        this.storage().set({
            lastPlaybackVolume: this.lastPlaybackVolume
        }).then(() => {}, (e: Error) => console.error(e));
    }

    // Loads the volume settings from storage.
    public load() {
        this.storage().get("lastPlaybackVolume").then((value) => {
            if (typeof value?.lastPlaybackVolume === 'number')
            {
                this.lastPlaybackVolume = value.lastPlaybackVolume;
            }
        }, (e: Error) => console.error(e));
    }

    // Returns the storage object for the current browser.
    private storage() {
        // This is 'browser' in Firefox and 'chrome' in ... Chrome.
        if (typeof browser === "undefined") {
            return chrome.storage.sync;
        }
        return browser.storage.sync;
    }
}