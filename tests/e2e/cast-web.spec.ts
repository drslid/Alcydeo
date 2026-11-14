import{test,expect,chromium,type Page}from'@playwright/test';
import{readFile,mkdir}from'node:fs/promises';
import{resolve}from'node:path';
const catalogs=JSON.parse(await readFile('packages/i18n/catalogs.json','utf8')),originalVideo=await readFile('fixtures/media/low.mp4');
const out=resolve(process.env.ALCYDEO_CAST_EVIDENCE_DIR??'.local/player65/evidence');
const sdk='https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
// This is a controlled CAF contract double. A session and a resolved LOAD do
// not imply that any receiver has started playback. Media events are explicit.
const simulatedSdk=`(()=>{
 const state=window.__cast={requests:0,loads:[],activation:[],controls:[],options:null,mediaObjects:[]};const handlers={},sessionHandlers={};let active,player,controller,remote;
 const session={getCastDevice:()=>({friendlyName:'Simulated receiver'}),getMediaSession:()=>window.__castGetterIndex!==undefined?state.mediaObjects[window.__castGetterIndex]:player?.isMediaLoaded?remote:undefined,addEventListener:(type,callback)=>{sessionHandlers[type]=callback;},removeEventListener:(type,callback)=>{if(sessionHandlers[type]===callback)delete sessionHandlers[type];},
  loadMedia:request=>{state.loads.push(request);if(window.__castKeepPreviousMedia)return new Promise(resolve=>{window.__castResolveLoad=resolve;});state.idleReason=undefined;player.isMediaLoaded=false;player.playerState='BUFFERING';const listeners=new Set();remote={media:null,mediaSessionId:state.loads.length,playerState:'BUFFERING',addUpdateListener:listener=>listeners.add(listener),removeUpdateListener:listener=>listeners.delete(listener),notify:alive=>{for(const listener of listeners)listener(alive);}};state.mediaObjects.push(remote);sessionHandlers.media?.({mediaSession:remote});if(window.__castFail)return Promise.reject(window.__castFail===true?'LOAD_FAILED':window.__castFail);if(window.__castPending)return new Promise(resolve=>{window.__castResolveLoad=resolve;});return Promise.resolve();},
  endSession:stop=>{state.controls.push({type:'stop',stop});active=undefined;player.isMediaLoaded=false;player.playerState='IDLE';handlers.session?.({sessionState:'ended'});}};
 const ctx={setOptions:options=>{state.options=options;},getCurrentSession:()=>active,addEventListener:(event,callback)=>{handlers[event]=callback;},requestSession:()=>{state.requests++;state.activation.push(navigator.userActivation.isActive);if(window.__castSelectError){const error=window.__castSelectError;handlers.session?.({sessionState:'failed',errorCode:typeof error==='string'?error:error.code});return Promise.reject(error);}active=session;handlers.session?.({sessionState:'started'});return Promise.resolve();}};
 window.chrome=window.chrome||{};window.chrome.cast={isAvailable:true,AutoJoinPolicy:{PAGE_SCOPED:'page'},media:{DEFAULT_MEDIA_RECEIVER_APP_ID:'CC1AD845',StreamType:{LIVE:'LIVE',BUFFERED:'BUFFERED'},MediaInfo:class{constructor(contentId,contentType){this.contentId=contentId;this.contentType=contentType;}},GenericMediaMetadata:class{},LoadRequest:class{constructor(media){this.media=media;}}}};
 class RemotePlayer{constructor(){player=this;Object.assign(this,{isPaused:false,isMediaLoaded:false,playerState:'IDLE',currentTime:0,duration:120,volumeLevel:0.5});}}
 class RemotePlayerController{constructor(value){controller=this;this.player=value;}addEventListener(event,callback){this.callback=callback;}notify(){this.callback?.();}playOrPause(){this.player.isPaused=!this.player.isPaused;this.player.playerState=this.player.isPaused?'PAUSED':'PLAYING';if(remote)remote.playerState=this.player.playerState;state.controls.push({type:'pause',paused:this.player.isPaused});this.notify();}seek(){state.controls.push({type:'seek',time:this.player.currentTime});this.notify();}setVolumeLevel(){state.controls.push({type:'volume',level:this.player.volumeLevel});this.notify();}}
 window.cast={framework:{CastContext:{getInstance:()=>ctx},CastContextEventType:{SESSION_STATE_CHANGED:'session'},SessionEventType:{MEDIA_SESSION:'media'},SessionState:{SESSION_STARTED:'started',SESSION_START_FAILED:'failed'},RemotePlayer,RemotePlayerController,RemotePlayerEventType:{ANY_CHANGE:'change'}}};
 window.__castSetMedia=changes=>{if('idleReason'in changes)state.idleReason=changes.idleReason;Object.assign(player,changes);if(remote){remote.playerState=player.playerState;remote.idleReason=state.idleReason;if(player.isMediaLoaded)remote.media={};remote.notify(player.isMediaLoaded);}controller.notify();};window.__castOldMedia=(index,changes)=>{const old=state.mediaObjects[index];Object.assign(old,changes);old.notify(false);};window.__castNotify=()=>controller.notify();window.__castOldSessionMedia=(index,clone=false)=>{const old=state.mediaObjects[index];sessionHandlers.media?.({mediaSession:clone?{...old}:old});};window.__onGCastApiAvailable(true);
})();`;
type SenderPayload={version:number;locale:string;media:{url:string;title:string;mime:string;live?:unknown};sourcePage?:unknown;downloadSource?:unknown};
const payload=(locale='fr',mime='video/mp4',url='https://cdn.example.test/video.mp4?signature=keep%2Bvalue'):SenderPayload=>({version:1,locale,media:{url,title:'Authorized video <img src=x onerror=alert(1)>',mime}});
const sender=(value:unknown)=>'http://localhost:4180/alcydeo/cast/#'+encodeURIComponent(JSON.stringify(value));
async function launch(javaScriptEnabled=true){const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}),page=await browser.newPage({javaScriptEnabled,viewport:{width:1280,height:950}});return{browser,page};}
async function prepare(page:Page,value=payload('en')){
 let sdkFragment='not-checked';const serverQueries:string[]=[];
 if(page.url()!=='about:blank')await page.goto('about:blank');
 page.on('request',request=>{if(new URL(request.url()).hostname==='localhost')serverQueries.push(new URL(request.url()).search);});
 await page.route('https://cdn.example.test/**',route=>{const range=route.request().headers().range?.match(/^bytes=(\d+)-(\d*)$/),start=range?Number(range[1]):0,end=range&&range[2]?Math.min(Number(range[2]),originalVideo.length-1):originalVideo.length-1,body=originalVideo.subarray(start,end+1);return route.fulfill({status:range?206:200,contentType:'video/mp4',headers:{'accept-ranges':'bytes','content-length':String(body.length),...(range?{'content-range':`bytes ${start}-${end}/${originalVideo.length}`}:{})},body});});
 await page.route(sdk,async route=>{sdkFragment=await page.evaluate(()=>location.hash);await route.fulfill({contentType:'application/javascript',body:simulatedSdk});});
 await page.goto(sender(value));await expect(page.locator('#choose')).toBeEnabled();return{sdkFragment,serverQueries};
}
async function mediaEvent(page:Page,value:Record<string,unknown>){await page.evaluate(value=>(window as any).__castSetMedia(value),value);}
async function keyboardFocus(page:Page,selector:string){
 const control=page.locator(selector);for(let count=0;count<32&&!await control.evaluate(element=>element===document.activeElement);count++)await page.keyboard.press('Tab');await expect(control).toBeFocused();expect(await control.evaluate(element=>{const style=getComputedStyle(element);return element.matches(':focus-visible')&&((style.outlineStyle!=='none'&&parseFloat(style.outlineWidth)>0)||style.boxShadow!=='none');})).toBe(true);
}

