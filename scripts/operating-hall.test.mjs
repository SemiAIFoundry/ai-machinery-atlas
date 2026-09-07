import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateOperatingHall, sampleOperatingHall, validateOperatingHallScenario, GATES } from '../src/lib/operating-hall.ts';
import { createOperatingHallScenario, denseGemmWorkload, operatingHallExamples } from '../src/lib/operating-hall-scenarios.ts';

const close = (actual, expected, message = '') => assert.ok(Math.abs(actual - expected) <= 1e-8 * Math.max(1, Math.abs(expected)), `${message}: ${actual} ≈ ${expected}`);
const simulate = edit => { const s = fixture(); edit?.(s); return simulateOperatingHall(s); };

/** Hand-computable independent fixture: 1 step/s; 10 run + 2 write + 1 commit. */
function fixture() {
  return {
    kind: 'synthetic-operating-hall', version: 1,
    workload: { kind: 'synthetic-fixed-global-workload', id: 'counted', label: 'Counted example',
      operationsPerStep: 100, memoryBytesPerStep: 10, networkBytesPerStep: 0,
      checkpointBytes: 200, assumptions: ['Synthetic: 100 operations define one work step.'] },
    installed: { racks: 1, packagesPerRack: 1 },
    electrical: { facilityFeedLimitW: 100000, rackBusV: 10, rackInputLimitA: 1000,
      packageBusV: 2, packageRailLimitA: 1000, conversionEfficiency: 1, pue: 1.2,
      auxiliaryRackW: 20, packageRunW: 80, packageCheckpointW: 40, packageRecoveryW: 20 },
    cooling: { massFlowKgS: 1, specificHeatJkgK: 100, maxRiseK: 10 },
    service: { computeOpsPerPackageS: 100, memoryBytesPerPackageS: 100,
      networkBytesPerRackS: 100, networkHallLimitBytesS: 10000,
      checkpointBytesPerRackS: 100, checkpointHallLimitBytesS: 10000, communication: 'serialized' },
    commissioning: { electrical: 0, thermal: 0, fabric: 0, software: 0, operations: 0 },
    checkpoint: { intervalRunS: 10, commitLatencyS: 1 },
    faults: [], durationS: 35, sampleS: 1,
  };
}

function ledger(c, horizon, work) {
  close(c.executedWorkEquivalents, c.checkpointedSteps + c.volatileCompletedSteps + c.inFlightWorkEquivalents + c.lostWorkEquivalents, 'work conserved');
  assert.equal(c.retainedUsefulSteps, c.checkpointedSteps + c.volatileCompletedSteps);
  assert.ok(Number.isInteger(c.retainedUsefulSteps));
  assert.ok(c.inFlightWorkEquivalents >= 0 && c.inFlightWorkEquivalents < 1);
  close(c.runS + c.checkpointS + c.recoveryS + c.notReadyS, horizon, 'wall time conserved');
  close(c.workloadOperations, c.executedWorkEquivalents * work.operationsPerStep, 'operations include replays');
  close(c.workloadMemoryBytes, c.executedWorkEquivalents * work.memoryBytesPerStep, 'memory bytes include replays');
  close(c.workloadNetworkBytes, c.executedWorkEquivalents * work.networkBytesPerStep, 'network bytes counted once');
}

test('GEMM counts are derived from a tiny explicit multiply-add loop', () => {
  const rows = 2, inner = 3, columns = 4, bytes = 8;
  let operations = 0;
  for (let i = 0; i < rows; i++) for (let j = 0; j < columns; j++) for (let k = 0; k < inner; k++) operations += 2;
  const w = denseGemmWorkload(rows, inner, columns, bytes);
  assert.equal(w.operationsPerStep, operations);
  assert.equal(w.memoryBytesPerStep, (6 + 12 + 8 + 8) * 8);
  assert.equal(w.networkBytesPerStep, 8 * 8);
  assert.equal(w.checkpointBytes, 8 * 8);
});

