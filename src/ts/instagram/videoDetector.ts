import { Settings, SettingsData } from '../shared/settings';
import { VideoPlayer } from './videoPlayer';
import { PlaybackManager } from './playbackManager';
import { VideoAutoplayMode } from '../shared/videoAutoplayMode';
import { Resources, ResourceUrls } from './resources';
import { ReactHelper } from '../react/reactHelper';
import { ReactFiber } from '../react/reactFiber';
import { ReactDevTools } from '../react/reactDevTools';
import { ReactTag } from '../react/reactTag';
import { ReactFlags } from '../react/reactFlags';
import { ReactRoot } from '../react/reactRoot';
import { ReactDevToolsHook } from '../react/reactDevToolsHook';

// Detects changes of <video> tags and attaches the custom video players to the Instagram page.
export class VideoDetector implements PlaybackManager {
    // The extension settings.
    private readonly settings = Settings.shared;

    // List of all video players by source element.
    private videoPlayersByElement = new WeakMap<HTMLElement, VideoPlayer>();
    private videoPlayers: VideoPlayer[] = [];

    // Initialize the video detector.
    public async init() {
        this.startMessageHandling();
    }

    //#region Messaging

    // Adding the message handler.
    private startMessageHandling() {
        window.addEventListener('message', (ev) => this.onMessageHandler(ev));
    }

    // Handling messages from the extension.
    private onMessageHandler(ev: MessageEvent) {
        if (typeof ev.data !== 'object' || !ev.data.type) return;
        switch (ev.data.type) {
            // Handle extension initialization
            case 'vci-initialized': {
                const resourceUrls: ResourceUrls = ev.data.resourceUrls;
                Resources.shared.init(resourceUrls);

                this.onInitialized();
                break;
            }

            // Handle setting updates
            case 'vci-settings':
                this.settings.applyChanges(ev.data.data);
                break;
        }
    }

    // The extension was initialized.
    private onInitialized() {
        // If the user really want's to unmute the videos on page-load, we let him do that.
        if (this.settings.autoplayMode === VideoAutoplayMode.unmuted) {
            this.checkAndEnableAutoplayWithAudio();
        } else if (this.settings.autoplayMode === VideoAutoplayMode.stopped) {
            // When autoplay is disabled, we can unmute by default. Videos only start on user-interaction so nobody
            // will be annoyed with sudden audio playback.
            this.lastPlaybackMuted = false;
        }

        this.registerReactHooks();

        // Listen to setting changes.
        this.settings.changed.subscribe((name) => this.onSettingChanged(name));
    }

    //#region Messaging

    //#region Detector

    private registerReactHooks() {
        const hook: ReactDevToolsHook = {
            inject: () => {
                // Must be defined for React execute the other hooks.
            },
            onCommitFiberRoot: (rendererId: number, root: ReactRoot) => {
                // Only collect new or updated nodes.
                const subtreeFlagFilter =
                    ReactFlags.Placement | ReactFlags.Update | ReactFlags.Ref;

                // First level: Find all
                ReactHelper.traversal(root.current, {
                    filter: (fiber) => {
                        // Only collect the first render of the fiber.
                        if (fiber.alternate) return false;
                        // Filter function by name.
                        if (fiber.tag !== ReactTag.FunctionComponent)
                            return false;
                        const name = ReactHelper.getName(fiber);
                        return name?.endsWith('[from PolarisVideo.react]');
                    },
                    subtreeFilter: (fiber) =>
                        (fiber.subtreeFlags & subtreeFlagFilter) !== 0,
                    callback: (fiber) => {
                        // Wait a few ticks for React to spawn the required elements.
                        setTimeout(() => {
                            this.tryAttachPolarisVideo(fiber);
                        }, 100);
                    },
                });
            },
            onCommitFiberUnmount: (rendererId: number, fiber: ReactFiber) => {
                // Filter function by name.
                if (fiber.tag !== ReactTag.FunctionComponent) return false;
                const name = ReactHelper.getName(fiber);
                if (!name?.endsWith('[from PolarisVideo.react]')) return;
                this.tryDetachPolarisVideo(fiber);
            },
        };
        ReactDevTools.register(hook);
    }

