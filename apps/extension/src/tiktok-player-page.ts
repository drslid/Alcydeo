// Serialized MAIN-world reader. Inspect only data already attached to the
// selected player's DOM; never call application functions or retain raw props.
export function tiktokPlayerPage(blockedSites:string[]=[]):string|undefined{
 const pageUrl=location.href,host=location.hostname;
 if(!/^(?:www\.|m\.)?tiktok\.com$/.test(host))return;
 const expected=location.pathname.match(/^\/@[^/]+\/video\/(\d{10,25})(?:\/|$)/)?.[1]??location.pathname.match(/^\/(?:embed(?:\/v2)?|player\/v1)\/(\d{10,25})(?:\/|$)/)?.[1];
 if(!expected||blockedSites.some(p=>{const escaped=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g,'.*');return p.includes('*')?new RegExp(`^${escaped}$`).test(host)||(p.startsWith('*.')&&host===p.slice(2)):host===p||host.endsWith(`.${p}`);}))return;
 type RecordData=Record<string,unknown>;
 const record=():RecordData=>Object.create(null)as RecordData;
 const object=(value:unknown):value is object=>!!value&&typeof value==='object';
 const descriptor=(value:unknown,key:string)=>{if(!object(value))return;try{return Object.getOwnPropertyDescriptor(value,key);}catch{return;}};
 const own=(value:unknown,key:string):unknown=>{const found=descriptor(value,key);return found&&'value'in found?found.value:undefined;};
 const parentOf=(element:Element):Element|null=>{const field=descriptor(element,'parentElement');return field?'value'in field&&object(field.value)?field.value as Element:null:element.parentElement;};
 const primitive=(value:unknown)=>typeof value==='string'?value.length<=16384:value===null||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value);
 const seen=new WeakSet<object>(),deniedSeen=new WeakSet<object>(),fibers=new WeakSet<object>(),elements=new WeakSet<object>();let visited=0,refused:RecordData|undefined,selected:RecordData|undefined;
 const count=(value:unknown):value is object=>{if(!object(value)||visited>=2000)return false;visited++;return true;};
 const enter=(value:unknown,scope=seen):value is object=>{if(!object(value)||scope.has(value)||!count(value))return false;scope.add(value);return true;};
 const length=(value:unknown,maximum:number)=>{const size=own(value,'length');return typeof size==='number'&&Number.isSafeInteger(size)&&size>=0?Math.min(maximum,size):0;};
 const array=()=>{const value:unknown[]=[];Object.setPrototypeOf(value,null);return value;};
 function fields(value:object,names:string[]){const result=record();for(const key of names){const valueAtKey=own(value,key);if(valueAtKey!==undefined&&primitive(valueAtKey))result[key]=valueAtKey;}return result;}
 function address(value:unknown):unknown{
  if(typeof value==='string')return value.length<=16384?value:undefined;
  if(!count(value))return;
  if(Array.isArray(value)){
   const result=array();for(let n=0;n<length(value,3);n++){const entry=own(value,String(n));if(typeof entry==='string'&&entry.length<=16384)result[result.length]=entry;else if(count(entry)){const source=own(entry,'src');if(typeof source==='string'&&source.length<=16384){const clean=record();clean.src=source;result[result.length]=clean;}}}return result;
  }
  const result=fields(value,['src','Width','Height','DataSize','width','height','dataSize']),urls=own(value,'UrlList');
  if(count(urls)&&Array.isArray(urls)){const clean=array();for(let n=0;n<length(urls,3);n++){const source=own(urls,String(n));if(typeof source==='string'&&source.length<=16384)clean[clean.length]=source;}result.UrlList=clean;}return result;
 }
 function item(value:object,denied:boolean){
  if(own(value,'id')!==expected)return;
  const result=record();result.id=expected;
  const description=own(value,'desc');if(typeof description==='string')result.desc=description.slice(0,300);
  for(const flag of ['privateItem','forFriend','secret','isProhibited','takeDown']){
   const entry=descriptor(value,flag);if(!entry)continue;
   if(!('value'in entry)||!primitive(entry.value)){denied=true;continue;}
   result[flag]=entry.value;if(entry.value)denied=true;
  }
  if(denied){refused=result;return;}
  const video=own(value,'video');if(!count(video)||Array.isArray(video))return;
  const clean=fields(video,['width','height','duration','format','codecType','bitrate','size','cover','originCover']);
  for(const key of ['playAddr','PlayAddrStruct']){const source=address(own(video,key));if(source!==undefined)clean[key]=source;}
  const rows=own(video,'bitrateInfo');if(count(rows)&&Array.isArray(rows)){
   const copied=array();for(let n=0;n<length(rows,24);n++){const row=own(rows,String(n));if(!count(row)||Array.isArray(row))continue;const native=fields(row,['CodecType','Format','Bitrate']);for(const key of ['PlayAddr','playAddr']){const source=address(own(row,key));if(source!==undefined)native[key]=source;}copied[copied.length]=native;}clean.bitrateInfo=copied;
  }
  result.video=clean;selected??=result;
 }
 const paths=['children','props','detail','itemInfo','itemStruct','item','videoInfo','awemeInfo','data'];
 function walk(value:unknown,depth=0,denied=false){
  if(refused||depth>10||!enter(value,denied?deniedSeen:seen))return;
  if(Array.isArray(value)){for(let n=0;n<length(value,64)&&!refused;n++)walk(own(value,String(n)),depth+1,denied);return;}
  const status=own(value,'statusCode');const nativeRefusal=typeof status==='number'&&Number.isFinite(status)&&status!==0||typeof status==='string'&&/^\d{1,10}$/.test(status)&&Number(status)!==0;
  denied||=nativeRefusal;item(value,denied);
  for(const key of paths){if(refused)return;walk(own(value,key),depth+1,denied);}
 }
 let videos:NodeListOf<HTMLVideoElement>;try{videos=document.querySelectorAll('video');}catch{return;}
 for(let index=0;index<Math.min(4,videos.length)&&!refused;index++){
  let element:Element|null=videos[index]??null;
  for(let parent=0;element&&parent<=16&&!refused;parent++,element=parentOf(element)){
   if(elements.has(element))continue;elements.add(element);
   let keys:string[];try{keys=Object.getOwnPropertyNames(element);}catch{continue;}
   for(const key of keys.slice(0,128)){
    if(refused)break;
    if(key.startsWith('__reactProps$'))walk(own(element,key));
    else if(key.startsWith('__reactFiber$')){
     let fiber=own(element,key);for(let back=0;back<48&&object(fiber)&&!fibers.has(fiber)&&!refused;back++){
      if(visited>=2000)break;fibers.add(fiber);visited++;walk(own(fiber,'memoizedProps'));fiber=own(fiber,'return');
     }
    }
   }
  }
 }
 const result=refused??selected;if(!result||location.href!==pageUrl)return;
 const module=record();module[expected]=result;const envelope=record();envelope.ItemModule=module;return JSON.stringify(envelope);
}
