import test from 'node:test';
import assert from 'node:assert/strict';
import {fabricationDefaults as d,fabricationBounds,evaluateFabricationFlow as run,validateFabricationInput,inspectInterval,fabricationStageIds} from '../src/lib/fabrication-flow.ts';
const near=(a,b,tolerance=1e-10)=>assert.ok(Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(b)),`${a} differs from ${b}`);
const area=section=>section.regions.filter(r=>!r.overlay).reduce((a,r)=>a+(r.xMax-r.xMin)*(r.yMax-r.yMin),0);

test('baseline independently checks dimension conversion, stage identity, and accepted denominators',()=>{
 const r=run(d);assert.equal(r.wafer.grossDies,597);near(r.wafer.poissonMean,.12);near(r.wafer.defectFreeProbability,Math.exp(-.12));
 near(r.wafer.screenedGoodDies,597*4*Math.exp(-.12));assert.equal(r.assembly.starts,800);
 near(r.assembly.conditionalSurvival,.999**2*.995**10*.98);near(r.acceptedOutput,800*.999**2*.995**10*.98);
 assert.equal(r.outputStatus,'accepted-within-example');assert.deepEqual(r.stages.map(s=>s.id),[...fabricationStageIds]);assert.equal(new Set(r.stages.map(s=>s.specimenId)).size,1);
});
test('every complete square die fits the usable disk; cohorts conserve the population',()=>{
 for(const dieAreaMm2 of[20,100,500]){const r=run({...d,dieAreaMm2}),w=r.wafer;assert.equal(w.cohortCounts.reduce((a,b)=>a+b,0),w.grossDies);assert.equal(new Set(w.centers.map(p=>`${p.xMm},${p.yMm}`)).size,w.grossDies);
  for(const p of w.centers)assert.ok(Math.hypot(Math.abs(p.xMm)+w.dieSideMm/2,Math.abs(p.yMm)+w.dieSideMm/2)<=147+1e-10);
  assert.equal(w.eligibleDiesPerWafer+w.reviewDiesPerWafer+w.failedDiesPerWafer,w.grossDies);
 }
});
test('oxidation moves both boundaries, whereas deposition adds material above the grown oxide',()=>{
 const r=run(d),grown=r.stages[1].sections[0],dep=r.stages[2].sections[0];const si=grown.regions.find(s=>s.id==='substrate'),ox=grown.regions.find(s=>s.id==='oxide'),film=dep.regions.find(s=>s.id==='target');
 near(si.yMax,-8.8);near(ox.yMin,-8.8);near(ox.yMax,11.2);near(ox.yMax-ox.yMin,20);near(film.yMin,ox.yMax);near(film.yMax-film.yMin,100);
 assert.equal(grown.datum,dep.datum);assert.equal(grown.unit,'nm');
});
test('latent image preserves physical material; development removes resist while target stays intact',()=>{
 const r=run(d),coated=r.stages[3].sections[0],exposed=r.stages[4].sections[0],developed=r.stages[5].sections[0];near(area(coated),area(exposed));assert.ok(exposed.regions.some(s=>s.material==='latent-resist'&&s.overlay));
 assert.deepEqual(developed.regions.filter(s=>s.material==='deposited-poly-Si'),coated.regions.filter(s=>s.material==='deposited-poly-Si'));assert.ok(area(developed)<area(coated));
 assert.ok(!developed.regions.some(s=>s.material==='resist'&&s.xMin<0&&s.xMax>0));
});
test('etch budget closes target, mask and stop consumption under the declared exposure',()=>{
 const r=run(d),s=r.specimen;near(s.requestedEtchDepthNm,108);near(s.maskConsumedNm,10.8);near(s.maskRemainingNm,29.2);near(s.remainingTargetNm,0);near(s.remainingOxideNm,19.8);
 const thicker=run({...d,depositionBiasNm:20});near(thicker.specimen.remainingTargetNm,12);assert.equal(thicker.specimen.checks.find(x=>x.id==='clear-target').decision,'fail');assert.equal(thicker.acceptedOutput,0);
 const noStopBudget=run({...d,oxideNominalNm:10,oxideBiasNm:-8,overetchFraction:.4,targetStopSelectivity:5});assert.equal(noStopBudget.specimen.remainingOxideNm,0);assert.equal(noStopBudget.acceptedOutput,0);
});
test('mask exhaustion propagates a failure without negative solids or a successful requested profile',()=>{
 const r=run({...d,maskInitialNm:5});assert.ok(r.specimen.maskRemainingNm<0);assert.equal(r.specimen.maskBudgetValid,false);assert.equal(r.wafer.screenedGoodDies,0);assert.equal(r.acceptedOutput,0);assert.equal(r.outputStatus,'no-eligible-dies');assert.equal(r.stages.at(-1).decision,'fail');
 assert.equal(r.stages[6].sections[0].geometryStatus,'requested-unqualified');for(const s of r.stages)for(const section of s.sections)for(const region of section.regions)assert.ok(region.xMax>region.xMin&&region.yMax>region.yMin);
});
test('inspection preserves geometry and selected cohort does not alter lot output',()=>{
 const r=run(d);assert.deepEqual(r.stages[6].sections,r.stages[7].sections);assert.deepEqual(r.stages[7].sections,r.stages[8].sections);
 for(let selectedCohort=0;selectedCohort<9;selectedCohort++){const s=run({...d,selectedCohort});near(s.acceptedOutput,r.acceptedOutput);assert.equal(s.specimen.index,selectedCohort);assert.ok(s.stages.every(stage=>stage.specimenId===s.specimen.id));}
});
test('interval containment distinguishes supported pass, ambiguous review and definite failure',()=>{
 assert.equal(inspectInterval('x','x','nm',10,1,8,12,'synthetic').decision,'pass');assert.equal(inspectInterval('x','x','nm',11.5,1,8,12,'synthetic').decision,'review');assert.equal(inspectInterval('x','x','nm',14,1,8,12,'synthetic').decision,'fail');
 assert.equal(inspectInterval('x','x','nm',10,2,8,12,'synthetic').decision,'pass');assert.throws(()=>inspectInterval('x','x','nm',10,-1,8,12,'synthetic'));
});
test('uncertainty and tolerance change acceptance, never the actual material geometry',()=>{
 const base=run(d),u=run({...d,uncertaintyScale:5}),t=run({...d,toleranceScale:.5});assert.deepEqual(u.stages[6].sections,base.stages[6].sections);assert.deepEqual(t.stages[6].sections,base.stages[6].sections);
 assert.ok(u.acceptedOutput<base.acceptedOutput);assert.ok(t.acceptedOutput<base.acceptedOutput);assert.equal(u.assembly.limiting[0],'screened-dies');assert.equal(t.assembly.limiting[0],'screened-dies');
 let previous=Infinity;for(const uncertaintyScale of[0,.5,1,2,3,4,5]){const r=run({...d,uncertaintyScale});assert.ok(r.wafer.eligibleDiesPerWafer<=previous);previous=r.wafer.eligibleDiesPerWafer;}
});
test('the initial defect yield is not recharged to screened inputs during assembly',()=>{
 const setup={...d,acceptedHbmStacks:20000,assemblySlots:5000},a=run({...setup,defectDensityCm2:0}),b=run({...setup,defectDensityCm2:.5});assert.equal(a.assembly.limiting[0],'screened-dies');assert.equal(b.assembly.limiting[0],'screened-dies');near(b.acceptedOutput/a.acceptedOutput,Math.exp(-.5));near(a.assembly.conditionalSurvival,b.assembly.conditionalSurvival);
});
test('route geometry, geometric registration and electrical evidence remain distinct',()=>{
 const tc=run(d),mr=run({...d,interfaceRoute:'mr-muf'}),hybrid=run({...d,interfaceRoute:'hybrid'});const materials=r=>r.stages[9].sections[1].regions.map(x=>x.material);
 assert.ok(materials(tc).includes('ncf'));assert.ok(!materials(tc).includes('muf'));assert.ok(materials(mr).includes('muf'));assert.ok(!materials(hybrid).includes('solder'));assert.ok(!materials(hybrid).includes('ncf'));
 near(tc.assembly.conditionalSurvival,hybrid.assembly.conditionalSurvival);
 const shift=run({...d,interfaceRoute:'hybrid',alignmentOffsetUm:1});assert.equal(shift.assembly.geometricOverlapFraction,.5);assert.equal(shift.assembly.interfaceDecision,'fail');assert.equal(shift.acceptedOutput,0);near(shift.assembly.interfaceChecks[1].reading,hybrid.assembly.interfaceChecks[1].reading);
 const badElectrical=run({...d,contactResistanceMilliOhm:100});near(badElectrical.assembly.geometricOverlapFraction,tc.assembly.geometricOverlapFraction);assert.equal(badElectrical.acceptedOutput,0);
});
test('missing or failed scoped qualification cannot be replaced by inspection or increased supply',()=>{
 const baseline=run(d);for(const qualificationEvidence of['not-provided','synthetic-fail']){const r=run({...d,qualificationEvidence});near(r.wafer.screenedGoodDies,baseline.wafer.screenedGoodDies);near(r.assembly.screenedPackages,baseline.assembly.screenedPackages);assert.equal(r.acceptedOutput,0);assert.notEqual(r.stages.at(-1).decision,'pass');}
 for(const patch of[{acceptedHbmStacks:0},{assemblySlots:0}]){const r=run({...d,...patch});assert.equal(r.acceptedOutput,0);assert.notEqual(r.outputStatus,'accepted-within-example');}
});
test('all scalar extremes produce finite state, valid regions and bounded accepted output',()=>{
 for(const[key,[lo,hi]]of Object.entries(fabricationBounds))for(const value of[lo,hi]){const r=run({...d,[key]:value});assert.ok(Number.isFinite(r.acceptedOutput));assert.ok(r.acceptedOutput>=0&&r.acceptedOutput<=r.assembly.starts+1e-10);for(const stage of r.stages)for(const section of stage.sections)for(const shape of section.regions){assert.ok([shape.xMin,shape.xMax,shape.yMin,shape.yMax].every(Number.isFinite));assert.ok(shape.xMin<shape.xMax&&shape.yMin<shape.yMax);}}
});
test('input rejection is strict and evaluation is pure and reproducible',()=>{
 const original=structuredClone(d),r=run(d);assert.deepEqual(d,original);assert.deepEqual(run(JSON.parse(JSON.stringify(d))),r);
 for(const bad of[null,[],{...d,unknown:1},{...d,waferCount:1.1},{...d,maskInitialNm:Infinity},{...d,interfaceRoute:['hybrid']},{...d,qualificationEvidence:'verified'}])assert.throws(()=>validateFabricationInput(bad));
});
test('a translated hybrid upper die carries its dielectric surface with it',()=>{
 const r=run({...d,interfaceRoute:'hybrid',alignmentOffsetUm:8});
 const regions=r.stages[9].sections.find(s=>s.id==='package-interface').regions;
 const die=regions.find(r=>r.id==='upper-die'),dielectric=regions.find(r=>r.id==='upper-dielectric');
 assert.equal(dielectric.xMin,die.xMin);assert.equal(dielectric.xMax,die.xMax);
 assert.equal(dielectric.yMax,die.yMin);
});
