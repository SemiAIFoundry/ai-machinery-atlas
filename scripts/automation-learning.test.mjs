import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import katex from 'katex';
const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url),'utf8'));
const pack=read('../src/lib/data/automation-learning.json'),eq=read('../src/lib/data/equations-automation-learning.json'),enrich=read('../src/lib/data/automation-enrichments.json'),review=read('../docs/automation-execution/learning-source-review.json');
const by=new Map(pack.lessons.map(x=>[x.id,x])),trace=id=>by.get(id).workedTrace,near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const sum=a=>a.reduce((n,x)=>n+x,0);
const all=new Map(read('../src/lib/generated/catalog.json').records.map(r=>[r.id,r]));for(const file of fs.readdirSync(new URL('../src/lib/data/',import.meta.url)).filter(x=>x.endsWith('.json'))){const p=read('../src/lib/data/'+file);for(const r of Array.isArray(p)?p:p.lessons??[])if(r?.id&&Array.isArray(r.prerequisites))all.set(r.id,r);}for(const r of pack.lessons)all.set(r.id,r);

test('25 substantive authored lessons cover five chapters with stable referenced IDs',()=>{
 assert.equal(pack.lessons.length,25);assert.equal(by.size,25);assert.equal(pack.chapters.length,5);assert.equal(new Set(pack.chapters.flatMap(x=>x.ids)).size,25);assert.deepEqual(new Set(pack.chapters.flatMap(x=>x.ids)),new Set(by.keys()));
 for(const l of pack.lessons){assert.ok(l.description.length>650,l.id);assert.ok(l.engineeringExample.length>350,l.id);assert.ok(l.mechanism.length>=4,l.id);assert.ok(l.learningObjective.length>50,l.id);assert.ok(l.evidenceNotes.length>100,l.id);assert.ok(l.science.length===1);assert.ok(l.prerequisites.every(p=>all.has(p)),`${l.id}: ${l.prerequisites}`);assert.ok(l.related.every(p=>all.has(p)));assert.ok(l.interfaces.some(x=>x.direction==='in')&&l.interfaces.some(x=>x.direction==='out'));assert.ok(l.labScope.length>80);assert.ok(l.sources.length>0);for(const c of [l.check,...l.checks]){assert.ok(c.options.length>=3&&Number.isInteger(c.answer)&&c.answer>=0&&c.answer<c.options.length);assert.ok(c.explanation.length>50);}assert.doesNotMatch(l.description,/\b(draw the|animate the|show the user|the viewer should)\b/i);}
});
test('proposed prerequisites have no cycles through the current authored corpus',()=>{const seen=new Map();function visit(id){assert.notEqual(seen.get(id),'active',id);if(seen.get(id)==='done')return;const l=all.get(id);assert.ok(l,`Unknown ${id}`);seen.set(id,'active');for(const p of l.prerequisites??[])visit(p);seen.set(id,'done');}for(const id of by.keys())visit(id);});
test('all 25 science entries are explicitly classified with strict canonical KaTeX and units',()=>{
 assert.deepEqual(new Set(Object.keys(eq)),new Set(by.keys()));let math=0,relationship=0;
 for(const l of pack.lessons){assert.equal(eq[l.id].length,l.science.length);for(const e of eq[l.id]){assert.ok(e.text.length>40);if(e.kind==='relationship'){relationship++;assert.equal(e.latex,undefined);}else{math++;assert.equal(e.kind,'math');assert.ok(e.variables.length>=2);assert.ok(e.variables.every(v=>v.symbol&&v.meaning&&v.unit));assert.doesNotThrow(()=>katex.renderToString(e.latex,{strict:'error',throwOnError:true,trust:false}));}}}
 assert.equal(math,21);assert.equal(relationship,4);
});
test('13 enrichments are append-only and preserve original science/check/prerequisites by contract',()=>{
 assert.equal(enrich.schemaVersion,1);assert.equal(Object.keys(enrich.entries).length,13);for(const [id,e] of Object.entries(enrich.entries)){assert.ok(all.has(id),id);assert.deepEqual(Object.keys(e).sort(),['appendDescription','appendMechanism','appendEngineeringExample','appendEvidenceNotes','additionalChecks','additionalRelated','additionalSources'].sort());assert.ok(e.appendDescription.length>250);assert.ok(e.appendEngineeringExample.length>250);assert.ok(e.appendMechanism.length>=2);assert.ok(e.additionalSources.length>0);assert.ok(e.additionalRelated.every(x=>all.has(x)));for(const c of e.additionalChecks){assert.ok(c.options.length>=3);assert.ok(c.answer>=0&&c.answer<c.options.length);assert.ok(c.explanation.length>35);}}
});
test('source references and explicit agent/date/scope records cover every new lesson without human-review claims',()=>{
 const sources=new Map(pack.sources.map(x=>[x.id,x]));assert.equal(sources.size,31);assert.equal(review.humanSpecialistReview,null);for(const l of pack.lessons){assert.ok(l.sourceIds.every(id=>sources.has(id)));assert.deepEqual(l.sources.map(x=>x.url).sort(),l.sourceIds.map(id=>sources.get(id).url).sort());}
 for(const s of review.sources){assert.equal(s.actorType,'agent');assert.equal(s.checkedOn,'2026-09-07');assert.ok(s.locator.length>30);assert.equal(s.humanSpecialistReview,null);assert.ok(s.lessonIds.every(id=>by.get(id).sourceIds.includes(s.id)));}assert.equal(pack.milestones.length,0);assert.equal(pack.timeline.length,0);for(const c of pack.claims){assert.ok(sources.has(c.sourceId));assert.ok(c.lessonIds.every(id=>by.has(id)));assert.ok(c.limitations.length>60);}
});
test('queue and idempotency worked ledgers conserve distinct deliveries and external units',()=>{
 const q=trace('event-queues-delivery');assert.equal(q.initial+q.arrivals-q.admitted-q.duplicatesRemoved,q.final);const d=trace('durable-actions-idempotency');assert.equal(d.stockBefore-d.quantity,d.stockAfterFirst);assert.equal(d.stockAfterFirst,d.stockAfterRetry);
});
test('serial trace and parallel dependency timing have independently derived answers',()=>{
 const t=trace('telemetry-traces-evaluation');assert.equal(sum(t.serialServicesMs)+t.proposalAndValidationMs+t.admissionMs+t.reviewMs,t.elapsedMs);assert.equal(Math.max(...t.parallelMs)+t.joinMs,t.parallelElapsedMs);assert.notEqual(sum(t.parallelMs)+t.joinMs,t.parallelElapsedMs);
});
test('normalizer swap changes a frozen logistic function without changing weights',()=>{
 const t=trace('model-artifact-rollout-drift'),sigmoid=x=>1/(1+Math.exp(-x));near(sigmoid(t.weight*(t.x-t.mean)/t.sd+t.bias),t.probability);near(sigmoid(t.weight*(t.x-t.wrongMean)/t.sd+t.bias),t.wrongProbability);assert.ok(t.probability>.5&&t.wrongProbability<.5);
});
test('context, live-buffer and retrieval metric boundaries use the correct denominators',()=>{
 const c=trace('context-memory-provenance');assert.equal(sum(c.components),c.capacity);assert.ok(sum(c.components)+c.duplicate>c.capacity);const b=trace('sandbox-egress-secrets');assert.equal(sum(b.liveBuffersMiB),b.peakPayloadMiB);assert.ok(b.peakPayloadMiB>b.limitMiB);const r=trace('retrieval-indexing-evaluation');near(r.retrievedRelevant/r.relevant,r.recall);near(r.correct/r.questions,r.accuracy);assert.equal(r.supported/r.answers,1);assert.notEqual(r.supported/r.answers,r.accuracy);
});
test('coordinated work has distinct elapsed/work and explicitly conditional success',()=>{
 const t=trace('multi-agent-coordination-cost');assert.equal(Math.max(...t.durationsS)+t.mergeS,t.parallelS);assert.equal(sum(t.durationsS)+t.mergeS,t.totalWorkS);near(t.pA*t.pBIndependent,t.jointIndependent);assert.ok(t.jointIndependent<t.pA);
});
test('document totals and independent code examples catch plausible but incorrect outputs',()=>{
 const d=trace('document-extraction-validation');assert.equal(sum(d.quantities.map((q,i)=>q*d.pricesCents[i])),d.totalCents);assert.equal(sum(d.quantities.map((q,i)=>q*d.misreadPricesCents[i])),d.misreadTotalCents);assert.notEqual(d.totalCents,d.misreadTotalCents);const c=trace('coding-agent-patch-evidence');assert.equal(sum(c.first)/c.first.length,c.firstMean);assert.equal(sum(c.second)/c.second.length,c.secondMean);assert.notEqual(c.hardcodedPatch,c.secondMean);
});
test('planar frame transform and stale-observation motion bound preserve units and orientation',()=>{
 const t=trace('robot-observation-frame');const p=t.rotation.map((row,i)=>sum(row.map((v,j)=>v*t.pointCamera[j]))+t.translation[i]);assert.deepEqual(p,t.pointWorld);near(t.ageS*t.maxRelativeSpeedMS,t.motionBoundM);assert.notDeepEqual(p,t.pointCamera);
});
test('path speed bounds and sampled feedback stability are derived from their declared models',()=>{
 const p=trace('robot-goal-plan-action');near(p.pathM/p.speedMS,p.minimumS);near(p.detourM/p.speedMS,p.detourMinimumS);const t=trace('robot-feedback-control');function errors(gain){const values=[t.initialErrorM];for(let i=0;i<2;i++)values.push((1-gain*t.sampleS)*values.at(-1));return values;}errors(t.stableGainPerS).forEach((x,i)=>near(x,t.stableErrorsM[i]));errors(t.unstableGainPerS).forEach((x,i)=>near(x,t.unstableErrorsM[i]));assert.ok(Math.abs(1-t.stableGainPerS*t.sampleS)<1);assert.ok(Math.abs(1-t.unstableGainPerS*t.sampleS)>1);
});
test('action codec and speech timings do not confuse symbols, velocity, displacement or error ratios',()=>{
 const a=trace('embodied-policy-evidence'),velocity=-a.maxSpeedMS+2*a.maxSpeedMS*a.selectedBin/(a.bins-1);near(velocity,a.velocityMS);near(velocity*a.intervalS,a.displacementM);const s=trace('streaming-speech-turns');near((s.substitutions+s.deletions+s.insertions)/s.referenceWords,s.wer);assert.equal(sum(s.serialTimingMs),s.latencyMs);
});
test('ranking, forecast and physical residual examples independently reproduce their claimed values',()=>{
 const r=trace('recommendation-ranking-feedback');near(sum(r.labels)/r.k,r.precision);r.clicks.forEach((x,i)=>near(x/r.shown[i],r.observedCtr[i]));const f=trace('temporal-forecast-validation'),mae=p=>sum(p.map((v,i)=>Math.abs(v-f.actual[i])))/f.actual.length;near(mae(f.forecast),f.mae);near(mae(f.baseline),f.baselineMae);const t=trace('scientific-surrogate-validation'),p=t.predictionK;near((p[0]-2*p[1]+p[2])/t.spacingM**2,t.residualKM2);near(sum(p.map((v,i)=>Math.abs(v-t.referenceK[i])))/p.length,t.maeK);assert.equal((t.referenceK[0]-2*t.referenceK[1]+t.referenceK[2])/t.spacingM**2,0);
});
test('robotics and model/protocol explanations do not claim mechanisms that are not executed by E5',()=>{
 for(const id of ['robot-observation-frame','robot-goal-plan-action','robot-feedback-control','embodied-policy-evidence','mcp-host-client-server','delegated-agent-protocols'])assert.match(by.get(id).labScope,/worked example|worked|does not execute/i);
 assert.match(by.get('embodied-policy-evidence').description,/not RT-2/);assert.match(by.get('mcp-host-client-server').description,/not an MCP wire/);assert.match(by.get('workflow-graphs-state').evidenceNotes,/authored code/);
});
