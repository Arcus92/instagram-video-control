import { VideoController } from './videoController';
import { Utils } from '../../shared/utils';
import { Browser } from '../../shared/browser';
import { Settings } from '../../shared/settings';

// The custom video controller.
export class CustomVideoController extends VideoController {
    //#region Control

    // Created elements by the video controls.
    private playButtonElement: HTMLButtonElement | undefined;
    private seekBarProgressElement: HTMLElement | undefined;
    private positionTextElement: HTMLElement | undefined;
    private muteButtonElement: HTMLButtonElement | undefined;
    private volumeBarElement: HTMLElement | undefined;
    private volumeBarProgressElement: HTMLElement | undefined;
    private fullscreenButtonElement: HTMLButtonElement | undefined;
    private pictureInPictureButtonElement: HTMLButtonElement | undefined;
    private playbackSpeedButtonElement: HTMLButtonElement | undefined;
    private playbackSpeedDropDownElement: HTMLUListElement | undefined;
    private playbackSpeedDropDownItemElement: {
        [speed: number]: HTMLLIElement;
    } = {};

    private readonly playbackSpeeds = [
        0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0,
    ];

    public create() {
        if (!this.videoPlayer.overlayElement) return;
        const video = this.videoElement;

        const controlHeight = 32;

        this.createVideoControlBackground();
        this.adjustVideoControlHeight(controlHeight);

        // Creating the actual player...
        if (!this.videoControlElement) return;

        const contentElement = document.createElement('div');
        contentElement.classList.add('ivc-controls-content');
        this.videoControlElement.appendChild(contentElement);

        // Play button
        this.playButtonElement = document.createElement('button');
        this.playButtonElement.classList.add(
            'ivc-control-element',
            'ivc-icon-button'
        );
        this.playButtonElement.appendChild(document.createElement('img'));
        contentElement.appendChild(this.playButtonElement);

        this.playButtonElement.onclick = () => {
            if (video.paused) {
                video.play().then();
            } else {
                video.pause();
            }
        };

        // Mute
        this.muteButtonElement = document.createElement('button');
        this.muteButtonElement.classList.add(
            'ivc-control-element',
            'ivc-icon-button'
        );
        this.muteButtonElement.appendChild(document.createElement('img'));
        contentElement.appendChild(this.muteButtonElement);

        this.muteButtonElement.onclick = () => {
            video.muted = !video.muted;

            // Fallback when volume is still set to zero
            if (!video.muted && video.volume === 0) {
                video.volume = 0.1;
            }
        };
        this.muteButtonElement.onmouseenter = () => {
            this.setVolumeBarVisibility(true);
        };
        this.muteButtonElement.onmouseleave = () => {
            this.setVolumeBarVisibility(false);
        };

        // Volume
        this.volumeBarElement = document.createElement('div');
        this.volumeBarElement.classList.add(
            'ivc-control-element',
            'ivc-control-bar',
            'ivc-volume-bar',
            'hidden'
        );
        contentElement.appendChild(this.volumeBarElement);

        const elementVolumeBackground = document.createElement('div');
        elementVolumeBackground.classList.add('ivc-control-bar-background');
        this.volumeBarElement.appendChild(elementVolumeBackground);

        this.volumeBarProgressElement = document.createElement('div');
        this.volumeBarProgressElement.classList.add('ivc-control-bar-progress');
        elementVolumeBackground.appendChild(this.volumeBarProgressElement);

        CustomVideoController.addDragEventToBar(
            this.volumeBarElement,
            elementVolumeBackground,
            this.volumeBarProgressElement,
            /* invokeOnDrag */ true,
            (value) => {
                video.volume = value;
                video.muted = video.volume <= 0;
            }
        );
        this.volumeBarElement.onmouseenter = () => {
            this.setVolumeBarVisibility(true);
        };
        this.volumeBarElement.onmouseleave = () => {
            this.setVolumeBarVisibility(false);
        };

        // Position text
        this.positionTextElement = document.createElement('div');
        this.positionTextElement.classList.add(
            'ivc-control-element',
            'ivc-control-text'
        );
        contentElement.appendChild(this.positionTextElement);

        // Seekbar
        const elementSeekbar = document.createElement('div');
        elementSeekbar.classList.add(
            'ivc-control-element',
            'ivc-control-bar',
            'ivc-seek-bar'
        );
        contentElement.appendChild(elementSeekbar);

        const elementSeekbarBackground = document.createElement('div');
        elementSeekbarBackground.classList.add('ivc-control-bar-background');
        elementSeekbar.appendChild(elementSeekbarBackground);

        this.seekBarProgressElement = document.createElement('div');
        this.seekBarProgressElement.classList.add('ivc-control-bar-progress');
        elementSeekbarBackground.appendChild(this.seekBarProgressElement);

        CustomVideoController.addDragEventToBar(
            elementSeekbar,
            elementSeekbarBackground,
            this.seekBarProgressElement,
            /* invokeOnDrag */ false,
            (value) => {
                video.currentTime = value * video.duration;
            }
        );

        // Picture-in-Picture
        this.pictureInPictureButtonElement = document.createElement('button');
        this.pictureInPictureButtonElement.classList.add(
            'ivc-control-element',
            'ivc-icon-button'
        );
        this.pictureInPictureButtonElement.appendChild(
            document.createElement('img')
        );
        contentElement.appendChild(this.pictureInPictureButtonElement);

        this.pictureInPictureButtonElement.onclick = () => {
            if (!this.videoElement) return;

            // Toggle Picture-in-picture
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture().then();
            } else {
                this.videoElement.requestPictureInPicture().then();
            }
        };

