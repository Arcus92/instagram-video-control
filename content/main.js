function checkForVideosAndEnableHtmlControls() {
    const videos = document.getElementsByTagName('video');
    for (const video of videos) {
        if (video.controls) continue;

        // Enable Html controls
        video.controls = true;

        // Remove Instagram controls and the pause handler.
        const elementAfterVideo = video.nextElementSibling;
        if (elementAfterVideo) {
            elementAfterVideo.remove();
        }
    }
}

// Instagram is a single-page-application and loads posts asynchronously. We'll check every second for new videos.
// MutationObserver is too slow, because there are to many nodes and changes on that site.
window.setInterval(() => {
    checkForVideosAndEnableHtmlControls();
}, 1000);
