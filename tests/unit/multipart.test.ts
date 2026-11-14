import{describe,it,expect,vi,afterEach}from'vitest';
vi.mock('../../packages/media-core/network',()=>({mediaFetch:vi.fn()}));
vi.mock('../../packages/storage',()=>({changeTask:vi.fn()}));
import{mediaFetch}from'../../packages/media-core/network';
import type{Task}from'../../packages/contracts';
import{multipartFile,divideRanges,rangeInfo,strongEtag}from'../../packages/media-core/multipart';
afterEach(()=>{vi.unstubAllGlobals();});
describe('direct byte ranges',()=>{
 it.each([2,4,8])('covers an uneven file exactly once with %i connections',count=>{const parts=divideRanges(1837555,count);expect(parts).toHaveLength(count);expect(parts[0]?.start).toBe(0);expect(parts.at(-1)?.end).toBe(1837554);expect(parts.reduce((sum,p)=>sum+p.end-p.start+1,0)).toBe(1837555);for(let i=1;i<parts.length;i++)expect(parts[i]?.start).toBe(parts[i-1]!.end+1);});
 it('supports sizes above 2 GiB without 32-bit arithmetic',()=>{const p=divideRanges(5_000_000_003,8);expect(p.at(-1)?.end).toBe(5_000_000_002);expect(p[1]?.start).toBe(625000001);});
 it.each([0,-1,NaN,1.5,Number.MAX_SAFE_INTEGER+1])('rejects invalid size %s',size=>expect(()=>divideRanges(size,4)).toThrow('invalid'));
 it('does not create empty or unsupported ranges',()=>{expect(divideRanges(1,8)).toEqual([{start:0,end:0,received:0}]);expect(()=>divideRanges(10,16)).toThrow('invalid');});
 it.each([null,'W/"weak"','unquoted','"bad\r\n"'])('does not trust weak or invalid validator %s',value=>expect(strongEtag(value)).toBe(false));
 it('uses an exact strong validator and bounded Content-Range',()=>{expect(strongEtag('"exact-hash"')).toBe(true);expect(rangeInfo('bytes 10-20/100')).toEqual({start:10,end:20,total:100});for(const value of ['bytes 0-0/*','bytes 5-2/10','bytes 0-10/10','bytes 0-0/0','bytes 0-0/9007199254740992'])expect(rangeInfo(value)).toBeUndefined();});
});

it('simulated quota refusal closes the OPFS handle before fetching any file parts',async()=>{
 const task={id:'quota',media:{kind:'direct'},variant:{url:'https://media.example.test/movie.mp4'},transfer:{mode:'multipart',connections:4}} as Task;const access={getSize:()=>0,truncate:vi.fn(),flush:vi.fn(),close:vi.fn()};const dir={getFileHandle:async()=>({createSyncAccessHandle:async()=>access})} as unknown as FileSystemDirectoryHandle;
 vi.stubGlobal('navigator',{storage:{estimate:async()=>({quota:4*1024*1024,usage:0})}});vi.mocked(mediaFetch).mockReset().mockResolvedValue(new Response('x',{status:206,headers:{'Content-Range':'bytes 0-0/2000000','ETag':'"same-version"'}}));
 await expect(multipartFile(task,dir,new AbortController().signal)).rejects.toThrow('space');expect(mediaFetch).toHaveBeenCalledTimes(1);expect(access.truncate).not.toHaveBeenCalled();expect(access.close).toHaveBeenCalledTimes(1);
});
