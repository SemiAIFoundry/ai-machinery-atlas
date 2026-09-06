import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import katex from 'katex';
import {routeFor} from '../src/lib/processes.ts';
import {memoryProcessRoutes} from '../src/lib/memory-processes.ts';
const pack=JSON.parse(fs.readFileSync(new URL('../src/lib/data/infrastructure-depth.json',import.meta.url),'utf8'));
const equations=JSON.parse(fs.readFileSync(new URL('../src/lib/data/equations-infrastructure.json',import.meta.url),'utf8'));
const allIds=new Set(['records','fabrication','architecture','infrastructure','crg','infrastructure-depth'].flatMap(name=>{
 const p=JSON.parse(fs.readFileSync(new URL('../src/lib/data/'+name+'.json',import.meta.url),'utf8'));
 return(Array.isArray(p)?p:p.lessons).map(r=>r.id);
}));
test('selected HBM assembly route overrides shared stack geometry',()=>{
 const pairs=[['hbm-tc-ncf-route','hbm-tc-ncf'],['hbm-mr-muf-route','hbm-mr-muf'],['hbm-hybrid-bond-route','hbm-hybrid']];
 for(const [lesson,id] of pairs){const route=routeFor('hbm-detail',lesson);assert.equal(route.id,id);assert.equal(route.steps.length,6);assert.ok(route.steps.some(s=>s.lesson===lesson));}
 assert.equal(new Set(pairs.map(([lesson])=>routeFor('hbm-detail',lesson).source)).size,3,'Each route retains its own process source');
});
test('all memory process stages retain learning links and inspection context',()=>{
 for(const route of memoryProcessRoutes){assert.ok(route.source.startsWith('https://'));for(const s of route.steps){assert.ok(allIds.has(s.lesson),route.id+' links '+s.lesson);for(const key of ['input','action','output','measure','why'])assert.ok(s[key]?.trim(),route.id+' '+key);}}
 for(const id of ['hbf-read-tier-contract','memory-working-set-placement','memory-to-hall-propagation','memory-system-qualification'])assert.equal(routeFor('memory-route',id).id,'memory-placement');
});
test('every new science equation renders authored mathematics with symbol definitions',()=>{
 for(const lesson of pack.lessons){assert.equal(equations[lesson.id].length,lesson.science.length,lesson.id);for(const eq of equations[lesson.id]){assert.doesNotThrow(()=>katex.renderToString(eq.latex,{throwOnError:true,strict:'error',trust:false}));assert.ok(eq.variables.length>0);for(const variable of eq.variables)assert.ok(variable.symbol&&variable.meaning&&variable.unit,lesson.id+' notation');}}
});
test('HBF numerical disclosure stays an announcement with a scoped dated source',()=>{
 const claim=pack.claims.find(c=>c.id==='depth-claim-hbf-spec');assert.equal(claim.status,'announced');assert.equal(claim.period,'2026-08-04');const source=pack.sources.find(s=>s.id===claim.sourceId);assert.equal(source.publisher,'SK hynix');assert.equal(source.published,claim.period);assert.ok(claim.scope&&claim.limitations&&source.locator);
 const historical=pack.claims.find(c=>c.id==='depth-claim-hbf-scope');assert.equal(historical.status,'reported');assert.equal(historical.period,'2025-07');assert.notEqual(historical.sourceId,claim.sourceId);
});
