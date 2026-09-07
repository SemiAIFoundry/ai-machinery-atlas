import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateOrbitalMission, sampleOrbitalMission, orbitalMissionSensitivity, validateOrbitalMissionScenario, STEFAN_BOLTZMANN_W_M2_K4 as SIGMA } from '../src/lib/orbital-mission.ts';
import { createOrbitalMissionScenario, orbitalMissionExamples } from '../src/lib/orbital-mission-scenarios.ts';
const close = (a, b, label = '') => assert.ok(Math.abs(a - b) <= 2e-8 * Math.max(1, Math.abs(b)), `${label}: ${a} ≈ ${b}`);

function fixture() {
  return {
    kind: 'synthetic-orbital-mission', version: 1,
    workload: { kind: 'synthetic-independent-products', label: 'Hand-counted independent product',
      operationsPerProduct: 100, memoryBytesPerProduct: 1, outputBytesPerProduct: 10, assumptions: ['Synthetic 1 s compute, 1 s write, 1 s commit.'] },
    service: { computeOpsS: 100, memoryBytesS: 100, storageWriteBytesS: 10, commitLatencyS: 1 },
    illumination: { periodS: 100, sunlitS: 100 },
    solar: { irradianceWm2: 1000, areaM2: 1, cellEfficiency: 1, incidenceCosine: 1, derating: 1, deliveryEfficiency: 1 },
    battery: { capacityJ: 1000, initialJ: 1000, reserveJ: 100, resumeJ: 200,
      chargeEfficiency: 1, dischargeEfficiency: 1, maxChargeBusW: 1000, maxDischargeBusW: 1000 },
    loads: { busV: 10, housekeepingW: 10, computeW: 90, storageWriteW: 40, commitW: 10, transmitterW: 20, transmitterRfEfficiency: 0.5 },
    radiator: { areaM2: 100, emissivity: 1, viewFactor: 1, maxTemperatureK: 300, sinkTemperatureK: 0, absorbedSunlitW: 0, absorbedEclipseW: 0 },
    storage: { capacityBytes: 1000 },
    contacts: [{ id: 'all', startS: 0, endS: 35, bytesS: 10 }],
    radiation: { kind: 'synthetic-effective-see-rate', effectiveFluxCm2S: 0, resetCrossSectionCm2PerDevice: 0, susceptibleDevices: 1, resets: [] },
    objectives: { retainedProducts: 10, deliveredProducts: 10, requireBatteryCycleClosure: false },
    durationS: 35, sampleS: 1,
  };
}
const simulate = edit => { const s = fixture(); edit?.(s); return simulateOrbitalMission(s); };

test('radiation constant agrees with its independent expression in exact SI constants', () => {
  const boltzmann = 1.380649e-23, planck = 6.62607015e-34, lightSpeed = 299792458;
  const independentlyDerived = 2 * Math.PI ** 5 * boltzmann ** 4 / (15 * planck ** 3 * lightSpeed ** 2);
  assert.ok(Math.abs(SIGMA / independentlyDerived - 1) < 1e-9);
});

