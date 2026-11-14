import type{PcloudDestination}from'./contracts';

// Accept the upload-link form documented by pCloud, or its code. A download
// share link is not an upload destination. Region is explicit: never probe or
// send a file to both datacentres when the first request fails.
export function pcloudDestination(value:string,region:string):PcloudDestination{
 let code=value.trim();
 if(region!=='eu'&&region!=='us')throw new Error('cloudPcloudLink');
 if(code.includes('://')){
  let url:URL;try{url=new URL(code);}catch{throw new Error('cloudPcloudLink');}
  const fragment=url.hash.slice(1),modern=fragment.startsWith('/puplink?');
  const params=new URLSearchParams(modern?fragment.slice('/puplink?'.length):fragment||url.search.slice(1));
  if(url.protocol!=='https:'||!['my.pcloud.com','e.pcloud.com'].includes(url.hostname)||url.port||url.username||url.password||url.pathname!=='/'||(!modern&&params.get('page')!=='puplink')||params.getAll('code').length!==1)throw new Error('cloudPcloudLink');
  code=params.get('code')??'';if(url.hostname==='e.pcloud.com')region='eu';
 }
 if(!/^[a-z\d_-]{4,256}$/i.test(code))throw new Error('cloudPcloudLink');
 return{code,region:region as 'eu'|'us'};
}
export function pcloudResult(data:any,size:number){
 if(!data||!Number.isInteger(data.result))throw new Error('cloudResponse');
 if(data.result!==0)throw new Error([7001,7002,1028,1000,2000].includes(data.result)?'cloudPcloudLink':data.result===7004?'cloudExpired':[7007,7008].includes(data.result)?'cloudPcloudQuota':data.result===4000?'cloudRate':'cloudNetwork');
 // The documented minimal response contains result:0 only. If metadata is
 // present it must also confirm the one file's exact size.
 if(data.metadata!==undefined&&(!Array.isArray(data.metadata)||data.metadata.length!==1||Number(data.metadata[0]?.size)!==size))throw new Error('cloudResponse');
}
