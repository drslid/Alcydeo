import{beforeEach,afterEach,describe,it,expect,vi}from'vitest';
import type{Media,Task,SourceCheck}from'../../packages/contracts';
const mocks=vi.hoisted(()=>({api:vi.fn(),ready:vi.fn()}));
vi.mock('../../apps/extension/src/api',()=>({api:mocks.api}));
vi.mock('../../apps/extension/src/i18n',()=>({language:{value:'fr'}}));
vi.mock('../../apps/extension/src/cast-web',async()=>({...await vi.importActual('../../apps/extension/src/cast-web'),castSenderPage:'http://localhost:4180/alcydeo/cast/',castWebReady:mocks.ready}));
import{quickCast}from'../../apps/extension/src/quick-cast';
const page='https://example.test/post/123',url='https://cdn.example.test/video.mp4?signature=keep%2B%2F';
let current:Media,task:Task,tab:{id:number;url:string;incognito:boolean},check:SourceCheck,onCheck:()=>void;
let create:ReturnType<typeof vi.fn>,native:ReturnType<typeof vi.fn>,download:ReturnType<typeof vi.fn>;
beforeEach(()=>{
 current={id:'media',tabId:7,frameId:3,pageUrl:page,title:'Original',url,kind:'direct',providerId:'example:123',variants:[{id:'720',url,label:'720p',height:720,check:{state:'ready',checkedAt:100,contentType:'video/mp4'}}]};
 task={id:'saved',media:structuredClone(current),variant:structuredClone(current.variants[0]!),title:'Original',saved:true,state:'completed',createdAt:1,updatedAt:2,bytes:100,progress:1,checkpoints:{}};
 tab={id:7,url:page,incognito:false};check={state:'ready',checkedAt:100};onCheck=()=>{};
 mocks.api.mockReset().mockImplementation(async(type:string)=>{if(type==='snapshot')return{media:[structuredClone(current)],tasks:[structuredClone(task)]};if(type==='checkSource'){onCheck();return check;}throw Error('Unexpected API '+type);});mocks.ready.mockReset().mockResolvedValue(true);
 create=vi.fn(async()=>({id:99}));native=vi.fn(async()=>({setup:true}));download=vi.fn();
 vi.stubGlobal('chrome',{tabs:{create,get:vi.fn(async(id:number)=>id===7?{...tab}:{id:99,status:'complete'}),update:vi.fn(async()=>({}))},runtime:{getURL:(path:string)=>'chrome-extension://alcydeo'+path,sendMessage:native},downloads:{download}});
});
afterEach(()=>vi.unstubAllGlobals());
const opened=()=>new URL(create.mock.calls[0]![0].url);
function expectFileFallback(){const target=opened();expect(target.protocol).toBe('chrome-extension:');expect(target.searchParams.get('taskId')).toBe('saved');expect(create.mock.calls[0]![0].active).toBe(true);expect(native).not.toHaveBeenCalled();expect(download).not.toHaveBeenCalled();}
describe('Cast from the library',()=>{
 it('opens the checked current source of an original download with an explicit source flag',async()=>{await quickCast({taskId:'saved'});const target=opened(),value=JSON.parse(decodeURIComponent(target.hash.slice(1)));expect(target.origin+target.pathname).toBe('http://localhost:4180/alcydeo/cast/');expect(target.search).toBe('');expect(value).toMatchObject({downloadSource:true,media:{url,mime:'video/mp4'}});expect(value.media.downloadSource).toBeUndefined();expect(native).not.toHaveBeenCalled();expect(download).not.toHaveBeenCalled();});
 it('keeps a refreshed URL only after it has a current ready proof',async()=>{onCheck=()=>{current.variants[0]!.url='https://cdn.example.test/video.mp4?signature=fresh%2B%2F';current.variants[0]!.check={state:'ready',checkedAt:110,contentType:'video/mp4'};};await quickCast({taskId:'saved'});expect(JSON.parse(decodeURIComponent(opened().hash.slice(1))).media.url).toBe('https://cdn.example.test/video.mp4?signature=fresh%2B%2F');});
 it('does not reuse an old ready snapshot after a fresh refusal',async()=>{check={state:'unavailable',checkedAt:110,error:'expired'};await quickCast({taskId:'saved'});expectFileFallback();});
 it('does not use a newer refusal or an older proof after the check returns ready',async()=>{for(const latest of[{state:'unavailable' as const,checkedAt:110},{state:'ready' as const,checkedAt:90}]){create.mockClear();check={state:'ready',checkedAt:100};onCheck=()=>{current.variants[0]!.check=latest;};await quickCast({taskId:'saved'});expectFileFallback();}});
 it('rechecks the tab page after asynchronous source validation',async()=>{onCheck=()=>{tab.url=page+'/next';};await quickCast({taskId:'saved'});expectFileFallback();});
 it('rechecks task provenance and frame after asynchronous source validation',async()=>{for(const changed of['conversion','frame']as const){create.mockClear();onCheck=()=>{if(changed==='conversion')task.conversion={input:'in',inputBytes:100,ready:true,sourceTaskId:'original',operation:{kind:'trim',start:0,end:1}};else current.frameId=4;};await quickCast({taskId:'saved'});expectFileFallback();delete task.conversion;current.frameId=3;}});
 it('keeps edited files and captures in the explicit local-file workflow',async()=>{for(const extra of[{conversion:{input:'in',inputBytes:100,ready:true}},{recording:{file:'capture.webm',active:false,startedAt:1}},{live:{url,active:false,startedAt:1,bytes:100,segments:1,duration:1}}]){create.mockClear();const original=structuredClone(task);Object.assign(task,extra);await quickCast({taskId:'saved'});expectFileFallback();task=original;}expect(mocks.api.mock.calls.some(([type])=>type==='checkSource')).toBe(false);});
 it('opens the local file explicitly if its original tab has closed',async()=>{vi.mocked(chrome.tabs.get).mockRejectedValueOnce(Error('No tab'));await quickCast({taskId:'saved'});expectFileFallback();});
 it('keeps the popup source handoff distinct from a download source',async()=>{await quickCast({sourceTabId:7,mediaId:'media',variantId:'720'});const value=JSON.parse(decodeURIComponent(opened().hash.slice(1)));expect(value.downloadSource).toBeUndefined();expect(value.media.url).toBe(url);expect(native).not.toHaveBeenCalled();});
});
