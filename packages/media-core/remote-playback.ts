// Keep browser diagnostics as stable message IDs, never expose source URLs or
// raw native exception messages in UI reports.
export function remotePlaybackError(error:unknown){
 const name=(error as {name?:string})?.name;
 if(name==='AbortError')return'tvNoConnection';
 if(name==='NotAllowedError')return /dismiss/i.test(String((error as {message?:string}).message??''))?'tvNoConnection':'tvPermission';
 if(name==='InvalidAccessError')return'tvActivation';
 if(name==='NotFoundError')return'tvNoDevice';
 if(name==='OperationError')return'tvBusy';
 return'tvNotSupported';
}
