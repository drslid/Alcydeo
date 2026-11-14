import{readFile}from'node:fs/promises';
const bytes=await readFile('fixtures/media/high.mp4');const states=new Map();
export async function partsFixture(req,res,url){
 if(!['/parts/source.mp4','/parts-state','/parts-control'].includes(url.pathname))return false;
 if(url.pathname==='/parts-control'&&url.searchParams.get('reset')==='all'){states.clear();res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end('{}');return true;}
 const key=url.searchParams.get('case')??'default';let state=states.get(key);if(!state){if(states.size>=100)states.delete(states.keys().next().value);state={revision:1,active:0,maxActive:0,requests:[]};states.set(key,state);}
 if(url.pathname!=='/parts/source.mp4'){if(url.pathname==='/parts-control')state.revision=Number(url.searchParams.get('revision'))||1;res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify(state));return true;}
 const mode=url.searchParams.get('mode')??'valid',pace=Math.min(250,Math.max(0,Number(url.searchParams.get('pace'))||0)),tag=`"parts-fixture-${state.revision}"`;const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range??'');let start=range?Number(range[1]):0,end=range?Math.min(Number(range[2]||bytes.length-1),bytes.length-1):bytes.length-1;
 if(mode==='ignore'||(req.headers['if-range']&&req.headers['if-range']!==tag)){start=0;end=bytes.length-1;}
 const partial=!!range&&mode!=='ignore'&&(!req.headers['if-range']||req.headers['if-range']===tag);
 const row={range:req.headers.range,ifRange:req.headers['if-range'],start,end,status:partial?206:200,at:Date.now(),bytes:0};state.requests.push(row);state.active++;state.maxActive=Math.max(state.maxActive,state.active);
 let timer;res.on('close',()=>{clearInterval(timer);state.active--;row.doneAt=Date.now();row.complete=row.bytes===end-start+1;});
 if(mode==='html'&&req.headers.range==='bytes=0-0'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Expired session</title>');return true;}
 const headers={'Content-Type':'video/mp4','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Accept-Ranges':'bytes','Content-Length':String(end-start+1)};
 if(mode!=='noetag')headers.ETag=mode==='weak'?`W/${tag}`:tag;
 if(partial)headers['Content-Range']=`bytes ${mode==='wrong'&&end>0?start+1:start}-${end}/${bytes.length}`;
 res.writeHead(row.status,headers);res.flushHeaders();let next=start;
 const send=()=>{if(res.destroyed)return;const stop=Math.min(end+1,next+16384);res.write(bytes.subarray(next,stop));row.bytes+=stop-next;next=stop;if(next>end){clearInterval(timer);res.end();}};
 if(pace&&end>0)timer=setInterval(send,pace);else{row.bytes=end-start+1;res.end(bytes.subarray(start,end+1));}return true;
}
