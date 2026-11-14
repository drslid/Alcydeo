import{describe,expect,it,vi}from'vitest';
import{readFileSync}from'node:fs';
import{prefixDimensions,responseSize,sampleResponseSize}from'../../packages/media-core/source-metadata';

describe('complete HTTP representation size',()=>{
 it.each([
  [200,{'Content-Length':'500000'},500000],
  [200,{'Content-Length':'500000','Content-Encoding':'identity'},500000],
  [206,{'Content-Range':'bytes 10-19/500000','Content-Length':'10'},500000],
  [206,{'Content-Range':'bytes 10-19/500000'},500000],
  [206,{'Content-Range':'bytes 10-19/*','Content-Length':'10'},undefined],
  [206,{'Content-Length':'10'},undefined],
  [206,{'Content-Range':'bytes 10-19/19','Content-Length':'10'},undefined],
  [206,{'Content-Range':'bytes 10-9/500000','Content-Length':'0'},undefined],
  [206,{'Content-Range':'bytes 10-19/500000','Content-Length':'11'},undefined],
  [206,{'Content-Range':'bytes 10-19/500000','Content-Length':''},undefined],
  [206,{'Content-Range':'bytes 10-19/9007199254740992'},undefined],
  [206,{'Content-Range':'bytes 9007199254740992-9007199254740993/*'},undefined],
  [206,{'Content-Range':'bytes 10-19/500000','Content-Encoding':'br'},undefined],
  [200,{'Content-Length':'500000','Content-Encoding':'gzip'},undefined],
  [200,{'Content-Range':'bytes 0-9/500000','Content-Length':'10'},undefined],
  [200,{'Content-Length':'1e6'},undefined],
  [200,{'Content-Length':'12.5'},undefined],
  [200,{'Content-Length':'-12'},undefined],
  [200,{'Content-Length':'0'},undefined],
  [200,{'Content-Length':''},undefined],
  [200,{'Content-Length':'9007199254740992'},undefined],
  [404,{'Content-Length':'10'},undefined],
 ])('validates status %i with headers %j', (status,headers,expected)=>{
  expect(responseSize(Number(status),new Headers(headers as Record<string,string>))).toBe(expected);
 });
 it('requires a sampled range to fit the exact requested window',()=>{
  expect(sampleResponseSize(206,new Headers({'Content-Range':'bytes 10-19/500000'}),10,19)).toEqual({size:500000,length:10});
  expect(()=>sampleResponseSize(206,new Headers({'Content-Range':'bytes 11-19/500000'}),10,19)).toThrow('range');
  expect(()=>sampleResponseSize(206,new Headers({'Content-Range':'bytes 10-20/500000'}),10,19)).toThrow('range');
  expect(()=>sampleResponseSize(200,new Headers({'Content-Length':'500000'}),10,19)).toThrow('range');
 });
});

describe('prefix-only dimensions',()=>{
 it('never fetches missing MP4 metadata beyond the existing 4K prefix',async()=>{
  const request=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('unexpected fetch'));
  try{expect(await prefixDimensions(new Uint8Array(readFileSync('fixtures/media/high.mp4')))).toBeUndefined();expect(request).not.toHaveBeenCalled();}finally{request.mockRestore();}
 });
 it('does not misread a standalone media fragment as initialized video metadata',async()=>{
  expect(await prefixDimensions(new Uint8Array(readFileSync('fixtures/cmaf/piece-0.m4s')))).toBeUndefined();
 });
 it.each([new Uint8Array(),new Uint8Array([0,0,0,24,102,116,121,112]),new Uint8Array(4096)])('leaves insufficient or unrecognized metadata unknown',async bytes=>{
  expect(await prefixDimensions(bytes)).toBeUndefined();
 });
});
