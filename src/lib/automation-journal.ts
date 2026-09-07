import {validateLearnedHandoff,type LearnedActionHandoff} from './automation-learned-bridge.ts';
import {automationVersion,canonicalJson,exactObject,type AutomationEnvironment,type AutomationSnapshot,type JournalDocument,validateAutomationScenario} from './automation-contracts.ts';
import {createAutomationEnvironment} from './automation-fixtures.ts';
import {advanceAutomation,createAutomationRun,replayAutomationJournal,type AutomationCommand} from './automation-execution.ts';
import {automationServiceMs,executeAutomationTool,validateAutomationCall} from './automation-tools.ts';
export const automationStorageKey='atlas-durable-automation-1';
export type AutomationStorage={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void};
const assert=(ok:unknown,message:string):void=>{if(!ok)throw Error(message);};
/** Re-execute recorded tool effects independently of policy choices and compare actual fixture results.
 * A single outstanding durable service intent may already have committed without its result journaled. */
export function validateAutomationSnapshot(value:unknown):AutomationSnapshot {
 exactObject(value,['document','environment']);exactObject(value.document,value.document&&typeof value.document==='object'&&'learnedHandoff' in value.document?['version','scenario','events','learnedHandoff']:['version','scenario','events']);
 const snapshot=structuredClone(value) as AutomationSnapshot,doc=snapshot.document;if('learnedHandoff' in doc)doc.learnedHandoff=validateLearnedHandoff(doc.learnedHandoff);validateAutomationScenario(doc.scenario);replayAutomationJournal(doc);
 let environment=createAutomationEnvironment(doc.scenario.caseId);
 for(const event of doc.events){
  if(event.kind!=='tool-result'&&event.kind!=='transport-timeout'&&event.kind!=='service-replayed')continue;
  const prior=replayAutomationJournal({...doc,events:doc.events.slice(0,event.seq)}),pending=prior.pending;assert(!!pending&&pending.stage==='result','Missing service intent.');
  const call=validateAutomationCall(pending!.call),result=executeAutomationTool(call,environment,event.atMs);
  assert(event.atMs-prior.atMs===automationServiceMs[call.name],'Recorded service duration does not match the synthetic contract.');
  if(event.kind==='tool-result')assert(canonicalJson(event.data.result)===canonicalJson(result.result),'Recorded tool result does not match fixture execution.');
  else if(event.kind==='service-replayed')assert(result.committed&&canonicalJson(event.data.receipt)===canonicalJson(result.environment.receipts.at(-1)),'Reconciled receipt does not match the original pending effect.');
  else assert(result.committed&&call.name==='reserve_part'&&['commit-timeout','cancel-after-commit'].includes(doc.scenario.caseId),'Unjustified lost-response event.');
  environment=result.environment;
 }
 if(canonicalJson(snapshot.environment)!==canonicalJson(environment)){
  const state=replayAutomationJournal(doc),p=state.pending;assert(p?.stage==='result','External state differs from all recorded effects.');
  const call=validateAutomationCall(p!.call),outstanding=executeAutomationTool(call,environment,state.atMs+automationServiceMs[call.name]);
  assert(outstanding.committed&&canonicalJson(snapshot.environment)===canonicalJson(outstanding.environment),'External state is not the one pending committed effect.');
 }
 return snapshot;
}
export function serializeAutomationArchive(snapshot:AutomationSnapshot):string {return JSON.stringify({kind:'atlas-automation-archive',version:automationVersion,snapshot:validateAutomationSnapshot(snapshot)},null,2);}
export function readAutomationArchive(raw:string):AutomationSnapshot {
 assert(typeof raw==='string'&&new TextEncoder().encode(raw).length<=500000,'Automation archive exceeds 500,000 bytes.');const value:unknown=JSON.parse(raw);exactObject(value,['kind','version','snapshot']);assert(value.kind==='atlas-automation-archive'&&value.version===automationVersion,'Incompatible automation archive.');return validateAutomationSnapshot(value.snapshot);
}
type ActiveDocument={version:typeof automationVersion;slot:string;document:JournalDocument};
/** Atomic localStorage setItem is the storage-port contract. Separate environment writes deliberately
 * precede response journaling. A new slot is prepared before switching the active pointer on import/reset. */
