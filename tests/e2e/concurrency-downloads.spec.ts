import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{createServer,type Server}from'node:http';
import{resolve}from'node:path';
import{tmpdir}from'node:os';
import{mkdtemp,readFile,rm}from'node:fs/promises';
import type{Task}from'../../packages/contracts';
import{seedHistory}from'./history-fixture';

const direct=await readFile('fixtures/media/low.mp4'),multipartBytes=await readFile('fixtures/media/high.mp4'),ts=Buffer.concat(await Promise.all([0,1,2].map(index=>readFile(`fixtures/hls-low/segment-${index}.ts`)))),conversionInput=await readFile('fixtures/conversion/transcode.webm');
interface Gate{promise:Promise<void>;release:()=>void}
interface Started{name:string;activeBefore:number;range?:string;ifRange?:string}
let context:BrowserContext,ui:Page,base:string,folder:string,origins:string[],servers:Server[],gates:Map<string,Gate>,active:Set<string>,requests:Map<string,number>,rangePeaks:Map<string,number>,starts:Started[],aborted:string[],peak:number,unexpected:string[];
let sourceTime:number,order:number;
function gate(name:string){let value=gates.get(name);if(!value){let release!:()=>void;const promise=new Promise<void>(resolve=>{release=resolve;});value={promise,release};gates.set(name,value);}return value;}
function release(name:string){gate(name).release();}
async function serve(){
 const server=createServer((request,response)=>{void(async()=>{
  const url=new URL(request.url!,'http://fixture.test'),manifest=/^\/hls\/([^/]+)\/index\.m3u8$/.exec(url.pathname);
  if(manifest){response.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl','Access-Control-Allow-Origin':'*','Cache-Control':'no-store'});response.end('#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:6\n#EXTINF:6.000000,\nsegment.ts\n#EXT-X-ENDLIST\n');return;}
  const match=/^\/(?:native\/([^/]+)\.mp4|hls\/([^/]+)\/segment\.ts)$/.exec(url.pathname);if(!match){response.writeHead(404);response.end();return;}
  const name=match[1]??match[2]!,bytes=match[1]?(url.searchParams.has('multipart')?multipartBytes:direct):ts,type=match[1]?'video/mp4':'video/mp2t',range=/^bytes=(\d+)-(\d*)$/.exec(request.headers.range??''),start=Number(range?.[1]??0),end=Math.min(Number(range?.[2]||bytes.length-1),bytes.length-1);
  const headers:Record<string,string>={'Content-Type':type,'Content-Length':String(end-start+1),'Access-Control-Allow-Origin':'*','Access-Control-Expose-Headers':'Content-Range,ETag,Content-Length','Cache-Control':'no-store','Accept-Ranges':'bytes',ETag:'"fixture-source-version"'};if(range)headers['Content-Range']=`bytes ${start}-${end}/${bytes.length}`;
  if(request.method==='HEAD'||request.headers.range==='bytes=0-0'){response.writeHead(range?206:200,headers);response.end(request.method==='HEAD'?undefined:bytes.subarray(start,end+1));return;}
  starts.push({name,activeBefore:active.size,range:request.headers.range,ifRange:request.headers['if-range']});active.add(name);requests.set(name,(requests.get(name)??0)+1);rangePeaks.set(name,Math.max(rangePeaks.get(name)??0,requests.get(name)!));peak=Math.max(peak,active.size);
  response.once('close',()=>{requests.set(name,requests.get(name)!-1);if(!requests.get(name))active.delete(name);if(!response.writableFinished)aborted.push(name);});
  response.writeHead(range?206:200,headers);response.flushHeaders();await gate(name).promise;if(!response.destroyed)response.end(bytes.subarray(start,end+1));
 })().catch(error=>response.destroy(error));});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));servers.push(server);return`http://127.0.0.1:${(server.address()as{port:number}).port}`;
}
test.beforeEach(async()=>{
 gates=new Map();active=new Set();requests=new Map();rangePeaks=new Map();starts=[];aborted=[];servers=[];peak=0;unexpected=[];sourceTime=Date.now();order=0;origins=[await serve(),await serve()];folder=await mkdtemp(resolve(tmpdir(),'alcydeo-concurrency60-'));
 const extension=resolve(process.env.ALCYDEO_EXTENSION_PATH??process.env.ALCYDEO_TEST_EXTENSION??'apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});await context.grantPermissions(['local-network-access']);await context.route('https://**/*',route=>{unexpected.push(route.request().url());return route.abort();});
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(worker.url()).host}`;const driver=await context.browser()!.newBrowserCDPSession();await driver.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:folder,eventsEnabled:true});
 ui=await context.newPage();await ui.goto(base+'/manager.html#library');await settings(8);
});
test.afterEach(async()=>{for(const value of gates.values())value.release();await context?.close();for(const server of servers){server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}await rm(folder,{recursive:true,force:true});expect(unexpected).toEqual([]);});
async function settings(limit:number){return ui.evaluate(async limit=>{const snapshot=await chrome.runtime.sendMessage({type:'snapshot'}),result=await chrome.runtime.sendMessage({type:'settings',value:{...snapshot.data.settings,maxConcurrentFiles:limit,saveAs:false,multipart:false}});if(!result.ok)throw new Error(result.error);},limit);}
function source(name:string,kind:'native'|'hls'='native'):Task{
 const url=kind==='native'?`${origins[0]}/native/${name}.mp4`:`${origins[1]}/hls/${name}/index.m3u8`,createdAt=sourceTime+order++;
 return{id:crypto.randomUUID(),title:name,state:'queued',createdAt,updatedAt:createdAt,bytes:0,progress:0,checkpoints:{},destination:{folder:'Alcydeo/concurrency',saveAs:false},media:{id:name,tabId:-1,pageUrl:`${origins[kind==='native'?0:1]}/watch/${name}`,url,kind:kind==='native'?'direct':'hls',title:name,duration:6,variants:[]},variant:{id:'original',url,label:'Original',contentType:kind==='native'?'video/mp4':'application/vnd.apple.mpegurl',check:{state:'ready',checkedAt:Date.now()}}};
}
async function seed(tasks:Task[]){await seedHistory(ui,tasks);await snapshot();}
async function snapshot(){return ui.evaluate(async()=>{const result=await chrome.runtime.sendMessage({type:'snapshot'});if(!result.ok)throw new Error(result.error);return result.data.tasks as Task[];});}
async function completed(count:number){await expect.poll(async()=>(await snapshot()).filter(task=>task.saved&&task.state==='completed').length,{timeout:45000}).toBe(count);}
async function otherManager(){const page=await context.newPage();await page.goto(base+'/manager.html#library');return page;}
function mixed(){return[...Array.from({length:4},(_,index)=>source(`native-${index}`)),...Array.from({length:4},(_,index)=>source(`hls-${index}`,'hls'))];}
async function savedCopies(tasks:Task[]){
 const records=await ui.evaluate(()=>chrome.downloads.search({}));expect(records.filter(item=>item.state==='complete')).toHaveLength(tasks.filter(task=>task.saved).length);
 for(const task of tasks.filter(task=>task.saved)){const item=records.find(item=>item.id===task.downloadId)!;expect(item).toMatchObject({state:'complete',exists:true});if(task.media.kind==='direct')expect(await readFile(item.filename)).toEqual(task.transfer?.mode==='multipart'?multipartBytes:direct);else{expect(task.validation?.tracks.some(track=>track.type==='video')).toBe(true);const size=await ui.evaluate(async id=>{const file=await(await(await navigator.storage.getDirectory()).getDirectoryHandle(id)).getFileHandle('output.mp4').then(handle=>handle.getFile());return file.size;},task.id);expect(size).toBe(task.validation?.bytes);}}
}

test('eight mixed source files share one real cap across managers and worker restart, and cancellation frees only its own place',async()=>{
 test.setTimeout(90000);const tasks=mixed();await seed(tasks);const other=await otherManager();await expect.poll(()=>active.size,{timeout:20000}).toBe(8);expect(peak).toBe(8);expect(new Set(starts.map(item=>item.name)).size).toBe(8);
 await expect.poll(async()=>(await snapshot()).filter(task=>task.media.kind==='direct'&&task.downloadId!==undefined).length).toBe(4);const nativeIds=(await snapshot()).filter(task=>task.media.kind==='direct').map(task=>task.downloadId);
 const driver=await context.browser()!.newBrowserCDPSession(),targets=await driver.send('Target.getTargets'),worker=targets.targetInfos.find(target=>target.type==='service_worker'&&target.url.startsWith(base))!;await driver.send('Target.closeTarget',{targetId:worker.targetId});await driver.detach();await snapshot();expect(active.size).toBe(8);expect(aborted).toEqual([]);expect((await snapshot()).filter(task=>task.media.kind==='direct').map(task=>task.downloadId).sort()).toEqual(nativeIds.sort());
 const ninth=source('native-nine');await seed([ninth]);await expect(other.locator(`[data-task-id="${ninth.id}"]`)).toHaveAttribute('data-state','queued');expect(starts.some(item=>item.name===ninth.title)).toBe(false);
 const cancelled=tasks.find(task=>task.media.kind==='hls')!;await other.locator(`[data-task-id="${cancelled.id}"]`).getByRole('button',{name:'Cancel',exact:true}).click();await expect.poll(()=>starts.some(item=>item.name===ninth.title)).toBe(true);await expect.poll(()=>aborted).toEqual([cancelled.title]);expect(peak).toBe(8);expect(active.size).toBe(8);
 for(const task of[...tasks,ninth])release(task.title);await completed(8);const saved=await snapshot(),stopped=saved.find(task=>task.id===cancelled.id);expect(stopped?.state).toBe('cancelled');expect(stopped?.saved).not.toBe(true);expect(starts).toHaveLength(9);expect(new Set(starts.map(item=>item.name)).size).toBe(9);expect(aborted).toEqual([cancelled.title]);await savedCopies(saved);
});

test('lowering eight files to one lets active bodies finish and admits each queued successor only after its predecessor',async()=>{
 test.setTimeout(90000);const tasks=mixed();await seed(tasks);await expect.poll(()=>active.size,{timeout:20000}).toBe(8);await settings(1);const ninth=source('native-nine'),tenth=source('native-ten');await seed([ninth,tenth]);await expect(ui.locator(`[data-task-id="${tenth.id}"]`)).toHaveAttribute('data-state','queued');expect(starts).toHaveLength(8);
 const last=tasks.find(task=>task.title==='native-3')!;for(const task of tasks)if(task.id!==last.id)release(task.title);await completed(7);await expect.poll(()=>active.size).toBe(1);expect(starts).toHaveLength(8);expect((await snapshot()).find(task=>task.id===ninth.id)?.state).toBe('queued');
 release(last.title);await expect.poll(()=>starts.some(item=>item.name===ninth.title)).toBe(true);expect(starts.find(item=>item.name===ninth.title)?.activeBefore).toBe(0);expect(starts.some(item=>item.name===tenth.title)).toBe(false);
 release(ninth.title);await expect.poll(()=>starts.some(item=>item.name===tenth.title)).toBe(true);expect(starts.find(item=>item.name===tenth.title)?.activeBefore).toBe(0);release(tenth.title);await completed(10);expect(peak).toBe(8);await savedCopies(await snapshot());
});

test('an expired admission behind a delayed permissions callback cannot start an extra source body',async()=>{
 test.setTimeout(60000);await settings(1);await ui.evaluate(()=>{
  const state=window as any,getAll=chrome.permissions.getAll.bind(chrome.permissions),OriginalWorker=window.Worker;state.__managedStarts=0;window.Worker=class extends OriginalWorker{constructor(...args:ConstructorParameters<typeof Worker>){super(...args);state.__managedStarts++;}};
  let first=true;chrome.permissions.getAll=((...args:any[])=>{const result=(getAll as any)(...args);if(!first)return result;first=false;state.__permissionsHeld=true;return new Promise(resolve=>{state.__releasePermissions=()=>resolve(result);});})as typeof chrome.permissions.getAll;
 });
 const stale=source('stale-hls','hls');await seed([stale]);await expect.poll(()=>ui.evaluate(()=>(window as any).__permissionsHeld)).toBe(true);const owner=(await snapshot()).find(task=>task.id===stale.id)!.downloadSlot!.owner;
 await ui.evaluate(async id=>{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('alcydeo',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('tasks','readwrite'),store=tx.objectStore('tasks'),request=store.get(id);request.onsuccess=()=>{const task=request.result;task.downloadSlot.expiresAt=Date.now()-1000;store.put(task);};tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);});}finally{db.close();}},stale.id);
 const current=source('current-native');await seed([current]);await otherManager();await expect.poll(()=>active.has(current.title)).toBe(true);expect(active.size).toBe(1);await ui.evaluate(()=>(window as any).__releasePermissions());await expect.poll(()=>ui.evaluate(()=>(window as any).__managedStarts)).toBeGreaterThan(0);await expect.poll(async()=>(await snapshot()).find(task=>task.id===stale.id)?.owner===owner).toBe(false);expect(starts.some(item=>item.name===stale.title)).toBe(false);expect(peak).toBe(1);
 release(current.title);await expect.poll(()=>starts.some(item=>item.name===stale.title)).toBe(true);expect(starts.find(item=>item.name===stale.title)?.activeBefore).toBe(0);release(stale.title);await completed(2);expect(peak).toBe(1);
});

test('two local conversions remain serialized while source-download places are full',async()=>{
 test.setTimeout(90000);await settings(2);const sources=[source('native-a'),source('native-b')];await seed(sources);await expect.poll(()=>active.size).toBe(2);await otherManager();await ui.bringToFront();
 const conversions=[0,1].map(index=>{const task=source(`conversion-${index}`);task.media.url='';task.variant.url='';task.filename=`Conversion ${index}-converted.mp4`;task.conversion={input:'input.webm',inputBytes:conversionInput.length,ready:true};return task;});
 await ui.evaluate(async({tasks,bytes})=>{const root=await navigator.storage.getDirectory();for(const task of tasks){const dir=await root.getDirectoryHandle(task.id,{create:true}),writer=await(await dir.getFileHandle('input.webm',{create:true})).createWritable();await writer.write(new Uint8Array(bytes));await writer.close();}const state=window as any;state.__conversionCounts=[];state.__sampleConversions=true;const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('alcydeo',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});const sample=()=>{if(!state.__sampleConversions){db.close();return;}const request=db.transaction('tasks').objectStore('tasks').getAll();request.onsuccess=()=>{state.__conversionCounts.push(request.result.filter((task:Task)=>task.conversion&&task.state==='converting').length);requestAnimationFrame(sample);};};sample();},{tasks:conversions,bytes:[...conversionInput]});
 await seed(conversions);await expect.poll(async()=>(await snapshot()).filter(task=>task.conversion&&task.saved).length,{timeout:45000}).toBe(2);const counts=await ui.evaluate(()=>{const state=window as any;state.__sampleConversions=false;return state.__conversionCounts as number[];});expect(Math.max(...counts)).toBe(1);expect(active.size).toBe(2);expect((await snapshot()).filter(task=>!task.conversion&&task.saved)).toHaveLength(0);
 for(const task of sources)release(task.title);await completed(4);const saved=await snapshot();for(const task of saved.filter(task=>task.conversion)){expect(task.downloadSlot).toBeUndefined();expect(task.validation?.tracks.some(track=>track.type==='video'&&track.codec==='avc')).toBe(true);}expect(peak).toBe(2);
});

test('the two-file limit and four connections per file remain independent during real multipart transfers',async()=>{
 test.setTimeout(90000);await settings(2);await ui.evaluate(async()=>{const current=await chrome.runtime.sendMessage({type:'snapshot'});await chrome.runtime.sendMessage({type:'settings',value:{...current.data.settings,multipart:true,connections:4}});});
 const tasks=['parts-a','parts-b','parts-c'].map((name,index)=>{const task=source(name),url=`${origins[index===1?1:0]}/native/${name}.mp4?multipart=1`;task.variant.url=url;task.media.url=url;task.variant.size=multipartBytes.length;task.transfer={mode:'multipart',connections:4};return task;});await seed(tasks);await otherManager();
 await expect.poll(()=>[requests.get('parts-a')??0,requests.get('parts-b')??0],{timeout:20000}).toEqual([4,4]);expect(active.size).toBe(2);expect(peak).toBe(2);expect(starts.some(item=>item.name==='parts-c')).toBe(false);expect([...requests.values()].reduce((sum,count)=>sum+count,0)).toBe(8);
 await ui.evaluate(async()=>{const current=await chrome.runtime.sendMessage({type:'snapshot'});await chrome.runtime.sendMessage({type:'settings',value:{...current.data.settings,connections:2}});});release('parts-a');await expect.poll(()=>requests.get('parts-c')??0,{timeout:30000}).toBe(4);expect(requests.get('parts-b')).toBe(4);expect(active.size).toBe(2);expect((await snapshot()).every(task=>task.transfer?.connections===4)).toBe(true);
 release('parts-b');release('parts-c');await completed(3);expect(peak).toBe(2);for(const name of['parts-a','parts-b','parts-c']){expect(rangePeaks.get(name)).toBe(4);const parts=starts.filter(item=>item.name===name);expect(parts).toHaveLength(4);expect(parts.every(item=>item.ifRange==='"fixture-source-version"')).toBe(true);}await savedCopies(await snapshot());
});
