import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Outside-repo: run from the atlas checkout, or set ATLAS_REPO.
// Integrated: set STUDIO_LESSON_MODULE=src/lib/studio-lessons.ts when this test lives in scripts/.
const repo=process.env.ATLAS_REPO||process.cwd();
const moduleUrl=process.env.STUDIO_LESSON_MODULE?pathToFileURL(path.resolve(repo,process.env.STUDIO_LESSON_MODULE)):new URL('../src/lib/studio-lessons.ts',import.meta.url);
const {studioGroups,studioIds,studioExperienceGuides,lessonsForStudio,studiosForLesson}=await import(moduleUrl.href);
const catalog=JSON.parse(readFileSync(path.join(repo,'src/lib/generated/catalog.json'),'utf8'));
const lessonIds=new Set(catalog.records.map(r=>r.id));

test('all mechanism experiences have stable IDs and meaningful reading destinations',()=>{
  assert.deepEqual(studioIds,['fabrication','memory','architecture','realization','hall','applications','orbital','progress','foundations','learning','automation','machine','reliability','control','commissioning','retrieval','families','distributed','evaluation','decisions','cell','serving','data','factory','memory-workload','ranking','network','projection']);
  assert.deepEqual(Object.keys(studioExperienceGuides),studioIds);
  for(const id of studioIds){
    const guide=studioExperienceGuides[id];
    assert.equal(guide.id,id);assert.ok(guide.title&&guide.summary&&guide.entryLabel);
    assert.ok(guide.lessonLinks.length>=4);
    assert.equal(new Set(guide.lessonLinks.map(l=>l.lessonId)).size,guide.lessonLinks.length);
    for(const link of guide.lessonLinks){
      assert.ok(lessonIds.has(link.lessonId),`${id}: nonexistent lesson ${link.lessonId}`);
      assert.ok(link.label.trim().length>8&&link.reason.trim().length>25);
    }
  }
});

test('each explicit launch route has a valid lesson and the corresponding continuation context',()=>{
  for(const id of studioIds){
    const guide=studioExperienceGuides[id];
    assert.equal(new Set(guide.entryLessonIds).size,guide.entryLessonIds.length);
    for(const lessonId of guide.entryLessonIds){
      assert.ok(lessonIds.has(lessonId));
      assert.ok(guide.lessonLinks.some(l=>l.lessonId===lessonId));
      assert.equal(studiosForLesson(lessonId).filter(x=>x.experienceId===id).length,1);
    }
  }
});

test('representative lessons route to the mechanism they actually illustrate, independently of scale bands',()=>{
  const expected={
    'resist-track-development':['fabrication'],
    'hbm-channel-generation-ras':['memory','reliability','memory-workload'],
    'systolic-array-dataflow':['architecture'],
    'chip-rtl-verification':['realization','reliability'],
    'loss-optimizer':['applications','learning'],
    'checkpoint-retained-work':['hall','factory'],
    'retained-work-restart-boundary':['hall','reliability','factory'],
    'orbital-radiator-budget':['orbital'],
    'compatible-supply-capacity':['progress'],
  };
  for(const [id,targets] of Object.entries(expected))assert.deepEqual(studiosForLesson(id).map(x=>x.experienceId),targets);
});

test('a shared qualification boundary offers both relevant experiences in a stable order',()=>{
  assert.deepEqual(studiosForLesson('memory-system-qualification').map(x=>x.experienceId),['fabrication','memory','memory-workload']);
  assert.notEqual(studiosForLesson('memory-system-qualification')[0].reason,studiosForLesson('memory-system-qualification')[1].reason);
});

test('outbound further reading does not imply that the experience simulates that lesson',()=>{
  for(const [experienceId,lessonId] of [
    ['fabrication','known-good-die-test'],
    ['realization','chip-tapeout-productization'],
    ['hall','grid-interconnection-readiness'],
    ['orbital','orbital-lifecycle-economics'],
    ['orbital','orbital-evidence-status'],
  ]){
    assert.ok(lessonsForStudio(experienceId).some(x=>x.lessonId===lessonId));
    assert.ok(!studiosForLesson(lessonId).some(x=>x.experienceId===experienceId));
  }
});

test('unmodeled atomic physics, device switching, plant dynamics and orbital economics get no generic CTA',()=>{
  for(const id of ['silicon-atom','energy-bands','mosfet','cpu-out-of-order','power-integrity-budget','orbital-replacement-mass','orbital-lifecycle-economics','unknown-lesson','']){
    if(id&&!id.startsWith('unknown'))assert.ok(lessonIds.has(id),`fixture is stale: ${id}`);
    assert.deepEqual(studiosForLesson(id),[]);
  }
});

test('navigation has no completion or first-attempt side effects',()=>{
  const before=JSON.stringify(studioExperienceGuides);
  for(const lesson of catalog.records)studiosForLesson(lesson.id);
  for(const id of studioIds)lessonsForStudio(id);
  assert.equal(JSON.stringify(studioExperienceGuides),before);
  assert.ok(studioExperienceGuides.progress.lessonLinks.length>0);
  assert.ok(!('answers' in studioExperienceGuides.progress));
});

test("every experience appears exactly once in desktop and mobile groups",()=>{
 const grouped=studioGroups.flatMap(g=>g.ids);
 assert.deepEqual([...grouped].sort(),[...studioIds].sort());
 assert.equal(new Set(grouped).size,grouped.length);
});
