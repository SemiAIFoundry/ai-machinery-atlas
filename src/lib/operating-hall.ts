/**
 * R23: a deterministic teaching model, not a plant design or vendor forecast.
 * All scenario inputs and counters are synthetic. See SCIENCE.md for boundaries.
 * Numbers use SI units; a work step is one fixed global workload iteration.
 */
export const OPERATING_HALL_VERSION = 1 as const;
export const GATES = ['electrical', 'thermal', 'fabric', 'software', 'operations'] as const;
export type CommissioningGate = typeof GATES[number];
export type HallPhase = 'not-ready' | 'run' | 'checkpoint-write' | 'checkpoint-commit'
  | 'recovery-wait' | 'recovery-read';

export interface SyntheticWorkload {
  kind: 'synthetic-fixed-global-workload';
  id: string;
  label: string;
  /** Arithmetic operations for one fixed GLOBAL step; an FMA counts as two. */
  operationsPerStep: number;
  /** Aggregate traffic crossing package memory interfaces, not resident capacity. */
  memoryBytesPerStep: number;
  /** Aggregate transmitted payload; each byte counted once, not again at its receiver. */
  networkBytesPerStep: number;
  /** Complete global restart state. Fixed workload, independent of admitted rack count. */
  checkpointBytes: number;
  assumptions: readonly string[];
}

export interface OperatingHallScenario {
  kind: 'synthetic-operating-hall';
  version: typeof OPERATING_HALL_VERSION;
  workload: SyntheticWorkload;
  installed: { racks: number; packagesPerRack: number };
  electrical: {
    /** Incremental facility input limit for this modeled hall, not a utility forecast. */
    facilityFeedLimitW: number;
    /** Dedicated DC rack input. Do not substitute AC line voltage. */
    rackBusV: number;
    rackInputLimitA: number;
    /** Equivalent aggregate DC package rail; no claim of one physical silicon rail. */
    packageBusV: number;
    packageRailLimitA: number;
    /** Rack-input to package/auxiliary output efficiency; losses INSIDE IT boundary. */
    conversionEfficiency: number;
    /** Constant scenario ratio: facility energy / IT-input energy; not measured annual PUE. */
    pue: number;
    /** Output-side IT auxiliary load: host, memory outside package, fabric and storage. */
    auxiliaryRackW: number;
    /** Total package DC load in each operating state, not additions to an idle load. */
    packageRunW: number;
    packageCheckpointW: number;
    packageRecoveryW: number;
  };
  cooling: {
    /** Total closed-loop mass flow through the admitted hall. This is not water consumption. */
    massFlowKgS: number;
    specificHeatJkgK: number;
    maxRiseK: number;
  };
  service: {
    computeOpsPerPackageS: number;
    memoryBytesPerPackageS: number;
    networkBytesPerRackS: number;
    /** External aggregate fabric ceiling; ideal sharding below this ceiling. */
    networkHallLimitBytesS: number;
    checkpointBytesPerRackS: number;
    /** Dedicated checkpoint path, included in IT auxiliary power. */
    checkpointHallLimitBytesS: number;
    /** Compute and memory always use the ideal roofline max bound. */
    communication: 'serialized' | 'fully-overlapped';
  };
  /** Synthetic times from scenario start; null means that gate never opens. */
  commissioning: Record<CommissioningGate, number | null>;
  checkpoint: {
    /** Running time requested between checkpoints, rounded UP to a complete work step. */
    intervalRunS: number;
    /** After writing all bytes, blocking atomic commit; no bytes move during this delay. */
    commitLatencyS: number;
  };
  faults: readonly {
    id: string;
    atS: number;
    /** Time to repair/relaunch BEFORE reading a valid checkpoint, if one exists. */
    recoveryDelayS: number;
    /** These all stop the same job. Cooling/feed loss and damaged checkpoints are excluded. */
    cause: 'worker-stop' | 'fabric-interruption' | 'software-stop';
  }[];
  durationS: number;
  sampleS: number;
}