    // Creates the video player from the given polaris player.
    public tryDetectVideoPlayer(
        polarisFiber: ReactFiber
    ): VideoPlayer | undefined {
        const player = new VideoPlayer(this);
        if (!player.tryDetect(polarisFiber)) return;
        return player;
    }

    private tryAttachPolarisVideo(polarisFiber: ReactFiber) {
        const polarisElement = ReactHelper.getNodeFromFiber(polarisFiber);
        if (!polarisElement) {
            return;
        }

        // Detect the video player elements.
        const videoPlayer = this.tryDetectVideoPlayer(polarisFiber);
        if (!videoPlayer) {
            return;
        }

        // Element is already registered.
        if (this.videoPlayersByElement.get(polarisElement)) return;

        // Add to lists.
        this.videoPlayers.push(videoPlayer);
        this.videoPlayersByElement.set(polarisElement, videoPlayer);

        videoPlayer.attach();

        // Update the initial volume and speed.
        this.updateVolumeForVideo(videoPlayer);
        this.updatePlaybackSpeedForVideo(videoPlayer);
    }

    private tryDetachPolarisVideo(polarisFiber: ReactFiber) {
        const polarisElement = ReactHelper.getNodeFromFiber(polarisFiber);
        if (!polarisElement) {
            return;
        }

        const videoPlayer = this.videoPlayersByElement.get(polarisElement);
        if (!videoPlayer) {
            return;
        }

        videoPlayer.detach();

        // Remove from lists.
        const index = this.videoPlayers.indexOf(videoPlayer);
        if (index >= 0) this.videoPlayers.splice(index, 1);
        this.videoPlayersByElement.delete(polarisElement);
    }

    //#endregion Detector

    //#region Settings

    // An extension setting was changed.
    private onSettingChanged(name: keyof SettingsData) {
        switch (name) {
            case 'showTimeCodeText':
            case 'showFullscreenButton':
            case 'showPictureInPictureButton':
            case 'showPlaybackSpeedOption':
            case 'autoHideControlBar':
            case 'loopPlayback':
                this.updateControlSettingForVideos();
                break;
            case 'videoControlMode':
                this.updateControlModeForVideos();
                break;
        }
    }

    // Notify all players that a control setting was changed.
    private updateControlSettingForVideos() {
        for (const videoPlayer of this.videoPlayers) {
            videoPlayer.updateControlSetting();
        }
    }

    // Notify all players that a control mode was changed.
    private updateControlModeForVideos() {
        for (const videoPlayer of this.videoPlayers) {
            videoPlayer.updateControlMode();
        }
    }

    //#endregion Settings

    //#region Volume

    // Stores the last muted state. We cannot load it from the settings. We cannot unmute and autoplay in modern
    // browsers. Instagram will always autoplay. If we unmute by default, without user interaction, the video will stop.
    // It is possible to overwrite this using `this.settings.autoUnmutePlayback` in the settings menu.
    private lastPlaybackMuted: boolean = true;

    // Sometimes Instagram resets the volume on play. We want to ignore it, since it isn't a user event.
    private ignoreNextVolumeChange = false;

    // Applies the stored volume to all registered videos.
    private updateVolumeForVideos() {
        for (const videoPlayer of this.videoPlayers) {
            this.updateVolumeForVideo(videoPlayer);
        }
    }

    // Applies the stored volume to the given video.
    private updateVolumeForVideo(videoPlayer: VideoPlayer) {
        const videoElement = videoPlayer.videoElementRef?.deref();
        if (!videoElement) return;

        let volume = this.settings.lastPlaybackVolume;

        // Do not restore volume if it is zero to prevent a second click to the volume bar.
        if (volume === 0) {
            volume = 0.1;
        }

        videoElement.volume = volume;
        videoElement.muted = this.lastPlaybackMuted;
    }

