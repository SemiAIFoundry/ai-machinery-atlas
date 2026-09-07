import {machineExecutionVersion,normalizeMachineInput,type MachineInput,type MachineExecutionInput} from './machine-execution.ts';
export const machineRecordKey='atlas-machine-execution-input';
export const machineRecoveryKey='atlas-machine-execution-older-inputs';
export type MachineInputRecord={schemaVersion:1;modelVersion:typeof machineExecutionVersion;input:MachineInput};
export type MachineStorage=Pick<Storage,'getItem'|'setItem'>;
export function makeMachineRecord(input:MachineExecutionInput):MachineInputRecord{return {schemaVersion:1,modelVersion:machineExecutionVersion,input:normalizeMachineInput(input)};}
export function parseMachineRecord(raw:string):MachineInputRecord{
  if(raw.length>65536)throw new Error('Input record exceeds the 64 KiB limit.');
  const v:unknown=JSON.parse(raw);
  if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Input record must be an object.');
  const r=v as Record<string,unknown>;
  if(Object.keys(r).some(k=>!['schemaVersion','modelVersion','input'].includes(k))||r.schemaVersion!==1||r.modelVersion!==machineExecutionVersion)throw new Error('This record uses another model or schema. Keep the original file; it has not been changed.');
  return makeMachineRecord(normalizeMachineInput(r.input));
}
/** No active write occurs until any incompatible prior raw record is durably preserved. */
export function saveMachineRecord(storage:MachineStorage,record:MachineInputRecord):void{
  const next=JSON.stringify(parseMachineRecord(JSON.stringify(record))),prior=storage.getItem(machineRecordKey);
  if(prior!==null){let compatible=true;try{parseMachineRecord(prior);}catch{compatible=false;}
    if(!compatible){const old=storage.getItem(machineRecoveryKey);let entries:unknown=old===null?[]:JSON.parse(old);if(!Array.isArray(entries)||entries.some(s=>typeof s!=='string'))throw new Error('Older-record storage could not be read; the active record remains unchanged.');if(!entries.includes(prior)){entries=[...entries,prior];storage.setItem(machineRecoveryKey,JSON.stringify(entries));}}
  }
  storage.setItem(machineRecordKey,next);
}
export function exportOlderMachineRecords(storage:MachineStorage):string|null{
  const entries:string[]=[];const saved=storage.getItem(machineRecoveryKey);
  if(saved!==null){let a:unknown;try{a=JSON.parse(saved);}catch{a=null;}if(Array.isArray(a)&&a.every(s=>typeof s==='string'))entries.push(...a as string[]);else entries.push(saved);}
  const active=storage.getItem(machineRecordKey);if(active!==null){try{parseMachineRecord(active);}catch{if(!entries.includes(active))entries.push(active);}}
  return entries.length===0?null:entries.length===1?entries[0]:JSON.stringify({format:'atlas-machine-older-raw-inputs',records:entries},null,2);
}
