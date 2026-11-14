import {describe,it,expect} from 'vitest';
import {parseHls} from '../../packages/media-core/hls';
import {fragmentUrls,withoutFragments} from '../../packages/media-core/segmented-sources';
import {streamWarning} from '../../packages/media-core/media-logs';
import type {Media} from '../../packages/contracts';
const base='https://cdn.test/index.m3u8';
describe('segmented source identity',()=>{
  const segment='https://cdn.test/abc.mp4?signature=x%2By';
  const media:Media={id:'direct',tabId:1,pageUrl:'https://page.test/',title:'Lesson',kind:'direct',url:segment,variants:[{id:'v',url:segment,label:''}]};
  it('excludes only confirmed fragment URLs, retaining the manifest and unrelated videos',()=>{
    const assets=fragmentUrls([{url:segment}],[]);const full={...media,id:'full',url:'https://cdn.test/full.mp4',variants:[{...media.variants[0]!,url:'https://cdn.test/full.mp4'}]};const hls:Media={...media,id:'hls',kind:'hls',url:base,variants:[{id:'playlist',url:base,label:'720p'}]};
    expect(withoutFragments([media,full,hls],assets).map(m=>m.id)).toEqual(['full','hls']);expect(assets).toContain(segment);expect(withoutFragments([{...media,variants:[{...media.variants[0]!,url:'https://cdn.test/target',sourceUrls:[segment]}]}],assets)).toEqual([]);
  });
  it('bounds cache size and prioritizes candidates already observed on the page',()=>{
    const segments=Array.from({length:5000},(_,i)=>({url:`https://cdn.test/${i}.mp4`}));const assets=fragmentUrls(segments,[],[segments[4999]!.url]);expect(assets).toHaveLength(4096);expect(assets).toContain(segments[4999]!.url);expect(fragmentUrls([{url:'x'.repeat(262145)}],[])).toEqual([]);
  });
});
describe('HLS initialization byte ranges',()=>{
  it('reconstructs init and media ranges from one signed MP4 URL',()=>{
    const parsed=parseHls('#EXTM3U\n#EXT-X-MAP:URI="shared.mp4?signature=a%2Bb",BYTERANGE="100@0"\n#EXTINF:2,\n#EXT-X-BYTERANGE:300@100\nshared.mp4?signature=a%2Bb\n#EXTINF:2,\n#EXT-X-BYTERANGE:200\nshared.mp4?signature=a%2Bb\n#EXT-X-ENDLIST',base);expect(parsed.track?.segments.map(s=>s.range)).toEqual([{start:0,length:100},{start:100,length:300},{start:400,length:200}]);expect(parsed.track?.segments.every(s=>s.url.endsWith('?signature=a%2Bb'))).toBe(true);
  });
  it.each(['5','0@0','1@-1','9007199254740991@1'])('refuses an ambiguous or invalid init range %s',range=>expect(()=>parseHls(`#EXTM3U\n#EXT-X-MAP:URI="a.mp4",BYTERANGE="${range}"\n#EXTINF:2,\na.mp4\n#EXT-X-ENDLIST`,base)).toThrow('invalid'));
  it('refuses changed initialization data instead of mixing tracks',()=>expect(()=>parseHls('#EXTM3U\n#EXT-X-MAP:URI="a.mp4",BYTERANGE="10@0"\n#EXTINF:2,\na.mp4\n#EXT-X-MAP:URI="a.mp4",BYTERANGE="20@0"\n#EXTINF:2,\na.mp4\n#EXT-X-ENDLIST',base)).toThrow('discontinuity'));
});
describe('MPEG-TS warning identity',()=>{
  it('recognizes the exact metadata warning and distinguishes unsupported codecs',()=>{expect(streamWarning(['Note: MPEG-TS streams with stream_type 0x15 are not currently supported.'])).toBe(0x15);expect(streamWarning(['Note: MPEG-TS streams with stream_type 0x2 are not currently supported.'])).toBe(2);expect(streamWarning(['Other warning mentioning 0x15'])).toBeUndefined();});
});