test('casting an ended local preview starts the new receiver LOAD at zero',async()=>{
 const{browser,page}=await launch();try{
  await prepare(page);const video=page.locator('#player');await expect.poll(()=>video.evaluate((video:HTMLVideoElement)=>Number.isFinite(video.duration)&&video.duration>0)).toBe(true);
  await video.click();await video.evaluate(async(video:HTMLVideoElement)=>{video.pause();video.muted=true;await new Promise<void>(resolve=>{video.addEventListener('seeked',()=>resolve(),{once:true});video.currentTime=Math.max(0,video.duration-0.5);});await video.play();});await expect.poll(()=>video.evaluate((video:HTMLVideoElement)=>video.ended)).toBe(true);expect(await video.evaluate((video:HTMLVideoElement)=>video.currentTime)).toBeGreaterThan(0);
  await page.locator('#choose').click();await expect.poll(()=>page.evaluate(()=>(window as any).__cast.loads.length)).toBe(1);expect(await page.evaluate(()=>(window as any).__cast.loads[0].currentTime)).toBe(0);
 }finally{await browser.close();}
});

test('integrated local controls play, pause, seek, change volume and toggle fullscreen by keyboard',async()=>{
 const{browser,page}=await launch();try{
  await prepare(page);const video=page.locator('#player'),c=catalogs.en;await expect.poll(()=>video.evaluate((video:HTMLVideoElement)=>video.readyState>=1)).toBe(true);await expect(video).not.toHaveAttribute('controls','');await expect(page.locator('#pause')).toHaveAccessibleName(c.tvWebPlay);await expect(page.locator('#load')).toBeHidden();await expect(page.locator('#disconnect')).toBeHidden();
  await keyboardFocus(page,'#pause');await page.keyboard.press('Space');await expect.poll(()=>video.evaluate((video:HTMLVideoElement)=>!video.paused&&video.currentTime>0.1)).toBe(true);await expect(page.locator('#pause')).toHaveAccessibleName(c.pause);await page.keyboard.press('Space');await expect.poll(()=>video.evaluate((video:HTMLVideoElement)=>video.paused)).toBe(true);
  await keyboardFocus(page,'#seek');await page.keyboard.press('Home');for(let count=0;count<10;count++)await page.keyboard.press('ArrowRight');await expect.poll(()=>video.evaluate((video:HTMLVideoElement)=>video.currentTime)).toBeCloseTo(1,1);await expect(page.locator('#time')).toHaveText('0:01 / 0:06');
  await keyboardFocus(page,'#volume');await page.keyboard.press('Home');await expect.poll(()=>video.evaluate((video:HTMLVideoElement)=>video.volume)).toBe(0);await page.keyboard.press('ArrowRight');await expect.poll(()=>video.evaluate((video:HTMLVideoElement)=>video.volume)).toBeGreaterThan(0);await page.keyboard.press('End');await expect.poll(()=>video.evaluate((video:HTMLVideoElement)=>video.volume)).toBe(1);
  await keyboardFocus(page,'#fullscreen');await expect(page.locator('#fullscreen')).toHaveAccessibleName(c.tvWebFullscreen);await page.keyboard.press('Enter');await expect.poll(()=>page.evaluate(()=>document.fullscreenElement?.classList.contains('player-shell')??false)).toBe(true);await expect(page.locator('#fullscreen')).toHaveAccessibleName(c.tvWebExitFullscreen);await page.keyboard.press('Enter');await expect.poll(()=>page.evaluate(()=>document.fullscreenElement===null)).toBe(true);await expect(page.locator('#fullscreen')).toHaveAccessibleName(c.tvWebFullscreen);
  expect(await page.evaluate(()=>({requests:(window as any).__cast.requests,loads:(window as any).__cast.loads,controls:(window as any).__cast.controls}))).toEqual({requests:0,loads:[],controls:[]});
 }finally{await browser.close();}
});

