import{describe,it,expect}from'vitest';
import{vkRangeResource,vkDecoration}from'../../packages/media-core/vk';
import{withoutFragments}from'../../packages/media-core/segmented-sources';
import{parseDash}from'../../packages/media-core/dash';
import type{Media}from'../../packages/contracts';
const base='https://vk6-29.vkuser.net/?sig=a%2Bb%2F&ct=32&id=example';
describe('native VK segmented resources',()=>{
 it('removes only the native slice for comparison, preserving the exact signed query',()=>{
  expect(vkRangeResource(`${base}&bytes=0-2070`)).toBe(base);expect(vkRangeResource(base.replace('sig=', 'bytes=2071-300288&sig='))).toBe(base);
  for(const source of [base,`${base}&bytes=1-0`,`${base}&bytes=0-9007199254740992`,`${base}&bytes=0-1&bytes=2-3`,`${base}&bytes=0%2D1`,base.replace('vkuser.net','vkuser.net.evil.test')+'&bytes=0-1'])expect(vkRangeResource(source)).toBeUndefined();
 });
 it('hides slices only after that exact signed resource is declared in a manifest',()=>{
  const url=`${base}&bytes=0-2070`,media:Media={id:'slice',tabId:1,pageUrl:'https://vkvideo.ru/video-1_2',title:'Lesson',kind:'direct',url,variants:[{id:'v',url,label:''}]};
  expect(withoutFragments([media],[])).toHaveLength(1);expect(withoutFragments([media],[base])).toEqual([]);
  expect(withoutFragments([media],[base.replace('id=example','id=other')])).toHaveLength(1);expect(media.url).toBe(url);
 });
 it('registers single-file resources from every quality and audio rendition, not just the selected pair',()=>{
  const xml=`<MPD mediaPresentationDuration="PT6S"><Period><AdaptationSet mimeType="video/webm">${[144,720].map(h=>`<Representation id="v${h}" height="${h}"><BaseURL>?sig=a%2Bb&amp;id=v${h}</BaseURL><SegmentBase indexRange="10-19"><Initialization range="0-9"/></SegmentBase></Representation>`).join('')}</AdaptationSet><AdaptationSet mimeType="audio/webm"><Representation id="a"><BaseURL>?sig=c%2Bd&amp;id=audio</BaseURL><SegmentBase indexRange="10-19"/></Representation></AdaptationSet></Period></MPD>`;
  const result=parseDash(xml,base,'v144');expect(result.resources).toEqual(['https://vk6-29.vkuser.net/?sig=a%2Bb&id=v144','https://vk6-29.vkuser.net/?sig=a%2Bb&id=v720','https://vk6-29.vkuser.net/?sig=c%2Bd&id=audio']);expect(result.plan.tracks).toHaveLength(2);expect(result.plan.tracks[0]?.segments[0]?.url).toBe(result.resources[0]);
 });
 it('excludes the three native UI sounds without excluding other audio or other sites',()=>{
  expect(vkDecoration('https://vkvideo.ru/video-1_2','https://vkvideo.ru/mp3/bb1.mp3')).toBe(true);expect(vkDecoration('https://vkvideo.ru/video-1_2','https://vkvideo.ru/mp3/song.mp3')).toBe(false);expect(vkDecoration('https://other.test/','https://other.test/mp3/bb1.mp3')).toBe(false);
 });
});