function checkLedger(c, s, t) {
  close(c.executedWorkEquivalents, c.retainedUsefulProducts + c.pendingWorkEquivalents + c.lostWorkEquivalents, 'retained/pending/lost work');
  assert.ok(Number.isInteger(c.retainedUsefulProducts) && Number.isInteger(c.deliveredProducts));
  assert.ok(c.deliveredProducts <= c.retainedUsefulProducts);
  assert.ok(c.pendingWorkEquivalents >= -1e-8 && c.pendingWorkEquivalents <= 1 + 1e-8);
  close(c.onboardBytes, (c.retainedUsefulProducts - c.deliveredProducts) * s.workload.outputBytesPerProduct, 'whole product storage');
  close(c.downlinkBytes, c.deliveredProducts * s.workload.outputBytesPerProduct + c.receiverPartialProductBytes, 'received byte conservation');
  assert.ok(c.onboardBytes <= s.storage.capacityBytes + 1e-5);
  assert.ok(c.batteryJ >= -1e-5 && c.batteryJ <= s.battery.capacityJ + 1e-5);
  close(c.solarUsedJ + s.battery.initialJ - c.batteryJ, c.loadEnergyJ + c.batteryLossJ, 'bus energy with battery losses');
  close(c.solarAvailableJ, c.solarUsedJ + c.curtailedSolarJ, 'solar available/curtailed');
  close(c.radiatorHeatJ, c.loadEnergyJ - c.radioExportJ + c.batteryLossJ + c.absorbedEnvironmentJ, 'radiator heat once');
  close(c.computeS + c.storageS + c.resetS + c.bufferWaitS + c.powerWaitS + c.thermalWaitS + c.busUnavailableS, t, 'wall time partition');
  close(c.operations, c.executedWorkEquivalents * s.workload.operationsPerProduct, 'replayed operations');
  close(c.memoryBytes, c.executedWorkEquivalents * s.workload.memoryBytesPerProduct, 'replayed memory bytes');
}

test('hand-derived no-fault products, bytes, and bus/radio/radiator energy', () => {
  const r = simulate();
  const c = r.final.counters;
  assert.equal(c.retainedUsefulProducts, 11);
  assert.equal(c.deliveredProducts, 11);
  assert.equal(c.executedWorkEquivalents, 12);
  assert.equal(c.pendingWorkEquivalents, 1);
  assert.equal(c.storageWriteBytes, 120);
  assert.equal(c.downlinkBytes, 110);
  assert.equal(c.loadEnergyJ, 10 * 35 + 90 * 12 + 40 * 12 + 10 * 11 + 20 * 11);
  assert.equal(c.radioExportJ, 110);
  assert.equal(c.radiatorHeatJ, c.loadEnergyJ - 110);
  assert.equal(c.batteryJ, 1000);
  assert.equal(c.curtailedSolarJ, 35000 - c.loadEnergyJ);
  checkLedger(c, fixture(), 35);
});

test('roofline local service uses max, and storage/commit service remains serial', () => {
  const r = simulate(s => { s.workload.memoryBytesPerProduct = 200; });
  assert.equal(r.service.computeS, 1); assert.equal(r.service.memoryS, 2);
  assert.equal(r.service.workStepS, 2); assert.equal(r.service.noPauseProductS, 4);
  assert.equal(r.final.counters.retainedUsefulProducts, 8);
});

test('reset during a partial write loses its uncommitted arithmetic exactly once', () => {
  const r = simulate(s => { s.radiation.resets = [{ id: 'r', atS: 1.5, recoveryS: 2 }]; });
  const c = r.final.counters;
  assert.equal(c.retainedUsefulProducts, 10); assert.equal(c.deliveredProducts, 10);
  assert.equal(c.executedWorkEquivalents, 12); assert.equal(c.lostWorkEquivalents, 1);
  assert.equal(c.pendingWorkEquivalents, 1); assert.equal(c.storageWriteBytes, 110);
  assert.equal(c.resetS, 2);
  checkLedger(c, fixture(), 35);
});

test('atomic commit wins a tie with reset; independent radio still drains a durable product', () => {
  const r = simulate(s => { s.radiation.resets = [{ id: 'r', atS: 3, recoveryS: 2 }]; });
  const f = sampleOrbitalMission(r, 3);
  assert.equal(f.mode, 'reset-wait'); assert.equal(f.counters.retainedUsefulProducts, 1);
  assert.equal(f.counters.lostWorkEquivalents, 0); assert.equal(f.rates.downlinkBytesS, 10);
  assert.equal(sampleOrbitalMission(r, 4).counters.deliveredProducts, 1);
});

test('overlapping reset recovery intervals form a union, not duplicated downtime', () => {
  const r = simulate(s => { s.radiation.resets = [{ id: 'a', atS: 0.5, recoveryS: 2 }, { id: 'b', atS: 1.5, recoveryS: 3 }]; });
  assert.equal(r.final.counters.resetS, 4);
  assert.equal(r.final.counters.lostWorkEquivalents, 0.5);
  assert.deepEqual(r.events.filter(e => e.kind === 'reset').map(e => e.lostWorkEquivalents), [0.5, 0]);
});

