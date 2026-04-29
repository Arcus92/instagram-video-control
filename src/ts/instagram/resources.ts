import { Browser } from '../shared/browser';

// Cached resource urls.
export class Resources {
    private static _shared?: Resources = undefined;

    public static get shared() {
        if (!this._shared) {
            this._shared = new Resources();
        }
        return this._shared;
    }

    // Images
    public imagePlay = Browser.getUrl('images/play.svg');
    public imagePause = Browser.getUrl('images/pause.svg');
    public imageFullscreenEnter = Browser.getUrl('images/fullscreen-enter.svg');
    public imageFullscreenExit = Browser.getUrl('images/fullscreen-exit.svg');
    public imageSpeakerOn = Browser.getUrl('images/speaker-on.svg');
    public imageSpeakerOff = Browser.getUrl('images/speaker-off.svg');
    public imagePictureInPictureEnter = Browser.getUrl(
        'images/picture-in-picture-enter.svg'
    );
    public imagePictureInPictureExit = Browser.getUrl(
        'images/picture-in-picture-exit.svg'
    );
    public imagePlaybackSpeed = Browser.getUrl('images/playback-speed.svg');

    // Sound
    public soundSilence = Browser.getUrl('audio/silence.mp3');
}
