import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {buildCellAcceptance,cellDefaults} from '../../../src/lib/process-cell-acceptance.ts';
import {buildEvaluationReport,evaluationDefaults} from '../../../src/lib/evaluation-report.ts';
import {runForecast,decisionDefaults,runCodeContract} from '../../../src/lib/application-decisions.ts';
import {buildEccRecovery,eccDefaults} from '../../../src/lib/hardware-reliability.ts';
import {runClosedLoop,defaultControlInput} from '../../../src/lib/closed-loop.ts';
import {buildFactoryExecution,factoryDefaults,factoryModels} from '../../../src/lib/factory-execution.ts';
import {buildMemoryWorkload,memoryWorkloadDefaults,memoryWorkloadVersion,observedRefreshBusyNs} from '../../../src/lib/memory-workload-bridge.ts';
const close=(x,y)=>assert.ok(Math.abs(x-y)<1e-9*Math.max(1,Math.abs(y)),`${x} differs from ${y}`);
const nominal=buildCellAcceptance(cellDefaults),loaded=buildCellAcceptance({...cellDefaults,fanout:4}),oxide=buildCellAcceptance({...cellDefaults,oxideOffsetPct:20});
close(nominal.parameters.loadCapF*1e15,65.24896);close(nominal.timing.fall50Seconds*1e9,.699775851668897);close(loaded.timing.fall50Seconds/nominal.timing.fall50Seconds,loaded.parameters.loadCapF/nominal.parameters.loadCapF);assert.deepEqual(loaded.noise,nominal.noise);assert.equal(loaded.gates.find(x=>x.id==='timing').pass,false);assert.equal(oxide.gates.find(x=>x.id==='oxide').pass,false);
const audit=buildEvaluationReport(evaluationDefaults),empty=buildEvaluationReport({...evaluationDefaults,minimumConfidence:1}),leak=buildEvaluationReport({...evaluationDefaults,contaminate:true});assert.equal(audit.metrics.correct,6);assert.equal(audit.metrics.count,6);assert.equal(empty.metrics.accepted,0);assert.equal(empty.metrics.selectiveError,null);assert.equal(leak.dataset.independentFamilies,false);
const forecast=runForecast(decisionDefaults),eight=runForecast({...decisionDefaults,horizon:8}),future=runForecast({...decisionDefaults,leak:true});close(forecast.metrics.mae,3.2667956789459844);close(forecast.metrics.baselineMae,1.1041126888349895);assert.equal(forecast.metrics.count,24);assert.equal(eight.metrics.count,17);assert.equal(future.metrics.mae,0);assert.equal(future.validTemporalBoundary,false);
const identity=runCodeContract('identity','examples'),ordered=runCodeContract('ordered-clamp','boundaries');assert.equal(identity.passed,2);assert.equal(identity.boundedOracle.failures,224);assert.equal(ordered.boundedOracle.total,308);assert.equal(ordered.boundedOracle.failures,0);
const ecc=buildEccRecovery(eccDefaults);assert.equal(ecc.finalSum,54);assert.equal(ecc.totals.executedSteps,7);assert.equal(ecc.totals.discardedSteps,1);assert.equal(ecc.totals.completedSteps,6);
const controlled=runClosedLoop(defaultControlInput);assert.equal(controlled.metrics.goalReached,true);assert.equal(controlled.metrics.simulatedSeconds,12);
// Hand paths are independent of the imported decoder and clamp candidates.
const gradient=(2*1+6*3)/(2+6);assert.equal(gradient,2.5);assert.equal(10-.1*gradient,9.75);
let failures=0,total=0;for(let lo=-3;lo<=3;lo++)for(let hi=lo;hi<=3;hi++)for(let x=-5;x<=5;x++){const expected=x<lo?lo:x>hi?hi:x;total++;if(x!==expected)failures++;}assert.equal(total,308);assert.equal(failures,224);
// Added group 8: joined factory. Answers use count conservation, ΔE=PΔt and a two-version byte sum,
// not the factory scheduler or its time integration helpers as an oracle.
const factoryClean=buildFactoryExecution({...factoryDefaults,fault:'none'}),factoryReplay=buildFactoryExecution(factoryDefaults);
const fastRank=buildFactoryExecution({...factoryDefaults,fault:'none',slowRankDelayS:0}),slowRank=buildFactoryExecution({...factoryDefaults,fault:'none',slowRankDelayS:1});
assert.equal(factoryClean.status,'complete');assert.equal(factoryClean.final.rankComputations,2*3);assert.equal(factoryClean.final.executedUpdates,3);assert.deepEqual(factoryClean.checkpoints.map(c=>c.updates),[0,2,3]);
close(slowRank.final.elapsedS-fastRank.final.elapsedS,3*1);close(slowRank.final.facilityEnergyJ-fastRank.final.facilityEnergyJ,160*3);assert.deepEqual(slowRank.finalRun,fastRank.finalRun);assert.equal(slowRank.final.networkBytes,fastRank.final.networkBytes);
assert.equal(factoryReplay.final.executedUpdates,2+3);assert.equal(factoryReplay.final.rolledBackUpdates,2);assert.equal(factoryReplay.final.retainedUpdates,3);assert.equal(factoryReplay.final.durableUpdates,3);assert.equal(factoryReplay.final.rankComputations,2*(2+3));assert.equal(factoryReplay.final.rolledBackRankComputations,2*2);assert.deepEqual(factoryReplay.finalRun,factoryClean.finalRun);
const cp0=factoryClean.checkpoints.find(c=>c.updates===0),cp2=factoryClean.checkpoints.find(c=>c.updates===2);
// Byte lengths are observations of the identified serialization, not a training-memory estimate.
assert.equal(new TextEncoder().encode(cp0.raw).length,28562);assert.equal(new TextEncoder().encode(cp2.raw).length,181106);assert.equal(cp0.bytes,28562);assert.equal(cp2.bytes,181106);const capacity=28562+181106;assert.equal(capacity,209668);assert.equal(capacity-120000,89668);
const fitting=buildFactoryExecution({...factoryDefaults,rounds:2,fault:'none',storageLimitBytes:capacity}),short=buildFactoryExecution({...factoryDefaults,rounds:2,fault:'none',storageLimitBytes:capacity-1});
assert.equal(fitting.status,'complete');assert.equal(fitting.final.durableUpdates,2);assert.equal(short.status,'blocked');assert.equal(short.final.retainedUpdates,2);assert.equal(short.final.durableUpdates,0);assert.equal(short.final.checkpointWriteBytes,0);assert.equal(short.checkpoints.length,1);assert.equal(short.checkpoints[0].raw,cp0.raw);
const writtenOnly=buildFactoryExecution({...factoryDefaults,fault:'checkpoint-commit',recover:false});assert.equal(writtenOnly.final.durableUpdates,0);assert.equal(writtenOnly.final.checkpointWriteBytes,181106);assert.equal(writtenOnly.checkpoints[0].raw,cp0.raw);assert.equal(writtenOnly.checkpoints.length,1);
for(const replica of factoryReplay.finalRun.round.collective.replicas)assert.deepEqual(replica.weights,factoryReplay.finalRun.state.weights);

