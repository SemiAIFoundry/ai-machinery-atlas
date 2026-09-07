# R27 orbital mission handoff

Portable pure TypeScript with no runtime packages or dependency on the operating-hall files. The models share SI units, explicit boundaries, exact event integration and work-ledger semantics. This model uses independent products that commit one at a time.

```ts
import { simulateOrbitalMission, sampleOrbitalMission, orbitalMissionSensitivity } from './orbital-mission.ts';
import { createOrbitalMissionScenario, orbitalMissionExamples } from './scenarios.ts';

const scenario = createOrbitalMissionScenario();
const result = simulateOrbitalMission(scenario);
const frame = sampleOrbitalMission(result, 3600);
const comparison = orbitalMissionSensitivity(scenario, 'solar-area', [1.2, 1.8, 2.4]);
```

The result includes exact event segments, regular/event samples, a right-continuous sampler, energy and product counters, static service bounds, and finite-horizon budget checks. Sampling does not alter the simulation. The observation endpoint is not an automatic shutdown, forced commit or forced data delivery.

The controller prioritizes housekeeping, contact drain, then payload work. It refuses optional loads that fail power or radiator limits. Below the battery reserve, optional loads use direct solar only; battery-supported operation resumes at the higher threshold. Housekeeping can consume the reserve. Partial computation pauses with retained volatile state while housekeeping remains supportable. An unavailable bus or scripted processor reset discards pending work; committed nonvolatile products survive by assumption.

Recommended UI mappings:

| View | Fields and interpretation |
|---|---|
| Sun/eclipse state | `frame.sunlit`, solar available/used/curtailed W; zero generation in eclipse |
| Battery | `batteryJ / capacityJ`, charge/discharge bus W, conversion-loss W, reserve/resume events |
| Payload | `mode`, operations/s and memory bytes/s; compute, write, commit and pauses visibly differ |
| Storage | `onboardBytes`, `pendingWorkEquivalents`; a product becomes available only after commit |
| Contact beam | `contactId` indicates the scheduled opportunity; `downlinkBytesS` controls actual motion |
| Ground receipts | `deliveredProducts` and `receiverPartialProductBytes`; receiver progress survives contact gaps |
| Heat | `radiatorHeatW`, `netRadiatorCapacityW`, `equilibriumTemperatureK`; label temperature as a steady-state estimate |
| Reset | event lost work and recovery interval; durable product count must not roll back |
| Budget | `feasibility` targets/checks, final battery change, final backlog and minimum battery energy |
| Radiation context | expected reset count and zero-reset probability; these do not drive the scripted trace |

Use `busResourceJPerDeliveredProduct` for the electrical resource budget per delivered product: it includes initial battery depletion and battery losses. `solarUsedJPerDeliveredProduct` measures only solar used in this observation window and can be zero when the work is powered entirely by initial battery energy. Never call a ratio of those two quantities a facility PUE.

The six same-workload scenarios test solar area, battery capacity, radiator area, contact rate/storage and reset recovery. `orbitalMissionSensitivity()` supports `solar-area`, `battery-capacity`, `radiator-area`, `contact-rate`, and `reset-recovery`. Battery-capacity sensitivity scales initial, reserve and resume energies proportionally. Contact-rate sensitivity changes the prescribed useful data rate at the same assumed transmitter load; it does not recompute a radio link budget. Every sensitivity row reruns the actual event model.

Show the declared mission horizon and targets. Label a passing case **“Passes these modeled budget checks”**, not “mission feasible.” Display final backlog even when the delivery target passes. A schematic orbit can show the prescribed illumination timing, but cannot claim ground visibility, contact geometry, actual altitude or a physically optimized spacecraft configuration.

Primary-source equations and exclusions are in `SCIENCE.md`. Sources are not fetched at runtime and do not provide the authored hardware numbers. External import should validate object shape before calling the typed scenario validator.

Run validation from this directory:

```sh
node --experimental-strip-types --test orbital-mission.test.mjs
```

All 19 Node tests pass. They include independent SI-constant derivation, hand-counted energy/product cases, eclipse energy with both battery efficiencies, battery exhaustion, reserve hysteresis, reset/commit ordering, interrupted writes, contact carryover, buffer backpressure, radiator-limited charging and solar curtailment, sample-rate invariance, and 72 parameter combinations plus all six authored scenarios. Strict TypeScript 5.9.3 compilation passes with `--noEmit --strict --target ES2022 --module nodenext --moduleResolution nodenext --allowImportingTsExtensions`.
