/* Original Alcydeo web player. Google Cast SDK runs on this web page only. */
(()=>{
 const catalogs=JSON.parse(document.getElementById('cast-messages').textContent);let payload;
 try{if(location.hash.length>24000)throw new Error();payload=JSON.parse(decodeURIComponent(location.hash.slice(1)));}catch{payload=undefined;}
 // Erase the handoff before loading Google's SDK. No media URL reaches the
 // static page server, browser history query or persistent web storage.
 window.history.replaceState(null,'',location.pathname+location.search);
 const requested=String(payload?.locale??navigator.language).replace('-','_');
 const locale=requested.toLowerCase().startsWith('zh')?'zh_CN':requested.split('_')[0],c=catalogs[locale]??catalogs.en;
 document.documentElement.lang=locale.replace('_','-');document.documentElement.dir=['ar','ur'].includes(locale)?'rtl':'ltr';
 for(const node of document.querySelectorAll('[data-message]'))node.textContent=c[node.dataset.message]??'';
 const el=id=>document.getElementById(id),video=el('player');
 const status=key=>{el('status').textContent=c[key]??key;};
 const fail=(key,error)=>{el('error').hidden=false;el('error').textContent=c[key]??key;diagnostic(key,error);};
 const clear=()=>{el('error').hidden=true;el('error').textContent='';el('diagnostic').hidden=true;el('diagnostic-copy-status').textContent='';};
 function checked(value){const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.href.length>16384)throw new Error();return url.href;}
 function mime(value,url){const clean=typeof value==='string'?value.toLowerCase().split(';')[0].trim():'';if(/^(?:video\/[a-z\d.+-]+|application\/(?:vnd\.apple\.mpegurl|x-mpegurl|dash\+xml))$/.test(clean))return clean;const path=new URL(url).pathname.toLowerCase();return path.endsWith('.m3u8')?'application/vnd.apple.mpegurl':path.endsWith('.mpd')?'application/dash+xml':path.endsWith('.webm')?'video/webm':'video/mp4';}
 let media,sourcePage;
 try{if(payload?.version===1&&typeof payload.media?.url==='string'){const url=checked(payload.media.url);media={url,title:String(payload.media.title??'').slice(0,500),mime:mime(payload.media.mime,url),live:payload.media.live===true};}}catch{media=undefined;}
 try{if(payload?.version===1&&typeof payload.sourcePage==='string'&&payload.sourcePage.length<=2048){const url=new URL(payload.sourcePage);if(['http:','https:'].includes(url.protocol)&&!url.username&&!url.password&&!/[?#]/.test(url.href)&&url.href.length<=2048)sourcePage=url.href;}}catch{/* The optional return link never repairs an invalid URL. */}
 const fromDownload=payload?.version===1&&payload.downloadSource===true;payload=undefined;
 el('source-kind').hidden=!fromDownload;
 const sourceLink=el('source-page');if(sourceLink&&sourcePage){sourceLink.href=sourcePage;sourceLink.hidden=false;}
 function preview(){el('media-title').textContent=media?.title??'';el('media-form').hidden=!!media;el('preview-notice').hidden=true;if(media){video.src=media.url;video.load();}}
 video.addEventListener('error',()=>{el('preview-notice').hidden=false;});preview();
 let ctx,player,controller,sdkTimer,loadTimer,attempt=0,loading=false,terminal=false,acknowledged=false,loadedSession,choosing=false,observedSession,observedMedia,mediaUpdate,sessionMediaUpdate,sessionMediaType,lastIdleReason,observedAttempt,retiredMedia,retiredMediaId,retiredGetter,retiredGetterId;
 const framework=()=>window.cast.framework,api=()=>window.chrome.cast;
 const session=()=>ctx?.getCurrentSession();
 const idleReason=value=>['ERROR','CANCELLED','INTERRUPTED','FINISHED'].includes(value)?value:undefined;
 const mediaId=value=>Number.isInteger(value?.mediaSessionId)?value.mediaSessionId:undefined;
 const sameMedia=(left,right)=>!!left&&!!right&&(left===right||mediaId(left)!==undefined&&mediaId(left)===mediaId(right));
 const retired=value=>!!value&&(value===retiredMedia||retiredMediaId!==undefined&&mediaId(value)===retiredMediaId||value===retiredGetter||retiredGetterId!==undefined&&mediaId(value)===retiredGetterId);
 function forgetMedia(){try{observedMedia?.removeUpdateListener?.(mediaUpdate);}catch{/* The SDK may already have detached the media. */}observedMedia=undefined;observedAttempt=undefined;mediaUpdate=undefined;lastIdleReason=undefined;}
 function watchMedia(owner,value){
  if(!value||session()!==owner||retired(value))return;
  // Bind one media identity to this LOAD. Late events cannot replace it with
  // an earlier session, including a new SDK object carrying the earlier ID.
  if(observedAttempt===attempt&&observedMedia&&(observedMedia===value||!sameMedia(observedMedia,value)))return;
  forgetMedia();observedMedia=value;observedAttempt=attempt;const id=attempt;
  mediaUpdate=()=>{if(session()!==owner||observedMedia!==value||id!==attempt)return;const known=idleReason(value.idleReason);if(known)lastIdleReason=known;sync();};
  const known=idleReason(value.idleReason);if(known)lastIdleReason=known;value.addUpdateListener?.(mediaUpdate);
 }
 function watchSession(current){
  if(observedSession===current)return;
  try{if(observedSession&&sessionMediaUpdate)observedSession.removeEventListener?.(sessionMediaType,sessionMediaUpdate);}catch{/* A closed session needs no further cleanup. */}
  forgetMedia();retiredMedia=undefined;retiredMediaId=undefined;retiredGetter=undefined;retiredGetterId=undefined;observedSession=current;sessionMediaUpdate=undefined;sessionMediaType=undefined;
  if(current){sessionMediaType=framework().SessionEventType?.MEDIA_SESSION;if(sessionMediaType){sessionMediaUpdate=event=>{if(session()===current){watchMedia(current,event.mediaSession);sync();}};current.addEventListener?.(sessionMediaType,sessionMediaUpdate);}watchMedia(current,current.getMediaSession());}
 }
 const knownIdleReason=current=>observedSession===current&&observedAttempt===attempt?idleReason(observedMedia?.idleReason)??lastIdleReason:undefined;
 function diagnostic(key,error){
  const codes=new Set(['cancel','channel_error','extension_missing','invalid_parameter','load_media_failed','receiver_unavailable','session_error','timeout','v2_error']);
  const reasons=new Set(['LOAD_FAILED','LOAD_CANCELLED','INVALID_REQUEST','SOURCE_NOT_SUPPORTED','MEDIA_ERROR','NETWORK_ERROR','GENERIC_LOAD_ERROR','MEDIA_UNKNOWN','DECODE','TIMEOUT','CANCELLED']);
  const mediaTypes=new Set(['video/mp4','video/webm','video/ogg','video/quicktime','video/x-matroska','video/mp2t','video/mpeg','video/x-msvideo','video/x-ms-wmv','video/x-flv','video/3gpp','application/vnd.apple.mpegurl','application/x-mpegurl','application/dash+xml']);
  const code=typeof error==='string'?error:error?.code;let details=error?.details;
  if(!details&&typeof error?.description==='string'&&error.description.length<=2048){try{details=JSON.parse(error.description);}catch{/* Only known codes enter this local report. */}}
  const number=value=>Number.isInteger(value)&&value>=0&&value<100000?value:undefined,build=document.querySelector('main')?.dataset.version;
  const report={version:1,build:typeof build==='string'&&build.length<=20&&/^\d+\.\d+\.\d+$/.test(build)?build:undefined,context:'alcydeo-web-cast',error:key,sdkCode:codes.has(code)?code:error?'unknown':undefined,reason:reasons.has(details?.reason)?details.reason:undefined,detailedErrorCode:number(details?.detailedErrorCode??details?.code),mediaType:media?(mediaTypes.has(media.mime)?media.mime:'other-video'):undefined,sourceLength:media?.url.length,sourceHasQuery:media?!!new URL(media.url).search:false,routeConnected:!!session(),loadCount:attempt,loadAcknowledged:acknowledged,playerState:['IDLE','BUFFERING','PLAYING','PAUSED'].includes(player?.playerState)?player.playerState:undefined,mediaLoaded:!!player?.isMediaLoaded,idleReason:knownIdleReason(session())};
  el('diagnostic-report').textContent=JSON.stringify(report,null,2);el('diagnostic').hidden=false;
 }
 const time=value=>{const seconds=Math.max(0,Math.floor(Number.isFinite(value)?value:0));return`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;};
 function syncControls(current,loaded){
  const active=!!current,finished=active&&knownIdleReason(current)==='FINISHED'&&player?.playerState==='IDLE',paused=active?!!player?.isPaused||player?.playerState==='IDLE':video.paused||video.ended;
  const duration=Number(active?player?.duration:video.duration),position=Number(active?player?.currentTime:video.currentTime);
  const button=el('pause'),key=paused?'tvWebPlay':'pause';button.disabled=active?!loaded&&!finished||loading||terminal:!media||video.readyState<1||!!video.error;button.setAttribute('aria-label',c[key]);button.title=c[key];button.querySelector('.play-icon').hidden=!paused;button.querySelector('.pause-icon').hidden=paused;
  el('seek').disabled=!media||!Number.isFinite(duration)||duration<=0||!!media.live||(active? !loaded||loading||terminal:!!video.error);el('seek').max=String(Number.isFinite(duration)&&duration>0?duration:1);if(document.activeElement!==el('seek'))el('seek').value=String(Number.isFinite(position)?position:0);el('time').textContent=`${time(position)} / ${time(duration)}`;
  el('volume').disabled=!media||active&&(!loaded||terminal);if(document.activeElement!==el('volume'))el('volume').value=String(active?(Number.isFinite(player?.volumeLevel)?player.volumeLevel:1):video.volume);
  const fullscreen=el('fullscreen'),fullscreenKey=document.fullscreenElement===video.parentElement?'tvWebExitFullscreen':'tvWebFullscreen';fullscreen.disabled=!document.fullscreenEnabled;fullscreen.setAttribute('aria-label',c[fullscreenKey]);fullscreen.title=c[fullscreenKey];
 }
 function clearLoad(){clearTimeout(loadTimer);loadTimer=undefined;loading=false;}
 function waitForPlayback(current){
  if(loadTimer!==undefined)return;loading=true;const id=attempt;
  loadTimer=setTimeout(()=>{if(id!==attempt||session()!==current)return;loading=false;terminal=true;fail('tvCastTimeout');sync();},20000);
 }
 function sync(checkMediaError=true){
  const current=session(),active=!!current;watchSession(current);watchMedia(current,current?.getMediaSession());
  const remote=observedSession===current&&observedAttempt===attempt?observedMedia:undefined;
  const state=remote?.playerState??player?.playerState,loaded=!!remote&&(player?!!player.isMediaLoaded:!!remote.media);
  if(active&&!terminal&&checkMediaError&&state==='IDLE'&&knownIdleReason(current)==='ERROR'){clearLoad();terminal=true;fail('tvWebLoadError',{details:{reason:'MEDIA_ERROR'}});}
  if(active&&!terminal&&acknowledged&&loaded){if(['PLAYING','PAUSED'].includes(state)||state==='IDLE'&&remote?.idleReason==='FINISHED')clearLoad();else if(state==='BUFFERING')waitForPlayback(current);}
  el('choose').disabled=!ctx||choosing;el('choose').title=c.tvWebOpen;el('load').disabled=!active||loading||!media;el('load').hidden=!active||!media||!terminal;el('disconnect').disabled=!active;el('disconnect').hidden=!active;
  el('receiver').hidden=!active;syncControls(current,loaded);
  let name='';try{name=current?.getCastDevice()?.friendlyName??'';}catch{/* Receiver metadata is optional. */}el('receiver-name').textContent=name;
  if(!active){clearLoad();status(media?'tvDisconnected':'tvWebNoMedia');return;}
  if(terminal)status('tvConnected');else{if(acknowledged&&loaded&&['PLAYING','PAUSED'].includes(state)){status(state==='PLAYING'?'tvCast_playing':'tvCast_paused');}else if(loaded&&state==='IDLE'&&!loading)status('tvCast_finished');else status(loading?'tvCast_loading':'tvConnected');}
 }
 async function load(){
  const current=session();if(!current||loading||!media)return;
  // The getter may lag behind MEDIA_SESSION: retire both known identities.
  const previous=observedMedia??retiredMedia,previousGetter=current.getMediaSession();
  const id=++attempt;clear();clearLoad();forgetMedia();retiredMedia=previous;retiredMediaId=mediaId(previous);retiredGetter=previousGetter;retiredGetterId=mediaId(previousGetter);loading=true;terminal=false;acknowledged=false;loadedSession=current;video.pause();waitForPlayback(current);sync(false);
  try{
   const info=new(api().media.MediaInfo)(media.url,media.mime);info.streamType=api().media.StreamType[media.live?'LIVE':'BUFFERED'];info.metadata=new(api().media.GenericMediaMetadata)();info.metadata.title=media.title;
   const request=new(api().media.LoadRequest)(info);request.autoplay=true;
   if(!media.live)request.currentTime=0;
   await current.loadMedia(request);if(id===attempt&&session()===current&&!terminal){acknowledged=true;sync();}
  }catch(error){if(id===attempt&&session()===current&&!terminal){clearLoad();terminal=true;fail('tvWebLoadError',error);sync();}}
 }
 const autoLoad=()=>{if(media&&session()&&loadedSession!==session())void load();};
 el('media-form').addEventListener('submit',event=>{event.preventDefault();try{const url=checked(el('media-url').value.trim());media={url,title:new URL(url).hostname,mime:mime('',url)};clear();preview();sync();if(session())void load();}catch{fail('tvWebNoMedia');}});
 function selectionFailed(error){choosing=false;const code=typeof error==='string'?error:error?.code;if(code==='cancel'){if(!session()&&!terminal)clear();sync();return;}sync();fail(code==='receiver_unavailable'?'tvNoDevice':'tvNoConnection',error);}
 el('choose').addEventListener('click',()=>{if(!ctx||choosing)return;choosing=true;if(!session())status('tvConnecting');el('choose').disabled=true;try{const opening=ctx.requestSession();opening.then(()=>{choosing=false;if(!terminal)clear();sync();autoLoad();},selectionFailed);}catch(error){selectionFailed(error);}});
 el('load').addEventListener('click',load);el('pause').addEventListener('click',()=>{if(el('pause').disabled)return;if(session()){if(player?.playerState==='IDLE'&&knownIdleReason(session())==='FINISHED')void load();else controller?.playOrPause();return;}if(video.paused||video.ended)void video.play().catch(()=>{el('preview-notice').hidden=false;sync();});else video.pause();});
 el('disconnect').addEventListener('click',()=>{attempt++;clearLoad();terminal=false;loadedSession=undefined;session()?.endSession(true);sync();});
 el('seek').addEventListener('change',()=>{if(el('seek').disabled)return;const value=Number(el('seek').value);if(!Number.isFinite(value))return;if(session()){if(!player||!controller)return;player.currentTime=Math.max(0,Math.min(player.duration,value));controller.seek();}else{video.currentTime=Math.max(0,Math.min(video.duration,value));sync();}});
 el('volume').addEventListener('input',()=>{if(el('volume').disabled)return;const value=Number(el('volume').value);if(!Number.isFinite(value))return;const volume=Math.max(0,Math.min(1,value));if(session()){if(!player||!controller)return;player.volumeLevel=volume;controller.setVolumeLevel();}else{video.volume=volume;sync();}});
 el('fullscreen').addEventListener('click',()=>{if(el('fullscreen').disabled)return;const operation=document.fullscreenElement===video.parentElement?document.exitFullscreen():video.parentElement.requestFullscreen();void operation.catch(()=>sync());});
 document.addEventListener('fullscreenchange',()=>sync());
 for(const event of['loadedmetadata','durationchange','timeupdate','play','pause','ended','volumechange','emptied','error'])video.addEventListener(event,()=>{if(!session())syncControls(undefined,false);});
 el('player-controls').hidden=false;video.controls=false;sync();
 el('copy-diagnostic').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(el('diagnostic-report').textContent);el('diagnostic-copy-status').textContent=c.detectionDiagnosticsCopied;}catch{el('diagnostic-report').focus();}});
 window.__onGCastApiAvailable=available=>{
  clearTimeout(sdkTimer);if(!available){fail('tvWebSdkError');return;}
  try{
   ctx=framework().CastContext.getInstance();ctx.setOptions({receiverApplicationId:api().media.DEFAULT_MEDIA_RECEIVER_APP_ID,autoJoinPolicy:api().AutoJoinPolicy.PAGE_SCOPED,resumeSavedSession:false});
   player=new(framework().RemotePlayer)();controller=new(framework().RemotePlayerController)(player);controller.addEventListener(framework().RemotePlayerEventType.ANY_CHANGE,()=>sync());
   ctx.addEventListener(framework().CastContextEventType.SESSION_STATE_CHANGED,event=>{if(event.sessionState===framework().SessionState.SESSION_STARTED){sync();autoLoad();}else if(event.sessionState===framework().SessionState.SESSION_START_FAILED){selectionFailed(event.errorCode);}else{if(!session()){attempt++;clearLoad();loadedSession=undefined;terminal=false;}sync();}});
   el('choose').disabled=false;sync();
  }catch{fail('tvWebSdkError');}
 };
 window.addEventListener('pagehide',()=>{attempt++;clearTimeout(sdkTimer);clearLoad();watchSession(undefined);video.pause();video.removeAttribute('src');video.load();},{once:true});
 status(media?'tvWebPreparing':'tvWebNoMedia');
 if(!window.isSecureContext){fail('tvWebSdkError');return;}
 const script=document.createElement('script');script.src='https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';script.async=true;script.onerror=()=>{clearTimeout(sdkTimer);fail('tvWebSdkError');};sdkTimer=setTimeout(()=>fail('tvWebSdkError'),15000);document.head.appendChild(script);
})();
