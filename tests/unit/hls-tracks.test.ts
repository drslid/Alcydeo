import{describe,it,expect}from'vitest';
import type{Media,Variant}from'../../packages/contracts';
import type{Plan}from'../../packages/media-core/hls';
import{hlsIdentity,hlsTrackIdentities}from'../../packages/media-core/hls-identity';
import{groupMedia}from'../../packages/media-core/grouping';
import{canonicalMedia,sameAudio}from'../../packages/media-core/sources';

const video='https://u14.vidzy.cc/video.m3u8?t=keep%2Bvalue',audio='https://u14.vidzy.cc/audio-fr.m3u8?t=keep%2Bvalue';
const nativeVideo=video+'&gk=native-video',nativeAudio=audio+'&gk=native-audio';
const samples=[['video-first','video-last'],['audio-first','audio-last']];
const plan:Plan={duration:20,tracks:[{type:'video',duration:20,segments:[{url:video+'/segment-1.ts'},{url:video+'/segment-2.ts'}]},{type:'audio',duration:20.01,segments:[{url:audio+'/segment-1.ts'},{url:audio+'/segment-2.ts'}]}]};
const checked=(identities:string[],planIdentity=identities.join(':'))=>({state:'ready' as const,checkedAt:10,hlsTracks:identities,planIdentity});
const media=(id:string,url:string,variants:Variant[],extra:Partial<Media>={}):Media=>({id,url,variants,tabId:1,pageUrl:'https://page.test/film',frameId:4,title:'Original film',kind:'hls',qualitiesResolved:true,...extra});
const pair=(audioIdentity='audio-fr',audioUrl=audio)=>media('master','https://u14.vidzy.cc/master.m3u8',[{id:'selected',url:video,audioUrl,label:'360p',height:360,contentType:'application/vnd.apple.mpegurl',check:checked(['video',audioIdentity])}]);
const leaf=(id:string,url:string,identity:string)=>media(id,url,[{id,url,label:'',contentType:'application/vnd.apple.mpegurl',check:checked([identity])}]);

