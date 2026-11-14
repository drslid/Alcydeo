import{beforeEach,afterEach,test,expect,vi}from'vitest';
import{defaults}from'../../packages/contracts';
const fixture=vi.hoisted(()=>({stored:{}as Record<string,any>,listener:undefined as any,drain:vi.fn(async()=>{}),task:undefined as any,beforeState:undefined as undefined|(()=>void)}));
vi.mock('../../apps/extension/src/detection',()=>({createDetection:()=>({reject:async()=>{},cached:async()=>[],scan:async()=>[],synchronize:async()=>{},resetChecks:async()=>{}})}));
vi.mock('../../apps/extension/src/native-downloads',()=>({createNativeDownloads:()=>({start:async()=>{},refresh:async()=>{},drain:fixture.drain,resume:async()=>{},browserRestart:async()=>{}})}));
vi.mock('../../packages/contracts/distribution',()=>({LOCAL_BUILD:false,isLocalBuild:()=>false,youtubeHost:()=>false}));
vi.mock('../../packages/storage',()=>({allTasks:async()=>[],getTask:async()=>structuredClone(fixture.task),putTask:async()=>{},changeTask:async()=>{},setState:async(_id:string,state:string)=>{fixture.beforeState?.();fixture.task.state=state;return structuredClone(fixture.task);},removeTask:async()=>{},removeHistory:async()=>[],mediaTaskLock:(id:string)=>id,outputSaveLock:(id:string)=>id}));
beforeEach(()=>{
 vi.resetModules();fixture.stored={};fixture.listener=undefined;fixture.task=undefined;fixture.beforeState=undefined;fixture.drain.mockClear();
 vi.stubGlobal('defineBackground',(main:()=>void)=>main());
 vi.stubGlobal('chrome',{
  runtime:{id:'fixture',getURL:(path:string)=>`chrome-extension://fixture${path}`,sendMessage:async()=>{},onStartup:{addListener:()=>{}},onMessage:{addListener:(listener:any)=>{fixture.listener=listener;}}},
  storage:{local:{get:async()=>structuredClone(fixture.stored),set:async(value:any)=>{Object.assign(fixture.stored,structuredClone(value));},remove:async()=>{}},session:{remove:async()=>{}},onChanged:{addListener:()=>{}}},
  permissions:{contains:async()=>true},tabs:{query:async()=>[]},downloads:{pause:vi.fn(async()=>{}),cancel:vi.fn(async()=>{})},
 });
});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
async function boot(previous?:unknown){if(previous!==undefined)fixture.stored.settings={...defaults,maxConcurrentFiles:previous};await import('../../apps/extension/entrypoints/background');}
async function settings(value:any){return new Promise<any>(resolve=>{const keep=fixture.listener({type:'settings',value},{id:'fixture',url:'chrome-extension://fixture/manager.html'},resolve);expect(keep).toBe(true);});}
test.each([1,2,3,4,5,6,7,8])('settings API persists the exact integer limit %s and wakes the native queue',async maxConcurrentFiles=>{
 await boot();const result=await settings({...defaults,maxConcurrentFiles});expect(result).toEqual({ok:true,data:true});expect(fixture.stored.settings.maxConcurrentFiles).toBe(maxConcurrentFiles);expect(fixture.drain).toHaveBeenCalled();
});
test.each([0,9,-1,1.5,'4',null,NaN,Infinity])('settings API rejects explicit invalid concurrency %s',async maxConcurrentFiles=>{
 await boot(3);const result=await settings({...defaults,maxConcurrentFiles});expect(result).toMatchObject({ok:false,error:'invalid'});expect(fixture.stored.settings.maxConcurrentFiles).toBe(3);
});
test('older settings messages preserve the current limit when the new field is absent',async()=>{
 await boot(6);const older:any={...defaults};delete older.maxConcurrentFiles;expect(await settings(older)).toEqual({ok:true,data:true});expect(fixture.stored.settings.maxConcurrentFiles).toBe(6);
});
test.each([undefined,'8',0,99,1.5,null])('stored legacy concurrency %s is normalized safely on initialization',async previous=>{
 await boot(previous);const older:any={...defaults};delete older.maxConcurrentFiles;expect(await settings(older)).toEqual({ok:true,data:true});expect(fixture.stored.settings.maxConcurrentFiles).toBe(1);
});


test.each(['pause','cancel'])('a %s command catches the Chrome ID linked between its read and state commit',async type=>{
 await boot();fixture.task={id:'late-linked-task',state:'fetching',saved:false};fixture.beforeState=()=>{fixture.task.downloadId=42;};
 const result=await new Promise<any>(resolve=>fixture.listener({type,id:fixture.task.id},{id:'fixture',url:'chrome-extension://fixture/manager.html'},resolve));
 expect(result.ok).toBe(true);expect(type==='pause'?chrome.downloads.pause:chrome.downloads.cancel).toHaveBeenCalledExactlyOnceWith(42);expect(fixture.task.state).toBe(type==='pause'?'paused':'cancelled');
});

test.each(['cancelled','failed'])('delete retains a %s native task while its Chrome slot is still reserved',async state=>{
 await boot();fixture.task={id:'native-still-owned',state,downloadId:42,downloadSlot:{owner:'native',kind:'native',startedAt:Date.now(),expiresAt:Date.now()+30000}};
 const result=await new Promise<any>(resolve=>fixture.listener({type:'delete',id:fixture.task.id},{id:'fixture',url:'chrome-extension://fixture/manager.html'},resolve));expect(result).toEqual({ok:false,error:'busy'});expect(fixture.task.downloadId).toBe(42);
});
