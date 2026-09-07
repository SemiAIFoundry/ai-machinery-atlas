import test from 'node:test';
import assert from 'node:assert/strict';
import {buildArchitectureComparison as build, normalizeArchitectureInput as normalize, architecturePresets as presets, architectureVersion} from '../src/lib/architecture-execution.ts';
const schemes=['scalar','vector','simt','systolic'];
const oracle=(a,b)=>a.map(row=>b[0].map((_,j)=>Number(row.reduce((s,a,k)=>s+BigInt(a)*BigInt(b[k][j]),0n))));
function audit(comparison){
 const {a,b,size:n}=comparison.input,expected=oracle(a,b);
 assert.deepEqual(comparison.reference,expected);
 for(const scheme of schemes){
  const trace=comparison.traces[scheme],acc=Array.from({length:n},()=>Array(n).fill(0n)),nextK=Array.from({length:n},()=>Array(n).fill(0)),seen=new Set(),stored=new Set(),local=new Map();
  assert.deepEqual(trace.finalOutput,expected,scheme);
  for(const [index,step]of trace.steps.entries()){
   assert.equal(step.index,index);assert.equal(step.units.length,step.occupancy.physicalUnits);assert.equal(step.units.filter(u=>u.state==='mac').length,step.operations.length);
   assert.equal(step.occupancy.activeMacUnits,step.operations.length);assert.equal(step.occupancy.fractionOfPhysical,step.operations.length/step.units.length);
   assert.ok(step.occupancy.enabledUnits>=step.operations.length);
   for(const access of step.accesses){
    if(access.space==='boundary'&&access.direction==='read'){assert.ok(access.tensor==='A'||access.tensor==='B');assert.equal(access.value,(access.tensor==='A'?a:b)[access.row][access.column]);}
    if(access.space==='local'){
     if(access.direction==='write')local.set(access.resource,access.value);
     else {assert.ok(local.has(access.resource),'Local read must follow an explicit write');assert.equal(access.value,local.get(access.resource),'Local access reads its actual named state');}
    }
    if(access.space==='boundary'&&access.direction==='write'){assert.equal(access.tensor,'C');const key=access.row+':'+access.column;assert.ok(!stored.has(key),'Write each completed output once');stored.add(key);assert.equal(access.value,expected[access.row][access.column]);}
   }
   for(const op of step.operations){
    const {row:i,column:j}=op.output,key=[i,j,op.k].join(':');assert.ok(!seen.has(key));seen.add(key);
    assert.equal(op.k,nextK[i][j]++,'Increasing reduction order');assert.equal(op.a.value,a[i][op.k]);assert.equal(op.b.value,b[op.k][j]);
    assert.equal(BigInt(op.accumulatorBefore),acc[i][j]);const product=BigInt(a[i][op.k])*BigInt(b[op.k][j]);assert.equal(BigInt(op.product),product);acc[i][j]+=product;assert.equal(BigInt(op.accumulatorAfter),acc[i][j]);
    const unit=step.units.find(u=>u.id===op.unitId);assert.equal(unit.operationId,op.id);assert.equal(unit.accumulator,op.accumulatorAfter);assert.equal(op.completesOutput,op.k===n-1);
   }
   assert.deepEqual(step.partialOutput,acc.map(row=>row.map(Number)),'Snapshots show the actual accumulated result');assert.deepEqual(step.completed,nextK.map(row=>row.map(k=>k===n)));
   for(const unit of step.units.filter(u=>u.state==='edge'||u.state==='masked')){assert.equal(unit.operationId,null);assert.ok(!step.accesses.some(a=>a.unitId===unit.id));}
  }
  assert.equal(seen.size,n**3);assert.equal(stored.size,n**2);assert.equal(trace.totals.macs,n**3);assert.equal(trace.totals.boundaryWrites,n**2);
  assert.equal(trace.totals.distinctBoundaryReadAddresses,2*n*n);assert.equal(trace.totals.physicalMacSlots,trace.steps.length*trace.steps[0].units.length);
  assert.equal(trace.totals.activeMacFraction,n**3/trace.totals.physicalMacSlots);
 }
}
test('documented 2×2 result is exact in all four schedules',()=>{const c=build(presets.two);assert.deepEqual(c.reference,[[19,22],[43,50]]);audit(c);});
test('signed 3×3 result is exact with no zero-skipping',()=>{const c=build(presets.three);assert.deepEqual(c.reference,[[2,5,-1],[5,1,10],[4,1,3]]);audit(c);for(const t of Object.values(c.traces))assert.equal(t.totals.macs,27);});
test('all 256 pairs of binary 2×2 matrices preserve the independently calculated result',()=>{
 const binary=i=>[[i&1,(i>>1)&1],[(i>>2)&1,(i>>3)&1]];
 for(let a=0;a<16;a++)for(let b=0;b<16;b++){const input={a:binary(a),b:binary(b),laneCount:4,arraySize:2},c=build(input);for(const t of Object.values(c.traces))assert.deepEqual(t.finalOutput,oracle(input.a,input.b));}
});
test('every legal four-lane mask remaps all work for both sizes and array sizes',()=>{
 for(const p of Object.values(presets))for(const arraySize of [2,3])for(let mask=0;mask<15;mask++){
  const inactiveLanes=[0,1,2,3].filter(i=>(mask>>i)&1);audit(build({...p,arraySize,inactiveLanes}));
 }
});
test('two- and eight-lane cases include interior holes and a single enabled slot',()=>{
 for(const laneCount of [2,8])for(const inactiveLanes of [[],Array.from({length:laneCount-1},(_,i)=>i),Array.from({length:laneCount},(_,i)=>i).filter(i=>i%2===1)])audit(build({...presets.three,laneCount,inactiveLanes}));
});
test('bounded signed inputs including ±99 remain exact without overflow',()=>{
 let seed=1747;const next=()=>{seed=(seed*48271)%2147483647;return seed%199-99;};
 for(const n of [2,3])for(let i=0;i<16;i++)audit(build({a:Array.from({length:n},()=>Array.from({length:n},next)),b:Array.from({length:n},()=>Array.from({length:n},next)),laneCount:4,inactiveLanes:[1],arraySize:2}));
});
test('zero matrices complete zero-valued outputs and retain all required MACs',()=>{for(const n of [2,3]){const z=Array.from({length:n},()=>Array(n).fill(0));const c=build({a:z,b:z});audit(c);for(const t of Object.values(c.traces))assert.ok(t.steps.at(-1).completed.flat().every(Boolean));}});
test('2×2 analytical slot and traffic counts distinguish declared reuse',()=>{
 const c=build(presets.two),expected={scalar:[8,16,4,28,28,0,0],vector:[4,12,4,32,32,0,8],simt:[2,16,4,28,28,0,0],systolic:[4,8,4,28,28,8,0]};
 for(const id of schemes){const t=c.traces[id].totals;assert.deepEqual([t.scheduleSteps,t.boundaryReads,t.boundaryWrites,t.localReads,t.localWrites,t.neighborHops,t.broadcastDeliveries],expected[id],id);}
});
test('3×3 on a 2×2 systolic array has four sequential tiles and edge padding',()=>{
 const t=build({...presets.three,arraySize:2}).traces.systolic;assert.equal(new Set(t.steps.map(s=>s.group)).size,4);
 assert.deepEqual(t.steps.filter(s=>s.localTick===0).map(s=>s.tile),[{rowStart:0,columnStart:0,rows:2,columns:2},{rowStart:0,columnStart:2,rows:2,columns:1},{rowStart:2,columnStart:0,rows:1,columns:2},{rowStart:2,columnStart:2,rows:1,columns:1}]);
 assert.equal(t.totals.scheduleSteps,16);assert.equal(t.totals.boundaryReads,36);assert.equal(t.totals.neighborHops,18);assert.equal(t.totals.localReads,90);assert.equal(t.totals.localWrites,90);
});
test('3×3 on a 3×3 systolic array exposes seven ticks with fill and drain',()=>{
 const t=build(presets.three).traces.systolic;assert.equal(t.totals.scheduleSteps,7);assert.equal(t.totals.boundaryReads,18);assert.equal(t.totals.neighborHops,36);
 assert.equal(t.steps[0].units.filter(u=>u.state==='fill').length,8);assert.equal(t.steps.at(-1).units.filter(u=>u.state==='drain').length,8);
 assert.deepEqual(t.steps.map(s=>s.operations.length),[1,3,6,7,6,3,1]);
});
test('larger array padding does not inject operands or invent outputs',()=>{
 const t=build({...presets.two,arraySize:3}).traces.systolic;assert.equal(t.totals.boundaryReads,8);assert.equal(t.totals.neighborHops,8);
 for(const s of t.steps){assert.equal(s.units.filter(u=>u.state==='edge').length,5);assert.equal(s.occupancy.enabledUnits,4);assert.equal(s.occupancy.physicalUnits,9);}
});
test('systolic tokens move one neighbor and one tick before consumption',()=>{
 for(const p of Object.values(presets))for(const arraySize of [2,3]){
  const trace=build({...p,arraySize}).traces.systolic;
  for(const step of trace.steps)for(const tr of step.transfers.filter(t=>t.kind==='neighbor')){
   assert.equal(tr.arrivalStep,tr.departureStep+1);const from=tr.from.split(':')[0],to=tr.to.split(':')[0],fr=from.split('-').slice(1).map(Number),dest=to.split('-').slice(1).map(Number);
   assert.deepEqual(dest,tr.tensor==='A'?[fr[0],fr[1]+1]:[fr[0]+1,fr[1]]);
   const sourceOp=step.operations.find(o=>o.unitId===from),targetOp=trace.steps[tr.arrivalStep].operations.find(o=>o.unitId===to);assert.ok(sourceOp&&targetOp);
   for(const op of [sourceOp,targetOp]){const o=tr.tensor==='A'?op.a:op.b;assert.equal(tr.value,o.value);assert.equal(tr.row,o.row);assert.equal(tr.column,o.column);}
  }
 }
});
test('systolic arrival equation is independently consistent for every MAC',()=>{
 for(const arraySize of [2,3])for(const step of build({...presets.three,arraySize}).traces.systolic.steps)for(const op of step.operations){const unit=step.units.find(u=>u.id===op.unitId);assert.equal(step.localTick,op.k+unit.position.row+unit.position.column);}
});
test('vector broadcasts one A per group while SIMT retains logical per-thread reads',()=>{
 const c=build({...presets.three,laneCount:4,inactiveLanes:[1]});
 for(const s of c.traces.vector.steps){const reads=s.accesses.filter(a=>a.space==='boundary'&&a.direction==='read');assert.equal(reads.filter(a=>a.tensor==='A').length,1);assert.equal(reads.filter(a=>a.tensor==='B').length,s.operations.length);assert.equal(s.transfers.filter(t=>t.kind==='broadcast').length,s.operations.length);assert.equal(new Set(s.operations.map(o=>o.output.row)).size,1);}
 for(const s of c.traces.simt.steps)assert.equal(s.accesses.filter(a=>a.space==='boundary'&&a.direction==='read').length,2*s.operations.length);
});
test('edge slots and excluded interior slots remain distinguishable',()=>{
 const c=build({...presets.two,laneCount:4,inactiveLanes:[1]});const first=c.traces.vector.steps[0];assert.equal(first.units[1].state,'masked');assert.equal(first.units[3].state,'edge');assert.deepEqual(first.operations.map(o=>o.unitId),['vector-lane-0','vector-lane-2']);
});
test('one enabled vector/SIMT slot preserves full work without a false parallel speedup',()=>{
 const c=build({...presets.three,laneCount:4,inactiveLanes:[0,1,2]});for(const id of ['scalar','vector','simt'])assert.equal(c.traces[id].totals.scheduleSteps,27);for(const id of ['vector','simt'])assert.equal(c.traces[id].totals.activeMacFraction,.25);
});
test('lane controls do not alter scalar or systolic output or schedule',()=>{
 const a=build(presets.three),b=build({...presets.three,laneCount:8,inactiveLanes:[0,2,5]});for(const s of ['scalar','systolic'])assert.deepEqual(a.traces[s],b.traces[s]);
});
test('inputs round-trip without mutation and preserve deterministic schedules',()=>{
 const input=JSON.parse(JSON.stringify(presets.three)),before=JSON.stringify(input),a=build(input);assert.equal(JSON.stringify(input),before);const b=build(JSON.parse(JSON.stringify(a.input)));assert.deepEqual(a,b);assert.equal(a.version,architectureVersion);
 a.traces.scalar.steps[0].partialOutput[0][0]=999;assert.notEqual(a.traces.scalar.finalOutput[0][0],999);assert.notEqual(a.traces.scalar.steps[1].partialOutput[0][0],999);
});
test('invalid shapes, sparse entries, dimensions and unsafe arithmetic inputs reject',()=>{
 for(const value of [null,[],{}, {...presets.two,b:[[1,2]]},{...presets.two,a:[[1],[2]]},{...presets.two,a:[[1,2],[3,Infinity]]},{...presets.two,a:[[1,2],[3,0.5]]},{...presets.two,a:[[1,2],[3,100]]},{...presets.two,a:[[1,2],Array(2)]},{...presets.two,size:3}])assert.throws(()=>normalize(value));
});
test('invalid lane/array controls reject rather than dropping mathematical work',()=>{
 for(const patch of [{laneCount:0},{laneCount:3},{laneCount:'4'},{inactiveLanes:[0,1,2,3]},{inactiveLanes:[1,1]},{inactiveLanes:[-1]},{inactiveLanes:[4]},{inactiveLanes:[0.5]},{inactiveLanes:'1'},{inactiveLanes:Array(1)},{arraySize:1},{unknown:true}])assert.throws(()=>build({...presets.two,...patch}));
});
test('trace boundary language explicitly excludes vendor timing and hardware occupancy',()=>{
 for(const t of Object.values(build(presets.two).traces)){const text=t.assumptions.join(' ');assert.match(text,/not an ISA instruction count/);assert.match(text,/not GPU resident-warp occupancy/);assert.match(text,/not labeled HBM, DRAM or cache/);assert.ok(t.sourceIds.length);}
});
