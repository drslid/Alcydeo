import {readFile,writeFile,mkdir} from 'node:fs/promises';
const css=await readFile('packages/design-tokens/tokens.css','utf8');const blocks=css.split('}').slice(0,2);
function luminance(hex){const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];}
const results=[];
for(let i=0;i<2;i++){
 const vars=Object.fromEntries([...blocks[i].matchAll(/--([\w-]+):(#\w{6}|#fff)(?=;|})/g)].map(m=>[m[1],m[2]==='#fff'?'#ffffff':m[2]]));
 for(const [fg,bg,min] of [['text','surface',4.5],['muted','surface',4.5],['#ffffff','primary',4.5],['link','primary-subtle',4.5],['success','surface',4.5],['error','error-subtle',4.5],['error','surface',4.5],['focus','surface',3]]){
  const a=luminance(vars[fg]??fg),b=luminance(vars[bg]??bg);const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);results.push({theme:i?'dark':'light',fg,bg,ratio,minimum:min});if(ratio<min)throw new Error(`Contrast ${fg}/${bg}: ${ratio}`);
 }
}
await mkdir('artifacts/evidence',{recursive:true});await writeFile('artifacts/evidence/contrast.json',JSON.stringify(results,null,2)+'\n');console.log(`Passed ${results.length} measured semantic contrast pairs.`);
