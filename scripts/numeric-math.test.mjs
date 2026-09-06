import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/lib/numeric-math.ts';
import {numericLabs,isNumericLab} from '../src/lib/numeric-labs.ts';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1e-10,Math.abs(b)*1e-10),`${a} ≠ ${b}`);

test('HBM counts physical bonds including the base, but die count does not multiply interface bandwidth',()=>{
 const a=M.hbmStack(M.hbmStackDefaults),b=M.hbmStack({...M.hbmStackDefaults,dies:16});
 near(a.interfaces,8);near(a.heightUm,100+30+8*(45+12));near(b.capacityGB,2*a.capacityGB);near(a.deliveredGBs,b.deliveredGBs);near(a.rawGBs,1024);
 assert.ok(b.heightMarginUm<a.heightMarginUm);assert.ok(b.peakC>a.peakC);
});
test('distributed heat charges each segment only for the heat generated below it',()=>{
 const r=M.hbmStack({...M.hbmStackDefaults,dies:2,diePowerW:1,basePowerW:1,coolerKW:2,coolantC:20,dieUm:50,areaMm2:100,siliconWmK:100,interfaceKW:.015});
 near(r.layerKW,.02);near(r.temperatures[2],26);near(r.temperatures[1],26.04);near(r.temperatures[0],26.06);
 const cold=M.hbmStack({...M.hbmStackDefaults,diePowerW:0,basePowerW:0});cold.temperatures.forEach(t=>near(t,M.hbmStackDefaults.coolantC));
});
test('screened-input yield is conditional and thermal/height constraints are independent of yield',()=>{
 const clean=M.hbmStack({...M.hbmStackDefaults,residualDieYield:1,bondYield:1,finalYield:1,limitUm:100});near(clean.expectedPer1000,1000);assert.equal(clean.withinLimits,false);
 const imperfect=M.hbmStack({...M.hbmStackDefaults,dies:4,residualDieYield:.99,bondYield:.98,finalYield:.97});near(imperfect.conditionalYield,.99**4*.98**4*.97);
 near(M.hbmStack({...M.hbmStackDefaults,bondYield:0}).expectedPer1000,0);
 assert.throws(()=>M.hbmStack({...M.hbmStackDefaults,dies:1.5}),RangeError);assert.throws(()=>M.hbmStack({...M.hbmStackDefaults,bondYield:1.01}),RangeError);
});
test('weight bytes, mutable KV and per-step append have different scaling',()=>{
 const v={...M.workloadDefaults,paramsB:1,batch:1,layers:32,context:8192,kvHeads:8,headDim:128,kvElementBytes:2};
 const a=M.inferenceBytes(v),b=M.inferenceBytes({...v,paramsB:2,batch:2});near(a.weights,2e9);near(a.kv,2**30);near(b.weights,2*a.weights);near(b.kv,2*a.kv);near(a.append,128*1024);
 near(M.inferenceBytes({...v,context:0}).kv,0);assert.ok(M.inferenceBytes({...v,context:0}).append>0);near(M.inferenceBytes({...v,weightBits:4}).weights,a.weights/4);
 assert.throws(()=>M.inferenceBytes({...v,batch:0}),RangeError);assert.throws(()=>M.inferenceBytes({...v,context:-1}),RangeError);
});
test('placement conserves every weight and KV byte under both allocation priorities',()=>{
 for(const policy of ['kv-first','weights-first'])for(const useHbf of [true,false]){
  const r=M.placeInference({...M.placementDefaults,policy,useHbf});
  near(r.hbm.weights+r.hbf.weights+r.host.weights+r.missing.weights,r.size.weights);near(r.hbm.kv+r.host.kv+r.missing.kv,r.size.kv);near(r.hbf.kv,0);
  assert.ok(r.hbm.weights+r.hbm.kv+r.hbm.workspace<=r.caps.hbm+1e-5);assert.ok(r.host.weights+r.host.kv<=r.caps.host+1e-5);assert.ok(r.hbf.weights<=r.caps.hbf);
  if(!useHbf){near(r.hbf.weights,0);near(r.times.hbf.seconds,0);}
 }
 const kvFirst=M.placeInference(M.placementDefaults),weightFirst=M.placeInference({...M.placementDefaults,policy:'weights-first'});assert.ok(kvFirst.hbm.kv>weightFirst.hbm.kv);assert.ok(kvFirst.hbm.weights<weightFirst.hbm.weights);
});
test('extra HBF capacity cannot rescue mutable KV or an undersized SRAM tile',()=>{
 const v={...M.placementDefaults,hbmGiB:0,hostGiB:0,hbfGiB:2048,workspaceGiB:0};const r=M.placeInference(v);near(r.missing.weights,0);near(r.missing.kv,r.size.kv);assert.equal(r.feasible,false);near(r.hbf.kv,0);
 const tile=M.placeInference({...M.placementDefaults,sramMiB:0});near(tile.missing.tile,M.placementDefaults.tileMiB*M.MiB);assert.equal(tile.feasible,false);
});
test('remote staging is capacity-checked and counts a physical HBM write plus read',()=>{
 const r=M.placeInference(M.placementDefaults);assert.ok(r.externalRead>0);near(r.hbmTraffic,r.hbm.weights+r.hbm.kv+2*r.externalRead);assert.equal(r.stagingFits,true);
 const noBuffer=M.placeInference({...M.placementDefaults,workspaceGiB:0});assert.equal(noBuffer.stagingFits,false);assert.equal(noBuffer.feasible,false);
 const allZero=M.placeInference({...M.placementDefaults,sramMiB:0,hbmGiB:0,hostGiB:0,hbfGiB:0,workspaceGiB:0});assert.equal(allZero.feasible,false);near(allZero.missing.weights,allZero.size.weights);near(allZero.missing.kv,allZero.size.kv);
});
test('transfer startup vanishes at zero bytes and concurrency hides latency waves without multiplying bandwidth',()=>{
 const v={bytes:1000,sourceGBs:100,linkGBs:50,efficiency:.5,latencyUs:10,chunkBytes:100,concurrency:1};
 const a=M.transferService(v),b=M.transferService({...v,concurrency:4}),zero=M.transferService({...v,bytes:0});near(a.payloadSeconds,1000/25e9);near(a.waves,10);near(b.waves,3);near(a.payloadSeconds,b.payloadSeconds);assert.ok(b.seconds<a.seconds);assert.ok(b.effectiveGBs<=25);
 near(zero.seconds,0);near(zero.waves,0);near(zero.effectiveGBs,0);
 assert.throws(()=>M.transferService({...v,concurrency:0}),RangeError);assert.throws(()=>M.transferService({...v,sourceGBs:0}),RangeError);assert.throws(()=>M.transferService({...v,bytes:NaN}),RangeError);
});
test('a larger downstream link stops helping after the source bandwidth becomes binding',()=>{
 const v={bytes:1e9,sourceGBs:50,linkGBs:100,efficiency:1,latencyUs:0,chunkBytes:1e9,concurrency:1};near(M.transferService(v).seconds,.02);near(M.transferService({...v,linkGBs:1000}).seconds,.02);
 const a=M.tokenSystem({...M.tokenDefaults,hbmGBs:1000,packageGBs:2000}),b=M.tokenSystem({...M.tokenDefaults,hbmGBs:1000,packageGBs:4000});near(a.memorySeconds,b.memorySeconds);
});
test('one-rank decode has no collective traffic or startup even with many selected collectives',()=>{
 const r=M.tokenSystem({...M.tokenDefaults,ranks:1});near(r.networkSeconds,0);near(r.networkTraffic,0);assert.equal(r.fitsMemory,false);
 const noCollectives=M.tokenSystem({...M.tokenDefaults,collectivesPerLayer:0});near(noCollectives.networkSeconds,0);near(noCollectives.networkTraffic,0);
});
test('critical path uses maximum for overlap and sum for serial work, never duplicate package service',()=>{
 const a=M.tokenSystem({...M.tokenDefaults,overlap:true}),b=M.tokenSystem({...M.tokenDefaults,overlap:false});
 near(a.core,Math.max(a.computeSeconds,a.memorySeconds));near(b.core,b.computeSeconds+b.memorySeconds);near(b.seconds-a.seconds,Math.min(a.computeSeconds,a.memorySeconds));
 near(a.timeline.at(-1).start+a.timeline.at(-1).duration,a.seconds);near(a.timeline[1].start,a.timeline[2].start);near(b.timeline[2].start,b.timeline[1].start+b.memorySeconds);
 near(a.memorySeconds,a.memoryBytes/(Math.min(M.tokenDefaults.hbmGBs,M.tokenDefaults.packageGBs)*M.tokenDefaults.efficiency*1e9)+M.tokenDefaults.layers*M.tokenDefaults.memoryLatencyUs*1e-6);
});
test('energy integrates baseline once; overlap saves baseline energy while dynamic resource energy is unchanged',()=>{
 const v={...M.tokenDefaults,overlap:true},a=M.tokenSystem(v),b=M.tokenSystem({...v,overlap:false});
 near(b.energyJ-a.energyJ,(v.ranks*v.baseW+v.hostW)*(b.seconds-a.seconds));near(a.perTokenJ,a.energyJ/v.batch);near(a.averageW*a.seconds,a.energyJ);
 const zero=M.tokenSystem({...v,baseW:0,computeW:0,memoryW:0,networkW:0,hostW:0});near(zero.energyJ,0);
});
test('batching reuses weights and extra ranks can replicate rather than endlessly shrink KV',()=>{
 const a=M.tokenSystem({...M.tokenDefaults,batch:1,ranks:8}),b=M.tokenSystem({...M.tokenDefaults,batch:2,ranks:8}),c=M.tokenSystem({...M.tokenDefaults,batch:1,ranks:16});
 near(a.weightBytes,b.weightBytes);near(b.kvReadBytes,2*a.kvReadBytes);near(c.weightBytes,a.weightBytes/2);near(c.kvReadBytes,a.kvReadBytes);near(c.kvPartitions,8);
 assert.throws(()=>M.tokenSystem({...M.tokenDefaults,ranks:3}),RangeError);
});
test('lab IDs are unique, type-guarded, source-backed, and formula-ready',()=>{
 assert.equal(new Set(numericLabs.map(l=>l.id)).size,3);for(const l of numericLabs){assert.ok(isNumericLab(l.id));assert.ok(l.latex&&l.formula);assert.ok(l.sources.length>=2);l.sources.forEach(s=>assert.ok(s.url.startsWith('https://')));}assert.equal(isNumericLab('unknown'),false);
});