test('no-fault timing and energy have a hand-derived answer', () => {
  const r = simulate();
  const c = r.final.counters;
  assert.deepEqual(r.segments.map(s => [s.startS, s.endS, s.phase]), [
    [0, 10, 'run'], [10, 12, 'checkpoint-write'], [12, 13, 'checkpoint-commit'],
    [13, 23, 'run'], [23, 25, 'checkpoint-write'], [25, 26, 'checkpoint-commit'], [26, 35, 'run'],
  ]);
  assert.equal(c.executedWorkEquivalents, 29);
  assert.equal(c.checkpointedSteps, 20);
  assert.equal(c.volatileCompletedSteps, 9);
  assert.equal(c.retainedUsefulSteps, 29);
  assert.equal(c.itEnergyJ, 29 * 100 + 6 * 60);
  assert.equal(c.facilityEnergyJ, (29 * 100 + 6 * 60) * 1.2);
  assert.equal(c.checkpointWriteBytes, 400);
  assert.equal(c.checkpointReadBytes, 0);
  ledger(c, 35, fixture().workload);
});

test('compute and memory form one max bound, not additive service or summed rates', () => {
  const r = simulate(s => { s.workload.memoryBytesPerStep = 200; s.workload.networkBytesPerStep = 300; });
  assert.equal(r.service.computeS, 1);
  assert.equal(r.service.memoryS, 2);
  assert.equal(r.service.communicationS, 3);
  assert.equal(r.service.localS, 2);
  assert.equal(r.service.stepS, 5);
  const o = simulate(s => { s.workload.memoryBytesPerStep = 200; s.workload.networkBytesPerStep = 300; s.service.communication = 'fully-overlapped'; });
  assert.equal(o.service.stepS, 3);
  assert.equal(o.service.stepsPerRunS, 1 / 3);
});

test('a shared fabric ceiling prevents unlimited strong scaling of a fixed payload', () => {
  const a = simulate(s => { s.workload.networkBytesPerStep = 1000; s.service.networkHallLimitBytesS = 100; });
  const b = simulate(s => { s.installed.racks = 4; s.workload.networkBytesPerStep = 1000; s.service.networkHallLimitBytesS = 100; });
  assert.equal(a.service.communicationS, 10);
  assert.equal(b.service.communicationS, 10);
  assert.equal(b.service.computeS, 0.25);
  assert.equal(b.service.stepS, 10.25);
});

test('checkpoints wait for a complete step, and partial final work is not useful work', () => {
  const r = simulate(s => { s.workload.operationsPerStep = 300; s.checkpoint.intervalRunS = 10; s.durationS = 10.5; });
  assert.equal(r.service.stepsPerCheckpoint, 4);
  assert.equal(r.service.effectiveCheckpointRunS, 12);
  assert.equal(r.final.counters.retainedUsefulSteps, 3);
  assert.equal(r.final.counters.inFlightWorkEquivalents, 0.5);
  assert.equal(r.final.counters.committedCheckpoints, 0);
});

test('fault rollback, repair and checkpoint read consume separate, counted resources', () => {
  const r = simulate(s => { s.faults = [{ id: 'f', atS: 18, recoveryDelayS: 4, cause: 'worker-stop' }]; });
  const c = r.final.counters;
  // 0–10 run; 10–13 checkpoint; 13–18 run; 18–22 repair;
  // 22–24 restore; 24–34 run; 34–35 partial checkpoint write.
  assert.equal(c.executedWorkEquivalents, 25);
  assert.equal(c.lostWorkEquivalents, 5);
  assert.equal(c.checkpointedSteps, 10);
  assert.equal(c.volatileCompletedSteps, 10);
  assert.equal(c.retainedUsefulSteps, 20);
  assert.equal(c.runS, 25);
  assert.equal(c.checkpointS, 4);
  assert.equal(c.recoveryS, 6);
  assert.equal(c.checkpointWriteBytes, 300);
  assert.equal(c.checkpointReadBytes, 200);
  assert.equal(c.itEnergyJ, 25 * 100 + 4 * 60 + 6 * 40);
  ledger(c, 35, fixture().workload);
});

