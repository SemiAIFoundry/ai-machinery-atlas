# One matrix through stack admission, placement and checked reads

This N13 bridge executes one selected 2×2 or 3×3 integer matrix workload through a stack admission decision, explicit B source placement, timed memory commands, decoded operand reads and an independently checked consumer result. It joins existing teaching APIs without treating their unrelated geometries as one device model.

## Reused mechanisms and the new connection

`memory-workload-bridge.ts` calls the existing `hbmStack` and `evaluateMemoryExplorer` for stack layers, height/thermal bounds, fixed-width pad overlap and scoped evidence. The context is a single synthetic stack with the selected matrices as transient workspace. It does not import the earlier large-model weights/KV inventory. Known-good and post-bond evidence are fixed synthetic pass. Missing or failing qualification, no pad overlap, or a modeled height/temperature limit prevents all staging, DRAM commands and MACs.

The destination budget counts the sum of the padded A, B and C allocations, **not the highest synthetic address**. Gaps between mapped ranges are unallocated. The 2×2 case uses three 16-byte allocations; 3×3 uses three 48-byte allocations, each containing 36 matrix bytes and 12 initialized padding bytes. Both cases reserve the complete B buffer regardless of its source tier. Moving B to a host or conceptual read tier therefore adds staging and does not reduce destination capacity. These remote tiers have the same authored service assumptions and are not vendor alternatives.

`buildMachineExecution` supplies the actual finite command/buffer schedule. Its timing depends on operand addresses, bank placement, DMA slots and refresh. The bridge replays this schedule's read-complete, compute-end, write-complete and host-sync events using separately initialized/copied/decoded bytes. It does **not** publish the existing plan's computed output or replace a bad operand with reference truth. The original matrix product is computed independently for comparison only.

The first uncorrectable read stops this consumer prefix and prevents publication. Later planned events are omitted. No rollback, checkpoint recovery, drain latency or asynchronous cancellation is claimed. An earlier completed partial sum is visible but is not a final C.

## Exact byte and codeword identity

Inputs are the existing authored architecture matrix specimens. Each scalar is represented as four little-endian bytes, signed two's complement. B staging copies the actual padded byte array in 16-byte segments. Every requested distinct word read retains its tensor/row/column identity, machine physical byte address, translated stack payload address, original bytes, encoded codewords, received bits, decoder checks and delivered bytes/value. Repeated lane requests sharing the same word are decoded once per transaction; repeated later transactions perform another read. Transferred bytes and distinct requested words have different denominators.

The explicit translation is:

```
stack_payload_address = selected_die × 2^31 + machine_physical_byte
```

The existing stack map decodes that payload address into a logical die/channel/bank/row/column. The existing machine map independently schedules two banks within 1 KiB. Their bank indices are not asserted to describe the same physical organization. This is an identity bridge between two declared teaching views, not a vendor address function or routed floorplan.

Eight independent extended-Hamming (8,4) codewords protect the eight nibbles of each 32-bit scalar. Data bits occupy positions 3, 5, 6 and 7; parity positions are 1, 2, 4 and overall position 8. Nibbles are numbered from the least significant four bits. This costs 64 encoded bits for 32 payload bits—100% additional code bits. Parity capacity, electrical signaling and ECC logic timing are explicitly outside the allocation budget and machine transfer schedule. This deliberately inefficient construction reuses the exact encoder/decoder already tested in `hardware-reliability.ts`; it is not a commercial memory ECC configuration.

One selected word has a persistent explicit fault, equivalent to flipping the chosen stored codeword after initialization/staging. Every read reconstructs the same received bits; reconstruction does not repair the fault. Faults do not depend on temperature, overlap, die count, tier, refresh or elapsed time.

| Mode | Positions flipped in one codeword | Consumer behavior |
| --- | --- | --- |
| Healthy | None | Original word is delivered |
| Single data bit | 3 | SECDED corrects the original value |
| Double data bit | 3, 5 | SECDED detects; no value is delivered |
| Triple | 1, 2, 3 | Outside the guarantee; this fixture can miscorrect and deliver wrong data |
| Unchecked | Any chosen pattern | Extract received data positions without correction; decoder reports are diagnostic only |

MAC accumulators use exact integers within the bounded fixture. A fault in a high nibble can make a scalar large even though the original specimens are small. Final stores explicitly narrow modulo 2^32 to signed int32 and report changed output words. Tests compare this narrowing against independent `BigInt.asIntN(32, …)` arithmetic. Every published output word also exposes its actual four stored bytes. No output is silently represented as a wider word while labeled int32.

## Timing and accounting

