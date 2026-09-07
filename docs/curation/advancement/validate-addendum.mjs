import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {readJSON,sha,stable,validateAddendum} from './curation-advancement-common.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const offline=process.argv.includes('--offline');
const repo=offline?null:path.resolve(process.argv[2]||process.cwd());
const asOf=process.argv[3]||'2026-09-07';
const d=readJSON(path.join(here,'engineering-curation-addendum.json'));
const report=validateAddendum(d,asOf);report.asOf=asOf;report.validationActor={kind:'agent',role:'Automated structural and snapshot validation, not source reading'};report.snapshotChecks={mode:offline?'not-run':'current-repository',changedFiles:[],changedLessons:[],missingFiles:[]};report.warnings=[];
if(repo){
 const {loadCurrent}=await import(pathToFileURL(path.join(repo,'docs/curation/curation-common.mjs')));const current=loadCurrent(repo);
 const seen=new Set();
 for(const e of d.experiences){
  for(const f of [...e.model.files,...e.sourceUses.filter(u=>u.status==='current').map(u=>u.sourceRecord)]){if(seen.has(f.path))continue;seen.add(f.path);const p=path.join(repo,f.path);if(!fs.existsSync(p)){report.snapshotChecks.missingFiles.push(f.path);continue;}if(sha(fs.readFileSync(p))!==f.sha256)report.snapshotChecks.changedFiles.push(f.path);}
  const b=e.model.versionBinding,p=path.join(repo,b.path);if(fs.existsSync(p)){if(b.literal&&!fs.readFileSync(p,'utf8').includes(b.literal))report.errors.push(e.id+': model version binding changed');if(b.jsonPointer){const actual=b.jsonPointer.slice(1).split('/').reduce((a,k)=>a[k],readJSON(p));if(actual!==b.value)report.errors.push(e.id+': model version value changed');}}
  for(const l of e.lessonLinks){const r=current.atlas.byId[l.id];if(!r||current.fingerprint(r)!==l.contentFingerprint)report.snapshotChecks.changedLessons.push(`${e.id}/${l.id}`);}
 }
 for(const p of [d.preserves.baselineManifest,d.preserves.baselineEvents])if(sha(fs.readFileSync(path.join(repo,p.path)))!==p.sha256)report.warnings.push(`${p.path}: baseline has advanced since inventory. This addendum preserves its captured identity and does not overwrite it.`);
 if(report.snapshotChecks.changedFiles.length||report.snapshotChecks.changedLessons.length||report.snapshotChecks.missingFiles.length)report.errors.push('Integrated content differs from the captured snapshot; recheck changed scope before updating fingerprints.');
}
report.passed=report.errors.length===0;report.limit='This validates metadata, scope identities, explicit pending states and file/lesson drift. It fetches no URLs and records no new source, specialist or learner review.';
fs.writeFileSync(path.join(here,'validation-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,counts:report.counts,errors:report.errors,warnings:report.warnings,snapshotChecks:report.snapshotChecks},null,2));if(!report.passed)process.exitCode=1;
