import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {loadCurrent,readJSON,sha,stable} from '../curation-common.mjs';
import {validateEvents} from '../curation-freshness.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(process.argv[2]||process.cwd());
const report=readJSON(path.join(here,'integration-review.json'));
const evidenceRaw=fs.readFileSync(path.join(here,'author-source-review-manifest.json'),'utf8'),evidence=JSON.parse(evidenceRaw);
assert.equal(sha(evidenceRaw),report.sourceEvidence.sha256,'Preserved source evidence');
const current=loadCurrent(repo),events=readJSON(path.join(here,'integrated-source-review-events.json'));
const completeLog=readJSON(path.join(repo,'docs/curation/curation-review-events.json'));
const prior=readJSON(path.join(repo,'docs/curation/history/before-distributed-output-curation-review-events.json'));
assert.deepEqual(completeLog.events.slice(0,prior.events.length),prior.events,'Earlier events remain unaltered');
validateEvents(readJSON(path.join(repo,'docs/curation/curation-manifest.json')),events,report.asOf);
assert.equal(events.events.length,4);let sourceUses=0;
for(const event of events.events){
 const snapshot=readJSON(path.join(repo,event.contentSnapshotLocation));
 assert.equal(sha(stable(snapshot)),event.contentFingerprint,'Stored effective snapshot');
 assert.equal(current.fingerprint(current.atlas.byId[event.lessonId]),event.contentFingerprint,'Current lesson or equations changed; new assessment required');
 assert.deepEqual(completeLog.events.find(e=>e.id===event.id),event,'Published event matches preserved event');
 const candidate=evidence.reviewDispositions.lessons.find(r=>r.lessonId===event.lessonId);
 assert.equal(sha(JSON.stringify(candidate.contentSnapshot)),candidate.snapshotSha256,'Candidate source/math snapshot');
 assert.deepEqual(current.equations[event.lessonId],candidate.contentSnapshot.equations);
 assert.deepEqual(current.claims.filter(c=>c.lessonIds.includes(event.lessonId)),candidate.contentSnapshot.claims);
 for(const check of event.sourceChecks){assert.equal(check.checkedBy.identifier,'/root/curriculum_assessment');assert.equal(check.checkedOn,report.asOf);sourceUses++;}
}
// A separate arithmetic path checks the recorded small examples without importing their tests.
const A=[[1,2],[3,4]],B=[[5,6],[7,8]],C=A.map(row=>B[0].map((_,j)=>row.reduce((sum,a,k)=>sum+a*B[k][j],0)));
assert.deepEqual(C,report.independentArithmetic.matrixOutput);
const g=(2*1+6*3)/8;assert.equal(g,report.independentArithmetic.globalMeanGradient);assert.equal(10-.1*g,report.independentArithmetic.sgdParameter);
const a=2**24,b=1,c=-a;assert.equal(Math.fround(Math.fround(a+b)+c),report.independentArithmetic.binary32Left);assert.equal(Math.fround(a+Math.fround(b+c)),report.independentArithmetic.binary32Right);
const p=[.6,.3,.1],q=[.2,.3,.5],accepted=p.map((v,i)=>Math.min(v,q[i])),alpha=accepted.reduce((s,v)=>s+v,0),residual=p.map((v,i)=>Math.max(0,v-q[i])),residualSum=residual.reduce((s,v)=>s+v,0);
for(let i=0;i<p.length;i++)assert.ok(Math.abs(accepted[i]+(1-alpha)*residual[i]/residualSum-p[i])<1e-14);
const expected=(1-alpha)+2*alpha*(1-alpha)+3*alpha**2;assert.equal(expected,report.independentArithmetic.expectedOutputTokensPerRound);assert.equal(expected/.009,report.independentArithmetic.scenarioOutputTokensPerSecond);assert.equal(expected/.015,report.independentArithmetic.slowerVerificationTokensPerSecond);
assert.equal(sourceUses,7);assert.equal(new Set(events.events.flatMap(e=>e.sourceChecks.map(s=>s.url))).size,6);
console.log(JSON.stringify({status:'pass',integratedLessons:4,effectiveSnapshots:4,authorPrimarySourceUses:sourceUses,exactSourceUrls:6,claimScopes:4,priorEventsPreserved:prior.events.length,independentArithmetic:'pass',humanSpecialistReviews:0},null,2));
