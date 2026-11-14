import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const encoder=process.env.FFMPEG_FOR_FIXTURES;if(!encoder)throw new Error('Set development-only FFMPEG_FOR_FIXTURES; never required by the extension.');
for(const dir of ['fixtures/hls-id3','fixtures/cmaf','fixtures/hls-ranges','fixtures/unsupported-ts'])await mkdir(dir,{recursive:true});
const crc=data=>{let result=0xffffffff;for(const b of data){result^=b<<24;for(let i=0;i<8;i++)result=((result<<1)^((result&0x80000000)?0x04c11db7:0))>>>0;}const bytes=Buffer.alloc(4);bytes.writeUInt32BE(result);return bytes;};
const sync=n=>Buffer.from([(n>>>21)&127,(n>>>14)&127,(n>>>7)&127,n&127]);
const text=Buffer.concat([Buffer.from([3]),Buffer.from('Alcydeo synthetic timed metadata')]);
const frame=Buffer.concat([Buffer.from('TIT2'),sync(text.length),Buffer.from([0,0]),text]);const tag=Buffer.concat([Buffer.from('ID3'),Buffer.from([4,0,0]),sync(frame.length),frame]);
const format=Buffer.from('ID3 ');
const pointer=Buffer.concat([Buffer.from([0x25,15,255,255]),format,Buffer.from([255]),format,Buffer.from([0,0x1f,0,1])]);
const descriptor=Buffer.concat([Buffer.from([0x26,13,255,255]),format,Buffer.from([255]),format,Buffer.from([0,0x0f])]);
for(let part=0;part<3;part++){
 const original=await readFile(`fixtures/hls-high/segment-${part}.ts`);const packets=[];let pts;
 for(let i=0;i<original.length;i+=188){const p=original.subarray(i,i+188);const pid=((p[1]&31)<<8)|p[2];const payload=4+((p[3]&0x20)?1+p[4]:0);if(pid===0x100&&(p[1]&64)){pts=Buffer.from(p.subarray(payload+9,payload+14));pts[0]=(pts[0]&15)|0x20;break;}}
 if(!pts||pts.length!==5)throw new Error('Missing synthetic video PTS');
 let inserted=false;
 for(let i=0;i<original.length;i+=188){const p=Buffer.from(original.subarray(i,i+188));const pid=((p[1]&31)<<8)|p[2];
  if(pid===0x1000&&(p[1]&64)){
   const payload=4+((p[3]&0x20)?1+p[4]:0),start=payload+1+p[payload];const length=((p[start+1]&15)<<8)|p[start+2];const section=p.subarray(start,start+3+length-4);if(section[0]!==2)throw new Error('Expected synthetic PMT');
   const programLength=((section[10]&15)<<8)|section[11];const prefix=Buffer.from(section.subarray(0,12));const info=Buffer.concat([section.subarray(12,12+programLength),pointer]);prefix[10]=0xf0|(info.length>>>8);prefix[11]=info.length&255;
   const stream=Buffer.concat([Buffer.from([0x15,0xe1,0xe0,0xf0,descriptor.length]),descriptor]);const body=Buffer.concat([prefix,info,section.subarray(12+programLength),stream]);const size=body.length+1;body[1]=(body[1]&0xf0)|(size>>>8);body[2]=size&255;
   const full=Buffer.concat([body,crc(body)]);if(start+full.length>188)throw new Error('Synthetic PMT exceeds one TS packet');p.fill(255,start);full.copy(p,start);packets.push(p);
   if(!inserted){const pesSize=8+tag.length;const pes=Buffer.concat([Buffer.from([0,0,1,0xbd,pesSize>>>8,pesSize&255,0x84,0x80,5]),pts,tag]);const data=Buffer.alloc(188,255);data.set([0x47,0x41,0xe0,0x30|(part&15)]);data[4]=183-pes.length;data[5]=0;pes.copy(data,188-pes.length);packets.push(data);inserted=true;}
  }else packets.push(p);
 }
 await writeFile(`fixtures/hls-id3/segment-${part}.ts`,Buffer.concat(packets));
}
await writeFile('fixtures/hls-id3/index.m3u8',await readFile('fixtures/hls-high/index.m3u8'));
const ff=args=>{const r=spawnSync(encoder,['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});if(r.status)throw new Error('Fixture encoding failed');};
ff(['-i','fixtures/media/high.mp4','-map','0:v','-map','0:a','-c','copy','-hls_time','2','-hls_list_size','0','-hls_segment_type','fmp4','-hls_segment_filename','fixtures/cmaf/piece-%d.m4s','fixtures/cmaf/index.m3u8']);
ff(['-i','fixtures/media/high.mp4','-map','0:v','-map','0:a','-c','copy','-hls_time','2','-hls_list_size','0','-hls_segment_type','fmp4','-hls_flags','single_file','-hls_segment_filename','fixtures/hls-ranges/shared.mp4','fixtures/hls-ranges/index.m3u8']);
ff(['-i','fixtures/media/low.mp4','-c:v','mpeg2video','-c:a','aac','-f','mpegts','fixtures/unsupported-ts/source.ts']);
await writeFile('fixtures/unsupported-ts/index.m3u8','#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXTINF:6,\nsource.ts\n#EXT-X-ENDLIST\n');
let opaque=await readFile('fixtures/cmaf/index.m3u8','utf8');for(const[a,b]of [['init.mp4','/opaque/a4c9.mp4'],['piece-0.m4s','/opaque/6b71.mp4'],['piece-1.m4s','/opaque/833e.mp4'],['piece-2.m4s','/opaque/c98a.mp4']])opaque=opaque.replace(a,b);
await writeFile('fixtures/opaque.m3u8',opaque);
await writeFile('fixtures/segmented.html','<!doctype html><html lang="en"><meta charset="utf-8"><title>Segmented media lab</title><a href="hls-id3/index.m3u8">Timed metadata lesson</a><a href="hls-ranges/index.m3u8">Byte range lesson</a><a href="unsupported-ts/index.m3u8">Unsupported video codec</a></html>');
await writeFile('fixtures/opaque-player.html','<!doctype html><html lang="en"><meta charset="utf-8"><title>Opaque segmented lesson</title><video id="player"></video><script>player.src=URL.createObjectURL(new Blob([], {type:"video/mp4"}));fetch("opaque.m3u8").then(r=>r.text()).then(text=>Promise.all([...text.matchAll(/(?:URI=")?(\\/opaque\\/[^\\s"]+)/g)].map(m=>fetch(m[1]).then(r=>r.arrayBuffer()))));</script></html>');
console.log('Original TS + timed ID3, opaque CMAF, single-file byte ranges and unsupported-codec fixtures prepared.');