export interface HallAdmission {
  installedRacks: number;
  admittedRacks: number;
  admittedPackages: number;
  dispatchFraction: number;
  /** Hardware/cooling admission only; commissioning is reported separately. */
  limits: {
    byFacilityFeed: number;
    byCoolant: number;
    rackCurrentPass: boolean;
    packageCurrentPass: boolean;
  };
  maxPackageW: number;
  maxPackageCurrentA: number;
  maxRackItW: number;
  maxRackCurrentA: number;
  coolantCapacityW: number;
  readyAtS: number | null;
  neverReadyGates: CommissioningGate[];
  reasons: string[];
}

export interface HallService {
  /** Null when no rack is admitted. Avoid Infinity in JSON/UI. */
  computeS: number | null;
  memoryS: number | null;
  localS: number | null;
  communicationS: number | null;
  stepS: number | null;
  stepsPerRunS: number;
  computeCapacityOpsS: number;
  memoryCapacityBytesS: number;
  networkCapacityBytesS: number;
  checkpointCapacityBytesS: number;
  checkpointWriteS: number | null;
  checkpointTotalS: number | null;
  stepsPerCheckpoint: number;
  effectiveCheckpointRunS: number | null;
  /** Serialized communication can remain consequential even when local compute is longer. */
  criticalPath: string;
}

export interface HallRates {
  /** Step-average rates in the run phase. They are not instantaneous bus burst rates. */
  executedWorkEquivalentsS: number;
  operationsS: number;
  workloadMemoryBytesS: number;
  workloadNetworkBytesS: number;
  checkpointWriteBytesS: number;
  checkpointReadBytesS: number;
  packageW: number;
  packageCurrentA: number;
  rackItW: number;
  rackCurrentA: number;
  /** Sum of separate DC rack currents at a common voltage; not facility AC current. */
  totalRackCurrentA: number;
  itW: number;
  conversionLossW: number;
  facilityOverheadW: number;
  facilityW: number;
  /** Ideal aggregate loop captures all IT input power as heat. */
  coolantHeatW: number;
  coolantMassFlowKgS: number;
  coolantRiseK: number;
  /** IT heat + facility overhead heat. Never add coolant heat to facility power again. */
  facilityRejectedHeatW: number;
}

export interface HallCounters {
  kind: 'synthetic-work-and-energy-ledger';
  /** Includes executed arithmetic that is subsequently lost and must be replayed. */
  executedWorkEquivalents: number;
  checkpointedSteps: number;
  volatileCompletedSteps: number;
  /** Fraction of the current unfinished step; never counted as useful completed work. */
  inFlightWorkEquivalents: number;
  lostWorkEquivalents: number;
  /** Completed steps still present: checkpointed + volatile; not all are restart-durable. */
  retainedUsefulSteps: number;
  workloadOperations: number;
  workloadMemoryBytes: number;
  workloadNetworkBytes: number;
  checkpointWriteBytes: number;
  checkpointReadBytes: number;
  itEnergyJ: number;
  facilityEnergyJ: number;
  coolantHeatJ: number;
  facilityRejectedHeatJ: number;
  runS: number;
  checkpointS: number;
  recoveryS: number;
  notReadyS: number;
  committedCheckpoints: number;
  handledFaults: number;
}

export interface HallSegment {
  startS: number;
  endS: number;
  phase: HallPhase;
  rates: HallRates;
  /** End precedes any event exactly at endS; next segment start follows that event. */
  start: HallCounters;
  end: HallCounters;
}

export type HallEvent = {
  atS: number;
  kind: 'gate-ready' | 'dispatch-start' | 'checkpoint-start' | 'checkpoint-written'
    | 'checkpoint-committed' | 'fault' | 'fault-ignored' | 'restore-start' | 'job-resume';
  detail: string;
  gate?: CommissioningGate;
  faultId?: string;
  lostWorkEquivalents?: number;
  interruptedPhase?: HallPhase;
};

export interface HallSample {
  atS: number;
  phase: HallPhase;
  rates: HallRates;
  counters: HallCounters;
}

