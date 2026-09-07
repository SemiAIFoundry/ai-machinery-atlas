import fs from 'node:fs';
import assert from 'node:assert/strict';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
if(!process.env.ATLAS_REPO_ROOT)throw Error('Set ATLAS_REPO_ROOT to the atlas checkout.');
const repo=resolve(process.env.ATLAS_REPO_ROOT),dir=dirname(fileURLToPath(import.meta.url));
const read=name=>JSON.parse(fs.readFileSync(resolve(dir,name),'utf8'));
const load=name=>import(pathToFileURL(resolve(repo,'src/lib',name)));
const [a,f,h,lessonContract]=await Promise.all(['architecture-execution.ts','fabrication-flow.ts','operating-hall.ts','lesson-contract.ts'].map(load));
const contracts=read('scenario-contracts.json');
for(const file of contracts.modelFiles){assert.equal(createHash('sha256').update(fs.readFileSync(resolve(repo,file.path))).digest('hex'),file.sha256,`${file.path} changed; recalculate and review the teaching contract before reuse.`);}
const near=(x,y,label)=>assert.ok(Math.abs(x-y)<=1e-9*Math.max(1,Math.abs(y)),`${label}: ${x} != ${y}`);
function compare(actual,expected,label){
 if(typeof expected==='number'){near(actual,expected,label);return;}
 if(Array.isArray(expected)){assert.equal(actual.length,expected.length,label);expected.forEach((v,i)=>compare(actual[i],v,`${label}[${i}]`));return;}
 if(expected&&typeof expected==='object'){for(const [k,v]of Object.entries(expected))compare(actual[k],v,`${label}.${k}`);return;}
 assert.equal(actual,expected,label);
}
for(const c of contracts.contracts){
 if(c.experience==='architecture'){
  assert.equal(c.modelVersion,a.architectureVersion);const r=a.buildArchitectureComparison(c.input);compare(r.reference,c.expected.output,c.id);for(const [k,v]of Object.entries(c.expected.traces))compare(r.traces[k].totals,v,c.id+k);
 } else if(c.experience==='fabrication'){
  assert.equal(c.modelVersion,f.fabricationFlowVersion);const r=f.evaluateFabricationFlow(c.input);compare({filmNm:r.specimen.actualFilmNm,developedCdNm:r.specimen.developedCdNm,transferredCdNm:r.specimen.actualCdNm,maskRemainingNm:r.specimen.maskRemainingNm,oxideRemainingNm:r.specimen.remainingOxideNm,grossDies:r.wafer.grossDies,eligibleDies:r.wafer.eligibleDiesPerWafer,reviewDies:r.wafer.reviewDiesPerWafer,screenedGoodDies:r.wafer.screenedGoodDies,assemblyStarts:r.assembly.starts,acceptedOutput:r.acceptedOutput,outputStatus:r.outputStatus},c.expected,c.id);
 } else {
  assert.equal(c.modelVersion,h.OPERATING_HALL_VERSION);const r=h.simulateOperatingHall(c.input);compare(r.final.counters,c.expected.final,c.id);compare(r.service,c.expected.service,c.id+' service');compare(r.summary,c.expected.summary,c.id+' summary');assert.equal(r.admission.admittedRacks,c.expected.admittedRacks);
  if(c.expected.fault)compare(r.events.find(e=>e.kind==='fault'),c.expected.fault,c.id+' fault');if(c.expected.events)compare(r.events,c.expected.events,c.id+' events');if(c.expected.atFault)compare(h.sampleOperatingHall(r,12),c.expected.atFault,c.id+' at fault');
 }
}
// A separate arithmetic path checks the hand-worked fixture instead of copying its model result.
const toy=contracts.contracts.find(c=>c.id==='H7'),r=h.simulateOperatingHall(toy.input),final=r.final.counters;
assert.equal(r.service.stepS,Math.max(16/32,128/256)+32/64);
const checkpointCommit=8+32/32+.25;assert.equal(checkpointCommit,9.25);
const lost=(12-checkpointCommit)/1,afterRestore=20-(12+2+32/32),executed=8+lost+afterRestore,retained=8+afterRestore;
assert.equal(lost,2.75);assert.equal(retained,13);assert.equal(executed,15.75);
near(final.retainedUsefulSteps,retained,'hand retained');near(final.lostWorkEquivalents,lost,'hand lost');near(final.executedWorkEquivalents,executed,'hand executed');
near(final.itEnergyJ,executed*8+1.25*4+3*2,'hand IT energy');near(final.facilityEnergyJ,1.25*137,'hand facility energy');
// Negative transfer: an interrupted commit cannot manufacture a checkpoint.
const interrupted=structuredClone(toy.input);interrupted.faults[0].atS=9.1;interrupted.durationS=9.2;const stopped=h.simulateOperatingHall(interrupted);assert.equal(stopped.final.counters.checkpointedSteps,0);assert.equal(stopped.final.counters.retainedUsefulSteps,0);near(stopped.final.counters.lostWorkEquivalents,8,'interrupted commit loss');
const lesson=read('second-author-lesson.json'),equations=read('second-author-equations.json'),evidence=read('second-author-evidence.json');lessonContract.validateLessonRecord(lesson,lesson.id);
assert.equal(lesson.check.options.length,3);assert.equal(lesson.check.answer,0);assert.equal(lesson.science.length,equations.length);assert.ok(lesson.mechanism.length>=3);
const {loadCurrent,stable,sha,sourceId}=await import(pathToFileURL(resolve(repo,'docs/curation/curation-common.mjs')));const current=loadCurrent(repo);
const integratedPresent=fs.existsSync(resolve(dir,'integrated-source-review-snapshot.json'));
const activeSnapshot=read(integratedPresent?'integrated-source-review-snapshot.json':'second-author-review-snapshot.json');
assert.ok(!current.atlas.byId[lesson.id]||stable(current.atlas.byId[lesson.id])===stable(activeSnapshot.record),'Existing ID differs from its scoped reviewed snapshot');
if(integratedPresent){const integratedEvent=read('integrated-source-review.json').events[0];assert.equal(sha(stable(activeSnapshot)),integratedEvent.contentFingerprint);assert.equal(current.fingerprint(current.atlas.byId[lesson.id]),integratedEvent.contentFingerprint);}
for(const id of [...lesson.prerequisites,...lesson.related])assert.ok(current.atlas.byId[id],id);
const graph=new Map([...current.atlas.records.map(r=>[r.id,r.prerequisites||[]]),[lesson.id,lesson.prerequisites]]),visited=new Set(),active=new Set();
function visit(id){assert.ok(!active.has(id),'Prerequisite cycle');if(visited.has(id))return;active.add(id);for(const next of graph.get(id)||[])visit(next);active.delete(id);visited.add(id);}for(const id of graph.keys())visit(id);
const snapshot=read('second-author-review-snapshot.json'),provenance=read('second-author-provenance.json');assert.equal(sha(stable(snapshot)),provenance.contentFingerprint,'Canonical content fingerprint');
assert.equal(snapshot.record.id,lesson.id);assert.equal(evidence.sources.length,lesson.sources.length);assert.ok(evidence.claims.every(c=>c.lessonIds.includes(lesson.id)&&evidence.sources.some(s=>s.id===c.sourceId)));
const events=read('second-author-review-event.json');const {validateEvents}=await import(pathToFileURL(resolve(repo,'docs/curation/curation-freshness.mjs')));
validateEvents({lessons:{[lesson.id]:{contentFingerprint:provenance.contentFingerprint,sourceReferences:lesson.sources.map(s=>({sourceId:sourceId(s.url)})),claimIds:evidence.claims.map(c=>c.id)}}},events,'2026-09-07');
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.md'))){const text=fs.readFileSync(resolve(dir,file),'utf8');assert.ok(!text.includes('/Users/'),'No private path');for(const match of text.matchAll(/\]\(([^)]+)\)/g))if(!/^https?:/.test(match[1]))assert.ok(fs.existsSync(resolve(dir,match[1])),'Portable link '+match[1]);}
console.log(JSON.stringify({status:'pass',contracts:contracts.contracts.length,independentHandArithmetic:'pass',interruptedCommitCounterexample:'pass',lessonSchema:'pass',prerequisiteDAG:'pass',reviewEvent:'agent source-scope; no human specialist or observation',fingerprint:provenance.contentFingerprint,integratedFingerprint:integratedPresent?sha(stable(activeSnapshot)):null},null,2));
