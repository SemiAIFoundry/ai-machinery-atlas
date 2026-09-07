import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildFactoryExecution,readFactoryWorkspace,factoryModels} from '../../src/lib/factory-execution.ts';
const directory=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(directory,'../..'),pack=JSON.parse(fs.readFileSync(path.join(directory,'scenarios.json'),'utf8'));
assert.deepEqual(pack.models,factoryModels,'Dependency model identities changed; inspect and regenerate the worked fixtures.');
for(const s of pack.scenarios){const before=readFactoryWorkspace(JSON.stringify(s.before)),r=buildFactoryExecution(before.input,before.sourceCheckpoint);assert.deepEqual({status:r.status,reason:r.reason,final:r.final,acceptedArtifact:r.status==='complete'?r.finalRun:null,durableArtifact:r.durableRun,equivalence:r.equivalence,checkpoints:r.checkpoints.map(({raw,...meta})=>meta),abortedCheckpoints:r.abortedCheckpoints},s.after,s.id);}
const review=JSON.parse(fs.readFileSync(path.join(directory,'source-review.json'),'utf8'));for(const e of review.candidateFiles)assert.equal(createHash('sha256').update(fs.readFileSync(path.resolve(root,e.path))).digest('hex'),e.sha256,e.path);
for(const m of fs.readFileSync(path.join(directory,'README.md'),'utf8').matchAll(/\]\(([^)]+)\)/g))if(!/^https?:/.test(m[1]))assert.ok(fs.existsSync(path.resolve(directory,m[1].split('#')[0])),m[1]);
const ids=new Set(JSON.parse(fs.readFileSync(path.join(root,'src/lib/data/records.json'),'utf8')).map(x=>x.id));for(const file of ['hardware-runtime-learning.json','distributed-output-bridges.json'])for(const lesson of JSON.parse(fs.readFileSync(path.join(root,'src/lib/data',file),'utf8')).lessons)ids.add(lesson.id);
for(const id of ['checkpoint','rack','iommu-buffer-identity','distributed-gradient-weighting','cdu'])assert.ok(ids.has(id),id);
console.log(`${pack.scenarios.length} complete factory workspaces, ${review.candidateFiles.length} source hashes and portable links/lesson anchors verified.`);
