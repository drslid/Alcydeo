import {cleanFolder,cleanName,type Settings,type Task} from '../contracts';
import {outputFilename} from './filenames';

// Chrome resolves this relative path against its chosen downloads directory.
// Both direct files and assembled outputs use the same persisted task choice.
export function destination(task:Task,settings:Settings,extension:string){
  const choice=task.destination??settings;
  const subfolder=task.destination?.subfolder;
  return{filename:`${cleanFolder(choice.folder)}/${subfolder?cleanName(subfolder)+'/':''}${outputFilename(task,extension)}`,saveAs:choice.saveAs===true,conflictAction:'uniquify' as const};
}
