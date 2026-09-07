# One matrix operation, four schedules

The module computes the same `C = A B` for 2×2 or 3×3 matrices. Every scheme performs all `n³` multiply–accumulates, including products containing zero, and completes all `n²` outputs. Inputs are signed integers from −99 through 99. The largest possible partial magnitude is 29,403, so the calculation is exact in JavaScript numbers. This is an integer teaching case; floating-point rounding, overflow and quantization require a separate model.

The mathematical contract is the untransposed, α = 1, β = 0 case of the matrix product documented by the [Netlib reference BLAS DGEMM interface](https://www.netlib.org/blas/dgemm.f). The module does not call DGEMM or emulate its double-precision implementation.

## What each schedule exposes

| Scheme | Output assignment | Explicit operand reuse | Idle state |
| --- | --- | --- | --- |
| Scalar | One output accumulator, then the next output; k increases within each output. | Deliberately reload A and B for each MAC; retain only the current C accumulator. | One teaching unit, occupied at every issue slot. |
| Vector | A group of columns from one C row; an enabled lane owns each column. | Load one A scalar per group/slot and broadcast it; load B separately for each lane. | Excluded slots and unassigned group-tail slots are distinct. |
| SIMT | Flatten C into thread-owned outputs, then group those threads into teaching slots. | Logical per-thread A/B loads; keep each thread's accumulator across its k loop. | Excluded slots and the incomplete final group are distinct. |
| Systolic | A rectangular output tile stays in an array of local accumulators. | Inject A at the west edge and B at the north; forward A east and B south by one PE per tick. | Fill/drain PEs differ from padding PEs with no output. |

The vector pattern is informed by vector-scalar integer multiply-accumulate, masking, tail handling and stripmining in the [official archived RISC-V vector v1.0 text](https://github.com/riscvarchive/riscv-v-spec/blob/v1.0/v-spec.adoc). Our lane count is a teaching width, not a claim about a physical implementation. A selected inactive slot is excluded by an **explicit scheduler mapping**: the remaining outputs are packed into enabled slots, using gather/scatter semantics when needed. Merely masking a required output in a program would leave that output uncomputed; this module does not suggest otherwise.

The SIMT case assigns scalar work to individual thread slots that advance together through the same loop. NVIDIA describes active and inactive warp threads and independent thread state in its [CUDA guide, §3.2.2.1](https://docs.nvidia.com/cuda/cuda-programming-guide/03-advanced/advanced-kernel-programming.html#simt-execution-model). The module's 2/4/8-slot groups are deliberately small teaching groups; an NVIDIA warp has 32 threads. No branch divergence, reconvergence, cache/coalescing behavior or resident-warp scheduling is simulated.

The systolic case applies the general principle of rhythmic local data movement and reuse described by [H. T. Kung, “Why Systolic Architectures?”, p. 37](https://www.eecs.harvard.edu/~htk/publication/1982-kung-why-systolic-architecture.pdf). Its exact output-stationary placement and event accounting are authored here and tested algebraically; they are not a reconstruction of a TPU, Tensor Core or other proprietary floorplan.

## Read the systolic wavefront

For a tile with local row `r` and column `c`, inject `A[i,k]` at tick `k+r` and `B[k,j]` at tick `k+c`. Both operands then reach PE `(r,c)` at `k+r+c`. The implementation actually passes tokens through next-tick neighbor buffers; it does not substitute direct matrix lookups at interior PEs. Tokens retain tensor indices, values and k, and a MAC rejects a mismatched pair.

At the beginning of a tile, each valid C accumulator is explicitly initialized. The last k contribution writes that result to the declared output boundary. A tile with h valid rows and w valid columns occupies `n+h+w−2` wavefront ticks. Array rows/columns beyond the output tile receive no operands or MACs. When the array is smaller than the matrix, tiles execute sequentially without hidden inter-tile reuse.

The model allows injections, a ready MAC, operand forwarding and result writeout within a teaching tick. It omits real pipeline latency, memory-port limits, output-network contention and overlap between tiles. Its wavefront ticks and the other schemes' issue slots must not be plotted as a device-speed leaderboard.

## Interpret traffic and occupancy

`accesses` is an ordered ledger of scalar-word reads/writes at either the input/output **boundary** or an explicitly named **local** latch/accumulator. A local read is preceded by a recorded write. Initialization and final accumulator readout are counted. Vector scalar-A control storage is counted too. The chosen boundary is not automatically DRAM, HBM or cache.

`transfers` describes routes for the same values: boundary-in, boundary-out, vector broadcast delivery, or neighbor hop. A neighbor transfer departing at step s arrives at s+1. Transfers and memory accesses are complementary views of a value; adding their counts together would double-count different descriptions of the same movement. A MAC operand read fans out to forwarding without an additional local read in this declared model.

SIMT counts logical thread reads, even when two threads ask for the same address. Physical cache transactions might merge them. Vector broadcast is an explicit reuse choice in this implementation, not proof that SIMT cannot broadcast. Scalar code could also be blocked or vectorized. `distinctBoundaryReadAddresses` distinguishes the set of source words from repeated reads; it is a whole-trace unique count in totals, so do not sum per-step unique counts.

`occupancy` reports **active MAC fraction**: active arithmetic units divided by physical teaching units, with a second denominator for enabled units. It is not NVIDIA's resident-warp occupancy metric. More inactive slots can require additional groups; more array PEs may instead create more edge padding on a tiny problem. Neither conclusion predicts a vendor's throughput or energy.

## Worked example

For `A=[[1,2],[3,4]]` and `B=[[5,6],[7,8]]`, every result is `[[19,22],[43,50]]`. For `C[0,0]`, the two contributions are `1×5=5` and `2×7=14`, accumulating 0→5→19.

With four enabled vector/SIMT slots and a 2×2 systolic array:

| Scheme | Teaching steps | MACs | Boundary reads | Boundary writes | Local reads / writes | Neighbor hops | Broadcast deliveries |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Scalar | 8 | 8 | 16 | 4 | 28 / 28 | 0 | 0 |
| Vector | 4 | 8 | 12 | 4 | 32 / 32 | 0 | 8 |
| SIMT | 2 | 8 | 16 | 4 | 28 / 28 | 0 | 0 |
| Systolic | 4 | 8 | 8 | 4 | 28 / 28 | 8 | 0 |

This table compares the declared schedules and accounting. The steps have no measured duration; the counts do not establish a winning architecture. For the 3×3 preset, a 2×2 systolic array uses four tiles and 16 ticks, 36 boundary reads and 18 neighbor hops. A 3×3 array uses one tile and seven ticks, 18 boundary reads and 36 neighbor hops. Both execute 27 exact MACs and produce the same nine values.

## Integration contract

```ts
import {
  architecturePresets,
  buildArchitectureComparison,
  type SchemeId,
} from './architecture-execution';

const comparison = buildArchitectureComparison(architecturePresets.three);
const scheme: SchemeId = 'systolic';
const trace = comparison.traces[scheme];
const step = trace.steps[0];
// step.units: positions, masked/edge/fill/drain/MAC state and output assignment
// step.operations: actual A/B values, product, accumulator before/after, k
// step.accesses and step.transfers: movement with named resources and directions
// step.partialOutput and step.completed: distinguish partial sums from final cells
```

No application imports or dependencies are required. Inputs and returned snapshots are copied; JSON round-tripping `comparison.input` regenerates the same traces. `size` is derived from the matrices and, if supplied, must agree. Unknown fields, malformed matrices, fractional/out-of-range values, duplicate or out-of-range lane IDs, sparse arrays and an all-inactive vector/SIMT selection reject with an error. Scalar and systolic traces ignore the vector/SIMT mask by design; show those controls only where they apply. `arraySize` controls systolic tiles and padding.

Keep integer matrix editing, scheme selection, step buttons, lane/PE state, arithmetic rows and movement counts available without 3D. After inputs or scheme change, clamp the step index to the new trace length. Show partial outputs with their completion flags, and retain zero-valued completed cells as completed. `sourceIds` resolve in the accompanying content JSON. Use the provided assumptions alongside comparisons.

Suggested predict/explain/transfer task: predict whether disabling one lane changes C; inspect where its outputs are reassigned and why the step count can change; then explain why equal integer results and fewer teaching slots would still be insufficient evidence for choosing a production processor.

## Validation

Run `node --experimental-strip-types --test architecture-execution.test.mjs` with Node 22.13 or later. Twenty-one tests cover independent BigInt results, all 256 binary 2×2 input pairs, every legal four-lane mask for both matrix/array sizes, signed bounded cases, exact analytical traffic counts, actual local-state replay, neighbor-token provenance, wavefront timing, edge/fill/drain state, identity preservation and invalid input rejection. Strict standalone TypeScript checking is also recorded in the validation report.

Sources were opened on 7 September 2026 for the specific conceptual scope recorded in the content catalog. Implementation and invariant checks were performed by an agent; no human specialist review, hardware timing measurement or learner outcome is asserted.
