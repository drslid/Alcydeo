import {describe,it,expect} from 'vitest';
import type {Media} from '../../packages/contracts';
import {canonicalMedia,sourceIndex} from '../../packages/media-core/sources';
import {groupMedia} from '../../packages/media-core/grouping';
const original='https://reader.test/reader-video.mp4',target='https://cdn.test/stream?signature=keep%2Bthis%2Fvalue';
const dom:Media={id:'dom',tabId:1,pageUrl:'https://page.test/',frameId:2,title:'The lesson',url:original,kind:'direct',height:960,detectedBy:'dom',variants:[{id:'chosen',url:original,label:'960p',height:960}]};
const network:Media={...dom,id:'network',url:target,title:'Page title',height:undefined,detectedBy:'network',variants:[{id:'actual',url:target,label:'',contentType:'video/mp4',size:12345,sourceUrls:[original,target]}]};
describe('actual media source after a redirect',()=>{
  it('keeps the reader title and quality, but downloads the observed final URL',()=>{
    const grouped=groupMedia(canonicalMedia([dom,network]));expect(grouped).toHaveLength(1);expect(grouped[0]!.title).toBe('The lesson');expect(grouped[0]!.variants).toHaveLength(1);expect(grouped[0]!.variants[0]).toMatchObject({url:target,label:'960p',height:960,contentType:'video/mp4',size:12345});expect(grouped[0]!.url).toBe(target);
  });
  it('does not guess from identical titles or ambiguous redirect targets',()=>{
    expect(canonicalMedia([dom,{...network,variants:[{...network.variants[0]!,sourceUrls:[]}]}])[0]!.url).toBe(original);
    expect(canonicalMedia([dom,network,{...network,id:'other',variants:[{...network.variants[0]!,url:'https://other.test/file.mp4'}]}])[0]!.url).toBe(original);
  });
  it('keeps redirects scoped to the actual tab, page and frame',()=>{
    for(const change of [{tabId:2},{pageUrl:'https://another.test/'},{frameId:3}])expect(canonicalMedia([dom,{...network,...change}])[0]!.url).toBe(original);
    const different={...network,id:'other-frame',frameId:3,url:'https://other.test/file.mp4',variants:[{...network.variants[0]!,url:'https://other.test/file.mp4'}]};
    expect(groupMedia(canonicalMedia([network,different]))).toHaveLength(2);
  });
  it('preserves a separate adaptive audio track when only its video URL redirects',()=>{
    const audioUrl='https://audio.test/original.m4a',adaptive:Media={...dom,kind:'adaptive',variants:[{...dom.variants[0]!,audioUrl}]};
    const resolved=canonicalMedia([adaptive,network])[0]!.variants[0]!;expect(resolved.url).toBe(target);expect(resolved.audioUrl).toBe(audioUrl);
  });
});

describe('checked HLS aliases preserve the selected audio',()=>{
  const video='https://cdn.test/video.m3u8',native=video+'?gate=native',audioA='https://cdn.test/audio-A.m3u8',audioB='https://cdn.test/audio-B.m3u8';
  const source=(id:string,audioUrl?:string):Media=>({...dom,id,kind:'hls',url:native,variants:[{id,url:native,audioUrl,label:'480p',height:480,contentType:'application/vnd.apple.mpegurl',sourceUrls:[video],check:{state:'ready',checkedAt:1,planIdentity:`plan:${audioUrl??'combined'}`}}]});
  it('does not apply an audio-B plan identity to a fresh audio-A rendition',()=>{
    const fresh:Media={...source('fresh',audioA),url:'https://cdn.test/master.m3u8',variants:[{id:'selected',url:video,audioUrl:audioA,label:'480p',height:480}]};
    const actual=canonicalMedia([source('known',audioB),fresh])[1]!.variants[0]!;
    expect(actual).toEqual(fresh.variants[0]);expect(actual.check).toBeUndefined();
  });
  it('leaves an alias ambiguous when the same video URL has different audio targets',()=>{
    const a=source('a',audioA),b=source('b',audioB),combined=source('combined');
    expect(sourceIndex([a,b,a])(a,video)).toBeUndefined();expect(sourceIndex([a,combined])(a,video)).toBeUndefined();
  });
  it.each([audioA,undefined])('keeps compatible checked aliases and their original audio %s',audioUrl=>{
    const known=source('known',audioUrl),fresh:Media={...known,id:'fresh',url:video,variants:[{id:'selected',url:video,audioUrl,label:'480p'}]};
    const actual=canonicalMedia([known,fresh])[1]!.variants[0]!;
    expect(actual).toMatchObject({url:native,check:known.variants[0]!.check});expect(actual.audioUrl).toBe(audioUrl);
  });
});
