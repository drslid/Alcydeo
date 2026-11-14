import{test,expect,chromium,type BrowserContext,type Page}from'@playwright/test';
import{resolve}from'node:path';
import{mkdir,mkdtemp,readFile,writeFile,rm}from'node:fs/promises';
import{tmpdir}from'node:os';
import{Input,BlobSource,ALL_FORMATS}from'mediabunny';

let context:BrowserContext,ui:Page,base:string,profile:string;
const site='https://coflix.esq',cdn='https://u14.vidzy.cc',token='original%2Bsignature%2F',gate='observed_gate';
const video=`${cdn}/video/index.m3u8?t=${token}`,audio=`${cdn}/audio/index.m3u8?t=${token}`,nativeVideo=video+'&gk='+gate,nativeAudio=audio+'&gk='+gate;
const out='artifacts/evidence/hls-components49';
test.beforeEach(async()=>{
 await mkdir(out,{recursive:true});profile=await mkdtemp(resolve(tmpdir(),'alcydeo-hls-components-'));await mkdir(resolve(profile,'Default'));
 await writeFile(resolve(profile,'Default/Preferences'),JSON.stringify({download:{default_directory:resolve(out,'downloads',crypto.randomUUID()),prompt_for_download:false}}));
 const ext=resolve(process.env.ALCYDEO_EXTENSION_PATH??'apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH,headless:true,acceptDownloads:true,args:[`--load-extension=${ext}`,`--disable-extensions-except=${ext}`,'--no-sandbox','--test-type']});
 const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;
 await sw.evaluate(async()=>{const{settings}=await chrome.storage.local.get('settings');await chrome.storage.local.set({settings:{...settings,saveAs:false}});});
 ui=await context.newPage();await ui.setViewportSize({width:525,height:600});await ui.goto(`${base}/manager.html`);
 const cdp=await context.browser()!.newBrowserCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'default'});await cdp.detach();
});
test.afterEach(async({browserName},info)=>{if(info.status!=='passed'&&ui&&!ui.isClosed())await writeFile(`${out}/failure-session.json`,JSON.stringify({browserName,session:await ui.evaluate(()=>chrome.storage.session.get(null))},null,2));await context?.close();await rm(profile,{recursive:true,force:true});});

