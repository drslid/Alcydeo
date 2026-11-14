/// <reference lib="dom.asynciterable" />
import{clearCloudInputs}from'./storage';
export{hasCloudOwner}from'./storage';

export async function clearCloudTemporary(){
 try{
 await navigator.locks.request('alcydeo:cloud-upload',{ifAvailable:true},async upload=>{
  if(!upload)throw new Error('cloudTemporaryBusy');
  await navigator.locks.request('alcydeo:cloud-files',{ifAvailable:true},async files=>{
   if(!files)throw new Error('cloudTemporaryBusy');
   await clearCloudInputs();
   const root=await navigator.storage.getDirectory();let failed=false;
   for await(const[name,handle]of root.entries()){
    if(!name.startsWith('cloud-')||handle.kind!=='directory')continue;
    try{await root.removeEntry(name,{recursive:true});}
    catch(error){if((error as{name?:string})?.name!=='NotFoundError')failed=true;}
   }
   if(failed)throw new Error('cloudTemporaryFailed');
  });
 });
 }catch(error){
  if(error instanceof Error&&error.message==='cloudTemporaryBusy')throw error;
  throw new Error('cloudTemporaryFailed');
 }
}
