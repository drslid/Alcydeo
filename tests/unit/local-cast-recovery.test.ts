import{afterEach,describe,expect,it,vi}from'vitest';
import{taskCastFile}from'../../apps/extension/src/local-cast-file';
afterEach(()=>vi.unstubAllGlobals());
function downloads(items:Record<number,unknown>){const search=vi.fn(async({id}:{id:number})=>items[id]?[items[id]]:[]);vi.stubGlobal('chrome',{downloads:{search}});return search;}
const complete=(filename:string)=>({state:'complete',exists:true,filename});
describe('local Cast restores a verified Chrome file before using temporary media',()=>{
 it('prefers the original saved download to an old Cast copy',async()=>{const search=downloads({4:complete('/tmp/original.mp4'),9:complete('/tmp/old-copy.mp4')});await expect(taskCastFile({saved:true,downloadId:4,castDownloadId:9})).resolves.toEqual({id:4,url:'file:///tmp/original.mp4'});expect(search).toHaveBeenCalledExactlyOnceWith({id:4});});
 it('uses the Cast copy when the original is absent',async()=>{const search=downloads({9:complete('/tmp/copy.mp4')});await expect(taskCastFile({saved:true,downloadId:4,castDownloadId:9})).resolves.toEqual({id:9,url:'file:///tmp/copy.mp4'});expect(search.mock.calls.map(([value])=>value.id)).toEqual([4,9]);});
 it('does not let an interrupted original or unsafe path hide a valid copy',async()=>{for(const first of[{state:'interrupted',exists:true,filename:'/tmp/original.mp4'},complete('\\\\server\\share\\original.mp4')]){downloads({4:first,9:complete('/tmp/copy.mp4')});await expect(taskCastFile({saved:true,downloadId:4,castDownloadId:9})).resolves.toEqual({id:9,url:'file:///tmp/copy.mp4'});}});
 it('returns no native file when every record is absent, leaving OPFS restoration possible',async()=>{downloads({});await expect(taskCastFile({saved:true,downloadId:4,castDownloadId:9})).resolves.toBeUndefined();});
 it('ignores an unsaved original and does not query a duplicate ID twice',async()=>{let search=downloads({4:complete('/tmp/unfinished-original.mp4'),9:complete('/tmp/copy.mp4')});await expect(taskCastFile({saved:false,downloadId:4,castDownloadId:9})).resolves.toMatchObject({id:9});expect(search).toHaveBeenCalledExactlyOnceWith({id:9});search=downloads({});await expect(taskCastFile({saved:true,downloadId:4,castDownloadId:4})).resolves.toBeUndefined();expect(search).toHaveBeenCalledExactlyOnceWith({id:4});});
});
