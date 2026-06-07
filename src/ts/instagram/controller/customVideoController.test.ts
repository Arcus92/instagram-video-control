import { TextDecoder, TextEncoder } from 'util';
Object.assign(global, { TextDecoder, TextEncoder });
// This fixes JSDOM

import { describe, expect, jest, test } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { CustomVideoController } from './customVideoController';

describe('customVideoController', () => {
    test('seek bar events do not bubble to Instagram link handlers', () => {
        const dom = new JSDOM(`
            <a href="/p/example/">
                <div id="bar">
                    <div id="background">
                        <div id="progress"></div>
                    </div>
                </div>
            </a>
        `);
        Object.assign(global, {
            document: dom.window.document,
            MouseEvent: dom.window.MouseEvent,
            TouchEvent: dom.window.TouchEvent,
        });

        const link = dom.window.document.querySelector('a') as HTMLAnchorElement;
        const bar = dom.window.document.getElementById('bar') as HTMLElement;
        const background = dom.window.document.getElementById(
            'background'
        ) as HTMLElement;
        const progress = dom.window.document.getElementById(
            'progress'
        ) as HTMLElement;
        let linkClicks = 0;

        background.getBoundingClientRect = () =>
            ({
                left: 0,
                width: 100,
            }) as DOMRect;
        link.addEventListener('click', () => {
            linkClicks++;
        });

        (
            CustomVideoController as unknown as {
                addDragEventToBar: (
                    element: HTMLElement,
                    elementBackground: HTMLElement,
                    elementProgress: HTMLElement,
                    invokeOnDrag: boolean,
                    callback: (value: number) => void
                ) => void;
            }
        ).addDragEventToBar(bar, background, progress, false, () => {});

        bar.dispatchEvent(
            new dom.window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                clientX: 50,
            })
        );

        expect(linkClicks).toBe(0);
    });

    test('seek bar pointer events do not bubble to Instagram link handlers', () => {
        const dom = new JSDOM(`
            <a href="/p/example/">
                <div id="bar">
                    <div id="background">
                        <div id="progress"></div>
                    </div>
                </div>
            </a>
        `);
        Object.assign(global, {
            document: dom.window.document,
            MouseEvent: dom.window.MouseEvent,
            TouchEvent: dom.window.TouchEvent,
        });

        const link = dom.window.document.querySelector('a') as HTMLAnchorElement;
        const bar = dom.window.document.getElementById('bar') as HTMLElement;
        const background = dom.window.document.getElementById(
            'background'
        ) as HTMLElement;
        const progress = dom.window.document.getElementById(
            'progress'
        ) as HTMLElement;
        let linkPointerDowns = 0;

        background.getBoundingClientRect = () =>
            ({
                left: 0,
                width: 100,
            }) as DOMRect;
        link.addEventListener('pointerdown', () => {
            linkPointerDowns++;
        });

        (
            CustomVideoController as unknown as {
                addDragEventToBar: (
                    element: HTMLElement,
                    elementBackground: HTMLElement,
                    elementProgress: HTMLElement,
                    invokeOnDrag: boolean,
                    callback: (value: number) => void
                ) => void;
            }
        ).addDragEventToBar(bar, background, progress, false, () => {});

        bar.dispatchEvent(
            new dom.window.Event('pointerdown', {
                bubbles: true,
                cancelable: true,
            })
        );

        expect(linkPointerDowns).toBe(0);
    });

    test('control event shield does not block seek bar callback', () => {
        const dom = new JSDOM(`
            <a href="/p/example/">
                <div id="content">
                    <div id="bar">
                        <div id="background">
                            <div id="progress"></div>
                        </div>
                    </div>
                </div>
            </a>
        `);
        Object.assign(global, {
            document: dom.window.document,
            MouseEvent: dom.window.MouseEvent,
            TouchEvent: dom.window.TouchEvent,
        });

        const content = dom.window.document.getElementById(
            'content'
        ) as HTMLElement;
        const bar = dom.window.document.getElementById('bar') as HTMLElement;
        const background = dom.window.document.getElementById(
            'background'
        ) as HTMLElement;
        const progress = dom.window.document.getElementById(
            'progress'
        ) as HTMLElement;
        const callbackValues: number[] = [];

        background.getBoundingClientRect = () =>
            ({
                left: 0,
                width: 100,
            }) as DOMRect;

        (
            CustomVideoController as unknown as {
                addControlEventShield: (element: HTMLElement) => void;
                addDragEventToBar: (
                    element: HTMLElement,
                    elementBackground: HTMLElement,
                    elementProgress: HTMLElement,
                    invokeOnDrag: boolean,
                    callback: (value: number) => void
                ) => void;
            }
        ).addControlEventShield(content);
        (
            CustomVideoController as unknown as {
                addDragEventToBar: (
                    element: HTMLElement,
                    elementBackground: HTMLElement,
                    elementProgress: HTMLElement,
                    invokeOnDrag: boolean,
                    callback: (value: number) => void
                ) => void;
            }
        ).addDragEventToBar(bar, background, progress, false, (value) =>
            callbackValues.push(value)
        );

        bar.dispatchEvent(
            new dom.window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                clientX: 50,
            })
        );

        expect(callbackValues).toEqual([0.5]);
    });

    test('document event guard prevents default without blocking seek bar callback', () => {
        const dom = new JSDOM(`
            <a href="/p/example/">
                <div id="content" class="ivc-controls-content">
                    <div id="bar">
                        <div id="background">
                            <div id="progress"></div>
                        </div>
                    </div>
                </div>
            </a>
        `);
        Object.assign(global, {
            document: dom.window.document,
            MouseEvent: dom.window.MouseEvent,
            TouchEvent: dom.window.TouchEvent,
        });

        const bar = dom.window.document.getElementById('bar') as HTMLElement;
        const background = dom.window.document.getElementById(
            'background'
        ) as HTMLElement;
        const progress = dom.window.document.getElementById(
            'progress'
        ) as HTMLElement;
        const callbackValues: number[] = [];

        background.getBoundingClientRect = () =>
            ({
                left: 0,
                width: 100,
            }) as DOMRect;

        (
            CustomVideoController as unknown as {
                addDocumentControlEventGuard: () => void;
                addDragEventToBar: (
                    element: HTMLElement,
                    elementBackground: HTMLElement,
                    elementProgress: HTMLElement,
                    invokeOnDrag: boolean,
                    callback: (value: number) => void
                ) => void;
            }
        ).addDocumentControlEventGuard();
        (
            CustomVideoController as unknown as {
                addDragEventToBar: (
                    element: HTMLElement,
                    elementBackground: HTMLElement,
                    elementProgress: HTMLElement,
                    invokeOnDrag: boolean,
                    callback: (value: number) => void
                ) => void;
            }
        ).addDragEventToBar(bar, background, progress, false, (value) =>
            callbackValues.push(value)
        );

        const event = new dom.window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: 50,
        });
        bar.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(callbackValues).toEqual([0.5]);
    });

    test('seek helper marks user interaction and seeks when duration is valid', () => {
        const video = {
            duration: 20,
            currentTime: 0,
            paused: false,
            dispatchEvent: jest.fn(),
        } as unknown as HTMLVideoElement;
        const interactions: string[] = [];
        const videoPlayer = {
            setUserInteractedWithVideo: () => interactions.push('seek'),
        };

        (
            CustomVideoController as unknown as {
                seekVideo: (
                    videoPlayer: { setUserInteractedWithVideo: () => void },
                    video: HTMLVideoElement,
                    value: number
                ) => void;
            }
        ).seekVideo(videoPlayer, video, 0.25);

        expect(interactions).toEqual(['seek']);
        expect(video.currentTime).toBe(5);
    });

    test('seek helper nudges paused video to decode selected frame', async () => {
        const pause = jest.fn();
        const play = jest.fn<() => Promise<void>>().mockResolvedValue();
        const video = {
            duration: 20,
            currentTime: 0,
            paused: true,
            play,
            pause,
            dispatchEvent: jest.fn(),
        } as unknown as HTMLVideoElement;
        const videoPlayer = {
            setUserInteractedWithVideo: jest.fn(),
        };

        (
            CustomVideoController as unknown as {
                seekVideo: (
                    videoPlayer: { setUserInteractedWithVideo: () => void },
                    video: HTMLVideoElement,
                    value: number
                ) => void;
            }
        ).seekVideo(videoPlayer, video, 0.25);

        await Promise.resolve();

        expect(video.currentTime).toBe(5);
        expect(play).toHaveBeenCalledTimes(1);
        expect(pause).toHaveBeenCalledTimes(1);
    });

    test('seek helper ignores invalid duration', () => {
        const video = {
            duration: Number.NaN,
            currentTime: 3,
            paused: true,
            play: jest.fn(),
            dispatchEvent: jest.fn(),
        } as unknown as HTMLVideoElement;
        const interactions: string[] = [];
        const videoPlayer = {
            setUserInteractedWithVideo: () => interactions.push('seek'),
        };

        (
            CustomVideoController as unknown as {
                seekVideo: (
                    videoPlayer: { setUserInteractedWithVideo: () => void },
                    video: HTMLVideoElement,
                    value: number
                ) => void;
            }
        ).seekVideo(videoPlayer, video, 0.25);

        expect(interactions).toEqual([]);
        expect(video.currentTime).toBe(3);
    });
});
