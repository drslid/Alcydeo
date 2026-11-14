import type{CloudProvider}from'./contracts';
import{megaupLimit}from'./megaup';import{onefichierLimit}from'./onefichier';import{turbobitLimit}from'./turbobit';
export const noSetupCloudProviders:readonly CloudProvider[]=['gofile','megaup','onefichier','turbobit'];
export function cloudFileLimit(provider:CloudProvider){return provider==='megaup'?megaupLimit:provider==='onefichier'?onefichierLimit:provider==='turbobit'?turbobitLimit:Infinity;}
export function planCloudTargets(size:number,targets:readonly CloudProvider[],prepared:readonly CloudProvider[]=[]){
 if(!Number.isSafeInteger(size)||size<=0)throw new Error('invalid');
 const pending=[...new Set(targets)].filter(provider=>!prepared.includes(provider));
 return{send:pending.filter(provider=>size<=cloudFileLimit(provider)),tooLarge:pending.filter(provider=>size>cloudFileLimit(provider))};
}
