import {isLocalBuild,youtubeHost} from './distribution';
export type Kind = 'direct' | 'hls' | 'dash' | 'adaptive' | 'sabr';
export type State = 'queued' | 'fetching' | 'assembling' | 'converting' | 'recording' | 'validating' | 'completed' | 'paused' | 'failed' | 'cancelled';
export interface SourceCheck { live?:boolean; state:'ready'|'unavailable'|'unknown'; checkedAt:number; error?:string; size?:number; estimatedSize?:number; width?:number;height?:number;contentType?:string;planIdentity?:string;hlsTracks?:string[];pageCredentials?:'include'|'omit' }
export interface Variant { id: string; url: string; label: string; width?:number; height?: number; bandwidth?: number; audioUrl?: string; contentType?: string; size?: number; sourceUrls?: string[];audioSourceUrls?:string[]; check?:SourceCheck }
export interface YoutubeFormat {itag:number;mimeType:string;bitrate:number;lastModified?:string;xtags?:string;approxDurationMs?:string;contentLength?:string;height?:number;width?:number;fps?:number;qualityLabel?:string;audioQuality?:string;audioTrack?:{id?:string;audioIsDefault?:boolean};isDrc?:boolean;url?:string}
export interface SabrContext {endpoint:string;streamId:string;ustreamer:string;client:{clientName:number;clientVersion:string};poToken?:string}
export interface SabrSource extends SabrContext {videoId:string;formats:YoutubeFormat[]}
export interface Media { id: string; tabId: number; pageUrl: string; title: string; url: string; kind: Kind; variants: Variant[]; duration?: number; height?: number; size?: number; poster?: string; contentType?: string; detectedBy?: 'dom' | 'network'; frameId?: number; aliases?: string[]; sourceUrls?: string[]; qualitiesResolved?: boolean;providerId?:string;sabr?:SabrSource;pending?:boolean;live?:boolean;captureOnly?:boolean }
export interface Validation { duration: number; tracks: { type: string; codec: string | null }[]; bytes: number; method: 'local-structure'; checkedAt: number }
export type MediaNotice='timedMetadataSkipped'|'multipartUnavailable'|'recordingIncomplete'|'liveIncomplete';
export interface MultipartCheckpoint {etag:string;total:number;parts:{start:number;end:number;received:number}[]}
export const managedTask=(task:Pick<Task,'media'|'transfer'|'conversion'|'recording'>)=>!!task.recording||!!task.conversion||task.media.kind!=='direct'||['multipart','page'].includes(task.transfer?.mode??'');
export interface ConversionOptions {quality:'auto'|'high'|'balanced'|'small';maxHeight:0|480|720|1080;audioKbps:0|128|192|256}
export const compressionDefaults:ConversionOptions={quality:'small',maxHeight:720,audioKbps:128};
export const conversionDefaults:ConversionOptions={quality:'auto',maxHeight:0,audioKbps:0};
export function conversionOptions(value:unknown):ConversionOptions{
  if(value===undefined)return{...conversionDefaults};
  const v=value as Partial<ConversionOptions>;
  if(!v||typeof v!=='object'||!['auto','high','balanced','small'].includes(v.quality??'')||![0,480,720,1080].includes(v.maxHeight??-1)||![0,128,192,256].includes(v.audioKbps??-1))throw new Error('invalid');
  return{quality:v.quality!,maxHeight:v.maxHeight!,audioKbps:v.audioKbps!};
}
export interface CropRegion {x:number;y:number;width:number;height:number}
export type EditOperation={kind:'convert'|'compress'|'merge'|'trim'|'crop';start?:number;end?:number;crop?:CropRegion;options?:ConversionOptions};
export interface Task {
  id: string; media: Media; variant: Variant; title: string; state: State; createdAt: number; updatedAt: number;
  downloadId?: number; castDownloadId?:number; filename?: string; thumbnail?:string;thumbnailTime?:number; bytes: number; total?: number; progress: number; error?: string;
  validation?: Validation; notices?: MediaNotice[]; saved?: boolean; favorite?: boolean; tags?: string[]; owner?: string; leaseUntil?: number;
  downloadSlot?:{owner:string;kind:'native'|'managed';expiresAt:number;startedAt:number};nativeStart?:{startedAt:number};
  checkpoints: Record<string, { file: string; bytes: number; etag?: string }>; output?: string; planSignature?: string;
  transfer?:{mode:'native'|'multipart'|'page';connections:2|4|8};multipart?:MultipartCheckpoint;
  destination?: Pick<Settings,'folder'|'saveAs'>&{subfolder?:string};
  playlist?:{batchId:string;videoId:string;index:number};
  outputSave?:{url:string;startedAt:number};
  live?:{blocked?:string[];active:boolean;startedAt:number;url:string;bytes:number;segments:number;duration:number;lastSequence?:number;lastIdentity?:string;discontinuity?:number;initIdentity?:string;initialized?:boolean;warning?:string};
  recording?:{sessionKey?:string;file:string;startedAt:number;active:boolean;duration?:number};
  conversion?:{input:string;inputBytes:number;ready:boolean;sourceTaskId?:string;videoEncoded?:boolean;audioEncoded?:boolean;operation?:EditOperation;inputs?:{file:string;bytes:number;name:string}[]};
}
export interface Settings { theme: 'system' | 'light' | 'dark'; folder: string; saveAs: boolean; badge: 'count' | 'dot' | 'hidden'; blocked: string[]; minSize: number; globalDetection: boolean; multipart:boolean;connections:2|4|8;maxConcurrentFiles:number;conversion?:ConversionOptions;compression?:ConversionOptions;captureQuality?:'source'|'high'|'standard' }
export const defaults: Settings = { theme: 'system', folder: 'Alcydeo', saveAs: false, badge: 'count', blocked: [], minSize: 10000, globalDetection: true,compression:{...compressionDefaults},captureQuality:'high',multipart:true,connections:4,maxConcurrentFiles:4 };
export const concurrentFileOptions=[1,2,3,4,5,6,7,8] as const;
export const downloadConcurrency=(value:unknown)=>typeof value==='number'&&Number.isInteger(value)&&value>=1&&value<=8?value:defaults.maxConcurrentFiles;
export const terminal: State[] = ['completed', 'failed', 'cancelled'];
// Native files awaiting an optional content check are already saved history.
// A live worker lease still protects terminal records until its owner stops.
export const clearableHistory = (task: Task, now = Date.now()) =>
  (terminal.includes(task.state) || (task.state === 'validating' && task.saved === true)) &&
  task.downloadSlot?.kind!=='native' &&
  (!task.owner || (task.leaseUntil ?? 0) < now);
