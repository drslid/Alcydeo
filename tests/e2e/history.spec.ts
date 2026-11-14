import {test,expect,chromium,type BrowserContext,type Page} from '@playwright/test';
import {resolve} from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {historyTask,seedHistory} from './history-fixture';

let context:BrowserContext,ui:Page,base:string;
test.beforeEach(async()=>{
  const extension=resolve('apps/extension/.output/chrome-mv3');
  context=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_PATH,channel:process.env.CHROMIUM_PATH?undefined:'chromium',headless:true,acceptDownloads:true,args:[`--load-extension=${extension}`,`--disable-extensions-except=${extension}`,'--no-sandbox','--test-type']});
  const sw=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');base=`chrome-extension://${new URL(sw.url()).host}`;
  ui=await context.newPage();await ui.goto(`${base}/manager.html`);await expect(ui.getByRole('heading',{name:'Library',exact:true})).toBeVisible();
});
test.afterEach(async()=>context?.close());
const snapshot=()=>ui.evaluate(async()=>(await chrome.runtime.sendMessage({type:'snapshot'})).data.tasks);

test('pagination reaches records beyond 100, filters first and clamps after deleting the last page',async()=>{
  const now=Date.now();const entries=Array.from({length:105},(_,i)=>historyTask(`History ${String(i+1).padStart(4,'0')}`,{createdAt:now-i,favorite:i%10===0}));
  await seedHistory(ui,entries);await ui.reload();
  const pagination=ui.getByRole('navigation',{name:'Download list pages'});
  await expect(ui.locator('.task-card')).toHaveCount(20);await expect(pagination.getByRole('status')).toHaveText('Page 1 of 6');await expect(pagination.getByRole('button',{name:'Previous',exact:true})).toBeDisabled();
  for(let i=0;i<5;i++)await pagination.getByRole('button',{name:'Next',exact:true}).click();
  await expect(pagination.getByRole('status')).toHaveText('Page 6 of 6');await expect(ui.locator('.task-card')).toHaveCount(5);await expect(ui.getByRole('heading',{name:'History 0105',exact:true})).toBeVisible();await expect(pagination.getByRole('button',{name:'Next',exact:true})).toBeDisabled();
  await ui.getByRole('textbox',{name:'Search titles and tags'}).fill('History 0105');await expect(ui.locator('.task-card')).toHaveCount(1);await expect(pagination).toHaveCount(0);
  await ui.getByRole('textbox',{name:'Search titles and tags'}).fill('');await expect(pagination.getByRole('status')).toHaveText('Page 1 of 6');
  await ui.locator('.toolbar').getByRole('button',{name:'Favorite',exact:true}).click();await expect(ui.locator('.task-card')).toHaveCount(11);await expect(pagination).toHaveCount(0);
  await ui.locator('.toolbar').getByRole('button',{name:'Favorite',exact:true}).click();await ui.getByRole('button',{name:'Library',exact:true}).click();await expect(pagination.getByRole('status')).toHaveText('Page 1 of 6');
  for(let i=0;i<5;i++)await pagination.getByRole('button',{name:'Next',exact:true}).click();
  for(let i=0;i<5;i++)await ui.locator('.task-card').last().getByRole('button',{name:'Remove record and temporary files',exact:true}).click();
  await expect(pagination.getByRole('status')).toHaveText('Page 5 of 5');await expect(ui.locator('.task-card')).toHaveCount(20);
  await mkdir('artifacts/evidence/history',{recursive:true});await ui.screenshot({path:'artifacts/evidence/history/pagination.png',animations:'disabled',fullPage:true});
});