    //#endregion

    //#region Speed

    // Applies the stored playback speed to all registered videos.
    private updatePlaybackSpeedForVideos() {
        for (const videoPlayer of this.videoPlayers) {
            this.updatePlaybackSpeedForVideo(videoPlayer);
        }
    }

    // Applies the stored playback speed to the given video.
    private updatePlaybackSpeedForVideo(videoPlayer: VideoPlayer) {
        const videoElement = videoPlayer.videoElementRef?.deref();
        if (!videoElement) return;

        videoElement.playbackRate = this.settings.lastPlaybackSpeed;
    }

    //#endregion

    //#region Autoplay

    private checkAndEnableAutoplayWithAudio() {
        // Check if autoplay is available.
        this.checkForAutoplay((autoplayEnabled) => {
            // Failed...
            if (!autoplayEnabled) {
                console.error(
                    'The browser is blocking autoplay with audio. Make sure to enable autoplay in the website settings!'
                );
                return;
            }

            // Disable the mute for all videos.
            this.lastPlaybackMuted = false;
        });
    }

    // This checks if audio-autoplay is allowed for this website.
    private checkForAutoplay(callback: (autoplayEnabled: boolean) => void) {
        // I know there is this new experimental api `Navigator.getAutoplayPolicy()` and this is just a hack.
        // However, this has the benefit of requesting autoplay in Firefox. This adds the website permission settings
        // icon to the url bar, where the user can actually enable audio autoplay.
        // How it works: We simply add a silent audio track to the page, enable unmuted autoplay and check if it starts
        // playback within 100ms.
        const audio = document.createElement('audio');
        audio.style.display = 'none';
        audio.autoplay = true;
        audio.defaultMuted = false;
        audio.src = Resources.shared.urls.sounds.silence;
        document.body.appendChild(audio);

        const timerId = setTimeout(() => {
            audio.remove();

            callback(false);
        }, 100);

        audio.addEventListener('play', () => {
            audio.remove();
            clearTimeout(timerId);

            callback(true);
        });
    }

    //#endregion

    //#region PlaybackManager implementation

    // Must be called whenever a video playback was started.
    public notifyVideoPlay(videoPlayer: VideoPlayer) {
        // Instagram will mute videos in Reels as soon as playback starts. To counter this we will ignore the next volume
        // change event and undo the volume / mute change.
        this.ignoreNextVolumeChange = true;
        setTimeout(() => {
            this.ignoreNextVolumeChange = false;
        }, 50);

        // Make sure we apply the last used volume settings.
        this.updateVolumeForVideo(videoPlayer);
    }

    // Must be called whenever a video volume was changed.
    public notifyVideoVolumeChange(videoPlayer: VideoPlayer) {
        const videoElement = videoPlayer.videoElementRef?.deref();
        if (!videoElement) return;

        const volume = videoElement.volume;
        const muted = videoElement.muted || videoElement.volume === 0;

        // Not changed, so no need to update the other videos.
        if (
            this.settings.lastPlaybackVolume === volume &&
            this.lastPlaybackMuted === muted
        )
            return;

        // To fix an issue with Reels, we sometimes have to ignore and undo volume events.
        if (this.ignoreNextVolumeChange) {
            this.updateVolumeForVideo(videoPlayer);
            return;
        }

        this.settings.lastPlaybackVolume = volume;
        this.lastPlaybackMuted = muted;

        // Sync the volume across all other video players.
        this.updateVolumeForVideos();
    }

    // Must be called whenever a video playback speed was changed.
    public notifyVideoPlaybackSpeedChange(videoPlayer: VideoPlayer) {
        const videoElement = videoPlayer.videoElementRef?.deref();
        if (!videoElement) return;

        this.settings.lastPlaybackSpeed = videoElement.playbackRate;

        // Sync the speed across all other video players.
        this.updatePlaybackSpeedForVideos();
    }

    //#endregion
}
