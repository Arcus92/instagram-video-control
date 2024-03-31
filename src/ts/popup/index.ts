import {Popup} from "./popup";

// Wait until the html is loaded.
document.addEventListener('DOMContentLoaded', () => {
    const popup = new Popup();
    popup.init();
}, false);