// Added group 9: joined memory. Hand dot products, bit changes, allocation arithmetic and
// intervention invariants are independent of the imported machine/ECC/matrix helper algorithms.
const memoryRun=patch=>buildMemoryWorkload({...memoryWorkloadDefaults,...patch});
const tinySettings={specimen:'two',fault:'none',refreshEveryNs:0},tiny=memoryRun(tinySettings);
const handC=[[1*5+2*7,1*6+2*8],[3*5+4*7,3*6+4*8]];
assert.deepEqual(handC,[[19,22],[43,50]]);assert.deepEqual(tiny.finalOutput,handC);assert.equal(tiny.totals.macs,2*2*2);assert.equal(tiny.placement.allocatedBytes,3*16);assert.equal(tiny.workload.words.length*4,2*4*4);
assert.deepEqual(tiny.workload.words.find(w=>w.id==='B[0,0]').bytes,[5,0,0,0]);
const corrected=memoryRun({...tinySettings,fault:'single-data'}),detected=memoryRun({...tinySettings,fault:'double-data'}),unchecked=memoryRun({...tinySettings,fault:'double-data',protection:'unchecked'});
assert.deepEqual(corrected.finalOutput,handC);assert.equal(detected.status,'ecc-blocked');assert.equal(detected.finalOutput,null);assert.equal(detected.totals.macs,0);assert.equal(detected.totals.writeTransactionBytes,0);
const changedB=5^0b0011;assert.equal(changedB,6);assert.deepEqual(unchecked.reads.find(r=>r.faultInjected).read.deliveredBytes,[6,0,0,0]);assert.deepEqual(unchecked.finalOutput,[[1*changedB+2*7,22],[3*changedB+4*7,50]]);assert.equal(unchecked.status,'silent-corruption');
const local=memoryRun({fault:'none',payloadBudgetBytes:144});assert.equal(local.placement.allocatedBytes,3*48);
for(const bTier of ['hbm','host-stage','read-tier-stage']){const blocked=memoryRun({fault:'none',payloadBudgetBytes:96,bTier});assert.equal(blocked.status,'placement-blocked');assert.equal(blocked.commands.length,0);assert.equal(blocked.placement.staging.length,0);}
for(const bTier of ['host-stage','read-tier-stage']){const remote=memoryRun({fault:'none',payloadBudgetBytes:144,bTier});assert.equal(remote.placement.remoteSourceReadBytes,48);assert.equal(remote.placement.destinationStagingWriteBytes,48);assert.equal(remote.placement.sourceBBytes.length,48);assert.deepEqual(remote.placement.sourceBBytes.slice(36),Array(12).fill(0));assert.equal(remote.placement.staging.length,3);assert.equal(remote.totals.stagingNs,20+3*8);close(remote.totals.durationNs-local.totals.durationNs,44);assert.deepEqual(remote.finalOutput,local.finalOutput);assert.deepEqual(remote.commands,local.commands);for(const cmd of remote.commandTimeline){close(cmd.joinedStartNs-cmd.machineStartNs,44);close(cmd.joinedEndNs-cmd.machineEndNs,44);}assert.equal(memoryRun({...tinySettings,bTier}).totals.stagingNs,20+8);}
const contact=memoryRun({registrationOffsetUm:0}),sliver=memoryRun({registrationOffsetUm:9.9}),noContact=memoryRun({registrationOffsetUm:10}),noEvidence=memoryRun({qualification:'not-provided'});
close(contact.qualification.overlapFraction,1);close(sliver.qualification.overlapFraction,.01);assert.deepEqual(sliver.totals,contact.totals);assert.deepEqual(sliver.finalOutput,contact.finalOutput);for(const blocked of [noContact,noEvidence]){assert.equal(blocked.status,'admission-blocked');assert.equal(blocked.commands.length,0);assert.equal(blocked.totals.macs,0);assert.equal(blocked.totals.durationNs,0);}
const refreshed=memoryRun({fault:'triple',refreshEveryNs:96}),notRefreshed=memoryRun({fault:'triple',refreshEveryNs:0});assert.equal(refreshed.status,'silent-corruption');assert.equal(notRefreshed.status,'silent-corruption');assert.deepEqual(refreshed.finalOutput,notRefreshed.finalOutput);assert.ok(refreshed.totals.durationNs>notRefreshed.totals.durationNs);assert.equal(notRefreshed.totals.refreshes,0);assert.ok(refreshed.totals.refreshes>0);for(const cmd of refreshed.commands.filter(c=>c.kind==='REF'))assert.equal(cmd.endNs-cmd.startNs,12);
assert.equal(observedRefreshBusyNs([{kind:'REF',startNs:20,endNs:32}],25),5);

const dir=dirname(fileURLToPath(import.meta.url));for(const name of fs.readdirSync(dir).filter(x=>x.endsWith('.md'))){const text=fs.readFileSync(resolve(dir,name),'utf8');assert.ok(!text.includes('/Users/'));for(const [,link]of text.matchAll(/\]\(([^)]+)\)/g))if(!/^https?:/.test(link))assert.ok(fs.existsSync(resolve(dir,link)),link);}
console.log(JSON.stringify({status:'pass',contractGroups:9,preservedContractGroups:7,addedContractGroups:['joined-factory','joined-memory'],models:{factory:factoryModels,memoryWorkload:memoryWorkloadVersion},checkedAt:'2026-09-07',actor:{type:'agent',id:'/root/curriculum_assessment'},scope:'Existing seven groups preserved; added independent count, delta-time/energy, byte-capacity, dot-product, bit-change, staging and admission contracts. No learner, physical-device, assistive-technology or specialist observations.'},null,2));
