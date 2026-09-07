import test from 'node:test';
import assert from 'node:assert/strict';
import {readStudioRecord,studioRecordVersion,studioStorageKey,studioRecoveryStorageKey,createStudioWorkspace,validateStudioValues,progressWorkedBounds} from '../src/lib/studio-record.ts';
import {architecturePresets,buildArchitectureComparison} from '../src/lib/architecture-execution.ts';
import {fabricationDefaults} from '../src/lib/fabrication-flow.ts';
import {scenarioDefaults} from '../src/lib/investigation-models.ts';
import {memoryExplorerDefaults} from '../src/lib/memory-interfaces.ts';
import {createOperatingHallScenario,operatingHallExamples} from '../src/lib/operating-hall-scenarios.ts';
import {createOrbitalMissionScenario,orbitalMissionExamples} from '../src/lib/orbital-mission-scenarios.ts';
const identity={content:'test-content-digest',models:{architecture:'1',progress:'2'}};
const timestamp='2026-09-07T18:00:00.000Z';
const document=(values={},extra={})=>({schema:studioRecordVersion,...identity,savedAt:timestamp,values,...extra});
const text=values=>JSON.stringify(document(values));
const read=values=>readStudioRecord(text(values),identity).values;
function rig(initial){
 const entries=new Map(initial===undefined?[]:[[studioStorageKey,initial]]),jobs=[],statuses=[],writes=[];let fail=()=>false;
 const storage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>{if(fail(k,v))throw Error('quota denied');writes.push([k,v]);entries.set(k,v);},removeItem:k=>entries.delete(k)};
 const work=createStudioWorkspace({storage,identity,now:()=>timestamp,schedule:fn=>{const job={fn,canceled:false};jobs.push(job);return job;},cancel:job=>{job.canceled=true;},onStatus:s=>statuses.push(s)});
 return{work,entries,jobs,statuses,writes,fail:fn=>{fail=fn;},tick:()=>{for(const j of jobs.splice(0))if(!j.canceled)j.fn();}};
}
test('every authored operating scenario and all model defaults pass current record validation',()=>{
 for(const x of operatingHallExamples())assert.doesNotThrow(()=>read({'hall.scenario':x.scenario,'hall.time':150}));
 for(const x of orbitalMissionExamples())assert.doesNotThrow(()=>read({'orbital.scenario':x.scenario,'orbital.time':6000}));
 assert.doesNotThrow(()=>read({'architecture.input':architecturePresets.two,'architecture.scheme':'systolic','architecture.index':0,'fabrication.input':fabricationDefaults,'fabrication.index':10,'fabrication.section':1,'memory.scenario':scenarioDefaults,'memory.input':memoryExplorerDefaults,'memory.openRows':{'0':{'d0/c0/p0/b0':12}},'applications.id':'sensor','sensor.options':{},'sensor.cursor':0,'retrieval.options':{},'realization.a':15,'realization.b':15,'realization.edge':2,'realization.cell':'','realization.net':'','progress.view':'growth','progress.growthOptions':{},'progress.packageOptions':{},'progress.hallOptions':{}}));
});
test('record edition, model identity, exact envelope, timestamp, size and JSON errors are rejected',()=>{
 for(const extra of [{schema:'other'},{content:'old'},{models:{architecture:'1'}},{savedAt:'2026-02-30T18:00:00.000Z'},{savedAt:'tomorrow'},{savedAt:'2026-09-07'},{surprise:true},{values:[]}])assert.throws(()=>readStudioRecord(JSON.stringify(document({},extra)),identity));
 assert.throws(()=>readStudioRecord(' '.repeat(240000)+text({'memory.lastRead':'界'.repeat(3999)}),identity),/record size/);
 for(const raw of ['{', ' '.repeat(250001),JSON.stringify(null)])assert.throws(()=>readStudioRecord(raw,identity));
 assert.deepEqual(readStudioRecord(JSON.stringify(document({}, {models:{progress:'2',architecture:'1'}})),identity).models,{progress:'2',architecture:'1'});
});
test('unknown fields at every model option level cannot silently enter a workspace',()=>{
 const hall=createOperatingHallScenario(),orbit=createOrbitalMissionScenario();hall.service.surprise=1;orbit.solar.surprise=1;
 for(const v of [{'unknown.field':1},{'architecture.input':{...architecturePresets.two,surprise:1}},{'fabrication.input':{...fabricationDefaults,surprise:1}},{'memory.scenario':{...scenarioDefaults,surprise:1}},{'memory.input':{...memoryExplorerDefaults,surprise:1}},{'hall.scenario':hall},{'orbital.scenario':orbit},{'sensor.options':{cost:{surprise:1}}},{'retrieval.options':{cost:{surprise:1}}},{'progress.growthOptions':{facilityFactor:2}},{'progress.packageOptions':{demands:[{id:'a',units:1,surprise:2}]}}])assert.throws(()=>read(v));
 assert.throws(()=>read(JSON.parse('{"__proto__":{"polluted":true}}')));assert.equal({}.polluted,undefined);
});
test('numeric input types, matrix compatibility, fully disabled lanes and malformed scenarios fail before use',()=>{
 for(const v of [{'architecture.input':{a:[[1,2],[3,4]],b:[[1]]}},{'architecture.input':{...architecturePresets.two,inactiveLanes:[0,1,2,3]}},{'sensor.options':{steps:'24'}},{'sensor.options':{steps:81}},{'retrieval.options':{queryId:'absent'}},{'hall.scenario':null},{'orbital.scenario':{kind:'synthetic-orbital-mission'}},{'realization.a':16},{'realization.edge':3},{'progress.growthOptions':{periodYears:0}}])assert.throws(()=>read(v));
 assert.throws(()=>validateStudioValues({'sensor.options':{learningRate:Infinity}}));
});
test('architecture cursor is constrained by the actual selected trace and specimen',()=>{
 for(const input of Object.values(architecturePresets))for(const scheme of ['scalar','vector','simt','systolic']){const last=buildArchitectureComparison(input).traces[scheme].steps.length-1;assert.doesNotThrow(()=>read({'architecture.input':input,'architecture.scheme':scheme,'architecture.index':last}));assert.throws(()=>read({'architecture.input':input,'architecture.scheme':scheme,'architecture.index':last+1}));}
});
test('training cursor and time controls obey paired settings, including zero-step and partial imports',()=>{
 assert.doesNotThrow(()=>read({'sensor.options':{steps:0},'sensor.cursor':0}));assert.throws(()=>read({'sensor.options':{steps:0},'sensor.cursor':1}));assert.throws(()=>read({'sensor.options':{steps:3},'sensor.cursor':3}));
 assert.throws(()=>read({'hall.time':301}));assert.throws(()=>read({'orbital.time':12001}));
 const hall=createOperatingHallScenario();hall.durationS=10;hall.faults=[];assert.equal(read({'hall.scenario':hall})['hall.time'],10);assert.throws(()=>read({'hall.scenario':hall,'hall.time':11}));
 const orbital=createOrbitalMissionScenario();orbital.durationS=3000;orbital.contacts=orbital.contacts.slice(0,1);orbital.radiation.resets=orbital.radiation.resets.slice(0,1);assert.equal(read({'orbital.scenario':orbital})['orbital.time'],3000);
});
test('memory address, package-stack and bank-state bounds remain linked to the same die count',()=>{
 const scenario={...scenarioDefaults,dies:4};assert.doesNotThrow(()=>read({'memory.scenario':scenario,'memory.input':{...memoryExplorerDefaults,byteAddress:4*2**31-1,selectedStack:7}}));
 for(const v of [{'memory.scenario':scenario,'memory.input':{...memoryExplorerDefaults,byteAddress:4*2**31}},{'memory.input':{...memoryExplorerDefaults,selectedStack:8}},{'memory.openRows':{'8':{}}},{'memory.openRows':{'00':{}}},{'memory.scenario':scenario,'memory.openRows':{'0':{'d4/c0/p0/b0':0}}},{'memory.openRows':{'0':{'d0/c0/p0/b0':32768}}}])assert.throws(()=>read(v));
});
test('import simulation budgets reject giant timelines, event storms, tiny services and battery chatter',()=>{
 const cases=[];let h=createOperatingHallScenario();h.sampleS=.01;cases.push({'hall.scenario':h});h=createOperatingHallScenario();h.checkpoint.intervalRunS=.001;cases.push({'hall.scenario':h});
 let o=createOrbitalMissionScenario();o.service.computeOpsS=1e20;o.service.memoryBytesS=1e20;cases.push({'orbital.scenario':o});o=createOrbitalMissionScenario();o.battery.resumeJ=o.battery.reserveJ+.0001;cases.push({'orbital.scenario':o});o=createOrbitalMissionScenario();o.illumination.periodS=10;o.illumination.sunlitS=5;cases.push({'orbital.scenario':o});o=createOrbitalMissionScenario();o.contacts=[];cases.push({'orbital.scenario':o});
 const start=performance.now();for(const c of cases)assert.throws(()=>read(c));assert.ok(performance.now()-start<1000,'preflight must reject without a large simulation');
});
test('progress records preserve named metric/period choices and reject out-of-range worked controls',()=>{
 const v={'progress.view':'growth','progress.index':9,'progress.allocation':'hall','progress.growthOptions':{scenario:'compute-memory',memoryMetric:'capacity',periodYears:2,computeFactor:3,comparisonFactor:2},'progress.hallOptions':{installedRacks:9,commissionedRacks:8},'progress.packageOptions':{policy:'proportional'}};
 for(const [id,[min]] of Object.entries(progressWorkedBounds))v[`progress.worked.${id}`]=min;
 assert.deepEqual(read(v),v);for(const [id,[,max]] of Object.entries(progressWorkedBounds))assert.throws(()=>read({[`progress.worked.${id}`]:max+1}));
 assert.throws(()=>read({'progress.hallOptions':{installedRacks:1,commissionedRacks:2}}));
});
test('invalid persisted data survives initialization and repeated default registration without any autosave',()=>{
 const raw='{old broken record',r=rig(raw);r.work.initialize();r.work.seed('realization.a',7);r.work.seed('realization.a',5);r.work.initialize();r.work.stop();r.tick();
 assert.equal(r.entries.get(studioStorageKey),raw);assert.equal(r.writes.length,0);assert.equal(r.work.values['realization.a'],7);assert.match(r.statuses[0],/left untouched/);
});
test('first edit preserves the exact incompatible record before writing the new edition, then saves normally',()=>{
 const raw='  '+JSON.stringify(document({'realization.a':14},{content:'previous-four-lesson-edition'}),null,2)+'\n',r=rig(raw);
 r.work.initialize();r.work.seed('realization.a',7);assert.equal(r.writes.length,0);assert.equal(r.work.olderRecordCount,1);assert.equal(r.work.exportOlderText(),raw);
 r.work.write('realization.a',8);r.work.flush();
 assert.deepEqual(r.writes.map(([key])=>key),[studioRecoveryStorageKey,studioStorageKey]);
 assert.deepEqual(JSON.parse(r.entries.get(studioRecoveryStorageKey)),[raw]);
 assert.equal(readStudioRecord(r.entries.get(studioStorageKey),identity).values['realization.a'],8);
 r.work.write('realization.a',9);r.tick();assert.equal(readStudioRecord(r.entries.get(studioStorageKey),identity).values['realization.a'],9);
 assert.equal(r.writes.filter(([key])=>key===studioRecoveryStorageKey).length,1);assert.equal(r.work.exportOlderText(),raw);
 const reopened=rig(r.entries.get(studioStorageKey));reopened.entries.set(studioRecoveryStorageKey,r.entries.get(studioRecoveryStorageKey));reopened.work.initialize();
 assert.equal(reopened.work.values['realization.a'],9);assert.equal(reopened.work.exportOlderText(),raw);assert.equal(reopened.work.olderRecordCount,1);
});
test('invalid JSON, empty raw storage and invalid controls are preserved verbatim on first save',()=>{
 for(const raw of ['{broken record\n with original spacing 界','',text({'realization.a':100})]){
  const r=rig(raw);r.work.initialize();r.work.seed('realization.a',7);r.work.write('realization.a',8);r.tick();
  assert.deepEqual(JSON.parse(r.entries.get(studioRecoveryStorageKey)),[raw]);assert.equal(r.work.exportOlderText(),raw);
  assert.equal(readStudioRecord(r.entries.get(studioStorageKey),identity).values['realization.a'],8);
 }
});
test('import preserves incompatible raw separately from the latest current-edition undo workspace',()=>{
 const raw=JSON.stringify(document({'realization.a':14},{models:{architecture:'old-model'}})),r=rig(raw);
 r.work.initialize();r.work.seed('realization.a',7);r.work.write('realization.a',9);
 r.work.importText(text({'realization.a':12}),r.work.beginImport());
 assert.deepEqual(r.writes.map(([key])=>key),[studioRecoveryStorageKey,studioStorageKey+'-before-import',studioStorageKey]);
 assert.equal(r.work.exportOlderText(),raw);assert.deepEqual(JSON.parse(r.entries.get(studioRecoveryStorageKey)),[raw]);
 assert.equal(readStudioRecord(r.entries.get(studioStorageKey+'-before-import'),identity).values['realization.a'],9);
 r.work.restorePrevious();assert.equal(r.work.values['realization.a'],9);assert.equal(r.work.exportOlderText(),raw);
});
test('failed durable preservation blocks both autosave and import without losing old active data or live edits',()=>{
 for(const operation of ['flush','import']){
  const raw='{exact old invalid record',prior='{earlier recovery}',r=rig(raw);r.entries.set(studioRecoveryStorageKey,JSON.stringify([prior]));r.entries.set(studioStorageKey+'-before-import','prior undo');
  r.work.initialize();r.work.seed('realization.a',7);r.work.write('realization.a',9);r.fail(key=>key===studioRecoveryStorageKey);
  if(operation==='import')assert.throws(()=>r.work.importText(text({'realization.a':12}),r.work.beginImport()),/quota/);else r.work.flush();
  assert.equal(r.entries.get(studioStorageKey),raw);assert.deepEqual(JSON.parse(r.entries.get(studioRecoveryStorageKey)),[prior]);assert.equal(r.entries.get(studioStorageKey+'-before-import'),'prior undo');
  assert.equal(r.work.values['realization.a'],9);assert.equal(readStudioRecord(r.work.exportText(),identity).values['realization.a'],9);assert.equal(r.work.generation,0);
  assert.deepEqual(JSON.parse(r.work.exportOlderText()).records.map(x=>x.raw),[prior,raw]);assert.equal(r.writes.length,0);
  r.fail(()=>false);r.work.flush();assert.equal(readStudioRecord(r.entries.get(studioStorageKey),identity).values['realization.a'],9);assert.deepEqual(JSON.parse(r.entries.get(studioRecoveryStorageKey)),[prior,raw]);
 }
});
test('active-write failure retains the durable older raw and retry does not append a duplicate',()=>{
 const raw='{old exact source',r=rig(raw);r.work.initialize();r.work.seed('realization.a',3);r.work.write('realization.a',4);r.fail(key=>key===studioStorageKey);r.work.flush();
 assert.equal(r.entries.get(studioStorageKey),raw);assert.deepEqual(JSON.parse(r.entries.get(studioRecoveryStorageKey)),[raw]);assert.equal(r.work.values['realization.a'],4);
 r.fail(()=>false);r.work.flush();assert.equal(readStudioRecord(r.entries.get(studioStorageKey),identity).values['realization.a'],4);assert.equal(r.writes.filter(([key])=>key===studioRecoveryStorageKey).length,1);
});
test('older recovery accumulates across editions and sees an incompatible active record arriving after initialization',()=>{
 const first=' \n{first raw}',second=JSON.stringify(document({},{content:'another edition'})),r=rig();r.entries.set(studioRecoveryStorageKey,JSON.stringify([first]));r.work.initialize();r.work.seed('realization.a',3);
 r.entries.set(studioStorageKey,second);r.work.write('realization.a',4);r.work.flush();assert.deepEqual(JSON.parse(r.entries.get(studioRecoveryStorageKey)),[first,second]);
 assert.deepEqual(JSON.parse(r.work.exportOlderText()).records.map(x=>x.raw),[first,second]);assert.equal(r.work.olderRecordCount,2);
});
test('damaged recovery storage remains exportable and cannot be overwritten by a save or import',()=>{
 const raw='{incompatible active',archive='{damaged recovery archive',r=rig(raw);r.entries.set(studioRecoveryStorageKey,archive);r.work.initialize();r.work.seed('realization.a',3);r.work.write('realization.a',4);r.work.flush();
 assert.equal(r.entries.get(studioStorageKey),raw);assert.equal(r.entries.get(studioRecoveryStorageKey),archive);assert.equal(r.work.values['realization.a'],4);
 const recovered=JSON.parse(r.work.exportOlderText());assert.deepEqual(recovered.records,[{raw}]);assert.equal(recovered.unreadableRecoveryRaw,archive);
 assert.throws(()=>r.work.importText(text({'realization.a':12}),r.work.beginImport()),/recovery copy could not be read/);assert.equal(r.entries.get(studioStorageKey),raw);assert.equal(r.writes.length,0);
});
test('saved values survive fresh default registration and exported records are detached snapshots',()=>{
 const r=rig(text({'realization.a':11}));r.work.initialize();r.work.seed('realization.a',7);const exported=readStudioRecord(r.work.exportText(),identity);exported.values['realization.a']=1;
 assert.equal(r.work.values['realization.a'],11);assert.equal(r.writes.length,0);assert.equal(readStudioRecord(r.work.exportText(),identity).values['realization.a'],11);
});
test('invalid import preserves active inputs, active storage, backup and pending learner edits',()=>{
 const r=rig(text({'realization.a':7}));r.entries.set(studioStorageKey+'-before-import','old recovery');r.work.initialize();r.work.write('realization.a',8);const before=r.entries.get(studioStorageKey);assert.throws(()=>r.work.importText(text({'sensor.options':{steps:10000}}),r.work.beginImport()));
 assert.equal(r.work.values['realization.a'],8);assert.equal(r.entries.get(studioStorageKey),before);assert.equal(r.entries.get(studioStorageKey+'-before-import'),'old recovery');r.tick();assert.equal(readStudioRecord(r.entries.get(studioStorageKey),identity).values['realization.a'],8);
});
test('backup-write failure and active-write failure cannot swap live workspace; previous backup is restored',()=>{
 for(const failingKey of [studioStorageKey,studioStorageKey+'-before-import']){const original=text({'realization.a':7}),backup=text({'realization.a':3}),r=rig(original);r.entries.set(studioStorageKey+'-before-import',backup);r.work.initialize();r.fail(k=>k===failingKey);assert.throws(()=>r.work.importText(text({'realization.a':12}),r.work.beginImport()),/quota/);assert.equal(r.work.values['realization.a'],7);assert.equal(r.entries.get(studioStorageKey),original);assert.equal(r.entries.get(studioStorageKey+'-before-import'),backup);assert.equal(r.work.generation,0);}
});
test('successful import saves the latest pending workspace and canceled timer/effect callbacks cannot overwrite it',()=>{
 const r=rig(text({'realization.a':7}));r.work.initialize();const oldGeneration=r.work.generation;r.work.write('realization.a',9);const stale=r.jobs.at(-1).fn;r.work.importText(text({'realization.a':12}),r.work.beginImport());stale();r.work.write('realization.a',1,oldGeneration);r.work.seed('realization.b',2,oldGeneration);
 assert.deepEqual(r.work.values,{'realization.a':12});assert.equal(readStudioRecord(r.entries.get(studioStorageKey),identity).values['realization.a'],12);assert.equal(readStudioRecord(r.entries.get(studioStorageKey+'-before-import'),identity).values['realization.a'],9);
});
test('reordered asynchronous imports and edits during file reads cannot replace newer work',()=>{
 const r=rig();r.work.initialize();const first=r.work.beginImport(),second=r.work.beginImport();r.work.importText(text({'realization.a':12}),second);assert.throws(()=>r.work.importText(text({'realization.a':3}),first),/superseded/);assert.equal(r.work.values['realization.a'],12);
 const pending=r.work.beginImport();r.work.write('realization.a',14);assert.throws(()=>r.work.importText(text({'realization.a':2}),pending),/superseded/);assert.equal(r.work.values['realization.a'],14);
 const afterStop=r.work.beginImport();r.work.stop();assert.throws(()=>r.work.importText(text({'realization.a':1}),afterStop),/superseded/);
});
test('restore is a reversible workspace swap and storage failure does not falsely replace current inputs',()=>{
 const r=rig(text({'realization.a':7}));r.work.initialize();r.work.importText(text({'realization.a':12}),r.work.beginImport());r.work.restorePrevious();assert.equal(r.work.values['realization.a'],7);r.work.restorePrevious();assert.equal(r.work.values['realization.a'],12);
 r.fail(k=>k===studioStorageKey);assert.throws(()=>r.work.restorePrevious());assert.equal(r.work.values['realization.a'],12);assert.equal(readStudioRecord(r.entries.get(studioStorageKey),identity).values['realization.a'],12);
});
test('latest edit wins debouncing, shutdown flushes it, and failed storage retains exportable inputs',()=>{
 const r=rig();r.work.initialize();r.work.seed('realization.a',7);r.work.write('realization.a',8);const stale=r.jobs.at(-1).fn;r.work.write('realization.a',9);stale();assert.equal(r.writes.length,0);r.work.stop();assert.equal(readStudioRecord(r.entries.get(studioStorageKey),identity).values['realization.a'],9);
 r.fail(()=>true);r.work.write('realization.a',10);r.tick();assert.equal(readStudioRecord(r.work.exportText(),identity).values['realization.a'],10);assert.equal(readStudioRecord(r.entries.get(studioStorageKey),identity).values['realization.a'],9);assert.match(r.statuses.at(-1),/remain in this session/);
});
