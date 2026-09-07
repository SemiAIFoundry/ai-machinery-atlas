import {createLifecycleRun,readLifecycleCheckpoint,type LifecycleRun} from './model-lifecycle.ts';
/** Independent procedural disclosure, not secure test-set isolation or authentication. */
export const lifecycleWorkspaceKeys={checkpoint:'atlas-model-lifecycle-checkpoint-1',exposure:'atlas-model-lifecycle-final-seen-1'} as const;
export type LifecycleStorage={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void};
export type LifecycleExposureJournal={retain:(run:LifecycleRun)=>LifecycleRun;hasSeen:()=>boolean;storageAvailable:()=>boolean};
export function createLifecycleExposureJournal(storage?:LifecycleStorage):LifecycleExposureJournal{
 let seen=false,available=Boolean(storage);
 try{seen=storage?.getItem(lifecycleWorkspaceKeys.exposure)==='true';}catch{available=false;}
 return {hasSeen:()=>seen,storageAvailable:()=>available,retain:(run)=>{
  // Another mounted experience or browser tab may have recorded exposure since this journal was created.
  try{seen=seen||storage?.getItem(lifecycleWorkspaceKeys.exposure)==='true';}catch{available=false;}
  seen=seen||run.finalOpened;
  if(seen&&storage)try{storage.setItem(lifecycleWorkspaceKeys.exposure,'true');available=true;}catch{available=false;}
  return seen&&!run.finalOpened?{...run,finalOpened:true}:run;
 }};
}
export function loadLifecycleWorkspace(storage?:LifecycleStorage):LifecycleRun{
 const journal=createLifecycleExposureJournal(storage);
 try{const saved=storage?.getItem(lifecycleWorkspaceKeys.checkpoint);if(saved)return journal.retain(readLifecycleCheckpoint(saved));}catch{/* Preserve unreadable saved bytes and begin a recoverable run. */}
 return journal.retain(createLifecycleRun());
}
/** Validation and revision checks precede both state replacement and journal writes. */
export function importLifecycleWorkspace(text:string,journal:LifecycleExposureJournal,expectedRevision:number,currentRevision:number):LifecycleRun{
 const candidate=readLifecycleCheckpoint(text);
 if(expectedRevision!==currentRevision)throw Error('The run changed while the file was read; select the file again to replace this run.');
 return journal.retain(candidate);
}
