import { Browser } from '../../shared/browser';

export class Resources {
    public static imagePlay = Browser.getUrl('images/play.svg');
    public static imagePause = Browser.getUrl('images/pause.svg');
    public static imageSpeakerOn = Browser.getUrl('images/speaker-on.svg');
    public static imageSpeakerOff = Browser.getUrl('images/speaker-off.svg');
    public static imageFullscreenEnter = Browser.getUrl(
        'images/fullscreen-enter.svg'
    );
    public static imageFullscreenExit = Browser.getUrl(
        'images/fullscreen-exit.svg'
    );

    public static imagePictureInPictureEnter = Browser.getUrl(
        'images/picture-in-picture-enter.svg'
    );
    public static imagePictureInPictureExit = Browser.getUrl(
        'images/picture-in-picture-exit.svg'
    );
    public static imagePlaybackSpeed = Browser.getUrl(
        'images/playback-speed.svg'
    );
}
