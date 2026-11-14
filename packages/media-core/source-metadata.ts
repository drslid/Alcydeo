const prefixLimit=4096;
function integer(value:string|null){if(value===null||!/^\d+$/.test(value))return;const n=Number(value);return Number.isSafeInteger(n)&&n>=0?n:undefined;}
function rangeMetadata(headers:Headers){
 const match=/^bytes (\d+)-(\d+)\/(\d+|\*)$/.exec(headers.get('content-range')??'');if(!match)return;
 const start=integer(match[1]!),end=integer(match[2]!),total=match[3]==='*'?undefined:integer(match[3]!);
 if(start===undefined||end===undefined||end<start||!Number.isSafeInteger(end-start+1)||match[3]!=='*'&&(total===undefined||total<=end))return;
 const length=end-start+1,declared=headers.get('content-length');if(declared!==null&&integer(declared)!==length)return;
 return{start,end,total,length};
}
function unencoded(headers:Headers){const encoding=headers.get('content-encoding')?.trim().toLowerCase();return!encoding||encoding==='identity';}

// An HTTP-declared complete representation size, never the length of a 206
// response body. Encoded wire lengths cannot describe the decoded media bytes.
export function responseSize(status:number,headers:Headers):number|undefined{
 if(!unencoded(headers))return;
 if(status===206)return rangeMetadata(headers)?.total;
 if(status!==200||headers.has('content-range'))return;
 const size=integer(headers.get('content-length'));return size!==undefined&&size>0?size:undefined;
}

export function sampleResponseSize(status:number,headers:Headers,start:number,end:number){
 const range=status===206?rangeMetadata(headers):undefined;
 if(status===206&&(!range||range.start!==start||range.end>end)||start>0&&status!==206)throw new Error('range');
 return{size:responseSize(status,headers),length:unencoded(headers)?range?.length:undefined};
}

async function dimensions(bytes:Uint8Array):Promise<{width:number;height:number}|undefined>{
 const{Input,BufferSource,MP4,QTFF,WEBM,MATROSKA,MPEG_TS}=await import('mediabunny');
 const input=new Input({source:new BufferSource(bytes),formats:[MP4,QTFF,WEBM,MATROSKA,MPEG_TS]});
 const{mediaLogs}=await import('./media-logs');const logs=mediaLogs();
 try{
  const tracks=await input.getVideoTracks();if(tracks.length!==1)return;
  const width=Math.round(await tracks[0]!.getDisplayWidth()),height=Math.round(await tracks[0]!.getDisplayHeight());
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>65535||height>65535)return;
  return{width,height};
 }catch{return;}finally{try{input.dispose();}finally{logs.dispose();}}
}

// Missing moov/SPS or an unsupported/truncated prefix leaves dimensions
// unknown. No decoder, duration scan or remote reader is used by this parser.
export const prefixDimensions=(bytes:Uint8Array)=>dimensions(bytes.subarray(0,prefixLimit));

