import test from 'node:test';
import assert from 'node:assert/strict';
import {createAutomationScenario,automationCases,createAutomationRun,advanceAutomation,runAutomationScenario,replayAutomationJournal,evaluateAutomationEnvironment,automationMetrics} from '../src/lib/automation-execution.ts';
import {createAutomationEnvironment} from '../src/lib/automation-fixtures.ts';
import {automationVersion,validateAutomationScenario,canonicalJson} from '../src/lib/automation-contracts.ts';
import {validateAutomationCall,executeAutomationTool,authorizeAutomationCall,automationCallFingerprint} from '../src/lib/automation-tools.ts';
import {automationStorageKey,createAutomationWorkspace,validateAutomationSnapshot,serializeAutomationArchive,readAutomationArchive} from '../src/lib/automation-journal.ts';
const scenario=patch=>createAutomationScenario(patch);
const finish=patch=>runAutomationScenario(scenario(patch));
const reserve={name:'reserve_part',arguments:{assetId:'FAN-7',partId:'FILTER-A',quantity:2,evidenceId:'manual-fan-7',idempotencyKey:'test:reserve'}};
const fingerprint=call=>automationCallFingerprint(call);
function memory(){const map=new Map();let fail=null;return{map,setFailure(fn){fail=fn;},getItem:k=>map.get(k)??null,setItem(k,v){if(fail?.(k,v))throw Error('Injected storage failure');map.set(k,v);}};}
function factory(storage){let id=0;return()=>createAutomationWorkspace(storage,()=>`test-slot-${++id}`);}
function stepUntil(workspace,predicate){for(let i=0;i<300;i++){const s=workspace.snapshot,state=replayAutomationJournal(s.document);if(predicate(s,state))return s;if(['completed','failed','canceled'].includes(state.status)&&!state.queue)throw Error('Stopped before requested boundary');const command=state.status==='awaiting-approval'?{kind:'approve',fingerprint:fingerprint(state.pending.call)}:{kind:'next'};workspace.advance(command);if(workspace.error)throw Error(workspace.error);}throw Error('Iteration budget');}
function complete(workspace){return stepUntil(workspace,(_,s)=>['completed','failed','canceled'].includes(s.status)&&!s.queue);}
function pendingReservationResult(workspace){return stepUntil(workspace,(_,s)=>s.pending?.call.name==='reserve_part'&&s.pending.stage==='result');}

