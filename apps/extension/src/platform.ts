declare const __ALCYDEO_FIREFOX__:boolean;
export const firefoxBuild=typeof __ALCYDEO_FIREFOX__==='boolean'&&__ALCYDEO_FIREFOX__;
export const supportsTabCapture=!firefoxBuild;
export const supportsNativeCast=!firefoxBuild;
export const extensionSettingsUrl=(firefox=firefoxBuild,id?:string)=>firefox?'about:addons':`chrome://extensions/?id=${id??chrome.runtime.id}`;
export const downloadsSettingsUrl=(firefox=firefoxBuild)=>firefox?'about:preferences#general':'chrome://settings/downloads';
export function isBackgroundSender(sender:{id?:string;url?:string},firefox=firefoxBuild){return sender.id===chrome.runtime.id&&(sender.url===chrome.runtime.getURL('/background.js')||firefox&&sender.url===chrome.runtime.getURL('/_generated_background_page.html'));}

type DataPermissions={data_collection:['websiteContent','personallyIdentifyingInfo']};
type DataPermissionApi={contains:(value:DataPermissions)=>Promise<boolean>;request:(value:DataPermissions)=>Promise<boolean>};
export async function cloudConsent(request=false,firefox=firefoxBuild){
 if(!firefox)return true;
 try{
  const permissions=chrome.permissions as unknown as DataPermissionApi;
  // Call request directly from the user's gesture, before any asynchronous
  // preparation. contains is for job restoration, never an implicit opt-in.
  return await permissions[request?'request':'contains']({data_collection:['websiteContent','personallyIdentifyingInfo']});
 }catch{return false;}
}

// Firefox's trusted MessageSender omits Chrome's origin property. The caller
// must still validate extension id, frame URL, tab id, permission and privacy.
export function messageOriginMatches(sender:{origin?:string},origin:string,firefox=firefoxBuild){return sender.origin===origin||firefox&&sender.origin===undefined;}

type RequestOrigin={initiator?:string;originUrl?:string;documentUrl?:string};
export function requestInitiator(details:RequestOrigin,firefox=firefoxBuild){
 if(details.initiator!==undefined)return details.initiator;
 if(!firefox)return;
 for(const value of[details.originUrl,details.documentUrl])if(typeof value==='string'&&/^https?:\/\//.test(value))return value;
}

export async function managerContext(path:string){
 // Older Firefox releases do not implement getContexts. Never let that optional
 // inventory API prevent the actual tabs inventory from finding the manager.
 if(typeof chrome.runtime.getContexts!=='function')return;
 return(await chrome.runtime.getContexts({contextTypes:['TAB']})).find(value=>value.tabId>=0&&value.documentUrl?.split(/[?#]/)[0]===path);
}
