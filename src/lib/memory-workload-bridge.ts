import {architecturePresets,referenceMultiply} from './architecture-execution.ts';
import {buildMachineExecution,machineTiming,machineExecutionVersion,type MachineExecution,type MachineEvent} from './machine-execution.ts';
import {encodeSecded,decodeSecded,hardwareReliabilityVersion,type EccDecoded} from './hardware-reliability.ts';
import {hbmStack,hbmStackDefaults,bondRoutes} from './numeric-math.ts';
import {evaluateMemoryExplorer,memoryExplorerDefaults,decodeMemoryAddress,memoryExplorerVersion,type MemoryContext,type MemoryRoute,type EvidenceState} from './memory-interfaces.ts';

export const memoryWorkloadVersion='memory-workload-bridge-1' as const;
export const memoryWorkloadSource='authored-matrix-memory-boundary-1' as const;
export type MemoryWorkloadInput={
 specimen:'two'|'three';route:MemoryRoute;dies:4|8|12|16;selectedDie:number;
 registrationOffsetUm:number;qualification:EvidenceState;
 bTier:'hbm'|'host-stage'|'read-tier-stage';payloadBudgetBytes:32|64|96|144|192;
 bankPlacement:'same-bank'|'split-banks';buffers:1|2;refreshEveryNs:0|64|96|160;
 protection:'secded'|'unchecked';fault:'none'|'single-data'|'double-data'|'triple';
 faultTensor:'A'|'B';faultWord:number;faultNibble:number;
};
export const memoryWorkloadDefaults:MemoryWorkloadInput={specimen:'three',route:'tc-ncf',dies:8,selectedDie:0,registrationOffsetUm:.1,qualification:'synthetic-pass',bTier:'hbm',payloadBudgetBytes:192,bankPlacement:'same-bank',buffers:2,refreshEveryNs:96,protection:'secded',fault:'single-data',faultTensor:'B',faultWord:0,faultNibble:0};
function must(value:unknown,message:string):asserts value{if(!value)throw Error(message);}
function object(value:unknown,keys:string[]):Record<string,unknown>{must(value&&typeof value==='object'&&!Array.isArray(value),'Expected an object.');must(Object.keys(value).length===keys.length&&Object.keys(value).every(k=>keys.includes(k)),'Missing or unknown field.');return value as Record<string,unknown>;}
export function normalizeMemoryWorkload(value:unknown):MemoryWorkloadInput{
 const x=object(value,Object.keys(memoryWorkloadDefaults));
 const choices:Record<string,readonly unknown[]>={specimen:['two','three'],route:['tc-ncf','mr-muf','hybrid'],dies:[4,8,12,16],qualification:['not-provided','synthetic-pass','synthetic-fail'],bTier:['hbm','host-stage','read-tier-stage'],payloadBudgetBytes:[32,64,96,144,192],bankPlacement:['same-bank','split-banks'],buffers:[1,2],refreshEveryNs:[0,64,96,160],protection:['secded','unchecked'],fault:['none','single-data','double-data','triple'],faultTensor:['A','B']};
 for(const [key,values] of Object.entries(choices))must(values.includes(x[key]),`Invalid ${key}.`);
 for(const [key,max] of [['selectedDie',(x.dies as number)-1],['faultWord',x.specimen==='two'?3:8],['faultNibble',7]] as const)must(Number.isInteger(x[key])&&(x[key] as number)>=0&&(x[key] as number)<=max,`Invalid ${key}.`);
 must(typeof x.registrationOffsetUm==='number'&&Number.isFinite(x.registrationOffsetUm)&&x.registrationOffsetUm>=0&&x.registrationOffsetUm<=12,'Registration offset must be 0–12 µm.');
 return {...x} as MemoryWorkloadInput;
}
export function wordToBytes(value:number):number[]{must(Number.isInteger(value)&&value>=-2147483648&&value<=2147483647,'Word must be a signed 32-bit integer.');const a=new Uint8Array(4);new DataView(a.buffer).setInt32(0,value,true);return [...a];}
export function bytesToWord(value:readonly number[]):number{must(Array.isArray(value)&&value.length===4&&Array.from(value).every(x=>Number.isInteger(x)&&x>=0&&x<=255),'Expected four bytes.');return new DataView(Uint8Array.from(value).buffer).getInt32(0,true);}
export type ProtectedWord={originalBytes:number[];codewords:number[][];received:number[][];decoded:EccDecoded[];deliveredBytes:number[]|null;deliveredValue:number|null;injectedPositions:number[];correctedNibbles:number;detected:boolean};
export function readProtectedWord(bytes:readonly number[],nibble:number,flips:readonly number[],protection:MemoryWorkloadInput['protection']):ProtectedWord{
 bytesToWord(bytes);must(Number.isInteger(nibble)&&nibble>=0&&nibble<8,'Nibble must be 0–7.');must(Array.isArray(flips)&&flips.length<=3&&new Set(flips).size===flips.length&&Array.from(flips).every(p=>Number.isInteger(p)&&p>=1&&p<=8),'Use at most three distinct codeword bit positions 1–8.');must(protection==='secded'||protection==='unchecked','Unknown protection.');
 const payloads=bytes.flatMap(b=>[b%16,Math.floor(b/16)]),codewords=payloads.map(encodeSecded),received=codewords.map(b=>[...b]);for(const p of flips)received[nibble][p-1]^=1;
 const decoded=received.map(decodeSecded),detected=protection==='secded'&&decoded.some(d=>d.payload===null);
 const values=received.map((bits,i)=>protection==='secded'?decoded[i].payload:[3,5,6,7].reduce((sum,p,k)=>sum+(bits[p-1]<<k),0));
 const deliveredBytes=detected?null:Array.from({length:4},(_,i)=>values[2*i]!+16*values[2*i+1]!);
 return {originalBytes:[...bytes],codewords,received,decoded,deliveredBytes,deliveredValue:deliveredBytes?bytesToWord(deliveredBytes):null,injectedPositions:[...flips],correctedNibbles:protection==='secded'?decoded.filter(d=>d.correctedPosition!==null).length:0,detected};
}
export type WorkloadWord={id:string;tensor:'A'|'B';row:number;column:number;physical:number;stackPayloadAddress:number;value:number;bytes:number[];sourceTier:MemoryWorkloadInput['bTier'];address:ReturnType<typeof decodeMemoryAddress>};
export type JoinedRead={transactionId:string;wordId:string;physical:number;stackPayloadAddress:number;timeNs:number;faultInjected:boolean;read:ProtectedWord};
export type JoinedEvent={index:number;kind:string;timeNs:number;machineTimeNs:number|null;label:string;transactionId:string|null;reads:JoinedRead[];macs:MachineEvent['macs'];partialOutput:number[][];published:boolean};
/** Count only issued refresh service observed before the stopped machine horizon. */
export function observedRefreshBusyNs(commands:readonly Pick<MachineExecution['commands'][number],'kind'|'startNs'|'endNs'>[],horizonNs:number):number{
 must(Number.isFinite(horizonNs)&&horizonNs>=0,'Observed machine horizon must be finite and nonnegative.');
 return commands.reduce((sum,c)=>{must(Number.isFinite(c.startNs)&&Number.isFinite(c.endNs)&&c.startNs>=0&&c.endNs>=c.startNs,'Invalid command interval.');return sum+(c.kind==='REF'?Math.max(0,Math.min(c.endNs,horizonNs)-c.startNs):0);},0);
}
export const memoryWorkloadAssumptions=[
 'The selected C=AB specimen is the only workload here. Its actual little-endian signed 32-bit operand bytes are initialized, copied for remote B placement, read, checked and consumed. No large-model byte count is substituted for these matrices.',
 'The existing stack geometry and synthetic evidence gate admits or blocks the workload. Registration has a fixed 10 µm pad width; zero one-axis overlap blocks admission. Positive overlap supplies no resistance, clock, error probability or life prediction. Known-good and post-bond evidence are fixed synthetic pass; qualification is independently selected.',
 'A declared payload allocation budget holds the sum of padded A, B and C ranges; unallocated gaps in the synthetic address map are not reserved bytes. All B bytes must be staged before compute, so remote placement does not save destination capacity. Host and conceptual read-tier sources have no modeled capacity or vendor integration. Read tier is read-only; C is written only in the selected stack.',
 'Each logical 32-bit word uses eight independent extended-Hamming (8,4) codewords: 64 encoded bits for 32 payload bits. This intentionally inefficient teaching code is not a vendor ECC scheme. Parity capacity and signaling are outside the payload budget and transaction schedule; code arithmetic has zero assigned time.',
 'An explicit persistent fault flips the chosen positions in one selected nibble after initialization/staging. Every read of that word sees the same fault. It is independent of geometry, temperature, source tier and refresh. There is no spontaneous decay or inferred error rate. Refresh scheduling does not repair the injected fault.',
 'Machine transactions use the existing synthetic 1 KiB, two-bank address map. The same word has a separate stack payload address, selectedDie×2^31 + machine physical byte. The identity translation is declared, not a claim that the two geometries or their bank fields are the same.',
 'Remote full-buffer B staging is serialized before the existing machine clock: authored 20 ns startup plus 8 ns per aligned 16-byte copy. Initial preparation, ECC encoding, gate evaluation and output consumption outside ownership synchronization have no assigned time. No real link throughput or end-to-end application latency is claimed.',
 'The existing machine event plan determines command, refresh, DMA-slot and MAC timing independently of values. This bridge replays its read/compute/write events using decoded bytes, not the plan\'s reference output. Accumulators are exact integers within the bounded fixture; output stores explicitly narrow to signed 32-bit modulo 2^32 and count any changed word. At an uncorrectable read, execution stops and no output is published; subsequent planned events are omitted. No checkpoint restoration or in-flight cancellation latency is modeled.',
 'Unchecked mode extracts received data positions without correction. SECDED guarantees correction of one bit and detection of two bits within each 8-bit codeword; three flips can miscorrect. Independent original-matrix truth diagnoses silent corruption after consumption, never repairs it.',
];
function stackContext(input:MemoryWorkloadInput,allocatedBytes:number):MemoryContext{
 const d=hbmStackDefaults,route=bondRoutes[input.route],stack=hbmStack({...d,dies:input.dies,gapUm:route.gapUm,interfaceKW:route.interfaceKW});
 // A single declared stack, one screened input set; selected matrices are transient workspace.
 return {sourceId:memoryWorkloadSource,route:input.route,dies:input.dies,hbmStacksPerPackage:1,dieUm:d.dieUm,baseUm:d.baseUm,capUm:d.capUm,gapUm:route.gapUm,areaMm2:d.areaMm2,coolantC:d.coolantC,interfaceKW:route.interfaceKW,system:{stack,screenedMemoryDies:input.dies,stackStarts:1,goodStacks:stack.conditionalYield,nextStepFits:true,executionFeasible:true,hostAppendBytes:0,token:{kvAppendBytes:0,activationTraffic:0},placement:{size:{weights:0,kv:0,append:0,total:allocatedBytes},caps:{sram:0,hbm:stack.capacityGB*1e9,host:0,hbf:0},hbm:{weights:0,kv:0,workspace:allocatedBytes},hbf:{weights:0,kv:0},host:{weights:0,kv:0},sram:{tile:0},missing:{weights:0,kv:0,workspace:0,tile:0},hbmTraffic:0,externalRead:0,requiredStagingBytes:0,stagingFits:true,feasible:true}}};
}
export function buildMemoryWorkload(value:unknown){
 const input=normalizeMemoryWorkload(value),matrices=architecturePresets[input.specimen],plan=buildMachineExecution({a:matrices.a,b:matrices.b,bankPlacement:input.bankPlacement,buffers:input.buffers,refreshEveryNs:input.refreshEveryNs}),n=plan.input.size;
 const allocatedBytes=plan.mappings.reduce((sum,m)=>sum+m.lengthBytes,0),base=input.selectedDie*2**31;
 const qualification=evaluateMemoryExplorer({...memoryExplorerDefaults,byteAddress:base,registrationOffsetUm:input.registrationOffsetUm,qualificationEvidence:input.qualification},stackContext(input,allocatedBytes));
 const admitted=qualification.evidence.status==='accepted-within-example',placementFits=allocatedBytes<=input.payloadBudgetBytes;
 const words:WorkloadWord[]=[];
 for(const tensor of ['A','B'] as const){const m=plan.mappings.find(x=>x.tensor===tensor)!;for(let row=0;row<n;row++)for(let column=0;column<n;column++){const physical=m.physicalStart+(row*n+column)*4,value=matrices[tensor==='A'?'a':'b'][row][column],stackPayloadAddress=base+physical;words.push({id:`${tensor}[${row},${column}]`,tensor,row,column,physical,stackPayloadAddress,value,bytes:wordToBytes(value),sourceTier:tensor==='A'?'hbm':input.bTier,address:decodeMemoryAddress(stackPayloadAddress,0,input.dies)});}}
 const selected=words.find(w=>w.tensor===input.faultTensor&&w.row*n+w.column===input.faultWord)!,flips=input.fault==='none'?[]:input.fault==='single-data'?[3]:input.fault==='double-data'?[3,5]:[1,2,3];
 const sourceB=new Uint8Array(plan.mappings[1].lengthBytes);for(const w of words.filter(w=>w.tensor==='B'))sourceB.set(w.bytes,w.physical-plan.mappings[1].physicalStart);
 const destination=new Map<number,number[]>();for(const w of words.filter(w=>w.tensor==='A'||input.bTier==='hbm'))destination.set(w.physical,[...w.bytes]);
 const staging:{index:number;sourceOffset:number;destinationPhysical:number;destinationStackAddress:number;bytes:number[];startNs:number;endNs:number}[]=[],events:JoinedEvent[]=[],reads:JoinedRead[]=[],commands:MachineExecution['commands']=[],partial=Array.from({length:n},()=>Array(n).fill(0) as number[]),stored=new Map<number,number>();
 let currentNs=0,published=false,blocked=false,executedMacs=0,outputNarrowedWords=0;
 const add=(kind:string,label:string,timeNs:number,machineTimeNs:number|null=null,transactionId:string|null=null,eventReads:JoinedRead[]=[],macs:MachineEvent['macs']=[])=>{currentNs=timeNs;events.push({index:events.length,kind,label,timeNs,machineTimeNs,transactionId,reads:eventReads,macs,partialOutput:partial.map(r=>[...r]),published});};
 add('admission',`Stack: ${qualification.evidence.status}. Payload placement: ${allocatedBytes}/${input.payloadBudgetBytes} B.`,0);
 if(!admitted||!placementFits)add('blocked',!admitted?'Stack admission is incomplete or failed; no memory command executes.':'The full A/B/C destination allocation does not fit the declared payload allocation budget; no memory command executes.',0);
 else {
  if(input.bTier!=='hbm'){
   add('staging-start',`${input.bTier}: stage the entire padded B buffer before machine execution.`,0);
   for(let offset=0;offset<sourceB.length;offset+=16){const startNs=20+offset/16*8,endNs=startNs+8,bytes=[...sourceB.slice(offset,offset+16)];staging.push({index:staging.length,sourceOffset:offset,destinationPhysical:plan.mappings[1].physicalStart+offset,destinationStackAddress:base+plan.mappings[1].physicalStart+offset,bytes,startNs,endNs});for(let j=0;j<16;j+=4)destination.set(plan.mappings[1].physicalStart+offset+j,bytes.slice(j,j+4));add('staging-copy',`Copy B source bytes ${offset}–${offset+15} to the selected stack; actual bytes retained in the ledger.`,endNs);}
  }
  const stagingNs=currentNs,slots=Array.from({length:input.buffers},()=>new Map<string,number>());
  for(const e of plan.events){
   const eventReads:JoinedRead[]=[],macs:MachineEvent['macs']=[];
   if(e.kind==='command')commands.push({...plan.commands.find(c=>c.id===e.commandId)!});
   if(e.kind==='acquire')slots[e.buffer!].clear();
   if(e.kind==='read-complete'){
    const t=plan.transactions.find(t=>t.id===e.transactionId)!;
    for(const physical of new Set(t.operands.map(o=>o.physical))){const w=words.find(w=>w.physical===physical)!;const bytes=destination.get(physical);must(bytes,'Operand was not placed before read.');const faultInjected=w.id===selected.id&&flips.length>0,read=readProtectedWord(bytes,input.faultNibble,faultInjected?flips:[],input.protection),item={transactionId:t.id,wordId:w.id,physical,stackPayloadAddress:w.stackPayloadAddress,timeNs:stagingNs+e.timeNs,faultInjected,read};reads.push(item);eventReads.push(item);if(read.detected)blocked=true;else slots[e.buffer!].set(w.id,read.deliveredValue!);}
   }
   if(e.kind==='compute-end'){const batch=plan.batches.find(b=>b.id===e.batchId)!;for(const lane of batch.lanes){const a=slots[e.buffer!].get(lane.a.id),b=slots[e.buffer!].get(lane.b.id);must(a!==undefined&&b!==undefined,'Compute requires actual delivered operands.');const before=partial[lane.row][lane.column],after=before+a*b;must(Number.isSafeInteger(after),'Matrix accumulation left the exact integer boundary.');partial[lane.row][lane.column]=after;macs.push({lane:lane.lane,row:lane.row,column:lane.column,k:lane.k,a,b,before,after});executedMacs++;}}
   if(e.kind==='write-complete'){const t=plan.transactions.find(t=>t.id===e.transactionId)!;for(let r=0;r<n;r++)for(let c=0;c<n;c++){const p=plan.mappings[2].physicalStart+(r*n+c)*4;if(p>=t.physical&&p<t.physical+16){const narrowed=partial[r][c]|0;if(narrowed!==partial[r][c])outputNarrowedWords++;stored.set(p,narrowed);}}}
   if(e.kind==='host-sync'){must(stored.size===n*n,'Host may only read fully stored output.');published=true;}
   add(e.kind,e.kind==='command'?`Machine clock: ${e.label}`:e.label,stagingNs+e.timeNs,e.timeNs,e.transactionId,eventReads,macs);
   if(blocked){add('ecc-blocked','Detected uncorrectable input; reject this operand, stop the consumer and publish no C. Later scheduled events are not executed.',currentNs,e.timeNs,e.transactionId);break;}
  }
 }
 const finalOutput=published?Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>stored.get(plan.mappings[2].physicalStart+(r*n+c)*4)!)):null,reference=referenceMultiply(matrices.a,matrices.b),correct=finalOutput===null?null:JSON.stringify(finalOutput)===JSON.stringify(reference);
 const completedReads=events.filter(e=>e.kind==='read-complete').length,completedWrites=events.filter(e=>e.kind==='write-complete').length;
 const outputWords=finalOutput?.flatMap((row,r)=>row.map((value,c)=>({id:`C[${r},${c}]`,physical:plan.mappings[2].physicalStart+(r*n+c)*4,stackPayloadAddress:base+plan.mappings[2].physicalStart+(r*n+c)*4,value,bytes:wordToBytes(value)})))??[];
 const stagingNs=staging.at(-1)?.endNs??0,machineElapsedNs=events.filter(e=>e.machineTimeNs!==null).at(-1)?.machineTimeNs??0;
 const commandTimeline=commands.map(c=>({id:c.id,kind:c.kind,machineStartNs:c.startNs,machineEndNs:c.endNs,joinedStartNs:stagingNs+c.startNs,joinedEndNs:stagingNs+c.endNs}));
 return {version:memoryWorkloadVersion,source:memoryWorkloadSource,input,workload:{id:`matrix-${input.specimen}-int32-le-1`,a:matrices.a.map(r=>[...r]),b:matrices.b.map(r=>[...r]),words,selectedWord:selected},qualification:{status:qualification.evidence.status,admitted,heightUm:qualification.stack.heightUm,peakC:qualification.stack.thermal.peakC,gapUm:qualification.interfaceDetail.gapUm,overlapFraction:qualification.interfaceDetail.overlapFraction,layers:qualification.stack.layers},placement:{fits:placementFits,allocatedBytes,payloadBudgetBytes:input.payloadBudgetBytes,mappings:plan.mappings,sourceBBytes:[...sourceB],staging,remoteSourceReadBytes:staging.reduce((s,x)=>s+x.bytes.length,0),destinationStagingWriteBytes:staging.reduce((s,x)=>s+x.bytes.length,0),scope:'The budget counts allocated payload ranges, not the highest address or unallocated holes. It is separate from whole-stack capacity and ECC storage. Full-buffer staging retains the entire B allocation.'},events,reads,commands,commandClock:'machine-relative-ns' as const,commandTimeline,reference,finalOutput,outputWords,correct,status:!admitted?'admission-blocked':!placementFits?'placement-blocked':blocked?'ecc-blocked':correct?'complete':'silent-corruption',totals:{durationNs:currentNs,stagingNs,machineElapsedNs,macs:executedMacs,outputNarrowedWords,readTransactionBytes:completedReads*16,writeTransactionBytes:completedWrites*16,operandReadOccurrences:reads.length,correctedNibbles:reads.reduce((s,r)=>s+r.read.correctedNibbles,0),detectedReads:reads.filter(r=>r.read.detected).length,refreshes:commands.filter(c=>c.kind==='REF').length,refreshReservedNs:commands.filter(c=>c.kind==='REF').length*machineTiming.tRFCNs,refreshBusyNs:observedRefreshBusyNs(commands,machineElapsedNs)},scheduleModelVersion:machineExecutionVersion,eccModelVersion:hardwareReliabilityVersion,stackModelVersion:memoryExplorerVersion,assumptions:[...memoryWorkloadAssumptions]};
}
export type MemoryWorkloadResult=ReturnType<typeof buildMemoryWorkload>;
export function encodeMemoryWorkloadRecord(input:MemoryWorkloadInput):string{return JSON.stringify({schemaVersion:1,modelVersion:memoryWorkloadVersion,source:memoryWorkloadSource,input:normalizeMemoryWorkload(input)},null,2);}
export function readMemoryWorkloadRecord(raw:string):MemoryWorkloadInput{must(typeof raw==='string'&&new TextEncoder().encode(raw).length<=20000,'Record exceeds 20,000 bytes.');const x=object(JSON.parse(raw),['schemaVersion','modelVersion','source','input']);must(x.schemaVersion===1&&x.modelVersion===memoryWorkloadVersion&&x.source===memoryWorkloadSource,'Record identity is incompatible.');return normalizeMemoryWorkload(x.input);}
