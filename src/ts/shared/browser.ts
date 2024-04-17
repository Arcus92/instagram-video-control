// Generic browser helpers.
export class Browser {
    private constructor() { }

    // Returns if the current browser is Firefox.
    public static isFirefox(): boolean {
        return /firefox/i.test(navigator.userAgent);
    }

    // Returns if the current browser is Chromium based.
    public static isChrome(): boolean {
        // Somehow `chrome` is set for extensions in Firefox?!
        return typeof chrome !== 'undefined' && !this.isFirefox();
    }

    // Returns the current browser object for Chrome and Firefox.
    private static get current() {
        // This is 'browser' in Firefox and 'chrome' in ... Chrome.
        if (typeof browser === "undefined") {
            return chrome;
        }
        return browser;
    }

    // Returns the storage object for the current browser.
    public static get storage() {
        return this.current.storage;
    }

    // Returns the internationalization object for the current browser.
    public static get i18n() {
        return this.current.i18n;
    }

    // Returns the extension manifest.
    public static getManifest() {
        return this.current.runtime.getManifest();
    }

    // Returns an url to an extension resource shared via 'web_accessible_resources'.
    public static getUrl(path: string): string {
        return this.current.runtime.getURL(path);
    }

    // Returns if fullscreen is supported in this browser. Should be supported in Chrome and Firefox.
    public static get isFullscreenSupported() {
        return typeof document.fullscreenEnabled !== 'undefined';
    }

    // Returns if PiP is supported in this browser. Currently only Chrome supports it.
    public static get isPictureInPictureSupported() {
        return typeof document.pictureInPictureEnabled !== 'undefined';
    }
}