export interface OperatingHallResult {
  kind: 'synthetic-operating-hall-result';
  version: typeof OPERATING_HALL_VERSION;
  durationS: number;
  admission: HallAdmission;
  service: HallService;
  events: HallEvent[];
  segments: HallSegment[];
  timeline: HallSample[];
  final: HallSample;
  summary: {
    retainedUsefulStepsPerWallS: number;
    checkpointedStepsPerWallS: number;
    /** Null with no completed retained work. Includes energy spent on lost work. */
    facilityJPerRetainedUsefulStep: number | null;
    averageItW: number;
    averageFacilityW: number;
    /** Null when no energy is consumed. */
    effectivePue: number | null;
  };
}

const phases = ['run', 'checkpoint-write', 'checkpoint-commit', 'recovery-wait', 'recovery-read'] as const;
const clampNearInteger = (n: number) => Math.abs(n - Math.round(n)) <= 1e-10 + 16 * Number.EPSILON * Math.abs(n)
  ? Math.round(n) : n;

/** Reject invalid/unsupported inputs rather than silently repairing them. */
export function validateOperatingHallScenario(s: OperatingHallScenario): void {
  const issues: string[] = [];
  const range = (key: string, n: number, min: number, max: number, integer = false) => {
    if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n)))
      issues.push(`${key} must be ${integer ? 'an integer ' : ''}in [${min}, ${max}]`);
  };
  if (s.kind !== 'synthetic-operating-hall' || s.version !== 1) issues.push('unsupported scenario kind/version');
  if (s.workload.kind !== 'synthetic-fixed-global-workload') issues.push('workload must be explicitly synthetic');
  if (!s.workload.id || !s.workload.label || !s.workload.assumptions.length) issues.push('workload identity and assumptions are required');
  range('durationS', s.durationS, 0.01, 86400);
  range('sampleS', s.sampleS, 0.001, 86400);
  if (s.durationS / s.sampleS > 10000) issues.push('at most 10000 regular timeline intervals are allowed');
  range('installed.racks', s.installed.racks, 0, 10000, true);
  range('installed.packagesPerRack', s.installed.packagesPerRack, 1, 10000, true);
  for (const key of ['operationsPerStep', 'memoryBytesPerStep', 'checkpointBytes'] as const)
    range(`workload.${key}`, s.workload[key], 1, 1e24);
  range('workload.networkBytesPerStep', s.workload.networkBytesPerStep, 0, 1e24);
  const e = s.electrical;
  range('electrical.facilityFeedLimitW', e.facilityFeedLimitW, 0, 1e12);
  range('electrical.rackBusV', e.rackBusV, 0.1, 1e5);
  range('electrical.packageBusV', e.packageBusV, 0.01, 1e3);
  range('electrical.rackInputLimitA', e.rackInputLimitA, 0, 1e9);
  range('electrical.packageRailLimitA', e.packageRailLimitA, 0, 1e9);
  range('electrical.conversionEfficiency', e.conversionEfficiency, 0.01, 1);
  range('electrical.pue', e.pue, 1, 10);
  range('electrical.auxiliaryRackW', e.auxiliaryRackW, 0, 1e8);
  for (const key of ['packageRunW', 'packageCheckpointW', 'packageRecoveryW'] as const) range(`electrical.${key}`, e[key], 0.001, 1e7);
  range('cooling.massFlowKgS', s.cooling.massFlowKgS, 0, 1e8);
  range('cooling.specificHeatJkgK', s.cooling.specificHeatJkgK, 1, 1e6);
  range('cooling.maxRiseK', s.cooling.maxRiseK, 0.001, 1e3);
  for (const key of ['computeOpsPerPackageS', 'memoryBytesPerPackageS', 'networkBytesPerRackS', 'networkHallLimitBytesS', 'checkpointBytesPerRackS', 'checkpointHallLimitBytesS'] as const)
    range(`service.${key}`, s.service[key], 1e-6, 1e24);
  if (!['serialized', 'fully-overlapped'].includes(s.service.communication)) issues.push('unsupported communication schedule');
  for (const gate of GATES) if (s.commissioning[gate] !== null) range(`commissioning.${gate}`, s.commissioning[gate]!, 0, 1e9);
  range('checkpoint.intervalRunS', s.checkpoint.intervalRunS, 0.001, 1e9);
  range('checkpoint.commitLatencyS', s.checkpoint.commitLatencyS, 0, 1e6);
  if (s.faults.length > 1000) issues.push('at most 1000 faults are allowed');
  const ids = new Set<string>();
  for (const fault of s.faults) {
    if (!fault.id || ids.has(fault.id)) issues.push('fault ids must be nonempty and unique');
    ids.add(fault.id);
    range(`fault ${fault.id}.atS`, fault.atS, 0, Math.max(0, s.durationS));
    if (fault.atS >= s.durationS) issues.push(`fault ${fault.id} must occur before the observation horizon`);
    range(`fault ${fault.id}.recoveryDelayS`, fault.recoveryDelayS, 0, 1e6);
    if (!['worker-stop', 'fabric-interruption', 'software-stop'].includes(fault.cause)) issues.push(`unsupported fault cause ${fault.cause}`);
  }
  if (issues.length) throw new RangeError(`Invalid operating hall scenario:\n${issues.join('\n')}`);
}

