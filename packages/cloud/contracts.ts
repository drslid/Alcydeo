export type CloudProvider='gofile'|'megaup'|'onefichier'|'turbobit'|'pcloud'|'drive'|'onedrive';
export interface PcloudDestination{code:string;region:'eu'|'us'}
export interface CloudCheckpoint{url:string;offset:number;expires?:number}
export interface CloudJob{id:string;provider:CloudProvider;destination?:PcloudDestination;name:string;size:number;mime:string;state:'preparing'|'queued'|'uploading'|'paused'|'completed'|'cancelled'|'failed';bytes:number;createdAt:number;updatedAt:number;owner?:string;leaseUntil?:number;checkpoint?:CloudCheckpoint;link?:string;error?:string;uploadAttempted?:boolean;ready:boolean}
export const cloudProviders:CloudProvider[]=['gofile','megaup','onefichier','turbobit','pcloud'];
export const cloudNames:Record<CloudProvider,string>={gofile:'Gofile',megaup:'MegaUp',onefichier:'1fichier',turbobit:'Turbobit',pcloud:'pCloud',drive:'Google Drive',onedrive:'OneDrive'};
export const cloudRequiresAccount=(provider:CloudProvider)=>provider==='drive'||provider==='onedrive';
