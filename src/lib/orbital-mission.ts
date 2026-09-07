/** R27: synthetic event-driven mission budget. See SCIENCE.md before interpreting. */
export const STEFAN_BOLTZMANN_W_M2_K4 = 5.670374419e-8;
export type OrbitalMode = 'compute' | 'write' | 'commit' | 'reset-wait' | 'buffer-wait'
  | 'power-wait' | 'thermal-wait' | 'bus-unavailable';
type WorkStage = 'compute' | 'write' | 'commit';

export interface OrbitalMissionScenario {
  kind: 'synthetic-orbital-mission';
  version: 1;
  workload: {
    kind: 'synthetic-independent-products';
    label: string;
    operationsPerProduct: number;
    memoryBytesPerProduct: number;
    outputBytesPerProduct: number;
    assumptions: readonly string[];
  };
  service: { computeOpsS: number; memoryBytesS: number; storageWriteBytesS: number; commitLatencyS: number };
  /** Starts sunlit at t=0. Prescribed illumination, not an orbit propagator. */
  illumination: { periodS: number; sunlitS: number };
  solar: {
    irradianceWm2: number; areaM2: number; cellEfficiency: number;
    incidenceCosine: number; derating: number;
    /** Aggregate delivery efficiency to regulated bus. Array/converter waste heat excluded from this payload radiator. */
    deliveryEfficiency: number;
  };
  battery: {
    capacityJ: number; initialJ: number; reserveJ: number; resumeJ: number;
    chargeEfficiency: number; dischargeEfficiency: number;
    maxChargeBusW: number; maxDischargeBusW: number;
  };
  loads: {
    busV: number;
    /** Includes state retention and reset/relaunch support; stays on while payload is paused. */
    housekeepingW: number;
    computeW: number; storageWriteW: number; commitW: number;
    transmitterW: number; transmitterRfEfficiency: number;
  };
  radiator: {
    areaM2: number; emissivity: number; viewFactor: number; maxTemperatureK: number; sinkTemperatureK: number;
    absorbedSunlitW: number; absorbedEclipseW: number;
  };
  storage: { capacityBytes: number };
  /** Explicit non-overlapping contacts with sustained useful payload rate, including protocol overhead. */
  contacts: readonly { id: string; startS: number; endS: number; bytesS: number }[];
  radiation: {
    kind: 'synthetic-effective-see-rate';
    /** Already angle-integrated effective flux, particles/(cm² s); NOT per steradian. */
    effectiveFluxCm2S: number;
    resetCrossSectionCm2PerDevice: number;
    susceptibleDevices: number;
    /** Scripted events drive the trace. They are not a Poisson sample or a forecast. */
    resets: readonly { id: string; atS: number; recoveryS: number }[];
  };
  objectives: { retainedProducts: number; deliveredProducts: number; requireBatteryCycleClosure: boolean };
  durationS: number; sampleS: number;
}

export interface OrbitalRates {
  solarAvailableW: number; solarUsedW: number; curtailedSolarW: number;
  loadW: number; busCurrentA: number; batteryChargeBusW: number; batteryDischargeBusW: number;
  batteryStoredRateW: number; batteryLossW: number; radioExportW: number;
  internalHeatW: number; absorbedEnvironmentW: number; radiatorHeatW: number;
  netRadiatorCapacityW: number; equilibriumTemperatureK: number;
  housekeepingUnservedW: number; thermalExcessW: number;
  executedWorkEquivalentsS: number; operationsS: number; memoryBytesS: number;
  storageWriteBytesS: number; downlinkBytesS: number;
}

export interface OrbitalCounters {
  kind: 'synthetic-orbital-work-energy-ledger';
  batteryJ: number;
  executedWorkEquivalents: number;
  /** Entire products committed to nonvolatile storage, including already delivered products. */
  retainedUsefulProducts: number;
  deliveredProducts: number;
  /** Whole product slots remain occupied until a complete product is acknowledged. */
  onboardBytes: number;
  receiverPartialProductBytes: number;
  /** Completed arithmetic awaiting write/commit still counts as pending, not retained. */
  pendingWorkEquivalents: number;
  lostWorkEquivalents: number;
  operations: number; memoryBytes: number; storageWriteBytes: number; downlinkBytes: number;
  solarAvailableJ: number; solarUsedJ: number; curtailedSolarJ: number;
  loadEnergyJ: number; batteryLossJ: number; radioExportJ: number;
  radiatorHeatJ: number; absorbedEnvironmentJ: number;
  housekeepingUnservedJ: number; thermalExcessJ: number;
  computeS: number; storageS: number; resetS: number; bufferWaitS: number;
  powerWaitS: number; thermalWaitS: number; busUnavailableS: number;
  handledResets: number; busOutages: number;
}

