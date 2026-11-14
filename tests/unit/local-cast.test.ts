import{describe,test,expect,vi}from'vitest';
import{localFileUrl,LocalCast,type LocalRemote,type LocalCastState}from'../../packages/media-core/local-cast';
describe('Chrome-owned local file paths',()=>{
 test('encodes Windows and POSIX filenames without turning punctuation into queries or fragments',()=>{
  expect(localFileUrl('C:\\Users\\A B\\Downloads\\épisode #1%.mp4')).toBe('file:///C:/Users/A%20B/Downloads/%C3%A9pisode%20%231%25.mp4');
  expect(localFileUrl('/tmp/a?b#c.mp4')).toBe('file:///tmp/a%3Fb%23c.mp4');
 });
 test.each(['relative.mp4','https://host/movie.mp4','\\\\server\\share\\movie.mp4','//server/share/movie.mp4','C:\\a\\..\\secret.mp4','/tmp/./movie.mp4','/tmp/a\0.mp4'])('refuses nonlocal, ambiguous or invalid path %s',path=>expect(()=>localFileUrl(path)).toThrow('tvFilePath'));
});
class Remote extends EventTarget implements LocalRemote{state='disconnected';prompt=vi.fn(()=>Promise.resolve());}
test('calls prompt synchronously but keeps a resolved disconnected request as an unconfirmed connection',async()=>{
 const remote=new Remote(),states:LocalCastState[]=[],session=new LocalCast(remote,s=>states.push(s));const pending=session.choose();expect(remote.prompt).toHaveBeenCalledTimes(1);expect(states[0]?.phase).toBe('choosing');await pending;expect(states).toEqual([{phase:'choosing'},{phase:'error',error:'tvNoConnection'}]);expect(remote.state).toBe('disconnected');session.dispose();
});
test.each([
 ['AbortError','Failed to connect to the remote device.'],
 ['NotAllowedError','The prompt was dismissed.'],
])('reports native %s without assuming that a receiver picker opened or retrying',async(name,message)=>{
 const remote=new Remote(),states:LocalCastState[]=[],session=new LocalCast(remote,s=>states.push(s));
 remote.prompt.mockRejectedValue(new DOMException(message,name));
 await session.choose();
 expect(states).toEqual([{phase:'choosing'},{phase:'error',error:'tvNoConnection'}]);
 expect(remote.state).toBe('disconnected');expect(remote.prompt).toHaveBeenCalledTimes(1);session.dispose();
});
test('connected state comes from native connection state, not promise resolution or local playback',async()=>{
 const remote=new Remote(),states:LocalCastState[]=[],session=new LocalCast(remote,s=>states.push(s));remote.prompt.mockImplementation(async()=>{remote.state='connecting';remote.dispatchEvent(new Event('connecting'));});await session.choose();expect(states.at(-1)?.phase).toBe('connecting');remote.state='connected';remote.dispatchEvent(new Event('connect'));expect(states.at(-1)?.phase).toBe('connected');remote.state='disconnected';remote.dispatchEvent(new Event('disconnect'));expect(states.at(-1)?.phase).toBe('disconnected');session.dispose();
});
test.each([['NotFoundError','tvNoDevice'],['NotSupportedError','tvNotSupported'],['NotAllowedError','tvNoConnection']])('native %s remains a visible failure',async(name,code)=>{
 const remote=new Remote(),states:LocalCastState[]=[],session=new LocalCast(remote,s=>states.push(s));remote.prompt.mockRejectedValue(new DOMException(name==='NotAllowedError'?'The prompt was dismissed.':'private path not to expose',name));await session.choose();expect(states.at(-1)).toEqual({phase:'error',error:code});session.dispose();
});
test('pending selection cannot be duplicated and a disposed player ignores late results/events',async()=>{
 const remote=new Remote(),states:LocalCastState[]=[];let done!:()=>void;remote.prompt.mockImplementation(()=>new Promise(resolve=>{done=resolve;}));const session=new LocalCast(remote,s=>states.push(s)),pending=session.choose();await session.choose();expect(remote.prompt).toHaveBeenCalledTimes(1);session.dispose();remote.state='connected';remote.dispatchEvent(new Event('connect'));done();await pending;expect(states).toEqual([{phase:'choosing'}]);
});
