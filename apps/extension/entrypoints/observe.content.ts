import {isLocalBuild} from '../../../packages/contracts/distribution';
import {mediaLink} from '../../../packages/media-core/formats';
import{xPage}from'../src/x-page';
import{tiktokPage}from'../src/tiktok-page';
export default defineContentScript({
  registration: 'runtime', allFrames: true,runAt:'document_start',
  main(ctx) {
    const own=globalThis as typeof globalThis&{__alcydeoObserveCleanup?:(preserveTikTok?:boolean)=>void};own.__alcydeoObserveCleanup?.(true);
    let timeout: ReturnType<typeof setTimeout>|undefined,stopped=false;
    const valid=()=>{
      if(stopped)return false;
      // WXT's browser binding may still hold the old runtime object after
      // Chrome removes the global namespace. Check the actual API as well.
      try{if(typeof chrome==='undefined'||!chrome.runtime?.id||typeof chrome.runtime.sendMessage!=='function'){cleanup();return false;}return!ctx.isInvalid;}catch{cleanup();return false;}
    };
    const failed=(error:unknown)=>{if(!valid())return;if(error instanceof Error&&/Extension context invalidated/i.test(error.message))cleanup();};
    const report = () => {
      if(!valid()||timeout!==undefined)return;
      timeout=setTimeout(() => {
        timeout=undefined;if(!valid())return;
        // Reload can invalidate the context between the check and the call.
        // Chrome can throw synchronously here, before a Promise even exists.
        try{void chrome.runtime.sendMessage({type:'domChanged'}).catch(failed);}catch(error){failed(error);}
      },40);
    };
    const onX=/^(?:www\.|mobile\.|m\.)?(?:x|twitter)\.com$/.test(location.hostname);
    const onTikTok=/^(?:www\.|m\.)?tiktok\.com$/.test(location.hostname);
    const tikTokScripts=new WeakSet<HTMLScriptElement>();
    const captureTikTok=(changes:MutationRecord[])=>{if(!onTikTok)return false;const scripts=new Set<HTMLScriptElement>();let inspected=0;
      const add=(node:Node,updated=false)=>{const el=node instanceof Element?node:node.parentElement;if(!el)return;for(const script of el instanceof HTMLScriptElement?[el]:el.querySelectorAll('script')){if(++inspected>128)break;if(!/^(?:__UNIVERSAL_DATA_FOR_REHYDRATION__|SIGI_STATE|sigi-persisted-data)$/.test(script.id)||tikTokScripts.has(script)&&!updated)continue;scripts.delete(script);scripts.add(script);if(scripts.size>=32)break;}};
      for(const change of changes){if(change.target instanceof HTMLScriptElement||change.type==='characterData'&&change.target.parentElement instanceof HTMLScriptElement)add(change.target,true);for(const node of change.removedNodes)add(node);for(const node of change.addedNodes)add(node);if(scripts.size>=32)break;}
      let budget=8*1024*1024;const texts:string[]=[];for(const script of [...scripts].reverse()){tikTokScripts.add(script);const text=script.textContent??'';if(!text||text.length>budget)continue;budget-=text.length;texts.push(text);}return!!texts.length&&!!tiktokPage([],texts);
    };
    const captureX=(nodes:Node[])=>{if(!onX)return false;const scripts=new Set<HTMLScriptElement>();
      for(const node of nodes){if(scripts.size>=32)break;const el=node instanceof Element?node:node.parentElement;if(el instanceof HTMLScriptElement)scripts.add(el);else if(el)for(const script of el.querySelectorAll('script')){scripts.add(script);if(scripts.size>=32)break;}}
      let budget=8*1024*1024;const texts:string[]=[];for(const script of scripts){const text=script.textContent??'';if(text.length>2*1024*1024||text.length>budget||!text.includes('video_info'))continue;budget-=text.length;texts.push(text);}
      return texts.length>0&&!!xPage([],texts);
    };
    const relevant=(node:Node):boolean=>{
      if(!(node instanceof Element))return false;
      if(node.matches('video,audio,source,iframe'))return true;
      if(node instanceof HTMLScriptElement&&/^(?:__UNIVERSAL_DATA_FOR_REHYDRATION__|SIGI_STATE|sigi-persisted-data)$/.test(node.id)&&/^(?:www\.|m\.)?tiktok\.com$/.test(location.hostname))return true;
      return node instanceof HTMLAnchorElement&&mediaLink.test(node.href);
    };
    const containsRelevant=(node:Node)=>{if(relevant(node))return true;if(!(node instanceof Element))return false;if(node.querySelector('video,audio,source,iframe'))return true;if(/^(?:www\.|m\.)?tiktok\.com$/.test(location.hostname)&&node.querySelector('script#__UNIVERSAL_DATA_FOR_REHYDRATION__,script#SIGI_STATE,script#sigi-persisted-data'))return true;for(const link of node.querySelectorAll('a[href]'))if(relevant(link))return true;return false;};
    const roots=new Set<Document|ShadowRoot>();const events=['loadedmetadata','loadeddata','playing','loadstart','emptied',...(isLocalBuild()?['yt-navigate-finish','yt-page-data-updated','yt-player-updated']:[])];
    const watchTree=(node:Node):boolean=>{let found=false;if(node instanceof Element&&node.shadowRoot)found=watchRoot(node.shadowRoot)||found;if(node instanceof Element||node instanceof Document||node instanceof ShadowRoot){let visited=0;for(const el of node.querySelectorAll('*')){if(++visited>20000||roots.size>=128)break;if(el.shadowRoot)found=watchRoot(el.shadowRoot)||found;}}return found;};
    const watchRoot=(root:Document|ShadowRoot):boolean=>{if(roots.has(root)||roots.size>=128)return false;roots.add(root);observer.observe(root,{childList:true,subtree:true,characterData:onTikTok,attributes:true,attributeOldValue:true,attributeFilter:['src','href','srcdoc','type','title','aria-label','label','data-quality','data-resolution']});for(const event of events)root.addEventListener(event,report,true);watchTree(root);return!!root.querySelector('video,audio,source,iframe,a[href]');};
    const observer=new MutationObserver(changes=>{if(!valid())return;const tikTokChanged=captureTikTok(changes);let changed=tikTokChanged||captureX(changes.flatMap(c=>[c.target,...c.addedNodes,...c.removedNodes]))||changes.some(change=>relevant(change.target)||(change.type==='attributes'&&change.attributeName==='href'&&change.target instanceof HTMLAnchorElement&&mediaLink.test(change.oldValue??''))||(change.type==='childList'&&[...change.addedNodes,...change.removedNodes].some(containsRelevant)));for(const change of changes)for(const node of change.addedNodes)changed=watchTree(node)||changed;if(changed)report();});
    // documentElement may not exist at document_start. Observe the Document so
    // the first media node is reported while later scripts/resources still load.
    const cleanup=(preserveTikTok=false)=>{if(stopped)return;stopped=true;clearTimeout(timeout);timeout=undefined;observer.disconnect();for(const root of roots)for(const event of events)root.removeEventListener(event,report,true);roots.clear();delete(globalThis as any).__alcydeoXCatalog;if(!preserveTikTok)delete(globalThis as any).__alcydeoTikTokCatalog;if(own.__alcydeoObserveCleanup===cleanup)delete own.__alcydeoObserveCleanup;};own.__alcydeoObserveCleanup=cleanup;ctx.onInvalidated(()=>{let replacing=false;try{replacing=!!chrome.runtime?.id&&typeof chrome.runtime.sendMessage==='function';}catch{/* A truly invalid runtime cannot retain its cache. */}cleanup(replacing);});
    if(!valid())return;
    watchRoot(document);if(onX)xPage();if(onTikTok){tiktokPage();for(const id of ['__UNIVERSAL_DATA_FOR_REHYDRATION__','SIGI_STATE','sigi-persisted-data']){const script=document.getElementById(id);if(script instanceof HTMLScriptElement)tikTokScripts.add(script);}}report();
  },
});
