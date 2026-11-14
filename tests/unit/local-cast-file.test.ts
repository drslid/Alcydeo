import{afterEach,test,expect,vi}from'vitest';
import{saveCastCopy,downloadedFileUrl}from'../../apps/extension/src/local-cast-file';
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
function browser(){
 const listeners=new Set<(delta:any)=>void>(),search=vi.fn().mockResolvedValue([{id:9,state:'complete',exists:true,filename:'/tmp/My course.mp4'}]),download=vi.fn().mockResolvedValue(9),cancel=vi.fn().mockResolvedValue(undefined);
 vi.stubGlobal('chrome',{downloads:{search,download,cancel,onChanged:{addListener:(fn:(delta:any)=>void)=>listeners.add(fn),removeListener:(fn:(delta:any)=>void)=>listeners.delete(fn)}}});return{search,download,cancel,listeners};
}
test('a completed browser copy retains bytes and filename, resolves its local path and releases its Blob URL',async()=>{
 const api=browser(),revoke=vi.spyOn(URL,'revokeObjectURL'),file=new File(['original selected bytes'],'My course.mp4',{type:'video/mp4'}),result=await saveCastCopy(file,new AbortController().signal);
 expect(result).toEqual({url:'file:///tmp/My%20course.mp4',id:9});expect(api.download.mock.calls[0]![0]).toMatchObject({filename:'Alcydeo/Cast/My course.mp4',saveAs:true,conflictAction:'uniquify'});expect(revoke).toHaveBeenCalledWith(api.download.mock.calls[0]![0].url);expect(api.listeners.size).toBe(0);expect(await file.text()).toBe('original selected bytes');expect(api.cancel).not.toHaveBeenCalled();
});
test('closing a player while Save as is open cancels a late accepted copy, without touching another download',async()=>{
 const api=browser(),revoke=vi.spyOn(URL,'revokeObjectURL');let chosen!:(id:number)=>void;api.download.mockImplementation(()=>new Promise(resolve=>{chosen=resolve;}));const signal=new AbortController(),copy=saveCastCopy(new File(['video'],'movie.mp4'),signal.signal);signal.abort();chosen(17);await expect(copy).rejects.toThrow('cancelled');expect(api.cancel).toHaveBeenCalledExactlyOnceWith(17);expect(revoke).toHaveBeenCalledTimes(1);expect(api.listeners.size).toBe(0);
});
test('an interrupted disk copy fails and unsubscribes instead of casting an incomplete file',async()=>{
 const api=browser(),revoke=vi.spyOn(URL,'revokeObjectURL');api.search.mockResolvedValue([{id:9,state:'interrupted',exists:false}]);await expect(saveCastCopy(new File(['video'],'movie.mp4'),new AbortController().signal)).rejects.toThrow('tvFileCopyFailed');expect(api.listeners.size).toBe(0);expect(revoke).toHaveBeenCalledTimes(1);
});
test('existing files must be complete and present; network shares never become native Cast sources',async()=>{
 const api=browser();for(const item of [undefined,{state:'in_progress'},{state:'complete',exists:false}]){api.search.mockResolvedValue(item?[item]:[]);await expect(downloadedFileUrl(8)).rejects.toThrow('tvFileChooseAgain');}api.search.mockResolvedValue([{state:'complete',exists:true,filename:'\\\\server\\share\\movie.mp4'}]);await expect(downloadedFileUrl(8)).rejects.toThrow('tvFilePath');expect(api.download).not.toHaveBeenCalled();
});
