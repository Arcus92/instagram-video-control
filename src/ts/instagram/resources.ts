import { Browser } from '../shared/browser';

export type ResourceUrls = {
    images: {
        play: string;
        pause: string;
        fullscreenEnter: string;
        fullscreenExit: string;
        speakerOn: string;
        speakerOff: string;
        pictureInPictureEnter: string;
        pictureInPictureExit: string;
        playbackSpeed: string;
        download: string;
    };
    sounds: {
        silence: string;
    };
};

// Cached resource urls.
export class Resources {
    // Gets the shared resources instance.
    public static shared: Resources = new Resources();

    // The resource urls.
    public urls: ResourceUrls = {
        images: {
            play: '',
            pause: '',
            fullscreenEnter: '',
            fullscreenExit: '',
            speakerOn: '',
            speakerOff: '',
            pictureInPictureEnter: '',
            pictureInPictureExit: '',
            playbackSpeed: '',
            download: '',
        },
        sounds: {
            silence: '',
        },
    };

    // Initializes the resources. If no urls are provided, the urls are created from the extension.
    public init(urls?: ResourceUrls) {
        if (!urls) {
            urls = Resources.getExtensionUrls();
        }
        this.urls = urls;
    }

    // Gets the resource urls from the extension.
    private static getExtensionUrls(): ResourceUrls {
        return {
            images: {
                play: Browser.getUrl('images/play.svg'),
                pause: Browser.getUrl('images/pause.svg'),
                fullscreenEnter: Browser.getUrl('images/fullscreen-enter.svg'),
                fullscreenExit: Browser.getUrl('images/fullscreen-exit.svg'),
                speakerOn: Browser.getUrl('images/speaker-on.svg'),
                speakerOff: Browser.getUrl('images/speaker-off.svg'),
                pictureInPictureEnter: Browser.getUrl(
                    'images/picture-in-picture-enter.svg'
                ),
                pictureInPictureExit: Browser.getUrl(
                    'images/picture-in-picture-exit.svg'
                ),
                playbackSpeed: Browser.getUrl('images/playback-speed.svg'),
                download: Browser.getUrl('images/download.svg'),
            },
            sounds: {
                silence: Browser.getUrl('audio/silence.mp3'),
            },
        };
    }
}
