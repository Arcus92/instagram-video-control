// The playback manager handles the volume states of the different videos and synchronizes it across all players.
import { VideoPlayer } from './videoPlayer';

export interface PlaybackManager {
    // Must be called whenever a video playback was started.
    notifyVideoPlay(videoPlayer: VideoPlayer): void;

    // Must be called whenever a video volume was changed.
    notifyVideoVolumeChange(videoPlayer: VideoPlayer): void;

    // Must be called whenever a video playback speed was changed.
    notifyVideoPlaybackSpeedChange(videoPlayer: VideoPlayer): void;
}
