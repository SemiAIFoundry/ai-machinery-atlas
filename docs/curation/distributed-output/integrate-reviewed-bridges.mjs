import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {loadCurrent,readJSON,sha,stable,sourceId,lessonReferences} from '../curation-common.mjs';
import {validateEvents} from '../curation-freshness.mjs';

// This imports one preserved, completed author review. It performs no live source reading.
// Changed authored content or evidence requires a new review, not a regenerated acceptance.
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(process.argv[2]||process.cwd());
const evidencePath='docs/distributed-output-bridges/source-review-manifest.json';
const raw=fs.readFileSync(path.join(repo,evidencePath),'utf8'),evidence=JSON.parse(raw),review=evidence.reviewDispositions;
assert.equal(review.disposition,'agent-source-and-authored-math-checks-complete');
assert.equal(review.actor.actorType,'agent');assert.equal(review.actor.actorId,'/root/curriculum_assessment');
assert.equal(review.reviewedOn,'2026-09-07');assert.equal(evidence.humanSpecialistReview,null);
for(const f of review.candidateFiles)assert.equal(sha(fs.readFileSync(path.join(repo,f.path))),f.sha256,'Candidate file changed: '+f.path);
const current=loadCurrent(repo),asOf=review.reviewedOn;
const actor={kind:'agent',identifier:'/root/process_editor',role:'AI integration reviewer retaining the author’s recorded primary-source and numerical checks'};
const checkedBy={kind:'agent',identifier:review.actor.actorId,role:review.actor.role};
const allowedMappingFields=new Set(['labId','labScope','deepLabId','scope']);
const save=(name,value)=>{const p=path.join(here,name),text=JSON.stringify(value,null,2)+'\n';if(fs.existsSync(p))assert.equal(fs.readFileSync(p,'utf8'),text,'Preserved review artifact changed: '+name);else fs.writeFileSync(p,text);};
const changes=[],events=[];
for(const r of review.lessons){
 assert.equal(sha(JSON.stringify(r.contentSnapshot)),r.snapshotSha256,'Author snapshot identity');
 assert.equal(r.actor.actorId,checkedBy.identifier);assert.equal(r.reviewedOn,asOf);
 const record=current.atlas.byId[r.lessonId],candidate=r.contentSnapshot.lesson;
 assert.ok(record,'Lesson must be integrated before creating its event');
 assert.deepEqual(current.equations[r.lessonId],r.contentSnapshot.equations,'Formal equations retain the reviewed candidate');
 const claims=current.claims.filter(c=>c.lessonIds.includes(r.lessonId));
 assert.deepEqual(claims,r.contentSnapshot.claims,'Structured claims retain the reviewed candidate');
 const mappingChanges=[];
 for(const k of new Set([...Object.keys(candidate),...Object.keys(record)]))if(stable(candidate[k])!==stable(record[k])){
  assert.ok(allowedMappingFields.has(k),'Unreviewed scientific content change: '+r.lessonId+'.'+k);
  mappingChanges.push({field:k,candidate:candidate[k]??null,integrated:record[k]??null});
 }
 const chapter=current.atlas.chapterFor(r.lessonId);
 assert.equal(chapter.id,'distributed-output-bridges');assert.equal(chapter.domainId,'executable-software');
 assert.equal(chapter.read,'Follow the worked values and declared numerical contract. Software boxes denote dependencies and ownership, not physical layers or measured timing.');
 const snapshot={record,chapter:{id:chapter.id,domainId:chapter.domainId,read:chapter.read},formalEquations:current.equations[r.lessonId]};
 const fingerprint=sha(stable(snapshot));assert.equal(fingerprint,current.fingerprint(record));
 const snapshotName=r.lessonId+'-integrated-snapshot.json';save(snapshotName,snapshot);
 const refs=lessonReferences(record,current.claims,current.ledgerSources);
 assert.deepEqual(refs.map(s=>s.url).sort(),r.sourceReferences.map(s=>s.url).sort(),'Complete lesson URL coverage');
 assert.deepEqual(claims.map(c=>c.id).sort(),[...r.claimIds].sort());
 for(const key of ['unitsAndDenominators','modelAssumptions','claimQualifiers','dependencyAndVisualScope'])assert.equal(r.checks[key].status,'checked-by-agent');
 const sourceChecks=r.sourceReferences.map(ref=>{
  const s=evidence.sources.find(s=>s.id===ref.sourceId);assert.ok(s);assert.equal(s.url,ref.url);
  assert.equal(s.checkStatus,'primary-source-scope-checked');assert.equal(s.checkedOn,ref.checkedOn);
  assert.equal(ref.actor.actorId,checkedBy.identifier);assert.ok(s.lessonIds.includes(r.lessonId));
  return{sourceId:sourceId(ref.url),url:ref.url,checkedUrl:ref.checkedUrl,checkedOn:ref.checkedOn,checkedBy,access:'accessible',support:'supports-scoped-use',locators:[ref.locator],notes:s.scope+' Edition: '+s.version+'. This is the author’s recorded scoped reading; the integration recorder did not reopen the source.'};
 });
 events.push({id:'agent-source-scope-'+r.lessonId+'-integrated-'+asOf,lessonId:r.lessonId,type:'source-scope',contentFingerprint:fingerprint,contentSnapshotLocation:'docs/curation/distributed-output/'+snapshotName,reviewedSourceIds:refs.map(s=>s.sourceId),reviewedClaimIds:claims.map(c=>c.id),completedOn:asOf,reviewer:actor,outcome:'accepted',sourceChecks,claimChecks:claims.map(c=>({claimId:c.id,outcome:'supported-with-qualifiers',notes:r.checks.claimQualifiers.note+' Preserved claim limit: '+c.limitations})),checks:Object.fromEntries(Object.keys(r.checks).map(k=>[k,'pass'])),notes:'Integration acceptance retains the author’s completed source and mathematical checks from the preserved source-review manifest. The source checker was '+checkedBy.identifier+'; '+actor.identifier+' compared every integrated field and equation, assessed the explicit lab-link limits and independently reproduced the four worked examples. Only labId/labScope/deepLabId/scope mapping fields differ from the candidate. No source was reopened by the integration recorder, and no human specialist, device, classroom, real distributed execution or language-model performance review is inferred.',inheritedReviewEvidence:{path:'docs/curation/distributed-output/author-source-review-manifest.json',sha256:sha(raw),lessonId:r.lessonId,authorSnapshotSha256:r.snapshotSha256},integrationAssessment:{actor,assessedOn:asOf,changedFields:mappingChanges.map(c=>c.field),finding:'Lab navigation and calculator bounds are explicit; the authored scientific content, equations, structured claims and prerequisites are unchanged.'}});
 changes.push({lessonId:r.lessonId,contentFingerprint:fingerprint,mappingChanges,authorChecks:r.checks});
}
assert.equal(events.length,4);
const logPath=path.join(repo,'docs/curation/curation-review-events.json'),log=readJSON(logPath);
const prior=readJSON(path.join(repo,'docs/curation/history/before-distributed-output-curation-review-events.json'));
assert.deepEqual(log.events.slice(0,prior.events.length),prior.events,'Prior review events remain unchanged');
const next=structuredClone(log);for(const e of events){const old=next.events.find(x=>x.id===e.id);if(old)assert.deepEqual(old,e,'Existing accepted event is immutable');else next.events.push(e);}
validateEvents(readJSON(path.join(repo,'docs/curation/curation-manifest.json')),next,asOf);
const copyPath=path.join(here,'author-source-review-manifest.json');if(fs.existsSync(copyPath))assert.equal(fs.readFileSync(copyPath,'utf8'),raw);else fs.writeFileSync(copyPath,raw);
save('integrated-source-review-events.json',{schemaVersion:1,events});
save('integration-review.json',{schemaVersion:1,asOf,actor,sourceCheckActor:checkedBy,status:'pass',lessons:4,sourceUses:7,exactUrls:6,claims:4,liveSourceChecksByIntegrationRecorder:0,humanSpecialistReviews:0,sourceEvidence:{path:evidencePath,sha256:sha(raw)},changes,independentArithmetic:{matrixOutput:[[19,22],[43,50]],bytesPerRankAcrossTwoPhases:16,totalSentBytes:32,globalMeanGradient:2.5,sgdParameter:9.75,unweightedRankMeanGradient:2,unweightedSgdParameter:9.8,binary32Left:0,binary32Right:1,exactRealSum:1,correctedTargetDistribution:[0.6,0.3,0.1],expectedOutputTokensPerRound:1.96,scenarioOutputTokensPerSecond:1.96/0.009,slowerVerificationTokensPerSecond:1.96/0.015},limitations:['This preserves scoped author source readings and local authored arithmetic, not a new live source review.','Lab continuation links do not create new implemented distributed or language-model execution.','No human specialist or learner observations are asserted.']});
fs.writeFileSync(logPath,JSON.stringify(next,null,2)+'\n');
console.log(JSON.stringify({status:'pass',eventsAppended:next.events.length-log.events.length,preservedEarlierEvents:prior.events.length,integratedLessons:changes.map(c=>({id:c.lessonId,fingerprint:c.contentFingerprint,changedMappingFields:c.mappingChanges.map(x=>x.field)}))},null,2));
