import{afterEach,beforeEach,describe,expect,it,vi}from'vitest';
import{clearCloudTemporary}from'../../packages/cloud/temporary';

const state=vi.hoisted(()=>({invalidated:false,inputFailure:undefined as Error|undefined}));
vi.mock('../../packages/cloud/storage',()=>({
 hasCloudOwner:vi.fn(),
 clearCloudInputs:vi.fn(async()=>{if(state.inputFailure)throw state.inputFailure;state.invalidated=true;}),
}));
let entries:Map<string,'directory'|'file'>,blocked:Set<string>,refused:Set<string>,missing:Set<string>,rootFailure:Error|undefined,listingFailure:Error|undefined;
beforeEach(()=>{
 state.invalidated=false;state.inputFailure=undefined;blocked=new Set();refused=new Set();missing=new Set();rootFailure=undefined;listingFailure=undefined;
 entries=new Map([['cloud-paused','directory'],['cloud-orphan','directory'],['library-original','directory'],['cloud-original.mp4','file']]);
 const root={
  async*entries(){if(listingFailure)throw listingFailure;for(const[name,kind]of entries)yield[name,{kind}]as const;},
  async removeEntry(name:string){if(refused.has(name))throw Object.assign(new Error('File locked'),{name:'NoModificationAllowedError'});entries.delete(name);if(missing.has(name))throw Object.assign(new Error('Already removed'),{name:'NotFoundError'});},
 };
 vi.stubGlobal('navigator',{
  locks:{request:async(name:string,_options:unknown,run:(lock:object|null)=>Promise<void>)=>run(blocked.has(name)?null:{})},
  storage:{getDirectory:async()=>{if(rootFailure)throw rootFailure;return root;}},
 });
});
afterEach(()=>vi.unstubAllGlobals());
describe('Cloud temporary cleanup',()=>{
 it('deletes only Cloud directories and tolerates an already removed copy',async()=>{
  missing.add('cloud-paused');await clearCloudTemporary();expect([...entries.keys()]).toEqual(['library-original','cloud-original.mp4']);expect(state.invalidated).toBe(true);
 });
 it.each(['alcydeo:cloud-upload','alcydeo:cloud-files'])('leaves inputs and all files intact when %s is busy',async lock=>{
  blocked.add(lock);const before=[...entries];await expect(clearCloudTemporary()).rejects.toThrow('cloudTemporaryBusy');expect([...entries]).toEqual(before);expect(state.invalidated).toBe(false);
 });
 it('preserves a live-lease refusal without deleting its input',async()=>{
  state.inputFailure=new Error('cloudTemporaryBusy');const before=[...entries];await expect(clearCloudTemporary()).rejects.toThrow('cloudTemporaryBusy');expect([...entries]).toEqual(before);expect(state.invalidated).toBe(false);
 });
 it('continues other deletions after a refused copy and permits a later retry',async()=>{
  refused.add('cloud-paused');await expect(clearCloudTemporary()).rejects.toThrow('cloudTemporaryFailed');expect([...entries.keys()]).toEqual(['cloud-paused','library-original','cloud-original.mp4']);expect(state.invalidated).toBe(true);
  refused.clear();await clearCloudTemporary();expect([...entries.keys()]).toEqual(['library-original','cloud-original.mp4']);
 });
 it('reports failure to open OPFS as cleanup failure and permits retry',async()=>{
  rootFailure=new Error('Storage root unavailable');await expect(clearCloudTemporary()).rejects.toThrow('cloudTemporaryFailed');expect(entries.has('cloud-paused')).toBe(true);
  rootFailure=undefined;await clearCloudTemporary();expect(entries.has('cloud-paused')).toBe(false);
 });
 it('reports a directory iterator failure as cleanup failure and permits retry',async()=>{
  listingFailure=new Error('Directory listing unavailable');await expect(clearCloudTemporary()).rejects.toThrow('cloudTemporaryFailed');expect(entries.has('cloud-paused')).toBe(true);
  listingFailure=undefined;await clearCloudTemporary();expect(entries.has('cloud-paused')).toBe(false);
 });
 it('reports failed input invalidation as cleanup failure without deleting files',async()=>{
  state.inputFailure=new Error('IndexedDB unavailable');const before=[...entries];await expect(clearCloudTemporary()).rejects.toThrow('cloudTemporaryFailed');expect([...entries]).toEqual(before);
 });
});
