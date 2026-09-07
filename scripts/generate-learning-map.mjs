import fs from 'node:fs';
import {loadCurrent} from '../docs/curation/curation-common.mjs';
import {studiosForLesson} from '../src/lib/studio-lessons.ts';
const {atlas}=loadCurrent();
const ontology=JSON.parse(fs.readFileSync('src/lib/data/learning-ontology.json','utf8'));
const artifacts=JSON.parse(fs.readFileSync('src/lib/data/experience-artifacts.json','utf8'));
const lessons=atlas.records.map(r=>{
 const chapter=atlas.chapterFor(r.id),facet=ontology.lessonOverrides[r.id]||ontology.chapters[chapter.id];
 if(!facet)throw Error('Missing deliberate learning-map assignment: '+chapter.id);
 if(!r.description||!r.mechanism.length)throw Error('Missing explained mechanism: '+r.id);
 return {id:r.id,name:r.name,role:r.role,chapterId:chapter.id,band:chapter.band,...facet,prerequisites:r.prerequisites||[],worked:!!r.engineeringExample?.trim(),mechanisms:studiosForLesson(r.id),artifacts:artifacts.filter(a=>studiosForLesson(r.id).some(m=>m.experienceId===a.experienceId))};
});
fs.mkdirSync('src/lib/generated',{recursive:true});
fs.writeFileSync('src/lib/generated/learning-map.json',JSON.stringify({schemaVersion:1,version:ontology.version,areas:ontology.areas,stages:ontology.stages,lessons}));
console.log('Generated lifecycle facets and scoped mechanisms for '+lessons.length+' canonical lessons.');
