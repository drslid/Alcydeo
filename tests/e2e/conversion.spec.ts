import {test,expect,chromium,type BrowserContext,type Page} from '@playwright/test';
import {resolve} from 'node:path';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Input,BlobSource,ALL_FORMATS,EncodedPacketSink} from 'mediabunny';

let context:BrowserContext,ui:Page,base:string;
test.beforeEach(async()=>{
  const ext=resolve('apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--load-extension=${ext}`,`--disable-extensions-except=${ext}`,'--no-sandbox','--test-type']});
  const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;ui=await context.newPage();await ui.goto(`${base}/manager.html#settings`);await expect(ui.getByLabel('Choose a video to convert',{exact:true})).toBeVisible();await mkdir('artifacts/evidence/conversion',{recursive:true});
  const downloadPath=resolve(`artifacts/evidence/conversion/downloads/${crypto.randomUUID()}`);await mkdir(downloadPath,{recursive:true});const cdp=await context.browser()!.newBrowserCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath,eventsEnabled:true});
});
test.afterEach(async()=>context?.close());
const snapshot=(page=ui)=>page.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks);
async function choose(path:string){
  const known=(await snapshot()).map((t:any)=>t.id);await ui.bringToFront();await ui.locator('.manager-tabs').getByRole('button',{name:'Settings',exact:true}).click();await ui.getByLabel('Choose a video to convert',{exact:true}).setInputFiles(path);
  let id:string;await expect.poll(async()=>id=(await snapshot()).find((t:any)=>!known.includes(t.id)&&t.conversion)?.id).toBeTruthy();return id!;
}
async function completed(id:string,name:string){
  const card=ui.locator(`[data-task-id="${id}"]`);await expect(card).toHaveAttribute('data-state','completed',{timeout:45000});
  const task=(await snapshot()).find((t:any)=>t.id===id);expect(task.validation.tracks).toEqual([{type:'video',codec:'avc'},{type:'audio',codec:'aac'}]);
  const item=await ui.evaluate(async id=>(await chrome.downloads.search({id}))[0],task.downloadId);expect(item.state).toBe('complete');expect(item.filename).toMatch(/\.mp4$/);const bytes=await readFile(item.filename);expect(bytes.toString('ascii',4,8)).toBe('ftyp');await writeFile(`artifacts/evidence/conversion/${name}.mp4`,bytes);return{task,bytes,item};
}
async function packetHashes(bytes:Uint8Array){
  const input=new Input({source:new BlobSource(new Blob([bytes])),formats:ALL_FORMATS});
  try{return await Promise.all((await input.getTracks()).map(async track=>{const hash=createHash('sha256');let packets=0;for await(const packet of new EncodedPacketSink(track).packets()){hash.update(packet.data);packets++;}return{type:track.type,codec:await track.getCodec(),packets,sha256:hash.digest('hex')};}));}finally{input.dispose();}
}

test('MKV and MOV become real MP4 files with identical H.264/AAC packets',async()=>{
  for(const ext of ['mkv','mov']){
    const original=await readFile(`fixtures/conversion/copy.${ext}`),before=createHash('sha256').update(original).digest('hex');const id=await choose(`fixtures/conversion/copy.${ext}`);const result=await completed(id,`copy-${ext}`);
    expect(result.task.conversion.videoEncoded).toBe(false);expect(result.task.conversion.audioEncoded).toBe(false);expect(await packetHashes(result.bytes)).toEqual(await packetHashes(original));expect(createHash('sha256').update(await readFile(`fixtures/conversion/copy.${ext}`)).digest('hex')).toBe(before);
  }
  await ui.setViewportSize({width:1280,height:800});await ui.screenshot({path:'artifacts/evidence/conversion/completed.png',animations:'disabled',fullPage:true});
});

