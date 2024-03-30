// Generic browser helpers.
export class Browser {
    private constructor() { }

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
        return this.current.storage.sync;
    }

    // Returns the internationalization object for the current browser.
    public static get i18n() {
        return this.current.i18n;
    }
}