export interface OrbitalFrame {
  atS: number; mode: OrbitalMode; sunlit: boolean; contactId: string | null;
  batteryRestricted: boolean; rates: OrbitalRates; counters: OrbitalCounters;
}
export interface OrbitalSegment extends Omit<OrbitalFrame, 'atS' | 'counters'> {
  startS: number; endS: number; start: OrbitalCounters; end: OrbitalCounters;
}
export interface OrbitalEvent {
  atS: number;
  kind: 'sunlight' | 'eclipse' | 'contact-open' | 'contact-close' | 'reset' | 'reset-complete'
    | 'compute-complete' | 'write-complete' | 'product-retained' | 'product-delivered'
    | 'battery-reserve' | 'battery-resume' | 'bus-unavailable' | 'bus-restored';
  detail: string; id?: string; lostWorkEquivalents?: number;
}
export interface OrbitalMissionResult {
  kind: 'synthetic-orbital-mission-result'; version: 1; durationS: number;
  service: { computeS: number; memoryS: number; workStepS: number; storageWriteS: number; commitS: number; noPauseProductS: number };
  bounds: { sunlitSolarBusW: number; radiatorEmissionLimitW: number; plannedContactBytes: number; bufferProductSlots: number };
  radiation: { resetRatePerS: number; expectedResets: number; noResetProbability: number; scriptedResetCount: number; interpretation: string };
  events: OrbitalEvent[]; segments: OrbitalSegment[]; timeline: OrbitalFrame[]; final: OrbitalFrame;
  feasibility: {
    kind: 'synthetic-budget-checks'; passesDeclaredChecks: boolean;
    retainedTargetPass: boolean; deliveredTargetPass: boolean;
    housekeepingPass: boolean; thermalPass: boolean; batteryCycleClosurePass: boolean;
    batteryCycleChangeJ: number; reasons: string[];
  };
  summary: { retainedProductsPerWallS: number; deliveredProductsPerWallS: number;
    solarUsedJPerDeliveredProduct: number | null;
    /** Bus load plus battery losses; includes depletion of initial stored energy. */
    busResourceJPerDeliveredProduct: number | null;
    batteryMinimumJ: number; backlogMaximumBytes: number };
}

const TIME_EPS = 1e-8;
const ENERGY_EPS = 1e-6;
const zero = (batteryJ: number): OrbitalCounters => ({
  kind: 'synthetic-orbital-work-energy-ledger', batteryJ, executedWorkEquivalents: 0,
  retainedUsefulProducts: 0, deliveredProducts: 0, onboardBytes: 0, receiverPartialProductBytes: 0,
  pendingWorkEquivalents: 0, lostWorkEquivalents: 0, operations: 0, memoryBytes: 0, storageWriteBytes: 0,
  downlinkBytes: 0, solarAvailableJ: 0, solarUsedJ: 0, curtailedSolarJ: 0, loadEnergyJ: 0,
  batteryLossJ: 0, radioExportJ: 0, radiatorHeatJ: 0, absorbedEnvironmentJ: 0,
  housekeepingUnservedJ: 0, thermalExcessJ: 0, computeS: 0, storageS: 0, resetS: 0,
  bufferWaitS: 0, powerWaitS: 0, thermalWaitS: 0, busUnavailableS: 0, handledResets: 0, busOutages: 0,
});