test('VP8/Opus is actually re-encoded to AVC/AAC offline without losing either track',async()=>{
  const network:string[]=[];context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});const started=Date.now();const id=await choose('fixtures/conversion/transcode.webm');const result=await completed(id,'webm');
  expect(result.task.conversion.videoEncoded).toBe(true);expect(result.task.conversion.audioEncoded).toBe(true);expect(result.task.validation.duration).toBeGreaterThan(5.9);expect(result.task.validation.duration).toBeLessThan(6.2);expect(network).toEqual([]);
  const input=new Input({source:new BlobSource(new Blob([await readFile('fixtures/conversion/transcode.webm')])),formats:ALL_FORMATS}),output=new Input({source:new BlobSource(new Blob([result.bytes])),formats:ALL_FORMATS});
  try{expect(await(await output.getPrimaryAudioTrack())!.getNumberOfChannels()).toBe(await(await input.getPrimaryAudioTrack())!.getNumberOfChannels());}finally{input.dispose();output.dispose();}
  await writeFile('docs/benchmarks/conversion-0.1.16.json',JSON.stringify({version:'0.1.16',browser:context.browser()!.version(),platform:process.platform,source:'Original synthetic VP8/Opus WebM',elapsedMs:Date.now()-started,validation:result.task.validation,videoEncoded:true,audioEncoded:true,httpRequests:network.length,limitation:'One short local fixture; not a universal codec, size or speed claim'},null,2)+'\n');
});

test('a downloaded nonstandard original offers conversion and remains intact afterwards',async()=>{
  const source=await context.newPage();await source.goto('http://127.0.0.1:4179/conversion.html');const tabId=await ui.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());await ui.goto(`${base}/popup.html?tabId=${tabId}`);
  await ui.locator('.media-card').filter({has:ui.getByRole('heading',{name:'Original WebM video',exact:true})}).getByRole('button',{name:'Download',exact:true}).click();await ui.goto(`${base}/manager.html`);
  await expect.poll(async()=>(await snapshot()).find((t:any)=>!t.conversion)?.saved).toBe(true);const original=(await snapshot()).find((t:any)=>!t.conversion);const item=await ui.evaluate(async id=>(await chrome.downloads.search({id}))[0],original.downloadId);const bytes=await readFile(item.filename);
  await ui.locator(`[data-task-id="${original.id}"]`).getByRole('button',{name:'Convert to MP4',exact:true}).click();const batch=ui.getByRole('dialog',{name:'Selected files'});await batch.getByLabel('Choose videos · '+original.title,{exact:true}).setInputFiles({name:'original.webm',mimeType:'video/webm',buffer:bytes});await batch.getByRole('button',{name:'Convert to MP4',exact:true}).click();let id:string;await expect.poll(async()=>id=(await snapshot()).find((t:any)=>t.conversion)?.id).toBeTruthy();const result=await completed(id!,'downloaded-webm');expect(result.task.conversion.sourceTaskId).toBe(original.id);expect(await readFile(item.filename)).toEqual(bytes);expect((await ui.evaluate(async id=>(await chrome.downloads.search({id}))[0],original.downloadId)).exists).toBe(true);
});

