import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {memoryContextFromAtlas,evaluateMemoryExplorer as evaluate,memoryExplorerDefaults as defaults} from '../src/lib/memory-interfaces.ts';

const lib=resolve('src/lib');
const [{systemScenario,scenarioDefaults},{hbmStackDefaults,bondRoutes},{referenceSystem}]=await Promise.all(['investigation-models.ts','numeric-math.ts','reference-system.ts'].map(file=>import(pathToFileURL(resolve(lib,file)))));
const bindings={systemScenario,hbmStackDefaults,bondRoutes,referenceSystem};
const context=(patch={})=>memoryContextFromAtlas({...scenarioDefaults,...patch},bindings);
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('the adapter preserves every existing stack, thermal and workload boundary without a second parameter set',()=>{
 const c=context(),r=evaluate(defaults,c),s=c.system.stack;
 assert.equal(r.stack.heightUm,s.heightUm);assert.deepEqual(r.stack.thermal.temperatures,s.temperatures);assert.equal(r.stack.thermal.interfaceKW,bondRoutes[scenarioDefaults.route].interfaceKW);
 assert.equal(r.stack.capacityBytes,s.capacityGB*1e9);assert.equal(r.stack.addressWindowBytes,scenarioDefaults.dies*2**31);
 near(r.stack.unmappedCapacityBytes+r.stack.addressWindowBytes,r.stack.capacityBytes);
 near(r.residency.boundaries.find(b=>b.id==='hbm').capacityBytes,referenceSystem.package.hbmStacks*s.capacityGB*1e9);
 assert.equal(r.residency.nextStepFits,c.system.nextStepFits);assert.equal(r.residency.executionFeasible,c.system.executionFeasible);
});
test('stack layers partition the existing height exactly and selecting a bit selects precisely one die',()=>{
 const c=context(),r=evaluate({...defaults,byteAddress:5*2**31+42},c),layers=r.stack.layers;
 assert.equal(layers[0].zMinUm,0);assert.equal(layers.at(-1).zMaxUm,c.system.stack.heightUm);
 for(let i=1;i<layers.length;i++)assert.equal(layers[i].zMinUm,layers[i-1].zMaxUm);
 assert.equal(layers.filter(l=>l.kind==='dram-die'&&l.selected).length,1);assert.equal(layers.find(l=>l.kind==='dram-die'&&l.selected).die,5);
 assert.equal(r.bankWindow.filter(w=>w.selected).length,1);assert.equal(r.bits.filter(b=>b.selected).length,1);
});
test('route changes use the existing gaps and thermal model, while hybrid receives no solder-strain inference',()=>{
 for(const route of['tc-ncf','mr-muf','hybrid']){
  const c=context({route}),r=evaluate(defaults,c);assert.equal(r.interfaceDetail.gapUm,bondRoutes[route].gapUm);assert.equal(r.stack.thermal.layerKW,c.system.stack.layerKW);
  if(route==='hybrid'){assert.equal(r.interfaceDetail.selected.solderShearProxy,null);assert.deepEqual(r.interfaceDetail.materials,['copper','bond-dielectric']);}
  else assert.ok(r.interfaceDetail.materials.includes(route==='tc-ncf'?'ncf':'muf'));
 }
});
test('thermal/mechanical indicator has correct ppm, mm and micrometre conversion and scales with the declared excursion',()=>{
 const c=context(),r=evaluate({...defaults,operatingPowerSwing:0,ambientSwingC:50,cteMismatchPpmPerK:3,distanceFromNeutralMm:2},c);
 for(const i of r.stack.interfaces){near(i.deltaTemperatureC,50);near(i.freeMismatchUm,.3);near(i.solderShearProxy,.3/c.gapUm);}
 const twice=evaluate({...defaults,operatingPowerSwing:0,ambientSwingC:100,cteMismatchPpmPerK:3,distanceFromNeutralMm:2},c);near(twice.stack.interfaces[0].freeMismatchUm,.6);
 const heat=evaluate({...defaults,operatingPowerSwing:1,ambientSwingC:50,cteMismatchPpmPerK:3,distanceFromNeutralMm:2},c);assert.ok(heat.stack.interfaces[0].freeMismatchUm>.3);
 const zero=evaluate({...defaults,cteMismatchPpmPerK:0},c);assert.ok(zero.stack.interfaces.every(i=>i.freeMismatchUm===0));
 assert.equal(heat.evidence.conditionalSurvival,r.evidence.conditionalSurvival); // No invented yield from the indicator.
});
test('known-good, post-bond, and qualification evidence remain separate from modeled survival',()=>{
 const c=context(),all={...defaults,qualificationEvidence:'synthetic-pass'},r=evaluate(all,c);
 near(r.evidence.starts,c.system.screenedMemoryDies/c.dies);near(r.evidence.modeledGoodStacks,r.evidence.starts*c.system.stack.conditionalYield);
 assert.equal(r.evidence.acceptedExampleStacks,c.system.goodStacks);
 for(const key of['kgdEvidence','postBondEvidence','qualificationEvidence']){
  for(const state of['not-provided','synthetic-fail']){const x=evaluate({...all,[key]:state},c);assert.equal(x.evidence.acceptedExampleStacks,0);assert.equal(x.evidence.modeledGoodStacks,r.evidence.modeledGoodStacks);}
 }
 const tall=evaluate(all,context({dies:16}));assert.equal(tall.evidence.status,'model-limit-fail');assert.equal(tall.evidence.acceptedExampleStacks,0);
 const disconnected=evaluate({...all,registrationOffsetUm:defaults.padWidthUm},c);assert.equal(disconnected.evidence.status,'no-contact-overlap');assert.equal(disconnected.evidence.acceptedExampleStacks,0);
});
test('residency conserves weights and mutable KV; HBF is read-only and remote HBM staging closes once',()=>{
 for(const patch of [{},{useHbf:true},{weightBits:8},{context:32768,batch:16,useHbf:true}]){
  const c=context(patch),p=c.system.placement,r=evaluate(defaults,c),sum=kind=>r.residency.segments.filter(s=>s.workload===kind).reduce((n,s)=>n+s.bytes,0);
  near(sum('weights')+r.residency.missing.weights,p.size.weights);near(sum('kv')+r.residency.missing.kv,p.size.kv);
  assert.ok(r.residency.segments.filter(s=>s.tier==='hbf').every(s=>s.workload==='weights'&&!s.mutable));
  const flows=r.residency.flows,remote=flows.filter(f=>f.id==='host-to-hbm'||f.id==='hbf-to-hbm').reduce((n,f)=>n+f.bytes,0);
  near(remote,p.externalRead);near(remote+flows.find(f=>f.id==='hbm-to-compute').bytes,p.hbmTraffic);
  near(flows.find(f=>f.id==='compute-to-kv').bytes,c.system.token.kvAppendBytes);near(flows.find(f=>f.id==='activation-exchange').bytes,c.system.token.activationTraffic);
  for(const b of r.residency.boundaries)near(b.usedBytes+b.freeBytes,b.capacityBytes);
 }
});
test('static capacity and one-step execution recovery retain current atlas behavior',()=>{
 const full=evaluate(defaults,context({context:32768})),recover=evaluate(defaults,context({context:32768,weightBits:8}));
 assert.equal(full.residency.placementFeasible,true);assert.equal(full.residency.nextStepFits,false);assert.equal(full.residency.executionFeasible,false);
 assert.equal(recover.residency.nextStepFits,true);assert.equal(recover.residency.executionFeasible,true);
});
test('the context rejects inconsistent capacity, screened denominators and mutable flash; evaluation is pure',()=>{
 const c=context(),snapshot=JSON.stringify(c);evaluate(defaults,c);assert.equal(JSON.stringify(c),snapshot);
 for(const mutate of[x=>x.system.stack.heightUm++,x=>x.system.placement.caps.hbm++,x=>x.system.stackStarts++,x=>x.system.placement.hbf.kv=1]){
  const bad=structuredClone(c);mutate(bad);assert.throws(()=>evaluate(defaults,bad));
 }
});
test('selected stack and bit trace connect to declared HBM residency without changing capacity or local address fields',()=>{
 const c=context(),first=evaluate({...defaults,byteAddress:0,selectedStack:0},c),second=evaluate({...defaults,byteAddress:0,selectedStack:1},c);
 assert.equal(first.allocation.workload,'workspace');assert.equal(first.allocation.packageByteAddress,0);
 assert.equal(second.allocation.packageByteAddress,c.system.stack.capacityGB*1e9);assert.equal(second.allocation.workload,'weights');
 assert.deepEqual(first.address.parts,second.address.parts);assert.equal(second.hierarchy.find(h=>h.id==='stack').index,1);
 assert.equal(first.stack.capacityBytes,second.stack.capacityBytes);assert.throws(()=>evaluate({...defaults,selectedStack:c.hbmStacksPerPackage},c));
});
