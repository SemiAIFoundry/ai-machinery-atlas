import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {evaluateMappedAdder} from '../src/lib/realization.ts';
const artifact=JSON.parse(fs.readFileSync(new URL('../public/realization-data/adder.json',import.meta.url),'utf8'));
test('all 256 input pairs traverse the actual exported LUT/register graph with a preserved carry',()=>{
 for(let a=0;a<16;a++)for(let b=0;b<16;b++){
  const r=evaluateMappedAdder(artifact.mapped,a,b);assert.equal(r.frames[0].output,0);assert.equal(r.frames[1].output,0);assert.equal(r.output,a+b);
 }
 const mutant=structuredClone(artifact.mapped);mutant.cells.find(c=>c.type==='SB_LUT4').parameters.LUT_INIT='0000000000000000';
 assert.ok(Array.from({length:256},(_,n)=>evaluateMappedAdder(mutant,n>>4,n&15).output!==((n>>4)+(n&15))).some(Boolean));
});
test('viewer extraction is tied to actual formal, simulation, placement, route and bitstream artifacts',()=>{
 for(const f of artifact.files){const bytes=fs.readFileSync(new URL('../examples/realization/'+f.path,import.meta.url));assert.equal(bytes.length,f.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256);}
 assert.equal(artifact.proof.passed,true);assert.equal(artifact.simulation.inputPairs,256);
 const routed=JSON.parse(fs.readFileSync(new URL('../examples/realization/artifacts/routed.json',import.meta.url),'utf8')).modules.top;
 for(const c of artifact.cells)assert.equal(c.bel,routed.cells[c.name].attributes.NEXTPNR_BEL);
 assert.equal(new Set(artifact.cells.map(c=>c.bel)).size,artifact.cells.length);
 for(const net of artifact.nets)assert.equal(net.route,routed.netnames[net.name].attributes.ROUTING.trim());
 const clock=Object.values(artifact.timing.fmax)[0];assert.equal(clock.constraint,100);assert.ok(clock.achieved>=clock.constraint);
});
