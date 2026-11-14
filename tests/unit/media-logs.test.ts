import{describe,it,expect,vi}from'vitest';
import{readFileSync}from'node:fs';
import{Logging,LogLevel}from'mediabunny';
import{mediaLogs}from'../../packages/media-core/media-logs';
import{prefixDimensions}from'../../packages/media-core/source-metadata';

describe('bounded metadata logging',()=>{
 it('reads real TS dimensions without turning timed ID3 metadata into a console warning',async()=>{
  const previous=Logging.level,warn=vi.spyOn(console,'warn').mockImplementation(()=>{});
  try{expect(await prefixDimensions(new Uint8Array(readFileSync('fixtures/hls-id3/segment-0.ts')))).toEqual({width:720,height:404});expect(warn.mock.calls.filter(args=>String(args[0]).includes('stream_type 0x15'))).toEqual([]);expect(Logging.level).toBe(previous);}finally{warn.mockRestore();Logging.level=previous;}
 });
 it('keeps the shared filter until the last scope closes and disposes idempotently',()=>{
  const previous=Logging.level;Logging.level=LogLevel.Info;const first=mediaLogs(),second=mediaLogs();
  try{first.dispose();expect(Logging.level).toBe(LogLevel.Errors);first.dispose();expect(Logging.level).toBe(LogLevel.Errors);second.dispose();expect(Logging.level).toBe(LogLevel.Info);}finally{first.dispose();second.dispose();Logging.level=previous;}
 });
 it('keeps a real unsupported codec warning visible exactly once during overlapping metadata scopes',async()=>{
  const previous=Logging.level;Logging.level=LogLevel.Info;const warn=vi.spyOn(console,'warn').mockImplementation(()=>{}),first=mediaLogs(),second=mediaLogs();
  try{first.dispose();expect(await prefixDimensions(new Uint8Array(readFileSync('fixtures/unsupported-ts/source.ts')))).toBeUndefined();expect(warn.mock.calls.filter(args=>String(args[0]).includes('stream_type 0x2'))).toHaveLength(1);expect(()=>second.check()).toThrow('codec');}finally{first.dispose();second.dispose();warn.mockRestore();Logging.level=previous;}
 });
});
