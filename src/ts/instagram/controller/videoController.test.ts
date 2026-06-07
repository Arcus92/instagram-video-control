import { TextDecoder, TextEncoder } from 'util';
Object.assign(global, { TextDecoder, TextEncoder });
// This fixes JSDOM

import { describe, expect, test } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { VideoController } from './videoController';
import { VideoType } from '../videoType';

class TestVideoController extends VideoController {
    public createWithPortal(portal: boolean) {
        this.createVideoControlBackground(portal);
        return this.videoControlElement;
    }

    public create() {}
    public onPlay() {}
    public onPause() {}
    public onTimeUpdate() {}
    public onVolumeChange() {}
    public onPlaybackSpeedChange() {}
    public onFullscreenChange() {}
    public onPictureInPictureChange() {}
    public onUpdateSettings() {}
    protected setVisibility() {}
}

describe('videoController', () => {
    test('can create controls outside the Instagram overlay subtree', () => {
        const dom = new JSDOM(`
            <body>
                <a id="instagram-link" href="/p/example/">
                    <div id="overlay"></div>
                </a>
                <video></video>
            </body>
        `);
        Object.assign(global, {
            document: dom.window.document,
            window: dom.window,
        });

        const overlay = dom.window.document.getElementById(
            'overlay'
        ) as HTMLElement;
        const video = dom.window.document.querySelector(
            'video'
        ) as HTMLVideoElement;
        const controller = new TestVideoController({
            overlayElement: overlay,
            videoElement: video,
            videoType: VideoType.post,
        } as never);

        const controls = controller.createWithPortal(true);
        let parent = controls?.parentElement;
        let isInsideOverlay = false;
        while (parent) {
            if (parent.id === 'overlay') {
                isInsideOverlay = true;
                break;
            }
            parent = parent.parentElement;
        }

        expect(controls).toBeDefined();
        expect(controls?.parentElement?.tagName).toBe('BODY');
        expect(isInsideOverlay).toBe(false);
    });
});
