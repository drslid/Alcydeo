import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{resolve}from'node:path';
import{mkdir,mkdtemp,readFile,writeFile,rm}from'node:fs/promises';
import{tmpdir}from'node:os';
import{createHash}from'node:crypto';
import{Input,BlobSource,ALL_FORMATS,Output,Mp4OutputFormat,BufferTarget,EncodedVideoPacketSource,EncodedAudioPacketSource,EncodedPacketSink}from'mediabunny';

type Crop={x:number;y:number;width:number;height:number};
let context:BrowserContext,ui:Page,base:string,profile:string,httpRequests:string[];
const out='artifacts/evidence/crop-editor48',source='fixtures/media/high.mp4';
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')) as Record<string,Record<string,string>>;
const locales=['en','es','fr','de','zh_CN','ar','ru','pt','hi','ur'];
const english=catalogs.en!;
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');

async function metadata(bytes:Uint8Array){
 const input=new Input({source:new BlobSource(new Blob([bytes])),formats:ALL_FORMATS});
 try{const video=(await input.getPrimaryVideoTrack())!,audio=await input.getPrimaryAudioTrack();return{width:await video.getDisplayWidth(),height:await video.getDisplayHeight(),duration:await input.computeDuration(),videoCodec:await video.getCodec(),audioCodec:await audio?.getCodec(),channels:await audio?.getNumberOfChannels()};}finally{input.dispose();}
}
async function portraitFixture(){
 const input=new Input({source:new BlobSource(new Blob([await readFile(source)])),formats:ALL_FORMATS});
 try{
  const video=(await input.getPrimaryVideoTrack())!,audio=(await input.getPrimaryAudioTrack())!;
  const target=new BufferTarget(),output=new Output({format:new Mp4OutputFormat(),target});
  const videoSource=new EncodedVideoPacketSource((await video.getCodec())!),audioSource=new EncodedAudioPacketSource((await audio.getCodec())!);
  output.addVideoTrack(videoSource,{rotation:90});output.addAudioTrack(audioSource);await output.start();
  const videoConfig=(await video.getDecoderConfig())!,audioConfig=(await audio.getDecoderConfig())!;let first=true;
  for await(const packet of new EncodedPacketSink(video).packets()){await videoSource.add(packet,first?{decoderConfig:videoConfig}:undefined);first=false;}videoSource.close();first=true;
  for await(const packet of new EncodedPacketSink(audio).packets()){await audioSource.add(packet,first?{decoderConfig:audioConfig}:undefined);first=false;}audioSource.close();await output.finalize();
  const path=`${out}/portrait.mp4`;await writeFile(path,new Uint8Array(target.buffer!));return path;
 }finally{input.dispose();}
}
test.beforeEach(async()=>{
 await mkdir(out,{recursive:true});profile=await mkdtemp(resolve(tmpdir(),'alcydeo-crop-'));await mkdir(resolve(profile,'Default'));
 const downloadPath=resolve(out,'downloads',crypto.randomUUID());await mkdir(downloadPath,{recursive:true});await writeFile(resolve(profile,'Default/Preferences'),JSON.stringify({download:{default_directory:downloadPath,prompt_for_download:false}}));
 const ext=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');
 context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--load-extension=${ext}`,`--disable-extensions-except=${ext}`,'--no-sandbox','--test-type']});
 const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;
 await sw.evaluate(async()=>{const{settings}=await chrome.storage.local.get('settings');await chrome.storage.local.set({language:'en',settings:{...settings,saveAs:false}});});
 httpRequests=[];context.on('request',request=>{if(/^https?:/.test(request.url()))httpRequests.push(request.url());});
 ui=await context.newPage();await ui.setViewportSize({width:1440,height:1100});
 const cdp=await context.browser()!.newBrowserCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'default'});await cdp.detach();
 await ui.goto(`${base}/manager.html#tools`);await ui.locator('.tools-panel').getByRole('button',{name:english.cropTool!,exact:true}).click();
});
test.afterEach(async()=>{await context?.close();await rm(profile,{recursive:true,force:true});});

