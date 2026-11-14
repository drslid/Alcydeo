import type{Plan}from'./hls';

// Vidzy's observed player adds gk to its declared HLS/segment URLs. This is
// comparison data only: every actual request keeps the original signed URL.
function resource(value:string){
 const url=new URL(value);if(url.protocol!=='https:'||!/(^|\.)vidzy\.cc$/.test(url.hostname))return value;
 const parts=url.search.slice(1).split('&');if(parts.filter(p=>p.startsWith('gk=')).length!==1)return value;
 const query=parts.filter(p=>!p.startsWith('gk=')).join('&');return `${url.origin}${url.pathname}${query?'?'+query:''}${url.hash}`;
}
export const prefixIdentity=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes.slice()))).map(n=>n.toString(16).padStart(2,'0')).join('');

// A bounded catalog/sample identity, not a checksum of the complete video.
export async function hlsIdentity(plan:Plan,samples:string[]){
 if(plan.live||plan.tracks.some(t=>t.live)||!samples.length)return;
 const lines=[JSON.stringify(['hls-v1',plan.duration,samples])];let length=lines[0]!.length;
 for(const track of plan.tracks){lines.push(JSON.stringify([track.type,track.duration,track.segments.length]));
  for(const segment of track.segments){if(segment.url.length>8192)return;const line=JSON.stringify([resource(segment.url),segment.range?.start,segment.range?.length]);length+=line.length+1;if(length>262144)return;lines.push(line);}
 }
 return `hls-v1:${await prefixIdentity(new TextEncoder().encode(lines.join('\n')))}`;
}

// A standalone leaf is parsed as "combined" until its declared master supplies
// the role. Match the checked resource independently of that label; the master
// must still retain its complete ordered video/audio association.
export async function hlsTrackIdentities(plan:Plan,samples:string[][]){
 if(plan.live||!plan.tracks.length||plan.tracks.length>2||plan.tracks.some(t=>t.live)||samples.length!==plan.tracks.length||samples.some(s=>!s.length||s.length>2))return;
 const transcripts:string[][]=[];let length=0;
 for(const[index,track]of plan.tracks.entries()){
  const lines=[JSON.stringify(['hls-track-v1',track.duration,track.segments.length,samples[index]])];length+=lines[0]!.length;
  for(const segment of track.segments){if(segment.url.length>8192)return;const line=JSON.stringify([resource(segment.url),segment.range?.start,segment.range?.length]);length+=line.length+1;if(length>262144)return;lines.push(line);}
  transcripts.push(lines);
 }
 return Promise.all(transcripts.map(async lines=>`hls-track-v1:${await prefixIdentity(new TextEncoder().encode(lines.join('\n')))}`));
}
