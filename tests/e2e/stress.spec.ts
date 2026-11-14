import { test, expect, chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
test('direct download and byte comparison of a >2 GB synthetic course',async()=>{
  test.skip(!process.env.ALCYDEO_LARGE_FILE,'Generate the optional large corpus and set ALCYDEO_LARGE_FILE.');test.setTimeout(180_000);
  const extension=resolve('apps/extension/.output/chrome-mv3');
  const context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--no-sandbox','--test-type','--disable-dev-shm-usage']});
  try {
    const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');const id=new URL(sw.url()).host;const base=`chrome-extension://${id}`;
    const popup=await context.newPage();await popup.goto(`${base}/manager.html`);
    const source=await context.newPage();await source.goto('http://127.0.0.1:4179/empty.html');await source.evaluate(()=>{const v=document.createElement('video');v.src='/large.mp4';v.title='Large synthetic course';v.preload='metadata';document.body.append(v);});
    const tabId=await sw.evaluate(async()=>{const tabs=await chrome.tabs.query({});return tabs.find(t=>t.url?.endsWith('/empty.html'))!.id!;});
    await popup.goto(`${base}/popup.html?tabId=${tabId}`);await expect(popup.getByRole('button',{name:'Download',exact:true})).toBeVisible();
    const browserSession=await context.browser()!.newBrowserCDPSession();
    let rssPeak=0;let rssBefore=0;let sampling=false;
    async function sample(){if(sampling)return;sampling=true;try{const info=await browserSession.send('SystemInfo.getProcessInfo');let sum=0;for(const p of info.processInfo){try{const status=await readFile(`/proc/${p.id}/status`,'utf8');sum+=Number(/^VmRSS:\s+(\d+)/m.exec(status)?.[1]??0)*1024;}catch{/* Linux sampling unavailable or process exited. */}}rssPeak=Math.max(rssPeak,sum);if(!rssBefore)rssBefore=sum;}finally{sampling=false;}}
    await sample();const timer=setInterval(()=>void sample(),200);
    const started=Date.now();await popup.getByRole('button',{name:'Download',exact:true}).click();await popup.evaluate(()=>chrome.runtime.sendMessage({type:'openManager'}));const manager=context.pages().find(p=>p.url().includes('manager.html'))??await context.waitForEvent('page');
    const task=manager.locator('.task-card');await expect(task).toHaveAttribute('data-state','completed',{timeout:120_000});const downloaded=Date.now();
    const [item]=await sw.evaluate(()=>chrome.downloads.search({state:'complete'}));expect(item!.bytesReceived).toBeGreaterThan(2_147_483_648);
    
    await expect(task).toHaveAttribute('data-state','completed',{timeout:120_000});const {createHash}=await import('node:crypto'),{createReadStream}=await import('node:fs');const hash=async(path:string)=>{const result=createHash('sha256');for await(const chunk of createReadStream(path))result.update(chunk);return result.digest('hex');};const actualHash=await hash(item!.filename);expect(actualHash).toBe(await hash(process.env.ALCYDEO_LARGE_FILE!));const checked=Date.now();clearInterval(timer);await sample();
    await mkdir('artifacts/benchmarks',{recursive:true});
    await writeFile('artifacts/benchmarks/chrome-large.json',JSON.stringify({date:new Date().toISOString(),browser:context.browser()!.version(),os:process.platform,bytes:item!.bytesReceived,downloadMs:downloaded-started,byteComparisonMs:checked-downloaded,sha256:actualHash,equalsOriginal:true,browserProcessRssSumBefore:rssBefore,browserProcessRssSumPeak:rssPeak,limitations:['Linux Chrome for Testing; Windows Chrome 156 not executed here.','Summed process RSS includes shared pages and browser overhead; it is not extension heap size.','Original repeated synthetic H.264/AAC corpus, not a diverse codec corpus.','Direct download only. Does not validate multi-GB segmented remux or transcoding.']},null,2)+'\n');
  } finally {await context.close();}
});
