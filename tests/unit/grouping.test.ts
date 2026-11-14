import {describe,it,expect} from 'vitest';
import type {Media} from '../../packages/contracts';
import {groupMedia,qualityIdentity,matchingVariant} from '../../packages/media-core/grouping';
const source=(id:string,url:string,extra:Partial<Media>={}):Media=>({id,url,tabId:1,pageUrl:'https://page.test/lesson',frameId:0,title:'Same lesson',kind:'direct',variants:[{id:'0',url,label:''}],...extra});

describe('one video with selectable source qualities',()=>{
  it('keeps AVC before a higher-bitrate HEVC choice at equal height only for native TikTok catalogues',()=>{
    const avc={id:'avc',url:'https://cdn.test/avc.mp4',label:'1024p · H.264',height:1024,bandwidth:1000000},hevc={id:'hevc',url:'https://cdn.test/hevc.mp4',label:'1024p · HEVC',height:1024,bandwidth:2000000},highest={...hevc,id:'highest',url:'https://cdn.test/highest.mp4',label:'1920p · HEVC',height:1920};
    const media=source('post',avc.url,{providerId:'tiktok:7700630488859315489',qualitiesResolved:true,variants:[hevc,avc,highest]});
    expect(groupMedia([media])[0]?.variants.map(v=>v.id)).toEqual(['highest','avc','hevc']);
    expect(groupMedia([{...media,providerId:'instagram:original'}])[0]?.variants.map(v=>v.id)).toEqual(['highest','hevc','avc']);
    expect(groupMedia([{...media,providerId:undefined}])[0]?.variants.map(v=>v.id)).toEqual(['highest','hevc','avc']);
  });
  it('folds HLS alternatives only after their complete plan and samples identify the same stream',()=>{
    const check={state:'ready' as const,checkedAt:Date.now(),planIdentity:'hls-fixture'};
    const master=source('master','https://cdn.test/master.m3u8',{kind:'hls',qualitiesResolved:true,variants:[{id:'q',url:'https://cdn.test/index.m3u8',label:'488p',height:488,check}]});
    const child=source('child','https://cdn.test/index.m3u8?gate=native',{kind:'hls',qualitiesResolved:true,variants:[{id:'child-q',url:'https://cdn.test/index.m3u8?gate=native',label:'',check}]});
    const grouped=groupMedia([child,master]);expect(grouped).toHaveLength(1);expect(grouped[0]?.variants).toHaveLength(1);expect(grouped[0]?.variants[0]?.height).toBe(488);expect(grouped[0]?.variants[0]?.url).toBe(child.variants[0]!.url);expect(grouped[0]?.variants[0]?.sourceUrls).toContain(master.variants[0]!.url);
    expect(groupMedia([master,{...child,frameId:2}])).toHaveLength(2);
    expect(groupMedia([master,{...child,variants:[{...child.variants[0]!,check:{...check,state:'unknown'}}]}])).toHaveLength(2);
  });
  it('keeps the selected quality when a master refreshes its signed URLs',()=>{
    const previous={id:'old',url:'https://cdn.test/low.m3u8?sig=old',label:'480p',height:480,bandwidth:500000};
    const updated=[{id:'new-high',url:'https://cdn.test/high.m3u8?sig=new',label:'1080p',height:1080},{id:'new-low',url:'https://cdn.test/low.m3u8?sig=new',label:'480p',height:480,bandwidth:500000}];
    expect(matchingVariant('hls',previous,updated)?.id).toBe('new-low');
  });
  it('does not guess between ambiguous equal-height alternatives',()=>{
    const previous={id:'old',url:'https://cdn.test/old',label:'480p',height:480};
    expect(matchingVariant('hls',previous,[{id:'a',url:'https://cdn.test/a',label:'480p',height:480},{id:'b',url:'https://cdn.test/b',label:'480p',height:480}])).toBeUndefined();
  });
  it('retains a DASH selection by representation id rather than the shared MPD URL',()=>{
    const url='https://cdn.test/manifest.mpd';const low={id:'low',url,label:'480p',height:480};
    expect(matchingVariant('dash',low,[{id:'high',url,label:'1080p',height:1080},low])?.id).toBe('low');
  });
  it('folds quality paths and keeps the actual signed request URLs intact',()=>{
    const high='https://cdn.test/lesson-404p.mp4?token=keep%2Fthis',low='https://cdn.test/lesson-180p.mp4?token=keep%2Fthis';
    const [group]=groupMedia([source('high',high),source('low',low)]);
    expect(group?.variants.map(v=>v.label)).toEqual(['404p','180p']);expect(group?.variants.map(v=>v.url)).toEqual([high,low]);expect(group?.aliases).toEqual(['high','low']);expect(new Set(group?.variants.map(v=>v.id)).size).toBe(2);
  });
  it('recognizes an explicit resolution query without changing download parameters',()=>{
    const high='https://cdn.test/video.mp4?id=12&quality=1080&sig=same',low='https://cdn.test/video.mp4?id=12&quality=480&sig=same';
    expect(groupMedia([source('h',high),source('l',low)])[0]?.variants.map(v=>v.url)).toEqual([high,low]);
  });
  it('never merges unrelated videos merely because their titles match',()=>{
    expect(groupMedia([source('a','https://cdn.test/one-720p.mp4'),source('b','https://cdn.test/two-480p.mp4')])).toHaveLength(2);
  });
  it('keeps episode identifiers and differing authentication parameters distinct',()=>{
    const a='https://cdn.test/video.mp4?episode=1&height=720&sig=A';
    expect(groupMedia([source('a',a),source('b','https://cdn.test/video.mp4?episode=2&height=480&sig=A')])).toHaveLength(2);
    expect(groupMedia([source('a',a),source('b','https://cdn.test/video.mp4?episode=1&height=480&sig=B')])).toHaveLength(2);
  });
  it('does not treat arbitrary numeric path ids as quality markers',()=>{
    expect(qualityIdentity('https://cdn.test/1234/video.mp4')).toBeUndefined();
  });
  it('keeps distinct frames, pages, tabs, kinds and incompatible durations apart',()=>{
    const a=source('a','https://cdn.test/film-720p.mp4',{duration:6});
    for(const extra of [{frameId:2},{pageUrl:'https://page.test/other'},{tabId:2},{kind:'hls' as const},{duration:60}])expect(groupMedia([a,source('b','https://cdn.test/film-480p.mp4',extra)])).toHaveLength(2);
  });
  it('uses master references to fold observed HLS playlists across frames',()=>{
    const high='https://cdn.test/high/index.m3u8',low='https://cdn.test/low/index.m3u8';
    const child=source('child',low,{kind:'hls',frameId:1});
    const master=source('master','https://cdn.test/master.m3u8',{kind:'hls',frameId:2,qualitiesResolved:true,variants:[{id:'h',url:high,label:'720p',height:720},{id:'l',url:low,label:'480p',height:480}]});
    const grouped=groupMedia([child,master,source('other',high,{kind:'hls'})]);
    expect(grouped).toHaveLength(1);expect(grouped[0]?.id).toBe('child');expect(grouped[0]?.url).toBe(master.url);expect(grouped[0]?.variants.map(v=>v.label)).toEqual(['720p','480p']);expect(grouped[0]?.qualitiesResolved).toBe(true);
  });
  it('preserves master audio associations without a duplicate video-only option',()=>{
    const url='https://cdn.test/video/index.m3u8',audioUrl='https://cdn.test/audio/index.m3u8';
    const [group]=groupMedia([source('master','https://cdn.test/master.m3u8',{kind:'hls',qualitiesResolved:true,variants:[{id:'v',url,audioUrl,label:'720p',height:720}]}),source('child',url,{kind:'hls',qualitiesResolved:true})]);
    expect(group?.variants).toHaveLength(1);expect(group?.variants[0]?.audioUrl).toBe(audioUrl);
  });
  it('preserves DASH representation selectors sharing the same MPD URL',()=>{
    const url='https://cdn.test/manifest.mpd';const [group]=groupMedia([source('ready',url,{kind:'dash',qualitiesResolved:true,variants:[{id:'video-hi',url,label:'720p',height:720},{id:'video-lo',url,label:'480p',height:480}]}),source('raw',url,{kind:'dash'})]);
    expect(group?.variants.map(v=>v.id)).toEqual(['video-hi','video-lo']);
  });
  it('never presents a legacy playlist byte count as the video size',()=>{
    const url='https://cdn.test/track.m3u8';const[group]=groupMedia([source('old',url,{kind:'hls',size:156,variants:[{id:'0',url,label:'',size:156}]})]);
    expect(group?.size).toBeUndefined();expect(group?.variants[0]?.size).toBeUndefined();
  });
  it('keeps stable quality ids and per-quality sizes when the same source reappears',()=>{
    const high='https://cdn.test/film-720p.mp4',low='https://cdn.test/film-480p.mp4';
    const first=groupMedia([source('high',high,{size:2000}),source('low',low,{size:1000})]);
    const second=groupMedia([...first,source('duplicate',low,{size:1000})]);
    expect(second[0]?.variants.map(v=>v.id)).toEqual(first[0]?.variants.map(v=>v.id));expect(second[0]?.variants.map(v=>v.size)).toEqual([2000,1000]);expect(second[0]?.size).toBeUndefined();
  });
});