test('the player keeps native controls when JavaScript is unavailable',async()=>{
 const{browser,page}=await launch(false);try{await page.goto(sender(payload('en')));await expect(page.locator('#player')).toHaveAttribute('controls','');await expect(page.locator('#player')).toHaveAttribute('playsinline','');await expect(page.locator('#player-controls')).toBeHidden();}finally{await browser.close();}
});

for(const locale of Object.keys(catalogs))test(`web player and simulated CAF contract are localized in ${locale}`,async()=>{
 const{browser,page}=await launch(),c=catalogs[locale];try{
  const value=payload(locale),{sdkFragment,serverQueries}=await prepare(page,value);
  expect(sdkFragment).toBe('');expect(new URL(page.url()).hash).toBe('');expect(serverQueries.every(value=>value==='')).toBe(true);
  await expect(page.locator('#media-title img')).toHaveCount(0);await expect(page.locator('#media-title')).toHaveText(value.media.title);
  const video=page.locator('#player');await expect.poll(()=>video.evaluate((video:HTMLVideoElement)=>video.readyState>=1)).toBe(true);await expect(video).not.toHaveAttribute('controls','');await expect(video).toHaveAttribute('playsinline','');await expect(page.locator('.player-shell #player-controls')).toBeVisible();await expect(page.locator('#remote-controls')).toHaveCount(0);
  await expect(page.locator('#pause')).toHaveAccessibleName(c.tvWebPlay);await expect(page.locator('#choose')).toHaveAccessibleName(c.tvWebOpen);await expect(page.locator('#seek')).toHaveAccessibleName(c.tvWebPlayerSeek);await expect(page.locator('#volume')).toHaveAccessibleName(c.tvWebPlayerVolume);await expect(page.locator('#fullscreen')).toHaveAccessibleName(c.tvWebFullscreen);await expect(page.locator('#load')).toBeHidden();await expect(page.locator('#disconnect')).toBeHidden();
  await page.evaluate(()=>document.fonts.ready);if(['ar','ur','hi'].includes(locale)){const family=locale==='hi'?'AlcydeoDevanagari':'AlcydeoArabic',sample=locale==='hi'?'हिन्दी':'العربية اردو';expect(await page.evaluate(async({family,sample})=>{const loaded=await document.fonts.load(`16px "${family}"`,sample);await document.fonts.ready;return loaded.length>0&&loaded.every(face=>face.status==='loaded')&&document.fonts.check(`16px "${family}"`,sample)&&getComputedStyle(document.body).fontFamily.includes(family);},{family,sample})).toBe(true);}
  for(const colorScheme of['light','dark']as const)for(const width of[1280,390]){
   await page.emulateMedia({colorScheme});await page.setViewportSize({width,height:950});await expect(page.locator('html')).toHaveAttribute('dir',['ar','ur'].includes(locale)?'rtl':'ltr');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('#player-controls').evaluate(element=>{const rect=element.getBoundingClientRect();return element.scrollWidth<=element.clientWidth+1&&rect.left>=0&&rect.right<=innerWidth+1;})).toBe(true);
   for(const selector of['#pause','#seek','#volume','#fullscreen','#choose']){await expect(page.locator(`#player-controls ${selector}`)).toBeVisible();await keyboardFocus(page,selector);}
   const castBox=await page.locator('#choose').boundingBox();expect(castBox!.width).toBeGreaterThanOrEqual(44);expect(castBox!.height).toBeGreaterThanOrEqual(44);
   if(['fr','ur'].includes(locale)){await mkdir(out,{recursive:true});await page.screenshot({path:resolve(out,`${locale}-${colorScheme}-${width===390?'narrow':'desktop'}.png`),fullPage:true,animations:'disabled'});}
  }
  await page.locator('#pause').click();await expect.poll(()=>video.evaluate((video:HTMLVideoElement)=>video.currentTime)).toBeGreaterThan(0.1);
  expect(await page.evaluate(()=>({requests:(window as any).__cast.requests,loads:(window as any).__cast.loads}))).toEqual({requests:0,loads:[]});
  await page.locator('#choose').click();await expect.poll(()=>page.evaluate(()=>(window as any).__cast.loads.length)).toBe(1);
  const info=await page.evaluate(()=>(window as any).__cast);expect(info.activation).toEqual([true]);expect(info.options).toEqual({receiverApplicationId:'CC1AD845',autoJoinPolicy:'page',resumeSavedSession:false});expect(info.loads[0].media.contentId).toBe(value.media.url);expect(info.loads[0].media.contentType).toBe(value.media.mime);expect(info.loads[0].media.metadata.title).toBe(value.media.title);
  await expect(page.locator('#status')).toHaveText(c.tvCast_loading);await expect(page.locator('#pause')).toBeDisabled();await expect(page.locator('#receiver')).toBeVisible();await expect(page.locator('#load')).toBeHidden();await expect(page.locator('#disconnect')).toBeVisible();await expect(page.locator('#status')).not.toHaveText(c.tvCast_playing);
  await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING',currentTime:10});await expect(page.locator('#status')).toHaveText(c.tvCast_playing);await page.locator('#pause').click();await expect(page.locator('#status')).toHaveText(c.tvCast_paused);await expect(page.locator('#pause')).toHaveAccessibleName(c.tvWebPlay);
  await page.locator('#disconnect').click();await expect(page.locator('#status')).toHaveText(c.tvDisconnected);await expect(page.locator('#receiver')).toBeHidden();await expect(page.locator('#disconnect')).toBeHidden();await expect(page.locator('#load')).toBeHidden();
 }finally{await browser.close();}
});

