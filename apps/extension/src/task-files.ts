import type{Task}from'../../../packages/contracts';
import{namedTaskFile}from'../../../packages/media-core/filenames';
import{downloadedFileUrl}from'./local-cast-file';
import{firefoxBuild,extensionSettingsUrl}from'./platform';
export async function fileAccess(){return !firefoxBuild&&await chrome.extension.isAllowedFileSchemeAccess()&&await chrome.permissions.contains({origins:['file:///*']});}
export async function allowFileAccess(){if(firefoxBuild)throw new Error('chooseLocalFiles');if(!await chrome.extension.isAllowedFileSchemeAccess()){await chrome.tabs.create({url:extensionSettingsUrl()});throw new Error('tvFileAccess');}if(!await chrome.permissions.request({origins:['file:///*']}))throw new Error('permission');}
export async function taskFile(task:Task,signal?:AbortSignal){
 if(task.output){try{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle(task.id);return namedTaskFile(task,await(await dir.getFileHandle(task.output)).getFile());}catch{/* A saved disk copy can survive OPFS cleanup. */}}
 const id=task.downloadId??task.castDownloadId;if(id===undefined||!await fileAccess())throw new Error('chooseLocalFiles');
 const response=await fetch(await downloadedFileUrl(id),{signal,credentials:'omit'});if(!response.ok)throw new Error('chooseLocalFiles');
 return namedTaskFile(task,new File([await response.blob()],'source',{type:response.headers.get('content-type')??''}));
}
export async function taskPreviewSource(task:Task){if(task.output){try{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle(task.id);return await(await dir.getFileHandle(task.output)).getFile();}catch{/* Try the explicit browser download record. */}}const id=task.downloadId??task.castDownloadId;if(id!==undefined&&await fileAccess())return downloadedFileUrl(id);throw new Error('chooseLocalFiles');}
