import {mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadAuthoredAtlas} from './atlas-authoring.mjs';
const atlas=await loadAuthoredAtlas(), ids=new Set(atlas.records.map(r=>r.id));
assert.equal(ids.size,atlas.records.length);
const required=['id','name','shortName','role','description','learningObjective','engineeringExample','evidenceNotes'];
for(const r of atlas.records){for(const key of required)assert.ok(typeof r[key]==='string'&&r[key].trim(),`${r.id}: ${key}`);for(const key of ['prerequisites','related','sources','specs','interfaces','mechanism'])assert.ok(Array.isArray(r[key]),`${r.id}: ${key}`);assert.ok(r.sources.length);for(const id of [...r.prerequisites,...r.related])assert.ok(ids.has(id),`${r.id} -> ${id}`);}
for(const c of atlas.chapters)for(const id of c.ids)assert.ok(ids.has(id),`Chapter ${c.id}: ${id}`);
for(const j of atlas.journeys)for(const id of j.ids)assert.ok(ids.has(id),`Path ${j.id}: ${id}`);
for(const edge of atlas.relationshipEdges)assert.ok(ids.has(edge.from)&&ids.has(edge.to),'Relationship endpoint');
const keys=['id','level','name','shortName','role','scale','kind','branch','subbranch','workstream','labId','deepLabId','labScope','investigationId','prerequisites','related','check'];
const destination='public/lesson-data';mkdirSync('src/lib/generated',{recursive:true});
// This directory contains only generated lessons, never user-authored assets.
rmSync(destination,{recursive:true,force:true});mkdirSync(destination,{recursive:true});
const records=atlas.records.map(r=>{const body=JSON.stringify(r),hash=createHash('sha256').update(body).digest('hex').slice(0,16),asset=`lesson-data/${r.id}-${hash}.json`;writeFileSync('public/'+asset,body);return {...Object.fromEntries(keys.filter(k=>r[k]!==undefined).map(k=>[k,r[k]])),asset};});
const catalog={schemaVersion:1,records,chapters:atlas.chapters,journeys:atlas.journeys,bands:atlas.bands,domains:atlas.domains,relationshipEdges:atlas.relationshipEdges,contentPacks:atlas.contentPacks.map(({lessons,...p})=>p)};
writeFileSync('src/lib/generated/catalog.json',JSON.stringify(catalog));
console.log(`Generated navigation index and ${records.length} independently cached lesson files.`);
