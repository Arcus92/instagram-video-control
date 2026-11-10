import { describe, expect, test } from '@jest/globals';
import { VideoQualityFilter } from './videoQualityFilter';
import { VideoQualityMode } from '../shared/videoQualityMode';

const manifest = `<?xml version="1.0"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011">
    <Period>
        <AdaptationSet contentType="video">
            <Representation id="240" mimeType="video/mp4" width="720" height="1280" bandwidth="234846" />
            <Representation id="720" mimeType="video/mp4" width="720" height="1280" bandwidth="1931029" />
            <Representation id="1080" mimeType="video/mp4" width="1080" height="1920" bandwidth="4220138" />
            <Representation id="960" mimeType="video/mp4" width="1080" height="1920" bandwidth="2796375" />
        </AdaptationSet>
        <AdaptationSet contentType="audio">
            <Representation id="audio-low" mimeType="audio/mp4" bandwidth="48000" />
            <Representation id="audio-high" mimeType="audio/mp4" bandwidth="84177" />
        </AdaptationSet>
    </Period>
</MPD>`;

function filter(xml: string, mode: VideoQualityMode): string[] {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    VideoQualityFilter.filterManifest(doc, mode);
    return Array.from(doc.getElementsByTagName('Representation')).map(
        (representation) => representation.getAttribute('id') ?? ''
    );
}

describe('VideoQualityFilter', () => {
    test('keeps all qualities in auto mode', () => {
        expect(filter(manifest, VideoQualityMode.auto)).toEqual([
            '240',
            '720',
            '1080',
            '960',
            'audio-low',
            'audio-high',
        ]);
    });

    test('keeps only the highest video quality', () => {
        expect(filter(manifest, VideoQualityMode.highest)).toEqual([
            '1080',
            'audio-low',
            'audio-high',
        ]);
    });

    test('keeps only the lowest video quality', () => {
        expect(filter(manifest, VideoQualityMode.lowest)).toEqual([
            '240',
            'audio-low',
            'audio-high',
        ]);
    });

    test('ignores documents that are not a manifest', () => {
        const xml =
            '<root><AdaptationSet><Representation id="a" width="1" height="1" /><Representation id="b" width="2" height="2" /></AdaptationSet></root>';
        expect(filter(xml, VideoQualityMode.highest)).toEqual(['a', 'b']);
    });
});
