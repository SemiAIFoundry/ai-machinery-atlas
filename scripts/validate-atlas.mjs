import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const base=process.cwd();const ts=(await import('typescript')).default;
const baseline=JSON.parse(fs.readFileSync('src/lib/data/records.json','utf8'));
const packs=['fabrication','architecture','infrastructure','crg','infrastructure-depth'].map(n=>JSON.parse(fs.readFileSync('src/lib/data/'+n+'.json','utf8')));
const data=[...baseline,...packs.flatMap(p=>p.lessons)];
let src=fs.readFileSync('src/lib/atlas.ts','utf8')
 .replace(/import (\w+) from '(\.\/data\/[^']+\.json)';/g,(_,name,path)=>'const '+name+'='+fs.readFileSync('src/lib/'+path,'utf8')+';')
 .replace("import {legacyEnrichments} from './legacy-enrichments';",()=>{
   const module=fs.readFileSync('src/lib/legacy-enrichments.ts','utf8');
   return ts.transpileModule(module,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace('export const legacyEnrichments','const legacyEnrichments');
 });
const {chapters,journeys}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const {buildModel}=await import(pathToFileURL(base+'/src/lib/scene-models.ts').href);const math=await import(pathToFileURL(base+'/src/lib/lab-math.ts').href);
const ids=new Set(data.map(r=>r.id));assert.equal(ids.size,data.length,'Unique IDs');const assigned=chapters.flatMap(c=>c.ids);const missing=assigned.filter(id=>!ids.has(id));const unassigned=[...ids].filter(id=>!assigned.includes(id));console.log('Missing records:',missing,'Unassigned:',unassigned);assert.deepEqual(missing,[]);assert.deepEqual(unassigned,[]);
const missingScene=[];for(const r of data){assert.ok(r.mechanism?.length>=3,r.id+' mechanism');assert.ok(r.science?.length,r.id+' science');assert.ok(r.sources?.length,r.id+' source');assert.ok(r.check?.options.length===3,r.id+' quiz');assert.ok(r.check.answer>=0&&r.check.answer<3,r.id+' answer');for(const ref of r.sources)assert.ok(ref.url.startsWith('https://'));const c=chapters.find(c=>c.ids.includes(r.id));const model=buildModel(c.scene,r.id,c.ids);if(!model.groups.some(g=>g.userData.id===r.id&&g.children.length))missingScene.push(r.id);assert.ok(Number.isFinite(model.boxBounds.min.x)&&Number.isFinite(model.boxBounds.max.y),r.id+' bounds');const geo=new Set(),mat=new Set();model.root.traverse(o=>{if(o.geometry)geo.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mat.add(m));});geo.forEach(g=>g.dispose());mat.forEach(m=>m.dispose());}
assert.deepEqual(missingScene,[],'Every selectable component has an isolatable 3D group');for(const j of journeys)for(const id of j.ids)assert.ok(ids.has(id),'journey missing '+id);
assert.equal(math.mosfetCurrent(.2,.5),0);assert.equal(math.mosfetCurrent(1,.6),18);assert.ok(math.mosfetCurrent(.8,.2)<math.mosfetCurrent(.8,.4));assert.deepEqual(math.matmul([[1,2],[3,4]],[[1,0],[0,1]]),[[1,2],[3,4]]);const w=math.attentionWeights([[1,0],[0,1]],[[1,0],[0,1]]);assert.equal(w[0][1],0);w.forEach(r=>assert.ok(Math.abs(r.reduce((a,b)=>a+b,0)-1)<1e-12));assert.equal(math.roofline(100,2,30),60);assert.equal(math.roofline(100,2,70),100);assert.equal(math.kvBytes(1,32,8192,8,128,2),1073741824);assert.equal(math.thermalRise(500,.1),50);assert.ok(math.scaledLoss(100)<math.scaledLoss(10));
console.log('PASS:',data.length,'complete lessons;',chapters.length,'branches;',journeys.length,'connected paths; geometry/isolation and numerical invariants.');

const prereqs=new Map(data.map(r=>[r.id,r.prerequisites||[]])),visited=new Set(),stack=new Set();
function visit(id){assert.ok(ids.has(id),'Missing prerequisite '+id);assert.ok(!stack.has(id),'Circular prerequisite '+id);if(visited.has(id))return;stack.add(id);for(const next of prereqs.get(id))visit(next);stack.delete(id);visited.add(id);}
for(const r of data){visit(r.id);for(const next of r.related)assert.ok(ids.has(next),'Missing relationship '+next);}
const sourceIds=new Set(packs.flatMap(p=>p.sources.map(s=>s.id)));for(const p of packs)for(const claim of p.claims){assert.ok(sourceIds.has(claim.sourceId),'Missing evidence source '+claim.id);for(const id of claim.lessonIds)assert.ok(ids.has(id),'Claim lesson '+id);assert.ok(claim.checkedOn&&claim.status&&claim.scope&&claim.limitations,'Evidence context '+claim.id);}
assert.equal(baseline.length,97,'All baseline lessons retained');assert.equal(new Set(assigned).size,data.length,'Every lesson assigned');
console.log('PASS: prerequisite DAG, relationship references, claim provenance and baseline preservation.');