test('web remote controls send seek, volume, pause and stop only to the current simulated session',async()=>{
 const{browser,page}=await launch();try{
  await prepare(page);await expect(page.locator('#player-controls')).toBeVisible();await expect(page.locator('#remote-controls')).toHaveCount(0);await page.locator('#choose').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING',currentTime:12,duration:120});
  await expect(page.locator('#player-controls')).toBeVisible();await page.locator('#seek').press('End');await page.locator('#volume').press('Home');await page.locator('#pause').click();
  expect(await page.evaluate(()=>(window as any).__cast.controls)).toEqual([{type:'seek',time:120},{type:'volume',level:0},{type:'pause',paused:true}]);await expect(page.locator('#time')).toHaveText('2:00 / 2:00');
  await page.locator('#disconnect').click();expect(await page.evaluate(()=>(window as any).__cast.controls.at(-1))).toEqual({type:'stop',stop:true});await expect(page.locator('#player-controls')).toBeVisible();await expect(page.locator('#pause')).toBeEnabled();await expect(page.locator('#disconnect')).toBeHidden();await page.locator('#volume').press('End');expect(await page.evaluate(()=>(window as any).__cast.controls)).toEqual([{type:'seek',time:120},{type:'volume',level:0},{type:'pause',paused:true},{type:'stop',stop:true}]);
 }finally{await browser.close();}
});

