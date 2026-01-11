import { VideoDetector } from './videoDetector';

// Modules are in webpack aren't ready on start-up, so setTimeout is needed to wait a tick.
setTimeout(() => {
    const detector = new VideoDetector();
    detector.init().then();
});
