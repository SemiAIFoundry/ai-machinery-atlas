import {commissioningVersion,normalizeCommissioningInput,type CommissioningInput} from './commissioning-execution.ts';
export const commissioningRecordKey='atlas-commissioning-execution-input';
export const commissioningRecoveryKey='atlas-commissioning-execution-older-inputs';
export type CommissioningInputRecord={schemaVersion:1;modelVersion:typeof commissioningVersion;input:CommissioningInput};
export type CommissioningStorage=Pick<Storage,'getItem'|'setItem'>;
export function makeCommissioningRecord(input:CommissioningInput):CommissioningInputRecord{return {schemaVersion:1,modelVersion:commissioningVersion,input:normalizeCommissioningInput(input)};}
export function parseCommissioningRecord(raw:string):CommissioningInputRecord{
  if(raw.length>65536)throw new Error('Input record exceeds the 64 KiB limit.');
  const v:unknown=JSON.parse(raw);
  if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Input record must be an object.');
  const r=v as Record<string,unknown>;
  if(Object.keys(r).some(k=>!['schemaVersion','modelVersion','input'].includes(k))||r.schemaVersion!==1||r.modelVersion!==commissioningVersion)throw new Error('This record uses another model or schema. Keep the original file; it has not been changed.');
  return makeCommissioningRecord(normalizeCommissioningInput(r.input));
}
/** No active write occurs until any incompatible prior raw record is durably preserved. */
export function saveCommissioningRecord(storage:CommissioningStorage,record:CommissioningInputRecord):void{
  const next=JSON.stringify(parseCommissioningRecord(JSON.stringify(record))),prior=storage.getItem(commissioningRecordKey);
  if(prior!==null){let compatible=true;try{parseCommissioningRecord(prior);}catch{compatible=false;}
    if(!compatible){const old=storage.getItem(commissioningRecoveryKey);let entries:unknown=old===null?[]:JSON.parse(old);if(!Array.isArray(entries)||entries.some(s=>typeof s!=='string'))throw new Error('Older-record storage could not be read; the active record remains unchanged.');if(!entries.includes(prior)){entries=[...entries,prior];storage.setItem(commissioningRecoveryKey,JSON.stringify(entries));}}
  }
  storage.setItem(commissioningRecordKey,next);
}
export function exportOlderCommissioningRecords(storage:CommissioningStorage):string|null{
  const entries:string[]=[];const saved=storage.getItem(commissioningRecoveryKey);
  if(saved!==null){let a:unknown;try{a=JSON.parse(saved);}catch{a=null;}if(Array.isArray(a)&&a.every(s=>typeof s==='string'))entries.push(...a as string[]);else entries.push(saved);}
  const active=storage.getItem(commissioningRecordKey);if(active!==null){try{parseCommissioningRecord(active);}catch{if(!entries.includes(active))entries.push(active);}}
  return entries.length===0?null:entries.length===1?entries[0]:JSON.stringify({format:'atlas-commissioning-older-raw-inputs',records:entries},null,2);
}
