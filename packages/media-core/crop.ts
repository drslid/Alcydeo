import type{CropRectangle}from'mediabunny';

// Mediabunny crops after the source's rotation/flip, in displayed pixels,
// before resizing: https://mediabunny.dev/guide/converting-media-files#cropping-video
// Reject an invalid selection instead of relying on the library's silent clamp.
export function cropRegion(value:unknown,width:number,height:number):CropRectangle{
 const crop=value as {x?:number;y?:number;width?:number;height?:number}|undefined;
 if(!crop||![width,height,crop.x,crop.y,crop.width,crop.height].every(Number.isSafeInteger)||width<2||height<2||crop.x!<0||crop.y!<0||crop.width!<2||crop.height!<2||crop.width!>width-crop.x!||crop.height!>height-crop.y!)throw new Error('cropRange');
 return{left:crop.x!,top:crop.y!,width:crop.width!,height:crop.height!};
}
