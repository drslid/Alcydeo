import{beforeEach,afterEach,test,expect,vi}from'vitest';
import{defaults,type Task}from'../../packages/contracts';
const state=vi.hoisted(()=>({tasks:new Map<string,any>(),items:new Map<number,any>(),limit:1,reserve:vi.fn(),release:vi.fn()}));
vi.mock('../../packages/storage',()=>({
 allTasks:async()=>structuredClone([...state.tasks.values()]),getTask:async(id:string)=>structuredClone(state.tasks.get(id)),
 changeTask:async(id:string,change:(task:any)=>void)=>{const task=state.tasks.get(id);if(!task)throw new Error('missing');change(task);return structuredClone(task);},
 setState:async(id:string,next:string,fields:any={})=>{const task=state.tasks.get(id);Object.assign(task,fields,{state:next});return structuredClone(task);},
}));
vi.mock('../../apps/extension/src/download-admission',()=>({reserveDownload:state.reserve,releaseDownload:state.release}));
import{createNativeDownloads}from'../../apps/extension/src/native-downloads';
const epoch=1_800_000_000_000,extensionId='fixture-extension';
let listeners:{created:((item:any)=>unknown)[];changed:((delta:any)=>unknown)[]},api:any,wake:ReturnType<typeof vi.fn>;
function task(id:string,fields:any={}):Task{const url=`https://original-fixture.test/${id}.mp4`;return{id,title:`${id}.mp4`,media:{id,tabId:1,pageUrl:'https://original-fixture.test/player',url,title:id,kind:'direct',variants:[]},variant:{id:'source',url,label:'Original',contentType:'video/mp4'},state:'queued',createdAt:epoch-120_000,updatedAt:epoch-120_000,bytes:0,progress:0,checkpoints:{},...fields};}
function item(id:number,url:string,fields:any={}){return{id,url,state:'in_progress',paused:false,startTime:new Date(epoch).toISOString(),bytesReceived:10,totalBytes:100,mime:'video/mp4',filename:`/Synthetic/${id}.mp4`,exists:true,byExtensionId:extensionId,...fields};}
function service(){return createNativeDownloads(async()=>({...defaults,maxConcurrentFiles:state.limit}),async()=>{},wake)as any;}
beforeEach(()=>{
 state.tasks.clear();state.items.clear();state.limit=1;state.reserve.mockReset();state.release.mockReset();listeners={created:[],changed:[]};wake=vi.fn(async()=>{});vi.spyOn(Date,'now').mockReturnValue(epoch);
 state.reserve.mockImplementation(async(id:string,owner:string,kind:string)=>{const t=state.tasks.get(id);if(t.downloadSlot)return t.downloadSlot.owner===owner;if([...state.tasks.values()].filter(t=>t.downloadSlot).length>=state.limit)return false;t.downloadSlot={owner,kind,startedAt:epoch,expiresAt:epoch+30000};return true;});
 state.release.mockImplementation(async(id:string,owner:string)=>{const t=state.tasks.get(id);if(t?.downloadSlot?.owner===owner)delete t.downloadSlot;});
 let nextId=1;api={
  download:vi.fn(async(options:any)=>{const id=nextId++;state.items.set(id,item(id,options.url));return id;}),
  search:vi.fn(async(query:any)=>[...state.items.values()].filter(i=>(query.id===undefined||i.id===query.id)&&(query.state===undefined||i.state===query.state)&&(!query.startedAfter||Date.parse(i.startTime)>=Date.parse(query.startedAfter)))),
  resume:vi.fn(async(id:number)=>{Object.assign(state.items.get(id),{state:'in_progress',paused:false});}),
  pause:vi.fn(async(id:number)=>{state.items.get(id).paused=true;}),cancel:vi.fn(async(id:number)=>{Object.assign(state.items.get(id),{state:'interrupted',error:'USER_CANCELED'});}),removeFile:vi.fn(async()=>{}),
  onCreated:{addListener:(callback:any)=>listeners.created.push(callback)},onChanged:{addListener:(callback:any)=>listeners.changed.push(callback)},
 };
 vi.stubGlobal('chrome',{runtime:{id:extensionId},downloads:api});
 const tails=new Map<string,Promise<unknown>>();vi.stubGlobal('navigator',{locks:{request:(name:string,options:any,callback?:any)=>{const run=callback??options;if(callback&&options.ifAvailable&&tails.has(name))return Promise.resolve(run(null));const prior=tails.get(name)??Promise.resolve(),current=prior.catch(()=>{}).then(()=>run({name}));tails.set(name,current);void current.finally(()=>{if(tails.get(name)===current)tails.delete(name);}).catch(()=>{});return current;}}});
});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});

