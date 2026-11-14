import {describe,it,expect} from 'vitest';
import {directExtension,htmlResponse,mediaKind,networkMedia,responseFilename} from '../../packages/media-core/classification';
describe('response classification',()=>{
 it('keeps Matroska originals downloadable without relabelling them as MP4',()=>{const url='https://cdn.example.test/lesson.mkv?signature=keep';expect(directExtension(url,'application/octet-stream')).toBe('mkv');expect(directExtension('https://cdn.example.test/file','video/x-matroska')).toBe('mkv');expect(networkMedia(url,'application/octet-stream')).toBe(true);expect(networkMedia(url,'text/html')).toBe(false);});
 it.each(['text/html; charset=UTF-8','TEXT/HTML','application/xhtml+xml'])('rejects an HTML response advertised as %s',mime=>expect(htmlResponse(mime,'movie.mp4')).toBe(true));
 it('recognizes an HTML download filename even when its MIME is generic',()=>expect(htmlResponse('application/octet-stream','session.htm')).toBe(true));
 it('does not reject a media filename',()=>expect(htmlResponse('video/mp4','movie.mp4')).toBe(false));
 it('derives a real output extension from the response for dynamic media endpoints',()=>expect(directExtension('https://cdn.example.test/get.php?id=1','video/mp4; codecs="avc1"')).toBe('mp4'));
 it('uses manifest MIME for extensionless sources',()=>{expect(mediaKind('https://cdn.example.test/stream?id=1','application/vnd.apple.mpegurl')).toBe('hls');expect(mediaKind('https://cdn.example.test/stream','application/dash+xml')).toBe('dash');});
 it('never classifies an HTML page as a manifest based only on its suffix',()=>expect(networkMedia('https://cdn.example.test/fake.m3u8','text/html')).toBe(false));
 it.each([['https://cdn.example.test/part.ts?sig=a','video/mp2t'],['https://cdn.example.test/data','video/MP2T'],['https://cdn.example.test/chunk-1.mp4','video/mp4']])('excludes isolated segments %s', (url,mime)=>expect(networkMedia(url,mime)).toBe(false));
 it.each(['application/octet-stream','binary/octet-stream','application/binary',''])('recognizes a complete signed media path with generic type %s',mime=>expect(networkMedia('https://cdn.example.test/lesson.mp4?ff=original%2Bsignature',mime)).toBe(true));
 it.each(['https://cdn.example.test/api/video_proxy.php?file=/lesson.mp4','https://cdn.example.test/page.html?file=lesson.mp4','https://cdn.example.test/init-2.mp4','https://cdn.example.test/part.m4s'])('does not infer a complete binary source from %s',url=>expect(networkMedia(url,'application/octet-stream')).toBe(false));
 it.each(['text/plain','application/json','image/jpeg','text/html'])('does not override an explicit non-media type %s',mime=>expect(networkMedia('https://cdn.example.test/lesson.mp4',mime)).toBe(false));
 it('rejects an HTML filename in binary media headers',()=>expect(networkMedia('https://cdn.example.test/lesson.mp4','application/octet-stream','session.htm')).toBe(false));
 it('decodes a bounded Content-Disposition filename without reading a response body',()=>{expect(responseFilename('attachment; filename="session.htm"')).toBe('session.htm');expect(responseFilename("inline; filename=fallback.mp4; filename*=UTF-8''session%2Ehtml")).toBe('session.html');expect(responseFilename("inline; filename=fallback.mp4; filename*=UTF-8''%bad")).toBe('fallback.mp4');expect(responseFilename('x'.repeat(4097))).toBe('');});
 it('accepts byte-range responses for complete direct MP4 sources',()=>expect(networkMedia('https://cdn.example.test/course.mp4','video/mp4')).toBe(true));
});