for(const[mime,url]of[['application/vnd.apple.mpegurl','https://cdn.example.test/master.m3u8'],['application/dash+xml','https://cdn.example.test/manifest.mpd']])test(`web sender retains the complete ${mime} source and MIME in LOAD`,async()=>{
 const{browser,page}=await launch();try{await prepare(page,payload('en',mime,url));await page.locator('#choose').click();await expect.poll(()=>page.evaluate(()=>(window as any).__cast.loads.length)).toBe(1);expect(await page.evaluate(()=>(window as any).__cast.loads[0].media)).toMatchObject({contentId:url,contentType:mime});}finally{await browser.close();}
});

test('web LOAD refusal and SDK failure stay visible without simulated playback',async()=>{
 const{browser,page}=await launch();try{
  const secretUrl='https://cdn.example.test/private.mp4?token=do-not-copy-this-token',secretTitle='Private diagnostic title do not copy';
  const value={...payload('en'),media:{url:secretUrl,title:secretTitle,mime:'video/mp4'}};await prepare(page,value);
  await page.evaluate(({secretUrl,secretTitle})=>{(window as any).__castFail={code:'load_media_failed',description:JSON.stringify({reason:'LOAD_FAILED',detailedErrorCode:905,url:secretUrl,title:secretTitle,token:'do-not-copy-this-token',message:'Private provider message'})};
   // Observe the copy boundary without changing the operating-system clipboard.
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value:string)=>{(window as any).__castDiagnosticCopy=value;}}});
  },{secretUrl,secretTitle});
  await page.locator('#choose').click();await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebLoadError);await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING'});await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebLoadError);await expect(page.locator('#status')).not.toHaveText(catalogs.en.tvCast_playing);
  await page.locator('#diagnostic summary').click();const text=await page.locator('#diagnostic-report').innerText(),report=JSON.parse(text);
  expect(report).toMatchObject({error:'tvWebLoadError',sdkCode:'load_media_failed',reason:'LOAD_FAILED',detailedErrorCode:905,mediaType:'video/mp4',sourceHasQuery:true,routeConnected:true,loadAcknowledged:false});
  expect(report.build).toMatch(/^\d+\.\d+\.\d+$/);
  for(const secret of[secretUrl,secretTitle,'do-not-copy-this-token','cdn.example.test','Private provider message'])expect(text).not.toContain(secret);
  expect(await page.evaluate(()=>(window as any).__castDiagnosticCopy)).toBeUndefined();await page.locator('#copy-diagnostic').click();await expect(page.locator('#diagnostic-copy-status')).toHaveText(catalogs.en.detectionDiagnosticsCopied);expect(await page.evaluate(()=>(window as any).__castDiagnosticCopy)).toBe(text);
  const arbitraryMime='video/arbitrary-private-subtype';await prepare(page,{...value,media:{...value.media,mime:arbitraryMime}});await page.evaluate(()=>{(window as any).__castFail={code:'load_media_failed'};document.querySelector('main')!.dataset.version='private-build-token';});await page.locator('#choose').click();await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebLoadError);const safeTypeReport=await page.locator('#diagnostic-report').textContent();expect(JSON.parse(safeTypeReport!).mediaType).toBe('other-video');expect(JSON.parse(safeTypeReport!).build).toBeUndefined();expect(safeTypeReport).not.toContain('private-build-token');expect(safeTypeReport).not.toContain('arbitrary-private-subtype');expect(await page.evaluate(()=>(window as any).__cast.loads[0].media.contentType)).toBe(arbitraryMime);
  await page.unroute(sdk);await page.route(sdk,route=>route.abort());await page.goto('about:blank');await page.goto(sender(value));await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebSdkError);await expect(page.locator('#choose')).toBeDisabled();
  const sdkReport=await page.locator('#diagnostic-report').textContent();expect(JSON.parse(sdkReport!)).toMatchObject({error:'tvWebSdkError',sourceHasQuery:true,routeConnected:false});for(const secret of[secretUrl,secretTitle,'do-not-copy-this-token'])expect(sdkReport).not.toContain(secret);
 }finally{await browser.close();}
});

test('web LOAD timeout rejects a late acknowledgement and media event without reloading automatically',async()=>{
 const{browser,page}=await launch();try{
  await page.clock.install();await prepare(page);await page.evaluate(()=>(window as any).__castPending=true);await page.locator('#choose').click();await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_loading);
  await page.clock.fastForward(20001);await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvCastTimeout);
  await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING'});await page.evaluate(()=>(window as any).__castResolveLoad());await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvCastTimeout);await expect(page.locator('#status')).not.toHaveText(catalogs.en.tvCast_playing);expect(await page.evaluate(()=>(window as any).__cast.loads.length)).toBe(1);await expect(page.locator('#load')).toBeEnabled();
 }finally{await browser.close();}
});

