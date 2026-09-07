import {normalizeArchitectureInput,buildArchitectureComparison,architecturePresets,type SchemeId} from './architecture-execution.ts';
import {validateFabricationInput} from './fabrication-flow.ts';
import {validateScenario,scenarioDefaults} from './investigation-models.ts';
import {validateMemoryExplorerInput,accessMemoryRow} from './memory-interfaces.ts';
import {referenceSystem} from './reference-system.ts';
import {validateOperatingHallScenario,simulateOperatingHall,type OperatingHallScenario} from './operating-hall.ts';
import {validateOrbitalMissionScenario,simulateOrbitalMission,type OrbitalMissionScenario} from './orbital-mission.ts';
import {createOperatingHallScenario} from './operating-hall-scenarios.ts';
import {createOrbitalMissionScenario} from './orbital-mission-scenarios.ts';
import {resolveSensorOptions,type SensorOptions} from './sensor-application.ts';
import {resolveRetrievalOptions,type RetrievalOptions} from './retrieval-application.ts';
import {retrievalDataset} from './application-data.ts';
import {compareGrowthIndices,allocatePackageCapacity,allocateHallCapacity} from './progress-evidence.ts';
export const studioRecordVersion='atlas-studio-record-1';
export const studioStorageKey='atlas-engineering-work-1';
/** Exact older raw records, kept apart from the one current-edition import undo copy. */
export const studioRecoveryStorageKey=studioStorageKey+'-older-records';
export const studioRecordLimit=250000;
export type StudioValues=Record<string,unknown>;
export type StudioIdentity={content:string;models:Record<string,string>};
export type StudioRecord=StudioIdentity&{schema:typeof studioRecordVersion;savedAt:string;values:StudioValues};
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
function check(ok:unknown,label:string):asserts ok{if(!ok)throw Error(`Invalid saved ${label}.`);}
const num=(v:unknown,min:number,max:number,integer=false)=>{check(typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max&&(!integer||Number.isInteger(v)),'numeric control');};
const enumerated=(v:unknown,values:readonly string[])=>check(typeof v==='string'&&values.includes(v),'selection');
const keys=(v:unknown,allowed:readonly string[],complete=false)=>{check(obj(v),'object');check(Object.keys(v).every(k=>allowed.includes(k))&&(!complete||Object.keys(v).length===allowed.length),'unknown or missing fields');};
/** Required scenario shape is independent of numerical validity. Prevent unknown nested options and unsafe labels. */
function shape(v:unknown,template:unknown,path='scenario'):void{
 if(Array.isArray(template)){check(Array.isArray(v)&&v.length<=100,`${path} list`);for(const x of v)shape(x,template[0],path);return;}
 if(obj(template)){keys(v,Object.keys(template),true);for(const k of Object.keys(template))shape((v as StudioValues)[k],template[k],`${path}.${k}`);return;}
 if(path.startsWith('scenario.commissioning.')){check(v===null||(typeof v==='number'&&Number.isFinite(v)),path);return;}
 check(typeof v===typeof template,path);if(typeof v==='number')check(Number.isFinite(v),path);if(typeof v==='string')check(v.length>0&&v.length<=4000,path);
}
/** Conservative browser import budgets, not physical or numerical model limits. */
export function checkStudioSimulationBudget(kind:'hall'|'orbital',value:OperatingHallScenario|OrbitalMissionScenario):void{
 const samples=Math.ceil(value.durationS/value.sampleS)+1;check(samples<=2001,'simulation sample budget');let transitions:number;
 if(kind==='hall'){
  const s=value as OperatingHallScenario;
  transitions=8+4*Math.ceil(s.durationS/s.checkpoint.intervalRunS)+5*s.faults.length;
 }else{
  const s=value as OrbitalMissionScenario,compute=Math.max(s.workload.operationsPerProduct/s.service.computeOpsS,s.workload.memoryBytesPerProduct/s.service.memoryBytesS),write=s.workload.outputBytesPerProduct/s.service.storageWriteBytesS;
  check(compute>=1e-6&&write>=1e-6,'minimum simulation service duration');
  const products=Math.ceil(s.durationS/(compute+write+s.service.commitLatencyS));
  const batteryCrossings=Math.ceil(s.durationS*(s.battery.maxChargeBusW*s.battery.chargeEfficiency+s.battery.maxDischargeBusW/s.battery.dischargeEfficiency)/(s.battery.resumeJ-s.battery.reserveJ));
  transitions=8+4*products+4*Math.ceil(s.durationS/s.illumination.periodS)+4*s.contacts.length+4*s.radiation.resets.length+4*batteryCrossings;
 }
 check(Number.isFinite(transitions)&&transitions<=5000&&(samples+transitions)*transitions<=25000000,'simulation transition budget');
}
export const progressWorkedBounds:Record<string,readonly[number,number,boolean]>={
 'field-control':[0,1.6,false],'integrated-wiring':[.25,2,false],'programmable-parallelism':[-9,9,true],
 'package-local-memory':[64,512,true],'optimizer-state':[-4,4,false],'attention-workload':[-3,3,false],
 'matrix-dataflow':[-9,9,true],'attention-io':[-3,3,false],'kv-blocks':[1,8,true],'rack-operability':[0,0,true],
};
export function validateStudioValues(value:unknown):StudioValues{
 check(obj(value),'controls');const v=structuredClone(value);
 const memory=()=>v['memory.scenario']?validateScenario(v['memory.scenario']):scenarioDefaults;
 const allocationOptions=(x:unknown)=>{check(obj(x),'allocation options');if(x.demands!==undefined){check(Array.isArray(x.demands)&&x.demands.length<=100,'allocation requests');for(const d of x.demands){keys(d,['id','units'],true);check(typeof d.id==='string'&&d.id.length>0&&d.id.length<=128,'request identity');}}return x;};
 const fields:Record<string,(x:unknown)=>void>={
  'architecture.input':x=>{v['architecture.input']=normalizeArchitectureInput(x);},'architecture.scheme':x=>enumerated(x,['scalar','vector','simt','systolic']),'architecture.index':x=>num(x,0,1000,true),
  'fabrication.input':x=>{validateFabricationInput(x);},'fabrication.index':x=>num(x,0,10,true),'fabrication.section':x=>num(x,0,1,true),
  'memory.scenario':x=>{validateScenario(x);},'memory.input':x=>{const input=validateMemoryExplorerInput(x,memory().dies);num(input.selectedStack,0,referenceSystem.package.hbmStacks-1,true);},
  'memory.openRows':x=>{check(obj(x),'bank state');for(const [stack,rows] of Object.entries(x)){check(/^(0|[1-9]\d*)$/.test(stack)&&Number(stack)<referenceSystem.package.hbmStacks&&obj(rows),'stack state');accessMemoryRow(0,memory().dies,rows as Record<string,number>);}},
  'memory.lastRead':x=>check(typeof x==='string'&&x.length<4000,'read label'),
  'hall.scenario':x=>{shape(x,createOperatingHallScenario());const s=x as OperatingHallScenario;validateOperatingHallScenario(s);checkStudioSimulationBudget('hall',s);simulateOperatingHall(s);},'hall.time':x=>num(x,0,(v['hall.scenario'] as OperatingHallScenario)?.durationS??createOperatingHallScenario().durationS),
  'orbital.scenario':x=>{shape(x,createOrbitalMissionScenario());const s=x as OrbitalMissionScenario;check(s.contacts.length>0,'at least one contact for the mission controls');validateOrbitalMissionScenario(s);checkStudioSimulationBudget('orbital',s);simulateOrbitalMission(s);},'orbital.time':x=>num(x,0,(v['orbital.scenario'] as OrbitalMissionScenario)?.durationS??createOrbitalMissionScenario().durationS),
  'realization.a':x=>num(x,0,15,true),'realization.b':x=>num(x,0,15,true),'realization.edge':x=>num(x,0,2,true),
  'realization.cell':x=>check(typeof x==='string'&&x.length<1000,'cell selection'),'realization.net':x=>check(typeof x==='string'&&x.length<1000,'net selection'),
  'applications.id':x=>enumerated(x,['sensor','retrieval']),'sensor.options':x=>{check(obj(x),'sensor options');resolveSensorOptions(x);},'sensor.cursor':x=>num(x,0,79,true),
  'retrieval.options':x=>{check(obj(x),'retrieval options');const o=resolveRetrievalOptions(x);check([...retrievalDataset.tuning,...retrievalDataset.evaluation].some(q=>q.id===o.queryId),'query identity');},
  'progress.view':x=>enumerated(x,['breakthroughs','capacity','allocation','growth']),'progress.index':x=>num(x,0,9,true),
  'progress.allocation':x=>enumerated(x,['package','hall']),'progress.growthOptions':x=>{check(obj(x),'growth options');compareGrowthIndices(x);},
  'progress.packageOptions':x=>{allocatePackageCapacity(allocationOptions(x));},'progress.hallOptions':x=>{allocateHallCapacity(allocationOptions(x));},
 };
 for(const [id,bounds] of Object.entries(progressWorkedBounds))fields[`progress.worked.${id}`]=x=>num(x,...bounds);
 for(const [key,x] of Object.entries(v)){check(Object.hasOwn(fields,key),'control identity');fields[key](x);}
 if('architecture.input' in v||'architecture.scheme' in v||'architecture.index' in v){const input=normalizeArchitectureInput(v['architecture.input']??architecturePresets.two),scheme=(v['architecture.scheme']??'systolic') as SchemeId;const count=buildArchitectureComparison(input).traces[scheme].steps.length;num(v['architecture.index']??0,0,count-1,true);}
 if('sensor.options' in v||'sensor.cursor' in v)num(v['sensor.cursor']??0,0,Math.max(0,resolveSensorOptions((v['sensor.options']??{}) as SensorOptions).steps-1),true);
 // A partial record with a short horizon must not mount a longer default cursor.
 if('hall.scenario' in v&&!('hall.time' in v))v['hall.time']=Math.min(150,(v['hall.scenario'] as OperatingHallScenario).durationS);
 if('orbital.scenario' in v&&!('orbital.time' in v))v['orbital.time']=Math.min(6000,(v['orbital.scenario'] as OrbitalMissionScenario).durationS);
 return v;
}
export function readStudioRecord(text:string,expected:StudioIdentity):StudioRecord{
 check(typeof text==='string'&&text.length<=studioRecordLimit&&new TextEncoder().encode(text).length<=studioRecordLimit,'record size');const x:unknown=JSON.parse(text);keys(x,['schema','content','models','savedAt','values'],true);const r=x as StudioRecord;
 check(r.schema===studioRecordVersion&&typeof r.savedAt==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(r.savedAt)&&Number.isFinite(Date.parse(r.savedAt))&&new Date(r.savedAt).toISOString()===r.savedAt,'record version or timestamp');
 check(r.content===expected.content,'content edition');check(obj(r.models)&&JSON.stringify(Object.entries(r.models).sort())===JSON.stringify(Object.entries(expected.models).sort()),'model versions');
 return{...r,values:validateStudioValues(r.values)};
}
export type StudioStorage={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void;removeItem:(key:string)=>void};
export type StudioImportTicket={request:number;edit:number};
/** Storage writes are committed before live values change. Timer generations and import tickets protect newer work. */
export function createStudioWorkspace({storage,identity,now=()=>new Date().toISOString(),schedule=(fn:()=>void)=>setTimeout(fn,200),cancel=(id:unknown)=>clearTimeout(id as ReturnType<typeof setTimeout>),onStatus=()=>{}}:{storage:StudioStorage;identity:StudioIdentity;now?:()=>string;schedule?:(fn:()=>void)=>unknown;cancel?:(id:unknown)=>void;onStatus?:(message:string)=>void}){
 let values:StudioValues={},generation=0,edit=0,request=0,timer:unknown,timerEpoch=0,dirty=false,initialized=false,olderRecords:string[]=[],unreadableRecovery:string|null=null;
 const cancelSave=()=>{timerEpoch++;if(timer!==undefined)cancel(timer);timer=undefined;};
 const record=():StudioRecord=>({schema:studioRecordVersion,...structuredClone(identity),savedAt:now(),values:structuredClone(values)});
 const serialize=()=>{const raw=JSON.stringify(record());readStudioRecord(raw,identity);return raw;};
 const rememberOlder=(raw:string)=>{if(!olderRecords.includes(raw))olderRecords.push(raw);};
 const readOlder=():string[]=>{
  const raw=storage.getItem(studioRecoveryStorageKey);if(raw===null)return[];
  try{const parsed:unknown=JSON.parse(raw);check(Array.isArray(parsed)&&parsed.every(x=>typeof x==='string'),'older record recovery');unreadableRecovery=null;return parsed as string[];}
  catch{unreadableRecovery=raw;throw Error('The older saved recovery copy could not be read. Export the older saved record; current inputs remain in this session.');}
 };
 const preserveOlder=()=>{
  // Read immediately before replacement, including edits made after initialization.
  const active=storage.getItem(studioStorageKey);
  if(active!==null){try{readStudioRecord(active,identity);}catch{rememberOlder(active);}}
  const saved=readOlder(),merged=[...saved,...olderRecords.filter(raw=>!saved.includes(raw))];
  // One atomic archive write preserves earlier copies as well as the displaced raw.
  // Failure leaves the old active record untouched and the live edits exportable.
  if(merged.length!==saved.length)storage.setItem(studioRecoveryStorageKey,JSON.stringify(merged));
  olderRecords=merged;
 };
 const flush=()=>{cancelSave();if(!dirty)return;try{const raw=serialize();preserveOlder();storage.setItem(studioStorageKey,raw);dirty=false;onStatus('Inputs saved.'+(olderRecords.length?' Older saved records remain available to export.':''));}catch{onStatus('Inputs remain in this session. Export a copy; device storage or the saved input checks prevented saving. Older saved data has not been replaced.');}};
 const replace=(next:StudioRecord)=>{
  // localStorage.setItem is atomic for one key. Keep the active key unchanged until backup succeeds.
  const old=serialize(),previousBackup=storage.getItem(studioStorageKey+'-before-import');
  preserveOlder();
  storage.setItem(studioStorageKey+'-before-import',old);
  try{storage.setItem(studioStorageKey,JSON.stringify(next));}catch(error){try{if(previousBackup===null)storage.removeItem(studioStorageKey+'-before-import');else storage.setItem(studioStorageKey+'-before-import',previousBackup);}catch{/* The live workspace and active record still have not changed. */}throw error;}
  cancelSave();values=structuredClone(next.values);generation++;edit++;request++;dirty=false;
 };
 return{
  get values(){return values;},get generation(){return generation;},get olderRecordCount(){return olderRecords.length+(unreadableRecovery===null?0:1);},
  initialize(){
   if(initialized)return;initialized=true;let status='';
   try{const raw=storage.getItem(studioStorageKey);if(raw!==null){try{values=readStudioRecord(raw,identity).values;status='Saved inputs restored.';}catch{rememberOlder(raw);status='An older or invalid saved record was left untouched. Fresh inputs are available.';}}}
   catch{status='Device storage could not be read. Fresh inputs remain available in this session.';}
   try{const saved=readOlder();olderRecords=[...saved,...olderRecords.filter(raw=>!saved.includes(raw))];}catch{status+=' Older recovery storage could not be read; export the older saved record before retrying.';}
   if(olderRecords.length)status+=' Export the older saved record to keep its original contents.';
   if(status)onStatus(status.trim());
  },
  seed(field:string,value:unknown,atGeneration=generation){if(atGeneration!==generation||Object.hasOwn(values,field))return;values[field]=structuredClone(value);},
  write(field:string,value:unknown,atGeneration=generation){if(atGeneration!==generation)return;values[field]=structuredClone(value);edit++;dirty=true;cancelSave();const epoch=timerEpoch;timer=schedule(()=>{if(epoch===timerEpoch)flush();});},
  exportText(){return JSON.stringify(readStudioRecord(serialize(),identity),null,2);},
  exportOlderText(){
   check(olderRecords.length||unreadableRecovery!==null,'older recovery copy');
   if(olderRecords.length===1&&unreadableRecovery===null)return olderRecords[0];
   return JSON.stringify({kind:'atlas-older-studio-records',records:olderRecords.map(raw=>({raw})),...(unreadableRecovery===null?{}:{unreadableRecoveryRaw:unreadableRecovery})},null,2);
  },
  beginImport():StudioImportTicket{return{request:++request,edit};},
  importText(text:string,ticket:StudioImportTicket){check(ticket.request===request&&ticket.edit===edit,'import superseded by a newer import or edit');const next=readStudioRecord(text,identity);replace(next);return next;},
  restorePrevious(){const raw=storage.getItem(studioStorageKey+'-before-import');check(raw,'recovery copy');const next=readStudioRecord(raw,identity);replace(next);return next;},
  flush,stop(){request++;flush();cancelSave();},
 };
}
