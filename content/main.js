const registeredVideos = [];

let playbackVolume = 0.0;
let playbackMuted = true;

// Returns if the given video is from the explore page. Video controls in the explore page looks wrong, and we don't
// want to unmute multiple videos there. We simply ignore them.
function isVideoInExplorePage(video) {

    // Since Instagram is obfuscated, the best way to test for it, is to check for a video embedded in an a-tag.
    // The explore videos are like buttons that takes you to the actual view page.
    let parent = video.parentNode;
    while (parent)
    {
        if (parent.tagName === 'A') {
            return true;
        }
        parent = parent.parentNode;
    }

    return false;
}

// Is called when a new video element was detected on the page.
function registerVideoElement(video) {
    // Enable Html controls
    video.controls = true;

    // Update volume
    updateVolumeForVideo(video);

    // Remove Instagram controls and the pause handler.
    const elementAfterVideo = video.nextElementSibling;
    if (elementAfterVideo) {
        elementAfterVideo.remove();
    }

    video.addEventListener("volumechange", onVolumeChanged);
    video.addEventListener("play", onPlay);
}

// Is called when a video element was removed from the page.
function unregisterVideoElement(video) {
    video.removeEventListener("volumechange", onVolumeChanged);
    video.removeEventListener("play", onPlay);
}


// Applies the stored volume to all registered videos.
function updateVolumeForVideos() {
    for (const video of registeredVideos) {
        updateVolumeForVideo(video);
    }
}

// Applies the stored volume to the given video.
function updateVolumeForVideo(video) {
    video.volume = playbackVolume;
    video.muted = playbackMuted;
}

// Is called when the volume was changed of any registered video.
function onVolumeChanged(event) {
    // We don't want to react to volume changes from the page itself.
    if (!event.isTrusted) return;

    const video = event.target;
    playbackVolume = video.volume;
    playbackMuted = video.muted;

    // Sync the volume across all other video players.
    updateVolumeForVideos();
}

// Is called when a video is starting playback.
function onPlay(event) {
    const video = event.target;

    // Make sure we apply the last used volume settings.
    updateVolumeForVideo(video);
}

// Checks for new video elements on the page.
function checkForVideosAndEnableHtmlControls() {
    const videos = document.getElementsByTagName('video');

    // Detect new videos...
    for (const video of videos) {
        if (registeredVideos.includes(video)) continue;
        if (isVideoInExplorePage(video)) continue;

        registeredVideos.push(video);
        registerVideoElement(video);
    }

    // Detect removed videos...
    for (let i = 0; i < registeredVideos.length; i++) {
        const video = registeredVideos[i];
        let found = false;
        for (let n = 0; n < videos.length; n++) {
            if (videos[n] === video) {
                found = true;
                break;
            }
        }
        if (found) continue;
        registeredVideos.splice(i, 1);
        unregisterVideoElement(video);
        i--;
    }
}

// Instagram is a single-page-application and loads posts asynchronously. We'll check every second for new videos.
// MutationObserver is too slow, because there are to many nodes and changes on that site.
window.setInterval(() => {
    checkForVideosAndEnableHtmlControls();
}, 1000);
