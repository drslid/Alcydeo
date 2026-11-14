import {parseHls,type Segment} from './hls';
import {resolveHlsTrack} from './hls-resolution';
import {manifestText} from './network';
import type {Variant} from '../contracts';
export interface LiveSegment extends Segment {sequence:number;duration:number;discontinuity:number;gap:boolean}
export interface LivePlaylist {url:string;ended:boolean;targetDuration:number;segments:LiveSegment[];init?:Segment}
export function parseLiveHls(text:string,url:string):LivePlaylist {
 const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
 if(lines.some(l=>l.startsWith('#EXT-X-SKIP:')||l==='#EXT-X-I-FRAMES-ONLY'))throw new Error('liveVariant');
 // Reuse the VOD parser's encryption, URL, byte-range and initialization checks.
 const clean=lines.filter(l=>l!=='#EXT-X-DISCONTINUITY'&&l!=='#EXT-X-GAP').join('\n')+'\n#EXT-X-ENDLIST';
 const parsed=parseHls(clean,url);if(!parsed.track||parsed.variants.length)throw new Error('liveVariant');
 const number=(tag:string,fallback?:number)=>{const line=lines.find(l=>l.startsWith(tag));const value=line?Number(line.slice(tag.length)):fallback;if(value===undefined||!Number.isSafeInteger(value)||value<0)throw new Error('invalid');return value;};
 const targetDuration=number('#EXT-X-TARGETDURATION:');if(targetDuration<1||targetDuration>3600)throw new Error('invalid');
 let sequence=number('#EXT-X-MEDIA-SEQUENCE:',0),discontinuity=number('#EXT-X-DISCONTINUITY-SEQUENCE:',0),duration=0,gap=false,index=0;
 const hasMap=lines.some(l=>l.startsWith('#EXT-X-MAP:')),raw=parsed.track.segments,segments:LiveSegment[]=[];
 for(const line of lines){if(line==='#EXT-X-DISCONTINUITY')discontinuity++;else if(line==='#EXT-X-GAP')gap=true;else if(line.startsWith('#EXTINF:'))duration=Number.parseFloat(line.slice(8));else if(!line.startsWith('#')){const segment=raw[index+++(hasMap?1:0)];if(!segment||!Number.isFinite(duration)||duration<=0||duration>targetDuration+0.5||!Number.isSafeInteger(sequence))throw new Error('invalid');segments.push({...segment,sequence:sequence++,duration,discontinuity,gap});duration=0;gap=false;}}
 if(!segments.length)throw new Error('liveVariant');
 return{url,ended:lines.includes('#EXT-X-ENDLIST'),targetDuration,segments,init:hasMap?raw[0]:undefined};
}
export async function resolveLiveHls(variant:Variant,signal?:AbortSignal,guard?:(url:string)=>Promise<void>){
 const resolved=await resolveHlsTrack(variant,signal,guard);if(resolved.variant.audioUrl)throw new Error('liveAudio');await guard?.(resolved.variant.url);
 const playlist=parseLiveHls(await manifestText(resolved.variant.url,signal),resolved.variant.url);if(playlist.ended)throw new Error('notLive');return{playlist,variant:resolved.variant};
}
export const segmentIdentity=(segment?:Segment)=>segment?JSON.stringify({url:segment.url,range:segment.range}):'';
export function nextLiveSegments(playlist:LivePlaylist,lastSequence?:number,lastIdentity?:string,discontinuity?:number){
 if(lastSequence===undefined)return[playlist.segments.at(-1)!];
 const previous=playlist.segments.find(s=>s.sequence===lastSequence);if(previous&&lastIdentity!==segmentIdentity(previous))throw new Error('sourceChanged');
 const latest=playlist.segments.at(-1)!.sequence;if(latest<lastSequence)throw new Error('sourceChanged');
 const next=playlist.segments.filter(s=>s.sequence>lastSequence);if(next.length&&next[0]!.sequence!==lastSequence+1)throw new Error('liveGap');
 if(next.some(s=>s.gap))throw new Error('liveGap');if(next.some(s=>s.discontinuity!==discontinuity))throw new Error('discontinuity');return next;
}