test('two managers process a persisted conversion queue one file at a time',async()=>{
  const control=await context.newPage();await control.goto(`${base}/manager.html#library`);
  await control.evaluate(()=>{(window as any).held=false;(window as any).lockPromise=navigator.locks.request('alcydeo:mp4-conversion',()=>new Promise<void>(resolve=>{(window as any).held=true;(window as any).releaseConversionLock=resolve;}));});await expect.poll(()=>control.evaluate(()=>(window as any).held)).toBe(true);
  const first=await choose('fixtures/conversion/transcode.webm'),second=await choose('fixtures/conversion/copy.mkv');await expect.poll(async()=>(await snapshot()).filter((t:any)=>t.conversion?.ready).length).toBe(2);
  await control.evaluate(()=>{
    (window as any).samples=[];(window as any).seen=[];(window as any).sampling=setInterval(()=>{const r=indexedDB.open('alcydeo',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('tasks').objectStore('tasks').getAll();q.onsuccess=()=>{const active=q.result.filter(t=>t.state==='converting');(window as any).samples.push(active.length);for(const t of active)if(!(window as any).seen.includes(t.id))(window as any).seen.push(t.id);db.close();};};},20);(window as any).releaseConversionLock();
  });
  await ui.locator('.manager-tabs').getByRole('button',{name:'Library',exact:true}).click();await completed(first,'queued-first');await completed(second,'queued-second');
  const samples=await control.evaluate(()=>{clearInterval((window as any).sampling);return{counts:(window as any).samples,seen:(window as any).seen};});expect(samples.counts.length).toBeGreaterThan(0);expect(Math.max(...samples.counts)).toBe(1);expect(samples.seen[0]).toBe(first);expect(samples.seen).toContain(second);
  await writeFile('docs/benchmarks/conversion-queue-0.1.16.json',JSON.stringify({browser:context.browser()!.version(),managers:2,maximumSimultaneousConverting:Math.max(...samples.counts),bothFilesSaved:true,observedFirstMatchesSelectionOrder:samples.seen[0]===first},null,2)+'\n');
});

test('an unsupported video track is refused without exporting an audio-only MP4',async()=>{
  const id=await choose('fixtures/conversion/unsupported.mkv');const card=ui.locator(`[data-task-id="${id}"]`);await expect(card).toHaveAttribute('data-state','failed');await expect(card.locator('.task-error p')).toHaveText('Chrome cannot convert every audio/video track in this file to H.264/AAC. The original is kept; no incomplete MP4 was saved.');expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);
  const files=await ui.evaluate(async id=>{const names:string[]=[];const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle(id);for await(const name of (dir as any).keys())names.push(name);return names;},id);expect(files).toEqual(['input.original']);
});

test('conversion uses the saved folder and Save As preference when another manager changed them',async()=>{
  const other=await context.newPage();await other.goto(`${base}/manager.html#settings`);
  await other.evaluate(async()=>{const{data}=await chrome.runtime.sendMessage({type:'snapshot'});await chrome.runtime.sendMessage({type:'settings',value:{...data.settings,folder:'Converted/2026',saveAs:true}});});
  await ui.evaluate(()=>{const original=chrome.downloads.download.bind(chrome.downloads);(window as any).saveCalls=[];chrome.downloads.download=((options:any)=>{(window as any).saveCalls.push({filename:options.filename,saveAs:options.saveAs});return original(options);}) as typeof chrome.downloads.download;});
  const id=await choose('fixtures/conversion/transcode.webm');const result=await completed(id,'save-as');expect(result.task.destination).toEqual({folder:'Converted/2026',saveAs:true});expect(await ui.evaluate(()=>(window as any).saveCalls)).toEqual([{filename:'Converted/2026/transcode-converted.mp4',saveAs:true}]);
});

test('pause, cancel and real manager closure keep the source and restart conversion after recovery',async()=>{
  const long=resolve('artifacts/conversion-long.webm');test.skip(!await access(long).then(()=>true,()=>false),'Generate the optional 60-second conversion fixture with --long.');test.setTimeout(95000);
  let id=await choose(long),card=ui.locator(`[data-task-id="${id}"]`);await expect(card).toHaveAttribute('data-state','converting');await card.getByRole('button',{name:'Pause',exact:true}).click();await expect(card).toHaveAttribute('data-state','paused');await expect.poll(async()=>(await snapshot()).find((t:any)=>t.id===id)?.owner??null).toBeNull();expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);
  await card.getByRole('button',{name:'Resume',exact:true}).click();await expect(card).toHaveAttribute('data-state','converting');await card.getByRole('button',{name:'Cancel',exact:true}).click();await expect(card).toHaveAttribute('data-state','cancelled');await expect.poll(async()=>(await snapshot()).find((t:any)=>t.id===id)?.owner??null).toBeNull();expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);
  id=await choose(long);card=ui.locator(`[data-task-id="${id}"]`);await expect(card).toHaveAttribute('data-state','converting');await ui.screenshot({path:'artifacts/evidence/conversion/converting.png',animations:'disabled'});
  for(const page of context.pages().filter(p=>p.url().includes('manager.html')))await page.close();ui=await context.newPage();await ui.goto(`${base}/manager.html`);card=ui.locator(`[data-task-id="${id}"]`);await expect(card).toHaveAttribute('data-state','paused',{timeout:35000});await card.getByRole('button',{name:'Resume',exact:true}).click();const result=await completed(id,'recovered-long');expect(result.task.validation.duration).toBeGreaterThan(59);expect(result.task.validation.duration).toBeLessThan(61);
});

