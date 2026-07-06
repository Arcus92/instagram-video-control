// This script is injected into the original Instagram DOM. The extension shadow DOM cannot see changes made by
// Instagram itself. This creates an observer that listens for new or removed video elements and tells the extension to
// run the detection code again.
// This creates a more responsive result than just scanning for video elements every second.
// There is more room for optimization, currently we cannot pass the element references into the shadow DOM. An idea is
// to run the whole extension in the original DOM and create an interface to exchange the extension settings.

import { VideoDetector } from './videoDetector';

const detector = new VideoDetector();
detector.init().then();