export const transitions: Record<State, State[]> = {
  queued: ['recording','fetching', 'converting', 'paused', 'cancelled', 'failed'], fetching: ['queued','assembling', 'validating', 'paused', 'failed', 'cancelled'],
  recording:['assembling','validating','paused','cancelled','failed'],
  converting: ['validating','paused','failed','cancelled'],
  assembling: ['validating', 'paused', 'failed', 'cancelled'], validating: ['completed', 'paused', 'failed', 'cancelled'],
  completed: [], paused: ['queued', 'fetching', 'cancelled', 'failed'], failed: ['queued', 'cancelled'], cancelled: [],
};
export function safeUrl(value: string, base?: string): string {
  const u = new URL(value, base);
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw new Error('unsupported');
  if (!isLocalBuild()&&youtubeHost(u.hostname)) throw new Error('excluded');
  return u.href;
}
export function cleanName(value: string): string {
  const name = value.normalize('NFKC').replace(/[\p{Cc}<>:"/\\|?*\u202a-\u202e\u2066-\u2069]/gu, '_').replace(/[. ]+$/g, '').slice(0, 120) || 'Alcydeo';
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name) ? `_${name}` : name;
}
export function cleanFolder(value: string): string {
  return value.split(/[\\/]/).filter(x => x && x !== '.' && x !== '..').map(cleanName).slice(0, 5).join('/') || 'Alcydeo';
}
export function publicMetadata(tasks: Task[]) {
  return tasks.map(t => ({ title: t.title, createdAt: t.createdAt, favorite: !!t.favorite, tags: t.tags ?? [], validation: t.validation }));
}
export const sizePresets=[10000,100000,1000000,2000000] as const;
export function sitePattern(value:string){
  const text=value.trim().toLowerCase();if(!text)return '';
  try{if(text.includes('://'))return new URL(text).hostname.replace(/\.$/,'');}catch{return '';}
  const host=text.split('/')[0]!.replace(/\.$/,'');
  if(host.includes('*'))return /^[a-z0-9.*-]+$/.test(host)?host:'';
  try{return new URL('http://'+host).hostname.replace(/\.$/,'');}catch{return '';}
}
export function blocked(hostname: string, patterns: string[]) {
  const host=hostname.toLowerCase().replace(/\.$/,'');
  return patterns.some(value=>{
    const p=sitePattern(value);if(!p)return false;
    if(!p.includes('*'))return host===p||host.endsWith(`.${p}`);
    const escaped=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g,'[^/]*');
    return new RegExp(`^${escaped}$`).test(host)||(p.startsWith('*.')&&host===p.slice(2));
  });
}
