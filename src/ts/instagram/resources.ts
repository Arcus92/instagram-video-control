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

export type LocaleTexts = {
    playTooltip: string;
    pauseTooltip: string;
    muteTooltip: string;
    unmuteTooltip: string;
    playbackSpeedTooltip: string;
    enterFullscreenTooltip: string;
    leaveFullscreenTooltip: string;
    enterPictureInPictureTooltip: string;
    leavePictureInPictureTooltip: string;
    downloadTooltip: string;
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

    // The locale texts.
    public locales: LocaleTexts = {
        playTooltip: '',
        pauseTooltip: '',
        muteTooltip: '',
        unmuteTooltip: '',
        playbackSpeedTooltip: '',
        enterFullscreenTooltip: '',
        leaveFullscreenTooltip: '',
        enterPictureInPictureTooltip: '',
        leavePictureInPictureTooltip: '',
        downloadTooltip: '',
    };

    // Initializes the resources. If no urls are provided, the urls are created from the extension.
    public init(urls?: ResourceUrls, locales?: LocaleTexts) {
        if (!urls) {
            urls = Resources.getExtensionUrls();
        }
        if (!locales) {
            locales = Resources.getLocaleTexts();
        }
        this.urls = urls;
        this.locales = locales;
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

    // Gets the extension locale texts for the extension.
    private static getLocaleTexts(): LocaleTexts {
        return {
            playTooltip: Browser.i18n.getMessage('play_tooltip'),
            pauseTooltip: Browser.i18n.getMessage('pause_tooltip'),
            muteTooltip: Browser.i18n.getMessage('mute_tooltip'),
            unmuteTooltip: Browser.i18n.getMessage('unmute_tooltip'),
            playbackSpeedTooltip: Browser.i18n.getMessage(
                'playback_speed_tooltip'
            ),
            enterFullscreenTooltip: Browser.i18n.getMessage(
                'enter_fullscreen_tooltip'
            ),
            leaveFullscreenTooltip: Browser.i18n.getMessage(
                'leave_fullscreen_tooltip'
            ),
            enterPictureInPictureTooltip: Browser.i18n.getMessage(
                'enter_picture_in_picture_tooltip'
            ),
            leavePictureInPictureTooltip: Browser.i18n.getMessage(
                'leave_picture_in_picture_tooltip'
            ),
            downloadTooltip: Browser.i18n.getMessage('download_tooltip'),
        };
    }
}
