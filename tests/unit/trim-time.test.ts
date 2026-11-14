import{describe,it,expect}from'vitest';import{formatTrimTime,parseTrimTime,validTrimRange}from'../../apps/extension/src/trim-time';
describe('precise trim-time entry',()=>{
 it.each([
  ['0',0],['1',1],['1.125',1.125],['1,125',1.125],['.5',.5],[',05',.05],['0:01.125',1.125],['1:02',62],['1:02,5',62.5],['120:00',7200],['1:02:03.456',3723.456],[' 1 : 02 : 03,001 ',3723.001],['00:00:00.001',.001],['٠:٠١٫٥٠٠',1.5],['۰:۰۱٫۵۰۰',1.5],['०:०१.५००',1.5],['１：０２．５００',62.5],
 ])('parses %s as %s seconds without decimal drift',(text,seconds)=>expect(parseTrimTime(text)).toBe(seconds));
 it.each(['',' ','1:','1.','0:','1:60','1:60:00','1:00:60','1::02','1:02:03:04','-1','-0:01','1e2','Infinity','NaN','1.1234','1.2,3','.','1:.5','one','2 000','9007199254740992','0'.repeat(33)])('keeps incomplete or invalid %j uncommitted',text=>expect(parseTrimTime(text)).toBeUndefined());
 it.each([[0,'0:00'],[1,'0:01'],[1.001,'0:01.001'],[62.5,'1:02.500'],[3600,'1:00:00'],[3723.456,'1:02:03.456'],[6.016666,'0:06.016']])('formats %s at millisecond precision',(time,text)=>expect(formatTrimTime(Number(time))).toBe(text));
 it('keeps hour columns for a long source and rejects invalid display values',()=>{expect(formatTrimTime(62.5,true)).toBe('0:01:02.500');for(const value of [-1,NaN,Infinity])expect(formatTrimTime(value)).toBe('');});
 it('validates a coherent in-bounds pair without clamping or swapping user values',()=>{
  expect(validTrimRange(1.125,3.875,6)).toBe(true);expect(validTrimRange(0,6,6)).toBe(true);expect(validTrimRange(0,6.049,6.0489999999999995)).toBe(true);
  for(const[start,end,length]of [[undefined,3,6],[0,undefined,6],[-1,3,6],[3,1,6],[3,3,6],[0,6.001,6],[0,1,0],[0,Infinity,6],[NaN,3,6]])expect(validTrimRange(start,end,length!)).toBe(false);
 });
});
