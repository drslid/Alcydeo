import type { Task } from '../contracts';
import type { Plan } from './hls';
import {resolveHlsTrack} from './hls-resolution';
import { parseDash } from './dash';
import { manifestText } from './network';
import {isLocalBuild} from '../contracts/distribution';
export async function buildPlan(task: Pick<Task,'media'|'variant'|'transfer'|'live'>, signal?: AbortSignal, guard?:(url:string)=>Promise<void>,allowLive=false): Promise<Plan> {
  if(task.media.captureOnly)throw new Error('unsupported');
  if(task.live)return{tracks:[]};
  if(task.media.kind==='direct'&&['multipart','page'].includes(task.transfer?.mode??''))return{tracks:[],duration:task.media.duration};
  if(isLocalBuild()&&task.media.kind==='sabr'){if(!task.media.sabr||task.media.pending)throw new Error('sourcePending');return{tracks:[],duration:task.media.duration};}
  if(task.media.kind==='adaptive'&&task.variant.audioUrl)return{tracks:[{type:'video',segments:[{url:task.variant.url}]},{type:'audio',segments:[{url:task.variant.audioUrl}]}],duration:task.media.duration};
  if (task.media.kind === 'dash') {await guard?.(task.variant.url);return parseDash(await manifestText(task.variant.url, signal), task.variant.url, task.variant.id).plan;}
  if (task.media.kind !== 'hls') throw new Error('unsupported');
  const timeout=AbortSignal.timeout(20_000);const bounded=signal?AbortSignal.any([signal,timeout]):timeout;
  const result = await resolveHlsTrack(task.variant,bounded,guard);
  if(result.track.live&&!allowLive)throw new Error('live');
  const tracks = [result.track];
  if (result.variant.audioUrl) { const {track:audio} = await resolveHlsTrack({id:'audio',label:'',url:result.variant.audioUrl},bounded,guard); if(audio.live&&!allowLive)throw new Error('live'); audio.type = 'audio'; result.track.type = 'video'; tracks.push(audio); }
  return { tracks, duration: result.track.duration,live:tracks.some(track=>track.live)||undefined };
}
