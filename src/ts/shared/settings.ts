import {Browser} from "./browser";

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
        Browser.storage.set({
            lastPlaybackVolume: this.lastPlaybackVolume
        }).then(() => {}, (e: Error) => console.error(e));
    }

    // Loads the volume settings from storage.
    public load() {
        Browser.storage.get("lastPlaybackVolume").then((value) => {
            if (typeof value?.lastPlaybackVolume === 'number')
            {
                this.lastPlaybackVolume = value.lastPlaybackVolume;
            }
        }, (e: Error) => console.error(e));
    }
}