import{afterEach,describe,expect,it,vi}from'vitest';
import{createDetection}from'../../apps/extension/src/detection';
import{defaults}from'../../packages/contracts';

const allowed='https://observer.example/post';
const event=()=>({addListener:vi.fn(),removeListener:vi.fn()});
async function flush(){for(let n=0;n<100;n++)await Promise.resolve();}
function environment(options:{off?:boolean;staleQuery?:boolean;replaceAtProbe?:boolean;navigateAtProbe?:string;topMismatch?:boolean;emptyRestore?:boolean}={}){
 vi.useFakeTimers();
 let tab={id:1,url:options.staleQuery?'about:blank':allowed,incognito:false,discarded:false},documentId='initial-document',active=true;
 const state:Record<string,unknown>={};
 const query=vi.fn(async()=>{const snapshot={...tab};if(options.staleQuery)tab={...tab,url:allowed};return options.emptyRestore?[]:[snapshot];});
 const executeScript=vi.fn(async(injection:any)=>{
  if(injection.files){if(injection.target.documentIds&&!injection.target.documentIds.includes(documentId))throw new Error('No matching document');active=true;return[];}
  if(injection.func.toString().includes('__alcydeoObserveCleanup')){if(injection.target.documentIds&&!injection.target.documentIds.includes(documentId))throw new Error('No matching document');active=false;return[];}
  const reply=[{frameId:0,documentId,result:{href:options.topMismatch?'https://other.example/post':tab.url}}];if(options.replaceAtProbe||options.navigateAtProbe){documentId='replacement-document';active=true;}if(options.navigateAtProbe)tab={...tab,url:options.navigateAtProbe};return reply;
 });
 const remove=vi.fn(async(keys:string[])=>{for(const key of keys)delete state[key];});
 vi.stubGlobal('chrome',{
  action:{setBadgeText:vi.fn(async()=>{}),setBadgeBackgroundColor:vi.fn(async()=>{})},
  runtime:{getManifest:()=>({host_permissions:['http://*/*','https://*/*']})},
  storage:{local:{get:vi.fn(async()=>({observedOrigins:[]})),set:vi.fn(async()=>{})},session:{get:vi.fn(async()=>({...state})),set:vi.fn(async(value:Record<string,unknown>)=>Object.assign(state,value)),remove}},
  tabs:{query,get:vi.fn(async()=>({...tab})),onUpdated:event(),onRemoved:event()},
  permissions:{getAll:vi.fn(async()=>({origins:['http://*/*','https://*/*']})),contains:vi.fn(async()=>true),onAdded:event(),onRemoved:event()},
  scripting:{executeScript,getRegisteredContentScripts:vi.fn(async()=>[]),registerContentScripts:vi.fn(async()=>{}),updateContentScripts:vi.fn(async()=>{}),unregisterContentScripts:vi.fn(async()=>{})},
  webRequest:{onBeforeRequest:event(),onHeadersReceived:event(),onBeforeRedirect:event(),onErrorOccurred:event()},
 });
 vi.stubGlobal('navigator',{locks:{request:async(_name:string,work:()=>unknown)=>work()}});
 const detection=createDetection(async()=>({...defaults,globalDetection:!options.off}));
 return{detection,executeScript,remove,records:state,active:()=>active,setUrl:(url:string)=>{tab={...tab,url};}};
}
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();});
describe('restoring existing tab observers without targeting a later document',()=>{
 it('rereads an about:blank query snapshot before touching the now authorized document',async()=>{
  const state=environment({staleQuery:true});await flush();expect(state.active()).toBe(true);expect(state.remove).not.toHaveBeenCalled();
  const files=state.executeScript.mock.calls.filter(([injection])=>injection.files);expect(files).toHaveLength(1);expect(files[0]![0].target).toEqual({tabId:1,documentIds:['initial-document']});
 });
 it('targets cleanup to the probed document rather than a same-URL replacement',async()=>{
  const state=environment({off:true,replaceAtProbe:true});await flush();expect(state.active()).toBe(true);
  const cleanups=state.executeScript.mock.calls.filter(([injection])=>injection.func?.toString().includes('__alcydeoObserveCleanup'));expect(cleanups).toHaveLength(1);expect(cleanups[0]![0].target).toEqual({tabId:1,documentIds:['initial-document']});
 });
 it('does not inject an observer into a same-URL document that was never probed',async()=>{
  const state=environment({replaceAtProbe:true});await flush();expect(state.active()).toBe(true);
  const files=state.executeScript.mock.calls.filter(([injection])=>injection.files);expect(files).toHaveLength(1);expect(files[0]![0].target).toEqual({tabId:1,documentIds:['initial-document']});
 });
 it('does not clean up or clear a tab that navigated after the document probe',async()=>{
  const state=environment({off:true,navigateAtProbe:'https://observer.example/new-post'});await flush();expect(state.active()).toBe(true);expect(state.remove).not.toHaveBeenCalled();expect(state.executeScript.mock.calls.filter(([injection])=>injection.func?.toString().includes('__alcydeoObserveCleanup'))).toHaveLength(0);
 });
 it('does not install files when the probed main-frame href differs from the current Chrome tab URL',async()=>{
  const state=environment({topMismatch:true});await flush();expect(state.active()).toBe(true);expect(state.executeScript.mock.calls.filter(([injection])=>injection.files)).toHaveLength(0);expect(state.remove).not.toHaveBeenCalled();
 });
});

