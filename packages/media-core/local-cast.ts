import{remotePlaybackError}from'./remote-playback';
// URLs come only from Chrome's download records, never from a web page.
// Network shares are excluded: opening a file must not initiate SMB access.
export function localFileUrl(filename:string){
 if(Array.from(filename).some(char=>char.charCodeAt(0)<32||char.charCodeAt(0)===127)||/^(?:\\\\|\/\/)/.test(filename))throw new Error('tvFilePath');
 const path=filename.replace(/\\/g,'/');
 if(!/^(?:[a-z]:\/|\/[^/])/i.test(path)||path.split('/').some(p=>p==='.'||p==='..'))throw new Error('tvFilePath');
 return 'file:///'+path.replace(/^\//,'').split('/').map((part,i)=>i===0&&/^[a-z]:$/i.test(part)?part:encodeURIComponent(part)).join('/');
}
export interface LocalRemote extends EventTarget{state:string;prompt():Promise<void>}
export interface LocalCastState{phase:'disconnected'|'choosing'|'connecting'|'connected'|'error';error?:string}
export class LocalCast{
 private disposed=false;private pending=false;
 constructor(private remote:LocalRemote,private changed:(state:LocalCastState)=>void){for(const event of ['connect','connecting','disconnect'])remote.addEventListener(event,this.state);}
 private state=()=>{if(!this.disposed)this.changed({phase:this.remote.state==='connected'?'connected':this.remote.state==='connecting'?'connecting':'disconnected'});};
 async choose(){
  if(this.disposed||this.pending)return;this.pending=true;this.changed({phase:'choosing'});
  try{const request=this.remote.prompt();await request;if(!this.disposed){if(this.remote.state==='disconnected')this.changed({phase:'error',error:'tvNoConnection'});else this.state();}}
  catch(error){if(!this.disposed)this.changed({phase:'error',error:remotePlaybackError(error)});}
  finally{this.pending=false;}
 }
 dispose(){this.disposed=true;for(const event of ['connect','connecting','disconnect'])this.remote.removeEventListener(event,this.state);}
}