test('a fault in an unfinished first commit cannot restart from that checkpoint', () => {
  const r = simulate(s => { s.faults = [{ id: 'f', atS: 12.5, recoveryDelayS: 4, cause: 'software-stop' }]; });
  const c = r.final.counters;
  assert.equal(c.lostWorkEquivalents, 10);
  assert.equal(c.checkpointReadBytes, 0);
  assert.equal(c.committedCheckpoints, 1);
  assert.equal(c.retainedUsefulSteps, 15);
  assert.equal(c.inFlightWorkEquivalents, 0.5);
  assert.equal(c.checkpointWriteBytes, 400);
  assert.equal(c.recoveryS, 4);
  ledger(c, 35, fixture().workload);
});

test('an earlier valid checkpoint survives an interrupted later checkpoint', () => {
  const r = simulate(s => { s.faults = [{ id: 'f', atS: 24, recoveryDelayS: 1, cause: 'worker-stop' }]; });
  assert.equal(r.final.counters.lostWorkEquivalents, 10);
  assert.equal(r.final.counters.checkpointedSteps, 10);
  assert.equal(r.final.counters.checkpointReadBytes, 200);
  assert.equal(r.final.counters.retainedUsefulSteps, 18);
  assert.equal(r.final.counters.checkpointWriteBytes, 300);
});

test('commit wins an exact timestamp tie with a fault; zero-delay repair still reads bytes', () => {
  const r = simulate(s => { s.faults = [{ id: 'f', atS: 13, recoveryDelayS: 0, cause: 'worker-stop' }]; });
  const event = r.events.find(e => e.kind === 'fault');
  assert.equal(event.lostWorkEquivalents, 0);
  const sample = sampleOperatingHall(r, 13);
  assert.equal(sample.phase, 'recovery-read');
  assert.equal(sample.counters.checkpointedSteps, 10);
  assert.equal(sample.rates.checkpointReadBytesS, 100);
  assert.equal(sample.rates.executedWorkEquivalentsS, 0);
  assert.equal(r.final.counters.recoveryS, 2);
});

test('overlapping repair waits form a union, not duplicated downtime or work losses', () => {
  const r = simulate(s => { s.faults = [
    { id: 'a', atS: 18, recoveryDelayS: 4, cause: 'worker-stop' },
    { id: 'b', atS: 20, recoveryDelayS: 5, cause: 'software-stop' },
  ]; });
  assert.equal(r.final.counters.lostWorkEquivalents, 5);
  assert.equal(r.final.counters.recoveryS, 9); // 18–25 wait + 25–27 read.
  assert.equal(r.final.counters.checkpointReadBytes, 200);
  assert.equal(r.final.counters.retainedUsefulSteps, 18);
  assert.deepEqual(r.events.filter(e => e.kind === 'fault').map(e => e.lostWorkEquivalents), [5, 0]);
});

test('a fault during restore counts the interrupted read and starts a fresh read', () => {
  const r = simulate(s => { s.faults = [
    { id: 'a', atS: 18, recoveryDelayS: 4, cause: 'worker-stop' },
    { id: 'b', atS: 23, recoveryDelayS: 2, cause: 'fabric-interruption' },
  ]; });
  assert.equal(r.final.counters.lostWorkEquivalents, 5);
  assert.equal(r.final.counters.checkpointReadBytes, 300);
  assert.equal(r.final.counters.recoveryS, 9);
  assert.equal(r.final.counters.retainedUsefulSteps, 18);
});