function getAdmission(s: OperatingHallScenario): HallAdmission {
  const e = s.electrical;
  const maxPackageW = Math.max(e.packageRunW, e.packageCheckpointW, e.packageRecoveryW);
  const maxRackItW = (s.installed.packagesPerRack * maxPackageW + e.auxiliaryRackW) / e.conversionEfficiency;
  const maxPackageCurrentA = maxPackageW / e.packageBusV;
  const maxRackCurrentA = maxRackItW / e.rackBusV;
  const coolantCapacityW = s.cooling.massFlowKgS * s.cooling.specificHeatJkgK * s.cooling.maxRiseK;
  // Conservative whole-rack admission at the most demanding configured phase.
  const byFacilityFeed = Math.min(s.installed.racks, Math.floor(e.facilityFeedLimitW / (maxRackItW * e.pue)));
  const byCoolant = Math.min(s.installed.racks, Math.floor(coolantCapacityW / maxRackItW));
  const rackCurrentPass = maxRackCurrentA <= e.rackInputLimitA;
  const packageCurrentPass = maxPackageCurrentA <= e.packageRailLimitA;
  const admittedRacks = rackCurrentPass && packageCurrentPass ? Math.min(byFacilityFeed, byCoolant) : 0;
  const neverReadyGates = GATES.filter(g => s.commissioning[g] === null);
  const readyAtS = neverReadyGates.length ? null : Math.max(...GATES.map(g => s.commissioning[g]!));
  const reasons: string[] = [];
  if (byFacilityFeed < s.installed.racks) reasons.push(`Facility feed admits ${byFacilityFeed} of ${s.installed.racks} racks.`);
  if (byCoolant < s.installed.racks) reasons.push(`Coolant heat balance admits ${byCoolant} of ${s.installed.racks} racks.`);
  if (!rackCurrentPass) reasons.push('Per-rack DC current limit fails; no rack admitted.');
  if (!packageCurrentPass) reasons.push('Equivalent package rail current limit fails; no rack admitted.');
  if (neverReadyGates.length) reasons.push(`Commissioning gates remain closed: ${neverReadyGates.join(', ')}.`);
  else if (readyAtS! >= s.durationS) reasons.push('Commissioning completes outside the observation horizon.');
  if (!s.installed.racks) reasons.push('No installed racks.');
  return { installedRacks: s.installed.racks, admittedRacks, admittedPackages: admittedRacks * s.installed.packagesPerRack,
    dispatchFraction: s.installed.racks ? admittedRacks / s.installed.racks : 0,
    limits: { byFacilityFeed, byCoolant, rackCurrentPass, packageCurrentPass },
    maxPackageW, maxPackageCurrentA, maxRackItW, maxRackCurrentA, coolantCapacityW, readyAtS, neverReadyGates, reasons };
}

