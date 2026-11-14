import{describe,it,expect}from'vitest';
import{remotePlaybackError}from'../../packages/media-core/remote-playback';
import catalogs from'../../packages/i18n/catalogs.json';
describe('remote playback diagnostics',()=>{
 it('keeps a native connection failure distinct from evidence of a closed selector',()=>{
  expect(remotePlaybackError(new DOMException('Failed to connect to the remote device.','AbortError'))).toBe('tvNoConnection');
 });
 it('keeps the dismissed diagnostic safe when Chromium had no presentation URL and opened no selector',()=>{
  expect(remotePlaybackError(new DOMException('The prompt was dismissed.','NotAllowedError'))).toBe('tvNoConnection');
 });
 it.each([
  ['fr','Chrome n’a pas pu communiquer avec le récepteur. Vérifiez sa compatibilité ou diffusez l’onglet depuis le menu Chrome.'],
  ['en','Chrome could not communicate with the receiver. Check compatibility or cast the tab from Chrome’s menu.'],
 ]as const)('renders a neutral %s receiver diagnostic for both failed connection and native dismissal', (locale,expected)=>{
  for(const[name,message]of [['AbortError','Failed to connect to the remote device.'],['NotAllowedError','The prompt was dismissed.']]){
   const code=remotePlaybackError(new DOMException(message,name));
   expect(code).toBe('tvNoConnection');expect(catalogs[locale][code]).toBe(expected);
  }
 });
 it('distinguishes missing receivers, blocked selection, expired activation and another open picker',()=>{
  for(const[name,code]of [['NotFoundError','tvNoDevice'],['NotAllowedError','tvPermission'],['InvalidAccessError','tvActivation'],['OperationError','tvBusy'],['NotSupportedError','tvNotSupported']])expect(remotePlaybackError({name,message:'diagnostic'})).toBe(code);
 });
 it('does not pass arbitrary browser exception messages or signed source URLs to the interface',()=>{
  expect(remotePlaybackError(new Error('https://private.example/video.mp4?token=do-not-export'))).toBe('tvNotSupported');
 });
});
