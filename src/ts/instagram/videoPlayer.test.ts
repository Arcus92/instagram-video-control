import { TextDecoder, TextEncoder } from 'util';
Object.assign(global, { TextDecoder, TextEncoder });
// This fixes JSDOM

import { describe, expect, jest, test } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { VideoPlayer } from './videoPlayer';
import { VideoAutoplayMode } from '../shared/videoAutoplayMode';
import { Settings } from '../shared/settings';

describe('videoPlayer', () => {
    test('autoplay disabled resets initial playback but preserves later seek position', () => {
        const dom = new JSDOM('<video></video>');
        const video = dom.window.document.querySelector(
            'video'
        ) as HTMLVideoElement;
        const player = new VideoPlayer({} as never, video);
        const checkAutoplay = (
            player as unknown as { checkAutoplay: () => void }
        ).checkAutoplay.bind(player);

        (Settings.shared as unknown as { _autoplayMode: VideoAutoplayMode })
            ._autoplayMode = VideoAutoplayMode.stopped;
        video.pause = jest.fn();
        video.currentTime = 12;

        checkAutoplay();

        expect(video.pause).toHaveBeenCalledTimes(1);
        expect(video.currentTime).toBe(0);

        video.currentTime = 7;

        checkAutoplay();

        expect(video.pause).toHaveBeenCalledTimes(2);
        expect(video.currentTime).toBe(7);
    });
});
