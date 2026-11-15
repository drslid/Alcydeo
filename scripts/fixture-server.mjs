import {liveFixture} from './live-fixture.mjs';
import {preflightFixture} from './preflight-fixture.mjs';
import {partsFixture} from './parts-fixture.mjs';
import { createServer } from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
const root = resolve('fixtures');
const fixturePort=Number(process.env.ALCYDEO_FIXTURE_PORT??4179);
if(!Number.isInteger(fixturePort)||fixturePort<1024||fixturePort>65535)throw Error('Invalid ALCYDEO_FIXTURE_PORT');
const types = {'.html':'text/html','.js':'text/javascript','.mp4':'video/mp4','.webm':'video/webm','.mkv':'video/x-matroska','.mov':'video/quicktime','.m3u8':'application/vnd.apple.mpegurl','.mpd':'application/dash+xml','.ts':'video/mp2t','.m4s':'video/iso.segment'};
let qualityGeneration=1;
let readerGeneration=1;
let nestedQualityGeneration=1;
const busyResponses=new Map();
createServer(async (req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    if(await liveFixture(req,res,url))return;
    if(await preflightFixture(req,res,url))return;
    if(await partsFixture(req,res,url))return;
    if(url.pathname==='/api/video_proxy.php'){
      if(req.headers['sec-fetch-site']==='none'||String(req.headers.origin??'').startsWith('chrome-extension://')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><title>Reader page</title>');}
      else{res.writeHead(302,{Location:`http://localhost:${fixturePort}/binary/lesson.mp4`});res.end();}return;
    }
    if(url.pathname==='/binary/lesson.mp4'&&!url.searchParams.has('ff')){res.writeHead(307,{Location:'/binary/lesson.mp4?ff=fixture_v1_%2Bkeep%2F','Access-Control-Allow-Origin':'*'});res.end();return;}
    if(url.pathname==='/binary/hidden-html.mp4'){res.writeHead(200,{'Content-Type':'application/octet-stream',"Content-Disposition":"attachment; filename*=UTF-8''session%2Ehtml"});res.end('<!doctype html><title>Session page</title>');return;}
    if(['/binary/denied.mp4','/binary/iframe.mp4'].includes(url.pathname)){res.writeHead(url.pathname.includes('denied')?403:200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><title>Reader page</title>');return;}
    if(url.pathname==='/binary/false.mp4'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><title>Not a movie</title>');return;}
    if(url.pathname==='/nested-quality'){nestedQualityGeneration=Number(url.searchParams.get('value'))===2?2:1;res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({generation:nestedQualityGeneration}));return;}
    if(url.pathname==='/nested-hls/rotating.m3u8'){res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl','Cache-Control':'no-store'});res.end(nestedQualityGeneration===1?'#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=320x180\n../hls-low/index.m3u8':'#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=720x404\n../hls-high/index.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720\n../hls-high/index.m3u8?unavailable=720');return;}
    if(url.pathname==='/badge-busy-state'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({sentAt:busyResponses.get(url.searchParams.get('case'))??0}));return;}
    if(url.pathname==='/badge-busy-source.m3u8'){
      const extension=req.headers['sec-fetch-site']==='none'||String(req.headers.origin??'').startsWith('chrome-extension://');await new Promise(r=>setTimeout(r,extension?2500:600));if(res.destroyed)return;
      res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=720x404\n/hls-high/index.m3u8\n');
      if(!extension){if(busyResponses.size>=20)busyResponses.delete(busyResponses.keys().next().value);busyResponses.set(url.searchParams.get('case'),Date.now());}return;
    }
    if(url.pathname==='/badge-source.m3u8'){
      if(req.headers['sec-fetch-site']==='none'||String(req.headers.origin??'').startsWith('chrome-extension://'))await new Promise(r=>setTimeout(r,2500));
      if(res.destroyed)return;res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=720x404\n/hls-high/index.m3u8\n');return;
    }
    if(url.pathname==='/reader-generation'){readerGeneration=Math.max(1,Math.min(10,Number(url.searchParams.get('value'))||1));res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({generation:readerGeneration}));return;}
    if(url.pathname==='/quality-generation'){qualityGeneration=Math.max(1,Math.min(10,Number(url.searchParams.get('value'))||1));res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({generation:qualityGeneration}));return;}
    if(url.pathname==='/rotating-master.m3u8'){res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(`#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=720x404\n/hls-high/index.m3u8?signature=g${qualityGeneration}\n#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=320x180\n/hls-low/index.m3u8?signature=g${qualityGeneration}\n`);return;}
    if(url.pathname==='/session-video.mp4'&&req.headers['sec-fetch-dest']!=='video'){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Disposition':'attachment; filename="session.htm"'});res.end('<!doctype html><title>Session expired</title><p>Please sign in again.</p>');return;
    }
    if(url.pathname==='/reader-video.mp4'){
      if(req.headers['sec-fetch-dest']==='video'){res.writeHead(302,{Location:'/reader-redirect'});res.end();}
      else{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><title>Original reader</title>');}return;
    }
    if(url.pathname==='/reader-redirect'){res.writeHead(307,{Location:`/direct-stream?signature=keep%2Bthis%2Fvalue&generation=${readerGeneration}`});res.end();return;}
    if(url.pathname==='/not-a-video.mp4'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><title>HTML instead of video</title>');return;}
    if (url.pathname.startsWith('/status/')) { res.writeHead(Number(url.pathname.split('/')[2]),{'Retry-After':'0'}); res.end(); return; }
    const large = url.pathname==='/large.mp4' && process.env.ALCYDEO_LARGE_FILE;
    const alias={'/binary/lesson.mp4':'media/high.mp4','/manifest':'master.m3u8','/direct-stream':'media/high.mp4','/session-video.mp4':'media/high.mp4','/quality/lesson-404p.mp4':'media/high.mp4','/quality/lesson-180p.mp4':'media/low.mp4','/quality/different-404p.mp4':'media/high.mp4','/opaque/a4c9.mp4':'cmaf/init.mp4','/opaque/6b71.mp4':'cmaf/piece-0.m4s','/opaque/833e.mp4':'cmaf/piece-1.m4s','/opaque/c98a.mp4':'cmaf/piece-2.m4s'}[url.pathname];
    const path = large ? resolve(process.env.ALCYDEO_LARGE_FILE) : resolve(root,alias??decodeURIComponent(url.pathname==='/'?'index.html':url.pathname.slice(1)));
    if (!large && !path.startsWith(root+sep)) throw new Error('path');
    const info = await stat(path); const etag = `"${info.size}-${info.mtimeMs}"`;
    const delay=Math.min(10000,Math.max(0,Number(url.searchParams.get('delay'))||0));if(delay && req.method!=='HEAD')await new Promise(r=>setTimeout(r,delay));if(res.destroyed)return;
    const headers = {'Content-Type':url.pathname.startsWith('/binary/')?'application/octet-stream':url.pathname.startsWith('/opaque/')?'video/mp4':types[extname(path)]??'application/octet-stream','Accept-Ranges':'bytes','ETag':etag,'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'};
    const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range??'');
    let start=0,end=info.size-1;
    if (range) { start=Number(range[1]); end=Math.min(Number(range[2]||end),end); if (start>end) {res.writeHead(416);res.end();return;} headers['Content-Range']=`bytes ${start}-${end}/${info.size}`; }
    headers['Content-Length']=String(end-start+1); res.writeHead(range?206:200,headers);
    if(req.method==='HEAD')res.end();else {const stream=createReadStream(path,{start,end});res.on('close',()=>stream.destroy());stream.pipe(res);}
  } catch {res.writeHead(404);res.end();}
}).listen(fixturePort,'127.0.0.1',()=>console.log(`Fixture lab: http://127.0.0.1:${fixturePort}`));