test('contacts preserve partial receiver progress but free onboard slots only after acknowledgement', () => {
  const r = simulate(s => { s.contacts = [{ id: 'a', startS: 0, endS: 3.5, bytesS: 10 }, { id: 'b', startS: 10, endS: 12, bytesS: 10 }]; });
  const f = sampleOrbitalMission(r, 3.5);
  assert.equal(f.counters.receiverPartialProductBytes, 5);
  assert.equal(f.counters.onboardBytes, 10);
  assert.equal(f.counters.deliveredProducts, 0);
  assert.equal(f.rates.downlinkBytesS, 0);
  assert.equal(r.final.counters.deliveredProducts, 2);
  assert.equal(r.final.counters.receiverPartialProductBytes, 5);
  assert.equal(r.final.counters.onboardBytes, 90);
  assert.equal(r.final.counters.downlinkBytes, 25);
});

test('buffer backpressure couples contact timing to new useful work', () => {
  const r = simulate(s => { s.storage.capacityBytes = 10; s.contacts = [{ id: 'late', startS: 20, endS: 35, bytesS: 10 }]; });
  assert.equal(r.final.counters.retainedUsefulProducts, 4);
  assert.equal(r.final.counters.deliveredProducts, 4);
  assert.equal(r.final.counters.bufferWaitS, 21);
  assert.equal(sampleOrbitalMission(r, 20).mode, 'buffer-wait');
  assert.equal(sampleOrbitalMission(r, 21).mode, 'compute');
  assert.equal(r.summary.backlogMaximumBytes, 10);
});

test('sun/eclipse battery balance includes both efficiencies and does not invent solar energy', () => {
  const s = fixture();
  s.durationS = 20; s.contacts = []; s.storage.capacityBytes = 0;
  s.illumination = { periodS: 20, sunlitS: 10 }; s.solar.irradianceWm2 = 200;
  s.loads.housekeepingW = 100;
  s.battery = { ...s.battery, capacityJ: 3000, initialJ: 1500, chargeEfficiency: 0.8, dischargeEfficiency: 0.5 };
  const r = simulateOrbitalMission(s);
  assert.equal(sampleOrbitalMission(r, 0).rates.batteryStoredRateW, 80);
  assert.equal(sampleOrbitalMission(r, 10).rates.batteryStoredRateW, -200);
  assert.equal(r.final.counters.batteryJ, 300);
  assert.equal(r.final.counters.loadEnergyJ, 2000);
  assert.equal(r.final.counters.batteryLossJ, 1200);
  assert.equal(r.final.counters.solarAvailableJ, 2000);
  assert.equal(r.feasibility.batteryCycleClosurePass, false);
  checkLedger(r.final.counters, s, 20);
});

test('empty battery causes explicit housekeeping deficit, without negative charge', () => {
  const s = fixture(); s.durationS = 20; s.contacts = []; s.storage.capacityBytes = 0;
  s.illumination = { periodS: 20, sunlitS: 10 }; s.solar.irradianceWm2 = 200;
  s.loads.housekeepingW = 100; s.battery = { ...s.battery, capacityJ: 2000, initialJ: 1000, chargeEfficiency: 0.8, dischargeEfficiency: 0.5 };
  const r = simulateOrbitalMission(s);
  assert.equal(r.final.counters.batteryJ, 0);
  assert.equal(r.final.counters.housekeepingUnservedJ, 100);
  assert.equal(r.final.counters.busUnavailableS, 1);
  assert.equal(r.final.counters.busOutages, 1);
  assert.equal(r.feasibility.housekeepingPass, false);
  checkLedger(r.final.counters, s, 20);
});

