import{safeUrl}from'../contracts';
import{remotePlaybackError}from'./remote-playback';

// Original Chrome integration using Presentation API and the Cast message
// conventions implemented by Chromium 156. No SDK, socket or remote JS runs
// here. See docs/TV.md for protocol references and validation scope.
export interface CastMedia{url:string;mime:string;title:string;live?:boolean}
export type CastPhase='idle'|'choosing'|'connecting'|'loading'|'playing'|'paused'|'finished'|'error';
export interface CastSnapshot{phase:CastPhase;connected:boolean;receiver?:string;error?:string}
export interface CastConnection extends EventTarget{state:string;send(data:string):void;close():void;terminate():void}
export interface CastRequest extends EventTarget{start():Promise<CastConnection>}
export type CastRequestFactory=(url:string)=>CastRequest;
export const nativeCastRequest:CastRequestFactory=url=>{
 const Constructor=(globalThis as unknown as{PresentationRequest?:new(url:string)=>CastRequest}).PresentationRequest;
 if(!Constructor)throw new Error('tvNotSupported');return new Constructor(url);
};
export function castPresentationUrl(clientId:string){
 if(!/^[a-z\d_-]{8,80}$/i.test(clientId))throw new Error('invalid');
 return`cast:CC1AD845?clientId=${clientId}&autoJoinPolicy=page_scoped&defaultActionPolicy=create_session`;
}
const safeText=(value:string,limit:number)=>Array.from(value.slice(0,limit),char=>char.charCodeAt(0)<32||char.charCodeAt(0)===127?' ':char).join('');
export function castMime(url:string,contentType?:string){
 const mime=contentType?.split(';')[0]?.trim().toLowerCase();if(mime&&/^video\/[a-z\d.+-]+$/.test(mime))return mime;
 const path=new URL(safeUrl(url)).pathname.toLowerCase();const ext=path.split('.').pop()??'';
 return({webm:'video/webm',mov:'video/quicktime',mkv:'video/x-matroska',avi:'video/x-msvideo',wmv:'video/x-ms-wmv',flv:'video/x-flv',ogg:'video/ogg',ogv:'video/ogg',mpg:'video/mpeg',mpeg:'video/mpeg',ts:'video/mp2t',m2ts:'video/mp2t',mts:'video/mp2t','3gp':'video/3gpp'}as Record<string,string>)[ext]??'video/mp4';
}
export function checkedCastMedia(input:CastMedia):CastMedia{
 const url=safeUrl(input.url);if(url.length>16384)throw new Error('invalid');
 const mime=input.mime.toLowerCase().split(';')[0]!.trim();if(!/^(?:video\/[a-z\d.+-]+|application\/(?:vnd\.apple\.mpegurl|x-mpegurl|dash\+xml))$/.test(mime))throw new Error('tvNotSupported');
 return{url,mime,title:safeText(input.title,500),live:!!input.live};
}
export class CastSession{
 readonly clientId=crypto.randomUUID();
 private media:CastMedia;private request?:CastRequest;private connection?:CastConnection;private sessionId='';private mediaSessionId?:number;private sequence=0;private loadSequence?:number;private disposed=false;private handshake?:ReturnType<typeof setTimeout>;private loadTimer?:ReturnType<typeof setTimeout>;private commandTimer?:ReturnType<typeof setTimeout>;private pendingCommand?:number;private pendingState?:CastPhase;private sentLoad=false;private pollTimer?:ReturnType<typeof setTimeout>;private retiredMediaIds=new Set<number>();
 private snapshot:CastSnapshot={phase:'idle',connected:false};
 constructor(media:CastMedia,private changed:(snapshot:CastSnapshot)=>void,private factory:CastRequestFactory=nativeCastRequest,private timeoutMs=20000){this.media=checkedCastMedia(media);}
 private update(value:Partial<CastSnapshot>){if(this.disposed)return;this.snapshot={...this.snapshot,...value};this.changed({...this.snapshot});}
 private fail(error:string){this.clearTimers();if(!this.sessionId){const connection=this.connection;this.cleanup();try{connection?.close();}catch{/* Already closed. */}this.update({connected:false});}this.update({phase:'error',error});}
 private clearLoading(){clearTimeout(this.loadTimer);this.loadTimer=undefined;clearTimeout(this.pollTimer);this.pollTimer=undefined;}
 private clearTimers(){clearTimeout(this.handshake);this.clearLoading();clearTimeout(this.commandTimer);this.pendingCommand=undefined;this.pendingState=undefined;}
 // BUFFERING updates are heartbeats, not progress. They must not extend this
 // deadline or resurrect an expired attempt. Query status without re-LOADing.
 private waitForPlayback(){
  if(this.loadTimer!==undefined)return;
  this.loadTimer=setTimeout(()=>this.fail('tvCastTimeout'),this.timeoutMs);
  const poll=()=>{this.pollTimer=setTimeout(()=>{
   if(this.disposed||this.snapshot.phase!=='loading')return;
   const sequence=++this.sequence;
   try{this.send({type:'GET_STATUS',...(this.mediaSessionId!==undefined?{mediaSessionId:this.mediaSessionId}:{})},sequence);}catch{this.fail('tvNoConnection');}
   if(this.snapshot.phase==='loading')poll();
  },Math.min(2000,Math.max(10,this.timeoutMs/4)));};poll();
 }
 // start() is intentionally invoked before the first await, preserving the
 // button's transient user activation. Loading happens only after selection.
 async choose(){
  if(this.disposed||this.snapshot.phase==='choosing')return;
  if(this.connection)throw new Error('tvBusy');
  this.update({phase:'choosing',error:undefined,receiver:undefined});
  try{
   this.request=this.factory(castPresentationUrl(this.clientId));this.request.addEventListener('connectionavailable',this.available);
   const opening=this.request.start();const connection=await opening;
   if(this.disposed){connection.close();return;}this.attach(connection);
  }catch(error){if(!this.disposed)this.fail(error instanceof Error&&error.message==='tvNotSupported'?'tvNotSupported':remotePlaybackError(error));}
 }
 private available=(event:Event)=>{const connection=(event as Event&{connection?:CastConnection}).connection;if(connection&&!this.disposed)this.attach(connection);};
 private attach(connection:CastConnection){
  if(this.connection===connection)return;if(this.connection){connection.close();return;}
  this.connection=connection;this.update({phase:'connecting',connected:false});
  connection.addEventListener('message',this.message);connection.addEventListener('connect',this.connected);connection.addEventListener('close',this.closed);connection.addEventListener('terminate',this.closed);
  this.handshake=setTimeout(()=>this.fail('tvCastTimeout'),this.timeoutMs);this.connected();
 }
 private connected=()=>{if(this.connection?.state==='connected'&&this.sessionId&&!this.sentLoad)this.load();};
 private message=(event:Event)=>{
  const data=(event as MessageEvent).data;if(typeof data!=='string'||data.length>131072)return;
  let packet:any;try{packet=JSON.parse(data);}catch{return;}
  if(!packet||packet.clientId!==this.clientId||!packet.message||typeof packet.message!=='object')return;
  const body=packet.message;
  if(packet.type==='new_session'||packet.type==='update_session'){
   if(body.appId!=='CC1AD845'||typeof body.sessionId!=='string'||!body.sessionId||body.sessionId.length>512)return;
   if(this.sessionId&&this.sessionId!==body.sessionId)return;this.sessionId=body.sessionId;clearTimeout(this.handshake);
   this.update({connected:true,receiver:typeof body.receiver?.friendlyName==='string'?safeText(body.receiver.friendlyName,100):undefined});this.connected();return;
  }
  if(this.snapshot.phase==='error'||!this.sessionId||!this.sentLoad)return;
  if(packet.type==='error'){if(Number.isSafeInteger(packet.sequenceNumber)&&(packet.sequenceNumber===this.loadSequence||packet.sequenceNumber===this.pendingCommand))this.fail('tvWebLoadError');return;}
  if(packet.type!=='v2_message')return;
  if(['LOAD_FAILED','LOAD_CANCELLED','INVALID_REQUEST','INVALID_PLAYER_STATE'].includes(body.type)){if(Number.isSafeInteger(packet.sequenceNumber)&&(packet.sequenceNumber===this.loadSequence||packet.sequenceNumber===this.pendingCommand))this.fail('tvWebLoadError');return;}
  if(body.type!=='MEDIA_STATUS'||!Array.isArray(body.status))return;
  const status=body.status.find((item:any)=>Number.isSafeInteger(item.mediaSessionId)&&item.mediaSessionId>=0);if(!status)return;
  if(status.media?.contentId!==undefined){try{if(safeUrl(status.media.contentId)!==this.media.url)return;}catch{return;}}
  if(this.mediaSessionId===undefined&&packet.sequenceNumber!==this.loadSequence&&status.media?.contentId!==this.media.url)return;
  if(this.mediaSessionId!==undefined&&status.mediaSessionId!==this.mediaSessionId&&packet.sequenceNumber!==this.loadSequence)return;
  if(this.retiredMediaIds.has(status.mediaSessionId)){if(packet.sequenceNumber!==this.loadSequence)return;this.retiredMediaIds.delete(status.mediaSessionId);}
  this.mediaSessionId=status.mediaSessionId;
  if(status.playerState==='IDLE'&&status.idleReason==='ERROR'){this.fail('tvWebLoadError');return;}
  const phase:CastPhase|undefined={PLAYING:'playing',PAUSED:'paused',BUFFERING:'loading',IDLE:'finished'}[String(status.playerState)]as CastPhase|undefined;
  if(!phase)return;if(phase==='loading')this.waitForPlayback();else this.clearLoading();
  if(packet.sequenceNumber===this.pendingCommand||phase===this.pendingState||phase==='finished'){clearTimeout(this.commandTimer);this.pendingCommand=undefined;this.pendingState=undefined;}
  this.update({phase,error:undefined});
 };
 private send(body:Record<string,unknown>,sequence:number){
  if(!this.connection||this.connection.state!=='connected'||!this.sessionId)throw new Error('tvNoConnection');
  this.connection.send(JSON.stringify({type:'v2_message',clientId:this.clientId,sequenceNumber:sequence,timeoutMillis:this.timeoutMs,message:{...body,sessionId:this.sessionId}}));
 }
 load(media?:CastMedia){
  if(this.disposed)return;if(media)this.media=checkedCastMedia(media);this.clearTimers();this.sentLoad=true;if(this.mediaSessionId!==undefined){this.retiredMediaIds.add(this.mediaSessionId);if(this.retiredMediaIds.size>16)this.retiredMediaIds.delete(this.retiredMediaIds.values().next().value!);}this.mediaSessionId=undefined;this.loadSequence=++this.sequence;this.update({phase:'loading',error:undefined});this.waitForPlayback();
  try{this.send({type:'LOAD',autoplay:true,currentTime:0,media:{contentId:this.media.url,contentType:this.media.mime,streamType:this.media.live?'LIVE':'BUFFERED',metadata:{metadataType:0,title:this.media.title}}},this.loadSequence);}catch{this.fail('tvNoConnection');}
 }
 playPause(){
  if(this.disposed||this.mediaSessionId===undefined)return;const sequence=++this.sequence;this.pendingCommand=sequence;this.pendingState=this.snapshot.phase==='paused'?'playing':'paused';clearTimeout(this.commandTimer);this.commandTimer=setTimeout(()=>this.fail('tvCastTimeout'),this.timeoutMs);
  try{this.send({type:this.snapshot.phase==='paused'?'PLAY':'PAUSE',mediaSessionId:this.mediaSessionId},sequence);}catch{this.fail('tvNoConnection');}
 }
 stop(){try{this.connection?.terminate();this.cleanup();this.update({phase:'idle',connected:false,error:undefined,receiver:undefined});}catch{this.fail('tvNoConnection');}}
 private closed=()=>{this.cleanup();this.update({phase:'idle',connected:false,receiver:undefined,error:undefined});};
 private cleanup(){
  this.clearTimers();this.request?.removeEventListener('connectionavailable',this.available);
  this.connection?.removeEventListener('message',this.message);this.connection?.removeEventListener('connect',this.connected);this.connection?.removeEventListener('close',this.closed);this.connection?.removeEventListener('terminate',this.closed);
  this.connection=undefined;this.sessionId='';this.mediaSessionId=undefined;this.sentLoad=false;this.loadSequence=undefined;this.pendingCommand=undefined;this.pendingState=undefined;this.retiredMediaIds.clear();
 }
 dispose(){this.disposed=true;const connection=this.connection;this.cleanup();try{connection?.close();}catch{/* The browser already detached this document. */}}
}
