import {normalizeArchitectureInput, referenceMultiply, architecturePresets, type Matrix} from './architecture-execution.ts';

/** Exact bounded arithmetic plus a declared teaching memory system; never vendor timing. */
export const machineExecutionVersion = 'machine-execution-1';
export type MachineExecutionInput = {
  a: Matrix; b: Matrix;
  globalLayout?: 'row-major' | 'column-major';
  bankPlacement?: 'same-bank' | 'split-banks';
  alignmentBytes?: 0 | 12;
  sharedPadding?: 0 | 1;
  buffers?: 1 | 2;
  macNs?: 2 | 8 | 24;
  refreshEveryNs?: 0 | 64 | 96 | 160;
  fault?: 'none' | 'unmapped-b' | 'early-consume' | 'reuse-in-flight';
};
export type MachineInput = Required<MachineExecutionInput> & {a:number[][];b:number[][];size:2|3};
export const machineDefaults: MachineExecutionInput = {a:architecturePresets.three.a,b:architecturePresets.three.b, globalLayout:'row-major',bankPlacement:'same-bank',alignmentBytes:0,sharedPadding:0,buffers:2,macNs:8,refreshEveryNs:96,fault:'none'};
export const machineGeometry = {wordBytes:4,lanes:4,transactionBytes:16,sharedBanks:4,dramBanks:2,transactionsPerRow:4} as const;
export const machineTiming = {tRCDNs:6,tRPNs:4,tRASNs:16,tCLNs:8,tCWLNs:6,burstNs:4,tWRNs:8,tRFCNs:12,sharedRoundNs:1,submitSpacingNs:1} as const;
export type MachineTensor='A'|'B'|'C';
export type BufferMapping={tensor:MachineTensor;iovaStart:number;physicalStart:number;lengthBytes:number;permission:'read'|'write';mapped:boolean};
export type DramAddress={bank:number;row:number;column:number;byteInTransaction:number};
export type OperandAddress={id:string;tensor:'A'|'B';row:number;column:number;value:number;lane:number;iova:number;physical:number;sharedByte:number;sharedBank:number};
export type LaneOperation={lane:number;row:number;column:number;k:number;a:OperandAddress;b:OperandAddress};
export type SharedGroup={tensor:'A'|'B';bank:number;distinctWords:number[];lanes:number[];rounds:number;broadcast:boolean};
export type Transaction={id:string;batchId:string|null;tensor:MachineTensor;direction:'read'|'write';iova:number;physical:number;address:DramAddress;operands:OperandAddress[];submittedNs:number;serviceStartNs:number;commandNs:number;dataStartNs:number;dataEndNs:number;completedNs:number;controllerFreeNs:number;queueWaitNs:number;rowDisposition:'closed'|'hit'|'conflict';buffer:number|null};
export type DramCommand={id:string;kind:'ACT'|'PRE'|'PREA'|'RD'|'WR'|'REF';startNs:number;endNs:number;bank:number|null;row:number|null;transactionId:string|null;refreshDueNs?:number;refreshLatenessNs?:number};
export type MachineBatch={id:string;index:number;k:number;buffer:number;lanes:LaneOperation[];sharedGroups:SharedGroup[];sharedRounds:number;submittedNs:number;readyNs:number;computeStartNs:number;computeEndNs:number;transactionIds:string[]};
export type BufferState={index:number;phase:'free'|'dma'|'ready'|'compute';batchId:string|null;words:Record<string,number>};
export type MachineState={buffers:BufferState[];openRows:(number|null)[];partialOutput:number[][];completedMacs:number[][];inputOwner:'cpu'|'device';outputOwner:'device'|'cpu';completedTransactions:string[];storedOutputs:string[];rejections:string[]};
export type MachineEvent={id:string;timeNs:number;kind:'map'|'handoff'|'acquire'|'command'|'read-complete'|'ready'|'compute-start'|'compute-end'|'write-complete'|'host-sync'|'guard-rejected'|'mapping-fault';label:string;batchId:string|null;buffer:number|null;transactionId:string|null;commandId:string|null;state:MachineState;macs:{lane:number;row:number;column:number;k:number;a:number;b:number;before:number;after:number}[]};
export type MachineExecution={version:typeof machineExecutionVersion;input:MachineInput;mappings:BufferMapping[];batches:MachineBatch[];transactions:Transaction[];commands:DramCommand[];events:MachineEvent[];reference:number[][];finalOutput:number[][]|null;status:'complete'|'complete-with-guard-rejection'|'mapping-blocked';totals:{durationNs:number;macs:number;requestedReadBytes:number;distinctInputBytes:number;readTransactionBytes:number;writeTransactionBytes:number;sharedRounds:number;refreshes:number;refreshBusyNs:number;computeBusyNs:number};assumptions:string[]};
function requireValue(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const cloneMatrix=(m:number[][])=>m.map(r=>[...r]);
const zeros=(n:number)=>Array.from({length:n},()=>Array(n).fill(0) as number[]);
const key=(tensor:MachineTensor,row:number,column:number)=>`${tensor}[${row},${column}]`;
export function normalizeMachineInput(value:unknown):MachineInput{
  requireValue(value&&typeof value==='object'&&!Array.isArray(value),'Machine input must be an object.');
  const v=value as Record<string,unknown>;
  requireValue(Object.keys(v).every(k=>['a','b','size','globalLayout','bankPlacement','alignmentBytes','sharedPadding','buffers','macNs','refreshEveryNs','fault'].includes(k)),'Unknown machine input field.');
  const matrices=normalizeArchitectureInput({a:v.a,b:v.b,size:v.size});
  const pick=<T>(name:string,choices:readonly T[],fallback:T):T=>{const x=v[name]===undefined?fallback:v[name];requireValue(choices.includes(x as T),`Invalid ${name}.`);return x as T;};
  return {a:matrices.a,b:matrices.b,size:matrices.size,globalLayout:pick('globalLayout',['row-major','column-major'],'row-major'),bankPlacement:pick('bankPlacement',['same-bank','split-banks'],'same-bank'),alignmentBytes:pick('alignmentBytes',[0,12],0),sharedPadding:pick('sharedPadding',[0,1],0),buffers:pick('buffers',[1,2],2),macNs:pick('macNs',[2,8,24],8),refreshEveryNs:pick('refreshEveryNs',[0,64,96,160],96),fault:pick('fault',['none','unmapped-b','early-consume','reuse-in-flight'],'none')};
}
/** Synthetic map: low 4 bits within segment; next 2 select column; next bit selects bank. */
export function decodeMachineAddress(physical:number):DramAddress{
  requireValue(Number.isSafeInteger(physical)&&physical>=0&&physical<1024,'Physical address must be an integer in the 1 KiB teaching space.');
  return {byteInTransaction:physical%16,column:Math.floor(physical/16)%4,bank:Math.floor(physical/64)%2,row:Math.floor(physical/128)};
}
export function translateMachineAddress(mappings:readonly BufferMapping[],iova:number,bytes:number,permission:'read'|'write'):number{
  requireValue(Number.isSafeInteger(iova)&&Number.isSafeInteger(bytes)&&bytes>0,'A device request needs integer address and positive byte length.');
  const m=mappings.find(m=>m.mapped&&iova>=m.iovaStart&&iova+bytes<=m.iovaStart+m.lengthBytes&&m.permission===permission);
  requireValue(m,`IOMMU teaching guard denied ${permission} at IOVA ${iova} (${bytes} bytes).`);
  return m.physicalStart+iova-m.iovaStart;
}
export function groupSharedBanks(operands:readonly OperandAddress[]):SharedGroup[]{
  const groups=new Map<string,SharedGroup>();
  for(const o of operands){const id=`${o.tensor}:${o.sharedBank}`;let g=groups.get(id);if(!g){g={tensor:o.tensor,bank:o.sharedBank,distinctWords:[],lanes:[],rounds:0,broadcast:false};groups.set(id,g);}if(!g.distinctWords.includes(o.sharedByte))g.distinctWords.push(o.sharedByte);g.lanes.push(o.lane);g.rounds=g.distinctWords.length;g.broadcast=g.lanes.length>g.distinctWords.length;}
  return [...groups.values()];
}
export const machineAssumptions=[
  'C = AB uses exact signed integer arithmetic for square matrices of size 2 or 3 and entries within ±99. The existing architecture normalizer/reference is reused; actual accumulations use values delivered into named buffers.',
  'Four teaching lanes, 4-byte signed words, aligned 16-byte transactions, four shared banks and two DRAM banks are declared synthetic geometry. These are not a CUDA warp, HBM organization, vendor physical address function or measured memory hierarchy.',
  'Each A or B lane instruction groups identical aligned segments once. No cache persists between batches. Padding bytes are initialized and included in transferred bytes; requested operand bytes include repeated lane requests. These are different denominators.',
  'DRAM service is conservative FIFO: one transaction completes before the next starts. ACT, PRE, read/write latency, burst and write recovery have explicit assumed ns values. Bank parallelism, electrical signaling, ECC, arbitration and vendor command-rate constraints are omitted.',
  'When enabled, all-bank refresh has a fixed due grid from time zero. It runs at transaction boundaries or during idle time; an in-flight transaction is not interrupted. The trace records lateness. This is a teaching scheduling policy, not a retention guarantee or JEDEC compliance claim. Refresh disabled is a counterfactual comparison.',
  'One or two staging slots permit DMA/compute overlap. A slot cannot be acquired while owned, consumed before completion, or overwritten while compute reads it. Rejected unsafe actions have no side effects; safe work may still finish.',
  'Mapping is a declared finite IOVA-to-physical range and read/write permission check after CPU initialization. Handoff and final host synchronization are explicit zero-duration control events. This is not a page-table walker, real firmware, cache-coherence protocol, OS driver or full IOMMU implementation.',
  'Shared reads execute A then B; distinct words in one bank serialize, while repeated reads of the same word broadcast. The shared layout is separate from global layout. MAC duration is an assumption, not throughput on any processor.',
  'Model time begins after input initialization/mapping and ends when the output write completes and ownership returns to the host. No claimed end-to-end application latency, energy or speedup extends outside this boundary.',
];
export function buildMachineExecution(value:unknown):MachineExecution{
  const input=normalizeMachineInput(value),n=input.size;
  const byteLength=Math.ceil((input.alignmentBytes+n*n*4)/16)*16;
  const mappings:BufferMapping[]=[{tensor:'A',iovaStart:4096,physicalStart:0,lengthBytes:byteLength,permission:'read',mapped:true},{tensor:'B',iovaStart:8192,physicalStart:256+(input.bankPlacement==='split-banks'?64:0),lengthBytes:byteLength,permission:'read',mapped:input.fault!=='unmapped-b'},{tensor:'C',iovaStart:12288,physicalStart:512,lengthBytes:Math.ceil(n*n*4/16)*16,permission:'write',mapped:true}];
  const offset=(t:MachineTensor,r:number,c:number)=>t==='C'?(r*n+c)*4:input.alignmentBytes+((t==='B'&&input.globalLayout==='column-major')?c*n+r:r*n+c)*4;
  const address=(t:MachineTensor,r:number,c:number)=>mappings.find(m=>m.tensor===t)!.iovaStart+offset(t,r,c);
  const memory=new Map<number,number>();
  for(const m of mappings)for(let b=0;b<m.lengthBytes;b+=4)memory.set(m.physicalStart+b,0);
  for(const t of ['A','B'] as const)for(let r=0;r<n;r++)for(let c=0;c<n;c++)memory.set(mappings.find(m=>m.tensor===t)!.physicalStart+offset(t,r,c),input[t==='A'?'a':'b'][r][c]);
  type Action=Omit<MachineEvent,'state'|'macs'> & {order:number};
  const actions:Action[]=[],transactions:Transaction[]=[],commands:DramCommand[]=[],batches:MachineBatch[]=[];
  const add=(timeNs:number,kind:MachineEvent['kind'],label:string,extra:Partial<Action>={})=>{const a:Action={id:`event-${actions.length}`,order:actions.length,timeNs,kind,label,batchId:null,buffer:null,transactionId:null,commandId:null,...extra};actions.push(a);return a;};
  add(0,'map','Driver maps initialized A/B as device-readable and C as device-writable.');
  add(0,'handoff','CPU hands input ownership to the device; host reads wait for output completion.');
  let ramTime=0,nextRefresh=input.refreshEveryNs||Infinity;
  const bankState=Array.from({length:2},()=>({row:null as number|null,activatedNs:-Infinity}));
  const command=(kind:DramCommand['kind'],startNs:number,endNs:number,bank:number|null,row:number|null,transactionId:string|null,extra:Partial<DramCommand>={})=>{
    const c:DramCommand={id:`command-${commands.length}`,kind,startNs,endNs,bank,row,transactionId,...extra};commands.push(c);add(startNs,'command',`${kind}${bank===null?' · all banks':` · bank ${bank}${row===null?'':`, row ${row}`}`} · ${startNs}–${endNs} ns`,{commandId:c.id,transactionId});return c;
  };
  const maintain=(arrival:number)=>{
    while(nextRefresh<=Math.max(ramTime,arrival)){
      let start=Math.max(ramTime,nextRefresh);
      const open=bankState.filter(b=>b.row!==null);
      if(open.length){start=Math.max(start,...open.map(b=>b.activatedNs+machineTiming.tRASNs));command('PREA',start,start+machineTiming.tRPNs,null,null,null);start+=machineTiming.tRPNs;for(const b of bankState)b.row=null;}
      command('REF',start,start+machineTiming.tRFCNs,null,null,null,{refreshDueNs:nextRefresh,refreshLatenessNs:start-nextRefresh});ramTime=start+machineTiming.tRFCNs;nextRefresh+=input.refreshEveryNs;
    }
  };
  const schedule=(tensor:MachineTensor,iova:number,operands:OperandAddress[],batch:MachineBatch|null,arrival:number,direction:'read'|'write'):Transaction=>{
    const physical=translateMachineAddress(mappings,iova,16,direction),a=decodeMachineAddress(physical),id=`transaction-${transactions.length}`;
    maintain(arrival);let time=Math.max(ramTime,arrival);const serviceStartNs=time,bank=bankState[a.bank];
    const disposition=bank.row===null?'closed':bank.row===a.row?'hit':'conflict';
    if(disposition==='conflict'){time=Math.max(time,bank.activatedNs+machineTiming.tRASNs);command('PRE',time,time+machineTiming.tRPNs,a.bank,bank.row,id);time+=machineTiming.tRPNs;bank.row=null;}
    if(bank.row===null){command('ACT',time,time+machineTiming.tRCDNs,a.bank,a.row,id);bank.row=a.row;bank.activatedNs=time;time+=machineTiming.tRCDNs;}
    const commandNs=time,dataStartNs=time+(direction==='read'?machineTiming.tCLNs:machineTiming.tCWLNs),dataEndNs=dataStartNs+machineTiming.burstNs;
    const controllerFreeNs=dataEndNs+(direction==='write'?machineTiming.tWRNs:0),completedNs=controllerFreeNs;
    command(direction==='read'?'RD':'WR',time,controllerFreeNs,a.bank,a.row,id);
    const t:Transaction={id,batchId:batch?.id??null,tensor,direction,iova,physical,address:a,operands,submittedNs:arrival,serviceStartNs,commandNs,dataStartNs,dataEndNs,completedNs,controllerFreeNs,queueWaitNs:serviceStartNs-arrival,rowDisposition:disposition,buffer:batch?.buffer??null};
    transactions.push(t);ramTime=controllerFreeNs;
    add(completedNs,direction==='read'?'read-complete':'write-complete',`${direction==='read'?'Read arrived':'Output stored after write recovery'} · ${id} · physical bytes ${physical}–${physical+15}`,{transactionId:id,batchId:batch?.id??null,buffer:batch?.buffer??null});return t;
  };
  const makeOperand=(tensor:'A'|'B',r:number,c:number,lane:number):OperandAddress=>{
    const iova=address(tensor,r,c),m=mappings.find(m=>m.tensor===tensor)!,sharedWord=(tensor==='A'?0:n*(n+input.sharedPadding))+r*(n+input.sharedPadding)+c;
    return {id:key(tensor,r,c),tensor,row:r,column:c,value:input[tensor==='A'?'a':'b'][r][c],lane,iova,physical:m.physicalStart+iova-m.iovaStart,sharedByte:sharedWord*4,sharedBank:sharedWord%4};
  };
  let computeFree=0,previousSubmit=-1;const slotFree=Array(input.buffers).fill(0) as number[];
  let blocked=false;
  for(let k=0;k<n&&!blocked;k++)for(let flat=0;flat<n*n&&!blocked;flat+=4){
    const index=batches.length,buffer=index%input.buffers,submittedNs=Math.max(previousSubmit+1,slotFree[buffer]);previousSubmit=submittedNs;
    const lanes:LaneOperation[]=Array.from({length:Math.min(4,n*n-flat)},(_,lane)=>{const r=Math.floor((flat+lane)/n),c=(flat+lane)%n;return {lane,row:r,column:c,k,a:makeOperand('A',r,k,lane),b:makeOperand('B',k,c,lane)};});
    const sharedGroups=groupSharedBanks(lanes.flatMap(l=>[l.a,l.b])),sharedRounds=(['A','B'] as const).reduce((sum,t)=>sum+Math.max(...sharedGroups.filter(g=>g.tensor===t).map(g=>g.rounds)),0);
    const batch:MachineBatch={id:`batch-${index}`,index,k,buffer,lanes,sharedGroups,sharedRounds,submittedNs,readyNs:submittedNs,computeStartNs:submittedNs,computeEndNs:submittedNs,transactionIds:[]};
    // Check the entire batch before acquiring a slot or issuing a partially authorized batch.
    try{for(const tensor of ['A','B'] as const)for(const segment of new Set(lanes.map(l=>Math.floor((tensor==='A'?l.a:l.b).iova/16)*16)))translateMachineAddress(mappings,segment,16,'read');}
    catch(error){add(submittedNs,'mapping-fault',error instanceof Error?error.message:'Mapping denied.');blocked=true;break;}
    batches.push(batch);add(submittedNs,'acquire',`${batch.id} acquires staging slot ${buffer}; DMA owns it.`,{batchId:batch.id,buffer});
    for(const tensor of ['A','B'] as const){const ops=lanes.map(l=>tensor==='A'?l.a:l.b);for(const segment of new Set(ops.map(o=>Math.floor(o.iova/16)*16))){const t=schedule(tensor,segment,ops.filter(o=>Math.floor(o.iova/16)*16===segment),batch,submittedNs,'read');batch.transactionIds.push(t.id);batch.readyNs=Math.max(batch.readyNs,t.completedNs);}}
    add(batch.readyNs,'ready',`${batch.id}: all operand transactions have arrived.`,{batchId:batch.id,buffer});
    batch.computeStartNs=Math.max(computeFree,batch.readyNs);batch.computeEndNs=batch.computeStartNs+sharedRounds*machineTiming.sharedRoundNs+input.macNs;
    add(batch.computeStartNs,'compute-start',`${batch.id}: safe shared reads (${sharedRounds} rounds), then ${input.macNs} ns assumed MAC service.`,{batchId:batch.id,buffer});
    add(batch.computeEndNs,'compute-end',`${batch.id}: exact partial sums commit; slot ${buffer} is released.`,{batchId:batch.id,buffer});
    computeFree=batch.computeEndNs;slotFree[buffer]=batch.computeEndNs;
  }
  if(!blocked){
    if(input.fault==='early-consume')add(batches[0].submittedNs+1,'guard-rejected','Rejected early compute: operands are still owned by DMA. No partial sum changes.',{batchId:batches[0].id,buffer:0});
    if(input.fault==='reuse-in-flight')add(batches[0].submittedNs+1,'guard-rejected','Rejected slot reuse: the first DMA still owns this slot. Original data and safe schedule are retained.',{batchId:batches[0].id,buffer:0});
    let outputReady=computeFree;
    for(let byte=0;byte<mappings[2].lengthBytes;byte+=16){const t=schedule('C',mappings[2].iovaStart+byte,[],null,computeFree,'write');outputReady=Math.max(outputReady,t.completedNs);}
    add(outputReady,'host-sync','All C writes and recovery are complete. Output ownership returns to the CPU.');
  }
  // Replay event effects, not precomputed reference values, to form visible state and actual C.
  const state:MachineState={buffers:Array.from({length:input.buffers},(_,index)=>({index,phase:'free',batchId:null,words:{}})),openRows:[null,null],partialOutput:zeros(n),completedMacs:zeros(n),inputOwner:'cpu',outputOwner:'device',completedTransactions:[],storedOutputs:[],rejections:[]};
  const snapshot=():MachineState=>({...state,buffers:state.buffers.map(b=>({...b,words:{...b.words}})),openRows:[...state.openRows],partialOutput:cloneMatrix(state.partialOutput),completedMacs:cloneMatrix(state.completedMacs),completedTransactions:[...state.completedTransactions],storedOutputs:[...state.storedOutputs],rejections:[...state.rejections]});
  const events:MachineEvent[]=[];
  for(const action of actions.sort((a,b)=>a.timeNs-b.timeNs||a.order-b.order)){
    const batch=action.batchId?batches.find(b=>b.id===action.batchId)!:null,slot=action.buffer===null?null:state.buffers[action.buffer],macs:MachineEvent['macs']=[];
    if(action.kind==='handoff')state.inputOwner='device';
    if(action.kind==='command'){const cmd=commands.find(c=>c.id===action.commandId)!;if(cmd.kind==='ACT')state.openRows[cmd.bank!]=cmd.row;if(cmd.kind==='PRE')state.openRows[cmd.bank!]=null;if(cmd.kind==='PREA'||cmd.kind==='REF')state.openRows=[null,null];}
    if(action.kind==='acquire'){requireValue(slot?.phase==='free','Unsafe staging slot acquisition.');slot.phase='dma';slot.batchId=batch!.id;slot.words={};}
    if(action.kind==='read-complete'){const t=transactions.find(t=>t.id===action.transactionId)!;requireValue(slot?.phase==='dma'&&slot.batchId===t.batchId,'Read arrived into a slot not owned by its DMA.');for(const o of t.operands){const v=memory.get(o.physical);requireValue(v!==undefined,'Read of an uninitialized mapped word.');slot.words[o.id]=v;}state.completedTransactions.push(t.id);}
    if(action.kind==='ready'){requireValue(slot?.phase==='dma','Only DMA can publish a ready slot.');requireValue(batch!.transactionIds.every(id=>state.completedTransactions.includes(id)),'Incomplete DMA publication.');slot.phase='ready';}
    if(action.kind==='compute-start'){requireValue(slot?.phase==='ready'&&slot.batchId===batch!.id,'Read-before-ready is forbidden.');slot.phase='compute';}
    if(action.kind==='compute-end'){
      requireValue(slot?.phase==='compute'&&slot.batchId===batch!.id,'Compute reads only its owned staging slot.');
      for(const l of batch!.lanes){const a=slot.words[l.a.id],b=slot.words[l.b.id];requireValue(a!==undefined&&b!==undefined,'Operand was not delivered.');requireValue(state.completedMacs[l.row][l.column]===l.k,'Reduction order violation.');const before=state.partialOutput[l.row][l.column],after=before+a*b;state.partialOutput[l.row][l.column]=after;state.completedMacs[l.row][l.column]++;macs.push({lane:l.lane,row:l.row,column:l.column,k:l.k,a,b,before,after});}
      slot.phase='free';slot.batchId=null;slot.words={};
    }
    if(action.kind==='write-complete'){const t=transactions.find(t=>t.id===action.transactionId)!;for(let r=0;r<n;r++)for(let c=0;c<n;c++){const phys=mappings[2].physicalStart+offset('C',r,c);if(phys>=t.physical&&phys<t.physical+16){requireValue(state.completedMacs[r][c]===n,'Cannot write an incomplete output.');memory.set(phys,state.partialOutput[r][c]);state.storedOutputs.push(key('C',r,c));}}state.completedTransactions.push(t.id);}
    if(action.kind==='host-sync'){requireValue(state.storedOutputs.length===n*n,'Host cannot consume incomplete C.');state.outputOwner='cpu';}
    if(action.kind==='guard-rejected'){requireValue(slot?.phase==='dma','The failure fixture must occur during actual DMA ownership.');state.rejections.push(action.label);}
    if(action.kind==='mapping-fault')state.rejections.push(action.label);
    const {order,...visible}=action;events.push({...visible,state:snapshot(),macs});
  }
  const finalOutput=blocked?null:Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>memory.get(mappings[2].physicalStart+offset('C',r,c))!));
  const reads=transactions.filter(t=>t.direction==='read'),writes=transactions.filter(t=>t.direction==='write');
  return {version:machineExecutionVersion,input,mappings,batches,transactions,commands,events,reference:referenceMultiply(input.a,input.b),finalOutput,status:blocked?'mapping-blocked':input.fault==='none'?'complete':'complete-with-guard-rejection',totals:{durationNs:events.at(-1)!.timeNs,macs:events.reduce((s,e)=>s+e.macs.length,0),requestedReadBytes:batches.reduce((s,b)=>s+b.lanes.length*8,0),distinctInputBytes:new Set(reads.flatMap(t=>t.operands.map(o=>o.physical))).size*4,readTransactionBytes:reads.length*16,writeTransactionBytes:writes.length*16,sharedRounds:batches.reduce((s,b)=>s+b.sharedRounds,0),refreshes:commands.filter(c=>c.kind==='REF').length,refreshBusyNs:commands.filter(c=>c.kind==='REF').length*machineTiming.tRFCNs,computeBusyNs:batches.reduce((s,b)=>s+b.computeEndNs-b.computeStartNs,0)},assumptions:[...machineAssumptions]};
}
export function machineEventAt(trace:MachineExecution,timeNs:number):MachineEvent{
  requireValue(Number.isFinite(timeNs)&&timeNs>=0&&timeNs<=trace.totals.durationNs,'Cursor is outside the modeled time interval.');
  for(let i=trace.events.length-1;i>=0;i--)if(trace.events[i].timeNs<=timeNs)return trace.events[i];
  return trace.events[0];
}