test('confirmed bulk clear removes all captured history, retains saved files, live leases and resumed/new tasks',async()=>{
  const now=Date.now();const entries=Array.from({length:105},(_,i)=>historyTask(`History ${String(i+1).padStart(4,'0')}`,{createdAt:now-i,favorite:true}));
  const failed=historyTask('Failed history',{state:'failed',saved:false}),cancelled=historyTask('Cancelled history',{state:'cancelled',saved:false});
  const protectedEntries=[historyTask('Queued task',{state:'queued',saved:false}),historyTask('Paused task',{state:'paused',saved:false}),historyTask('Unfinished validation',{state:'validating',saved:false}),historyTask('Leased completion',{owner:'another-manager',leaseUntil:now+120000}),historyTask('Fetching task',{state:'fetching',saved:false,owner:'another-manager',leaseUntil:now+120000})];
  const resumed=historyTask('Resumed during confirmation',{state:'failed',saved:false,variant:{id:'original',url:'http://127.0.0.1:4179/parts/source.mp4?case=history-resume&pace=200',label:'404p'}});
  const downloadId=await ui.evaluate(()=>chrome.downloads.download({url:'http://127.0.0.1:4179/media/high.mp4',filename:'Alcydeo/history-file-check.mp4',saveAs:false}));
  await expect.poll(()=>ui.evaluate(async id=>(await chrome.downloads.search({id}))[0]?.state,downloadId)).toBe('complete');
  const actual=historyTask('Actually saved file',{state:'validating',saved:true,downloadId});
  const temporaryIds=[entries[0]!.id,failed.id,actual.id,protectedEntries[1]!.id,protectedEntries[3]!.id,resumed.id];
  await seedHistory(ui,[...entries,failed,cancelled,...protectedEntries,resumed,actual],temporaryIds);await ui.reload();
  await ui.getByRole('button',{name:'Library',exact:true}).click();await ui.getByRole('textbox',{name:'Search titles and tags'}).fill('History 0105');await ui.locator('.toolbar').getByRole('button',{name:'Favorite',exact:true}).click();await expect(ui.locator('.task-card')).toHaveCount(1);
  const clear=ui.getByRole('button',{name:'Clear history',exact:true}),dialog=ui.getByRole('dialog',{name:'Clear all download history?'});
  await clear.click();await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();await ui.keyboard.press('Escape');await expect(dialog).toBeHidden();expect((await snapshot()).length).toBe(114);
  await clear.click();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(dialog).toBeHidden();expect((await snapshot()).length).toBe(114);
  await clear.click();await expect(dialog).toBeVisible();await mkdir('artifacts/evidence/history',{recursive:true});await ui.screenshot({path:'artifacts/evidence/history/confirm-light.png',animations:'disabled'});await ui.evaluate(()=>document.documentElement.dataset.theme='dark');await ui.screenshot({path:'artifacts/evidence/history/confirm-dark.png',animations:'disabled'});
  const response=await ui.evaluate(id=>chrome.runtime.sendMessage({type:'resume',id}),resumed.id);expect(response.ok).toBe(true);
  const resumedItem=(await snapshot()).find((task:any)=>task.id===resumed.id);expect(resumedItem.state).toBe('fetching');const received=await ui.evaluate(async id=>(await chrome.downloads.search({id}))[0].bytesReceived,resumedItem.downloadId);
  const late=historyTask('New record after confirmation');await seedHistory(ui,[late]);
  await dialog.getByRole('button',{name:'Clear all history',exact:true}).click();await expect(dialog).toBeHidden();await expect(ui.getByRole('status')).toHaveText('History cleared. Saved files were kept.');
  const retained=[...protectedEntries.map(t=>t.id),resumed.id,late.id].sort();await expect.poll(async()=>(await snapshot()).map((t:any)=>t.id).sort()).toEqual(retained);
  const directories=await ui.evaluate(async()=>{const names:string[]=[];for await(const name of (await navigator.storage.getDirectory() as any).keys())names.push(name);return names;});
  for(const id of [entries[0]!.id,failed.id,actual.id])expect(directories).not.toContain(id);
  for(const id of [protectedEntries[1]!.id,protectedEntries[3]!.id,resumed.id])expect(directories).toContain(id);
  const saved=await ui.evaluate(async id=>(await chrome.downloads.search({id}))[0],downloadId);expect(saved.state).toBe('complete');expect(saved.exists).toBe(true);expect(await readFile(saved.filename)).toEqual(await readFile('fixtures/media/high.mp4'));
  await expect.poll(()=>ui.evaluate(async id=>(await chrome.downloads.search({id}))[0].bytesReceived,resumedItem.downloadId)).toBeGreaterThan(received);
  const second=await context.newPage();await second.goto(`${base}/manager.html`);await expect(second.locator('.task-card')).toHaveCount(retained.length);
  const report={version:'0.1.15',syntheticHistoryRecords:114,retained:retained.length,originalFileUnchanged:true,chromeDownloadRecordRetained:true,temporaryRemoved:3,temporaryRetained:3,resumedDownloadContinues:true,newRecordAfterDialogRetained:true};await writeFile('docs/benchmarks/history-0.1.15.json',JSON.stringify(report,null,2)+'\n');
  await ui.evaluate(id=>chrome.runtime.sendMessage({type:'cancel',id}),resumed.id);
});
