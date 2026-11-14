import{afterEach,describe,expect,it,vi}from'vitest';
import{castWebReady}from'../../apps/extension/src/cast-web';
const page='http://localhost:4180/alcydeo/cast/';
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
describe('bounded Cast sender readiness',()=>{
 it('requires the current protocol from the approved static endpoint without cookies or redirects',async()=>{
  const fetcher=vi.fn(async()=>new Response(JSON.stringify({app:'alcydeo-cast-web',protocol:2})));vi.stubGlobal('fetch',fetcher);
  expect(await castWebReady(page)).toBe(true);const[url,options]=fetcher.mock.calls[0]! as unknown as[URL,RequestInit];expect(url.href).toBe(page+'ready.json');expect(options).toMatchObject({credentials:'omit',redirect:'error',cache:'no-store'});expect(options.signal?.aborted).toBe(true);
 });
 it('rejects old protocols, offline or refused redirects, and bodies over2KiB',async()=>{
  let cancelled=false;vi.stubGlobal('fetch',vi.fn(async()=>new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array(2049));},cancel(){cancelled=true;}}))));expect(await castWebReady(page)).toBe(false);expect(cancelled).toBe(true);
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({app:'alcydeo-cast-web',protocol:1}))));expect(await castWebReady(page)).toBe(false);
  vi.stubGlobal('fetch',vi.fn(async()=>{throw new TypeError('Network or redirect rejected');}));expect(await castWebReady(page)).toBe(false);
 });
 it('aborts a stalled readiness fetch after800ms instead of blocking the Cast action',async()=>{
  vi.useFakeTimers();let signal:AbortSignal|undefined;vi.stubGlobal('fetch',vi.fn((_url:URL,options:RequestInit)=>new Promise((_resolve,reject)=>{signal=options.signal as AbortSignal;signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});})));
  let settled=false;const result=castWebReady(page).then(value=>{settled=true;return value;});await vi.advanceTimersByTimeAsync(799);expect(settled).toBe(false);await vi.advanceTimersByTimeAsync(1);expect(await result).toBe(false);expect(signal?.aborted).toBe(true);
 });
});
