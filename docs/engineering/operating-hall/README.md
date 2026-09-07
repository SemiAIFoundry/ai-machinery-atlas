# R23 operating hall asset handoff

Pure TypeScript, no runtime dependencies, authored outside the application repository. `operating-hall.ts` contains the model and exported types. `scenarios.ts` provides fresh default scenarios and six comparisons of the same fixed GEMM workload. `SCIENCE.md` states the primary-source-supported equations and the synthetic assumptions separately.

```ts
import { simulateOperatingHall, sampleOperatingHall } from './operating-hall.ts';
import { createOperatingHallScenario, operatingHallExamples } from './scenarios.ts';

const scenario = createOperatingHallScenario();
scenario.cooling.massFlowKgS = 1.1;
const result = simulateOperatingHall(scenario);
const frame = sampleOperatingHall(result, 150); // after any event exactly at 150 s
```

`admission` separates installed hardware, racks allowed by physical limits and commissioning time. `dispatchFraction` is admitted/installed rack count, not a utilization multiplier. Racks that are admitted but not yet commissioned still do no work until the final gate opens. The model keeps power and heat below the stated scenario bounds by admitting whole racks at the most demanding configured phase.

`service` returns compute, memory, communication and critical-path step times, resource capacities, checkpoint transfer time and the effective whole-step checkpoint interval. Null times mean no admitted rack. A fully overlapped option is explicitly a lower-bound schedule; do not call it measured performance.

`segments` contain exact phase intervals, phase rates and counters before the endpoint event. `events` explain readiness, checkpoint and fault transitions. `timeline` includes regular samples and event boundaries. `sampleOperatingHall(result, t)` interpolates the exact segment accounting without rerunning the simulation and returns post-event state at boundaries. `final` is the observation endpoint, not an automatic shutdown or final checkpoint. A newly committed checkpoint at the horizon counts as committed.

Use these fields together in the UI:

| Visual or readout | Model field | Interpretation |
|---|---|---|
| Rack illumination | `admission.admittedRacks`, `frame.phase` | Unadmitted/off versus dispatched; fixed installed rack count |
| Work and byte paths | `frame.rates.operationsS`, `workloadMemoryBytesS`, `workloadNetworkBytesS` | Whole-step average workload service; pause during checkpoint/recovery |
| Checkpoint/restore path | `checkpointWriteBytesS`, `checkpointReadBytesS` | Opposite storage directions, separate from workload network traffic |
| Package current | `packageCurrentA` | Equivalent package DC rail, with its own voltage |
| Rack current | `rackCurrentA`, `totalRackCurrentA` | Per-rack DC input and sum at common rack voltage; never facility AC current |
| Electrical power | `itW`, `facilityOverheadW`, `facilityW` | Nested boundaries; overhead is already included in facility W |
| Water and heat path | `coolantMassFlowKgS`, `coolantRiseK`, `coolantHeatW` | kg/s is recirculating water; W is heat transfer; K is temperature rise |
| Final rejection | `facilityRejectedHeatW` | Includes IT heat and external overhead heat exactly once |
| Progress | `retainedUsefulSteps`, `checkpointedSteps` | Retained completed work versus durable subset |
| Fault loss | `lostWorkEquivalents`, event `lostWorkEquivalents` | Includes partial unfinished work; can be fractional |
| Cost per retained result | `summary.facilityJPerRetainedUsefulStep` | Includes checkpoint, restart and lost-work energy; null without retained results |

Start with the six `operatingHallExamples()` questions. Hold the fixed workload while changing one mechanism. A voltage comparison should change current while keeping power fixed unless a current limit changes admission. A flow comparison should change temperature rise at fixed load, or rack count when the heat limit binds. Changing PUE without crossing an admission boundary changes facility energy but not IT work or package current. A fault should visibly roll back only volatile work; completed checkpointed work stays.

Suggested core controls: facility feed W, flow kg/s, last readiness gate time, checkpoint interval in running seconds, repair delay and communication schedule. Place voltages, conversion efficiency, current ratings and phase-power assumptions in an advanced boundary panel. Do not imply that increasing voltage is a validated device operating adjustment, or that more flow has no pump-power cost; this model holds the other assumptions fixed.

Validation from this directory:

```sh
node --experimental-strip-types --test operating-hall.test.mjs
```

The 22 Node tests include independent arithmetic counts, hand-derived event/energy answers, incomplete checkpoint and restore failures, coincident events, overlapping repair intervals, phase-specific electrical/thermal conservation, sample-rate invariance and 108 physical/service combinations. Strict TypeScript compilation was also run with TypeScript 5.9.3 using `--noEmit --strict --target ES2022 --module nodenext --moduleResolution nodenext --allowImportingTsExtensions`.

No source data are fetched at runtime. No uncertainty distribution, vendor capacity, real commissioning date or claimed annual PUE is generated. The model validates typed scenario inputs and rejects nonfinite/out-of-range values, sub-microsecond work/transfer resolution, excessive sampling and excessive checkpoint cycles. External saved-state import should still validate the object shape before calling it.