test('battery reserve protects housekeeping and optional loads resume with hysteresis', () => {
  const s = fixture(); s.durationS = 40; s.contacts = [];
  s.illumination = { periodS: 20, sunlitS: 10 };
  s.solar.irradianceWm2 = 200;
  s.battery = { ...s.battery, capacityJ: 400, initialJ: 400, reserveJ: 100, resumeJ: 200 };
  const r = simulateOrbitalMission(s);
  assert.ok(r.events.some(e => e.kind === 'battery-reserve'));
  assert.ok(r.events.some(e => e.kind === 'battery-resume'));
  assert.ok(r.final.counters.powerWaitS > 0);
  assert.equal(r.feasibility.housekeepingPass, true);
  for (const f of r.timeline) checkLedger(f.counters, s, f.atS);
});

test('radiator T⁴ bound includes sink and environment heat, and blocks optional payload', () => {
  const r = simulate(s => { s.radiator.areaM2 = 50 / (SIGMA * 300 ** 4); });
  close(r.bounds.radiatorEmissionLimitW, 50);
  assert.equal(r.final.counters.retainedUsefulProducts, 0);
  assert.equal(r.final.counters.thermalWaitS, 35);
  assert.equal(r.feasibility.thermalPass, true); // Controller safely refuses the optional load.
  const impossible = simulate(s => { s.radiator.absorbedSunlitW = 1e8; });
  assert.equal(impossible.feasibility.thermalPass, false);
  assert.ok(impossible.final.counters.thermalExcessJ > 0);
});

test('battery charging loss can limit charge rate and curtail solar to satisfy heat bound', () => {
  const s = fixture(); s.storage.capacityBytes = 0; s.contacts = [];
  s.solar.irradianceWm2 = 100;
  s.battery.initialJ = 0; s.battery.chargeEfficiency = 0.5;
  s.radiator.areaM2 = 20 / (SIGMA * 300 ** 4);
  const r = simulateOrbitalMission(s); const f = r.segments[0];
  close(f.rates.batteryChargeBusW, 20); close(f.rates.batteryStoredRateW, 10);
  close(f.rates.radiatorHeatW, 20); close(f.rates.curtailedSolarW, 70);
  close(r.final.counters.batteryJ, 350);
  checkLedger(r.final.counters, s, 35);
});

test('flux/cross-section context is dimensioned and never double-multiplies retained work', () => {
  const a = simulate(s => { s.radiation.effectiveFluxCm2S = 2; s.radiation.resetCrossSectionCm2PerDevice = 0.01; s.radiation.susceptibleDevices = 5; });
  const b = simulate(s => { s.radiation.effectiveFluxCm2S = 4; s.radiation.resetCrossSectionCm2PerDevice = 0.01; s.radiation.susceptibleDevices = 5; });
  close(a.radiation.resetRatePerS, 0.1); close(a.radiation.expectedResets, 3.5); close(a.radiation.noResetProbability, Math.exp(-3.5));
  close(b.radiation.expectedResets, 7);
  assert.deepEqual(a.final.counters, b.final.counters);
});

test('energy per delivered product accounts for initial battery energy, and closure is an explicit objective', () => {
  const a = simulate(s => { s.solar.areaM2 = 0; });
  assert.ok(a.final.counters.deliveredProducts > 0);
  assert.equal(a.summary.solarUsedJPerDeliveredProduct, 0);
  assert.ok(a.summary.busResourceJPerDeliveredProduct > 0);
  close(a.summary.busResourceJPerDeliveredProduct * a.final.counters.deliveredProducts,
    a.final.counters.solarUsedJ + fixture().battery.initialJ - a.final.counters.batteryJ);
  const b = simulate(s => { s.solar.areaM2 = 0; s.objectives.requireBatteryCycleClosure = true; });
  assert.ok(b.feasibility.reasons.some(reason => reason.includes('chosen initial state')));
});