test('checkpoint interval has both protection benefit and blocking overhead', () => {
  const noFaultShort = simulate(s => { s.checkpoint.intervalRunS = 5; });
  const noFaultLong = simulate(s => { s.checkpoint.intervalRunS = 100; });
  assert.ok(noFaultShort.final.counters.retainedUsefulSteps < noFaultLong.final.counters.retainedUsefulSteps);
  const short = simulate(s => { s.checkpoint.intervalRunS = 5; s.faults = [{ id: 'f', atS: 18, recoveryDelayS: 0, cause: 'worker-stop' }]; });
  const long = simulate(s => { s.checkpoint.intervalRunS = 100; s.faults = [{ id: 'f', atS: 18, recoveryDelayS: 0, cause: 'worker-stop' }]; });
  assert.ok(short.final.counters.lostWorkEquivalents < long.final.counters.lostWorkEquivalents);
  assert.ok(short.final.counters.retainedUsefulSteps > long.final.counters.retainedUsefulSteps);
  assert.ok(short.final.counters.checkpointWriteBytes > long.final.counters.checkpointWriteBytes);
});

test('last commissioning gate controls dispatch, and pre-dispatch job faults are explicit', () => {
  const r = simulate(s => { s.commissioning.operations = 15; s.commissioning.fabric = 7;
    s.faults = [{ id: 'early', atS: 10, recoveryDelayS: 9, cause: 'worker-stop' }]; });
  assert.equal(r.admission.readyAtS, 15);
  assert.equal(r.final.counters.notReadyS, 15);
  assert.equal(r.final.counters.retainedUsefulSteps, 17);
  assert.equal(r.final.counters.handledFaults, 0);
  assert.equal(r.events.find(e => e.faultId === 'early').kind, 'fault-ignored');
  assert.equal(sampleOperatingHall(r, 14.9).rates.facilityW, 0);
  assert.equal(sampleOperatingHall(r, 15).phase, 'run');
  for (const gate of GATES) {
    const off = simulate(s => { s.commissioning[gate] = null; });
    assert.equal(off.final.counters.retainedUsefulSteps, 0);
    assert.equal(off.final.counters.facilityEnergyJ, 0);
    assert.equal(off.summary.effectivePue, null);
    assert.equal(off.final.counters.notReadyS, 35);
  }
});

test('whole-rack feed and coolant admission are independent and conservative', () => {
  const feed = simulate(s => { s.installed.racks = 4; s.electrical.facilityFeedLimitW = 250; });
  assert.equal(feed.admission.admittedRacks, 2); // 120 W facility per rack.
  assert.equal(feed.admission.dispatchFraction, 0.5);
  const thermal = simulate(s => { s.installed.racks = 4; s.cooling.massFlowKgS = 0.15; });
  assert.equal(thermal.admission.admittedRacks, 1); // 150 W loop capacity.
  const off = simulate(s => { s.cooling.massFlowKgS = 0; });
  assert.equal(off.admission.admittedRacks, 0);
  assert.equal(off.service.stepS, null);
  assert.equal(off.final.counters.facilityEnergyJ, 0);
});

test('admission reserves the most demanding phase even when checkpoint load exceeds run load', () => {
  const r = simulate(s => { s.electrical.facilityFeedLimitW = 200; s.electrical.packageCheckpointW = 200; });
  assert.equal(r.admission.maxRackItW, 220);
  assert.equal(r.admission.admittedRacks, 0);
});

test('voltage changes current at fixed power; branch current limits remain separate from feed W', () => {
  const a = simulate();
  const b = simulate(s => { s.electrical.rackBusV = 20; s.electrical.packageBusV = 4; });
  assert.equal(b.segments[0].rates.packageCurrentA, a.segments[0].rates.packageCurrentA / 2);
  assert.equal(b.segments[0].rates.rackCurrentA, a.segments[0].rates.rackCurrentA / 2);
  assert.equal(b.final.counters.facilityEnergyJ, a.final.counters.facilityEnergyJ);
  assert.equal(simulate(s => { s.electrical.packageRailLimitA = 39; }).admission.admittedRacks, 0);
  assert.equal(simulate(s => { s.electrical.rackInputLimitA = 9; }).admission.admittedRacks, 0);
});

