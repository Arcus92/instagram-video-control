const registeredVideos = [];

let playbackVolume = 0.0;
let playbackMuted = true;
let ignoreNextVolumeChange = false

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

    // Instead of removing the Instagram controls, we change the height and remove the height of the native video
    // controls. This lets the user click the bottom of the video / interact with the video controls AND use the
    // Instagram controls like sharing, following, channel links, etc.
    const elementAfterVideo = video.nextElementSibling;
    if (elementAfterVideo) {
        if (elementAfterVideo.firstChild instanceof HTMLElement) {
            elementAfterVideo.firstChild.style.height = "calc(100% - 40px)"; /* 40px is ~ the video control height */
        }
    }

    // Detect if this video is embedded. We need to apply special rules for embedded videos.
    const isEmbedded = video.parentElement?.parentElement?.parentElement?.classList?.contains("EmbedVideo") ?? false;
    if (isEmbedded) {
        // The pause handler for embedded videos is a layer deeper than on usual videos.
        // We need to delete this, otherwise the video is covered by these invisible elements and not clickable.
        while (video.parentElement?.nextElementSibling)
        {
            video.parentElement.nextElementSibling.remove();
        }

        // We need to overwrite the video-end event. Instagram will show you a 'watch again on Instagram' message and
        // hide the video. We want to give the user the option to replay the video even after it finished.
        disableAllEventListeners(video, "ended");
        // The embedded page will also force you to open Instagram once you started the video and then lost focus.
        // For example: Playing the video and then switching the tab or scrolling down.
        // This might cause other issues, and we may need to remove this later.
        disableAllEventListeners(document, "visibilitychange");
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

    // Not changed, so no need to update the other videos.
    if (playbackVolume === video.volume && playbackMuted === video.muted)
        return;

    // To fix an issue with Reels, we sometimes have to ignore and undo volume events.
    if (ignoreNextVolumeChange) {
        updateVolumeForVideo(video);
        return;
    }

    playbackVolume = video.volume;
    playbackMuted = video.muted;
    saveSettings();

    // Sync the volume across all other video players.
    updateVolumeForVideos();
}

// Is called when a video is starting playback.
function onPlay(event) {
    const video = event.target;

    // Instagram will mute videos in Reels as soon as playback starts. To counter this we will ignore the next volume
    // change event and undo the volume / mute change.
    ignoreNextVolumeChange = true;
    setTimeout(() => {
        ignoreNextVolumeChange = false
    }, 10)


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

// Returns the storage object for the current browser.
function storage() {
    // This is 'browser' in Firefox and 'chrome' in ... Chrome.
    if (typeof browser === "undefined") {
        return chrome.storage.sync;
    }
    return browser.storage.sync;
}

// Saves the current volume settings to storage.
function saveSettings() {
    storage().set({
        lastPlaybackVolume: playbackVolume
    }).then(() => {}, (e) => console.error(e));
}

// Loads the volume settings from storage.
function loadSettings() {
    storage().get("lastPlaybackVolume").then((value) => {
        if (typeof value?.lastPlaybackVolume === 'number')
        {
            playbackVolume = value.lastPlaybackVolume;
        }
    }, (e) => console.error(e));
}

// Disables all events for the given element by stop propagation.
function disableAllEventListeners(element, type) {
    // There is no way to remove event handlers, so we add a aggressive event, that stops propagation.
    element.addEventListener(type, (event) => {
        event.stopImmediatePropagation();
    }, true);
}

loadSettings();

// Instagram is a single-page-application and loads posts asynchronously. We'll check every second for new videos.
// MutationObserver is too slow, because there are to many nodes and changes on that site.
window.setInterval(() => {
    checkForVideosAndEnableHtmlControls();
}, 1000);
