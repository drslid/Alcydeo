import {test,expect,chromium,type BrowserContext,type Page} from '@playwright/test';
import {resolve} from 'node:path';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {VideoPlaybackAbrRequest} from 'googlevideo/protos';
import {fixtureAudioTags,fixturePage,fixtureUmp} from '../../scripts/youtube-fixture.mjs';
let context:BrowserContext,ui:Page,base:string;
test.beforeAll(async()=>{
  const extension=resolve('apps/extension/.output/chrome-mv3');context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--no-sandbox','--test-type']});
  const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;ui=await context.newPage();await ui.goto(`${base}/manager.html`);
  await context.route('https://www.youtube.com/**',async route=>{const url=new URL(route.request().url());if(url.pathname==='/original-fixture-data')await route.fulfill({contentType:'application/octet-stream',body:await readFile('fixtures/media/high.mp4')});else await route.fulfill({contentType:'text/html',body:fixturePage({adaptive:url.searchParams.has('adaptive'),reject:url.searchParams.has('reject')})});});
  await context.route('https://fixture.googlevideo.com/**',async route=>{const url=new URL(route.request().url()),itag=url.searchParams.get('itag');if(itag){const type=itag==='140'?'audio':'video',count=type==='audio'?4:3;const files=await Promise.all(['init.mp4',...Array.from({length:count},(_,i)=>`segment-${i}.m4s`)].map(name=>readFile(`fixtures/hls-${type}/${name}`)));await route.fulfill({contentType:`${type}/mp4`,body:Buffer.concat(files)});}else {const request=VideoPlaybackAbrRequest.decode(route.request().postDataBuffer()!);expect(request.selectedAudioFormatIds[0]?.xtags).toBe(fixtureAudioTags);await route.fulfill({contentType:'application/vnd.yt-ump',headers:{'Access-Control-Allow-Origin':'*'},body:await fixtureUmp(url.searchParams.has('reject'))});}});
});
test.afterAll(async()=>context?.close());
async function open(query=''){
  const source=await context.newPage();await source.goto(`https://www.youtube.com/watch?v=abcdefghijk${query}`);await expect.poll(()=>source.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(0);
  const tabId=await ui.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url)!.id!,source.url());await ui.setViewportSize({width:525,height:600});await ui.goto(`${base}/popup.html?tabId=${tabId}`);await expect(ui.locator('.media-card')).toHaveCount(1);await expect(ui.getByRole('button',{name:'Download',exact:true})).toBeEnabled();return{source,tabId};
}
for(const kind of ['sabr','adaptive'])test(`complete ${kind} separate-track file is saved, verified and found`,async()=>{
  const{source,tabId}=await open(kind==='adaptive'?'&adaptive=1':'');await mkdir('artifacts/evidence/youtube',{recursive:true});await ui.screenshot({path:`artifacts/evidence/youtube/${kind}-popup.png`});
  const snapshot=await ui.evaluate(id=>chrome.runtime.sendMessage({type:'snapshot',tabId:id}),tabId);expect(snapshot.data.media[0].kind).toBe(kind);
  const event=context.waitForEvent('download');await ui.getByRole('button',{name:'Download',exact:true}).click();const download=await event;await download.saveAs(`artifacts/evidence/youtube/${kind}-original.mp4`);expect(await download.failure()).toBeNull();
  await ui.goto(`${base}/manager.html#downloads`);const task=ui.locator('.task-card').first();await expect(task).toHaveAttribute('data-state','completed');const id=await task.getAttribute('data-task-id');const data=await ui.evaluate(async id=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks.find((t:any)=>t.id===id),id);expect(data.validation.tracks.filter((t:any)=>t.type==='video')).toHaveLength(1);expect(data.validation.tracks.filter((t:any)=>t.type==='audio')).toHaveLength(1);expect(data.validation.duration).toBeGreaterThan(5.9);expect(data.validation.bytes).toBeGreaterThan(1_000_000);
  await writeFile(`docs/benchmarks/youtube-${kind}-fixture-0.1.11.json`,JSON.stringify({fixture:true,networkYouTube:false,kind,state:data.state,validation:data.validation},null,2)+'\n');await source.close();
});
test('server attestation refusal stops partial media without saving a download',async()=>{
  const{source}=await open('&reject=1');const before=await ui.evaluate(()=>chrome.downloads.search({}));await ui.getByRole('button',{name:'Download',exact:true}).click();await ui.goto(`${base}/manager.html#downloads`);const task=ui.locator('.task-card').first();await expect(task).toHaveAttribute('data-state','failed');await expect(task.locator('.error-code')).toHaveText('sourceRestricted');await expect(task).toContainText('The source refused access to this stream.');await ui.screenshot({path:'artifacts/evidence/youtube/refused.png'});expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(before.length);await source.close();
});

test('HTML returned by a SABR endpoint remains an HTML diagnostic without saving a file',async()=>{
  const{source}=await open('&html=1');const before=await ui.evaluate(()=>chrome.downloads.search({}));const html=async(route:any)=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Session expired</title>'});await context.route('https://fixture.googlevideo.com/**',html);
  try{await ui.getByRole('button',{name:'Download',exact:true}).click();await ui.goto(`${base}/manager.html#downloads`);const task=ui.locator('.task-card').first();await expect(task).toHaveAttribute('data-state','failed');await expect(task.locator('.error-code')).toHaveText('html');expect(await ui.evaluate(()=>chrome.downloads.search({}))).toHaveLength(before.length);}finally{await context.unroute('https://fixture.googlevideo.com/**',html);await source.close();}
});
