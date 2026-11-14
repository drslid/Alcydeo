import{describe,it,expect}from'vitest';
import{defaults,type Media}from'../../packages/contracts';
import{visibleMedia}from'../../packages/media-core/detection-policy';
const url='https://cdn.test/clip.mp4';
const media:Media={id:'video',tabId:1,pageUrl:'https://site.test/watch',title:'Original lesson',url,kind:'direct',variants:[{id:'candidate',url,label:'1080p'},{id:'uncertain',url:url+'?v=2',label:'720p',check:{state:'unknown',checkedAt:1,error:'network'}},{id:'working',url:url+'?v=3',label:'360p',check:{state:'ready',checkedAt:1}}]};
describe('confirmed source presentation',()=>{
 it('shows only checked qualities and selects their actual transport',()=>{const shown=visibleMedia([media],defaults);expect(shown).toHaveLength(1);expect(shown[0]!.variants.map(v=>v.id)).toEqual(['working']);expect(shown[0]!.url).toBe(url+'?v=3');expect(media.variants).toHaveLength(3);});
 it('does not announce unchecked or inconclusive candidates as detected videos',()=>{expect(visibleMedia([{...media,variants:media.variants.slice(0,2)}],defaults)).toEqual([]);});
 it('keeps a confirmed stream even when no complete-file size is available',()=>{const hls={...media,url:'https://cdn.test/master.m3u8',kind:'hls' as const,size:300,variants:[media.variants[2]!]};expect(visibleMedia([hls],defaults)[0]).toMatchObject({url:hls.url,variants:[{id:'working'}]});});
 it('retains explicit tab capture and a native local YouTube catalog as separate capabilities',()=>{expect(visibleMedia([{...media,captureOnly:true,variants:[media.variants[0]!]}],defaults)).toHaveLength(1);expect(visibleMedia([{...media,kind:'sabr',providerId:'youtube:abcdefghijk',pending:false}],defaults)).toHaveLength(1);expect(visibleMedia([{...media,kind:'sabr',pending:true,variants:[media.variants[0]!]}],defaults)).toEqual([]);});
});
