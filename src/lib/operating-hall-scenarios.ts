import type { OperatingHallScenario, SyntheticWorkload } from './operating-hall';

/** Authored arithmetic/traffic example, not a measured GEMM implementation. */
export function denseGemmWorkload(rows = 32768, inner = 32768, columns = 32768, bytesPerScalar = 8): SyntheticWorkload {
  for (const [name, value] of Object.entries({ rows, inner, columns })) {
    if (!Number.isInteger(value) || value < 1 || value > 1e6) throw new RangeError(`${name} must be an integer in [1, 1000000]`);
  }
  if (![2, 4, 8].includes(bytesPerScalar)) throw new RangeError('bytesPerScalar must be 2, 4 or 8');
  const outputBytes = bytesPerScalar * rows * columns;
  return {
    kind: 'synthetic-fixed-global-workload', id: 'dense-gemm-state-update',
    label: `Fixed ${rows} × ${inner} × ${columns} dense update: C ← AB + C`,
    operationsPerStep: 2 * rows * inner * columns,
    memoryBytesPerStep: bytesPerScalar * (rows * inner + inner * columns + 2 * rows * columns),
    networkBytesPerStep: outputBytes,
    checkpointBytes: outputBytes,
    assumptions: [
      'One step updates one global dense C matrix. Count two operations per fused multiply-add; exclude setup and validation arithmetic.',
      'A and B are immutable and recoverable outside the checkpoint; the changing state C is checkpointed. A small iteration counter is neglected.',
      'Memory traffic is an ideal reuse bound: read A, B and old C once and write new C once. Actual implementations can move more bytes.',
      'Send the complete C payload once across the modeled network boundary per step. This is a declared output-delivery scenario, not an all-reduce traffic formula.',
      'Ideal work/data sharding across admitted packages. The network has an explicit aggregate receiver/fabric ceiling. No topology, locality, replication or queue model.',
      'Fixed synthetic sustained service rates and phase powers; no numeric hardware value is sourced to a vendor or treated as a forecast.',
      'Partial-step work/traffic counters are linear accounting approximations. Only whole completed steps count as useful; no claim about scientific accuracy or numerical convergence.',
    ],
  };
}

/** Fresh mutable scenario for controls; changing it cannot alter other callers. */
export function createOperatingHallScenario(): OperatingHallScenario {
  return {
    kind: 'synthetic-operating-hall', version: 1, workload: denseGemmWorkload(),
    installed: { racks: 8, packagesPerRack: 8 },
    electrical: {
      facilityFeedLimitW: 120000, rackBusV: 48, rackInputLimitA: 250,
      packageBusV: 0.8, packageRailLimitA: 1500,
      conversionEfficiency: 0.92, pue: 1.25, auxiliaryRackW: 2000,
      packageRunW: 850, packageCheckpointW: 300, packageRecoveryW: 160,
    },
    cooling: { massFlowKgS: 3, specificHeatJkgK: 4180, maxRiseK: 10 },
    service: {
      computeOpsPerPackageS: 1e13, memoryBytesPerPackageS: 2.5e11,
      networkBytesPerRackS: 2.5e10, networkHallLimitBytesS: 1e11,
      checkpointBytesPerRackS: 2e9, checkpointHallLimitBytesS: 8e9,
      communication: 'serialized',
    },
    commissioning: { electrical: 0, thermal: 0, fabric: 0, software: 0, operations: 0 },
    checkpoint: { intervalRunS: 60, commitLatencyS: 0.2 },
    faults: [{ id: 'worker-stop-150', atS: 150, recoveryDelayS: 20, cause: 'worker-stop' }],
    durationS: 300, sampleS: 1,
  };
}

export interface OperatingHallExample {
  id: string;
  label: string;
  question: string;
  /** A hypothesis to test with the returned model counters, not a production claim. */
  expectedMechanism: string;
  scenario: OperatingHallScenario;
}

/** Same fixed workload in every case; compare one authored mechanism at a time. */
export function operatingHallExamples(): OperatingHallExample[] {
  const make = (id: string, label: string, question: string, expectedMechanism: string,
    edit: (scenario: OperatingHallScenario) => void): OperatingHallExample => {
    const scenario = createOperatingHallScenario();
    edit(scenario);
    return { id, label, question, expectedMechanism, scenario };
  };
  return [
    make('baseline', 'One restart in a five-minute run', 'Which completed steps survive the fault at 150 s?',
      'The last committed checkpoint survives. Later completed and partial work is lost once; repair and restore consume wall time.', () => {}),
    make('less-flow', 'Less coolant flow', 'Can installed racks all operate when the flow falls to 1.1 kg/s?',
      'Whole-rack admission falls to satisfy IT heat = mass flow × specific heat × maximum rise. Service and byte rates change with admitted packages.', s => { s.cooling.massFlowKgS = 1.1; }),
    make('feed-limit', 'A smaller facility feed', 'How many racks fit within a 60 kW facility-input budget?',
      'PUE converts IT input to facility input before admission. Per-rack current remains a separate DC-branch constraint.', s => { s.electrical.facilityFeedLimitW = 60000; }),
    make('readiness', 'Operations gate opens late', 'What happens before the final readiness gate opens at 90 s?',
      'No modeled job dispatch occurs before 90 s. The fixed wall-clock fault schedule is unchanged; commissioning test energy is outside this boundary.', s => { s.commissioning.operations = 90; }),
    make('short-checkpoint', 'Checkpoint every 15 running seconds', 'Does protecting more recent progress outweigh extra checkpoint pauses in this specific fault schedule?',
      'Shorter requested intervals increase checkpoint traffic and pauses but change the amount exposed to rollback. There is no universal optimal interval claim.', s => { s.checkpoint.intervalRunS = 15; }),
    make('overlap', 'An ideal overlap bound', 'What changes if output communication can fully overlap the next local work?',
      'The critical path changes from max(compute, memory) + communication to max(compute, memory, communication), without summing throughput rates.', s => { s.service.communication = 'fully-overlapped'; }),
  ];
}