test('conversion and PUE boundaries balance, without adding losses twice', () => {
  const r = simulate(s => { s.electrical.conversionEfficiency = 0.8; s.electrical.pue = 1.5; });
  const p = r.segments[0].rates;
  assert.equal(p.packageW, 80);
  assert.equal(p.rackItW, 125); // (80 package + 20 aux) / .8.
  assert.equal(p.conversionLossW, 25);
  assert.equal(p.facilityW, 187.5);
  assert.equal(p.facilityOverheadW, 62.5);
  assert.equal(p.coolantHeatW, 125);
  assert.equal(p.facilityRejectedHeatW, 187.5);
  close(r.summary.effectivePue, 1.5);
});

test('at fixed admitted load, twice the water flow halves rise but does not halve heat', () => {
  const a = simulate();
  const b = simulate(s => { s.cooling.massFlowKgS = 2; });
  assert.equal(b.segments[0].rates.coolantRiseK, a.segments[0].rates.coolantRiseK / 2);
  assert.equal(b.segments[0].rates.coolantHeatW, a.segments[0].rates.coolantHeatW);
  assert.equal(b.final.counters.retainedUsefulSteps, a.final.counters.retainedUsefulSteps);
});

test('sampling frequency has no effect on event integration or final answers', () => {
  const a = simulate(s => { s.sampleS = 0.1; s.faults = [{ id: 'f', atS: 18.375, recoveryDelayS: 4.125, cause: 'worker-stop' }]; });
  const b = simulate(s => { s.sampleS = 7.3; s.faults = [{ id: 'f', atS: 18.375, recoveryDelayS: 4.125, cause: 'worker-stop' }]; });
  assert.deepEqual(a.final, b.final);
  assert.deepEqual(a.events, b.events);
  assert.deepEqual(a.segments, b.segments);
  assert.notEqual(a.timeline.length, b.timeline.length);
  assert.equal(sampleOperatingHall(a, 18.375).counters.lostWorkEquivalents, 5.375);
});

test('all phase rates and every sampled ledger satisfy physical and accounting invariants', () => {
  let cases = 0;
  for (const racks of [1, 2, 4]) for (const flow of [0, 0.15, 2]) for (const pue of [1, 1.2, 2])
    for (const eta of [0.8, 1]) for (const overlap of ['serialized', 'fully-overlapped']) {
      const s = fixture();
      s.installed.racks = racks;
      s.cooling.massFlowKgS = flow;
      s.electrical.pue = pue;
      s.electrical.conversionEfficiency = eta;
      s.service.communication = overlap;
      s.workload.networkBytesPerStep = 70;
      s.faults = [{ id: 'f1', atS: 14.375, recoveryDelayS: 2.25, cause: 'worker-stop' },
        { id: 'f2', atS: 28.125, recoveryDelayS: 1.1, cause: 'software-stop' }];
      const r = simulateOperatingHall(s);
      for (const sample of r.timeline) {
        const p = sample.rates;
        ledger(sample.counters, sample.atS, s.workload);
        close(p.packageCurrentA * s.electrical.packageBusV, p.packageW, 'package P=VI');
        close(p.rackCurrentA * s.electrical.rackBusV, p.rackItW, 'rack P=VI');
        close(p.itW * pue, p.facilityW, 'PUE facility boundary');
        close(p.coolantHeatW, p.coolantMassFlowKgS * s.cooling.specificHeatJkgK * p.coolantRiseK, 'water heat balance');
        close(p.facilityRejectedHeatW, p.coolantHeatW + p.facilityOverheadW, 'rejected heat once');
        assert.ok(p.facilityW <= s.electrical.facilityFeedLimitW * (1 + 1e-10));
        assert.ok(p.coolantRiseK <= s.cooling.maxRiseK * (1 + 1e-10));
        assert.ok(p.operationsS <= r.service.computeCapacityOpsS * (1 + 1e-10));
        assert.ok(p.workloadMemoryBytesS <= r.service.memoryCapacityBytesS * (1 + 1e-10));
        assert.ok(p.workloadNetworkBytesS <= r.service.networkCapacityBytesS * (1 + 1e-10));
        if (sample.phase !== 'run') assert.equal(p.executedWorkEquivalentsS, 0);
      }
      const sum = field => r.segments.reduce((n, seg) => n + seg.rates[field] * (seg.endS - seg.startS), 0);
      close(sum('facilityW'), r.final.counters.facilityEnergyJ, 'segment energy integral');
      close(sum('checkpointWriteBytesS'), r.final.counters.checkpointWriteBytes, 'checkpoint byte integral');
      close(sum('checkpointReadBytesS'), r.final.counters.checkpointReadBytes, 'restore byte integral');
      cases++;
    }
  assert.equal(cases, 108);
});

