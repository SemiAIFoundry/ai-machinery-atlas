import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseAtlasHash,encodeAtlasHash} from '../src/lib/url-state.ts';
import {studiosForLesson} from '../src/lib/studio-lessons.ts';
const map=JSON.parse(fs.readFileSync('src/lib/generated/learning-map.json','utf8'));
const catalog=JSON.parse(fs.readFileSync('src/lib/generated/catalog.json','utf8'));
test('facets keep every canonical lesson once and every link within the atlas',()=>{
 assert.deepEqual(map.lessons.map(r=>r.id).sort(),catalog.records.map(r=>r.id).sort());
 const ids=new Set(map.lessons.map(r=>r.id)),areas=new Set(map.areas.map(r=>r.id)),stages=new Set(map.stages.map(r=>r.id));
 for(const r of map.lessons){assert.ok(r.areas.length&&r.stages.length);for(const id of r.areas)assert.ok(areas.has(id));for(const id of r.stages)assert.ok(stages.has(id));for(const id of r.prerequisites)assert.ok(ids.has(id));assert.ok(catalog.chapters.find(c=>c.id===r.chapterId)?.ids.includes(r.id));assert.deepEqual(r.mechanisms,studiosForLesson(r.id));}
});
test('lifecycle is independent of physical band and exposes exact executable scope',()=>{
 const one=id=>map.lessons.find(r=>r.id===id);
 assert.deepEqual(one('post-training').stages,['adapt']);assert.deepEqual(one('evaluation').stages,['evaluate']);
 assert.deepEqual(one('mosfet').mechanisms,[]);
 assert.ok(one('hbm-controller').mechanisms.some(r=>r.experienceId==='machine'&&r.reason.includes('synthetic')));
 assert.ok(one('loss-optimizer').mechanisms.some(r=>r.experienceId==='learning'));
 assert.equal(one('silicon-atom').band,0);assert.equal(one('loss-optimizer').band,5);
});
test('lifecycle URL round-trips without changing lesson or marking learning complete',()=>{
 const state={lesson:'post-training',view:'anatomy',processStep:0,path:'',pathStep:0,comparison:'',explore:'lifecycle'};
 assert.equal(parseAtlasHash(encodeAtlasHash(state)).explore,'lifecycle');
 assert.equal(parseAtlasHash(encodeAtlasHash(state)).lesson,'post-training');
 assert.equal(parseAtlasHash('#post-training~v=1&explore=bogus').explore,'');
 assert.equal(parseAtlasHash('#post-training~explore=lifecycle').explore,'');
});

test("connected artifacts require an explicit executable entry and round-trip route",()=>{
 const declared=JSON.parse(fs.readFileSync("src/lib/data/experience-artifacts.json","utf8"));
 for(const item of map.lessons)for(const artifact of item.artifacts){
  assert.ok(declared.some(d=>d.experienceId===artifact.experienceId&&d.name===artifact.name));
  assert.ok(item.mechanisms.some(m=>m.experienceId===artifact.experienceId));
  assert.equal(parseAtlasHash(`#${item.id}~v=1&studio=${artifact.experienceId}`).studio,artifact.experienceId);
 }
 for(const item of declared)assert.ok(map.lessons.some(l=>l.artifacts.some(a=>a.experienceId===item.experienceId)),item.experienceId);
});
