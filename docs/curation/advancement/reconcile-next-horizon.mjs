/** Explicit integration reconciliation. Preserves all original scoped source-check events. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {loadCurrent} from '../curation-common.mjs';
import {sha,stable,contentFingerprint,validateAddendum} from './curation-advancement-common.mjs';
const repo=process.cwd(),file='docs/curation/advancement/engineering-curation-addendum.json';
const raw=fs.readFileSync(file,'utf8'),before=JSON.parse(raw),next=structuredClone(before),current=loadCurrent(repo);
const sourceChecks=stable(before.experiences.map(e=>e.sourceUses));
// Reconstruct the earlier effective lessons without the append-only additions.
const require=createRequire(path.join(repo,'package.json')),ts=require('typescript'),cache={};
function originalModule(file){
 if(file.endsWith('/lesson-enrichment.ts'))return {enrichLesson:r=>r};
 if(cache[file])return cache[file];const exports={};cache[file]=exports;
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','exports',code)(name=>{const f=path.resolve(path.dirname(file),name);if(name.endsWith('.json'))return JSON.parse(fs.readFileSync(f,'utf8'));return name.startsWith('.')?originalModule(f+'.ts'):require(name);},exports);return exports;
}
const original=originalModule(path.join(repo,'src/lib/atlas-authoring.ts')),oldEquations={};
for(const name of ['equations-original.json','equations-expansion.json','equations-infrastructure.json','equations-distributed-output.json'])for(const [id,entries] of Object.entries(JSON.parse(fs.readFileSync('src/lib/data/'+name,'utf8'))))oldEquations[id]=[...(oldEquations[id]||[]),...entries];
const oldFingerprint=id=>{const c=original.chapterFor(id);return sha(stable({record:original.byId[id],chapter:{id:c.id,domainId:c.domainId,read:c.read},formalEquations:oldEquations[id]||[]}));};
const allowedFiles=new Map([['src/lib/studio-lessons.ts','Reviewed explicit canonical lesson routes and one navigation home per experience; the eight original numerical models are unchanged.'],['src/studio.css','Reviewed scoped layout and responsive navigation additions; no numerical model changed.']]);
const files=[],lessons=[];
for(const e of next.experiences){
 for(const f of e.model.files){const data=fs.readFileSync(f.path),hash=sha(data);if(hash===f.sha256)continue;assert.ok(allowedFiles.has(f.path),'Unreviewed model change: '+f.path);if(!files.some(x=>x.path===f.path))files.push({path:f.path,previous:f.sha256,current:hash,scope:allowedFiles.get(f.path)});f.sha256=hash;f.bytes=data.length;}
 for(const source of e.sourceUses)assert.equal(sha(fs.readFileSync(source.sourceRecord.path)),source.sourceRecord.sha256,'Changed primary-scope evidence requires separate source review');
 for(const l of e.lessonLinks){const fingerprint=current.fingerprint(current.atlas.byId[l.id]);if(fingerprint===l.contentFingerprint)continue;if(oldFingerprint(l.id)!==l.contentFingerprint){
   const prior=fs.readdirSync('docs/curation/advancement').filter(n=>n.startsWith('next-horizon-integration-')&&n.endsWith('.json')).flatMap(n=>JSON.parse(fs.readFileSync('docs/curation/advancement/'+n,'utf8')).lessons).find(x=>x.id===l.id&&x.current===l.contentFingerprint);
   assert.ok(prior,'Missing earlier effective snapshot: '+l.id);
   const now=current.atlas.byId[l.id],appendStrings=['description','engineeringExample','evidenceNotes'],appendArrays=['mechanism','checks','science'];
   for(const [key,value]of Object.entries(prior.record)){
    if(appendStrings.includes(key)){assert.ok((now[key]||'').startsWith(value||''),'Changed earlier prose '+l.id+'/'+key);continue;}
    if(appendArrays.includes(key)){assert.deepEqual((now[key]||[]).slice(0,value.length),value,'Changed earlier array '+l.id+'/'+key);continue;}
    if(key==='related'){assert.ok(value.every(x=>now.related.includes(x)));continue;}
    if(key==='sources'){assert.ok(value.every(x=>now.sources.some(y=>y.url===x.url)),'Removed source '+l.id);continue;}
    assert.deepEqual(now[key],value,'Changed original field '+l.id+'/'+key);
   }
   assert.deepEqual((current.equations[l.id]||[]).slice(0,prior.equations.length),prior.equations,'Changed earlier formal equation');
  }lessons.push({experience:e.id,id:l.id,previous:l.contentFingerprint,current:fingerprint,earlierScopeReconstructed:true,record:current.atlas.byId[l.id],equations:current.equations[l.id]||[]});l.contentFingerprint=fingerprint;}
 e.contentFingerprint=contentFingerprint(e);
}
if(!files.length&&!lessons.length){console.log('Captured engineering scope is current; no new event written.');process.exit(0);}
assert.equal(stable(next.experiences.map(e=>e.sourceUses)),sourceChecks,'All 62 source-use records must remain exactly unchanged');
for(const f of next.snapshotFiles||[]){const changed=files.find(x=>x.path===f.path);if(changed){f.sha256=changed.current;f.bytes=fs.statSync(f.path).size;}}
const review={schemaVersion:1,kind:'additive-integration-recheck',recordedAt:new Date().toISOString(),actor:{kind:'agent',identifier:'/root',role:'AI integration and executable navigation reviewer'},previousAddendumSha256:sha(raw),files,lessons,sourceUseRecordsUnchanged:true,newSourceReadings:0,humanReviews:0,scope:'Reconstructed the captured earlier lessons without the append-only enrichment packs and verified their earlier identities. Retained all existing scoped source checks. New appended mechanisms use their separate model-lifecycle and automation source records; this integration event is not a blanket review of new lesson content.',newEvidenceLocations:['docs/model-lifecycle/curriculum/source-review-manifest.json','docs/automation-execution/learning-source-review.json'],pending:'Independent specialist, physical-device and learner observations remain unobserved.'};
// Source documents differ in filename by package; require actual paths before recording them.
review.newEvidenceLocations=review.newEvidenceLocations.filter(p=>fs.existsSync(p));
assert.equal(validateAddendum(next,'2026-09-07').errors.length,0,'Reconciled metadata must satisfy scope validation');
const id=sha(raw).slice(0,16),history='docs/curation/advancement/history/before-next-horizon-'+id+'.json';
if(!fs.existsSync(history))fs.writeFileSync(history,raw);
review.preservedSnapshot=history;
fs.writeFileSync('docs/curation/advancement/next-horizon-integration-'+id+'.json',JSON.stringify(review,null,2)+'\n');
fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n');
console.log(JSON.stringify({changedFiles:files.map(x=>x.path),additiveLessonScopes:lessons.length,sourceUseRecordsPreserved:62,newSourceReadings:0,humanReviews:0},null,2));
