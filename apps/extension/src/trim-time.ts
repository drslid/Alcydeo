const digits=(value:string)=>value.replace(/[\u0660-\u0669\u06f0-\u06f9\u0966-\u096f\uff10-\uff19]/g,c=>{const code=c.charCodeAt(0),zero=code>=0xff10?0xff10:code>=0x0966&&code<=0x096f?0x0966:code>=0x06f0?0x06f0:0x0660;return String(code-zero);}).replace(/[\u066b\uff0e]/g,'.').replace(/\uff0c/g,',').replace(/\uff1a/g,':');
export function parseTrimTime(input:string):number|undefined{
 if(input.length>32)return;const parts=digits(input).trim().split(':').map(p=>p.trim());if(!parts.length||parts.length>3)return;
 const seconds=parts.pop()!;if(!(/^(?:\d+(?:[.,]\d{1,3})?|[.,]\d{1,3})$/).test(seconds)||parts.length&&/^[.,]/.test(seconds))return;
 if(parts.some(p=>!/^\d+$/.test(p)))return;
 const [whole,fraction='']=seconds.replace(',','.').split('.'),tail=Number(whole||0)*1000+Number(fraction.padEnd(3,'0'));
 if(parts.length&&tail>=60000||parts.length===2&&Number(parts[1])>=60)return;
 const milliseconds=tail+(parts.length===2?Number(parts[0])*3600000+Number(parts[1])*60000:parts.length===1?Number(parts[0])*60000:0);
 return Number.isSafeInteger(milliseconds)&&milliseconds>=0?milliseconds/1000:undefined;
}
export function formatTrimTime(value:number,hours=false):string{
 if(!Number.isFinite(value)||value<0||!Number.isSafeInteger(Math.floor(value*1000)))return'';
 // Floor display precision so the full-duration endpoint never rounds outside
 // the file. Decimal entry itself is parsed as integer milliseconds above.
 const milliseconds=Math.floor(value*1000+0.000001),fraction=milliseconds%1000,total=Math.floor(milliseconds/1000),seconds=String(total%60).padStart(2,'0'),minutes=Math.floor(total/60),clock=hours||minutes>=60?`${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,'0')}:${seconds}`:`${minutes}:${seconds}`;
 return clock+(fraction?'.'+String(fraction).padStart(3,'0'):'');
}
export const validTrimRange=(start:number|undefined,end:number|undefined,length:number)=>start!==undefined&&end!==undefined&&Number.isFinite(length)&&length>0&&Number.isFinite(start)&&Number.isFinite(end)&&start>=0&&end>start&&end<=length+1e-9;
