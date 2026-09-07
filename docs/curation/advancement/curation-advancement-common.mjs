import fs from 'node:fs';
import crypto from 'node:crypto';
export const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
export const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export const sourceId=url=>'url-'+sha(url).slice(0,20);
export const readJSON=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const scopeFingerprint=s=>sha(stable({sourceId:s.sourceId,locators:s.locators,statement:s.statement,exclusions:s.exclusions}));
export const contentFingerprint=e=>sha(stable({id:e.id,model:e.model,lessonLinks:e.lessonLinks,scope:e.scope,assumptions:e.assumptions,sourceUses:e.sourceUses.map(({check,...rest})=>rest)}));
export function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
export function addDays(s,n){const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function useState(use,asOf){
 if(use.check.status==='check-not-recorded')return{status:'source-check-required',checkedOn:null,dueOn:null,actor:null};
 if(use.check.scopeFingerprint!==scopeFingerprint(use))return{status:'source-use-changed-since-check',checkedOn:use.check.checkedOn,dueOn:null,actor:use.check.actor};
 const dueOn=addDays(use.check.checkedOn,use.proposedReviewIntervalDays);
 return{status:asOf>=dueOn?'proposed-review-due':'agent-check-recorded-within-proposed-interval',checkedOn:use.check.checkedOn,dueOn,actor:use.check.actor};
}
export function validateAddendum(d,asOf){
 const errors=[],check=(ok,msg)=>{if(!ok)errors.push(msg);};
 check(validDate(asOf),'asOf must be a real ISO calendar date');
 check(d.schemaVersion===1&&d.kind==='atlas-engineering-curation-addendum','Unexpected addendum schema/kind');
 check(validDate(d.inventoryAsOf)&&d.inventoryAsOf<=asOf,'Inventory date must not be future');
 check(d.maintenanceOwner==='Semi AI Foundry, LLC','Maintenance owner must preserve project organization');
 check(d.recordedBy?.kind==='agent','Curation actor must identify AI authorship');
 const expected=['fabrication','memory','architecture','realization','hall','applications','orbital','progress'].sort();
 check(stable(d.experiences?.map(e=>e.id).sort())===stable(expected),'Exactly eight unique engineering experiences required');
 const sourceCatalog=d.sourceCatalog||{},uses=[];
 for(const [id,s]of Object.entries(sourceCatalog)){check(id===sourceId(s.url)&&s.id===id,`URL-derived source identity: ${id}`);check(/^https:\/\//.test(s.url),`Primary source URL: ${id}`);}
 const claimIds=new Set();
 for(const e of d.experiences||[]){
  check(e.model?.version&&e.model.files?.length>0,`${e.id}: model identity required`);
  check(e.scope?.length>80&&e.assumptions?.length>=3,`${e.id}: explicit scope/assumptions required`);
  check(e.maintenance?.owner==='Semi AI Foundry, LLC',`${e.id}: organizational ownership`);
  check(e.maintenance?.modelAuthor?.kind==='agent'&&e.maintenance.curationRecorder?.kind==='agent',`${e.id}: explicit AI author roles`);
  check(e.maintenance?.assignedHumanReviewer===null&&e.maintenance.specialistReview===null&&e.maintenance.humanLearnerReview===null,`${e.id}: no unsupported human review or assignment`);
  check(e.maintenance?.proposedSpecialistRole?.length>10,`${e.id}: proposed technical role required`);
  check(e.contentFingerprint===contentFingerprint(e),`${e.id}: content fingerprint mismatch`);
  check(e.lessonLinks?.length>0,`${e.id}: lesson links missing`);
  check(new Set(e.lessonLinks?.map(l=>l.id)).size===e.lessonLinks?.length,`${e.id}: duplicate lesson link`);
  for(const l of e.lessonLinks||[]){check(l.navigation===`#${l.id}~v=1&studio=${e.id}`,`${e.id}/${l.id}: navigation mismatch`);check(/^[a-f0-9]{64}$/.test(l.contentFingerprint),`${e.id}/${l.id}: lesson fingerprint missing`);}
  for(const f of e.model.files){check(!f.path.startsWith('/')&&!f.path.split('/').includes('..'),`${e.id}: nonportable model path`);check(/^[a-f0-9]{64}$/.test(f.sha256)&&Number.isInteger(f.bytes),`${e.id}: invalid model file identity`);}
  const groups=new Map();
  for(const s of e.sourceUses||[]){if(!groups.has(s.sourceLocalId))groups.set(s.sourceLocalId,[]);groups.get(s.sourceLocalId).push(s);}
  for(const [localId,revisions]of groups){check(revisions.filter(s=>s.status==='current').length===1,`${e.id}/${localId}: exactly one current revision required`);}
  for(const s of e.sourceUses||[]){
   uses.push({...s,experienceId:e.id});check(!claimIds.has(s.id),`Duplicate source-use ID ${s.id}`);claimIds.add(s.id);
   check(sourceCatalog[s.sourceId],`${s.id}: missing source`);check(sourceCatalog[s.sourceId]?.experienceIds.includes(e.id),`${s.id}: source reverse index`);
   check(['current','superseded'].includes(s.status),`${s.id}: invalid source-use revision state`);
   if(s.supersedesClaimId){const previous=e.sourceUses.find(x=>x.id===s.supersedesClaimId);check(previous?.supersededByClaimId===s.id,`${s.id}: missing reciprocal predecessor`);check(previous?.revision+1===s.revision,`${s.id}: revision must advance by one`);}
   if(s.supersededByClaimId)check(s.status==='superseded'&&e.sourceUses.find(x=>x.id===s.supersededByClaimId)?.supersedesClaimId===s.id,`${s.id}: missing reciprocal successor`);
   if(s.status==='superseded')check(s.supersededByClaimId!==null,`${s.id}: superseded source use needs a successor`);
   check(s.locators?.length>0&&s.locators.every(x=>typeof x==='string'&&x.length>5),`${s.id}: exact or explicitly pending locator required`);
   check(s.statement?.length>20&&s.exclusions?.length>30,`${s.id}: scoped claim and exclusions required`);
   check(s.sourceRecord?.path&&/^[a-f0-9]{64}$/.test(s.sourceRecord.sha256)&&s.sourceRecord.locator,`${s.id}: evidence provenance required`);
   check(s.proposedReviewIntervalDays===d.proposedPolicies[s.sensitivity]?.days,`${s.id}: policy mismatch`);
   check(s.sourceReviewTriggers?.length>0&&s.proposedReviewerRole,`${s.id}: review trigger/role missing`);
   if(s.check?.status==='check-not-recorded'){
    check(s.check.checkedOn===null&&s.check.actor===null&&s.check.scopeFingerprint===null&&s.check.support==='not-assessed',`${s.id}: pending evidence cannot contain completed check metadata`);
   }else if(s.check?.status==='recorded-agent-check'){
    check(validDate(s.check.checkedOn)&&s.check.checkedOn<=asOf,`${s.id}: impossible or future source check`);
    check(s.check.actor?.kind==='agent'&&s.check.actor.role?.length>10,`${s.id}: honest actor type/role required`);
    check(s.check.support==='supports-scoped-use'&&s.check.basis?.length>25,`${s.id}: support and provenance basis required`);
    check(s.check.scopeFingerprint===scopeFingerprint(s),`${s.id}: check does not cover this source-use fingerprint`);
    check(!s.locators.some(x=>/check pending|locator pending|passage check pending/.test(x)),`${s.id}: accepted source check has pending locator`);
   }else check(false,`${s.id}: unknown check state`);
  }
 }
 for(const [id,s]of Object.entries(sourceCatalog)){
  const actual=[...new Set(uses.filter(u=>u.sourceId===id).map(u=>u.experienceId))].sort();check(stable(actual)===stable([...s.experienceIds].sort()),`${id}: reverse index differs from actual uses`);
 }
 return{errors,counts:{experiences:d.experiences?.length||0,sourceUrls:Object.keys(sourceCatalog).length,sourceUses:uses.length,recordedAgentChecks:uses.filter(u=>u.check.status==='recorded-agent-check').length,checksNotRecorded:uses.filter(u=>u.check.status==='check-not-recorded').length},queue:uses.filter(u=>u.status==='current').map(u=>({experienceId:u.experienceId,sourceUseId:u.id,sourceId:u.sourceId,...useState(u,asOf),proposedRole:u.proposedReviewerRole}))};
}
/** Fixtures use the same fingerprint/date rules but are never current review events. */
export function validateExerciseDocument(d,asOf){
 const errors=[],check=(ok,msg)=>{if(!ok)errors.push(msg);};
 check(d.fixture===true&&d.kind==='isolated-supersession-exercise','Only explicitly isolated fixture documents are allowed');
 const ids=new Map((d.claims||[]).map(c=>[c.id,c]));
 check(ids.size===d.claims?.length,'Duplicate exercise claim IDs');
 for(const c of d.claims||[]){
  if(c.supersedesClaimId)check(ids.get(c.supersedesClaimId)?.supersededByClaimId===c.id,`${c.id}: missing reciprocal predecessor`);
  if(c.supersededByClaimId){check(c.status==='superseded',`${c.id}: superseded predecessor stays current`);check(ids.get(c.supersededByClaimId)?.supersedesClaimId===c.id,`${c.id}: missing reciprocal successor`);}
  check(c.fingerprint===scopeFingerprint(c),`${c.id}: fixture claim fingerprint mismatch`);
 }
 for(const e of d.events||[]){
  check(e.fixture===true,`${e.id}: synthetic event requires fixture flag`);
  check(e.actor?.kind==='agent'&&e.actor?.identifier==='fixture-ai-reviewer',`${e.id}: simulated actor must not impersonate a human`);
  check(validDate(e.checkedOn)&&validDate(e.completedOn)&&e.checkedOn<=e.completedOn&&e.completedOn<=asOf,`${e.id}: invalid event dates`);
  check(ids.has(e.claimId),`${e.id}: missing claim`);check(e.scopeFingerprint===ids.get(e.claimId)?.fingerprint,`${e.id}: event scope mismatch`);
 }
 const queue=(d.claims||[]).filter(c=>c.status==='current').map(c=>{const last=(d.events||[]).filter(e=>e.claimId===c.id&&e.scopeFingerprint===c.fingerprint).at(-1);return{claimId:c.id,status:!last?'recheck-required':last.outcome==='accepted'?'agent-recheck-recorded':'changes-required',checkedOn:last?.checkedOn??null};});
 return{errors,queue};
}
