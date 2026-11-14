import { describe, it, expect } from 'vitest';
import { parseHls } from '../../packages/media-core/hls';
import { parseDash } from '../../packages/media-core/dash';
import { blocked, cleanName, cleanFolder, publicMetadata, safeUrl, transitions, type Task } from '../../packages/contracts';
import { matchesOrigin } from '../../packages/media-core/network';
const base='https://media.example.test/path/master.m3u8?signature=secret';
describe('HLS safety and media identity',()=>{
  it('resolves signed variants without changing query parameters',()=>{const result=parseHls('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1920x1080\n../high.m3u8?token=a%2Bb\n',base);expect(result.variants[0]).toMatchObject({height:1080,url:'https://media.example.test/high.m3u8?token=a%2Bb'});});
  it('retains external audio rendition and relative map',()=>{const result=parseHls('#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",URI="audio.m3u8",DEFAULT=YES\n#EXT-X-STREAM-INF:BANDWIDTH=100,AUDIO="a"\nvideo.m3u8',base);expect(result.variants[0]?.audioUrl).toBe('https://media.example.test/path/audio.m3u8');});
  it('handles byte ranges on a single resource',()=>{const result=parseHls('#EXTM3U\n#EXTINF:2,\n#EXT-X-BYTERANGE:100@20\nfile.mp4\n#EXTINF:2,\n#EXT-X-BYTERANGE:80\nfile.mp4\n#EXT-X-ENDLIST',base);expect(result.track?.segments.map(s=>s.range)).toEqual([{start:20,length:100},{start:120,length:80}]);});
  it('refuses implicit ranges on a different resource',()=>expect(()=>parseHls('#EXTM3U\n#EXT-X-BYTERANGE:100@0\na.mp4\n#EXT-X-BYTERANGE:10\nb.mp4\n#EXT-X-ENDLIST',base)).toThrow('invalid'));
  it.each(['AES-128','SAMPLE-AES'])('refuses %s before fetching any keys',method=>expect(()=>parseHls(`#EXTM3U\n#EXT-X-KEY:METHOD=${method},URI="private.key"\n#EXTINF:1,\na.ts\n#EXT-X-ENDLIST`,base)).toThrow('encrypted'));
  it('distinguishes a sliding live window from VOD',()=>expect(()=>parseHls('#EXTM3U\n#EXTINF:2,\na.ts',base)).toThrow('live'));
  it('rejects gaps rather than silently claiming a complete file',()=>expect(()=>parseHls('#EXTM3U\n#EXT-X-GAP\n#EXTINF:2,\na.ts\n#EXT-X-ENDLIST',base)).toThrow('discontinuity'));
});
describe('DASH expansion',()=>{
  const xml=(body:string)=>`<MPD mediaPresentationDuration="PT6S"><Period><AdaptationSet contentType="video"><Representation id="v" height="720">${body}</Representation></AdaptationSet></Period></MPD>`;
  it('decodes XML URL separators exactly once without rewriting signed query bytes',()=>{
    const result=parseDash(xml('<BaseURL>https://cdn.test/stream?signature=a%2Bb%2F&amp;id=v&amp;literal=&amp;amp;</BaseURL><SegmentBase indexRange="10-19"><Initialization range="0-9"/></SegmentBase>'),base);
    expect(result.plan.tracks[0]?.segments[0]?.url).toBe('https://cdn.test/stream?signature=a%2Bb%2F&id=v&literal=&amp;');
    const template=parseDash(xml('<SegmentTemplate duration="2" media="$Number$.m4s?sig=a%2Bb&amp;id=v"/>'),base);
    expect(template.plan.tracks[0]?.segments[0]?.url).toBe('https://media.example.test/path/1.m4s?sig=a%2Bb&id=v');
  });
  it('expands timelines and formatted numbers',()=>{const result=parseDash(xml('<SegmentTemplate initialization="init-$RepresentationID$.mp4" media="$Number%05d$-$Time$.m4s"><SegmentTimeline><S t="10" d="2" r="2"/></SegmentTimeline></SegmentTemplate>'),base);expect(result.plan.tracks[0]?.segments.map(s=>s.url.split('/').pop())).toEqual(['init-v.mp4','00001-10.m4s','00002-12.m4s','00003-14.m4s']);});
  it('expands duration templates',()=>expect(parseDash(xml('<SegmentTemplate duration="2" timescale="1" media="$Number$.m4s"/>'),base).plan.tracks[0]?.segments).toHaveLength(3));
  it('rejects multi-period manifests explicitly',()=>expect(()=>parseDash('<MPD><Period/><Period/></MPD>',base)).toThrow('periods'));
  it('rejects DRM descriptors',()=>expect(()=>parseDash(xml('<ContentProtection schemeIdUri="urn:mpeg:dash:mp4protection:2011"/>'),base)).toThrow('encrypted'));
  it('rejects entity declarations',()=>expect(()=>parseDash('<!DOCTYPE MPD [<!ENTITY x SYSTEM "file:///etc/passwd">]><MPD/>',base)).toThrow('invalid'));
  it('bounds malicious repeat counts',()=>expect(()=>parseDash(xml('<SegmentTemplate media="$Number$.m4s"><SegmentTimeline><S d="1" r="1000000"/></SegmentTimeline></SegmentTemplate>'),base)).toThrow('manifestLimit'));
});
describe('contracts and privacy',()=>{
  it('matches Chrome host grants which omit the source port',()=>{expect(matchesOrigin(new URL('http://127.0.0.1:4179/x'),['http://127.0.0.1/*'])).toBe(true);expect(matchesOrigin(new URL('https://badexample.test/x'),['https://*.example.test/*'])).toBe(false);});
  it.each(['blob:https://example.test/123','javascript:alert(1)','file:///tmp/a','https://a:b@example.test/a','https://r3.googlevideo.com/a','https://www.youtube.com/watch?v=x'])('refuses unsupported source %s',url=>expect(()=>safeUrl(url)).toThrow());
  it('accepts signed media URLs without normalization of token bytes',()=>expect(safeUrl('https://example.test/a.mp4?signature=a%2Bb')).toContain('signature=a%2Bb'));
  it('sanitizes Windows names and traversal',()=>{expect(cleanName('CON')).toBe('_CON');expect(cleanFolder('../../videos\\..\\course')).toBe('videos/course');expect(cleanName('a:b/c?\u202e.mp4')).toBe('a_b_c__.mp4');});
  it('matches explicit host patterns',()=>{expect(blocked('cdn.example.test',['*.example.test'])).toBe(true);expect(blocked('notexample.test',['*.example.test'])).toBe(false);});
  it('does not export URLs, paths, tokens, download ids or checkpoints',()=>{const data=publicMetadata([{title:'course',createdAt:1,media:{url:'https://x/?secret=abc'},downloadId:3,filename:'private',checkpoints:{token:'secret'}} as unknown as Task]);expect(JSON.stringify(data)).not.toMatch(/secret|private|downloadId|checkpoints|https/);});
  it('requires validation before completion and forbids resurrecting completed jobs',()=>{expect(transitions.fetching).not.toContain('completed');expect(transitions.validating).toContain('completed');expect(transitions.completed).toEqual([]);});
});