test('checked native video and audio leaves stay one complete quality through refresh and save both tracks',async()=>{
 const full:string[]=[],samples:string[]=[],master=`${cdn}/master.m3u8?t=${token}`;let denied:'none'|'plain'|'native'='none';
 await context.route(`${cdn}/**`,async route=>{
  const request=route.request(),u=new URL(request.url());expect(u.searchParams.get('t')).toBe('original+signature/');
  if(u.pathname==='/audio/index.m3u8'&&(denied==='native'&&u.searchParams.has('gk')||denied==='plain'&&!u.searchParams.has('gk'))){await route.fulfill({status:403,contentType:'application/vnd.apple.mpegurl',body:'Access denied'});return;}
  if(u.pathname==='/master.m3u8'){await route.fulfill({contentType:'application/vnd.apple.mpegurl',body:`#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="Français",LANGUAGE="fr",DEFAULT=YES,URI="${audio}"\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="Español",LANGUAGE="es",DEFAULT=NO,URI="${cdn}/other-audio.m3u8?t=${token}"\n#EXT-X-STREAM-INF:BANDWIDTH=2400000,RESOLUTION=720x404,AUDIO="audio"\n${video}\n`});return;}
  const track=u.pathname.startsWith('/audio/')?'audio':'video';
  if(u.pathname.endsWith('index.m3u8')){const original=await readFile(`fixtures/hls-${track}/index.m3u8`,'utf8'),query=`?t=${token}${u.searchParams.has('gk')?'&gk='+gate:''}`;const body=original.replace(/URI="([^"]+)"/g,(_all,uri)=>`URI="${uri}${query}"`).replace(/^(segment-\d+\.m4s)$/gm,`$1${query}`);await route.fulfill({contentType:'application/vnd.apple.mpegurl',body});return;}
  const data=await readFile('fixtures/hls-'+track+'/'+u.pathname.split('/').pop()),range=request.headers().range?.match(/^bytes=(\d+)-(\d*)$/),start=Number(range?.[1]??0),end=Math.min(Number(range?.[2]||data.length-1),data.length-1);
  if(range)samples.push(u.pathname);else{expect(u.searchParams.get('gk')).toBe(gate);full.push(u.pathname);}
  await route.fulfill({status:range?206:200,headers:{'Content-Type':'video/mp4','Content-Range':`bytes ${start}-${end}/${data.length}`,'Access-Control-Allow-Origin':'*'},body:data.subarray(start,end+1)});
 });
 await context.route('https://vidzy.cc/embed-components.html',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><script>window.refreshLeaves=async()=>{await fetch('${nativeVideo}').then(r=>r.text());await fetch('${nativeAudio}').then(r=>r.text());};fetch('${master}').then(r=>r.text()).then(()=>window.refreshLeaves());</script>`}));
 await context.route(`${site}/**`,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Original separate-track lesson</title><iframe src="https://vidzy.cc/embed-components.html"></iframe>'}));
 const source=await context.newPage();await source.goto(`${site}/episode/original-components/`);
 const tabId=await ui.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url)!.id!,source.url());await ui.goto(`${base}/popup.html?tabId=${tabId}`);
 const state=()=>ui.evaluate(async tabId=>(await chrome.runtime.sendMessage({type:'snapshot',tabId})).data.media,tabId);
 await expect.poll(async()=>{const list=await state();return list.length===1&&list[0].variants.length===1&&list[0].variants[0].url===nativeVideo&&list[0].variants[0].audioUrl===nativeAudio;},{timeout:15000}).toBe(true);
 const card=ui.locator('.media-card');await expect(card).toHaveCount(1);await expect(card.locator('option')).toHaveText(['404p']);await expect(card.locator('.source-check')).toHaveText('Accessible');expect(await ui.evaluate(tabId=>chrome.action.getBadgeText({tabId}),tabId)).toBe('1');
 const selected=(await state())[0].variants[0];expect(selected.check.hlsTracks).toHaveLength(2);expect(selected.audioSourceUrls).toContain(audio);expect(full).toEqual([]);expect(samples.length).toBeGreaterThanOrEqual(8);
 const counts:number[]=[];const reader=source.frames().find(frame=>frame.url().startsWith('https://vidzy.cc/'))!;
 for(let i=0;i<2;i++){await reader.evaluate(()=>(window as any).refreshLeaves());for(let sample=0;sample<6;sample++){counts.push((await state()).length);await ui.waitForTimeout(35);}}
 expect([...new Set(counts)]).toEqual([1]);await card.getByRole('button',{name:'Find qualities',exact:true}).click();await ui.getByRole('button',{name:'Scan page',exact:true}).click();
 await expect.poll(async()=>{const list=await state();return list.length===1&&list[0].variants[0]?.url===nativeVideo&&list[0].variants[0]?.audioUrl===nativeAudio&&list[0].variants[0]?.id===selected.id;}).toBe(true);expect(full).toEqual([]);
 denied='plain';expect(await reader.evaluate(url=>fetch(url).then(response=>response.status),audio)).toBe(403);await ui.waitForTimeout(150);expect((await state())[0].variants[0].audioUrl).toBe(nativeAudio);await expect(card).toHaveCount(1);denied='none';
 await ui.screenshot({path:`${out}/popup.png`});await card.getByRole('button',{name:'Download',exact:true}).click();
 await expect.poll(()=>context.pages().find(page=>page.url().includes('/manager.html'))?.url()).toBeTruthy();const manager=context.pages().find(page=>page.url().includes('/manager.html'))!;await expect(manager.locator('.task-card')).toHaveAttribute('data-state','completed',{timeout:25000});
 const result=await manager.evaluate(async()=>{const task=(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks[0];return{task,item:(await chrome.downloads.search({id:task.downloadId}))[0],downloads:(await chrome.downloads.search({})).length};});
 expect(result.task.variant).toMatchObject({url:nativeVideo,audioUrl:nativeAudio,id:selected.id});expect(result.task.validation.tracks).toEqual([{type:'video',codec:'avc'},{type:'audio',codec:'aac'}]);expect(result.item.state).toBe('complete');expect(result.item.exists).toBe(true);expect(result.downloads).toBe(1);
 expect(full.filter(path=>path.startsWith('/video/'))).toHaveLength(4);expect(full.filter(path=>path.startsWith('/audio/'))).toHaveLength(5);
 const bytes=await readFile(result.item.filename),input=new Input({source:new BlobSource(new Blob([bytes])),formats:ALL_FORMATS});
 try{expect(await(await input.getPrimaryVideoTrack())!.getDisplayHeight()).toBe(404);expect(await(await input.getPrimaryAudioTrack())!.getCodec()).toBe('aac');expect(await input.computeDuration()).toBeCloseTo(6,0);}finally{input.dispose();}
 const refusalAt=await ui.evaluate(()=>Date.now());denied='native';expect(await reader.evaluate(url=>fetch(url).then(response=>response.status),nativeAudio)).toBe(403);
 const complete=(list:any[])=>list.every(media=>media.kind==='hls'&&media.variants.every((v:any)=>v.audioUrl&&v.audioUrl!==nativeAudio&&v.check?.state==='ready'&&v.check.hlsTracks?.length===2));
 let stableKey='',stableAt=0;
 await expect.poll(async()=>{const list=await state(),key=JSON.stringify(list);if(!complete(list)||key!==stableKey){stableKey=key;stableAt=Date.now();}return complete(list)&&Date.now()-stableAt>=500;},{timeout:15000,intervals:[100]}).toBe(true);
 const alternatives=await state();expect(complete(alternatives)).toBe(true);await expect(card).toHaveCount(alternatives.length);expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(1);
 await writeFile(`${out}/original-separated.mp4`,bytes);await writeFile(`${out}/result.json`,JSON.stringify({browser:context.browser()!.version(),build:await ui.evaluate(()=>chrome.runtime.getManifest().version),fixture:true,nativeVideoAndAudioPreserved:true,oneQuality:true,nativeRefreshCounts:counts,unusedAliasRefusalPreservesPair:true,selectedAudioRefusalRemovesTransport:true,refusalAt,alternatives:alternatives.flatMap((m:any)=>m.variants.map((v:any)=>({declaredAudio:v.audioUrl===audio,tracks:v.check.hlsTracks.length,checkedAt:v.check.checkedAt,freshAfterRefusal:v.check.checkedAt>=refusalAt}))),validation:result.task.validation,bytes:bytes.length,fullFragments:full},null,2)+'\n');
});