test('native starts reserve the shared budget and an older queued file precedes a new request',async()=>{
 const older=task('older',{createdAt:epoch-130_000}),newer=task('newer');state.tasks.set(older.id,older);state.tasks.set(newer.id,newer);const native=service();
 await native.start(newer);await vi.waitFor(()=>expect(api.download).toHaveBeenCalledTimes(1));expect(api.download.mock.calls[0][0].url).toBe(older.variant.url);expect(state.tasks.get(newer.id).state).toBe('queued');expect(state.reserve).toHaveBeenCalled();
 state.items.get(1).state='complete';for(const changed of listeners.changed)changed({id:1,state:{current:'complete'}});
 await vi.waitFor(()=>expect(api.download).toHaveBeenCalledTimes(2));expect(state.tasks.get(older.id).saved).toBe(true);expect(api.download.mock.calls[1][0].url).toBe(newer.variant.url);
});

test('native recovery uses admission time after a long queue and never starts a duplicate',async()=>{
 const t=task('delayed',{state:'fetching',nativeStart:{startedAt:epoch},downloadSlot:{owner:'previous-worker',kind:'native',startedAt:epoch,expiresAt:epoch-1}});state.tasks.set(t.id,t);state.items.set(41,item(41,t.variant.url));const native=service();
 await native.refresh();expect(state.tasks.get(t.id).downloadId).toBe(41);expect(api.download).not.toHaveBeenCalled();expect(state.tasks.get(t.id).downloadSlot).toBeTruthy();
});

test.each(['paused','cancelled'])('a %s action while Chrome is creating the item is respected after its late reply',async nextState=>{
 const t=task('late');state.tasks.set(t.id,t);let accepted!:(id:number)=>void;api.download.mockImplementation(()=>new Promise(resolve=>{accepted=resolve;}));const native=service();
 void native.start(t);await vi.waitFor(()=>expect(api.download).toHaveBeenCalledTimes(1));state.tasks.get(t.id).state=nextState;state.items.set(12,item(12,t.variant.url));accepted(12);
 await vi.waitFor(()=>expect(nextState==='paused'?api.pause:api.cancel).toHaveBeenCalledWith(12));expect(state.tasks.get(t.id).state).toBe(nextState);await vi.waitFor(()=>expect(state.tasks.get(t.id).downloadSlot).toBeUndefined());
});

test('an existing native item waits for admission before Chrome resume',async()=>{
 const active=task('active',{state:'fetching',downloadId:4,downloadSlot:{owner:'running-worker',kind:'native',startedAt:epoch-100,expiresAt:epoch-1}}),paused=task('paused',{state:'paused',downloadId:5});state.tasks.set(active.id,active);state.tasks.set(paused.id,paused);state.items.set(4,item(4,active.variant.url));state.items.set(5,item(5,paused.variant.url,{paused:true}));const native=service();
 await native.resume(paused);expect(api.resume).not.toHaveBeenCalled();expect(state.tasks.get(paused.id).state).toBe('queued');
 state.items.get(4).state='complete';for(const changed of listeners.changed)changed({id:4,state:{current:'complete'}});
 await vi.waitFor(()=>expect(api.resume).toHaveBeenCalledExactlyOnceWith(5));expect(api.download).not.toHaveBeenCalled();
});

test('ambiguous native source intentions are not guessed or automatically restarted',async()=>{
 const url='https://original-fixture.test/same.mp4';for(const id of ['one','two'])state.tasks.set(id,task(id,{variant:{id:'source',url,label:'Original',contentType:'video/mp4'},state:'fetching',nativeStart:{startedAt:epoch},downloadSlot:{owner:'previous-worker',kind:'native',startedAt:epoch,expiresAt:epoch-1}}));state.items.set(8,item(8,url));const native=service();
 await native.refresh();expect([...state.tasks.values()].every(t=>t.downloadId===undefined)).toBe(true);await native.drain();expect(api.download).not.toHaveBeenCalled();expect([...state.tasks.values()].every(t=>t.downloadSlot)).toBe(true);
});