export function validateOrbitalMissionScenario(s: OrbitalMissionScenario): void {
  const issues: string[] = [];
  const check = (key: string, value: number, min: number, max: number, integer = false) => {
    if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) issues.push(`${key}: expected ${integer ? 'integer ' : ''}[${min}, ${max}]`);
  };
  if (s.kind !== 'synthetic-orbital-mission' || s.version !== 1 || s.workload.kind !== 'synthetic-independent-products'
    || s.radiation.kind !== 'synthetic-effective-see-rate') issues.push('unsupported kind/version');
  if (!s.workload.label || !s.workload.assumptions.length) issues.push('workload label and assumptions required');
  for (const key of ['operationsPerProduct', 'memoryBytesPerProduct', 'outputBytesPerProduct'] as const) check(`workload.${key}`, s.workload[key], 1, 1e20);
  for (const key of ['computeOpsS', 'memoryBytesS', 'storageWriteBytesS'] as const) check(`service.${key}`, s.service[key], 1, 1e20);
  check('service.commitLatencyS', s.service.commitLatencyS, 0, 1e5);
  check('durationS', s.durationS, 0.01, 1e6); check('sampleS', s.sampleS, 0.001, 1e6);
  if (s.durationS / s.sampleS > 10000) issues.push('at most 10000 regular samples');
  check('illumination.periodS', s.illumination.periodS, 1, 1e7);
  check('illumination.sunlitS', s.illumination.sunlitS, 0, s.illumination.periodS);
  if (s.durationS / s.illumination.periodS > 5000) issues.push('at most 5000 prescribed illumination cycles');
  check('solar.irradianceWm2', s.solar.irradianceWm2, 0, 1e6); check('solar.areaM2', s.solar.areaM2, 0, 1e6);
  for (const key of ['cellEfficiency', 'incidenceCosine', 'derating', 'deliveryEfficiency'] as const) check(`solar.${key}`, s.solar[key], 0, 1);
  check('battery.capacityJ', s.battery.capacityJ, 1, 1e14);
  check('battery.initialJ', s.battery.initialJ, 0, s.battery.capacityJ);
  check('battery.reserveJ', s.battery.reserveJ, 0, s.battery.capacityJ);
  check('battery.resumeJ', s.battery.resumeJ, 0, s.battery.capacityJ);
  if (s.battery.resumeJ <= s.battery.reserveJ) issues.push('battery.resumeJ must exceed reserveJ');
  for (const key of ['chargeEfficiency', 'dischargeEfficiency'] as const) check(`battery.${key}`, s.battery[key], 0.01, 1);
  for (const key of ['maxChargeBusW', 'maxDischargeBusW'] as const) check(`battery.${key}`, s.battery[key], 0, 1e9);
  check('loads.busV', s.loads.busV, 0.1, 1e5);
  for (const key of ['housekeepingW', 'computeW', 'storageWriteW', 'commitW', 'transmitterW'] as const) check(`loads.${key}`, s.loads[key], 0, 1e9);
  check('loads.transmitterRfEfficiency', s.loads.transmitterRfEfficiency, 0, 1);
  for (const key of ['areaM2', 'emissivity', 'viewFactor'] as const) check(`radiator.${key}`, s.radiator[key], 1e-6, key === 'areaM2' ? 1e6 : 1);
  check('radiator.maxTemperatureK', s.radiator.maxTemperatureK, 1, 3000);
  check('radiator.sinkTemperatureK', s.radiator.sinkTemperatureK, 0, s.radiator.maxTemperatureK);
  for (const key of ['absorbedSunlitW', 'absorbedEclipseW'] as const) check(`radiator.${key}`, s.radiator[key], 0, 1e12);
  check('storage.capacityBytes', s.storage.capacityBytes, 0, 1e20);
  check('radiation.effectiveFluxCm2S', s.radiation.effectiveFluxCm2S, 0, 1e15);
  check('radiation.resetCrossSectionCm2PerDevice', s.radiation.resetCrossSectionCm2PerDevice, 0, 1e6);
  check('radiation.susceptibleDevices', s.radiation.susceptibleDevices, 0, 1e8, true);
  for (const key of ['retainedProducts', 'deliveredProducts'] as const) check(`objectives.${key}`, s.objectives[key], 0, 1e12, true);
  if (typeof s.objectives.requireBatteryCycleClosure !== 'boolean') issues.push('requireBatteryCycleClosure must be boolean');
  if (s.contacts.length > 1000 || s.radiation.resets.length > 1000) issues.push('at most 1000 contacts and resets');
  const ids = new Set<string>();
  for (const c of [...s.contacts].sort((a, b) => a.startS - b.startS)) {
    if (!c.id || ids.has(c.id)) issues.push('contact IDs must be nonempty and unique'); ids.add(c.id);
    check(`contact ${c.id} start`, c.startS, 0, s.durationS); check(`contact ${c.id} end`, c.endS, 0, s.durationS);
    check(`contact ${c.id} rate`, c.bytesS, 1, 1e15);
    if (c.endS <= c.startS) issues.push('contacts must have positive duration');
  }
  const sorted = [...s.contacts].sort((a, b) => a.startS - b.startS);
  for (let i = 1; i < sorted.length; i++) if (sorted[i].startS < sorted[i - 1].endS) issues.push('contacts may not overlap');
  ids.clear();
  for (const r of s.radiation.resets) {
    if (!r.id || ids.has(r.id)) issues.push('reset IDs must be nonempty and unique'); ids.add(r.id);
    check(`reset ${r.id} time`, r.atS, 0, s.durationS); check(`reset ${r.id} recovery`, r.recoveryS, 0, 1e6);
    if (r.atS >= s.durationS) issues.push('resets must occur before the observation horizon');
  }
  if (issues.length) throw new RangeError(`Invalid orbital mission:\n${issues.join('\n')}`);
}