test('sampling does not alter physical events, energy or retained work', () => {
  const a = simulate(s => { s.sampleS = 0.1; s.radiation.resets = [{ id: 'r', atS: 1.375, recoveryS: 2.125 }]; });
  const b = simulate(s => { s.sampleS = 7.1; s.radiation.resets = [{ id: 'r', atS: 1.375, recoveryS: 2.125 }]; });
  assert.deepEqual(a.final, b.final); assert.deepEqual(a.events, b.events); assert.deepEqual(a.segments, b.segments);
  assert.notEqual(a.timeline.length, b.timeline.length);
});

test('full authored scenarios and 72 combinations conserve work, energy, time, and products', () => {
  const scenarios = orbitalMissionExamples().map(e => e.scenario);
  for (const solar of [0, 80, 200]) for (const eta of [0.7, 1]) for (const storage of [0, 10, 1000]) for (const contactRate of [1, 10]) for (const reset of [false, true]) {
    const s = fixture(); s.solar.irradianceWm2 = solar; s.battery.chargeEfficiency = eta; s.battery.dischargeEfficiency = eta;
    s.storage.capacityBytes = storage; s.contacts[0].bytesS = contactRate;
    if (reset) s.radiation.resets = [{ id: 'r', atS: 12.25, recoveryS: 2.5 }];
    scenarios.push(s);
  }
  assert.equal(scenarios.length, 78);
  for (const s of scenarios) {
    const before = JSON.stringify(s); const r = simulateOrbitalMission(s); assert.equal(JSON.stringify(s), before);
    for (const f of r.timeline) {
      checkLedger(f.counters, s, f.atS);
      const p = f.rates;
      close(p.solarUsedW + p.batteryDischargeBusW, p.loadW + p.batteryChargeBusW, 'bus power balance');
      close(p.loadW, p.busCurrentA * s.loads.busV, 'DC current');
      close(p.radiatorHeatW, SIGMA * s.radiator.areaM2 * s.radiator.emissivity * s.radiator.viewFactor * (p.equilibriumTemperatureK ** 4 - s.radiator.sinkTemperatureK ** 4), 'radiative balance');
      assert.ok(p.batteryChargeBusW <= s.battery.maxChargeBusW + 1e-6);
      assert.ok(p.batteryDischargeBusW <= s.battery.maxDischargeBusW + 1e-6);
      assert.ok(p.operationsS <= s.service.computeOpsS * (1 + 1e-10));
      assert.ok(p.memoryBytesS <= s.service.memoryBytesS * (1 + 1e-10));
      if (!f.sunlit) assert.equal(p.solarAvailableW, 0);
      if (!f.contactId) assert.equal(p.downlinkBytesS, 0);
    }
    close(r.segments.reduce((n, seg) => n + (seg.endS - seg.startS) * seg.rates.loadW, 0), r.final.counters.loadEnergyJ, 'integrated bus load');
  }
});

test('sensitivity reruns the event model without mutating the source scenario', () => {
  const s = createOrbitalMissionScenario(); const before = JSON.stringify(s);
  const rows = orbitalMissionSensitivity(s, 'contact-rate', [2e5, 1e6, 5e6]);
  assert.equal(JSON.stringify(s), before);
  assert.ok(rows[0].deliveredProducts < rows[1].deliveredProducts);
  for (const row of rows) assert.ok(Number.isFinite(row.finalBatteryJ));
});

test('unsupported inputs are rejected instead of producing silent NaN or invented contacts', () => {
  for (const edit of [s => { s.battery.initialJ = 2000; }, s => { s.battery.dischargeEfficiency = 0; },
    s => { s.radiator.sinkTemperatureK = 400; }, s => { s.radiation.effectiveFluxCm2S = -1; },
    s => { s.solar.cellEfficiency = 1.1; }, s => { s.service.computeOpsS = NaN; },
    s => { s.battery.resumeJ = s.battery.reserveJ; }, s => { s.sampleS = 0.001; },
    s => { s.contacts.push({ id: 'overlap', startS: 1, endS: 2, bytesS: 1 }); }]) {
    const s = fixture(); edit(s); assert.throws(() => validateOrbitalMissionScenario(s), RangeError);
  }
  assert.throws(() => sampleOrbitalMission(simulate(), Infinity), RangeError);
});