test('a native item resumed in Chrome is restored to fetching and stays counted',async()=>{
 const t=task('external',{state:'paused',downloadId:2,downloadSlot:{owner:'previous-worker',kind:'native',startedAt:epoch-100,expiresAt:epoch-1}});state.tasks.set(t.id,t);state.items.set(2,item(2,t.variant.url));const native=service();await native.refresh();expect(state.tasks.get(t.id).state).toBe('fetching');expect(state.tasks.get(t.id).downloadSlot).toBeTruthy();
});

test('managed Blob export completion frees its existing slot without reserving another download',async()=>{
 const t=task('output',{state:'validating',media:{...task('output').media,kind:'hls'},output:'output.mp4',validation:{bytes:100,tracks:[{type:'video',codec:'avc'}],duration:20,method:'local-structure',checkedAt:epoch},downloadId:3,downloadSlot:{owner:'manager',kind:'managed',startedAt:epoch-100,expiresAt:epoch-1}});state.tasks.set(t.id,t);state.items.set(3,item(3,'blob:chrome-extension://fixture/original-output',{state:'complete',bytesReceived:100}));const native=service();await native.refresh();expect(state.tasks.get(t.id).saved).toBe(true);expect(state.tasks.get(t.id).downloadSlot).toBeUndefined();expect(state.reserve).not.toHaveBeenCalled();expect(api.download).not.toHaveBeenCalled();
});

test('an interrupted native item remains queued until its admitted resume succeeds',async()=>{
 const t=task('interrupted',{state:'failed',downloadId:6});state.tasks.set(t.id,t);state.items.set(6,item(6,t.variant.url,{state:'interrupted',error:'NETWORK_FAILED'}));const native=service();await native.resume(t);await vi.waitFor(()=>expect(api.resume).toHaveBeenCalledExactlyOnceWith(6));expect(api.download).not.toHaveBeenCalled();await vi.waitFor(()=>expect(state.tasks.get(t.id).state).toBe('fetching'));
});

test('a paused managed disk export resumes without reserving a second source slot',async()=>{
 const t=task('saved-output',{state:'paused',media:{...task('saved-output').media,kind:'hls'},output:'output.mp4',validation:{bytes:100,tracks:[{type:'video',codec:'avc'}],duration:20,method:'local-structure',checkedAt:epoch},downloadId:3});state.tasks.set(t.id,t);state.items.set(3,item(3,'blob:chrome-extension://fixture/local-output',{paused:true}));const native=service();await native.resume(t);expect(api.resume).toHaveBeenCalledExactlyOnceWith(3);expect(state.reserve).not.toHaveBeenCalled();expect(state.tasks.get(t.id).state).toBe('validating');
});

test('an unresolved native intent survives a worker restart and is released only after a genuine browser restart',async()=>{
 const t=task('uncertain',{state:'fetching',nativeStart:{startedAt:epoch},downloadSlot:{owner:'previous-worker',kind:'native',startedAt:epoch,expiresAt:epoch-1}});state.tasks.set(t.id,t);const native=service();await native.drain();expect(api.download).not.toHaveBeenCalled();expect(state.tasks.get(t.id)).toMatchObject({state:'paused',error:'saveInterrupted'});expect(state.tasks.get(t.id).downloadSlot).toBeTruthy();await native.browserRestart();expect(state.tasks.get(t.id).downloadSlot).toBeUndefined();expect(state.tasks.get(t.id).nativeStart).toBeUndefined();expect(api.download).not.toHaveBeenCalled();
});

test('a browser restart does not discard ambiguous matching Chrome items',async()=>{
 const url='https://original-fixture.test/shared.mp4';for(const id of ['one','two'])state.tasks.set(id,task(id,{variant:{id:'source',url,label:'Original',contentType:'video/mp4'},state:'fetching',nativeStart:{startedAt:epoch},downloadSlot:{owner:'previous-worker',kind:'native',startedAt:epoch,expiresAt:epoch-1}}));state.items.set(9,item(9,url));const native=service();await native.browserRestart();expect([...state.tasks.values()].every(t=>t.downloadSlot&&t.nativeStart)).toBe(true);expect(api.download).not.toHaveBeenCalled();
});

test('a legacy native start with no new intent is recovered only inside its original narrow timestamp window',async()=>{
 const recent=task('legacy',{state:'fetching',createdAt:epoch-10_000}),old=task('legacy-old',{state:'fetching',createdAt:epoch-120_000});state.tasks.set(recent.id,recent);state.tasks.set(old.id,old);state.items.set(71,item(71,recent.variant.url));state.items.set(72,item(72,old.variant.url));const native=service();await native.refresh();expect(state.tasks.get(recent.id).downloadId).toBe(71);expect(state.tasks.get(old.id).downloadId).toBeUndefined();expect(api.download).not.toHaveBeenCalled();
});