test('conversion defaults persist, resize real video and supply the library and tools from Settings',async()=>{
  await ui.locator('.conversion-settings').getByLabel('Video quality',{exact:true}).selectOption('balanced');await ui.locator('.conversion-settings').getByLabel('Maximum resolution',{exact:true}).selectOption('480');await ui.locator('.conversion-settings').getByLabel('Audio bitrate',{exact:true}).selectOption('128');await ui.getByRole('button',{name:'Save settings',exact:true}).click();await ui.reload();await expect(ui.locator('.conversion-settings').getByLabel('Video quality',{exact:true})).toHaveValue('balanced');await expect(ui.locator('.conversion-settings').getByLabel('Maximum resolution',{exact:true})).toHaveValue('480');await expect(ui.locator('.conversion-settings').getByLabel('Audio bitrate',{exact:true})).toHaveValue('128');await ui.screenshot({path:'artifacts/evidence/conversion/settings-0.1.22.png',fullPage:true});
  const id=await choose('fixtures/conversion/settings.mp4'),result=await completed(id,'settings-480p');expect(result.task.conversion.operation.options).toEqual({quality:'balanced',maxHeight:480,audioKbps:128});expect(result.task.conversion.videoEncoded).toBe(true);expect(result.task.conversion.audioEncoded).toBe(true);const output=new Input({source:new BlobSource(new Blob([result.bytes])),formats:ALL_FORMATS});try{const video=(await output.getPrimaryVideoTrack())!;expect(await video.getDisplayWidth()).toBe(852);expect(await video.getDisplayHeight()).toBe(480);expect(await(await output.getPrimaryAudioTrack())!.getSampleRate()).toBe(48000);}finally{output.dispose();}
  await ui.getByRole('button',{name:'Add a video',exact:true}).click();const dialog=ui.getByRole('dialog',{name:'Video tools'});await expect(dialog.getByLabel('Video quality',{exact:true})).toHaveCount(0);await dialog.locator('select').first().selectOption('convert');await dialog.getByLabel('Choose videos',{exact:true}).setInputFiles('fixtures/conversion/copy.mkv');await dialog.getByRole('button',{name:'Add to processing queue',exact:true}).click();let next:string;await expect.poll(async()=>next=(await snapshot()).find((t:any)=>t.id!==id)?.id).toBeTruthy();const second=await completed(next!,'settings-inherited');expect(second.task.conversion.operation.options).toEqual({quality:'balanced',maxHeight:480,audioKbps:128});
  await ui.locator('.manager-tabs').getByRole('button',{name:'Settings',exact:true}).click();await ui.reload();await expect(ui.locator('.conversion-settings').getByLabel('Video quality',{exact:true})).toHaveValue('balanced');await expect(ui.locator('.conversion-settings').getByLabel('Maximum resolution',{exact:true})).toHaveValue('480');
  const invalid=await ui.evaluate(async()=>chrome.runtime.sendMessage({type:'settings',value:{...(await chrome.runtime.sendMessage({type:'snapshot'})).data.settings,conversion:{quality:'invalid',maxHeight:480,audioKbps:128}}}));expect(invalid).toMatchObject({ok:false,error:'invalid'});
});
