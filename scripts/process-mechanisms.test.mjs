import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import katex from 'katex';
// Import TS through a data URL with the JSON catalog embedded; no browser is needed.
const text=readFileSync(new URL('../src/lib/process-mechanisms.ts',import.meta.url),'utf8').replace("import catalog from './data/process-mechanisms.json';",`const catalog=${readFileSync(new URL('../src/lib/data/process-mechanisms.json',import.meta.url),'utf8')};`);
const js=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {processDrawing,mechanismRoutes,mechanismSources}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('14 routes and 84 states have bounded geometry, sources and valid mathematics',()=>{
 assert.equal(mechanismRoutes.length,14);
 for(const r of mechanismRoutes){assert.equal(r.steps.length,6);assert.ok(r.sourceRefs.every(id=>mechanismSources.some(s=>s.id===id)));for(let n=0;n<6;n++){const d=processDrawing(r.id,n);assert.ok(d.caption&&d.scale&&d.measurements.length);assert.ok(d.shapes.length);for(const s of d.shapes){assert.ok([s.x,s.y,s.w,s.h].every(Number.isFinite));if(s.kind!=='line'){assert.ok(s.w>0);assert.ok(s.h>0);}}if(d.formula)assert.doesNotThrow(()=>katex.renderToString(d.formula,{throwOnError:true,strict:'error'}));}}
});
test('thermal oxidation moves both oxide and consumed-silicon boundaries',()=>{
 const d=processDrawing('thermal-oxidation',4),si=d.shapes.find(x=>x.label==='Remaining silicon'),ox=d.shapes.find(x=>x.label==='Grown SiO₂');
 assert.ok(si.y>240);assert.ok(ox.y<240);assert.equal(ox.y+ox.h,si.y);assert.equal(ox.h,80);assert.equal(si.y-240,34);
});
test('NCF precedes bonding; MR–MUF forms joints before mold; hybrid has neither solder nor film',()=>{
 const labels=(id,n)=>processDrawing(id,n).shapes.map(s=>s.label);
 assert.ok(labels('hbm-tc-ncf',1).includes('NCF'));assert.ok(!labels('hbm-mr-muf',2).includes('Molded underfill'));assert.ok(labels('hbm-mr-muf',3).includes('Molded underfill'));
 for(let n=0;n<6;n++)assert.ok(!labels('hbm-hybrid',n).some(x=>/NCF|Molded|solder/i.test(x||'')));
});
test('ALD purges remove gas pulse but preserve reacted surface',()=>{
 for(const n of [2,4]){const d=processDrawing('ald-cycle',n);assert.ok(!d.shapes.some(s=>/pulse/.test(s.label||'')));assert.ok(d.shapes.some(s=>s.label==='Bound A'||s.label==='Reacted surface'));}
});
test('exposure retains resist; development preserves target film',()=>{
 const exposed=processDrawing('resist-track',3),developed=processDrawing('resist-track',4);
 assert.ok(exposed.shapes.some(s=>s.label==='Latent image'));assert.ok(!developed.shapes.some(s=>s.label==='Latent image'));assert.deepEqual(exposed.shapes.find(s=>s.label==='Target film — intact'),developed.shapes.find(s=>s.label==='Target film — intact'));
});
test('etch consumes mask and exposes a failed requested profile when the mask exhausts',()=>{
 const d=processDrawing('etch-transfer',3,'cvd',10);assert.equal(d.measurements.find(m=>m.label==='Mask consumed / remaining').value,'20.0 / 20.0 nm');
 const fail=processDrawing('etch-transfer',3,'cvd',2);assert.ok(fail.caption.includes('exhausts'));assert.ok(!fail.shapes.some(s=>s.label==='Remaining mask'));
});
test('NA doubling halves relative resolution and quarters depth of focus',()=>{
 const values=p=>processDrawing('lithography-optics',4,'cvd',p).measurements.map(m=>Number(m.value));const a=values(10),b=values(20);assert.equal(b[1],a[1]/2);assert.equal(b[2],a[2]/4);
});
test('inspection preserves geometry where material does not change',()=>{
 for(const id of ['hbm-tc-ncf','hbm-mr-muf','hbm-hybrid','cz-crystal','wafer-finishing','epitaxial-stack','surface-contamination','thermal-oxidation','cvd-pvd','ald-cycle','resist-track','mask-opc','lithography-optics','etch-transfer']) assert.deepEqual(processDrawing(id,4).shapes,processDrawing(id,5).shapes,id);
});