function integrate(c: OrbitalCounters, r: OrbitalRates, mode: OrbitalMode, dt: number): OrbitalCounters {
  const work = r.executedWorkEquivalentsS * dt;
  return { ...c, batteryJ: c.batteryJ + r.batteryStoredRateW * dt,
    executedWorkEquivalents: c.executedWorkEquivalents + work,
    pendingWorkEquivalents: c.pendingWorkEquivalents + work,
    receiverPartialProductBytes: c.receiverPartialProductBytes + r.downlinkBytesS * dt,
    operations: c.operations + r.operationsS * dt, memoryBytes: c.memoryBytes + r.memoryBytesS * dt,
    storageWriteBytes: c.storageWriteBytes + r.storageWriteBytesS * dt, downlinkBytes: c.downlinkBytes + r.downlinkBytesS * dt,
    solarAvailableJ: c.solarAvailableJ + r.solarAvailableW * dt, solarUsedJ: c.solarUsedJ + r.solarUsedW * dt,
    curtailedSolarJ: c.curtailedSolarJ + r.curtailedSolarW * dt, loadEnergyJ: c.loadEnergyJ + r.loadW * dt,
    batteryLossJ: c.batteryLossJ + r.batteryLossW * dt, radioExportJ: c.radioExportJ + r.radioExportW * dt,
    radiatorHeatJ: c.radiatorHeatJ + r.radiatorHeatW * dt, absorbedEnvironmentJ: c.absorbedEnvironmentJ + r.absorbedEnvironmentW * dt,
    housekeepingUnservedJ: c.housekeepingUnservedJ + r.housekeepingUnservedW * dt,
    thermalExcessJ: c.thermalExcessJ + r.thermalExcessW * dt,
    computeS: c.computeS + (mode === 'compute' ? dt : 0), storageS: c.storageS + (['write', 'commit'].includes(mode) ? dt : 0),
    resetS: c.resetS + (mode === 'reset-wait' ? dt : 0), bufferWaitS: c.bufferWaitS + (mode === 'buffer-wait' ? dt : 0),
    powerWaitS: c.powerWaitS + (mode === 'power-wait' ? dt : 0), thermalWaitS: c.thermalWaitS + (mode === 'thermal-wait' ? dt : 0),
    busUnavailableS: c.busUnavailableS + (mode === 'bus-unavailable' ? dt : 0),
  };
}