function getService(s: OperatingHallScenario, a: HallAdmission): HallService {
  const computeCapacityOpsS = a.admittedPackages * s.service.computeOpsPerPackageS;
  const memoryCapacityBytesS = a.admittedPackages * s.service.memoryBytesPerPackageS;
  const networkCapacityBytesS = Math.min(a.admittedRacks * s.service.networkBytesPerRackS, s.service.networkHallLimitBytesS);
  const checkpointCapacityBytesS = Math.min(a.admittedRacks * s.service.checkpointBytesPerRackS, s.service.checkpointHallLimitBytesS);
  const base = { computeCapacityOpsS, memoryCapacityBytesS, networkCapacityBytesS, checkpointCapacityBytesS };
  if (!a.admittedRacks) return { ...base, computeS: null, memoryS: null, localS: null, communicationS: null,
    stepS: null, stepsPerRunS: 0, checkpointWriteS: null, checkpointTotalS: null, stepsPerCheckpoint: 0,
    effectiveCheckpointRunS: null, criticalPath: 'No rack admitted' };
  const computeS = s.workload.operationsPerStep / computeCapacityOpsS;
  const memoryS = s.workload.memoryBytesPerStep / memoryCapacityBytesS;
  const communicationS = s.workload.networkBytesPerStep / networkCapacityBytesS;
  const localS = Math.max(computeS, memoryS);
  const stepS = s.service.communication === 'serialized' ? localS + communicationS : Math.max(localS, communicationS);
  const stepsPerCheckpoint = Math.max(1, Math.ceil(clampNearInteger(s.checkpoint.intervalRunS / stepS)));
  const checkpointWriteS = s.workload.checkpointBytes / checkpointCapacityBytesS;
  const checkpointTotalS = checkpointWriteS + s.checkpoint.commitLatencyS;
  const localName = computeS >= memoryS ? 'compute' : 'memory';
  return { ...base, computeS, memoryS, localS, communicationS, stepS, stepsPerRunS: 1 / stepS,
    checkpointWriteS, checkpointTotalS, stepsPerCheckpoint, effectiveCheckpointRunS: stepsPerCheckpoint * stepS,
    criticalPath: s.service.communication === 'serialized' ? `${localName} bound + serialized communication`
      : (communicationS > localS ? 'communication bound (fully overlapped)' : `${localName} bound (communication fully overlapped)`) };
}

function getRates(s: OperatingHallScenario, a: HallAdmission, v: HallService, phase: HallPhase): HallRates {
  const on = phase !== 'not-ready' && a.admittedRacks > 0;
  const run = on && phase === 'run';
  const e = s.electrical;
  const packageW = !on ? 0 : run ? e.packageRunW
    : phase.startsWith('checkpoint') ? e.packageCheckpointW : e.packageRecoveryW;
  const rackOutputW = on ? s.installed.packagesPerRack * packageW + e.auxiliaryRackW : 0;
  const rackItW = rackOutputW / e.conversionEfficiency;
  const itW = a.admittedRacks * rackItW;
  const facilityW = itW * e.pue;
  const coolantMassFlowKgS = on ? s.cooling.massFlowKgS : 0;
  return {
    executedWorkEquivalentsS: run ? v.stepsPerRunS : 0,
    operationsS: run ? s.workload.operationsPerStep * v.stepsPerRunS : 0,
    workloadMemoryBytesS: run ? s.workload.memoryBytesPerStep * v.stepsPerRunS : 0,
    workloadNetworkBytesS: run ? s.workload.networkBytesPerStep * v.stepsPerRunS : 0,
    checkpointWriteBytesS: on && phase === 'checkpoint-write' ? v.checkpointCapacityBytesS : 0,
    checkpointReadBytesS: on && phase === 'recovery-read' ? v.checkpointCapacityBytesS : 0,
    packageW, packageCurrentA: packageW / e.packageBusV,
    rackItW, rackCurrentA: rackItW / e.rackBusV, totalRackCurrentA: itW / e.rackBusV,
    itW, conversionLossW: a.admittedRacks * (rackItW - rackOutputW),
    facilityOverheadW: facilityW - itW, facilityW,
    coolantHeatW: itW, coolantMassFlowKgS,
    coolantRiseK: coolantMassFlowKgS ? itW / (coolantMassFlowKgS * s.cooling.specificHeatJkgK) : 0,
    facilityRejectedHeatW: facilityW,
  };
}

