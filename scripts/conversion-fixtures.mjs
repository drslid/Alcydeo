import {spawnSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
const ffmpeg=process.env.FFMPEG_FOR_FIXTURES;
if(!ffmpeg)throw new Error('Set FFMPEG_FOR_FIXTURES to a development-only encoder; no encoder is installed or shipped.');
await mkdir('fixtures/conversion',{recursive:true});
const run=args=>{const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});if(r.status)throw new Error('Original conversion fixture generation failed');};
run(['-i','fixtures/media/high.mp4','-c','copy','fixtures/conversion/copy.mkv']);
run(['-i','fixtures/media/high.mp4','-c','copy','fixtures/conversion/copy.mov']);
run(['-i','fixtures/media/high.mp4','-c:v','libvpx','-deadline','realtime','-cpu-used','6','-b:v','600k','-c:a','libopus','-b:a','64000','fixtures/conversion/transcode.webm']);
run(['-i','fixtures/media/high.mp4','-c:v','mpeg4','-q:v','5','-c:a','copy','fixtures/conversion/unsupported.mkv']);
run(['-f','lavfi','-i','testsrc2=size=1280x720:rate=24','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','2','-c:v','libx264','-preset','ultrafast','-crf','24','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','fixtures/conversion/settings.mp4']);
if(process.argv.includes('--long')){await mkdir('artifacts',{recursive:true});run(['-stream_loop','9','-i','fixtures/media/high.mp4','-t','60','-vf','scale=1280:720','-c:v','libvpx','-deadline','realtime','-cpu-used','6','-b:v','1200k','-threads','2','-c:a','libopus','-b:a','64000','artifacts/conversion-long.webm']);}
console.log('Original conversion fixtures regenerated; optional long case stays in ignored artifacts.');