        // Playback-speed
        this.playbackSpeedButtonElement = document.createElement('button');
        this.playbackSpeedButtonElement.classList.add(
            'ivc-control-element',
            'ivc-icon-button'
        );
        this.playbackSpeedButtonElement.appendChild(
            document.createElement('img')
        );
        contentElement.appendChild(this.playbackSpeedButtonElement);

        this.playbackSpeedDropDownElement = document.createElement('ul');
        this.playbackSpeedDropDownElement.classList.add(
            'ivc-control-dropdown',
            'hidden'
        );
        this.playbackSpeedButtonElement.appendChild(
            this.playbackSpeedDropDownElement
        );

        this.playbackSpeedDropDownItemElement = {};
        for (const playbackSpeed of this.playbackSpeeds) {
            const playbackSpeedElement = document.createElement('li');
            playbackSpeedElement.textContent = `${playbackSpeed}x`;
            this.playbackSpeedDropDownElement.appendChild(playbackSpeedElement);

            playbackSpeedElement.onclick = () => {
                this.videoElement.playbackRate = playbackSpeed;
            };

            this.playbackSpeedDropDownItemElement[playbackSpeed] =
                playbackSpeedElement;
        }

        this.playbackSpeedButtonElement.onmouseenter = () => {
            this.setPlaybackSpeedVisibility(true);
        };
        this.playbackSpeedButtonElement.onmouseleave = () => {
            this.setPlaybackSpeedVisibility(false);
        };

        // Full screen
        this.fullscreenButtonElement = document.createElement('button');
        this.fullscreenButtonElement.classList.add(
            'ivc-control-element',
            'ivc-icon-button'
        );
        this.fullscreenButtonElement.appendChild(document.createElement('img'));
        contentElement.appendChild(this.fullscreenButtonElement);

        this.fullscreenButtonElement.onclick = () => {
            if (!this.videoPlayer.videoRootElement) return;

            // Toggle fullscreen
            if (document.fullscreenElement) {
                document.exitFullscreen().then();
            } else {
                this.videoPlayer.videoRootElement.requestFullscreen().then();
            }
        };