export function createAutomationWorkspace(storage:AutomationStorage,newSlot=()=>`slot-${globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(16).slice(2)}`}`){
 let current:AutomationSnapshot|null=null,slot:string|null=null,error:string|null=null,expectedHead:string|null=null;
 const unchanged=()=>assert(storage.getItem(automationStorageKey)===expectedHead,'Another workspace changed the saved journal. Export this live run, then reload before writing.');
 const environmentKey=(id:string)=>`${automationStorageKey}-environment-${id}`;
 const head=(document:JournalDocument):ActiveDocument=>({version:automationVersion,slot:slot!,document});
 const load=()=>{
  try{
   const raw=storage.getItem(automationStorageKey);expectedHead=raw;if(raw===null)return;
   const value:unknown=JSON.parse(raw);exactObject(value,['version','slot','document']);assert(value.version===automationVersion&&typeof value.slot==='string'&&/^[-a-zA-Z0-9]{1,120}$/.test(value.slot),'Incompatible saved automation workspace.');
   const externalRaw=storage.getItem(environmentKey(value.slot as string));assert(externalRaw!==null,'Saved external environment is missing.');
   const external:unknown=JSON.parse(externalRaw!);exactObject(external,['version','runId','value']);
   const document=value.document as JournalDocument;assert(external.version===automationVersion&&external.runId===document.scenario.runId,'Journal and external environment identity differ.');
   current=validateAutomationSnapshot({document,environment:external.value});slot=value.slot as string;error=null;
  }catch(e){error=e instanceof Error?e.message:String(e);}
 };
 load();
 const backup=()=>{
  const raw=storage.getItem(automationStorageKey);if(raw===null)return;
  let externalRaw:string|null=null;try{const parsed=JSON.parse(raw);if(typeof parsed.slot==='string'&&/^[-a-zA-Z0-9]{1,120}$/.test(parsed.slot))externalRaw=storage.getItem(environmentKey(parsed.slot));}catch{/* Preserve the exact invalid active raw value below. */}
  const prior=storage.getItem(automationStorageKey+'-older'),items:unknown=prior===null?[]:JSON.parse(prior);assert(Array.isArray(items),'Older automation recovery is invalid; export it before replacing anything.');
  const entry={journalRaw:raw,environmentRaw:externalRaw};if((items as unknown[]).some(x=>canonicalJson(x)===canonicalJson(entry)))return;
  assert((items as unknown[]).length<30,'Older automation recovery is full. Export it; this run remains unchanged.');
  const text=JSON.stringify([...(items as unknown[]),entry]);assert(new TextEncoder().encode(text).length<=6000000,'Older automation recovery exceeds its bounded capacity.');storage.setItem(automationStorageKey+'-older',text);
 };
 const install=(snapshot:AutomationSnapshot)=>{
  unchanged();const valid=validateAutomationSnapshot(snapshot),nextSlot=newSlot();assert(/^[-a-zA-Z0-9]{1,120}$/.test(nextSlot),'Invalid storage slot.');assert(storage.getItem(environmentKey(nextSlot))===null,'Storage slot must be fresh.');
  backup();
  storage.setItem(environmentKey(nextSlot),JSON.stringify({version:automationVersion,runId:valid.document.scenario.runId,value:valid.environment}));
  const raw=JSON.stringify({version:automationVersion,slot:nextSlot,document:valid.document});unchanged();storage.setItem(automationStorageKey,raw);expectedHead=raw;
  current=valid;slot=nextSlot;error=null;return structuredClone(current);
 };
 return{
  get snapshot(){return current?structuredClone(current):null;},get error(){return error;},
  start(scenario:JournalDocument['scenario'],handoff?:LearnedActionHandoff){try{return install(createAutomationRun(scenario,handoff));}catch(e){error=e instanceof Error?e.message:String(e);return null;}},
  restore(raw:string){try{return install(readAutomationArchive(raw));}catch(e){error=e instanceof Error?e.message:String(e);return null;}},
  advance(command:AutomationCommand={kind:'next'}){
   if(!current||!slot){error='No readable active run. Export recovery data or start a new run.';return null;}
   const result=advanceAutomation(current,command,{writeJournal:document=>{unchanged();const raw=JSON.stringify(head(document));storage.setItem(automationStorageKey,raw);expectedHead=raw;},writeEnvironment:(value:AutomationEnvironment)=>{unchanged();storage.setItem(environmentKey(slot!),JSON.stringify({version:automationVersion,runId:current!.document.scenario.runId,value}));}});
   current=result.snapshot;error=result.error;return structuredClone(current);
  },
  exportText(){if(!current)throw Error('No readable active run.');return serializeAutomationArchive(current);},
  recoveryText(){const activeRaw=storage.getItem(automationStorageKey);let environmentRaw:string|null=null;try{const parsed=JSON.parse(activeRaw??'null');if(parsed&&typeof parsed.slot==='string'&&/^[-a-zA-Z0-9]{1,120}$/.test(parsed.slot))environmentRaw=storage.getItem(environmentKey(parsed.slot));}catch{/* Exact raw journal is still exported. */}return JSON.stringify({kind:'atlas-automation-raw-recovery',activeRaw,environmentRaw,olderRaw:storage.getItem(automationStorageKey+'-older')},null,2);},
  olderRaw(){return storage.getItem(automationStorageKey+'-older');},
  clearExportedOlder(expected:string|null){try{assert(storage.getItem(automationStorageKey+'-older')===expected,'Older recovery changed since export; export it again before removing copies.');storage.setItem(automationStorageKey+'-older','[]');error=null;return true;}catch(e){error=e instanceof Error?e.message:String(e);return false;}},
  get hasRecovery(){return storage.getItem(automationStorageKey+'-older')!==null||error!==null;},
 };
}
