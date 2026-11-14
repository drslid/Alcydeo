import type{PageReply}from'../../../packages/media-core/page-transfer';
import{tiktokStreamPage}from'./tiktok-stream-page';
import{prefixKind}from'../../../packages/media-core/preflight';

// Chrome cannot cancel an executeScript waiting for a busy renderer. Release
// the worker slot locally; MAIN receives the same expiry and refuses a late
// fetch. A result arriving after expiry/abort cannot become a checked source.
export function sampleTikTok(tabId:number,frameId:number,url:string,videoId:string,signal:AbortSignal,expiresAt=Date.now()+8000):Promise<PageReply&{prefix?:string}>{
 if(signal.aborted||expiresAt<=Date.now())return Promise.resolve({error:'interrupted'});
 const deadline=Math.min(expiresAt,Date.now()+8000);
 return new Promise((resolve,reject)=>{
  let settled=false;
  const cleanup=()=>{clearTimeout(timer);signal.removeEventListener('abort',aborted);};
  const finish=(reply:PageReply&{prefix?:string})=>{if(settled)return;settled=true;cleanup();resolve(signal.aborted||Date.now()>=deadline?{error:'interrupted'}:reply);};
  const aborted=()=>finish({error:'interrupted'}),timer=setTimeout(aborted,deadline-Date.now());
  signal.addEventListener('abort',aborted,{once:true});
  if(signal.aborted){aborted();return;}
  try{
   const pending=chrome.scripting.executeScript({target:{tabId,frameIds:[frameId]},world:'MAIN',func:tiktokStreamPage,injectImmediately:true,args:['sample','',url,videoId,deadline]});
   void pending.then(results=>finish(results[0]?.result??{error:'interrupted'}),error=>{if(settled)return;settled=true;cleanup();reject(error);});
  }catch(error){settled=true;cleanup();reject(error);}
 });
}

// Alternatives come from one native format's UrlList, never a constructed URL.
export async function sampleTikTokSources(tabId:number,frameId:number,urls:string[],videoId:string,signal:AbortSignal,guard:(url:string)=>Promise<void>,expiresAt=Date.now()+8000):Promise<PageReply&{prefix?:string;url?:string}>{
 const deadline=Math.min(expiresAt,Date.now()+8000);let last:PageReply&{url?:string}={error:'network'},uncertain:typeof last|undefined;
 for(const url of [...new Set(urls)].slice(0,3)){
  if(signal.aborted||Date.now()>=deadline)return{error:'interrupted'};
  await guard(url);const data=await sampleTikTok(tabId,frameId,url,videoId,signal,deadline);
  if(signal.aborted||Date.now()>=deadline)return{error:'interrupted'};
  const kind=data.prefix?prefixKind(Uint8Array.from(atob(data.prefix),c=>c.charCodeAt(0))):'unknown';
  if(!data.error&&kind==='media')return{...data,url};
  last={...data,url,error:data.error??(kind==='html'||kind==='notMedia'?kind:'network')};
  if(!['expired','missing','network','html','notMedia','range'].includes(last.error!))return last;
  if(last.error==='network'||last.error==='range')uncertain??=last;
 }
 return uncertain??last;
}