function zeroCounters(): HallCounters {
  return { kind: 'synthetic-work-and-energy-ledger', executedWorkEquivalents: 0, checkpointedSteps: 0,
    volatileCompletedSteps: 0, inFlightWorkEquivalents: 0, lostWorkEquivalents: 0, retainedUsefulSteps: 0,
    workloadOperations: 0, workloadMemoryBytes: 0, workloadNetworkBytes: 0, checkpointWriteBytes: 0,
    checkpointReadBytes: 0, itEnergyJ: 0, facilityEnergyJ: 0, coolantHeatJ: 0, facilityRejectedHeatJ: 0,
    runS: 0, checkpointS: 0, recoveryS: 0, notReadyS: 0, committedCheckpoints: 0, handledFaults: 0 };
}

function integrate(c: HallCounters, rates: HallRates, phase: HallPhase, dt: number): HallCounters {
  const executed = rates.executedWorkEquivalentsS * dt;
  const volatile = clampNearInteger(c.volatileCompletedSteps + c.inFlightWorkEquivalents + executed);
  const volatileCompletedSteps = Math.floor(volatile);
  return { ...c,
    executedWorkEquivalents: c.executedWorkEquivalents + executed,
    volatileCompletedSteps, inFlightWorkEquivalents: volatile - volatileCompletedSteps,
    retainedUsefulSteps: c.checkpointedSteps + volatileCompletedSteps,
    workloadOperations: c.workloadOperations + rates.operationsS * dt,
    workloadMemoryBytes: c.workloadMemoryBytes + rates.workloadMemoryBytesS * dt,
    workloadNetworkBytes: c.workloadNetworkBytes + rates.workloadNetworkBytesS * dt,
    checkpointWriteBytes: c.checkpointWriteBytes + rates.checkpointWriteBytesS * dt,
    checkpointReadBytes: c.checkpointReadBytes + rates.checkpointReadBytesS * dt,
    itEnergyJ: c.itEnergyJ + rates.itW * dt, facilityEnergyJ: c.facilityEnergyJ + rates.facilityW * dt,
    coolantHeatJ: c.coolantHeatJ + rates.coolantHeatW * dt,
    facilityRejectedHeatJ: c.facilityRejectedHeatJ + rates.facilityRejectedHeatW * dt,
    runS: c.runS + (phase === 'run' ? dt : 0),
    checkpointS: c.checkpointS + (phase.startsWith('checkpoint') ? dt : 0),
    recoveryS: c.recoveryS + (phase.startsWith('recovery') ? dt : 0),
    notReadyS: c.notReadyS + (phase === 'not-ready' ? dt : 0),
  };
}

