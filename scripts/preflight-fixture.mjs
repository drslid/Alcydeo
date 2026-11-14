import {readFile} from 'node:fs/promises';
const requests=[];let active=0,maximum=0;
export async function preflightFixture(req,res,url){
 if(!url.pathname.startsWith('/preflight/'))return false;
 const headers={'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'};
 if(url.pathname==='/preflight/stats'){if(url.searchParams.has('reset')){requests.length=0;maximum=active;}res.writeHead(200,{'Content-Type':'application/json',...headers});res.end(JSON.stringify({requests,active,maximum}));return true;}
 if(url.pathname==='/preflight/page.html'){
  res.writeHead(200,{'Content-Type':'text/html',...headers});res.end(`<!doctype html><meta charset="utf-8"><title>Atelier lumière — sources vérifiées</title><h1>Original fixture</h1><a href="/preflight/lesson-1080p.mp4">Atelier vidéo</a><a href="/preflight/lesson-720p.mp4">Atelier vidéo</a><a href="/preflight/lesson-404p.mp4">Atelier vidéo</a><a href="/preflight/tiny.mp4">Small original</a><a href="/preflight/unconfirmed.mp4">Redirect original</a><a href="/preflight/master.m3u8">Segmented original</a>`);return true;
 }
 if(url.pathname==='/preflight/title.html'){res.writeHead(200,{'Content-Type':'text/html',...headers});res.end('<!doctype html><meta charset="utf-8"><title>Le titre de la page principale</title><iframe src="/preflight/frame.html"></iframe>');return true;}
 if(url.pathname==='/preflight/frame.html'){res.writeHead(200,{'Content-Type':'text/html',...headers});res.end('<!doctype html><title>Player</title><video controls src="/media/high.mp4"></video>');return true;}
 if(url.pathname==='/preflight/native-guard.html'){res.writeHead(200,{'Content-Type':'text/html',...headers});res.end('<!doctype html><title>Changed source fixture</title><a href="/preflight/changes.mp4">Session video</a>');return true;}
 if(url.pathname==='/preflight/dynamic.html'){res.writeHead(200,{'Content-Type':'text/html',...headers});res.end('<!doctype html><title>Dynamic endpoint fixture</title><a href="/preflight/dynamic.php?file=course.mp4">Dynamic original</a>');return true;}
 if(url.pathname==='/preflight/changes.mp4'&&!req.headers.range){res.writeHead(200,{'Content-Type':'text/html',...headers});res.end('<!doctype html><title>Expired after the sample</title>');return true;}
 if(url.pathname==='/preflight/master.m3u8'){res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl',...headers});res.end('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1920x1080\nbad.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=720x404\n/hls-high/index.m3u8\n');return true;}
 if(url.pathname==='/preflight/bad.m3u8'){res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl',...headers});res.end('<!doctype html><title>Session</title>');return true;}
 const range=req.headers.range;requests.push({path:url.pathname,range:range??null});if(requests.length>128)requests.shift();
 if(range){active++;maximum=Math.max(maximum,active);await new Promise(resolve=>setTimeout(resolve,120));active--;}
 if(url.pathname==='/preflight/lesson-720p.mp4'){res.writeHead(404,headers);res.end();return true;}
 if(url.pathname==='/preflight/unconfirmed.mp4'){res.writeHead(302,{Location:'/media/high.mp4',...headers});res.end();return true;}
 let bytes,mime='video/mp4';
 if(url.pathname==='/preflight/lesson-1080p.mp4')bytes=Buffer.from('<!doctype html><html><title>Not a video</title></html>'+'.'.repeat(16384));
 else if(url.pathname==='/preflight/tiny.mp4')bytes=Buffer.from([0,0,0,24,102,116,121,112,105,115,111,109,...Array(20).fill(0)]);
 else if(['/preflight/lesson-404p.mp4','/preflight/changes.mp4','/preflight/dynamic.php'].includes(url.pathname))bytes=await readFile('fixtures/media/high.mp4');
 else{res.writeHead(404,headers);res.end();return true;}
 const match=/^bytes=(\d+)-(\d+)$/.exec(range??'');let start=0,end=bytes.length-1;if(match){start=Number(match[1]);end=Math.min(end,Number(match[2]));}
 res.writeHead(match?206:200,{'Content-Type':mime,'Content-Length':end-start+1,...headers,...(match?{'Content-Range':`bytes ${start}-${end}/${bytes.length}`}:{})});res.end(bytes.subarray(start,end+1));return true;
}