test('all authored examples are finite, typed, JSON serializable and independent inputs', () => {
  for (const { scenario } of operatingHallExamples()) {
    const before = JSON.stringify(scenario);
    const r = simulateOperatingHall(scenario);
    assert.equal(JSON.stringify(scenario), before);
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(r)));
    assert.ok(!JSON.stringify(r).includes('NaN'));
    ledger(r.final.counters, scenario.durationS, scenario.workload);
  }
  const a = createOperatingHallScenario(); a.cooling.massFlowKgS = 0;
  assert.equal(createOperatingHallScenario().cooling.massFlowKgS, 3);
});

test('invalid inputs and unsupported resolution are rejected explicitly', () => {
  for (const edit of [
    s => { s.durationS = NaN; }, s => { s.sampleS = 0; }, s => { s.sampleS = 0.001; },
    s => { s.electrical.pue = 0.9; }, s => { s.electrical.conversionEfficiency = 0; },
    s => { s.electrical.rackBusV = 0; }, s => { s.cooling.massFlowKgS = -1; },
    s => { s.installed.racks = 1.5; }, s => { s.workload.operationsPerStep = undefined; },
    s => { s.service.communication = 'magic'; }, s => { s.commissioning.fabric = undefined; },
    s => { s.faults = [{ id: 'x', atS: 35, recoveryDelayS: 0, cause: 'worker-stop' }]; },
  ]) { const s = fixture(); edit(s); assert.throws(() => validateOperatingHallScenario(s), RangeError); }
  assert.throws(() => simulate(s => { s.service.checkpointBytesPerRackS = 1e20; s.service.checkpointHallLimitBytesS = 1e20; }), /microsecond/);
  assert.throws(() => sampleOperatingHall(simulate(), -1), RangeError);
  assert.throws(() => denseGemmWorkload(2.5, 3, 4, 8), RangeError);
});

import {operatingHallPlot} from '../src/lib/operating-hall.ts';
test('work plots preserve both sides of faults and atomic checkpoint commits',()=>{
 const r=simulateOperatingHall(createOperatingHallScenario()),p=operatingHallPlot(r);
 for(const e of r.events.filter(e=>['fault','checkpoint-committed'].includes(e.kind))){
  const pair=p.filter(x=>Math.abs(x.atS-e.atS)<1e-8);assert.ok(pair.length>=2);
  if(e.kind==='fault')assert.ok(pair[0].retainedUsefulSteps>pair.at(-1).retainedUsefulSteps);
  else assert.ok(pair[0].checkpointedSteps<pair.at(-1).checkpointedSteps);
 }
 for(let i=1;i<p.length;i++)if(p[i].atS>p[i-1].atS)assert.equal(p[i].retainedUsefulSteps,p[i-1].retainedUsefulSteps);
});