/** Exact event integration; sampleS changes only the returned display sampling. */
export function simulateOperatingHall(s: OperatingHallScenario): OperatingHallResult {
  validateOperatingHallScenario(s);
  const admission = getAdmission(s);
  const service = getService(s, admission);
  const durationS = s.durationS;
  if (service.stepS !== null && (service.stepS < 1e-6 || service.checkpointWriteS! < 1e-6))
    throw new RangeError('Work steps and checkpoint transfers must each take at least one microsecond in this seconds-scale model.');
  if (service.effectiveCheckpointRunS !== null && Math.ceil(durationS / (service.effectiveCheckpointRunS + service.checkpointTotalS!)) > 20000)
    throw new RangeError('Scenario would exceed 20000 checkpoint cycles; enlarge the checkpoint interval or shorten the horizon.');
  const phaseRates = Object.fromEntries(['not-ready', ...phases].map(p => [p, getRates(s, admission, service, p as HallPhase)])) as Record<HallPhase, HallRates>;
  const segments: HallSegment[] = [];
  const events: HallEvent[] = GATES.flatMap(gate => {
    const atS = s.commissioning[gate];
    return atS !== null && atS <= durationS ? [{ atS, kind: 'gate-ready' as const, gate, detail: `${gate} gate opens (synthetic readiness event).` }] : [];
  });
  const faults = [...s.faults].sort((a, b) => a.atS - b.atS);
  let faultIndex = 0;
  let atS = 0;
  let phase: HallPhase = 'not-ready';
  let counters = zeroCounters();
  const canStart = admission.admittedRacks > 0 && admission.readyAtS !== null && admission.readyAtS <= durationS;
  let phaseEnd = canStart ? admission.readyAtS! : Infinity;

  const startRun = (kind: 'dispatch-start' | 'job-resume') => {
    phase = 'run';
    phaseEnd = atS + service.effectiveCheckpointRunS!;
    events.push({ atS, kind, detail: kind === 'dispatch-start' ? `${admission.admittedRacks} racks start the fixed workload.` : 'Job resumes from its latest committed state.' });
  };
  const completePhase = () => {
    if (phase === 'not-ready') startRun('dispatch-start');
    else if (phase === 'run') {
      // A checkpoint starts only on a complete-step boundary.
      counters.volatileCompletedSteps = service.stepsPerCheckpoint;
      counters.inFlightWorkEquivalents = 0;
      counters.retainedUsefulSteps = counters.checkpointedSteps + counters.volatileCompletedSteps;
      phase = 'checkpoint-write';
      phaseEnd = atS + service.checkpointWriteS!;
      events.push({ atS, kind: 'checkpoint-start', detail: 'Work pauses; write the complete global restart state.' });
    } else if (phase === 'checkpoint-write') {
      phase = 'checkpoint-commit';
      phaseEnd = atS + s.checkpoint.commitLatencyS;
      events.push({ atS, kind: 'checkpoint-written', detail: 'All checkpoint bytes written; atomic commit is still pending.' });
    } else if (phase === 'checkpoint-commit') {
      counters.checkpointedSteps += counters.volatileCompletedSteps;
      counters.volatileCompletedSteps = 0;
      counters.inFlightWorkEquivalents = 0;
      counters.retainedUsefulSteps = counters.checkpointedSteps;
      counters.committedCheckpoints++;
      events.push({ atS, kind: 'checkpoint-committed', detail: 'Checkpoint becomes restart-valid; prior volatile steps are now durable.' });
      // A normal checkpoint is not a restart; keep a separate event vocabulary.
      phase = 'run';
      phaseEnd = atS + service.effectiveCheckpointRunS!;
    } else if (phase === 'recovery-wait') {
      if (counters.committedCheckpoints > 0) {
        phase = 'recovery-read';
        phaseEnd = atS + service.checkpointWriteS!;
        events.push({ atS, kind: 'restore-start', detail: 'Read the most recent committed global checkpoint.' });
      } else startRun('job-resume');
    } else startRun('job-resume');
  };

  // Completion wins a tie with a fault. In particular, a commit at t is durable
  // before a fault at t. Faults before dispatch have no running job to interrupt.
  for (let iterations = 0; ; iterations++) {
    if (iterations > 100000) throw new RangeError('Operating hall event budget exceeded.');
    while (phaseEnd <= atS) completePhase();
    while (faultIndex < faults.length && faults[faultIndex].atS <= atS) {
      const fault = faults[faultIndex++];
      if (phase === 'not-ready') {
        events.push({ atS, kind: 'fault-ignored', faultId: fault.id, detail: 'Scheduled job fault occurs before dispatch; no running job is affected.' });
        continue;
      }
      const interruptedPhase = phase;
      const lost = counters.volatileCompletedSteps + counters.inFlightWorkEquivalents;
      counters.lostWorkEquivalents += lost;
      counters.volatileCompletedSteps = 0;
      counters.inFlightWorkEquivalents = 0;
      counters.retainedUsefulSteps = counters.checkpointedSteps;
      counters.handledFaults++;
      // A second fault during a repair wait extends the union of repair intervals.
      // A fault during restore aborts that read and starts a fresh repair/read cycle.
      phaseEnd = phase === 'recovery-wait' ? Math.max(phaseEnd, atS + fault.recoveryDelayS) : atS + fault.recoveryDelayS;
      phase = 'recovery-wait';
      events.push({ atS, kind: 'fault', faultId: fault.id, interruptedPhase, lostWorkEquivalents: lost,
        detail: `${fault.cause}: discard ${lost.toFixed(6)} uncheckpointed work-equivalents; repair/relaunch until ${phaseEnd.toFixed(6)} s, then restore if a checkpoint exists.` });
    }
    // Zero-delay repair or commit is an event, never a zero-length segment.
    while (phaseEnd <= atS) completePhase();
    if (atS >= durationS) break;
    const next = Math.min(durationS, phaseEnd, faults[faultIndex]?.atS ?? Infinity);
    if (!(next > atS)) throw new RangeError('Scenario time resolution cannot represent its next event.');
    const start = { ...counters };
    const rates = phaseRates[phase];
    counters = integrate(counters, rates, phase, next - atS);
    segments.push({ startS: atS, endS: next, phase, rates, start, end: { ...counters } });
    atS = next;
  }
  const final: HallSample = { atS: durationS, phase, rates: phaseRates[phase], counters: { ...counters } };
  const result: OperatingHallResult = {
    kind: 'synthetic-operating-hall-result', version: 1, durationS, admission, service,
    events: events.sort((a, b) => a.atS - b.atS), segments, timeline: [], final,
    summary: { retainedUsefulStepsPerWallS: counters.retainedUsefulSteps / durationS,
      checkpointedStepsPerWallS: counters.checkpointedSteps / durationS,
      facilityJPerRetainedUsefulStep: counters.retainedUsefulSteps ? counters.facilityEnergyJ / counters.retainedUsefulSteps : null,
      averageItW: counters.itEnergyJ / durationS, averageFacilityW: counters.facilityEnergyJ / durationS,
      effectivePue: counters.itEnergyJ ? counters.facilityEnergyJ / counters.itEnergyJ : null },
  };
  const sampleTimes = new Set([0, durationS, ...events.map(e => e.atS), ...segments.map(e => e.startS)]);
  for (let i = 1; i * s.sampleS < durationS; i++) sampleTimes.add(i * s.sampleS);
  result.timeline = [...sampleTimes].sort((a, b) => a - b).map(t => sampleOperatingHall(result, t));
  return result;
}

