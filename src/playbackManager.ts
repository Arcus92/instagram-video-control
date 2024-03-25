// The playback manager handles the volume states of the different videos and synchronises it across all players.
export interface PlaybackManager {
    // Must be called whenever a video playback was started.
    notifyVideoPlay(video: HTMLVideoElement): void;

    // Must be called whenever a video volume was changed.
    notifyVideoVolumeChange(video: HTMLVideoElement): void;
}