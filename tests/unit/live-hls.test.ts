import{describe,it,expect}from'vitest';import{parseLiveHls,nextLiveSegments,segmentIdentity}from'../../packages/media-core/live-hls';
const url='https://media.example.test/live/index.m3u8';
const playlist=(sequence=0,extra='')=>parseLiveHls(`#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXT-X-MEDIA-SEQUENCE:${sequence}\n${extra}#EXTINF:2,\na.ts?token=a%2Bb\n#EXTINF:2,\nb.ts\n#EXTINF:2,\nc.ts\n`,url);
describe('rolling HLS recording',()=>{
 it('starts at the latest complete segment instead of downloading old DVR content',()=>{const p=playlist(40);expect(p.ended).toBe(false);expect(nextLiveSegments(p)).toEqual([p.segments[2]]);expect(p.segments[0].url).toContain('a.ts?token=a%2Bb');});
 it('returns only new segments without duplicating an overlapping window',()=>{const p=playlist(40),last=p.segments[0];expect(nextLiveSegments(p,40,segmentIdentity(last),0).map(s=>s.sequence)).toEqual([41,42]);expect(nextLiveSegments(p,42,segmentIdentity(p.segments[2]),0)).toEqual([]);});
 it('stops at a missing part of the sliding window',()=>expect(()=>nextLiveSegments(playlist(50),42,'',0)).toThrow('liveGap'));
 it('rejects sequence rollback and changed bytes/URLs instead of mixing versions',()=>{expect(()=>nextLiveSegments(playlist(2),20,'',0)).toThrow('sourceChanged');expect(()=>nextLiveSegments(playlist(2),2,'different',0)).toThrow('sourceChanged');});
 it('rejects discontinuities and explicit gaps after capture begins',()=>{const p=playlist(2,'#EXT-X-DISCONTINUITY\n'),gap=playlist(2,'#EXT-X-GAP\n');expect(()=>nextLiveSegments(p,1,'',0)).toThrow('discontinuity');expect(()=>nextLiveSegments(gap,1,'',0)).toThrow('liveGap');});
 it('resolves byte-range initialization and media without treating init as a timed segment',()=>{const p=parseLiveHls('#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXT-X-MAP:URI="shared.mp4",BYTERANGE="100@0"\n#EXTINF:2,\n#EXT-X-BYTERANGE:300@100\nshared.mp4\n#EXTINF:2,\n#EXT-X-BYTERANGE:200\nshared.mp4\n#EXT-X-ENDLIST',url);expect(p.init?.range).toEqual({start:0,length:100});expect(p.segments.map(s=>s.range)).toEqual([{start:100,length:300},{start:400,length:200}]);expect(p.ended).toBe(true);});
 it.each(['AES-128','SAMPLE-AES'])('refuses %s before requesting a key',method=>expect(()=>playlist(0,`#EXT-X-KEY:METHOD=${method},URI="secret.key"\n`)).toThrow('encrypted'));
 it.each(['#EXT-X-SKIP:SKIPPED-SEGMENTS=2\n','#EXT-X-I-FRAMES-ONLY\n'])('refuses unsupported partial/delta layouts',extra=>expect(()=>playlist(0,extra)).toThrow('liveVariant'));
 it('requires valid target duration and safe sequences',()=>{expect(()=>parseLiveHls('#EXTM3U\n#EXTINF:2,\na.ts',url)).toThrow('invalid');expect(()=>playlist(Number.MAX_SAFE_INTEGER)).toThrow('invalid');});
});
