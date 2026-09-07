import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMemoryWorkload,memoryWorkloadDefaults as defaults,normalizeMemoryWorkload,observedRefreshBusyNs,readProtectedWord,wordToBytes,bytesToWord,encodeMemoryWorkloadRecord,readMemoryWorkloadRecord} from '../src/lib/memory-workload-bridge.ts';
import {buildMachineExecution} from '../src/lib/machine-execution.ts';
const run=(patch={})=>buildMemoryWorkload({...defaults,...patch});
const multiply=(a,b)=>a.map(row=>b[0].map((_,c)=>Number(row.reduce((s,x,k)=>s+BigInt(x)*BigInt(b[k][c]),0n))));

test('actual two-matrix byte path gives hand-derived C and excludes padding from payload identity',()=>{
 const r=run({specimen:'two',fault:'none',refreshEveryNs:0});
 assert.deepEqual(r.finalOutput,[[19,22],[43,50]]);assert.equal(r.totals.macs,8);assert.equal(r.placement.allocatedBytes,48);assert.equal(r.workload.words.length*4,32);assert.equal(r.totals.readTransactionBytes,64);assert.equal(r.totals.writeTransactionBytes,16);
 assert.deepEqual(r.workload.words.find(w=>w.id==='B[1,0]').bytes,[7,0,0,0]);assert.ok(r.reads.every(x=>bytesToWord(x.read.deliveredBytes)===r.workload.words.find(w=>w.id===x.wordId).value));assert.equal(r.outputWords.length,4);assert.deepEqual(r.outputWords[0].bytes,[19,0,0,0]);
});
test('32-bit little-endian identity handles negative values and the sign boundary exactly',()=>{
 assert.deepEqual(wordToBytes(-2),[254,255,255,255]);assert.deepEqual(wordToBytes(-2147483648),[0,0,0,128]);assert.deepEqual(wordToBytes(0x12345678),[120,86,52,18]);
 for(const x of [-2147483648,-99,-1,0,99,2147483647])assert.equal(bytesToWord(wordToBytes(x)),x);
 for(const x of [NaN,Infinity,2147483648,-2147483649,.5])assert.throws(()=>wordToBytes(x));for(const x of [new Array(4),[0,0,0],[-1,0,0,0],[256,0,0,0],['1',0,0,0]])assert.throws(()=>bytesToWord(x));
});
test('extended Hamming bit placement agrees with hand-derived payload 9 codeword',()=>{
 const x=readProtectedWord([9,0,0,0],0,[],'secded');
 // Data positions 3/7 are set; parity 4 is set, so the three first-seven ones require overall parity 1.
 assert.deepEqual(x.codewords[0],[0,0,1,1,0,0,1,1]);assert.equal(x.codewords.flat().length,64);assert.deepEqual(x.deliveredBytes,[9,0,0,0]);
 assert.throws(()=>readProtectedWord([9,0,0,0],0,new Array(1),'secded'));
 const y=readProtectedWord([9,0,0,0],0,[3],'secded');assert.equal(y.decoded[0].syndrome,3);assert.equal(y.decoded[0].overallParity,1);assert.equal(y.decoded[0].correctedPosition,3);assert.equal(y.deliveredValue,9);
});
test('every one-bit error in every nibble returns the exact original word; all same-codeword pairs are detected',()=>{
 for(const value of [-2147483648,-99,-1,0,9,2147483647])for(let nibble=0;nibble<8;nibble++){
  for(let p=1;p<=8;p++)assert.equal(readProtectedWord(wordToBytes(value),nibble,[p],'secded').deliveredValue,value);
  for(let p=1;p<=8;p++)for(let q=p+1;q<=8;q++){const r=readProtectedWord(wordToBytes(value),nibble,[p,q],'secded');assert.equal(r.detected,true);assert.equal(r.deliveredValue,null);}
 }
});
test('geometric and synthetic evidence failures block admission before staging, commands or MACs',()=>{
 for(const patch of [{qualification:'not-provided'},{qualification:'synthetic-fail'},{registrationOffsetUm:10},{registrationOffsetUm:12},{route:'tc-ncf',dies:16}]){
  const r=run({...patch,bTier:'host-stage'});assert.equal(r.status,'admission-blocked');assert.equal(r.finalOutput,null);assert.equal(r.commands.length,0);assert.equal(r.reads.length,0);assert.equal(r.placement.staging.length,0);assert.equal(r.totals.durationNs,0);
 }
 assert.equal(run({route:'hybrid',dies:12}).qualification.admitted,true);
});
test('positive contact overlap changes geometry without inventing timing or error-rate effects',()=>{
 const a=run({registrationOffsetUm:0}),b=run({registrationOffsetUm:9.9}),c=run({route:'hybrid'});
 assert.equal(a.qualification.overlapFraction,1);assert.ok(b.qualification.overlapFraction>0&&b.qualification.overlapFraction<.02);
 for(const r of [b,c]){assert.deepEqual(r.finalOutput,a.finalOutput);assert.deepEqual(r.totals,a.totals);assert.deepEqual(r.reads.map(x=>x.read),a.reads.map(x=>x.read));}assert.notEqual(c.qualification.heightUm,a.qualification.heightUm);
});
test('selected die changes only the explicit stack-address translation, not synthetic machine banks or words',()=>{
 const a=run({selectedDie:0}),b=run({selectedDie:7});
 for(let i=0;i<a.workload.words.length;i++){const x=a.workload.words[i],y=b.workload.words[i];assert.equal(y.stackPayloadAddress-x.stackPayloadAddress,7*2**31);assert.equal(y.address.parts.die,7);assert.equal(y.physical,x.physical);assert.deepEqual(y.bytes,x.bytes);}
 assert.deepEqual(b.finalOutput,a.finalOutput);assert.deepEqual(b.commands,a.commands);assert.deepEqual(b.totals,a.totals);
});
test('the payload allocation gate requires complete padded A/B/C allocations for all source tiers',()=>{
 for(const bTier of ['hbm','host-stage','read-tier-stage']){const r=run({payloadBudgetBytes:96,bTier});assert.equal(r.status,'placement-blocked');assert.equal(r.placement.allocatedBytes,144);assert.equal(r.commands.length,0);assert.equal(r.placement.staging.length,0);assert.equal(run({payloadBudgetBytes:144,bTier}).status,'complete');}
 assert.equal(run({specimen:'two',payloadBudgetBytes:64}).status,'complete');
});
test('remote staging copies the identical padded B bytes and serially shifts the machine boundary by hand-derived time',()=>{
 const a=run({fault:'none'});
 for(const bTier of ['host-stage','read-tier-stage']){const r=run({bTier,fault:'none'});assert.equal(r.placement.remoteSourceReadBytes,48);assert.equal(r.placement.destinationStagingWriteBytes,48);assert.deepEqual(r.placement.staging.flatMap(s=>s.bytes),r.placement.sourceBBytes);assert.deepEqual(r.placement.sourceBBytes.slice(36),Array(12).fill(0));assert.equal(r.totals.stagingNs,20+3*8);assert.equal(r.totals.durationNs,a.totals.durationNs+44);assert.equal(r.totals.machineElapsedNs,a.totals.machineElapsedNs);assert.deepEqual(r.finalOutput,a.finalOutput);for(const read of r.reads){const w=r.workload.words.find(w=>w.id===read.wordId);assert.deepEqual(read.read.originalBytes,w.bytes);assert.ok(read.timeNs>=44);}}
 assert.equal(run({specimen:'two',bTier:'host-stage'}).totals.stagingNs,28);
});
test('one injected data bit is corrected on every actual repeated selected-word read',()=>{
 const a=run({fault:'none'}),b=run({fault:'single-data'});assert.equal(b.status,'complete');assert.deepEqual(b.finalOutput,a.finalOutput);assert.equal(b.totals.durationNs,a.totals.durationNs);
 const bad=b.reads.filter(x=>x.faultInjected);assert.ok(bad.length>1);assert.equal(b.totals.correctedNibbles,bad.length);for(const x of bad){assert.deepEqual(x.read.deliveredBytes,x.read.originalBytes);assert.equal(x.read.decoded[0].correctedPosition,3);}
});
test('detected double data error stops before affected compute and publishes no output or future events',()=>{
 const r=run({fault:'double-data'});assert.equal(r.status,'ecc-blocked');assert.equal(r.finalOutput,null);assert.equal(r.correct,null);assert.equal(r.outputWords.length,0);assert.equal(r.events.at(-1).kind,'ecc-blocked');assert.equal(r.totals.durationNs,40);assert.equal(r.totals.macs,0);assert.equal(r.totals.writeTransactionBytes,0);assert.ok(!r.events.some(e=>e.kind==='host-sync'));assert.equal(r.reads.find(x=>x.faultInjected).read.deliveredValue,null);
 const later=run({fault:'double-data',faultTensor:'A',faultWord:8});assert.ok(later.totals.macs>0);assert.equal(later.finalOutput,null);assert.ok(later.events.every(e=>e.timeNs<=later.totals.durationNs));assert.ok(later.commands.every(c=>c.startNs<=later.totals.machineElapsedNs));
});
test('unchecked faulty data changes C through actual operand values, matching a separate BigInt multiplication',()=>{
 const r=run({fault:'double-data',protection:'unchecked'}),a=structuredClone(r.workload.a),b=structuredClone(r.workload.b),w=r.workload.selectedWord,delivered=r.reads.find(x=>x.faultInjected).read.deliveredValue;
 (w.tensor==='A'?a:b)[w.row][w.column]=delivered;
 assert.equal(r.status,'silent-corruption');assert.deepEqual(r.finalOutput,multiply(a,b));assert.notDeepEqual(r.finalOutput,r.reference);assert.equal(r.totals.detectedReads,0);assert.equal(r.totals.correctedNibbles,0);
 const used=r.events.flatMap(e=>e.macs).filter(m=>m.k===w.row&&m.column===w.column);assert.ok(used.length);assert.ok(used.every(m=>m.b===delivered));
});
test('three flips can report correction while still corrupting the same consumer output',()=>{
 const r=run({fault:'triple'}),x=r.reads.find(x=>x.faultInjected);assert.equal(x.read.decoded[0].classification,'overall-corrected');assert.equal(x.read.detected,false);assert.notDeepEqual(x.read.deliveredBytes,x.read.originalBytes);assert.equal(r.status,'silent-corruption');assert.ok(r.totals.correctedNibbles>0);
});
test('int32 output store narrowing is explicit and matches independent BigInt modulo arithmetic',()=>{
 const r=run({fault:'double-data',protection:'unchecked',faultTensor:'A',faultWord:1,faultNibble:7}),a=structuredClone(r.workload.a),b=r.workload.b,x=r.reads.find(x=>x.faultInjected);a[0][1]=x.read.deliveredValue;
 const expected=a.map(row=>b[0].map((_,c)=>Number(BigInt.asIntN(32,row.reduce((s,v,k)=>s+BigInt(v)*BigInt(b[k][c]),0n)))));
 assert.deepEqual(r.finalOutput,expected);assert.equal(r.totals.outputNarrowedWords,1);assert.ok(r.outputWords.every(w=>bytesToWord(w.bytes)===w.value));
});
test('refresh changes commands and latency but never repairs the deliberately persistent fault',()=>{
 const on=run({fault:'triple',refreshEveryNs:96}),off=run({fault:'triple',refreshEveryNs:0});assert.ok(on.totals.refreshes>0);assert.equal(off.totals.refreshes,0);assert.ok(on.totals.durationNs>off.totals.durationNs);assert.deepEqual(on.finalOutput,off.finalOutput);assert.deepEqual(on.reads.filter(r=>r.faultInjected).map(r=>r.read.received),off.reads.filter(r=>r.faultInjected).map(r=>r.read.received));
 for(const c of on.commands.filter(c=>c.kind==='REF')){assert.equal(c.endNs-c.startNs,12);assert.equal(c.refreshLatenessNs,c.startNs-c.refreshDueNs);assert.ok(c.refreshLatenessNs>=0);assert.ok(!on.commands.some(x=>['RD','WR'].includes(x.kind)&&x.startNs<c.endNs&&x.endNs>c.startNs));}
});
test('observed refresh time clips a straddling reservation and never counts future service',()=>{
 const commands=[{kind:'REF',startNs:20,endNs:32},{kind:'RD',startNs:40,endNs:52},{kind:'REF',startNs:100,endNs:112}];
 assert.equal(observedRefreshBusyNs(commands,0),0);assert.equal(observedRefreshBusyNs(commands,20),0);assert.equal(observedRefreshBusyNs(commands,25),5);assert.equal(observedRefreshBusyNs(commands,100),12);assert.equal(observedRefreshBusyNs(commands,105),17);assert.equal(observedRefreshBusyNs(commands,112),24);assert.throws(()=>observedRefreshBusyNs(commands,NaN));
});
test('all double-fault stopped prefixes account only observed refresh and publish explicit machine/joined clocks',()=>{
 for(const faultTensor of ['A','B'])for(let faultWord=0;faultWord<9;faultWord++)for(const refreshEveryNs of [64,96,160]){
  const r=run({faultTensor,faultWord,refreshEveryNs,fault:'double-data',bTier:'host-stage'});assert.equal(r.status,'ecc-blocked');assert.equal(r.commandClock,'machine-relative-ns');
  const refs=r.commands.filter(c=>c.kind==='REF');assert.ok(refs.every(c=>c.endNs<=r.totals.machineElapsedNs),'Current serialized controller cannot overlap REF and failing read.');assert.equal(r.totals.refreshBusyNs,refs.reduce((s,c)=>s+Math.max(0,Math.min(c.endNs,r.totals.machineElapsedNs)-c.startNs),0));assert.ok(r.totals.refreshBusyNs<=r.totals.refreshReservedNs);
  for(const c of r.commandTimeline){assert.equal(c.joinedStartNs,c.machineStartNs+44);assert.equal(c.joinedEndNs,c.machineEndNs+44);}assert.ok(r.events.filter(e=>e.kind==='command').every(e=>e.label.startsWith('Machine clock:')));
 }
});
test('healthy bridge agrees with exact original machine consumer over schedule and placement combinations',()=>{
 for(const specimen of ['two','three'])for(const bankPlacement of ['same-bank','split-banks'])for(const buffers of [1,2])for(const refreshEveryNs of [0,64,96,160])for(const bTier of ['hbm','host-stage','read-tier-stage']){
  const r=run({specimen,bankPlacement,buffers,refreshEveryNs,bTier,fault:'none'}),plan=buildMachineExecution({a:r.workload.a,b:r.workload.b,bankPlacement,buffers,refreshEveryNs});assert.deepEqual(r.finalOutput,multiply(r.workload.a,r.workload.b));assert.deepEqual(r.finalOutput,plan.finalOutput);assert.equal(r.totals.machineElapsedNs,plan.totals.durationNs);assert.equal(r.totals.readTransactionBytes,plan.totals.readTransactionBytes);assert.deepEqual(r.commands,plan.commands);assert.equal(r.events.filter(e=>e.published).length,1);
 }
});
test('every original word and nibble can be corrected without changing the bounded matrix result',()=>{
 for(const specimen of ['two','three'])for(const faultTensor of ['A','B'])for(let faultWord=0;faultWord<(specimen==='two'?4:9);faultWord++)for(let faultNibble=0;faultNibble<8;faultNibble++){const r=run({specimen,faultTensor,faultWord,faultNibble});assert.equal(r.status,'complete');assert.deepEqual(r.finalOutput,multiply(r.workload.a,r.workload.b));}
});
test('strict portable input records round trip and reject forged identities or invalid fields before applying',()=>{
 const raw=encodeMemoryWorkloadRecord(defaults);assert.deepEqual(readMemoryWorkloadRecord(raw),defaults);assert.deepEqual(run(),buildMemoryWorkload(readMemoryWorkloadRecord(raw)));
 for(const patch of [{route:['hybrid']},{specimen:'four'},{dies:6},{selectedDie:8},{registrationOffsetUm:NaN},{registrationOffsetUm:13},{payloadBudgetBytes:63},{faultWord:9},{faultNibble:8},{faultTensor:'C'},{qualification:true},{extra:1}])assert.throws(()=>normalizeMemoryWorkload({...defaults,...patch}));
 for(const patch of [{schemaVersion:2},{modelVersion:'other'},{source:'other'},{result:[[1]]}])assert.throws(()=>readMemoryWorkloadRecord(JSON.stringify({...JSON.parse(raw),...patch})));assert.throws(()=>readMemoryWorkloadRecord(' '.repeat(20001)));assert.throws(()=>readMemoryWorkloadRecord('🌍'.repeat(5001)));assert.throws(()=>readMemoryWorkloadRecord('{}'));
});
test('returned states, byte ledgers and reference matrices cannot mutate a subsequent replay',()=>{
 const first=run({bTier:'host-stage'}),before=run({bTier:'host-stage'});first.workload.a[0][0]=99;first.workload.words[0].bytes[0]=99;first.placement.staging[0].bytes[0]=99;first.events[0].partialOutput[0][0]=99;first.commands[0].startNs=99;assert.deepEqual(run({bTier:'host-stage'}),before);assert.equal(first.events[1].partialOutput[0][0],0);
});