const panel=()=>ui.locator('.tools-panel');
const editor=()=>ui.locator('.crop-editor');
const exportButton=(c=english)=>panel().getByRole('button',{name:c.cropExport!,exact:true});
async function choose(path=source,c=english){
 const bytes=await readFile(path),info=await metadata(bytes);
 await panel().getByLabel(c.chooseVideos!,{exact:true}).setInputFiles({name:path===source?'Crop lesson.mp4':'Second lesson.mp4',mimeType:'video/mp4',buffer:bytes});
 await expect(editor().locator('video')).toHaveJSProperty('videoWidth',info.width);await expect(editor().locator('video')).toHaveJSProperty('videoHeight',info.height);await expect(editor().locator('.crop-surface')).toBeVisible();
 return{bytes,info};
}
async function crop(c=english):Promise<Crop>{
 const [x,y,width,height]=await Promise.all(['cropLeft','cropTop','cropWidth','cropHeight'].map(key=>editor().getByLabel(c[key]!,{exact:true}).inputValue().then(Number)));
 return{x:x!,y:y!,width:width!,height:height!};
}
async function geometry(){
 await editor().locator('.crop-surface').scrollIntoViewIfNeeded();
 const surface=await editor().locator('.crop-surface').boundingBox();expect(surface).toBeTruthy();
 const native=await editor().locator('video').evaluate((video:HTMLVideoElement)=>({width:video.videoWidth,height:video.videoHeight}));
 return{surface:surface!,native};
}
async function draw(rect:Crop,c=english){
 const{surface,native}=await geometry(),point=(x:number,y:number)=>({x:surface.x+x/native.width*surface.width,y:surface.y+y/native.height*surface.height});
 const start=point(rect.x,rect.y),end=point(rect.x+rect.width,rect.y+rect.height);
 await ui.mouse.move(start.x,start.y);await ui.mouse.down();await ui.mouse.move(end.x,end.y,{steps:8});await ui.mouse.up();
 await expect.poll(()=>crop(c)).toEqual(rect);await expect(exportButton(c)).toBeEnabled();
}
async function assertInside(){
 const{surface,native}=await geometry(),selection=await editor().locator('.crop-selection').boundingBox();expect(selection).toBeTruthy();
 expect(surface.width/surface.height).toBeCloseTo(native.width/native.height,2);
 expect(selection!.x).toBeGreaterThanOrEqual(surface.x-1);expect(selection!.y).toBeGreaterThanOrEqual(surface.y-1);
 expect(selection!.x+selection!.width).toBeLessThanOrEqual(surface.x+surface.width+1);expect(selection!.y+selection!.height).toBeLessThanOrEqual(surface.y+surface.height+1);
}
async function evidence(name:string,data:Record<string,unknown>){await writeFile(`${out}/${name}.json`,JSON.stringify({browser:context.browser()!.version(),build:await ui.evaluate(()=>chrome.runtime.getManifest().version),...data},null,2)+'\n');}
async function screenshot(name:string){await ui.evaluate(()=>window.scrollTo(0,0));await ui.screenshot({path:`${out}/${name}.png`,fullPage:true,animations:'disabled'});}