test('a worker lost after reservation but before the persisted native API intent can safely admit that queued file again',async()=>{
 const t=task('not-invoked',{downloadSlot:{owner:'previous-worker',kind:'native',startedAt:epoch,expiresAt:epoch-1}});state.tasks.set(t.id,t);const native=service();await native.drain();await vi.waitFor(()=>expect(api.download).toHaveBeenCalledTimes(1));expect(state.tasks.get(t.id).error).toBeUndefined();
});

test('a settings read failure before the native API releases its reservation without a hot retry loop',async()=>{
 const t=task('settings-failure');state.tasks.set(t.id,t);const settings=vi.fn(async()=>{throw new Error('Synthetic settings read failure');}),native=createNativeDownloads(settings,async()=>{},wake);await native.start(t);await vi.waitFor(()=>expect(state.tasks.get(t.id).state).toBe('failed'));await vi.waitFor(()=>expect(state.tasks.get(t.id).downloadSlot).toBeUndefined());expect(settings).toHaveBeenCalledTimes(1);expect(api.download).not.toHaveBeenCalled();
});

test.each(['cancelled','failed'])('a genuine browser restart releases a never-created %s invocation without making it resumable',async terminal=>{
 const t=task('terminal',{state:terminal,error:terminal==='failed'?'network':undefined,nativeStart:{startedAt:epoch},downloadSlot:{owner:'previous-worker',kind:'native',startedAt:epoch,expiresAt:epoch-1}});state.tasks.set(t.id,t);const native=service();await native.browserRestart();expect(state.tasks.get(t.id).state).toBe(terminal);expect(state.tasks.get(t.id).error).toBe(terminal==='failed'?'network':undefined);expect(state.tasks.get(t.id).nativeStart).toBeUndefined();expect(state.tasks.get(t.id).downloadSlot).toBeUndefined();expect(api.download).not.toHaveBeenCalled();
});

test('a native fallback with an expired managed claim reaches shared admission after its manager disappears',async()=>{
 const t=task('fallback',{transfer:{mode:'native',connections:4},notices:['multipartUnavailable'],downloadSlot:{owner:'closed-manager',kind:'managed',startedAt:epoch-60000,expiresAt:epoch-1}});state.tasks.set(t.id,t);
 state.reserve.mockImplementationOnce(async(id:string,owner:string,kind:string)=>{expect(id).toBe(t.id);expect(kind).toBe('native');expect(state.tasks.get(id).downloadSlot.kind).toBe('managed');state.tasks.get(id).downloadSlot={owner,kind,startedAt:epoch,expiresAt:epoch+30000};return true;});
 const native=service();await native.drain();await vi.waitFor(()=>expect(api.download).toHaveBeenCalledTimes(1));expect(state.reserve).toHaveBeenCalled();expect(api.download.mock.calls[0][0].url).toBe(t.variant.url);
});

test('a Store startup queue refuses an old local-build YouTube source before any native body starts',async()=>{
 const t=task('store-youtube',{variant:{id:'source',url:'https://cdn.googlevideo.com/file.mp4',label:'Original',contentType:'video/mp4'}});state.tasks.set(t.id,t);const native=service();await native.drain();await vi.waitFor(()=>expect(state.tasks.get(t.id).state).toBe('failed'));expect(state.tasks.get(t.id).error).toBe('excluded');expect(api.download).not.toHaveBeenCalled();expect(api.resume).not.toHaveBeenCalled();await vi.waitFor(()=>expect(state.tasks.get(t.id).downloadSlot).toBeUndefined());expect(state.tasks.get(t.id).nativeStart).toBeUndefined();
});

test('a non-network metadata task cannot block the native FIFO queue',async()=>{
 const metadata=task('metadata',{variant:{id:'source',url:'',label:'Metadata'}}),video=task('real-video');state.tasks.set(metadata.id,metadata);state.tasks.set(video.id,video);const native=service();await native.drain();await vi.waitFor(()=>expect(api.download).toHaveBeenCalledTimes(1));expect(api.download.mock.calls[0][0].url).toBe(video.variant.url);expect(state.reserve.mock.calls.every(call=>call[0]!=='metadata')).toBe(true);
});
