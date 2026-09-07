import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parseReliabilityRecord, buildFifoTrace, buildEccRecovery} from '../../src/lib/hardware-reliability.ts';
const directory=path.dirname(fileURLToPath(import.meta.url));
const pack=JSON.parse(fs.readFileSync(path.join(directory,'scenarios.json'),'utf8'));
for(const s of pack.scenarios){
 const record=parseReliabilityRecord(JSON.stringify(s.record));
 const fifo=buildFifoTrace(record.fifo),ecc=buildEccRecovery(record.ecc);
 assert.deepEqual({fifo:{status:fifo.status,totals:fifo.totals,violation:fifo.violation,lastEventTick:fifo.events.at(-1).time,eventCount:fifo.events.length},ecc:{encoded:ecc.encoded,received:ecc.received,decoded:ecc.decoded,withinGuarantee:ecc.withinGuarantee,fixtureTruthMatches:ecc.fixtureTruthMatches,status:ecc.status,finalSum:ecc.finalSum,referenceSum:ecc.referenceSum,totals:ecc.totals,eventCount:ecc.events.length}},s.expected,s.id);
}
const review=JSON.parse(fs.readFileSync(path.join(directory,'source-review.json'),'utf8'));
for(const entry of review.candidateFiles)assert.equal(createHash('sha256').update(fs.readFileSync(path.resolve(directory,'../..',entry.path))).digest('hex'),entry.sha256,entry.path);
for(const match of fs.readFileSync(path.join(directory,'README.md'),'utf8').matchAll(/\]\(([^)]+)\)/g))if(!/^https?:/.test(match[1]))assert.ok(fs.existsSync(path.resolve(directory,match[1].split('#')[0])),match[1]);
console.log(`${pack.scenarios.length} complete fixtures, ${review.candidateFiles.length} candidate hashes and README local links verified.`);