test('a rectangle drawn on the real video exports the corresponding MP4 and preserves audio and the original',async()=>{
 await expect(exportButton()).toBeDisabled();const original=await choose();await expect(exportButton()).toBeDisabled();
 const selected={x:90,y:50,width:360,height:200};await draw(selected);await assertInside();
 const preview=editor().locator('.crop-preview canvas');await expect(preview).toBeVisible();
 const pixels=await preview.evaluate((canvas:HTMLCanvasElement)=>({width:canvas.width,height:canvas.height,nonblank:canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data.some((channel,index)=>index%4!==3&&channel>0)}));
 expect(pixels.width/pixels.height).toBeCloseTo(selected.width/selected.height,2);expect(pixels.nonblank).toBe(true);
 await screenshot('export-selection-en');await exportButton().click();await expect(ui).toHaveURL(`${base}/manager.html#library`);
 const card=ui.locator('.task-card').first();await expect(card).toHaveAttribute('data-state','completed',{timeout:45000});
 const result=await ui.evaluate(async()=>{const task=(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks[0];return{task,item:(await chrome.downloads.search({id:task.downloadId}))[0],count:(await chrome.downloads.search({})).length};});
 expect(result.task.conversion.operation).toMatchObject({kind:'crop',crop:selected});expect(result.task.conversion.videoEncoded).toBe(true);expect(result.task.validation.tracks).toEqual([{type:'video',codec:'avc'},{type:'audio',codec:'aac'}]);
 expect(result.item.state).toBe('complete');expect(result.item.exists).toBe(true);expect(result.item.filename).toMatch(/Crop lesson-cropped(?: \(\d+\))?\.mp4$/);expect(result.count).toBe(1);
 const bytes=await readFile(result.item.filename),actual=await metadata(bytes);
 expect(actual.width).toBe(selected.width);expect(actual.height).toBe(selected.height);expect(actual.width%2).toBe(0);expect(actual.height%2).toBe(0);expect(actual.videoCodec).toBe('avc');expect(actual.audioCodec).toBe(original.info.audioCodec);expect(actual.channels).toBe(original.info.channels);expect(Math.abs(actual.duration-original.info.duration)).toBeLessThan(.1);
 expect(hash(await readFile(source))).toBe(hash(original.bytes));expect(httpRequests).toEqual([]);
 await writeFile(`${out}/cropped.mp4`,bytes);await evidence('export',{selected,source:original.info,output:actual,bytes:bytes.length,originalUnchanged:true,httpRequests:0});
});

test('selection dragging, resizing and keyboard arrows use video pixels including Shift steps',async()=>{
 await choose();await draw({x:90,y:50,width:270,height:150});
 let{surface,native}=await geometry();const scaleX=surface.width/native.width,scaleY=surface.height/native.height;
 await ui.mouse.move(surface.x+225*scaleX,surface.y+125*scaleY);await ui.mouse.down();await ui.mouse.move(surface.x+249*scaleX,surface.y+137*scaleY,{steps:8});await ui.mouse.up();
 await expect.poll(()=>crop()).toEqual({x:114,y:62,width:270,height:150});
 const handle=await editor().locator('.crop-handle[data-handle="se"]').boundingBox();expect(handle).toBeTruthy();
 await ui.mouse.move(handle!.x+handle!.width/2,handle!.y+handle!.height/2);await ui.mouse.down();await ui.mouse.move(handle!.x+handle!.width/2+36*scaleX,handle!.y+handle!.height/2+20*scaleY,{steps:8});await ui.mouse.up();
 await expect.poll(()=>crop()).toEqual({x:114,y:62,width:306,height:170});
 await editor().locator('.crop-selection').focus();await ui.keyboard.press('ArrowRight');await ui.keyboard.press('Shift+ArrowDown');
 await expect.poll(()=>crop()).toEqual({x:115,y:72,width:306,height:170});await assertInside();
 ({surface,native}=await geometry());await ui.mouse.move(surface.x+1,surface.y+1);await ui.mouse.down();await ui.mouse.move(surface.x+surface.width-1,surface.y+surface.height-1,{steps:8});await ui.mouse.up();await assertInside();
 expect(await ui.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(httpRequests).toEqual([]);
});

test('resizing the viewport preserves pixel coordinates and choosing another file clears the crop',async()=>{
 await choose();const selected={x:100,y:60,width:300,height:180};await draw(selected);
 await ui.setViewportSize({width:820,height:1100});await assertInside();expect(await crop()).toEqual(selected);expect(await ui.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await ui.setViewportSize({width:390,height:844});await assertInside();expect(await crop()).toEqual(selected);expect(await ui.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await screenshot('editor-390');
 await draw({x:30,y:20,width:160,height:120});await choose('fixtures/media/low.mp4');await expect(exportButton()).toBeDisabled();
 await draw({x:20,y:10,width:120,height:100});expect(await crop()).toEqual({x:20,y:10,width:120,height:100});await assertInside();expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(0);expect(httpRequests).toEqual([]);
 const portrait=await portraitFixture(),{info}=await choose(portrait);expect(info.height).toBeGreaterThan(info.width);await expect(exportButton()).toBeDisabled();
 const portraitCrop={x:20,y:30,width:100,height:180};await draw(portraitCrop);await assertInside();expect(await ui.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await screenshot('editor-portrait-390');await evidence('portrait',{source:info,rotation:90,selected:portraitCrop,viewport:390,httpRequests:httpRequests.length});
});

for(const locale of locales)test(`the crop editor stays usable in ${locale} without reloading or mirroring source coordinates`,async()=>{
 const c=catalogs[locale]!;for(const key of ['cropTool','cropLeft','cropTop','cropWidth','cropHeight','cropExport','cropPreview'])expect(c[key]).toBeTruthy();
 await choose();const selected={x:90,y:50,width:180,height:100};await draw(selected);
 const token=await ui.evaluate(()=>((window as any).cropDocumentToken=crypto.randomUUID()));
 await ui.evaluate(locale=>chrome.storage.local.set({language:locale}),locale);
 await expect(panel().getByRole('button',{name:c.cropTool!,exact:true})).toHaveAttribute('aria-pressed','true');await expect(ui.locator('html')).toHaveAttribute('dir',['ar','ur'].includes(locale)?'rtl':'ltr');
 await expect(exportButton(c)).toBeEnabled();expect(await crop(c)).toEqual(selected);expect(await ui.evaluate(()=>(window as any).cropDocumentToken)).toBe(token);
 await editor().locator('.crop-selection').focus();await ui.keyboard.press('ArrowRight');await expect.poll(()=>crop(c)).toEqual({...selected,x:selected.x+1});await assertInside();
 expect(await ui.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(httpRequests).toEqual([]);
 if(['en','fr','ar'].includes(locale)){await ui.emulateMedia({colorScheme:locale==='fr'?'dark':'light'});await screenshot(`editor-${locale}${locale==='fr'?'-dark':''}`);}
});