// Direct ISO-BMFF files may place moov after a large mdat or hold huge sample
// tables inside moov. Read only presentation headers; skip every media/index
// payload instead of allocating a remotely declared moov length.
// All attempted extra reads share a 64-KiB/four-request budget and deadline.
export async function directDimensions(url:string,size:number,prefix:Uint8Array,guard:(url:string)=>Promise<void>,signal?:AbortSignal,etag?:string):Promise<{width:number;height:number}|undefined>{
 const code=(bytes:Uint8Array)=>String.fromCharCode(...bytes.subarray(4,8));
 const initial=prefix.subarray(0,prefixLimit);
 if(!Number.isSafeInteger(size)||size<=initial.length||initial.length<8||!['ftyp','moov','mdat','free','wide','styp','moof','sidx'].includes(code(initial)))return;
 const limit=65536,controller=new AbortController(),timeout=AbortSignal.timeout(8000),bounded=AbortSignal.any([controller.signal,timeout,...(signal?[signal]:[])]);
 const windows:{start:number;bytes:Uint8Array}[]=[{start:0,bytes:initial}];let requests=0,reserved=0,reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
 const strong=etag&&/^"[^"\r\n]*"$/.test(etag)?etag:undefined;
 const abort=()=>{controller.abort();void reader?.cancel().catch(()=>{});};bounded.addEventListener('abort',abort,{once:true});
 async function interruptible<T>(promise:Promise<T>){
  bounded.throwIfAborted();let rejectAbort:()=>void=()=>{};
  const cancelled=new Promise<never>((_resolve,reject)=>{rejectAbort=()=>reject(new Error('cancelled'));bounded.addEventListener('abort',rejectAbort,{once:true});});
  try{return await Promise.race([promise,cancelled]);}finally{bounded.removeEventListener('abort',rejectAbort);}
 }
 async function block(start:number,end:number){
  bounded.throwIfAborted();const length=end-start;
  if(requests>=4||length<=0||reserved+length>limit)throw new Error('metadataLimit');requests++;reserved+=length;
  await interruptible(guard(url));bounded.throwIfAborted();
  const pending=fetch(url,{credentials:'include',redirect:'error',cache:'no-store',headers:{Range:`bytes=${start}-${end-1}`,...(strong?{'If-Range':strong}:{})},signal:bounded});
  void pending.then(response=>{if(bounded.aborted)void response.body?.cancel().catch(()=>{});},()=>{});
  const response=await interruptible(pending);reader=response.body?.getReader();
  try{
   bounded.throwIfAborted();const range=sampleResponseSize(response.status,response.headers,start,end-1);
   if(response.status!==206||range.size!==size||range.length!==length||strong&&response.headers.get('etag')!==strong)throw new Error('range');
   const type=(response.headers.get('content-type')??'').split(';')[0]!.trim().toLowerCase(),filename=response.headers.get('content-disposition')??'';
   if(/^text\/|application\/(?:json|xml|xhtml\+xml)$/.test(type)||/filename\*?\s*=.*\.html?(?:["';\s]|$)/i.test(filename)||!reader)throw new Error('notMedia');
   const bytes=new Uint8Array(length);let received=0;
   while(received<length){const{done,value}=await interruptible(reader.read());if(done||value.length>length-received)throw new Error('range');bytes.set(value,received);received+=value.length;}
   const text=new TextDecoder().decode(bytes.subarray(0,512)).replace(/^\uFEFF/,'').trimStart();
   if(/^(?:<!doctype\s+html\b|<(?:html|head|body|script|error)\b|<\?xml\b|\{\s*"|\[\s*\{)/i.test(text))throw new Error('notMedia');
   windows.push({start,bytes});return bytes;
  }finally{await reader?.cancel().catch(()=>{});reader=undefined;}
 }
 async function read(start:number,end:number){
  bounded.throwIfAborted();if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<=start||end>size||end-start>limit)throw new Error('metadataLimit');
  const cached=windows.find(w=>w.start<=start&&w.start+w.bytes.length>=end);if(cached)return cached.bytes.subarray(start-cached.start,end-cached.start);
  const out=new Uint8Array(end-start);let position=start;
  while(position<end){
   bounded.throwIfAborted();const hit=windows.find(w=>w.start<=position&&w.start+w.bytes.length>position);
   if(hit){const stop=Math.min(end,hit.start+hit.bytes.length);out.set(hit.bytes.subarray(position-hit.start,stop-hit.start),position-start);position=stop;continue;}
   const next=Math.min(size,...windows.filter(w=>w.start>position).map(w=>w.start));
   const stop=Math.min(size,next,Math.max(end,position+16384),position+limit-reserved);
   await block(position,stop);
  }
  return out;
 }
 type Box={body:number;end:number;kind:string};let boxes=0;
 async function header(offset:number,end:number):Promise<Box>{
  if(++boxes>64)throw new Error('metadataLimit');const bytes=await read(offset,Math.min(end,offset+16));if(bytes.length<8)throw new Error('invalid');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let length=view.getUint32(0),headerSize=8;
  if(length===1){if(bytes.length<16)throw new Error('invalid');const large=view.getBigUint64(8);if(large>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('invalid');length=Number(large);headerSize=16;}
  else if(length===0)length=end-offset;
  if(length<headerSize||length>end-offset)throw new Error('invalid');return{body:offset+headerSize,end:offset+length,kind:code(bytes)};
 }
 async function children(start:number,end:number,visit:(box:Box)=>Promise<void>){let offset=start;while(offset<end){const box=await header(offset,end);await visit(box);offset=box.end;}}
 function orthogonal(view:DataView,offset:number):boolean|undefined{
  const a=view.getInt32(offset),b=view.getInt32(offset+4),u=view.getInt32(offset+8),c=view.getInt32(offset+12),d=view.getInt32(offset+16),v=view.getInt32(offset+20),w=view.getInt32(offset+32);
  if(u!==0||v!==0||w!==1073741824||![a,b,c,d].every(n=>n===0||n===65536||n===-65536)||Math.abs(a)+Math.abs(c)!==65536||Math.abs(b)+Math.abs(d)!==65536||a*b+c*d!==0)return;
  return a===0;
 }
 async function fieldView(box:Box,length:number){if(length>box.end-box.body)throw new Error('invalid');const bytes=await read(box.body,box.body+length);return new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);}
 async function presentation(box:Box){
  type Track={role?:string;dimensions?:{width:number;height:number;swap:boolean}};
  const tracks:Track[]=[];let movieSwap:boolean|undefined,movieSeen=false;
  await children(box.body,box.end,async child=>{
   if(child.kind==='mvhd'){
    if(movieSeen)throw new Error('invalid');movieSeen=true;const version=(await fieldView(child,4)).getUint8(0),offset=version===0?36:version===1?48:0;if(!offset)throw new Error('invalid');movieSwap=orthogonal(await fieldView(child,offset+36),offset);
   }else if(child.kind==='trak'){
    const track:Track={};tracks.push(track);let trackSeen=false,mediaSeen=false;
    await children(child.body,child.end,async part=>{
     if(part.kind==='tkhd'){
      if(trackSeen)throw new Error('invalid');trackSeen=true;const version=(await fieldView(part,4)).getUint8(0),offset=version===0?40:version===1?52:0;if(!offset)return;
      const view=await fieldView(part,offset+44),swap=orthogonal(view,offset),width=view.getUint32(offset+36),height=view.getUint32(offset+40);
      if(swap!==undefined&&width>0&&height>0&&width%65536===0&&height%65536===0)track.dimensions={width:width/65536,height:height/65536,swap};
     }else if(part.kind==='mdia'){
      if(mediaSeen)throw new Error('invalid');mediaSeen=true;await children(part.body,part.end,async media=>{if(media.kind==='hdlr'){if(track.role!==undefined)throw new Error('invalid');const view=await fieldView(media,12);track.role=String.fromCharCode(view.getUint8(8),view.getUint8(9),view.getUint8(10),view.getUint8(11));}});
     }
    });
   }
  });
  const videos=tracks.filter(t=>t.role==='vide');if(!movieSeen||movieSwap===undefined||videos.length!==1||!videos[0]!.dimensions)return;
  const{width,height,swap}=videos[0]!.dimensions;return swap!==movieSwap?{width:height,height:width}:{width,height};
 }
 try{
  let offset=0;while(offset<size){const box=await header(offset,size);if(box.kind==='moov')return await presentation(box);offset=box.end;}
 }catch{return;}finally{bounded.removeEventListener('abort',abort);controller.abort();void reader?.cancel().catch(()=>{});}
}