describe('scheduled scans wait for current policy and page scope',()=>{
 it.each(['SPA','document'])('keeps a replacement page cache when %s navigation occurs during a denied permission check',async kind=>{
  const state=environment({emptyRestore:true});await flush();let release:(value:boolean)=>void=()=>{};
  vi.mocked(chrome.permissions.contains).mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));state.detection.changed(1);await vi.advanceTimersByTimeAsync(0);
  if(kind==='SPA')state.setUrl('https://observer.example/new-post');
  else{const navigation=vi.mocked(chrome.webRequest.onBeforeRequest.addListener).mock.calls.find((args:any[])=>args[1]?.types?.includes('main_frame'))![0];navigation({tabId:1}as any);await flush();state.remove.mockClear();}
  const replacement=[{id:'replacement-page',pageUrl:kind==='SPA'?'https://observer.example/new-post':allowed}];state.records['tab:1']=replacement;release(false);await flush();
  expect(state.remove).not.toHaveBeenCalled();expect(state.records['tab:1']).toEqual(replacement);
 });
 it('does not clear a newly authorized page using an about:blank snapshot taken before policy restoration',async()=>{
  const state=environment({emptyRestore:true});await flush();state.setUrl('about:blank');
  let release:(value:{origins:string[]})=>void=()=>{};vi.mocked(chrome.permissions.getAll).mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
  const pending=state.detection.synchronize();state.detection.changed(1);await vi.advanceTimersByTimeAsync(0);
  state.setUrl(allowed);const url='https://media.example/current.mp4';state.records['tab:1']=[{id:'current-media',tabId:1,pageUrl:allowed,frameId:0,title:'Current clip',url,kind:'direct',detectedBy:'dom',contentType:'video/mp4',variants:[{id:'current-quality',url,label:'720p',height:720,size:20000,contentType:'video/mp4',check:{state:'ready',checkedAt:Date.now(),size:20000}}]}];
  state.executeScript.mockResolvedValue([{frameId:0,result:{media:[{urls:[{url,label:'720p'}],title:'Current clip',explicitTitle:true}],frameOrigins:[]}}]);
  release({origins:['http://*/*','https://*/*']});await pending;await flush();
  expect(state.remove).not.toHaveBeenCalled();expect(state.records['tab:1']).toMatchObject([{url,pageUrl:allowed}]);
 });
});