test('receiver IDLE with ERROR stays terminal until a fresh explicit LOAD',async()=>{
 const{browser,page}=await launch();try{
  await prepare(page);await page.locator('#choose').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING'});await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_playing);
  await mediaEvent(page,{playerState:'IDLE',idleReason:'ERROR'});await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebLoadError);await expect(page.locator('#status')).not.toHaveText(catalogs.en.tvCast_finished);
  expect(JSON.parse((await page.locator('#diagnostic-report').textContent())!)).toMatchObject({reason:'MEDIA_ERROR',idleReason:'ERROR',playerState:'IDLE'});
  await mediaEvent(page,{playerState:'PLAYING'});await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebLoadError);await expect(page.locator('#pause')).toBeDisabled();await expect(page.locator('#status')).not.toHaveText(catalogs.en.tvCast_playing);
  // The receiver may retain the failed status while the new request starts.
  await mediaEvent(page,{playerState:'IDLE',idleReason:'ERROR'});await page.locator('#load').click();await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_loading);
  await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING',idleReason:undefined});await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_playing);expect(await page.evaluate(()=>(window as any).__cast.loads.length)).toBe(2);
 }finally{await browser.close();}
});

test('a strict live handoff uses LIVE and keeps seeking disabled even with a finite receiver window',async()=>{
 const{browser,page}=await launch();try{
  const value=payload('en','application/vnd.apple.mpegurl','https://cdn.example.test/live.m3u8');await prepare(page,{...value,media:{...value.media,live:true}});
  // HLS preview is unavailable in this Chrome fixture. Use a real finite MP4
  // preview to exercise its nonzero position; the Cast source stays the HLS URL.
  await page.locator('#player').evaluate((video:HTMLVideoElement)=>{video.src='https://cdn.example.test/preview.mp4';video.load();});await page.waitForFunction(()=>(document.getElementById('player')as HTMLVideoElement).readyState>=1);await page.evaluate(()=>{(document.getElementById('player')as HTMLVideoElement).currentTime=2;});await page.locator('#choose').click();await expect.poll(()=>page.evaluate(()=>(window as any).__cast.loads.length)).toBe(1);expect(await page.evaluate(()=>(window as any).__cast.loads[0].media.streamType)).toBe('LIVE');expect(await page.evaluate(()=>(window as any).__cast.loads[0].media.contentId)).toBe(value.media.url);expect(await page.evaluate(()=>(window as any).__cast.loads[0].currentTime)).toBeUndefined();
  await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING',duration:120});await expect(page.locator('#seek')).toBeDisabled();
  await prepare(page,{...value,media:{...value.media,live:'true'}});await page.locator('#choose').click();await expect.poll(()=>page.evaluate(()=>(window as any).__cast.loads.length)).toBe(1);expect(await page.evaluate(()=>(window as any).__cast.loads[0].media.streamType)).toBe('BUFFERED');
 }finally{await browser.close();}
});

test('a buffering episode after playback has one20s deadline and cannot resurrect after timeout',async()=>{
 const{browser,page}=await launch();try{
  await page.clock.install();await prepare(page);await page.locator('#choose').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING'});await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_playing);
  await mediaEvent(page,{playerState:'BUFFERING'});await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_loading);
  await page.clock.fastForward(10000);await mediaEvent(page,{playerState:'BUFFERING'});await page.clock.fastForward(10001);await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvCastTimeout);
  await mediaEvent(page,{playerState:'PLAYING'});await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvCastTimeout);await expect(page.locator('#status')).not.toHaveText(catalogs.en.tvCast_playing);expect(await page.evaluate(()=>(window as any).__cast.loads.length)).toBe(1);
 }finally{await browser.close();}
});

test('selection cancellation preserves an existing terminal media error and diagnostic',async()=>{
 const{browser,page}=await launch();try{
  await prepare(page);await page.locator('#choose').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING'});await mediaEvent(page,{playerState:'IDLE',idleReason:'ERROR'});await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebLoadError);
  const diagnostic=await page.locator('#diagnostic-report').textContent();await page.evaluate(()=>(window as any).__castSelectError='cancel');await page.locator('#choose').click();
  await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebLoadError);await expect(page.locator('#diagnostic-report')).toHaveText(diagnostic!);expect(await page.evaluate(()=>(window as any).__cast.loads.length)).toBe(1);expect(await page.evaluate(()=>(window as any).__cast.controls)).toEqual([]);
 }finally{await browser.close();}
});