describe('checked HLS components',()=>{
 it('matches individual native leaves with a checked master despite the leaf combined label',async()=>{
  const identities=await hlsTrackIdentities(plan,samples);expect(identities).toHaveLength(2);
  for(let i=0;i<2;i++){const track=structuredClone(plan.tracks[i]!);track.type='combined';for(const segment of track.segments)segment.url+='&gk=native';const child={duration:track.duration,tracks:[track]};expect(await hlsTrackIdentities(child,[samples[i]!])).toEqual([identities![i]]);expect(await hlsIdentity(child,samples[i]!)).not.toBe(await hlsIdentity(plan,samples.flat()));}
 });
 it('compares every resource, byte range, duration and sampled prefix independently',async()=>{
  const expected=await hlsTrackIdentities(plan,samples);
  for(const change of [(p:Plan)=>p.tracks[0]!.segments[1]!.url+='&changed=1',(p:Plan)=>p.tracks[0]!.segments[1]!.range={start:3,length:5},(p:Plan)=>p.tracks[0]!.duration=22]){const changed=structuredClone(plan);change(changed);const actual=await hlsTrackIdentities(changed,samples);expect(actual?.[0]).not.toBe(expected?.[0]);expect(actual?.[1]).toBe(expected?.[1]);}
  expect((await hlsTrackIdentities(plan,[['different',samples[0]![1]!],samples[1]!]))?.[0]).not.toBe(expected?.[0]);
 });
 it('does not publish partial identities for live, undersampled or oversized plans',async()=>{
  expect(await hlsTrackIdentities({...plan,live:true},samples)).toBeUndefined();expect(await hlsTrackIdentities(plan,[samples[0]!])).toBeUndefined();expect(await hlsTrackIdentities(plan,[samples[0]!,[]])).toBeUndefined();
  const large=structuredClone(plan);large.tracks[1]!.segments=Array.from({length:2000},()=>({url:audio+'x'.repeat(200)}));expect(await hlsTrackIdentities(large,samples)).toBeUndefined();
 });
 it('folds the two technical leaves into a complete quality with both original native URLs',()=>{
  const master=pair(),v=leaf('native-video',nativeVideo,'video'),a=leaf('native-audio',nativeAudio,'audio-fr');
  for(const input of [[master,v,a],[a,v,master]]){const grouped=groupMedia(input);expect(grouped).toHaveLength(1);expect(grouped[0]!.variants).toHaveLength(1);expect(grouped[0]!.variants[0]).toMatchObject({id:'selected',url:nativeVideo,audioUrl:nativeAudio,height:360,label:'360p',check:master.variants[0]!.check});expect(grouped[0]!.variants[0]!.sourceUrls).toContain(video);expect(grouped[0]!.variants[0]!.audioSourceUrls).toContain(audio);}
 });
 it('preserves distinct selected audio tracks even when they share the exact video URI',()=>{
  const master=pair(),other={...pair('audio-es','https://u14.vidzy.cc/audio-es.m3u8'),id:'spanish'};const grouped=groupMedia([master,other,leaf('v',nativeVideo,'video'),leaf('a',nativeAudio,'audio-fr')]);expect(grouped).toHaveLength(1);expect(grouped[0]!.variants).toHaveLength(2);expect(grouped[0]!.variants.map(v=>v.audioUrl)).toEqual([nativeAudio,other.variants[0]!.audioUrl]);
 });
 it('requires ready checks and the same page, frame and tab before using a component match',()=>{
  const master=pair(),child=leaf('v',nativeVideo,'video');for(const change of [{frameId:5},{pageUrl:'https://page.test/other'},{tabId:2},{variants:[{...child.variants[0]!,check:{...child.variants[0]!.check!,state:'unknown' as const}}]}])expect(groupMedia([master,{...child,...change}])).toHaveLength(2);
  expect(groupMedia([master,leaf('other-audio',nativeAudio,'other')])).toHaveLength(2);
 });
 it('does not reintroduce an already checked audio URL when a native event has no new leaf check',()=>{
  const master=pair();master.variants[0]={...master.variants[0]!,url:nativeVideo,audioUrl:nativeAudio,audioSourceUrls:[audio]};
  for(const url of [audio,nativeAudio]){const fresh=leaf('audio-event',url,'audio-fr');delete fresh.variants[0]!.check;const grouped=groupMedia([master,fresh]);expect(grouped).toHaveLength(1);expect(grouped[0]!.variants).toHaveLength(1);expect(grouped[0]!.variants[0]!.audioUrl).toBe(nativeAudio);expect(groupMedia([master,{...fresh,frameId:5}])).toHaveLength(2);}
  expect(groupMedia([master,leaf('changed',nativeAudio,'different-resource')])).toHaveLength(2);
 });
 it('canonicalizes only explicitly checked aliases of the same selected audio',()=>{
  const known=pair();known.variants[0]={...known.variants[0]!,url:nativeVideo,audioUrl:nativeAudio,sourceUrls:[video],audioSourceUrls:[audio]};
  const fresh=pair(),other=pair('audio-es','https://u14.vidzy.cc/audio-es.m3u8');
  expect(sameAudio(known.variants[0]!,fresh.variants[0]!)).toBe(true);expect(sameAudio(known.variants[0]!,other.variants[0]!)).toBe(false);
  expect(canonicalMedia([known,fresh])[1]!.variants[0]).toMatchObject({url:nativeVideo,audioUrl:nativeAudio,check:known.variants[0]!.check});
  const unknown={...known,variants:[{...known.variants[0]!,check:{...known.variants[0]!.check!,state:'unknown' as const}}]};expect(canonicalMedia([unknown,fresh])[1]!.variants[0]!.url).toBe(video);expect(canonicalMedia([known,other])[1]!.variants[0]!.audioUrl).toBe(other.variants[0]!.audioUrl);
 });
 it('does not overwrite a contradictory ready check and keeps a newer equivalent check',()=>{
  const known=pair();known.variants[0]={...known.variants[0]!,url:nativeVideo,audioUrl:nativeAudio,sourceUrls:[video],audioSourceUrls:[audio]};
  for(const check of [{...checked(['changed-video','audio-fr']),checkedAt:20},{...checked(['video','audio-fr']),checkedAt:20,planIdentity:'different-plan'}]){const fresh=pair();fresh.variants[0]!.check=check;expect(canonicalMedia([known,fresh])[1]!.variants[0]).toEqual(fresh.variants[0]);}
  const equivalent=pair();equivalent.variants[0]!.check={...known.variants[0]!.check!,checkedAt:20};expect(canonicalMedia([known,equivalent])[1]!.variants[0]).toEqual(equivalent.variants[0]);
 });
 it('retains a checked video leaf that contradicts the referenced video component',()=>{
  const master=pair(),changed=leaf('changed',video,'changed-video');changed.variants[0]!.check!.checkedAt=20;
  const grouped=groupMedia([master,changed]);expect(grouped).toHaveLength(1);expect(grouped[0]!.variants).toHaveLength(2);expect(grouped[0]!.variants.some(v=>v.check===changed.variants[0]!.check)).toBe(true);
 });
 it('keeps the newer proof when the exact same transport URL reappears',()=>{
  const old=leaf('old',nativeVideo,'old-video'),fresh=leaf('fresh',nativeVideo,'new-video');fresh.variants[0]!.check!.checkedAt=20;
  const grouped=groupMedia([old,fresh]);expect(grouped[0]!.variants).toHaveLength(1);expect(grouped[0]!.variants[0]!.check).toEqual(fresh.variants[0]!.check);
 });
});
