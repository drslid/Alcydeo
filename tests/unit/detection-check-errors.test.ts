import{afterEach,describe,expect,it,vi}from'vitest';
import{createDetection}from'../../apps/extension/src/detection';
import{scanPage}from'../../apps/extension/src/detect';
import{tiktokPage}from'../../apps/extension/src/tiktok-page';
import{tiktokStreamPage}from'../../apps/extension/src/tiktok-stream-page';
import{defaults}from'../../packages/contracts';
const id='7700630488859315489',page=`https://www.tiktok.com/@original/video/${id}`,url='https://v16-webapp-prime.tiktok.com/original.mp4?signature=fixture';
const event=()=>({addListener:vi.fn(),removeListener:vi.fn()});
const prefix=btoa(String.fromCharCode(0,0,0,24)+'ftypisom'+String.fromCharCode(0,0,0,0)+'isomiso2');
function environment(cdnGranted:boolean,firstError?:string,onSample?:(url:string,state:Record<string,any>,catalog:any)=>unknown){
 vi.useFakeTimers();const state:Record<string,any>={},catalog={videoId:id,title:'Original visibility fixture',formats:[{url,urls:[url],height:1024,size:3000000,codec:'H.264'}]};let sampled=0,cdnChecks=0,failSample:(error:Error)=>void=()=>{};
 const get=async(key:string)=>structuredClone(key?{[key]:state[key]}:{...state});
 const permission=vi.fn(async({origins}:{origins:string[]})=>{if(origins.includes('http://*/*')||origins.includes('https://*/*'))return false;if(origins.some(u=>u.includes('v16-webapp-prime.tiktok.com'))){cdnChecks++;return cdnGranted;}return true;});
 vi.stubGlobal('chrome',{
  action:{setBadgeText:vi.fn(async()=>{}),setBadgeBackgroundColor:vi.fn(async()=>{})},runtime:{getManifest:()=>({version:'0.1.53',host_permissions:['http://*/*','https://*/*']})},
  storage:{local:{get:async()=>({observedOrigins:[]}),set:async()=>{}},session:{get,set:async(value:Record<string,any>)=>Object.assign(state,structuredClone(value)),remove:async(keys:string[])=>{for(const key of keys)delete state[key];}}},
  tabs:{query:async()=>[{id:1,url:page}],get:async()=>({id:1,url:page}),onUpdated:event(),onRemoved:event()},
  permissions:{getAll:async()=>({origins:['https://www.tiktok.com/*',...(cdnGranted?['https://v16-webapp-prime.tiktok.com/*']:[])]}),contains:permission,onAdded:event(),onRemoved:event()},
  scripting:{getRegisteredContentScripts:async()=>[],registerContentScripts:async()=>{},updateContentScripts:async()=>{},unregisterContentScripts:async()=>{},executeScript:vi.fn(async(injection:any)=>{
   if(injection.files)return[];
   if(injection.func===scanPage)return[{frameId:0,documentId:'document',result:{media:[],frameOrigins:[]}}];
   if(injection.func===tiktokPage)return[{frameId:0,documentId:'document',result:catalog}];
   if(injection.func===tiktokStreamPage){sampled++;if(onSample){const result=onSample(injection.args[2],state,catalog);if(result!==undefined)return[{frameId:0,documentId:'document',result}];}if(firstError==='deferred'&&sampled===1)return await new Promise((_resolve,reject)=>{failSample=reject;});if(firstError&&sampled===1)throw new Error(firstError);return[{frameId:0,documentId:'document',result:{prefix,size:3000000,contentType:'video/mp4'}}];}
   return[{frameId:0,documentId:'document',result:{href:page}}];
  })},webRequest:{onBeforeRequest:event(),onHeadersReceived:event(),onBeforeRedirect:event(),onErrorOccurred:event()},
 });vi.stubGlobal('navigator',{locks:{request:async(_name:string,work:()=>unknown)=>work()}});
 const detection=createDetection(async()=>({...defaults}));return{state,detection,sampled:()=>sampled,cdnChecks:()=>cdnChecks,failSample:(error:Error)=>failSample(error),catalog};
}
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();});
describe('source-check failures stay diagnosable without publishing an unconfirmed card',()=>{
 it('persists a withheld CDN permission as unknown without a source request or a false card',async()=>{
  const s=environment(false);await vi.waitFor(()=>expect(s.cdnChecks()).toBeGreaterThan(0));await vi.waitFor(()=>expect(s.detection.pending(1)).toBe(false));
  expect(s.state['tab:1']).toHaveLength(1);expect(s.state['tab:1'][0].providerId).toBe('tiktok:'+id);expect(s.state['tab:1'][0].variants).toHaveLength(1);expect(s.state['tab:1'][0].variants[0].check).toMatchObject({state:'unknown',error:'permission'});expect(await s.detection.cached(1)).toEqual([]);expect(await s.detection.rejectedCount(1)).toBe(1);expect(s.sampled()).toBe(0);
  const diagnostic=await s.detection.diagnostics(1);expect(diagnostic).toMatchObject({rawMediaCount:1,eligibleCount:1,visibleCount:0,pending:false,budget:{attempted:1},sources:[{state:'unknown',error:'permission',sourceGranted:false}]});expect(JSON.stringify(diagnostic)).not.toContain(url);expect(JSON.stringify(diagnostic)).not.toContain(id);
 });
 it('the same original metadata appears once its own source permission allows a ready prefix',async()=>{
  const s=environment(true);await vi.waitFor(()=>expect(s.sampled()).toBeGreaterThan(0));await vi.waitFor(async()=>expect(await s.detection.cached(1)).toHaveLength(1));expect(s.state['tab:1'][0].variants[0].check.state).toBe('ready');
  expect((await s.detection.diagnostics(1)).visibleCount).toBe(1);
 });
 it.each(['cancelled','busy'])('does not consume the attempt after a nonpersisted %s and can check the next attempt',async code=>{const s=environment(true,code);await vi.waitFor(async()=>expect(await s.detection.cached(1)).toHaveLength(1));expect(s.sampled()).toBe(2);expect((await s.detection.diagnostics(1)).budget.attempted).toBe(1);});
 it('persists an injection failure using a fixed safe code rather than its exception text',async()=>{const s=environment(true,'Unexpected private signature token');await vi.waitFor(()=>expect(s.state['tab:1']?.[0]?.variants[0]?.check).toMatchObject({state:'unknown',error:'script'}));const diagnostic=await s.detection.diagnostics(1);expect(diagnostic.visibleCount).toBe(0);expect(diagnostic.sources[0]?.error).toBe('script');expect(JSON.stringify(diagnostic)).not.toContain('private signature');});
 it('keeps and returns a newer ready proof for the exact URL when an older attempt fails after regrouping',async()=>{
  const s=environment(true,'deferred');await vi.waitFor(()=>expect(s.sampled()).toBe(1));const entry=s.state['tab:1'][0],oldId=entry.id,variant=entry.variants[0];const joined=s.detection.check(1,oldId,variant.id);for(let n=0;n<100;n++)await Promise.resolve();
  vi.setSystemTime(Date.now()+5);const ready={state:'ready',checkedAt:Date.now(),size:3000000,contentType:'video/mp4'};entry.id='regrouped-native-media';entry.aliases=[oldId];variant.check=ready;s.failSample(new Error('Old renderer exception'));
  expect(await joined).toEqual(ready);await vi.waitFor(()=>expect(s.detection.pending(1)).toBe(false));expect(s.state['tab:1'][0].variants[0].check).toEqual(ready);expect(await s.detection.cached(1)).toHaveLength(1);
 });
 it('never treats a newer ready proof on a different URL as success for the failed original request',async()=>{
  const s=environment(true,'deferred');await vi.waitFor(()=>expect(s.sampled()).toBe(1));const entry=s.state['tab:1'][0],oldId=entry.id,variant=entry.variants[0];const joined=s.detection.check(1,oldId,variant.id);for(let n=0;n<100;n++)await Promise.resolve();
  vi.setSystemTime(Date.now()+5);const ready={state:'ready',checkedAt:Date.now(),size:3000000};variant.url=url+'&native-backup=1';variant.check=ready;s.failSample(new Error('Old renderer exception'));
  expect(await joined).toMatchObject({state:'unknown',error:'script'});await vi.waitFor(()=>expect(s.detection.pending(1)).toBe(false));expect(s.state['tab:1'][0].variants[0].url).toBe(url+'&native-backup=1');expect(s.state['tab:1'][0].variants[0].check).toEqual(ready);
 });
 it('attaches a refused backup to the same promoted variant instead of checking that backup again',async()=>{
  const backup=url.replace('v16-webapp-prime','v19-webapp-prime'),requests:string[]=[];
  const s=environment(true,undefined,(requested,state)=>{requests.push(requested);if(requested===url){const entry=state['tab:1'][0],variant=entry.variants[0];entry.url=backup;variant.url=backup;variant.sourceUrls=[backup];}return{error:'expired'};});s.catalog.formats[0]!.urls.push(backup);
  await vi.waitFor(()=>expect(s.detection.pending(1)).toBe(false));await vi.waitFor(()=>expect(requests).toContain(backup));await vi.waitFor(()=>expect(s.state['tab:1'][0].variants[0].check).toMatchObject({state:'unavailable',error:'expired'}));
  expect(requests).toEqual([url,backup]);expect(s.state['tab:1'][0].variants[0].url).toBe(backup);expect(await s.detection.cached(1)).toEqual([]);
 });

});
