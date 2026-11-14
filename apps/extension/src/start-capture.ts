export async function startTabCapture(sourceTabId:number){
 const source=await chrome.tabs.get(sourceTabId);if(source.incognito||!source.url?.startsWith('http'))throw new Error('recordingUnavailable');
 const token=crypto.randomUUID(),tab=await chrome.tabs.create({url:chrome.runtime.getURL(`/manager.html?capture=${token}&sourceTabId=${sourceTabId}#record`),active:false});if(tab.id===undefined)throw new Error('recordingUnavailable');
 // The persistent consumer requests permission and obtains the stream. A
 // browser permission dialog may close the action popup that initiated it.
 for(let attempt=0;attempt<300;attempt++){try{const current=await chrome.tabs.get(tab.id);if(current.status!=='complete')continue;const result=await chrome.runtime.sendMessage({type:'alcydeo.quickCapture',token});if(result?.started)return;}catch{/* The consumer is still loading. */}}
 await chrome.tabs.update(tab.id,{active:true});
}
