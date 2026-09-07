import {processCellVersion,normalizeCellInput,type CellInput} from './process-cell-acceptance.ts';
export const processCellRecordKey='atlas-process-cell-execution-input';
export const processCellRecoveryKey='atlas-process-cell-execution-older-inputs';
export type ProcessCellInputRecord={schemaVersion:1;modelVersion:typeof processCellVersion;input:CellInput};
export type ProcessCellStorage=Pick<Storage,'getItem'|'setItem'>;
export function makeProcessCellRecord(input:CellInput):ProcessCellInputRecord{return {schemaVersion:1,modelVersion:processCellVersion,input:normalizeCellInput(input)};}
export function parseProcessCellRecord(raw:string):ProcessCellInputRecord{
  if(raw.length>65536)throw new Error('Input record exceeds the 64 KiB limit.');
  const v:unknown=JSON.parse(raw);
  if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Input record must be an object.');
  const r=v as Record<string,unknown>;
  if(Object.keys(r).some(k=>!['schemaVersion','modelVersion','input'].includes(k))||r.schemaVersion!==1||r.modelVersion!==processCellVersion)throw new Error('This record uses another model or schema. Keep the original file; it has not been changed.');
  return makeProcessCellRecord(normalizeCellInput(r.input));
}
/** No active write occurs until any incompatible prior raw record is durably preserved. */
export function saveProcessCellRecord(storage:ProcessCellStorage,record:ProcessCellInputRecord):void{
  const next=JSON.stringify(parseProcessCellRecord(JSON.stringify(record))),prior=storage.getItem(processCellRecordKey);
  if(prior!==null){let compatible=true;try{parseProcessCellRecord(prior);}catch{compatible=false;}
    if(!compatible){const old=storage.getItem(processCellRecoveryKey);let entries:unknown=old===null?[]:JSON.parse(old);if(!Array.isArray(entries)||entries.some(s=>typeof s!=='string'))throw new Error('Older-record storage could not be read; the active record remains unchanged.');if(!entries.includes(prior)){entries=[...entries,prior];storage.setItem(processCellRecoveryKey,JSON.stringify(entries));}}
  }
  storage.setItem(processCellRecordKey,next);
}
export function exportOlderProcessCellRecords(storage:ProcessCellStorage):string|null{
  const entries:string[]=[];const saved=storage.getItem(processCellRecoveryKey);
  if(saved!==null){let a:unknown;try{a=JSON.parse(saved);}catch{a=null;}if(Array.isArray(a)&&a.every(s=>typeof s==='string'))entries.push(...a as string[]);else entries.push(saved);}
  const active=storage.getItem(processCellRecordKey);if(active!==null){try{parseProcessCellRecord(active);}catch{if(!entries.includes(active))entries.push(active);}}
  return entries.length===0?null:entries.length===1?entries[0]:JSON.stringify({format:'atlas-process-cell-older-raw-inputs',records:entries},null,2);
}