test('selection cancellation preserves playback and an existing buffering deadline',async()=>{
 const{browser,page}=await launch();try{
  await page.clock.install();await prepare(page);await page.locator('#choose').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING'});await page.evaluate(()=>(window as any).__castSelectError={code:'cancel'});await page.locator('#choose').click();
  await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_playing);await expect(page.getByRole('alert')).toHaveCount(0);
  await mediaEvent(page,{playerState:'BUFFERING'});await page.clock.fastForward(5000);await page.locator('#choose').click();await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_loading);
  await page.clock.fastForward(15001);await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvCastTimeout);expect(await page.evaluate(()=>(window as any).__cast.loads.length)).toBe(1);
 }finally{await browser.close();}
});

test('a cancelled selection without a route is neutral while a channel failure remains visible',async()=>{
 const{browser,page}=await launch();try{
  await prepare(page);await page.evaluate(()=>(window as any).__castSelectError='cancel');await page.locator('#choose').click();await expect(page.locator('#status')).toHaveText(catalogs.en.tvDisconnected);await expect(page.getByRole('alert')).toHaveCount(0);expect(await page.evaluate(()=>(window as any).__cast.loads)).toEqual([]);
  await page.evaluate(()=>(window as any).__castSelectError={code:'channel_error'});await page.locator('#choose').click();await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvNoConnection);expect(JSON.parse((await page.locator('#diagnostic-report').textContent())!)).toMatchObject({sdkCode:'channel_error',routeConnected:false});
 }finally{await browser.close();}
});

test('an unloaded media object retains only an observed idle error and ignores an abandoned object',async()=>{
 const{browser,page}=await launch();try{
  await prepare(page);await page.locator('#choose').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING'});await mediaEvent(page,{isMediaLoaded:false,playerState:'IDLE',idleReason:'ERROR'});
  expect(await page.evaluate(()=>(window as any).cast.framework.CastContext.getInstance().getCurrentSession().getMediaSession())).toBeUndefined();await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebLoadError);expect(JSON.parse((await page.locator('#diagnostic-report').textContent())!)).toMatchObject({idleReason:'ERROR',mediaLoaded:false});
  await page.locator('#load').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING'});await page.evaluate(()=>(window as any).__castOldMedia(0,{playerState:'IDLE',idleReason:'ERROR'}));await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_playing);
  await mediaEvent(page,{isMediaLoaded:false,playerState:'IDLE',idleReason:undefined});await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('#status')).not.toHaveText(catalogs.en.tvCast_finished);
 }finally{await browser.close();}
});

test('a safe optional source-page link is separate from receiver media and diagnostics',async()=>{
 const{browser,page}=await launch();try{
  const sourcePage='https://www.tiktok.com/@example/video/123';await prepare(page,{...payload('en'),sourcePage});await expect(page.locator('#source-page')).toBeVisible();await expect(page.locator('#source-page')).toHaveAttribute('href',sourcePage);await expect(page.locator('#source-page')).toHaveAttribute('target','_blank');await expect(page.locator('#source-page')).toHaveAttribute('rel',/noreferrer/);await expect(page.locator('#source-page')).toHaveAttribute('rel',/noopener/);
  await page.evaluate(()=>(window as any).__castFail={code:'load_media_failed'});await page.locator('#choose').click();await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebLoadError);expect(await page.evaluate(()=>JSON.stringify((window as any).__cast.loads))).not.toContain(sourcePage);expect(await page.locator('#diagnostic-report').textContent()).not.toContain(sourcePage);
 }finally{await browser.close();}
});

test('the original-source notice accepts only a strict downloadSource flag and stays out of LOAD and diagnostics',async()=>{
 const{browser,page}=await launch();try{
  for(const downloadSource of[true,false,'true',undefined]){
   await prepare(page,{...payload('en'),downloadSource});if(downloadSource===true)await expect(page.locator('#source-kind')).toHaveText(catalogs.en.tvWebUsingOriginal);else await expect(page.locator('#source-kind')).toBeHidden();
   await page.evaluate(()=>(window as any).__castFail={code:'load_media_failed'});await page.locator('#choose').click();await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebLoadError);const load=await page.evaluate(()=>JSON.stringify((window as any).__cast.loads)),diagnostic=await page.locator('#diagnostic-report').textContent();for(const text of[load,diagnostic!]){expect(text).not.toContain('downloadSource');expect(text).not.toContain(catalogs.en.tvWebUsingOriginal);}
  }
 }finally{await browser.close();}
});

