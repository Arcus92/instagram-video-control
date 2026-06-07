import { TextDecoder, TextEncoder } from 'util';
Object.assign(global, { TextDecoder, TextEncoder });
// This fixes JSDOM

import { describe, expect, test } from '@jest/globals';
import { VideoDetector } from './videoDetector';
import { JSDOM } from 'jsdom';
import { VideoType } from './videoType';
import { VideoDetectionVersion } from '../shared/videoDetectionVersion';

describe('videoDetector', () => {
    test('detect video elements in Reels', async () => {
        const dom = await JSDOM.fromFile('tests/data/reel.html');
        const videoDetector = new VideoDetector();
        const video = dom.window.document.getElementsByTagName('video')[0];
        const player = videoDetector.createVideoPlayer(
            video,
            VideoDetectionVersion.latest
        );
        expect(player.videoType).toBe(VideoType.reel);
    });

    test('detect video elements in Reels on mobile', async () => {
        const dom = await JSDOM.fromFile('tests/data/reel-mobile.html');
        const videoDetector = new VideoDetector();
        const video = dom.window.document.getElementsByTagName('video')[0];
        const player = videoDetector.createVideoPlayer(
            video,
            VideoDetectionVersion.latest
        );
        expect(player.videoType).toBe(VideoType.reel);
    });

    test('detect video elements in Post', async () => {
        const dom = await JSDOM.fromFile('tests/data/story.html');
        const videoDetector = new VideoDetector();
        const video = dom.window.document.getElementsByTagName('video')[0];
        const player = videoDetector.createVideoPlayer(
            video,
            VideoDetectionVersion.latest
        );
        expect(player.videoType).toBe(VideoType.story);
    });

    test('detect video elements in Post popup', async () => {
        const dom = await JSDOM.fromFile('tests/data/post.html');
        const videoDetector = new VideoDetector();
        const video = dom.window.document.getElementsByTagName('video')[0];
        const player = videoDetector.createVideoPlayer(
            video,
            VideoDetectionVersion.latest
        );
        expect(player.videoType).toBe(VideoType.post);
    });

    test('detect feed video wrapped in media link as Post', async () => {
        const dom = await JSDOM.fromFile(
            'tests/data/home-feed-post-link-wrapper.html'
        );
        const videoDetector = new VideoDetector();
        const video = dom.window.document.getElementsByTagName('video')[0];
        const player = videoDetector.createVideoPlayer(
            video,
            VideoDetectionVersion.latest
        );
        expect(player.videoType).toBe(VideoType.post);
    });

    test('detect separate video elements with the same source', () => {
        const dom = new JSDOM(`
            <video src="blob:https://www.instagram.com/shared"></video>
            <video src="blob:https://www.instagram.com/shared"></video>
        `);
        Object.assign(global, { document: dom.window.document });

        const videoDetector = new VideoDetector();
        const attachedVideos: HTMLVideoElement[] = [];
        videoDetector.createVideoPlayer = (video: HTMLVideoElement) =>
            ({
                videoElement: video,
                attach: () => attachedVideos.push(video),
            }) as never;

        const videos = dom.window.document.getElementsByTagName('video');
        videoDetector.detectAddedVideoElement(videos[0]);
        videoDetector.detectAddedVideoElement(videos[1]);

        expect(attachedVideos).toEqual([videos[0], videos[1]]);
    });
});