test('normal task actually consumes two units and creates one linked work order in both modes',()=>{
 for(const mode of ['fixed-workflow','authored-policy']){const r=finish({mode});assert.equal(r.environment.stock['FILTER-A'],2);assert.equal(r.environment.stock['FILTER-B'],3);assert.deepEqual(r.environment.reservations,[{id:'reservation-1',assetId:'FAN-7',partId:'FILTER-A',quantity:2,evidenceId:'manual-fan-7'}]);assert.equal(r.environment.workOrders[0].reservationId,'reservation-1');assert.equal(r.environment.workOrders.length,1);assert.equal(r.environment.receipts.length,2);assert.equal(replayAutomationJournal(r.document).status,'completed');assert.equal(evaluateAutomationEnvironment(r).taskCorrect,true);}
});
test('normal timing is hand-derived from four services, proposals, validations, admission and review',()=>{
 const r=finish(),m=automationMetrics(r);assert.equal(m.serviceMs,40+60+80+50);assert.equal(m.queueMs,50);assert.equal(m.approvalMs,200);assert.equal(m.otherMs,4*5+4*1+4*1);assert.equal(m.elapsedMs,508);assert.equal(m.elapsedMs,m.serviceMs+m.queueMs+m.approvalMs+m.otherMs);
 const bytes=r.document.events.filter(x=>x.kind==='call-proposed').reduce((n,x)=>n+Buffer.byteLength(canonicalJson(x.data.call),'utf8'),0);assert.equal(m.requestPayloadBytes,bytes);
});
test('queue delay changes latency without changing outputs or service work',()=>{
 const a=finish({admissionDelayMs:0}),b=finish({admissionDelayMs:800});assert.equal(automationMetrics(b).elapsedMs-automationMetrics(a).elapsedMs,800);assert.equal(automationMetrics(b).serviceMs,automationMetrics(a).serviceMs);assert.deepEqual(a.environment.reservations,b.environment.reservations);
});
test('duplicate delivery is queued and deduplicated without a second set of calls',()=>{
 const a=finish(),b=finish({caseId:'duplicate-delivery'});assert.equal(replayAutomationJournal(b.document).deliveries,2);assert.equal(replayAutomationJournal(b.document).duplicateDeliveries,1);assert.equal(automationMetrics(a).calls,automationMetrics(b).calls);assert.deepEqual(a.environment.reservations,b.environment.reservations);assert.equal(b.document.events.at(-1).kind,'delivery-deduplicated');
});
test('approval is required before reservation service and a stale fingerprint is rejected without change',()=>{
 const r=runAutomationScenario(scenario(),'wait'),s=replayAutomationJournal(r.document);assert.equal(s.status,'awaiting-approval');assert.equal(r.environment.reservations.length,0);assert.equal(r.document.events.some(x=>x.kind==='service-started'&&x.data.callId===s.pending.id),false);
 const bad=advanceAutomation(r,{kind:'approve',fingerprint:fingerprint({...reserve,arguments:{...reserve.arguments,quantity:3}})});assert.match(bad.error,/stale/);assert.deepEqual(bad.snapshot,r);assert.equal(bad.changed,false);
 const yes=advanceAutomation(r,{kind:'approve',fingerprint:fingerprint(s.pending.call)});assert.equal(replayAutomationJournal(yes.snapshot.document).pending.stage,'service');assert.equal(yes.snapshot.environment.reservations.length,0);
});
test('declined review stops before any write',()=>{const r=runAutomationScenario(scenario(),'deny');assert.equal(replayAutomationJournal(r.document).status,'failed');assert.equal(r.environment.receipts.length,0);assert.equal(r.environment.stock['FILTER-A'],4);});
test('schema validation rejects wrong types, extra fields, nonintegral quantities and unknown tools',()=>{
 for(const call of [{...reserve,arguments:{...reserve.arguments,quantity:'2'}},{...reserve,arguments:{...reserve.arguments,quantity:1.5}},{...reserve,arguments:{...reserve.arguments,quantity:-1}},{...reserve,arguments:{...reserve.arguments,quantity:11}},{...reserve,arguments:{...reserve.arguments,grantAuthority:true}},{name:'shell',arguments:{}},{name:'read_asset',arguments:[]},{...reserve,unknown:true}])assert.throws(()=>validateAutomationCall(call));
 assert.deepEqual(validateAutomationCall(reserve),reserve);
});
test('schema failure consumes a proposal but no service; authored repair is an actual subsequent valid call',()=>{
 const a=finish({caseId:'schema-error'}),b=finish({caseId:'schema-error',mode:'authored-policy'});assert.equal(a.environment.reservations.length,0);assert.equal(replayAutomationJournal(a.document).status,'failed');assert.equal(evaluateAutomationEnvironment(b).taskCorrect,true);const p=b.document.events.filter(x=>x.kind==='call-proposed'&&x.data.call.name==='reserve_part');assert.equal(p.length,2);assert.equal(typeof p[0].data.call.arguments.quantity,'string');assert.equal(typeof p[1].data.call.arguments.quantity,'number');assert.equal(b.document.events.filter(x=>x.kind==='service-started'&&[p[0].data.callId].includes(x.data.callId)).length,0);
});
test('write authority is independent of a valid schema and leaves inventory unchanged',()=>{
 assert.equal(authorizeAutomationCall(validateAutomationCall(reserve),scenario({caseId:'authority-denied'})).allowed,false);const r=finish({caseId:'authority-denied',mode:'authored-policy'});assert.equal(r.environment.stock['FILTER-A'],4);assert.equal(r.environment.receipts.length,0);assert.ok(r.document.events.some(x=>x.kind==='authority-denied'));assert.equal(r.document.events.some(x=>x.kind==='approval-requested'),false);
});
test('malicious retrieved instructions remain visible data; proposed export is denied outside the policy',()=>{
 const r=finish({caseId:'malicious-manual',mode:'authored-policy'});assert.match(r.environment.manuals[0].text,/export/);const p=r.document.events.find(x=>x.kind==='call-proposed'&&x.data.call.name==='export_registry');assert.ok(p);assert.equal(p.data.policy.kind,'authored-policy');assert.ok(r.document.events.some(x=>x.kind==='authority-denied'&&x.data.callId===p.data.callId));assert.equal(r.environment.exports.length,0);assert.equal(evaluateAutomationEnvironment(r).taskCorrect,true);
});
test('a supported wrong-entity work order fails the independent goal oracle despite policy completion',()=>{
 const r=finish({caseId:'wrong-entity',mode:'authored-policy'}),v=evaluateAutomationEnvironment(r);assert.equal(replayAutomationJournal(r.document).status,'completed');assert.equal(r.environment.workOrders[0].assetId,'FAN-9');assert.equal(v.sourceSupported,1);assert.equal(v.sourceSupportDenominator,1);assert.equal(v.taskCorrect,false);assert.equal(r.environment.stock['FILTER-A'],4);assert.equal(r.environment.stock['FILTER-B'],2);
});
test('server idempotency returns the original effect and rejects changed arguments under the same key',()=>{
 const a=executeAutomationTool(validateAutomationCall(reserve),createAutomationEnvironment(),80),b=executeAutomationTool(validateAutomationCall(reserve),a.environment,160);assert.equal(a.committed,true);assert.equal(b.committed,false);assert.equal(b.result.reusedReceipt,true);assert.deepEqual(b.environment,a.environment);assert.deepEqual(b.result.value,a.result.value);
 const c=executeAutomationTool(validateAutomationCall({...reserve,arguments:{...reserve.arguments,quantity:1}}),a.environment,200);assert.equal(c.result.code,'idempotency-conflict');assert.deepEqual(c.environment,a.environment);
});
test('lost reply records caller uncertainty while the external write is already committed',()=>{
 let r=createAutomationRun(scenario({caseId:'commit-timeout'}));for(let i=0;i<100;i++){const s=replayAutomationJournal(r.document);if(s.status==='recovering')break;r=advanceAutomation(r,s.status==='awaiting-approval'?{kind:'approve',fingerprint:fingerprint(s.pending.call)}:{kind:'next'}).snapshot;}
 assert.equal(replayAutomationJournal(r.document).status,'recovering');assert.equal(replayAutomationJournal(r.document).observations.at(-1).result.code,'ambiguous-timeout');assert.equal(r.environment.stock['FILTER-A'],2);assert.equal(r.environment.reservations.length,1);assert.equal(r.environment.workOrders.length,0);assert.equal(evaluateAutomationEnvironment(r).taskCorrect,false);validateAutomationSnapshot(r);
});
test('fixed retry and authored receipt lookup both recover one committed reservation',()=>{
 for(const mode of ['fixed-workflow','authored-policy']){const r=finish({caseId:'commit-timeout',mode});assert.equal(evaluateAutomationEnvironment(r).taskCorrect,true);assert.equal(r.environment.reservations.length,1);assert.equal(r.environment.stock['FILTER-A'],2);assert.equal(r.document.events.filter(x=>x.kind==='transport-timeout').length,1);assert.equal(r.document.events.some(x=>x.kind==='call-proposed'&&x.data.call.name==='lookup_receipt'),mode==='authored-policy');validateAutomationSnapshot(r);}
});
test('cancel before a write prevents effects; cancel after commit preserves the existing effect',()=>{
 const a=finish({caseId:'cancel-before-write'}),b=finish({caseId:'cancel-after-commit'});assert.equal(replayAutomationJournal(a.document).status,'canceled');assert.equal(replayAutomationJournal(b.document).status,'canceled');assert.equal(a.environment.receipts.length,0);assert.equal(b.environment.reservations.length,1);assert.equal(b.environment.workOrders.length,0);assert.equal(b.environment.stock['FILTER-A'],2);assert.equal(evaluateAutomationEnvironment(b).taskCorrect,false);
});
test('manual cancellation while awaiting approval does not manufacture approval or a result',()=>{
 const r=runAutomationScenario(scenario(),'wait'),c=advanceAutomation(r,{kind:'cancel'});assert.equal(c.error,null);assert.equal(replayAutomationJournal(c.snapshot.document).status,'canceled');assert.equal(c.snapshot.environment.reservations.length,0);assert.equal(c.snapshot.document.events.filter(x=>x.kind==='approval-granted').length,0);
});
test('the exact sufficient call budget succeeds, one fewer does not silently complete',()=>{
 assert.equal(evaluateAutomationEnvironment(finish({maxCalls:4})).taskCorrect,true);const r=finish({maxCalls:3});assert.equal(replayAutomationJournal(r.document).status,'failed');assert.equal(evaluateAutomationEnvironment(r).taskCorrect,false);assert.equal(r.environment.reservations.length,1);assert.equal(r.environment.workOrders.length,0);
});
test('all 18 mode/case combinations are deterministic and independent replay verifies every final environment',()=>{
 for(const c of automationCases)for(const mode of ['fixed-workflow','authored-policy']){const s=scenario({caseId:c.id,mode}),a=runAutomationScenario(s),b=runAutomationScenario(s);assert.deepEqual(a,b);assert.deepEqual(validateAutomationSnapshot(a),a);assert.deepEqual(readAutomationArchive(serializeAutomationArchive(a)),a);assert.equal(automationMetrics(a).elapsedMs,automationMetrics(a).queueMs+automationMetrics(a).serviceMs+automationMetrics(a).approvalMs+automationMetrics(a).otherMs);}
});
test('every live prefix, including approval and uncertain write, is a valid replayable archive',()=>{
 for(const caseId of ['normal','schema-error','commit-timeout','malicious-manual']){let r=createAutomationRun(scenario({caseId,mode:'authored-policy'}));for(let i=0;i<200;i++){validateAutomationSnapshot(r);const s=replayAutomationJournal(r.document);if(['completed','failed','canceled'].includes(s.status))break;const next=advanceAutomation(r,s.status==='awaiting-approval'?{kind:'approve',fingerprint:fingerprint(s.pending.call)}:{kind:'next'});assert.equal(next.error,null);r=next.snapshot;}}
});
test('forged output, inventory, approval and reordered events are rejected by import',()=>{
 const original=finish();
 const output=structuredClone(original);output.document.events.find(x=>x.kind==='tool-result').data.result.value.label='Invented output';assert.throws(()=>validateAutomationSnapshot(output),/result/);
 const stock=structuredClone(original);stock.environment.stock['FILTER-A']=4;assert.throws(()=>validateAutomationSnapshot(stock),/External state/);
 const approval=structuredClone(original);approval.document.events.find(x=>x.kind==='approval-granted').data.fingerprint='different payload';assert.throws(()=>validateAutomationSnapshot(approval),/approval/);
 const order=structuredClone(original);[order.document.events[4],order.document.events[5]]=[order.document.events[5],order.document.events[4]];assert.throws(()=>validateAutomationSnapshot(order),/journal/);
});
test('scenario and archive resource/identity bounds reject untrusted input',()=>{
 for(const patch of [{maxCalls:0},{maxCalls:31},{admissionDelayMs:NaN},{approvalWaitMs:60001},{caseId:'imaginary'},{mode:'llm'},{runId:'../../other'}])assert.throws(()=>validateAutomationScenario(scenario(patch)));
 assert.throws(()=>validateAutomationScenario({...scenario(),unknown:true}));assert.throws(()=>readAutomationArchive(' '.repeat(500001)));assert.throws(()=>readAutomationArchive(JSON.stringify({kind:'atlas-automation-archive',version:'old',snapshot:finish()})));
});
test('returned snapshots and archives do not alias live state',()=>{
 const storage=memory(),open=factory(storage),w=open();w.start(scenario());const r=w.snapshot;r.environment.stock['FILTER-A']=99;r.document.events[0].detail='changed';assert.equal(w.snapshot.environment.stock['FILTER-A'],4);assert.notEqual(w.snapshot.document.events[0].detail,'changed');
});
test('reload during approval preserves the exact pending action and still requires approval',()=>{
 const storage=memory(),open=factory(storage),w=open();w.start(scenario());stepUntil(w,(_,s)=>s.status==='awaiting-approval');const reloaded=open();assert.equal(reloaded.error,null);assert.deepEqual(reloaded.snapshot,w.snapshot);reloaded.advance();assert.equal(replayAutomationJournal(reloaded.snapshot.document).status,'awaiting-approval');assert.equal(reloaded.snapshot.environment.reservations.length,0);
});
test('failed intent journal write prevents the external tool from starting',()=>{
 const storage=memory(),open=factory(storage),w=open();w.start(scenario());stepUntil(w,(_,s)=>s.pending?.call.name==='reserve_part'&&s.pending.stage==='service');const before=storage.getItem(automationStorageKey);
 storage.setFailure((k,v)=>k===automationStorageKey&&JSON.parse(v).document.events.at(-1).kind==='service-started');w.advance();assert.match(w.error,/storage/);assert.equal(storage.getItem(automationStorageKey),before);assert.equal(w.snapshot.environment.receipts.length,0);assert.equal(open().snapshot.environment.receipts.length,0);
});
test('failed external commit keeps both old inventory and the durable pending service intent',()=>{
 const storage=memory(),open=factory(storage),w=open();w.start(scenario());pendingReservationResult(w);const before=w.snapshot;
 storage.setFailure(k=>k.includes('-environment-'));w.advance();assert.match(w.error,/storage/);assert.deepEqual(w.snapshot.environment,before.environment);assert.equal(replayAutomationJournal(open().snapshot.document).pending.stage,'result');storage.setFailure(null);complete(w);assert.equal(w.snapshot.environment.reservations.length,1);
});
test('commit followed by failed result journaling survives reload and replays without duplicate effect',()=>{
 const storage=memory(),open=factory(storage),w=open();w.start(scenario());pendingReservationResult(w);const priorHead=storage.getItem(automationStorageKey);
 storage.setFailure((k,v)=>k===automationStorageKey&&JSON.parse(v).document.events.at(-1).kind==='tool-result');w.advance();assert.match(w.error,/storage/);assert.equal(storage.getItem(automationStorageKey),priorHead);assert.equal(w.snapshot.environment.stock['FILTER-A'],2);
 storage.setFailure(null);const reloaded=open();assert.equal(reloaded.error,null);assert.equal(reloaded.snapshot.environment.reservations.length,1);complete(reloaded);assert.equal(reloaded.snapshot.environment.stock['FILTER-A'],2);assert.equal(reloaded.snapshot.environment.reservations.length,1);assert.ok(reloaded.snapshot.document.events.some(x=>x.kind==='service-replayed'));assert.equal(evaluateAutomationEnvironment(reloaded.snapshot).taskCorrect,true);validateAutomationSnapshot(reloaded.snapshot);assert.equal(open().error,null);
});
test('timeout-journal failure also reconciles the already committed effect after reload',()=>{
 const storage=memory(),open=factory(storage),w=open();w.start(scenario({caseId:'commit-timeout',mode:'authored-policy'}));pendingReservationResult(w);
 storage.setFailure((k,v)=>k===automationStorageKey&&JSON.parse(v).document.events.at(-1).kind==='transport-timeout');w.advance();assert.equal(w.snapshot.environment.reservations.length,1);assert.match(w.error,/storage/);storage.setFailure(null);const reloaded=open();complete(reloaded);assert.equal(evaluateAutomationEnvironment(reloaded.snapshot).taskCorrect,true);assert.equal(reloaded.snapshot.environment.reservations.length,1);validateAutomationSnapshot(reloaded.snapshot);
});
test('import prepares a new environment slot before switching active identity; failed head write retains old run',()=>{
 const storage=memory(),open=factory(storage),w=open();w.start(scenario());const old=w.snapshot,raw=storage.getItem(automationStorageKey);storage.setFailure(k=>k===automationStorageKey);const candidate=serializeAutomationArchive(finish({caseId:'wrong-entity',mode:'authored-policy'}));assert.equal(w.restore(candidate),null);assert.equal(storage.getItem(automationStorageKey),raw);assert.deepEqual(w.snapshot,old);assert.deepEqual(open().snapshot,old);assert.ok(storage.getItem(automationStorageKey+'-older'));
});
test('backup failure prevents both active replacement and import without losing live work',()=>{
 const storage=memory(),open=factory(storage),w=open();w.start(scenario());pendingReservationResult(w);const before=w.snapshot,raw=storage.getItem(automationStorageKey);storage.setFailure(k=>k.endsWith('-older'));assert.equal(w.restore(serializeAutomationArchive(finish())),null);assert.deepEqual(w.snapshot,before);assert.equal(storage.getItem(automationStorageKey),raw);assert.equal(w.start(scenario({runId:'another-run'})),null);assert.deepEqual(w.snapshot,before);
});
test('invalid old raw journal is retained exactly before a new run starts and recovery exports it',()=>{
 const storage=memory(),raw=' { not compatible : untouched ';storage.map.set(automationStorageKey,raw);const w=factory(storage)();assert.ok(w.error);assert.equal(w.snapshot,null);assert.equal(storage.getItem(automationStorageKey),raw);w.start(scenario());assert.equal(w.error,null);assert.equal(JSON.parse(storage.getItem(automationStorageKey+'-older'))[0].journalRaw,raw);assert.equal(JSON.parse(JSON.parse(w.recoveryText()).olderRaw)[0].journalRaw,raw);
});
test('malformed environment is exported as exact raw recovery and not silently discarded',()=>{
 const storage=memory(),open=factory(storage),w=open();w.start(scenario());const slot=JSON.parse(storage.getItem(automationStorageKey)).slot,raw='broken external record';storage.map.set(`${automationStorageKey}-environment-${slot}`,raw);const reload=open();assert.ok(reload.error);assert.equal(JSON.parse(reload.recoveryText()).environmentRaw,raw);
});
test('corrupted result in imported archive never replaces the active journal',()=>{
 const storage=memory(),w=factory(storage)();w.start(scenario());const raw=storage.getItem(automationStorageKey),archive=JSON.parse(serializeAutomationArchive(finish()));archive.snapshot.environment.stock['FILTER-A']=100;assert.equal(w.restore(JSON.stringify(archive)),null);assert.equal(storage.getItem(automationStorageKey),raw);assert.match(w.error,/External state/);
});
test('a stale second workspace cannot overwrite a newer journal or perform an external effect',()=>{
 const storage=memory(),open=factory(storage),a=open();a.start(scenario());const b=open();a.advance();const raw=storage.getItem(automationStorageKey);b.advance();assert.match(b.error,/Another workspace/);assert.equal(storage.getItem(automationStorageKey),raw);assert.equal(b.snapshot.environment.receipts.length,0);
});
test('removing exported recovery requires its unchanged exact raw value and never changes active work',()=>{
 const storage=memory(),open=factory(storage),w=open();w.start(scenario());w.start(scenario({runId:'second'}));const exported=w.olderRaw(),active=storage.getItem(automationStorageKey);assert.equal(w.clearExportedOlder('stale'),false);assert.equal(w.olderRaw(),exported);assert.equal(w.clearExportedOlder(exported),true);assert.equal(w.olderRaw(),'[]');assert.equal(storage.getItem(automationStorageKey),active);
});
test('future model-policy port records provenance and passes through the same runtime gates',()=>{
 const s=scenario(),r=createAutomationRun(s);let next=advanceAutomation(r).snapshot;
 const adapter={identity:{kind:'actual-model',provider:'test-stub-not-a-real-provider',model:'contract-test-only',configurationId:'fixture'},decide:()=>({kind:'call',call:{name:'export_registry',arguments:{destination:'outside.example'}}})};
 next=advanceAutomation(next,{kind:'next'},undefined,adapter).snapshot;assert.equal(next.document.events.at(-1).data.policy.model,'contract-test-only');next=advanceAutomation(next).snapshot;next=advanceAutomation(next).snapshot;assert.equal(next.document.events.at(-1).kind,'authority-denied');assert.equal(next.environment.exports.length,0);
 // This verifies an adapter contract using a stub; it supplies no actual-model performance evidence.
});