        // Init update
        this.updatePlayControl();
        this.updatePositionControl();
        this.updateVolumeControl();
        this.updateFullscreenControl();
        this.updatePictureInPictureControl();
        this.updatePlaybackSpeedControl();
        this.updateControlBarVisibility();
    }

    //#endregion Control

    //#region Events

    public override onPlay() {
        this.updatePlayControl();
    }
    public override onPause() {
        this.updatePlayControl();
    }
    public override onTimeUpdate() {
        this.updatePositionControl();
    }
    public override onVolumeChange() {
        this.updateVolumeControl();
    }
    public override onPlaybackSpeedChange() {
        this.updatePlaybackSpeedControl();
    }
    public override onFullscreenChange() {
        this.updateFullscreenControl();
    }
    public override onPictureInPictureChange() {
        this.updatePictureInPictureControl();
    }
    public onUpdateSettings() {
        this.updatePositionControl();
        this.updateFullscreenControl();
        this.updatePictureInPictureControl();
        this.updatePlaybackSpeedControl();
        this.updateControlBarVisibility();
    }

    //#endregion Events

    //#region Update

    private volumeBarDelayTimeout: number = -1;
    private playbackSpeedDelayTimeout: number = -1;

    private updatePlayControl() {
        if (!this.playButtonElement) return;
        CustomVideoController.setButtonIcon(
            this.playButtonElement,
            this.videoElement.paused
                ? CustomVideoController.imagePlay
                : CustomVideoController.imagePause
        );
    }

    private updatePositionControl() {
        if (!this.seekBarProgressElement || !this.positionTextElement) return;

        const progress =
            this.videoElement.currentTime / this.videoElement.duration;
        this.seekBarProgressElement.style.width = `${Math.round(progress * 100)}%`;

        this.positionTextElement.innerText = `${Utils.formatTime(this.videoElement.currentTime)} / ${Utils.formatTime(this.videoElement.duration)}`;

        VideoController.setElementVisibility(
            this.positionTextElement,
            Settings.shared.showTimeCodeText
        );
    }

    private updateVolumeControl() {
        if (!this.muteButtonElement || !this.volumeBarProgressElement) return;
        CustomVideoController.setButtonIcon(
            this.muteButtonElement,
            this.videoElement.muted
                ? CustomVideoController.imageSpeakerOff
                : CustomVideoController.imageSpeakerOn
        );
        this.volumeBarProgressElement.style.width = `${Math.round(this.videoElement.volume * 100)}%`;
    }

    private updateFullscreenControl() {
        if (!this.fullscreenButtonElement) return;
        CustomVideoController.setButtonIcon(
            this.fullscreenButtonElement,
            document.fullscreenElement
                ? CustomVideoController.imageFullscreenExit
                : CustomVideoController.imageFullscreenEnter
        );

        // Only show the fullscreen button if it is available in the current context. It can be disabled by iframes.
        VideoController.setElementVisibility(
            this.fullscreenButtonElement,
            document.fullscreenEnabled && Settings.shared.showFullscreenButton
        );
    }

    private updatePictureInPictureControl() {
        if (!this.pictureInPictureButtonElement) return;
        CustomVideoController.setButtonIcon(
            this.pictureInPictureButtonElement,
            document.pictureInPictureElement
                ? CustomVideoController.imagePictureInPictureExit
                : CustomVideoController.imagePictureInPictureEnter
        );

        // Only show the PiP button if it is available in the current context. It is not available in Firefox!
        VideoController.setElementVisibility(
            this.pictureInPictureButtonElement,
            document.pictureInPictureEnabled &&
                Settings.shared.showPictureInPictureButton
        );
    }

    private updatePlaybackSpeedControl() {
        if (!this.playbackSpeedButtonElement) return;
        CustomVideoController.setButtonIcon(
            this.playbackSpeedButtonElement,
            CustomVideoController.imagePlaybackSpeed
        );

        VideoController.setElementVisibility(
            this.playbackSpeedButtonElement,
            Settings.shared.showPlaybackSpeedOption
        );

        // Update the dropdown items
        for (const playbackSpeed of this.playbackSpeeds) {
            const element =
                this.playbackSpeedDropDownItemElement[playbackSpeed];
            if (!element) continue;
            element.classList.toggle(
                'active',
                playbackSpeed === this.videoElement.playbackRate
            );
        }
    }

    protected setVisibility(visibility: boolean) {
        if (!this.videoControlElement) return;
        this.videoControlElement.classList.toggle('hidden', !visibility);
    }

    private setVolumeBarVisibility(visibility: boolean) {
        if (!this.volumeBarElement) return;

        if (visibility) {
            clearTimeout(this.volumeBarDelayTimeout);
            this.volumeBarElement.classList.toggle('hidden', false);
        } else {
            this.volumeBarDelayTimeout = setTimeout(() => {
                if (!this.volumeBarElement) return;
                this.volumeBarElement.classList.toggle('hidden', true);
            }, 400);
        }
    }

    private setPlaybackSpeedVisibility(visibility: boolean) {
        if (!this.playbackSpeedDropDownElement) return;

        if (visibility) {
            clearTimeout(this.playbackSpeedDelayTimeout);
            this.playbackSpeedDropDownElement.classList.toggle('hidden', false);
        } else {
            this.playbackSpeedDelayTimeout = setTimeout(() => {
                if (!this.playbackSpeedDropDownElement) return;
                this.playbackSpeedDropDownElement.classList.toggle(
                    'hidden',
                    true
                );
            }, 400);
        }
    }

    //#endregion Update

    //#region Resources

    // Cache of the created image tags for the icons.
    private static imagePlay = Browser.getUrl('images/play.svg');
    private static imagePause = Browser.getUrl('images/pause.svg');
    private static imageFullscreenEnter = Browser.getUrl(
        'images/fullscreen-enter.svg'
    );
    private static imageFullscreenExit = Browser.getUrl(
        'images/fullscreen-exit.svg'
    );
    private static imageSpeakerOn = Browser.getUrl('images/speaker-on.svg');
    private static imageSpeakerOff = Browser.getUrl('images/speaker-off.svg');
    private static imagePictureInPictureEnter = Browser.getUrl(
        'images/picture-in-picture-enter.svg'
    );
    private static imagePictureInPictureExit = Browser.getUrl(
        'images/picture-in-picture-exit.svg'
    );
    private static imagePlaybackSpeed = Browser.getUrl(
        'images/playback-speed.svg'
    );

    //#endregion Resources

    //#region Utils

    // Changes the icon of a button containing an image element.
    private static setButtonIcon(button: HTMLButtonElement, url: string) {
        const img = button.firstChild as HTMLImageElement;
        if (!img) return;
        img.src = url;
    }

    // Handles click and drag events to the bars elements (e.g. seekbar, volume bar).
    private static addDragEventToBar(
        element: HTMLElement,
        elementBackground: HTMLElement,
        elementProgress: HTMLElement,
        invokeOnDrag: boolean,
        callback: (value: number) => void
    ) {
        // Sub function to submit the current bar value
        const onValueChanged = (
            event: MouseEvent | TouchEvent,
            invoke: boolean
        ) => {
            const rect = elementBackground.getBoundingClientRect();

            const clientX =
                event instanceof MouseEvent
                    ? event.clientX
                    : event.changedTouches[0].clientX;
            const relativeX = clientX - rect.left;
            const value = Math.max(Math.min(relativeX / rect.width, 1), 0);

            elementProgress.style.width = `${Math.round(value * 100)}%`;

            if (invoke) callback(value);
        };

        // Handle click event

        element.addEventListener('click', (event) => {
            onValueChanged(event, true);
        });

        // Handle drag event

        let isDragging = false;
        const onDragStart = () => {
            isDragging = true;
        };
        const onDragEnd = (event: MouseEvent | TouchEvent) => {
            if (!isDragging) return;
            onValueChanged(event, true);
            isDragging = false;
        };
        const onDrag = (event: MouseEvent | TouchEvent) => {
            if (!isDragging) return;
            onValueChanged(event, invokeOnDrag);
        };

        element.addEventListener('mousedown', onDragStart);
        element.addEventListener('touchstart', onDragStart);

        element.addEventListener('mousemove', onDrag);
        element.addEventListener('touchmove', onDrag);

        element.addEventListener('mouseup', onDragEnd);
        element.addEventListener('touchend', onDragEnd);
        element.addEventListener('mouseleave', onDragEnd);
    }

    //#endregion Utils
}
