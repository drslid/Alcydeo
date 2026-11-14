import {cleanName,type Task} from '../contracts';
import {directExtension} from './classification';
import {directExtensions,formatMime} from './formats';

const basename=(value:string)=>value.split(/[\\/]/).pop()??value;
const extension=(value:string)=>basename(value).match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
export function fileStem(value:string){
  const name=basename(value),ext=extension(name);
  return cleanName(ext&&directExtensions.some(item=>item===ext)?name.slice(0,-ext.length-1):name);
}
export function taskExtension(task:Task){return task.recording?'webm':task.conversion?'mp4':task.media.kind==='direct'?directExtension(task.variant.url,task.variant.contentType??task.media.contentType)??'mp4':'mp4';}
export function outputFilename(task:Task,ext=taskExtension(task)){
  if(!task.conversion)return `${cleanName(task.title)}.${ext}`;
  const input=task.conversion.inputs?.[0]?.name;
  // Legacy tasks may contain an internal OPFS name. Their meaningful title is
  // a better fallback; new inputs already receive their user-facing filename.
  const internal=/^(?:output|converted|input)(?:\.(?:mp4|original))?$/i;
  const stem=fileStem(input&&!internal.test(input)?input:task.title);
  const suffix={convert:'-converted',compress:'-compressed',merge:'-merged',trim:'-trimmed',crop:'-cropped'}[task.conversion.operation?.kind??'convert'];
  const existing=new RegExp(`${suffix}(?: \\(\\d+\\))?$`,'i').exec(stem);
  const tail=existing?.[0]??suffix,base=existing?stem.slice(0,existing.index):stem;
  return `${base.slice(0,120-tail.length).replace(/[. ]+$/,'')}${tail}.${ext}`;
}
export function namedTaskFile(task:Task,file:File){
  const ext=taskExtension(task),saved=task.saved&&task.filename?basename(task.filename):undefined;
  const name=saved&&directExtensions.some(item=>item===extension(saved))?cleanName(saved):outputFilename(task,ext);
  // Wrapping a File as a Blob part does not read its contents into an array.
  return new File([file],name,{type:formatMime[ext]||file.type||'video/mp4',lastModified:file.lastModified});
}
