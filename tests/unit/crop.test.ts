import{describe,it,expect}from'vitest';
import{cropRegion}from'../../packages/media-core/crop';

describe('crop coordinates in the displayed video',()=>{
 it('keeps an offset rectangle exact instead of silently clamping it',()=>{
  expect(cropRegion({x:17,y:23,width:120,height:80},320,180)).toEqual({left:17,top:23,width:120,height:80});
 });
 it('permits the full image and odd origins or sizes without moving the selected region',()=>{
  expect(cropRegion({x:0,y:0,width:180,height:320},180,320)).toEqual({left:0,top:0,width:180,height:320});
  expect(cropRegion({x:3,y:5,width:79,height:61},180,320)).toEqual({left:3,top:5,width:79,height:61});
 });
 for(const crop of [undefined,null,{}, {x:-1,y:0,width:40,height:40},{x:0,y:-1,width:40,height:40},{x:0,y:0,width:0,height:40},{x:0,y:0,width:40,height:1},{x:0.5,y:0,width:40,height:40},{x:0,y:0,width:40.5,height:40},{x:281,y:0,width:40,height:40},{x:0,y:141,width:40,height:40},{x:0,y:0,width:Infinity,height:40},{x:NaN,y:0,width:40,height:40},{x:Number.MAX_SAFE_INTEGER,y:0,width:40,height:40}])
  it(`rejects an absent, noninteger or out-of-bounds rectangle ${JSON.stringify(crop)}`,()=>{expect(()=>cropRegion(crop,320,180)).toThrow('cropRange');});
 it('uses display dimensions after rotation, not the encoded landscape dimensions',()=>{
  expect(cropRegion({x:80,y:200,width:100,height:120},180,320)).toEqual({left:80,top:200,width:100,height:120});
  expect(()=>cropRegion({x:80,y:200,width:100,height:120},320,180)).toThrow('cropRange');
 });
 for(const [width,height]of[[0,180],[320,NaN],[Infinity,180],[320.5,180]])it('rejects invalid source dimensions',()=>{expect(()=>cropRegion({x:0,y:0,width:40,height:40},width,height)).toThrow('cropRange');});
});
