import { Settings } from '../shared/settings';
import { VideoQualityMode } from '../shared/videoQualityMode';

export class VideoQualityFilter {
    private constructor() {}

    private static installed = false;

    // Must run before Instagram parses the first video manifest.
    public static install() {
        if (this.installed) return;
        this.installed = true;

        const parseFromString = DOMParser.prototype.parseFromString;
        DOMParser.prototype.parseFromString = function (
            this: DOMParser,
            ...args: Parameters<DOMParser['parseFromString']>
        ) {
            const doc = parseFromString.apply(this, args);
            try {
                VideoQualityFilter.filterManifest(
                    doc,
                    Settings.shared.videoQuality
                );
            } catch (ex) {
                console.error(
                    '[VideoControlInstagram] Unable to filter video qualities',
                    ex
                );
            }
            return doc;
        };
    }

    public static filterManifest(doc: Document, mode: VideoQualityMode) {
        if (mode === VideoQualityMode.auto) return;
        if (doc.documentElement?.localName !== 'MPD') return;

        for (const adaptationSet of doc.getElementsByTagName('AdaptationSet')) {
            const representations = Array.from(
                adaptationSet.getElementsByTagName('Representation')
            ).filter((representation) => this.isVideo(representation));
            if (representations.length < 2) continue;

            representations.sort((a, b) => this.compareQuality(a, b));
            const keep =
                mode === VideoQualityMode.highest
                    ? representations[representations.length - 1]
                    : representations[0];

            for (const representation of representations) {
                if (representation !== keep) representation.remove();
            }
        }
    }

    // Audio tracks live in the same manifest and must never be removed.
    private static isVideo(representation: Element): boolean {
        const mimeType =
            representation.getAttribute('mimeType') ??
            representation.parentElement?.getAttribute('mimeType');
        if (mimeType) return mimeType.startsWith('video/');
        return representation.hasAttribute('width');
    }

    private static compareQuality(a: Element, b: Element): number {
        const pixels = this.pixelCount(a) - this.pixelCount(b);
        if (pixels !== 0) return pixels;
        return (
            this.numberAttribute(a, 'bandwidth') -
            this.numberAttribute(b, 'bandwidth')
        );
    }

    private static pixelCount(representation: Element): number {
        return (
            this.numberAttribute(representation, 'width') *
            this.numberAttribute(representation, 'height')
        );
    }

    private static numberAttribute(element: Element, name: string): number {
        const value = Number(element.getAttribute(name));
        return Number.isFinite(value) ? value : 0;
    }
}