/** Right-continuous sample: events at t have already happened. No simulation rerun. */
export function sampleOperatingHall(result: OperatingHallResult, atS: number): HallSample {
  if (!Number.isFinite(atS) || atS < 0 || atS > result.durationS) throw new RangeError('Sample time outside scenario.');
  if (atS === result.durationS) return { ...result.final, counters: { ...result.final.counters }, rates: { ...result.final.rates } };
  let lo = 0;
  let hi = result.segments.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (result.segments[mid].startS <= atS) lo = mid;
    else hi = mid - 1;
  }
  const segment = result.segments[lo];
  return { atS, phase: segment.phase, rates: { ...segment.rates },
    counters: integrate(segment.start, segment.rates, segment.phase, atS - segment.startS) };
}

/** Plot integer work and atomic events without interpolating a loss before a fault. */
export function operatingHallPlot(result:OperatingHallResult){
 const points:{atS:number;executedWorkEquivalents:number;retainedUsefulSteps:number;checkpointedSteps:number}[]=[];
 const point=(atS:number,c:HallCounters)=>({atS,executedWorkEquivalents:c.executedWorkEquivalents,retainedUsefulSteps:c.retainedUsefulSteps,checkpointedSteps:c.checkpointedSteps});
 for(const s of result.segments){
  points.push(point(s.startS,s.start));
  if(s.phase==='run'){
   const completed=s.end.retainedUsefulSteps-s.start.retainedUsefulSteps;
   if(completed>50000)throw Error('Work-step plot exceeds its inspection limit.');
   for(let n=1;n<=completed;n++){
    const atS=s.startS+(n-s.start.inFlightWorkEquivalents)/s.rates.executedWorkEquivalentsS;
    const state=point(atS,integrate(s.start,s.rates,s.phase,atS-s.startS));
    points.push({...state,retainedUsefulSteps:s.start.retainedUsefulSteps+n-1},{...state,retainedUsefulSteps:s.start.retainedUsefulSteps+n});
   }
  }
  points.push(point(s.endS,s.end));
 }
 points.push(point(result.durationS,result.final.counters));
 return points;
}
