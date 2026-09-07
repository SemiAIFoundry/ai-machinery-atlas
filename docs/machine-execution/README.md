# One operation through the machine

This experience extends the atlas's exact matrix arithmetic into explicit lane addresses, aligned transfers, timed memory service, staging ownership and completed output. Its model is **machine-execution-1**. It implements a bounded first connection within E3/HW07/HW09; it does not complete the CPU, cache-coherence, firmware, physical PHY or full hardware roadmap.

The same signed integer matrix is computed in two independent ways: the existing row/column reference multiplication, and actual event replay using values delivered from mapped memory into named staging slots. The reference is never used to populate the executed result. The final host-visible C is read from the output memory words after every output write and its modeled recovery complete.

## Use and integration

- [Pure model](../../src/lib/machine-execution.ts): `buildMachineExecution(input)`, `normalizeMachineInput`, `decodeMachineAddress`, `translateMachineAddress`, `groupSharedBanks`, `machineEventAt`.
- [Input records](../../src/lib/machine-execution-record.ts): strict model/schema identity, input validation, explicit local save, older raw-record preservation and portable import/export.
- [React component](../../src/components/machine-execution.tsx): default `MachineExecution({onSelect?})`. It imports its own scoped stylesheet and does not depend on the existing eight-experience saved-state wrapper.
- [Tests](../../scripts/machine-execution.test.mjs), [source review](source-review.json) and [complete scenario records](scenarios.json).

```ts
import {buildMachineExecution, machineDefaults} from './src/lib/machine-execution.ts';
const trace = buildMachineExecution(machineDefaults);
// trace.events contains actual state snapshots; trace.reference is a separate oracle.
```

An input contains A and B (square 2×2 or 3×3 integer matrices, entries −99…99), B's global layout, input alignment offset, bank placement, shared padding, one/two staging slots, assumed MAC service, refresh interval and one optional guard-failure scenario. Matrices and controls are fully copied and normalized. Imported unknown fields, invalid choices, malformed matrices and incompatible model versions are rejected.

The component provides matrix edits, controls, an event/time cursor, a symbolic two-bank physical layout, staging ownership, lane/address/segment tables, shared-bank groups, a complete command timeline and direct jumps to data readiness, accumulation and failures. The timeline is a labeled SVG with an equivalent command table. The small physical grid is symbolic; no vendor floorplan is implied. There is no mandatory animation.

## What happens to one instruction group

The operation uses four synthetic lanes. Each active lane owns one output element for a reduction index k and requests A[i,k] and B[k,j]. A and B are separate read instructions. Within each instruction, addresses in the same aligned 16-byte segment generate one transaction. Repeated requests are counted as lane-request bytes, while unique input and actual transferred bytes have separate denominators. There is no persistent cache between batches.

Each group acquires one staging slot. The entire group's range/permission contract is checked before any transaction is issued. DMA publishes the slot as ready only after every transaction completes. Compute then performs its shared-memory reads and MACs from the slot's delivered words. It releases the slot after accumulation. A second slot permits overlap; it does not permit overwriting a live slot.

A and B shared reads use separate instructions. For each bank, different words require separate rounds; repeated addresses broadcast. The number of rounds for an instruction is the largest distinct-word count in any bank. The model adds the A and B rounds, with a declared 1 ns per round. Padding changes this mapping; it is not universally beneficial.

A missing B mapping blocks the operation before DMA. Early consumption and in-flight slot reuse are modeled as **attempted unsafe actions rejected by the guard**. Their state and accumulators remain unchanged, and the original safe operation may still complete. The experience does not fabricate a corrupt result by ignoring its own ownership rules.

## Declared address and timing contract

All addresses are bytes. Device IOVA ranges start at 4096 (A), 8192 (B) and 12288 (C). Their physical starts are 0, 256 or 320, and 512 respectively. A/B have device-read permission; C has device-write permission. This finite mapping illustrates a driver/IOMMU boundary. It is not an OS page-table implementation or an actual driver/firmware run.

The 1 KiB physical teaching space has four low bits within a 16-byte segment, two column bits, one bank bit and three row bits:

```text
physical byte address = 128 × row + 64 × bank + 16 × column + byte-in-segment
bank ∈ {0,1}; row ∈ {0,…,7}; column ∈ {0,…,3}; byte-in-segment ∈ {0,…,15}
```

This map is deliberately smaller than the existing HBM explorer. Its addresses are not interchangeable with that model. Future adapters must preserve the operation identity and explicitly translate the declared address contract.

