// This script is injected into the original Instagram DOM. The extension shadow DOM can not see changes made by
// Instagram itself. This creates an observer that listens for new or removed video elements and tells the extension to
// run the detection code again.
// This creates a more responsive result than just scanning for video elements every second.
// There is more room for optimization, currently we cannot pass the element references into the shadow DOM. An idea is
// to run the whole extension in the original DOM and create an interface to exchange the extension settings.

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        // Detect added video elements
        for (const addedNode of mutation.addedNodes) {
            if (!(addedNode instanceof HTMLElement)) continue;
            const element = addedNode.querySelector('video');
            if (!element) continue;

            window.postMessage({ type: 'ivcDetectVideos' });
            return;
        }

        // Detect removed video elements
        for (const removedNode of mutation.removedNodes) {
            if (!(removedNode instanceof HTMLElement)) continue;
            const element = removedNode.querySelector('video');
            if (!element) continue;

            window.postMessage({ type: 'ivcDetectVideos' });
            return;
        }
    }
});
observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
});
