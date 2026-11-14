import {Logging,LogLevel} from 'mediabunny';
import type {MediaNotice} from '../contracts';

export function streamWarning(args:unknown[]):number|undefined{
  if(args.length!==1||typeof args[0]!=='string')return;
  const match=/^Note: MPEG-TS streams with stream_type 0x([0-9a-f]+) are not currently supported\.$/i.exec(args[0]);
  return match?Number.parseInt(match[1]!,16):undefined;
}

let scopes=0,restoreLogging:(()=>void)|undefined;
function retainConsolePolicy(){
  if(scopes++===0){
    const previous=Logging.level;
    Logging.level=previous===LogLevel.Silent?LogLevel.Silent:LogLevel.Errors;
    const removeWarning=Logging.on('warn',args=>{if(streamWarning(args)!==0x15&&previous>=LogLevel.Warnings)console.warn(...args);});
    const removeInfo=Logging.on('info',args=>{if(previous>=LogLevel.Info)console.info(...args);});
    restoreLogging=()=>{removeWarning();removeInfo();Logging.level=previous;};
  }
  return()=>{if(--scopes===0){restoreLogging?.();restoreLogging=undefined;}};
}

// Workers and concurrent bounded metadata checks share the exact same policy.
// Forward unknown warnings once and restore logging only after the last scope.
export function mediaLogs(notice?:(code:MediaNotice)=>void){
  const release=retainConsolePolicy();let unsupported=false,disposed=false;
  const remove=Logging.on('warn',args=>{
    const type=streamWarning(args);
    if(type===0x15){notice?.('timedMetadataSkipped');return;}
    if(type!==undefined)unsupported=true;
  });
  return{check(){if(unsupported)throw new Error('codec');},dispose(){if(disposed)return;disposed=true;remove();release();}};
}
