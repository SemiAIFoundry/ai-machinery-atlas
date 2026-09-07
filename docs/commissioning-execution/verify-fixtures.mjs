import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildCommissioningTrace} from '../../src/lib/commissioning-execution.ts';
import {parseCommissioningRecord} from '../../src/lib/commissioning-execution-record.ts';
const directory=path.dirname(fileURLToPath(import.meta.url));
const pack=JSON.parse(fs.readFileSync(path.join(directory,'scenarios.json'),'utf8'));
for(const s of pack.scenarios){const record=parseCommissioningRecord(JSON.stringify(s.record)),r=buildCommissioningTrace(record.input);assert.deepEqual({status:r.status,reference:r.reference,finalOutput:r.finalOutput,totals:r.totals,eventCount:r.events.length,issues:r.events.filter(e=>e.issue).map(e=>({kind:e.kind,index:e.index,epoch:e.state.epoch}))},s.expected,s.id);}
const review=JSON.parse(fs.readFileSync(path.join(directory,'source-review.json'),'utf8'));
for(const entry of review.candidateFiles)assert.equal(createHash('sha256').update(fs.readFileSync(path.resolve(directory,'../..',entry.path))).digest('hex'),entry.sha256,entry.path);
for(const match of fs.readFileSync(path.join(directory,'README.md'),'utf8').matchAll(/\]\(([^)]+)\)/g))if(!/^https?:/.test(match[1]))assert.ok(fs.existsSync(path.resolve(directory,match[1].split('#')[0])),match[1]);
console.log(`${pack.scenarios.length} complete fixtures, ${review.candidateFiles.length} hashes and portable local links verified.`);
