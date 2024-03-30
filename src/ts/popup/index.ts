// Init the settings popup logic
import {Browser} from "../shared/browser";

// Initialize the settings popup
function init() {
    translateLocaleTags();
}

// Replaces the content of all tags like `<span data-locale="test"></span>` with translated locale text.
function translateLocaleTags() {
    const elements = document.querySelectorAll('[data-locale]');
    if (!elements) return;
    for (const element of elements) {
        if (!(element instanceof HTMLElement)) continue;

        const locale = element.dataset.locale;
        if (!locale) continue;

        const text = Browser.i18n.getMessage(locale);
        element.innerText = text ?? locale
    }
}

// Wait until the html is loaded.
document.addEventListener('DOMContentLoaded', init, false);