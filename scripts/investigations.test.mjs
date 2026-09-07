import test from 'node:test';
import assert from 'node:assert/strict';
import { readBrowserLearningState, learningContract, scenarioDefaults as defaults, systemScenario, switchingScenario, attentionScenario, validateScenario, readInvestigationDocument, investigationVersion } from '../src/lib/investigation-models.ts';

test('manufacturing applies screened input yield once, then stack and package survival', () => {
  const r = systemScenario(defaults);
  assert.equal(r.screenedMemoryDies, r.memoryWafer.good * defaults.memoryWafers);
  assert.equal(r.goodStacks, r.screenedMemoryDies / defaults.dies * r.stack.conditionalYield);
  assert.equal(r.compatiblePackages, Math.min(r.logicDies / 2, r.goodStacks / 8, 800, 900, defaults.packageStations) * .98);
  assert.ok(r.activeRacks * 64 <= r.compatiblePackages);
  assert.ok(r.activeRacks * r.rackW * defaults.pue <= defaults.facilityMW * 1e6);
});
test('changing stack count propagates capacity, height and compatibility across the same system', () => {
  const a = systemScenario(defaults), tall = systemScenario({ ...defaults, dies: 16 });
  assert.equal(tall.packageCapacityGB, 2 * a.packageCapacityGB);
  assert.equal(tall.compatiblePackages, 0);
  assert.equal(tall.activeRacks, 0);
  assert.equal(tall.hallTokensPerSecond, 0);
  const compact = systemScenario({ ...defaults, dies: 12, route: 'hybrid' });
  assert.ok(compact.stack.withinLimits);
  assert.ok(compact.compatiblePackages > 0);
});
test('memory supply increase moves a constraint and does not increase output beyond the next station', () => {
  const a = systemScenario(defaults), b = systemScenario({ ...defaults, memoryWafers: 160 });
  assert.ok(b.capacity.good >= a.capacity.good);
  assert.ok(b.capacity.good <= defaults.packageStations * .98);
  assert.equal(b.stack.conditionalYield, a.stack.conditionalYield);
});
test('residency conserves weight and KV bytes, HBF receives only read-only weights', () => {
  const r = systemScenario({ ...defaults, dies: 4, context: 32768, batch: 16, useHbf: true }).placement;
  assert.ok(Math.abs(r.hbm.weights + r.host.weights + r.hbf.weights + r.missing.weights - r.size.weights) < .01);
  assert.ok(Math.abs(r.hbm.kv + r.host.kv + r.missing.kv - r.size.kv) < .01);
  assert.equal(r.hbf.kv, 0);
});
test('all four-bit additions preserve carry and exact arithmetic', () => {
  for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) {
    const r = switchingScenario({ ...defaults, a, b });
    const reconstructed = r.bits.reduce((sum, x) => sum + (x.sum << x.bit), 0) + (r.bits[3].carryOut << 4);
    assert.equal(reconstructed, a + b);
    assert.equal(r.mac, 3 * a + 2 * b + 1);
  }
});
test('switch model conserves charge-step energy and load scaling', () => {
  const a = switchingScenario(defaults), b = switchingScenario({ ...defaults, loadFf: defaults.loadFf * 2 });
  assert.equal(b.delaySeconds, 2 * a.delaySeconds);
  assert.equal(b.supplyEnergyJ, 2 * a.supplyEnergyJ);
  assert.equal(a.supplyEnergyJ, 2 * a.storedEnergyJ);
});
test('attention computation normalizes probabilities, masks future tokens and reconstructs the weighted value', () => {
  for (let query = 0; query < 4; query++) {
    const r = attentionScenario(query, 1);
    assert.ok(Math.abs(r.weights.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    assert.ok(r.weights.slice(query + 1).every(x => x === 0));
    assert.ok(Math.abs(r.probabilities.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    assert.equal(r.mixed[0], r.weights[0] - r.weights[2]);
    assert.equal(r.mixed[1], r.weights[1] - r.weights[3]);
  }
});
test('scenario import restores deterministic outputs and rejects malformed state', () => {
  const json = JSON.stringify({ ...learningContract, caseId: 'manufacturing', scenario: defaults });
  const restored = readInvestigationDocument(json);
  assert.deepEqual(systemScenario(restored.scenario), systemScenario(defaults));
  for (const invalid of [{ ...defaults, dies: 8.5 }, { ...defaults, voltage: Infinity }, { ...defaults, route: 'best' }, { ...defaults, useHbf: 'false' }, { ...defaults, injected: 1 }]) assert.throws(() => validateScenario(invalid));
  assert.throws(() => readInvestigationDocument(json.replace(investigationVersion, 'unknown')));
});

test('damaged browser cases do not erase independent valid attempts', () => {
  const attempt={prediction:'Energy doubles',explanation:'C V²',transfer:'Timing needs evidence',savedAt:'2026-09-07T12:00:00Z',scenario:{...defaults}};
  const saved={current:{...learningContract,caseId:'switching',scenario:{...defaults,voltage:'broken'}},work:{switching:{firstAttempt:attempt},manufacturing:{firstAttempt:{...attempt,scenario:{...defaults,dies:-1}}},execution:{practice:attempt}}};
  const recovered=readBrowserLearningState(JSON.stringify(saved));
  assert.deepEqual(recovered.scenario,defaults);
  assert.deepEqual(recovered.work.switching.firstAttempt,attempt);
  assert.deepEqual(recovered.work.execution.practice,attempt);
  assert.equal(recovered.work.manufacturing,undefined);
  assert.equal(recovered.warnings.length,2);
  assert.throws(()=>readBrowserLearningState(JSON.stringify({...saved,current:{...saved.current,contentVersion:'future'}})));
});
test('static memory fit does not imply append capacity; a smaller working set restores a runnable step',()=>{
  const packed=systemScenario({...defaults,dies:4,context:8192,batch:1});
  assert.equal(packed.placement.feasible,true);assert.equal(packed.nextStepFits,false);assert.equal(packed.packageTokensPerSecond,0);
  const recovered=systemScenario({...defaults,dies:4,context:8192,batch:1,weightBits:8});
  assert.equal(recovered.executionFeasible,true);assert.ok(recovered.packageTokensPerSecond>0);
});
