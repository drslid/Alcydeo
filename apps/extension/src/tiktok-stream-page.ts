import type{PageReply}from'../../../packages/media-core/page-transfer';
// Packaged code executed in the original TikTok frame. Chrome supplies that
// frame's normal origin/referrer; no header, cookie or signature is forged.
export async function tiktokStreamPage(action:string,key:string,url:string,videoId:string,deadline?:number,pageCredentials:'include'|'omit'='include'):Promise<PageReply&{prefix?:string}>{
 const w=window as any,property='__alcydeoTikTokStreams';let slot:any;
 const fail=(code:string)=>({error:code});
 try{
  if(!['sample','open','read','close'].includes(action)||key.length>100||!['include','omit'].includes(pageCredentials))return fail('invalid');
  const host=location.hostname,selected=location.pathname.match(/\/(?:video|v2|v1)\/(\d{10,25})(?:\/|$)/)?.[1];
  if(!/^(?:www\.|m\.)?tiktok\.com$/.test(host)||selected!==videoId)return fail('interrupted');
  const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||!/(^|\.)(tiktok\.com|tiktokcdn\.com|tiktokcdn-eu\.com|byteoversea\.com|ibytedtos\.com|muscdn\.com)$/.test(u.hostname)||/^(?:www\.|m\.)?tiktok\.com$/.test(u.hostname))return fail('unsupported');
  if((action==='sample'||action==='open')&&deadline!==undefined&&(!Number.isFinite(deadline)||deadline<=Date.now()))return fail('interrupted');
  const slots:Map<string,any>=w[property]??=new Map();
  const dispose=async(value:any)=>{if(!value)return;clearTimeout(value.timer);value.controller.abort();await value.reader?.cancel().catch(()=>{});slots.delete(key);};
  const encode=(data:Uint8Array)=>{let text='';for(let i=0;i<data.length;i+=16384)text+=String.fromCharCode(...data.subarray(i,i+16384));return btoa(text);};
  slot=slots.get(key);
  if(action==='close'){if(slot?.url===url)await dispose(slot);return{done:true};}
  if(action==='sample'||action==='open'){
   if(action==='open'){if(!key||slots.size>=2&&!slot)return fail('busy');await dispose(slot);}
   const remaining=deadline!==undefined?deadline-Date.now():action==='sample'?8000:15000;if(remaining<=0)return fail('interrupted');
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.min(action==='sample'?8000:15000,remaining));
   let reader:ReadableStreamDefaultReader<Uint8Array>|undefined,retained=false;
   if(action==='open'){slot={url,videoId,controller,timer,reader:undefined};slots.set(key,slot);}
   try{
    let credentials=pageCredentials,ranged=action==='sample',negotiated=credentials==='omit',response:Response|undefined;
    for(let attempt=0;attempt<3;attempt++){
     if(controller.signal.aborted||deadline!==undefined&&Date.now()>=deadline)throw new Error('interrupted');
     try{response=await fetch(url,{credentials,redirect:'error',...(ranged?{headers:{Range:'bytes=0-4095'}}:{}),signal:controller.signal});}
     catch(error){
      if(controller.signal.aborted||deadline!==undefined&&Date.now()>=deadline)throw new Error('interrupted');
      if(action==='sample'&&!negotiated&&error instanceof TypeError){credentials='omit';negotiated=true;continue;}
      throw error;
     }
     if(action==='sample'&&ranged&&[405,416].includes(response.status)){await response.body?.cancel().catch(()=>{});ranged=false;continue;}
     break;
    }
    if(!response)throw new Error('network');
    if(!response.ok){await response.body?.cancel().catch(()=>{});return fail([401,403].includes(response.status)?'expired':[404,410].includes(response.status)?'missing':response.status===429?'retryLater':'network');}
    const mime=(response.headers.get('content-type')??'').split(';')[0]!.toLowerCase();if(/html/.test(mime)){await response.body?.cancel();return fail('html');}if(/^text\/|application\/(?:json|xml)/.test(mime)){await response.body?.cancel();return fail('notMedia');}
    reader=response.body?.getReader();if(!reader)return fail('network');
    const integer=(value:string|null|undefined)=>{if(value==null||!/^\d+$/.test(value))return;const n=Number(value);return Number.isSafeInteger(n)&&n>=0?n:undefined;};
    const range=response.headers.get('content-range'),length=response.headers.get('content-length'),encoding=response.headers.get('content-encoding')?.trim().toLowerCase(),unencoded=!encoding||encoding==='identity';let size:number|undefined,sampleLength:number|undefined;
    if(action==='sample'&&response.status===206&&range!==null){
     const match=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(range??''),start=integer(match?.[1]),end=integer(match?.[2]),total=integer(match?.[3]);
     if(start!==0||end===undefined||end>4095||total===undefined||total<=end||length!==null&&integer(length)!==end+1)return fail('range');
     if(unencoded){size=total;sampleLength=end+1;}
    }else if(response.status===200&&range===null&&unencoded){const declared=integer(length);if(declared!==undefined&&declared>0)size=declared;}
    if(action==='sample'){
     const prefix=new Uint8Array(4096);let count=0;while(count<4096){const{done,value}=await reader.read();if(done){if(sampleLength!==undefined&&count<sampleLength)return fail('range');break;}if(sampleLength!==undefined&&count+value.length>sampleLength)return fail('range');const take=Math.min(value.length,4096-count);prefix.set(value.subarray(0,take),count);count+=take;}if(controller.signal.aborted||deadline!==undefined&&Date.now()>=deadline)return fail('interrupted');return{prefix:encode(prefix.subarray(0,count)),contentType:mime,size,...(credentials==='omit'?{pageCredentials:'omit' as const}:{})};
    }
    if(response.status!==200)return fail('range');
    if(controller.signal.aborted||deadline!==undefined&&Date.now()>=deadline)throw new Error('interrupted');slot={url,videoId,controller,reader,remaining:undefined,timer:undefined};slots.set(key,slot);retained=true;slot.timer=setTimeout(()=>{controller.abort();void reader?.cancel().catch(()=>{});slots.delete(key);},30000);reader=undefined;return{contentType:mime,size,...(credentials==='omit'?{pageCredentials:'omit' as const}:{})};
   }finally{clearTimeout(timer);if(!retained){controller.abort();await reader?.cancel().catch(()=>{});if(action==='open')slots.delete(key);}}
  }
  if(!slot||slot.url!==url||slot.videoId!==videoId)return fail('interrupted');clearTimeout(slot.timer);slot.timer=setTimeout(()=>{slot.controller.abort();void slot.reader.cancel().catch(()=>{});slots.delete(key);},30000);
  const data=new Uint8Array(262144);let count=0;
  while(count<data.length&&!slot.finished){
   const part=slot.remaining?{value:slot.remaining,done:false}:await slot.reader.read();slot.remaining=undefined;
   if(part.done){slot.finished=true;break;}if(!(part.value instanceof Uint8Array)||!part.value.length)throw new Error('network');
   const take=Math.min(data.length-count,part.value.length);data.set(part.value.subarray(0,take),count);count+=take;if(take<part.value.length)slot.remaining=part.value.subarray(take);
  }
  if(!count){await dispose(slot);return{done:true};}return{chunk:encode(data.subarray(0,count)),done:false};
 }catch(error){if(slot){clearTimeout(slot.timer);slot.controller?.abort();void slot.reader?.cancel().catch(()=>{});w[property]?.delete(key);}return fail(error instanceof Error&&(error.name==='AbortError'||error.message==='interrupted')?'interrupted':'network');}
}
