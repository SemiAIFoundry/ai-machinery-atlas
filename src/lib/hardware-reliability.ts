/** Finite digital protocols and exact small-code arithmetic. No analog/fault-rate model. */
export const hardwareReliabilityVersion='hardware-reliability-1';
export type FifoInput={values:readonly number[];writePeriod:number;readPeriod:number;consumer:'ready'|'bursty';reset:'none'|'both'|'reader-only';resetAt:number;horizon:number};
export const fifoDefaults:FifoInput={values:[11,22,33,44,55,66,77,88],writePeriod:2,readPeriod:5,consumer:'ready',reset:'none',resetAt:23,horizon:120};
export type FifoSnapshot={writePointer:number;readPointer:number;writeGray:number;readGray:number;readSyncInWriter:[number,number];writeSyncInReader:[number,number];slots:(string|null)[];expectedQueue:string[];accepted:string[];consumed:string[];canceled:string[];full:boolean;empty:boolean};
export type FifoEvent={index:number;time:number;writeEdge:boolean;readEdge:boolean;reset:boolean;producerValid:boolean;writeReady:boolean;consumerReady:boolean;acceptedTag:string|null;observedTag:string|null;observedValue:number|null;readValid:boolean;correct:boolean|null;notes:string[];state:FifoSnapshot};
export type FifoTrace={version:typeof hardwareReliabilityVersion;input:FifoInput;events:FifoEvent[];status:'complete'|'incomplete'|'contract-violation';violation:string|null;totals:{accepted:number;consumed:number;canceled:number;pending:number;writeStalls:number;emptyReadEdges:number}};
function must(c:unknown,m:string):asserts c{if(!c)throw new Error(m);}
const record=(v:unknown,keys:string[])=>{must(v&&typeof v==='object'&&!Array.isArray(v),'Input must be an object.');must(Object.keys(v).every(k=>keys.includes(k)),'Unknown input field.');return v as Record<string,unknown>;};
export function grayEncode(x:number):number{must(Number.isInteger(x)&&x>=0&&x<8,'Three-bit pointer must be 0…7.');return x^(x>>1);}
export function grayDecode(g:number):number{must(Number.isInteger(g)&&g>=0&&g<8,'Gray pointer must be 0…7.');return g^(g>>1)^(g>>2);}
export function normalizeFifoInput(v:unknown):FifoInput{
 const x=record(v,['values','writePeriod','readPeriod','consumer','reset','resetAt','horizon']);
 must(Array.isArray(x.values)&&x.values.length>=1&&x.values.length<=12,'Use 1–12 tagged integer values.');for(const value of x.values)must(Number.isInteger(value)&&Math.abs(value)<=99,'FIFO values must be integers −99…99.');
 for(const k of ['writePeriod','readPeriod'])must(Number.isInteger(x[k])&&(x[k] as number)>=2&&(x[k] as number)<=7,'Clock periods must be 2–7 integer teaching ticks.');
 must(x.consumer==='ready'||x.consumer==='bursty','Unknown consumer schedule.');must(x.reset==='none'||x.reset==='both'||x.reset==='reader-only','Unknown reset contract.');must(Number.isInteger(x.resetAt)&&(x.resetAt as number)>=1&&(x.resetAt as number)<=80,'Reset time must be 1–80 ticks.');must(Number.isInteger(x.horizon)&&(x.horizon as number)>=40&&(x.horizon as number)<=240,'Horizon must be 40–240 ticks.');
 return {values:[...x.values] as number[],writePeriod:x.writePeriod as number,readPeriod:x.readPeriod as number,consumer:x.consumer,reset:x.reset,resetAt:x.resetAt as number,horizon:x.horizon as number};
}
export function buildFifoTrace(v:unknown):FifoTrace{
 const input=normalizeFifoInput(v);let wp=0,rp=0,rs:[number,number]=[0,0],ws:[number,number]=[0,0],next=0,readEdges=0,violation:string|null=null,writeStalls=0,emptyReadEdges=0;
 const slots:({tag:string;value:number}|null)[]=Array(4).fill(null),queue:string[]=[],accepted:string[]=[],consumed:string[]=[],canceled:string[]=[],events:FifoEvent[]=[];
 const snap=():FifoSnapshot=>({writePointer:wp,readPointer:rp,writeGray:grayEncode(wp),readGray:grayEncode(rp),readSyncInWriter:[...rs],writeSyncInReader:[...ws],slots:slots.map(s=>s?.tag??null),expectedQueue:[...queue],accepted:[...accepted],consumed:[...consumed],canceled:[...canceled],full:(wp-grayDecode(rs[1])+8)%8===4,empty:rp===grayDecode(ws[1])});
 for(let time=0;time<=input.horizon;time++){
  const writeEdge=time>0&&time%input.writePeriod===0,readEdge=time>0&&time%input.readPeriod===0,reset=input.reset!=='none'&&time===input.resetAt;
  if(time!==0&&!writeEdge&&!readEdge&&!reset)continue;
  const notes:string[]=[];let acceptedTag:string|null=null,observedTag:string|null=null,observedValue:number|null=null,correct:boolean|null=null,producerValid=next<input.values.length,writeReady=(wp-grayDecode(rs[1])+8)%8!==4,consumerReady=input.consumer==='ready'||readEdges%4<2,readValid=rp!==grayDecode(ws[1]);
  if(reset){
   if(input.reset==='both'){canceled.push(...queue);queue.length=0;slots.fill(null);wp=0;rp=0;rs=[0,0];ws=[0,0];notes.push('Coordinated reset cancels all accepted outstanding tags; both domains and synchronizers restart. Source tag identity continues.');}
   else {rp=0;ws=[0,0];notes.push('Unsafe reader-only reset: writer state and outstanding transfers remain. The original exactly-once contract is no longer assured.');}
   notes.push('Reset dominates any coincident clock edge in this declared test.');readValid=false;consumerReady=false;producerValid=false;writeReady=false;
  } else {
   const oldWp=wp,oldRp=rp,oldRs:[number,number]=[...rs],oldWs:[number,number]=[...ws],full=(wp-grayDecode(rs[1])+8)%8===4;
   // Both domains sample pre-edge state, including when their clocks coincide.
   if(readEdge){readEdges++;if(!readValid)emptyReadEdges++;if(readValid&&consumerReady){const word=slots[rp%4];observedTag=word?.tag??null;observedValue=word?.value??null;correct=word!==null&&word.tag===queue[0];if(correct){consumed.push(word!.tag);queue.shift();rp=(rp+1)%8;notes.push(`Consumer accepts ${word!.tag} = ${word!.value}.`);}else {violation=`At tick ${time}, reader observed ${word?.tag??'an unwritten slot'}; next accepted tag was ${queue[0]??'none'}.`;notes.push(violation);}}}
   if(!violation&&writeEdge&&producerValid){if(full){writeStalls++;notes.push('Writer stalls: its synchronized read pointer still reports full.');}else{const tag=`tag-${next}`,word={tag,value:input.values[next]};slots[wp%4]=word;queue.push(tag);accepted.push(tag);acceptedTag=tag;next++;wp=(wp+1)%8;notes.push(`Producer transfers ${tag} = ${word.value}.`);}}
   if(writeEdge)rs=[grayEncode(oldRp),oldRs[0]];if(readEdge)ws=[grayEncode(oldWp),oldWs[0]];
   if(readEdge&&!readValid)notes.push('Reader sees empty through its receiving-domain pointer.');
   if(readEdge&&readValid&&!consumerReady)notes.push('Consumer applies backpressure; no read transfer.');
  }
  if(time===0)notes.push('Empty FIFO. Each pointer includes two address bits and one wrap bit.');
  const state=snap();events.push({index:events.length,time,writeEdge,readEdge,reset,producerValid,writeReady,consumerReady,acceptedTag,observedTag,observedValue,readValid,correct,notes,state});
  if(violation)break;
  if(next===input.values.length&&queue.length===0&&(input.reset==='none'||time>=input.resetAt))break;
 }
 return {version:hardwareReliabilityVersion,input,events,status:violation?'contract-violation':next===input.values.length&&queue.length===0?'complete':'incomplete',violation,totals:{accepted:accepted.length,consumed:consumed.length,canceled:canceled.length,pending:queue.length,writeStalls,emptyReadEdges}};
}
export type EccInput={payload:number;flips:readonly number[];faultStep:number;checkpointEvery:number;recovery:'stop'|'restore-healthy';steps:number};
export const eccDefaults:EccInput={payload:9,flips:[1,2],faultStep:4,checkpointEvery:2,recovery:'restore-healthy',steps:6};
export type EccDecoded={syndrome:number;overallParity:number;classification:'clean'|'single-corrected'|'overall-corrected'|'double-detected';correctedPosition:number|null;correctedBits:number[];payload:number|null;parityChecks:{mask:number;positions:number[];value:number}[]};
export function encodeSecded(payload:number):number[]{must(Number.isInteger(payload)&&payload>=0&&payload<16,'SECDED payload must be 0…15.');const bits=Array(8).fill(0) as number[];[3,5,6,7].forEach((p,i)=>bits[p-1]=(payload>>i)&1);for(const p of [1,2,4])for(let j=1;j<=7;j++)if((j&p)&&j!==p)bits[p-1]^=bits[j-1];bits[7]=bits.slice(0,7).reduce((a,b)=>a^b,0);return bits;}
export function decodeSecded(value:readonly number[]):EccDecoded{
 must(Array.isArray(value)&&value.length===8,'Codeword must contain eight bits.');for(const bit of value)must(bit===0||bit===1,'Codeword entries must be bits.');
 const bits=[...value],parityChecks=[1,2,4].map(mask=>{const positions=Array.from({length:7},(_,i)=>i+1).filter(p=>p&mask);return {mask,positions,value:positions.reduce((s,p)=>s^bits[p-1],0)};});
 const syndrome=parityChecks.reduce((s,c)=>s+c.mask*c.value,0),overallParity=bits.reduce((a,b)=>a^b,0);let classification:EccDecoded['classification']='clean',correctedPosition:number|null=null;
 if(syndrome!==0&&overallParity===0)classification='double-detected';else if(overallParity===1){correctedPosition=syndrome||8;classification=syndrome===0?'overall-corrected':'single-corrected';bits[correctedPosition-1]^=1;}
 return {syndrome,overallParity,classification,correctedPosition,correctedBits:bits,payload:classification==='double-detected'?null:[3,5,6,7].reduce((s,p,i)=>s+(bits[p-1]<<i),0),parityChecks};
}
export function normalizeEccInput(v:unknown):EccInput{
 const x=record(v,['payload','flips','faultStep','checkpointEvery','recovery','steps']);encodeSecded(x.payload as number);must(Array.isArray(x.flips)&&x.flips.length<=3,'Inject at most three distinct bit flips.');for(const p of x.flips)must(Number.isInteger(p)&&p>=1&&p<=8,'Bit positions must be 1…8.');must(new Set(x.flips).size===x.flips.length,'Flipped positions must be distinct.');must(Number.isInteger(x.steps)&&(x.steps as number)>=2&&(x.steps as number)<=8,'Use 2–8 consumer steps.');must(Number.isInteger(x.faultStep)&&(x.faultStep as number)>=1&&(x.faultStep as number)<=(x.steps as number),'Fault step must lie inside the run.');must(Number.isInteger(x.checkpointEvery)&&(x.checkpointEvery as number)>=1&&(x.checkpointEvery as number)<=4,'Checkpoint interval must be 1–4 steps.');must(x.recovery==='stop'||x.recovery==='restore-healthy','Unknown recovery policy.');return {payload:x.payload as number,flips:[...x.flips].sort((a,b)=>a-b),faultStep:x.faultStep as number,checkpointEvery:x.checkpointEvery as number,recovery:x.recovery,steps:x.steps as number};
}
export type ConsumerEvent={index:number;kind:'start'|'read'|'compute'|'checkpoint'|'restore'|'blocked'|'complete';step:number;sum:number;completedSteps:number;checkpointSteps:number;checkpointSum:number;executedSteps:number;discardedSteps:number;label:string;decoded:EccDecoded|null;fixtureTruthMatches:boolean|null};
export type EccRecovery={version:typeof hardwareReliabilityVersion;input:EccInput;encoded:number[];received:number[];decoded:EccDecoded;injectedPositions:number[];withinGuarantee:boolean;fixtureTruthMatches:boolean|null;events:ConsumerEvent[];finalSum:number|null;referenceSum:number;status:'complete'|'blocked'|'silent-corruption-in-fixture';totals:{executedSteps:number;discardedSteps:number;completedSteps:number;checkpointSteps:number;reads:number;restores:number}};
export function buildEccRecovery(v:unknown):EccRecovery{
 const input=normalizeEccInput(v),encoded=encodeSecded(input.payload),received=[...encoded];for(const p of input.flips)received[p-1]^=1;const decoded=decodeSecded(received);
 let sum=0,completed=0,cpStep=0,cpSum=0,executed=0,discarded=0,reads=0,restores=0,faultUsed=false,blocked=false;const events:ConsumerEvent[]=[];
 const add=(kind:ConsumerEvent['kind'],step:number,label:string,d:EccDecoded|null=null)=>events.push({index:events.length,kind,step,sum,completedSteps:completed,checkpointSteps:cpStep,checkpointSum:cpSum,executedSteps:executed,discardedSteps:discarded,label,decoded:d,fixtureTruthMatches:d?.payload===null||!d?null:d.payload===input.payload});
 add('start',0,'Consumer starts from an intact checkpoint: zero completed steps and sum zero.');
 while(completed<input.steps&&!blocked){
  const step=completed+1,inject=!faultUsed&&step===input.faultStep,d=inject?decoded:decodeSecded(encoded);if(inject)faultUsed=true;reads++;add('read',step,`${inject?'Injected':'Healthy'} codeword read: ${d.classification}.`,d);
  if(d.payload===null){if(input.recovery==='stop'){blocked=true;add('blocked',step,'Uncorrectable word is not consumed. No final result is published.');break;}
   discarded+=completed-cpStep;completed=cpStep;sum=cpSum;restores++;add('restore',cpStep,'Restore the intact checkpoint and a separately assumed healthy word. Re-execute discarded progress; ECC itself did not repair the double error.');continue;
  }
  sum+=d.payload;completed++;executed++;add('compute',step,`Consume decoded value ${d.payload}; sum becomes ${sum}.`,d);
  if(completed%input.checkpointEvery===0||completed===input.steps){cpStep=completed;cpSum=sum;add('checkpoint',step,'Atomic intact checkpoint records the current consumer state. Storage faults and write time are outside this case.');}
 }
 if(!blocked)add('complete',completed,'The finite consumer run is complete; compare its sum with the injected-fixture ground truth.');
 const finalSum=blocked?null:sum,referenceSum=input.payload*input.steps;
 return {version:hardwareReliabilityVersion,input,encoded,received,decoded,injectedPositions:[...input.flips],withinGuarantee:input.flips.length<=2,fixtureTruthMatches:decoded.payload===null?null:decoded.payload===input.payload,events,finalSum,referenceSum,status:blocked?'blocked':finalSum===referenceSum?'complete':'silent-corruption-in-fixture',totals:{executedSteps:executed,discardedSteps:discarded,completedSteps:completed,checkpointSteps:cpStep,reads,restores}};
}
export type ReliabilityRecord={schemaVersion:1;modelVersion:typeof hardwareReliabilityVersion;fifo:FifoInput;ecc:EccInput};
export function makeReliabilityRecord(fifo:FifoInput,ecc:EccInput):ReliabilityRecord{return {schemaVersion:1,modelVersion:hardwareReliabilityVersion,fifo:normalizeFifoInput(fifo),ecc:normalizeEccInput(ecc)};}
export function parseReliabilityRecord(raw:string):ReliabilityRecord{must(raw.length<=65536,'Input record exceeds 64 KiB.');const x=record(JSON.parse(raw),['schemaVersion','modelVersion','fifo','ecc']);must(x.schemaVersion===1&&x.modelVersion===hardwareReliabilityVersion,'Record model/schema is incompatible; the original record remains unchanged.');return makeReliabilityRecord(normalizeFifoInput(x.fifo),normalizeEccInput(x.ecc));}
export const reliabilityRecordKey='atlas-hardware-reliability-input',reliabilityRecoveryKey='atlas-hardware-reliability-older-inputs';
export type ReliabilityStorage={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void};
export function saveReliabilityRecord(storage:ReliabilityStorage,r:ReliabilityRecord):void{
 const next=JSON.stringify(parseReliabilityRecord(JSON.stringify(r))),old=storage.getItem(reliabilityRecordKey);if(old!==null){let valid=true;try{parseReliabilityRecord(old);}catch{valid=false;}if(!valid){const raw=storage.getItem(reliabilityRecoveryKey),history:unknown=raw===null?[]:JSON.parse(raw);must(Array.isArray(history)&&history.every(v=>typeof v==='string'),'Older-record storage is unreadable; active input is preserved.');if(!history.includes(old))storage.setItem(reliabilityRecoveryKey,JSON.stringify([...history,old]));}}
 storage.setItem(reliabilityRecordKey,next);
}
export function olderReliabilityRecords(storage:ReliabilityStorage):string|null{
 const entries:string[]=[],raw=storage.getItem(reliabilityRecoveryKey);if(raw!==null){let parsed:unknown;try{parsed=JSON.parse(raw);}catch{parsed=null;}if(Array.isArray(parsed)&&parsed.every(v=>typeof v==='string'))entries.push(...parsed as string[]);else entries.push(raw);}
 const active=storage.getItem(reliabilityRecordKey);if(active!==null){try{parseReliabilityRecord(active);}catch{if(!entries.includes(active))entries.push(active);}}return entries.length===0?null:entries.length===1?entries[0]:JSON.stringify({format:'atlas-hardware-older-raw-inputs',records:entries},null,2);
}