| Teaching parameter | Assumed value |
|---|---:|
| Scalar word | 4 B |
| Aligned transaction | 16 B |
| Shared banks / DRAM banks | 4 / 2 |
| ACT to read/write eligibility | 6 ns |
| PRE duration | 4 ns |
| Minimum ACT to PRE time | 16 ns |
| Read / write command to data | 8 / 6 ns |
| Data burst | 4 ns |
| Write recovery after burst | 8 ns |
| All-bank refresh | 12 ns |
| Shared read round | 1 ns |
| MAC service per lane group | 2, 8 or 24 ns |

These are **synthetic timing assumptions**, not manufacturer parameters. The controller serves complete transactions FIFO and serially, including across different banks. This intentionally excludes bank parallelism and vendor scheduling. A conflict needs precharge before activation; a hit reuses the open row. ACT selects the row immediately in the diagram, while the timing guard still prevents access before the assumed activation latency.

Refresh has a due grid from time zero. The controller refreshes at transaction boundaries or in idle time, precharging open banks first and honoring minimum active time. An in-flight transaction is not interrupted. The trace records refresh lateness; the policy does not claim compliance with any retention limit or JEDEC standard. Disabling refresh is labeled a counterfactual comparison.

Model time starts after input initialization/mapping and ends after completed output writes and host synchronization. Mapping/handoff/synchronization are zero-duration control events. Input initialization, page faults, cache maintenance, operating-system time, bus training, network transport and application overhead are outside the timing boundary.

## Worked results and explanation tasks

The default signed matrices produce C = [[2,5,−1], [5,1,10], [4,1,3]]. The exact input records and computed results are in [scenarios.json](scenarios.json).

| Change from default | Read transfers | Shared rounds | Modeled host completion | Result |
|---|---:|---:|---:|---|
| Default: rows contiguous, two slots | 416 B | 18 | 652 ns | Same exact C |
| B columns contiguous | 480 B | 18 | 724 ns | Same exact C |
| One staging slot | 416 B | 18 | 722 ns | Same exact C |
| One extra shared word per row | 416 B | 24 | 652 ns | Same exact C |
| Refresh disabled (counterfactual) | 416 B | 18 | 562 ns | Same exact C |
| Attempt early consume / reuse | 416 B | 18 | 652 ns | Attempt rejected; safe C remains valid |
| Missing B mapping | 0 B | 0 | Blocked | No accepted output |

Default unique input is 72 B, lane-request input is 216 B and DRAM read transfers are 416 B. None of those denominators replaces another. Output transfers are 48 B for 36 B of matrix payload, because the final aligned segment also contains initialized padding.

1. Predict why changing B's layout changes transferred bytes while arithmetic stays identical. Inspect one instruction's physical segments.
2. Explain why adding shared padding increases rounds here, then why this does not change completion in the default memory-bound schedule.
3. Compare one/two slots; locate the overlap and identify the ownership condition that makes it safe.
4. Stop at a refresh operation. Identify its due time, any delay and the row closure before it.
5. Inspect an early-consume or reuse rejection. Identify which fields did not change and when safe consumption later occurs.
6. Remove B's mapping and distinguish the reference C from an accepted output. Restore the mapping and reproduce completion.

## Input records and recovery

Export records contain only schema/model identity and normalized inputs. Results and timing are recalculated on import. Import validates before replacing live controls and does not automatically overwrite saved inputs. Explicit Save makes those inputs the next restored state on this device.

The active local key is `atlas-machine-execution-input`. Before replacing an incompatible prior record, Save first preserves its exact raw text in `atlas-machine-execution-older-inputs`. If that backup fails, the active prior record remains intact. Older records can be exported, including unreadable raw recovery text; current live controls remain available. No account or external service is used.

## Validation and remaining evidence

Run from the repository root:

```sh
node --experimental-strip-types --test scripts/machine-execution.test.mjs
npx tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext \
  --moduleResolution bundler --jsx react-jsx --lib es2022,dom,dom.iterable \
  --allowImportingTsExtensions --esModuleInterop \
  src/components/machine-execution.tsx src/lib/machine-execution.ts \
  src/lib/machine-execution-record.ts
```

The suite checks exact BigInt reference results, all 256 binary 2×2 input pairs, 384 layout/bank/alignment/padding/buffer/refresh/service combinations, legal command ordering, write recovery, transaction completion uniqueness, slot ownership, operand delivery, reduction order, mapping boundaries, snapshot independence, invalid imports and durable preservation under simulated storage failure. It includes cases where more local work does not change end-to-end model time.

These are software and scoped AI source checks. No GPU/DRAM measurement, Ramulator comparison run, human specialist review, physical-device observation or learner session is represented as completed. Integration/browser observations are owned separately by the main build workflow. The broader CPU/cache/NoC/physical-interface extensions remain future work.