export function simulateOrbitalMission(s: OrbitalMissionScenario): OrbitalMissionResult {
  validateOrbitalMissionScenario(s);
  const computeS = s.workload.operationsPerProduct / s.service.computeOpsS;
  const memoryS = s.workload.memoryBytesPerProduct / s.service.memoryBytesS;
  const workStepS = Math.max(computeS, memoryS);
  const storageWriteS = s.workload.outputBytesPerProduct / s.service.storageWriteBytesS;
  const commitS = s.service.commitLatencyS;
  if (workStepS < 1e-6 || storageWriteS < 1e-6) throw new RangeError('Work and storage transfers must take at least one microsecond.');
  if (s.durationS / (workStepS + storageWriteS + commitS) > 20000) throw new RangeError('At most 20000 unpaused products are supported.');
  const sunlitSolarBusW = s.solar.irradianceWm2 * s.solar.areaM2 * s.solar.cellEfficiency * s.solar.incidenceCosine * s.solar.derating * s.solar.deliveryEfficiency;
  const radCoefficient = STEFAN_BOLTZMANN_W_M2_K4 * s.radiator.areaM2 * s.radiator.emissivity * s.radiator.viewFactor;
  const radiatorEmissionLimitW = radCoefficient * (s.radiator.maxTemperatureK ** 4 - s.radiator.sinkTemperatureK ** 4);
  const productBytes = s.workload.outputBytesPerProduct;
  const bufferProductSlots = Math.floor(s.storage.capacityBytes / productBytes);
  const events: OrbitalEvent[] = [];
  for (let t = 0; t <= s.durationS; t += s.illumination.periodS) {
    if (s.illumination.sunlitS > 0) events.push({ atS: t, kind: 'sunlight', detail: 'Prescribed sunlit interval begins.' });
    if (s.illumination.sunlitS < s.illumination.periodS && t + s.illumination.sunlitS <= s.durationS)
      events.push({ atS: t + s.illumination.sunlitS, kind: 'eclipse', detail: 'Prescribed eclipse interval begins; solar generation is zero.' });
  }
  for (const c of s.contacts) {
    events.push({ atS: c.startS, kind: 'contact-open', id: c.id, detail: 'Scheduled contact opens; useful byte rate is an assumption.' });
    events.push({ atS: c.endS, kind: 'contact-close', id: c.id, detail: 'Contact closes; acknowledged receiver progress is retained.' });
  }
  const externalTimes = [...new Set([...events.map(e => e.atS), ...s.radiation.resets.map(r => r.atS), s.durationS])].sort((a, b) => a - b);
  const resets = [...s.radiation.resets].sort((a, b) => a.atS - b.atS);
  let externalIndex = 0, resetIndex = 0;
  let atS = 0, resetUntilS = 0;
  const state: { stage: WorkStage } = { stage: 'compute' };
  let remainingStageS = workStepS;
  let counters = zero(s.battery.initialJ);
  let restricted = counters.batteryJ <= s.battery.reserveJ + ENERGY_EPS;
  let busWasAvailable = true;
  let batteryMinimumJ = counters.batteryJ, backlogMaximumBytes = 0;
  const segments: OrbitalSegment[] = [];

  const discardPending = () => {
    const lost = counters.pendingWorkEquivalents;
    counters.lostWorkEquivalents += lost;
    counters.pendingWorkEquivalents = 0;
    state.stage = 'compute'; remainingStageS = workStepS;
    return lost;
  };

  const chooseFrame = (): OrbitalFrame => {
    const remainder = atS % s.illumination.periodS;
    const cycleS = s.illumination.periodS - remainder < TIME_EPS ? 0 : remainder;
    const sunlit = cycleS < s.illumination.sunlitS - TIME_EPS || s.illumination.sunlitS === s.illumination.periodS;
    const contact = s.contacts.find(c => c.startS <= atS + TIME_EPS && c.endS > atS + TIME_EPS);
    const solarAvailableW = sunlit ? sunlitSolarBusW : 0;
    const environmentW = sunlit ? s.radiator.absorbedSunlitW : s.radiator.absorbedEclipseW;
    const heatCapacityW = radiatorEmissionLimitW - environmentW;
    const dischargeAllowedW = counters.batteryJ > ENERGY_EPS ? s.battery.maxDischargeBusW : 0;
    const discretionaryDischargeW = !restricted && counters.batteryJ > s.battery.reserveJ + ENERGY_EPS ? dischargeAllowedW : 0;
    const housekeepingSuppliedW = Math.min(s.loads.housekeepingW, solarAvailableW + dischargeAllowedW);
    const housekeepingUnservedW = s.loads.housekeepingW - housekeepingSuppliedW;
    const baseDischargeW = Math.max(0, housekeepingSuppliedW - solarAvailableW);
    const baseHeatW = housekeepingSuppliedW + baseDischargeW * (1 / s.battery.dischargeEfficiency - 1);
    const available = housekeepingUnservedW <= 1e-9 && baseHeatW <= heatCapacityW + 1e-9;
    const fits = (loadW: number, rfW: number) => ({
      power: loadW <= solarAvailableW + discretionaryDischargeW + 1e-9,
      thermal: loadW - rfW + Math.max(0, loadW - solarAvailableW) * (1 / s.battery.dischargeEfficiency - 1) <= heatCapacityW + 1e-9,
    });
    let loadW = housekeepingSuppliedW;
    let radioExportW = 0, downlinkBytesS = 0;
    // Fixed priority: housekeeping, contact drain, then new computation/storage work.
    if (available && contact && counters.retainedUsefulProducts > counters.deliveredProducts) {
      const rf = s.loads.transmitterW * s.loads.transmitterRfEfficiency;
      const pass = fits(loadW + s.loads.transmitterW, rf);
      if (pass.power && pass.thermal) { loadW += s.loads.transmitterW; radioExportW = rf; downlinkBytesS = contact.bytesS; }
    }
    let mode: OrbitalMode;
    const hasProductSlot = counters.pendingWorkEquivalents > 0
      || counters.retainedUsefulProducts - counters.deliveredProducts < bufferProductSlots;
    if (!available) mode = 'bus-unavailable';
    else if (atS < resetUntilS - TIME_EPS) mode = 'reset-wait';
    else if (!hasProductSlot) mode = 'buffer-wait';
    else {
      const payloadW = state.stage === 'compute' ? s.loads.computeW : state.stage === 'write' ? s.loads.storageWriteW : s.loads.commitW;
      const pass = fits(loadW + payloadW, radioExportW);
      if (!pass.power) mode = 'power-wait';
      else if (!pass.thermal) mode = 'thermal-wait';
      else { mode = state.stage; loadW += payloadW; }
    }
    const batteryDischargeBusW = Math.max(0, loadW - solarAvailableW);
    const dischargeLossW = batteryDischargeBusW * (1 / s.battery.dischargeEfficiency - 1);
    const heatBeforeChargeW = loadW - radioExportW + dischargeLossW;
    let batteryChargeBusW = counters.batteryJ < s.battery.capacityJ - ENERGY_EPS
      ? Math.min(Math.max(0, solarAvailableW - loadW), s.battery.maxChargeBusW) : 0;
    if (s.battery.chargeEfficiency < 1) batteryChargeBusW = Math.min(batteryChargeBusW,
      Math.max(0, heatCapacityW - heatBeforeChargeW) / (1 - s.battery.chargeEfficiency));
    const chargeLossW = batteryChargeBusW * (1 - s.battery.chargeEfficiency);
    const batteryLossW = chargeLossW + dischargeLossW;
    const solarUsedW = Math.min(solarAvailableW, loadW + batteryChargeBusW);
    const internalHeatW = loadW - radioExportW + batteryLossW;
    const radiatorHeatW = internalHeatW + environmentW;
    const rates: OrbitalRates = {
      solarAvailableW, solarUsedW, curtailedSolarW: solarAvailableW - solarUsedW,
      loadW, busCurrentA: loadW / s.loads.busV, batteryChargeBusW, batteryDischargeBusW,
      batteryStoredRateW: batteryChargeBusW * s.battery.chargeEfficiency - batteryDischargeBusW / s.battery.dischargeEfficiency,
      batteryLossW, radioExportW, internalHeatW, absorbedEnvironmentW: environmentW, radiatorHeatW,
      netRadiatorCapacityW: heatCapacityW,
      equilibriumTemperatureK: (radiatorHeatW / radCoefficient + s.radiator.sinkTemperatureK ** 4) ** 0.25,
      housekeepingUnservedW, thermalExcessW: Math.max(0, radiatorHeatW - radiatorEmissionLimitW),
      executedWorkEquivalentsS: mode === 'compute' ? 1 / workStepS : 0,
      operationsS: mode === 'compute' ? s.workload.operationsPerProduct / workStepS : 0,
      memoryBytesS: mode === 'compute' ? s.workload.memoryBytesPerProduct / workStepS : 0,
      storageWriteBytesS: mode === 'write' ? s.service.storageWriteBytesS : 0, downlinkBytesS,
    };
    return { atS, mode, sunlit, contactId: contact?.id ?? null, batteryRestricted: restricted, rates, counters: { ...counters } };
  };

  let final: OrbitalFrame;
  for (let loops = 0; ; loops++) {
    if (loops > 150000) throw new RangeError('Orbital event budget exceeded.');
    // Complete work/commit and acknowledgements before simultaneous resets.
    while (remainingStageS <= TIME_EPS) {
      if (state.stage === 'compute') {
        counters.pendingWorkEquivalents = 1;
        state.stage = 'write'; remainingStageS = storageWriteS;
        events.push({ atS, kind: 'compute-complete', detail: 'Arithmetic finished; the product is still uncommitted.' });
      } else if (state.stage === 'write') {
        state.stage = 'commit'; remainingStageS = commitS;
        events.push({ atS, kind: 'write-complete', detail: 'Product bytes written; atomic commit pending.' });
      } else {
        counters.retainedUsefulProducts++;
        counters.pendingWorkEquivalents = 0;
        counters.onboardBytes = (counters.retainedUsefulProducts - counters.deliveredProducts) * productBytes;
        state.stage = 'compute'; remainingStageS = workStepS;
        events.push({ atS, kind: 'product-retained', detail: 'Complete product committed to durable onboard storage.' });
      }
    }
    if (counters.receiverPartialProductBytes >= productBytes * (1 - 1e-10)) {
      counters.deliveredProducts++;
      counters.receiverPartialProductBytes = 0;
      counters.onboardBytes = (counters.retainedUsefulProducts - counters.deliveredProducts) * productBytes;
      events.push({ atS, kind: 'product-delivered', detail: 'Complete product acknowledged on the ground; its onboard slot is freed.' });
    }
    if (!restricted && counters.batteryJ <= s.battery.reserveJ + ENERGY_EPS) {
      restricted = true; events.push({ atS, kind: 'battery-reserve', detail: 'Protect the reserve: optional loads require direct solar power until the resume threshold.' });
    } else if (restricted && counters.batteryJ >= s.battery.resumeJ - ENERGY_EPS) {
      restricted = false; events.push({ atS, kind: 'battery-resume', detail: 'Stored energy reaches the resume threshold; optional battery-supported loads may restart.' });
    }
    if (resetUntilS > 0 && atS >= resetUntilS - TIME_EPS) {
      resetUntilS = 0; events.push({ atS, kind: 'reset-complete', detail: 'Scripted processor reset/relaunch pause ends.' });
    }
    while (resetIndex < resets.length && resets[resetIndex].atS <= atS + TIME_EPS) {
      const reset = resets[resetIndex++];
      const lost = discardPending(); counters.handledResets++;
      resetUntilS = Math.max(resetUntilS, atS + reset.recoveryS);
      events.push({ atS, kind: 'reset', id: reset.id, lostWorkEquivalents: lost,
        detail: 'Scripted payload reset: discard uncommitted work; durable products and independent radio remain intact.' });
    }
    let frame = chooseFrame();
    if (frame.mode === 'bus-unavailable' && busWasAvailable) {
      const lost = discardPending(); counters.busOutages++;
      events.push({ atS, kind: 'bus-unavailable', lostWorkEquivalents: lost, detail: 'Housekeeping power or thermal budget fails; volatile payload state is discarded.' });
      frame = chooseFrame();
    } else if (frame.mode !== 'bus-unavailable' && !busWasAvailable) events.push({ atS, kind: 'bus-restored', detail: 'Housekeeping is supportable again under the declared steady-state bounds.' });
    busWasAvailable = frame.mode !== 'bus-unavailable';
    batteryMinimumJ = Math.min(batteryMinimumJ, counters.batteryJ);
    backlogMaximumBytes = Math.max(backlogMaximumBytes, counters.onboardBytes);
    if (atS >= s.durationS - TIME_EPS) { final = { ...frame, atS: s.durationS }; break; }
    while (externalIndex < externalTimes.length && externalTimes[externalIndex] <= atS + TIME_EPS) externalIndex++;
    let dt = Math.min(s.durationS - atS, (externalTimes[externalIndex] ?? s.durationS) - atS);
    if (resetUntilS > atS + TIME_EPS) dt = Math.min(dt, resetUntilS - atS);
    if (['compute', 'write', 'commit'].includes(frame.mode)) dt = Math.min(dt, remainingStageS);
    if (frame.rates.downlinkBytesS > 0) dt = Math.min(dt, (productBytes - counters.receiverPartialProductBytes) / frame.rates.downlinkBytesS);
    const slope = frame.rates.batteryStoredRateW;
    if (slope > 0) {
      const target = restricted ? s.battery.resumeJ : s.battery.capacityJ;
      if (target > counters.batteryJ + ENERGY_EPS) dt = Math.min(dt, (target - counters.batteryJ) / slope);
    } else if (slope < 0) {
      const target = !restricted && counters.batteryJ > s.battery.reserveJ + ENERGY_EPS ? s.battery.reserveJ : 0;
      if (counters.batteryJ > target + ENERGY_EPS) dt = Math.min(dt, (counters.batteryJ - target) / -slope);
    }
    if (!(dt > 0)) throw new RangeError('Orbital event time is below representable resolution.');
    const start = { ...counters };
    counters = integrate(counters, frame.rates, frame.mode, dt);
    // Correct roundoff only after analytically stopping at a storage boundary.
    if (Math.abs(counters.batteryJ) < ENERGY_EPS) counters.batteryJ = 0;
    if (Math.abs(counters.batteryJ - s.battery.capacityJ) < ENERGY_EPS) counters.batteryJ = s.battery.capacityJ;
    if (['compute', 'write', 'commit'].includes(frame.mode)) remainingStageS -= dt;
    const next = atS + dt;
    segments.push({ startS: atS, endS: next, mode: frame.mode, sunlit: frame.sunlit,
      contactId: frame.contactId, batteryRestricted: restricted, rates: frame.rates, start, end: { ...counters } });
    atS = next;
  }
  const resetRatePerS = s.radiation.effectiveFluxCm2S * s.radiation.resetCrossSectionCm2PerDevice * s.radiation.susceptibleDevices;
  const expectedResets = resetRatePerS * s.durationS;
  const batteryCycleChangeJ = counters.batteryJ - s.battery.initialJ;
  const retainedTargetPass = counters.retainedUsefulProducts >= s.objectives.retainedProducts;
  const deliveredTargetPass = counters.deliveredProducts >= s.objectives.deliveredProducts;
  const housekeepingPass = counters.housekeepingUnservedJ < ENERGY_EPS && counters.busUnavailableS === 0;
  const thermalPass = counters.thermalExcessJ < ENERGY_EPS;
  const batteryCycleClosurePass = batteryCycleChangeJ >= -ENERGY_EPS;
  const reasons: string[] = [];
  if (!retainedTargetPass) reasons.push('The declared retained-product target is missed.');
  if (!deliveredTargetPass) reasons.push('The declared delivered-product target is missed.');
  if (!housekeepingPass) reasons.push('Housekeeping cannot operate throughout the observation horizon.');
  if (!thermalPass) reasons.push('The declared radiator bound is exceeded by unavoidable heat.');
  if (s.objectives.requireBatteryCycleClosure && !batteryCycleClosurePass) reasons.push('Final battery energy is below initial energy; this run does not demonstrate closure at the chosen initial state.');
  const result: OrbitalMissionResult = {
    kind: 'synthetic-orbital-mission-result', version: 1, durationS: s.durationS,
    service: { computeS, memoryS, workStepS, storageWriteS, commitS, noPauseProductS: workStepS + storageWriteS + commitS },
    bounds: { sunlitSolarBusW, radiatorEmissionLimitW, bufferProductSlots,
      plannedContactBytes: s.contacts.reduce((n, c) => n + (c.endS - c.startS) * c.bytesS, 0) },
    radiation: { resetRatePerS, expectedResets, noResetProbability: Math.exp(-expectedResets), scriptedResetCount: resets.length,
      interpretation: 'Effective constant-rate Poisson context only. Scripted resets, not this probability, drive the work ledger. No total-dose, latch-up or survival model.' },
    events: events.sort((a, b) => a.atS - b.atS), segments, timeline: [], final,
    feasibility: { kind: 'synthetic-budget-checks', passesDeclaredChecks: reasons.length === 0,
      retainedTargetPass, deliveredTargetPass, housekeepingPass, thermalPass, batteryCycleClosurePass, batteryCycleChangeJ, reasons },
    summary: { retainedProductsPerWallS: counters.retainedUsefulProducts / s.durationS,
      deliveredProductsPerWallS: counters.deliveredProducts / s.durationS,
      solarUsedJPerDeliveredProduct: counters.deliveredProducts ? counters.solarUsedJ / counters.deliveredProducts : null,
      busResourceJPerDeliveredProduct: counters.deliveredProducts ? (counters.loadEnergyJ + counters.batteryLossJ) / counters.deliveredProducts : null,
      batteryMinimumJ, backlogMaximumBytes },
  };
  const times = new Set([0, s.durationS, ...events.map(e => e.atS), ...segments.map(seg => seg.startS)]);
  for (let i = 1; i * s.sampleS < s.durationS; i++) times.add(i * s.sampleS);
  result.timeline = [...times].sort((a, b) => a - b).map(t => sampleOrbitalMission(result, t));
  return result;
}

