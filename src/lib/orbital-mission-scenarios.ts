import type { OrbitalMissionScenario } from './orbital-mission.ts';

export function createOrbitalMissionScenario(): OrbitalMissionScenario {
  // One independent matrix product tile. No vendor hardware is represented.
  const m = 1024, n = 1024, k = 131072, bytes = 4;
  return {
    kind: 'synthetic-orbital-mission', version: 1,
    workload: { kind: 'synthetic-independent-products', label: 'Independent dense matrix tile products',
      operationsPerProduct: 2 * m * n * k,
      memoryBytesPerProduct: bytes * (m * k + k * n + m * n),
      outputBytesPerProduct: bytes * m * n,
      assumptions: [
        'One product is C = AB with fixed 1024×131072 and 131072×1024 input dimensions; count two operations per multiply-accumulate as a conventional leading-order operation count.',
        'Read immutable input tiles once and write one output tile: an ideal reuse traffic bound, not an implementation measurement.',
        'Each product is independent. Input data and housekeeping state are available onboard; their acquisition, uplink and storage capacity are outside this payload-product budget.',
        'Only fully written and atomically committed products are retained. Nonvolatile products and the independent radio survive the scripted processor resets.',
        'A product occupies a whole onboard slot until acknowledged on the ground. Partial receiver progress survives contact closure; no packet loss or retry overhead beyond the declared useful link rate.',
        'All service rates, electrical loads, geometry, orbit illumination and contacts are synthetic. This is not an actual orbital data-center proposal or mission claim.',
      ] },
    service: { computeOpsS: 1e10, memoryBytesS: 1e9, storageWriteBytesS: 1e8, commitLatencyS: 0.2 },
    illumination: { periodS: 6000, sunlitS: 3600 },
    solar: { irradianceWm2: 1361, areaM2: 2.4, cellEfficiency: 0.3, incidenceCosine: 0.9, derating: 0.85, deliveryEfficiency: 0.95 },
    battery: { capacityJ: 1.8e6, initialJ: 8e5, reserveJ: 1.8e5, resumeJ: 3.6e5,
      chargeEfficiency: 0.9, dischargeEfficiency: 0.9, maxChargeBusW: 500, maxDischargeBusW: 500 },
    loads: { busV: 28, housekeepingW: 40, computeW: 300, storageWriteW: 70, commitW: 20,
      transmitterW: 80, transmitterRfEfficiency: 0.2 },
    radiator: { areaM2: 1.5, emissivity: 0.9, viewFactor: 1, maxTemperatureK: 320, sinkTemperatureK: 200,
      absorbedSunlitW: 20, absorbedEclipseW: 5 },
    storage: { capacityBytes: 1e9 },
    contacts: [{ id: 'contact-1', startS: 2200, endS: 2800, bytesS: 1e6 },
      { id: 'contact-2', startS: 8200, endS: 8800, bytesS: 1e6 },
      { id: 'contact-3', startS: 11000, endS: 11400, bytesS: 1e6 }],
    radiation: { kind: 'synthetic-effective-see-rate', effectiveFluxCm2S: 1, resetCrossSectionCm2PerDevice: 1e-5,
      susceptibleDevices: 8, resets: [{ id: 'scripted-reset-1', atS: 1500, recoveryS: 60 },
        { id: 'scripted-reset-2', atS: 7000, recoveryS: 60 }] },
    objectives: { retainedProducts: 350, deliveredProducts: 300, requireBatteryCycleClosure: true },
    durationS: 12000, sampleS: 30,
  };
}

export function orbitalMissionExamples() {
  const make = (id: string, question: string, edit: (s: OrbitalMissionScenario) => void) => {
    const scenario = createOrbitalMissionScenario(); edit(scenario); return { id, question, scenario };
  };
  return [
    make('baseline', 'How many products are retained onboard versus delivered by the end of two illumination cycles?', () => {}),
    make('smaller-array', 'Can the battery replenish enough energy between eclipses after reducing array area?', s => { s.solar.areaM2 = 1.2; }),
    make('smaller-battery', 'How does an earlier reserve crossing pause work during eclipse?', s => {
      s.battery.capacityJ = 4.5e5; s.battery.initialJ = 2e5; s.battery.reserveJ = 4.5e4; s.battery.resumeJ = 9e4;
    }),
    make('smaller-radiator', 'Can more electrical power help if the declared radiator temperature limit blocks the payload?', s => { s.radiator.areaM2 = 0.7; }),
    make('slower-contacts', 'Where do products wait when contact capacity falls, and when does storage stop new computation?', s => {
      s.contacts = s.contacts.map(c => ({ ...c, bytesS: 2e5 })); s.storage.capacityBytes = 3e8;
    }),
    make('longer-reset', 'Which work is lost, and which completed products survive a longer processor recovery?', s => {
      s.radiation.resets = s.radiation.resets.map(r => ({ ...r, recoveryS: 300 }));
    }),
  ];
}