test('receiver completion offers an explicit play action without sending another LOAD automatically',async()=>{
 const{browser,page}=await launch();try{
  await prepare(page);await page.locator('#choose').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING'});await expect(page.locator('#load')).toBeHidden();await mediaEvent(page,{isMediaLoaded:false,playerState:'IDLE',idleReason:'FINISHED'});await expect(page.locator('#pause')).toBeEnabled();await expect(page.locator('#pause')).toHaveAccessibleName(catalogs.en.tvWebPlay);await expect(page.getByRole('alert')).toHaveCount(0);expect(await page.evaluate(()=>(window as any).__cast.loads.length)).toBe(1);
  await page.locator('#pause').click();await expect(page.locator('#load')).toBeHidden();await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_loading);expect(await page.evaluate(()=>(window as any).__cast.loads.length)).toBe(2);expect(await page.evaluate(()=>(window as any).__cast.loads[1].currentTime)).toBe(0);
 }finally{await browser.close();}
});

test('unsafe or secret-bearing source-page inputs never become links',async()=>{
 const{browser,page}=await launch();try{
  for(const sourcePage of[undefined,'file:///C:/private.mp4','javascript:alert(1)','https://user:secret@example.test/page','https://example.test/page?token=private','https://example.test/page#secret','https://example.test/'+ 'x'.repeat(2048)]){await prepare(page,{...payload('en'),sourcePage});await expect(page.locator('#source-page')).toBeHidden();expect(await page.locator('#source-page').getAttribute('href')).toBeNull();}
 }finally{await browser.close();}
});


test('a retry ignores an earlier media object and session ID while its LOAD is pending or acknowledged',async()=>{
 const{browser,page}=await launch();try{
  await page.clock.install();await prepare(page);await page.locator('#choose').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING'});await mediaEvent(page,{playerState:'IDLE',idleReason:'ERROR'});await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebLoadError);
  // CAF can retain the old getter and RemotePlayer values while sending LOAD.
  // These are old observations, including a later event with the same ID.
  await page.evaluate(()=>(window as any).__castKeepPreviousMedia=true);await page.locator('#load').click();await page.evaluate(()=>(window as any).__castNotify());await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_loading);
  for(const clone of[false,true]){await page.evaluate(clone=>(window as any).__castOldSessionMedia(0,clone),clone);await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_loading);}
  await page.evaluate(()=>(window as any).__castResolveLoad());await mediaEvent(page,{playerState:'PLAYING',idleReason:undefined});await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_loading);await expect(page.locator('#pause')).toBeDisabled();
  await page.clock.fastForward(20001);await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvCastTimeout);expect(await page.evaluate(()=>(window as any).__cast.loads.length)).toBe(2);expect(JSON.parse((await page.locator('#diagnostic-report').textContent())!).idleReason).toBeUndefined();
  await page.evaluate(()=>(window as any).__castKeepPreviousMedia=false);await page.locator('#load').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING',idleReason:undefined});await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_playing);
  for(const clone of[false,true]){await page.evaluate(clone=>(window as any).__castOldSessionMedia(0,clone),clone);await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_playing);}expect(await page.evaluate(()=>(window as any).__cast.loads.length)).toBe(3);
 }finally{await browser.close();}
});


test('a retry retires both an older getter and the latest observed media identity',async()=>{
 const{browser,page}=await launch();try{
  await page.clock.install();await prepare(page);await page.locator('#choose').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING'});await mediaEvent(page,{playerState:'IDLE',idleReason:'ERROR'});
  // Getter A lags behind the fresh MEDIA_SESSION B throughout the second LOAD.
  await page.evaluate(()=>(window as any).__castGetterIndex=0);await page.locator('#load').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING',idleReason:undefined});await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_playing);await mediaEvent(page,{playerState:'IDLE',idleReason:'ERROR'});await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvWebLoadError);
  await page.evaluate(()=>(window as any).__castKeepPreviousMedia=true);await page.locator('#load').click();await page.evaluate(()=>(window as any).__castNotify());await expect(page.getByRole('alert')).toHaveCount(0);
  for(const index of[0,1])for(const clone of[false,true]){await page.evaluate(({index,clone})=>(window as any).__castOldSessionMedia(index,clone),{index,clone});await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_loading);}
  await page.evaluate(()=>(window as any).__castResolveLoad());await mediaEvent(page,{playerState:'PLAYING',idleReason:undefined});await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_loading);await expect(page.locator('#pause')).toBeDisabled();await page.clock.fastForward(20001);await expect(page.getByRole('alert')).toHaveText(catalogs.en.tvCastTimeout);expect(await page.evaluate(()=>(window as any).__cast.loads.length)).toBe(3);
  await page.evaluate(()=>(window as any).__castKeepPreviousMedia=false);await page.locator('#load').click();await mediaEvent(page,{isMediaLoaded:true,playerState:'PLAYING',idleReason:undefined});await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_playing);await page.evaluate(()=>(window as any).__castOldSessionMedia(1,true));await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('#status')).toHaveText(catalogs.en.tvCast_playing);
 }finally{await browser.close();}
});
