export type Check = {question:string;options:string[];answer:number;explanation?:string};
export type ProgressLesson = {id:string;check:Check};
export type Progress = {visited:string[];answers:Record<string,number>};
/** A deterministic revision marker for accidental reinterpretation, not a security signature. */
export function checkRevision(check:Check){let hash=2166136261;for(const c of JSON.stringify([check.question,check.options,check.answer])){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}return 'check-'+(hash>>>0).toString(16);}
export function restoreProgress(raw:string,lessons:ProgressLesson[],legacy:Record<string,string>):Progress{
 const v=JSON.parse(raw);if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid progress document.');
 const byId=new Map(lessons.map(r=>[r.id,r])),visited=Array.isArray(v.visited)?[...new Set(v.visited.filter((id:unknown)=>typeof id==='string'&&byId.has(id)))] as string[]:[];
 const answers:Record<string,number>={};
 if((v.schemaVersion===undefined||v.schemaVersion===2)&&v.answers&&typeof v.answers==='object'&&!Array.isArray(v.answers))for(const [id,value] of Object.entries(v.answers)){
  const r=byId.get(id);if(!r||typeof value!=='number'||!Number.isInteger(value)||value<0||value>=r.check.options.length)continue;
  const expected=v.schemaVersion===2?v.checkRevisions?.[id]:legacy[id];if(expected===checkRevision(r.check))answers[id]=value;
 }
 return {visited,answers};
}
export function serializeProgress(progress:Progress,lessons:ProgressLesson[]){const selected=new Set(Object.keys(progress.answers));return JSON.stringify({schemaVersion:2,...progress,checkRevisions:Object.fromEntries(lessons.filter(r=>selected.has(r.id)).map(r=>[r.id,checkRevision(r.check)]))});}
