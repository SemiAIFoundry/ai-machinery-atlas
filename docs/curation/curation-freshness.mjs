import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readJSON,unique,count,sourceId} from './curation-common.mjs';
const DAY=86400000;
export function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const value=new Date(s+'T00:00:00Z');return Number.isFinite(value.getTime())&&value.toISOString().slice(0,10)===s;}
export const addDays=(s,days)=>new Date(Date.parse(s+'T00:00:00Z')+days*DAY).toISOString().slice(0,10);
const age=(earlier,later)=>Math.floor((Date.parse(later+'T00:00:00Z')-Date.parse(earlier+'T00:00:00Z'))/DAY);
export function validateEvents(manifest,data,asOf){
 assert.ok(validDate(asOf),'Explicit valid UTC as-of date required');assert.equal(data.schemaVersion,1);assert.ok(Array.isArray(data.events));const eventIds=new Set();
 for(const e of data.events){
  assert.ok(typeof e.id==='string'&&e.id.trim()&&!eventIds.has(e.id),'Unique nonempty event ID');eventIds.add(e.id);
  const l=manifest.lessons[e.lessonId];assert.ok(l,'Known lesson ID '+e.lessonId);
  assert.ok(/^[a-f0-9]{64}$/.test(e.contentFingerprint),'Actual content fingerprint required');assert.ok(validDate(e.completedOn)&&e.completedOn<=asOf,'Completed review date must be valid and not in the future');
  assert.ok(['source-scope','specialist','pedagogy'].includes(e.type));assert.ok(['accepted','changes-required'].includes(e.outcome));
  assert.ok(['human','agent'].includes(e.reviewer?.kind));assert.ok(e.reviewer.identifier?.trim()&&e.reviewer.role?.trim(),'Actual reviewer identity and role required');
  if(e.type==='specialist')assert.equal(e.reviewer.kind,'human','Specialist review must be an actual declared human specialist review, never an inferred agent review');
  assert.ok(typeof e.notes==='string'&&e.notes.trim().length>=20,'Review notes required');assert.ok(Array.isArray(e.sourceChecks)&&Array.isArray(e.claimChecks));
  assert.ok(typeof e.contentSnapshotLocation==='string'&&e.contentSnapshotLocation.trim(),'Immutable reviewed content snapshot location required');
  assert.ok(Array.isArray(e.reviewedSourceIds)&&Array.isArray(e.reviewedClaimIds));assert.equal(unique(e.reviewedSourceIds).length,e.reviewedSourceIds.length);assert.equal(unique(e.reviewedClaimIds).length,e.reviewedClaimIds.length);
  const currentFingerprint=e.contentFingerprint===l.contentFingerprint;
  if(currentFingerprint){assert.deepEqual([...e.reviewedSourceIds].sort(),l.sourceReferences.map(s=>s.sourceId).sort(),'Current review scope lists all lesson sources');assert.deepEqual([...e.reviewedClaimIds].sort(),[...l.claimIds].sort(),'Current review scope lists all lesson claims');}
  const sources=new Set(),claims=new Set();
  for(const s of e.sourceChecks){
   assert.equal(s.sourceId,sourceId(s.url),'Source check retains the exact reviewed URL');assert.ok(['https:','http:'].includes(new URL(s.url).protocol));assert.ok(e.reviewedSourceIds.includes(s.sourceId),'Source must belong to the reviewed snapshot');assert.ok(!sources.has(s.sourceId),'No duplicate source check');sources.add(s.sourceId);
   assert.ok(validDate(s.checkedOn)&&s.checkedOn<=e.completedOn,'Record an actual source check date no later than review completion');
   assert.ok(['accessible','unavailable'].includes(s.access));assert.ok(['supports-scoped-use','partial-support','does-not-support','not-assessed'].includes(s.support));
   assert.ok(typeof s.notes==='string'&&s.notes.trim());assert.ok(Array.isArray(s.locators));
   if(s.support==='supports-scoped-use'){assert.equal(s.access,'accessible');assert.ok(s.locators.length>0&&s.locators.every(x=>typeof x==='string'&&x.trim()),'Exact section/page/table/figure locator required');}
  }
  for(const c of e.claimChecks){assert.ok(e.reviewedClaimIds.includes(c.claimId),'Claim must belong to reviewed snapshot');assert.ok(!claims.has(c.claimId),'No duplicate claim check');claims.add(c.claimId);assert.ok(['supported-with-qualifiers','needs-change','not-assessed'].includes(c.outcome));assert.ok(c.notes?.trim());}
  for(const k of ['unitsAndDenominators','modelAssumptions','claimQualifiers','dependencyAndVisualScope'])assert.ok(['pass','needs-change','not-applicable'].includes(e.checks?.[k]),'Explicit review check '+k);
  if(e.outcome==='accepted'){
   for(const v of Object.values(e.checks))assert.notEqual(v,'needs-change','An accepted review cannot retain a failed check');
   if(e.type==='source-scope'){
    assert.deepEqual([...sources].sort(),[...e.reviewedSourceIds].sort(),'A complete source review covers all references in its snapshot');assert.deepEqual([...claims].sort(),[...e.reviewedClaimIds].sort(),'A complete source review covers every structured claim in its snapshot');
    assert.ok(e.sourceChecks.every(s=>s.support==='supports-scoped-use'),'Acceptance requires source support for the stated scoped use');assert.ok(e.claimChecks.every(c=>c.outcome==='supported-with-qualifiers'),'Acceptance retains qualified claim support');
   }
  }
 }
 return true;
}
export function disposition(lesson,events,asOf){
 const latest=events.filter(e=>e.lessonId===lesson.id&&e.type==='source-scope').sort((a,b)=>b.completedOn.localeCompare(a.completedOn)||b.id.localeCompare(a.id))[0];
 if(!latest)return{status:'baseline-review-required',lastCompletedOn:null,dueOn:null,reviewEventId:null,reviewerKind:null,reason:'No complete source-scope review is recorded. Source freshness is unknown.'};
 if(latest.outcome!=='accepted')return{status:'changes-required',lastCompletedOn:latest.completedOn,dueOn:null,reviewEventId:latest.id,reviewerKind:latest.reviewer.kind,reason:'The latest recorded source-scope review requires changes.'};
 if(latest.contentFingerprint!==lesson.contentFingerprint)return{status:'content-changed-since-review',lastCompletedOn:latest.completedOn,dueOn:null,reviewEventId:latest.id,reviewerKind:latest.reviewer.kind,reason:'Current content differs from the reviewed snapshot; reassess the changed claims and affected lessons.'};
 const reviewAnchorOn=[latest.completedOn,...(latest.sourceChecks||[]).map(s=>s.checkedOn)].sort()[0];
 const dueOn=addDays(reviewAnchorOn,lesson.curation.proposedIntervalDays);
 return{status:asOf>=dueOn?'review-due':'within-proposed-review-interval',lastCompletedOn:latest.completedOn,reviewAnchorOn,dueOn,reviewEventId:latest.id,reviewerKind:latest.reviewer.kind,reason:asOf>=dueOn?'Proposed interval since the oldest source check in the accepted review has elapsed. This flags follow-up; it does not prove the source or lesson is wrong.':'The recorded source-scope review is within the proposed editorial interval as of the requested date; this is not a guarantee of correctness.'};
}
export function buildQueue(manifest,eventData,asOf){
 validateEvents(manifest,eventData,asOf);
 const rows=Object.values(manifest.lessons).map(l=>{
  const inheritedDates=unique(l.sourceReferences.flatMap(s=>manifest.sourceCatalog[s.sourceId].ledgerRecords.map(x=>x.inheritedCheckedOn)).filter(validDate)).sort();
  const sourceReview=disposition(l,eventData.events,asOf);
  return{lessonId:l.id,title:l.title,domainId:l.domainId,priority:l.curation.priority,proposedReviewRole:l.curation.proposedReviewRole.id,updateSensitivity:l.curation.updateSensitivity,proposedIntervalDays:l.curation.proposedIntervalDays,sourceReview,specialistReviewEventIds:eventData.events.filter(e=>e.lessonId===l.id&&e.type==='specialist'&&e.outcome==='accepted'&&e.contentFingerprint===l.contentFingerprint).map(e=>e.id),inheritedMetadata:{checkedOnDates:inheritedDates,ageDaysRange:inheritedDates.length?[age(inheritedDates.at(-1),asOf),age(inheritedDates[0],asOf)]:null,interpretation:'Age of copied checkedOn metadata only; no independent check date is inferred and this does not satisfy baseline review.'},claimIds:l.claimIds,sourceIds:l.sourceReferences.map(x=>x.sourceId),dependentLessonIds:l.links.dependentLessonIds,investigationIds:l.links.investigationIds};
 });
 const order={urgent:0,high:1,normal:2};rows.sort((a,b)=>order[a.priority]-order[b.priority]||a.proposedIntervalDays-b.proposedIntervalDays||a.lessonId.localeCompare(b.lessonId));
 return{schemaVersion:1,asOf,generatedAt:new Date().toISOString(),interpretation:'A planning queue. Baseline review required means no review is recorded, not that content is false, out of date, or peer reviewed. Inherited dates are triage metadata only.',summary:{lessons:rows.length,recordedReviewEvents:eventData.events.length,byPriority:count(rows.map(r=>r.priority)),bySourceReviewStatus:count(rows.map(r=>r.sourceReview.status)),specialistReviewEvents:eventData.events.filter(e=>e.type==='specialist').length},lessons:rows};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dir=path.dirname(fileURLToPath(import.meta.url)),asOf=process.argv[2];assert.ok(validDate(asOf),'Usage: node curation-freshness.mjs YYYY-MM-DD [manifest.json] [events.json] [output.json]');
 const manifest=readJSON(process.argv[3]||path.join(dir,'curation-manifest.json')),events=readJSON(process.argv[4]||path.join(dir,'curation-review-events.json'));
 const queue=buildQueue(manifest,events,asOf),output=process.argv[5]||path.join(dir,'curation-review-queue.json');fs.writeFileSync(output,JSON.stringify(queue,null,2)+'\n');console.log(JSON.stringify(queue.summary,null,2));
}