export function sampleOrbitalMission(result: OrbitalMissionResult, atS: number): OrbitalFrame {
  if (!Number.isFinite(atS) || atS < 0 || atS > result.durationS) throw new RangeError('Sample time outside mission horizon.');
  if (atS === result.durationS) return { ...result.final, rates: { ...result.final.rates }, counters: { ...result.final.counters } };
  let lo = 0, hi = result.segments.length - 1;
  while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (result.segments[mid].startS <= atS) lo = mid; else hi = mid - 1; }
  const seg = result.segments[lo];
  return { atS, mode: seg.mode, sunlit: seg.sunlit, contactId: seg.contactId, batteryRestricted: seg.batteryRestricted,
    rates: { ...seg.rates }, counters: integrate(seg.start, seg.rates, seg.mode, atS - seg.startS) };
}

/** Explicit sensitivity sweep; each row reruns the deterministic event model. */
export function orbitalMissionSensitivity(s: OrbitalMissionScenario, field: 'solar-area' | 'battery-capacity' | 'radiator-area' | 'contact-rate' | 'reset-recovery', values: readonly number[]) {
  if (values.length > 50) throw new RangeError('At most 50 sensitivity values.');
  return values.map(value => {
    const copy = structuredClone(s);
    if (field === 'solar-area') copy.solar.areaM2 = value;
    else if (field === 'battery-capacity') {
      const scale = value / copy.battery.capacityJ;
      copy.battery.capacityJ = value; copy.battery.initialJ *= scale; copy.battery.reserveJ *= scale; copy.battery.resumeJ *= scale;
    } else if (field === 'radiator-area') copy.radiator.areaM2 = value;
    else if (field === 'contact-rate') copy.contacts = copy.contacts.map(c => ({ ...c, bytesS: value }));
    else if (field === 'reset-recovery') copy.radiation.resets = copy.radiation.resets.map(r => ({ ...r, recoveryS: value }));
    else throw new RangeError('Unknown sensitivity field.');
    const r = simulateOrbitalMission(copy);
    return { field, value, retainedProducts: r.final.counters.retainedUsefulProducts, deliveredProducts: r.final.counters.deliveredProducts,
      finalBatteryJ: r.final.counters.batteryJ, lostWorkEquivalents: r.final.counters.lostWorkEquivalents,
      maximumBacklogBytes: r.summary.backlogMaximumBytes, passesDeclaredChecks: r.feasibility.passesDeclaredChecks, reasons: r.feasibility.reasons };
  });
}