The machine's existing synthetic ACT/PRE/RD/WR and refresh parameters are retained. The [Microchip timing definitions](https://onlinedocs.microchip.com/oxy/GUID-AFCB5DCC-964F-4BE7-AA46-C756FA87ED7B-en-US-21/GUID-A29420D1-4E36-4920-B9BB-DD0B63F5E787.html) distinguish activation, row closure, write recovery, refresh interval and refresh service duration. Their numerical device requirements are not transferred to this teaching model. Its command subset is not JEDEC compliance or a retention guarantee.

Remote B preparation is serialized before machine time zero: **20 ns startup + 8 ns per 16-byte copy**. For 3×3 this is 44 ns for 48 bytes. Source-read bytes, destination-staging writes, later DRAM reads and output writes are separate ledger entries. There is no overlap or double counting hidden between those stages. Initial CPU preparation, gate evaluation, ECC arithmetic and physical parity transfer have no assigned time. The model does not estimate application latency, energy, bandwidth from geometry, fault rate or field life.

Refresh has a fixed due grid relative to machine time zero. It can delay reads and close rows. The deliberately persistent injected fault remains unchanged with refresh on or off; no charge-decay model is supplied. A stopped run reports only its executed prefix's commands, reads, MACs and elapsed time. `refreshBusyNs` clips each issued REF interval to the observed machine horizon; `refreshReservedNs` reports its full reserved service separately. The current serialized controller cannot overlap REF with the failing read, and every selected-word double-fault prefix tests that property. A constructed straddling interval independently tests clipping. `commands` retain machine-relative timestamps with `commandClock: "machine-relative-ns"`; `commandTimeline` explicitly supplies both machine and joined start/end values. Command labels name the machine clock.

## Reproducible examples

`scenarios.json` contains strict normalized input records plus selected computed outcomes. They are fictional teaching fixtures, not observations. Rebuild with:

```sh
node --experimental-strip-types docs/memory-workload/reproduce.mjs
node --experimental-strip-types --test scripts/memory-workload-bridge.test.mjs
npx tsc --noEmit
```

| 3×3 case | Published C | Joined boundary |
| --- | --- | --- |
| Healthy / one corrected bit | `[[2,5,-1],[5,1,10],[4,1,3]]` | 652 ns |
| Host B, one corrected bit | Same correct C; 48 B copied first | 696 ns = 44 + 652 |
| Double data bit, SECDED | No C; detected at the read | Stops at 40 ns |
| Double data bit, unchecked | `[[4,5,-1],[6,1,10],[4,1,3]]` | 652 ns, incorrect |
| Triple, SECDED | `[[0,5,-1],[4,1,10],[4,1,3]]` | 652 ns, incorrect despite correction reports |
| Missing qualification or 96 B allocation budget | No commands and no C | No machine service starts |

The healthy default performs 27 MACs, 416 bytes of DRAM read transactions, 48 bytes of output writes and six 12 ns refreshes. These are distinct counts from the 72 bytes of original A/B matrix payload and the 144 bytes of padded A/B/C allocation.

## Component and record contract

```tsx
import MemoryWorkloadExplorer from './components/memory-workload-explorer';
<MemoryWorkloadExplorer onSelect={openLesson} />
```

`onSelect?: (id: string) => void` is the only prop. Root owns studio registration and navigation. The component uses scoped CSS, native controls, an event stepper, keyboard-readable tables, a proportional stack cross-section and a text/number view of each state. No added 3D animation is needed to explain this byte path.

Exports include `buildMemoryWorkload`, `normalizeMemoryWorkload`, `wordToBytes`, `bytesToWord`, `readProtectedWord`, `encodeMemoryWorkloadRecord` and `readMemoryWorkloadRecord`. Model version is `memory-workload-bridge-1`; source identity is `authored-matrix-memory-boundary-1`. Records are bounded to 20,000 UTF-8 bytes, require exact envelope/input keys and identities, and reject coercible enums, nonfinite values and invalid selected indices. Only inputs are restored; all results are recomputed. Saving uses the existing `PortableExperiment` bounded durable recovery history at `ai-atlas.memory-workload.v1`.

## Validation and remaining scope

The 21 bridge tests include independently hand-computed matrix results, signed byte boundaries, a hand-derived codeword, all single-bit and same-codeword two-bit faults across representative signed words/nibbles, independent BigInt corrupted-matrix products and narrowing, all selected operand/nibble single faults, admission/capacity gates, exact staging byte reconstruction, strict records, event-prefix stopping, 96 healthy timing/placement combinations and snapshot independence. Together with the reused machine/reliability/address suites, 70 tests pass. Full TypeScript passes.

[OpenTitan's ECC tooling description](https://opentitan.org/book/util/design/index.html#ecc-generator-tool) supports separating encoder, decoder and verification artifacts. It does not establish this custom code's parity equations or hardware equivalence; local independent/exhaustive tests do that for the finite software arithmetic. Source-review dates, locators and limits are recorded in `source-review.json`. No physical measurement, external simulator comparison, specialist sign-off or browser observation is claimed by this package.
