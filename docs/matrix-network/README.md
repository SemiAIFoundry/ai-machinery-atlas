# The same matrix across a finite-credit network

Model `matrix-network-transfer-1`, schema 1; source operation `architecture-execution-1`. This bounded N12 bridge transfers actual A or B operand bytes from the existing two/three matrix presets, assembles the destination, then executes C = AB using the delivered values. It is not a production NoC, Ethernet, TCP, RDMA, NCCL or gem5 implementation. Every link, return-credit and consumer tick is an explicit teaching assumption, not measured hardware time.

## Integration

Lazy studio ID: `network`. Default React export: `MatrixNetworkExperience({onSelect?:(id:string)=>void})` from `src/components/matrix-network.tsx`; scoped style `matrix-network.css`. Canonical lesson links use `on-chip-network`, `dma-visibility-ownership` and `sharded-matmul-ownership`. No shared navigation, package command or content pack was changed by this module's author.

The component uses `PortableExperiment` with `serializeMatrixNetworkRecord` / `readMatrixNetworkRecord`. Only validated inputs and source/model identities are restored; all byte transfers, intermediate state and output are recomputed. Invalid imports throw before the component applies state. There is no checkpoint of a trained model in this experience, and no final-evaluation exposure state is opened or reset.

Pure exports in `src/lib/matrix-network.ts`:

- `matrixNetworkVersion`, `matrixNetworkMetadata`, `matrixNetworkLimits`, `matrixNetworkDefaults`, `matrixNetworkAssumptions`.
- `MatrixNetworkInput`, `MatrixNetworkFlit`, `MatrixNetworkCounters`, `MatrixNetworkMac`, `MatrixNetworkStep`, `MatrixNetworkResult` types.
- `normalizeMatrixNetworkInput(unknown)` rejects unknown fields, unsupported settings and segment indices outside the selected shape/slot width.
- `buildMatrixNetwork(input)` returns source/word/segment/flit identities and actual bytes; per-tick send, arrival, receiver, credit-return, destination and MAC state; final actual and independent reference matrices; and distinct readiness, publication and drainage boundaries.
- `inspectMatrixNetworkOperand(bytes, size)` applies the actual completeness gate used by ordinary and premature consumer requests. Missing positions stay null, even where a source byte legitimately equals zero.
- `matrixNetworkWordBytes` / `matrixNetworkBytesWord` implement explicit signed-int32 little-endian conversion. `serializeMatrixNetworkRecord` / `readMatrixNetworkRecord` validate a bounded portable input record.

Inputs select the existing 2×2 or 3×3 matrix, A/B transfer, 4/8/16-byte slots, one to four credits, one to eight ticks each for link and credit-return delay, an initial receiver pause of zero to 24 ticks, and receiver service every one to four ticks. The six fixtures are normal delivery, sender omission, wrong transfer/tensor identity, duplicate delivery, premature consumer request and changed data with valid identity. No arbitrary network topology or unbounded packet list is accepted.

## Executed boundaries

A logical segment has an expected buffer identity, offset and valid length. Each physical flit has a unique sequence number; a deliberate duplicate retains its logical segment identity. The final slot is padded to the declared width. Sender injection spends one receiver credit, including while the flit is still on the link. Arrival occupies the already reserved FIFO slot. Receiver dequeue accepts or rejects the payload and launches a delayed credit return. Rejected data still releases its occupied slot.

At every snapshot:

`visible credits + in-flight flits + queued flits + pending credit returns = configured receiver capacity`

Also, `sent = in-flight + queued + consumed`, `arrived = queued + consumed`, and `consumed = accepted + rejected`. A returned credit indicates a slot freed earlier; physically free capacity and capacity already known to the sender are different states. The sender injects at most one flit per tick. The receiver consumes at most one on an eligible tick.

Each tick processes returned credits, link arrivals, eligible receiver dequeue, sender injection, readiness and one subsequent consumer MAC in that order. A pause retains occupied receiver slots and produces backpressure. No entry or credit is silently discarded. The omission fixture skips a segment before sending, so it spends no credit and does not pretend to model in-flight packet loss. Once traffic drains with a missing segment, execution terminates with an incomplete operand and no consumer output; it does not hang or invent zero-filled input.

The consumer decodes its transferred input from destination bytes. The other matrix is explicitly local. It begins one tick after every unique segment is accepted. Each MAC records operand IDs, actual values, product and before/after accumulator. An independent BigInt calculation uses the original matrices to check C; this truth is never substituted for the delivered input. Trailing duplicates and return credits can coexist with consumer computation, so operand readiness, output publication and network drainage are separate times.

## Reproducible worked checks

For A = [[1,2],[3,4]], B = [[5,6],[7,8]], the four independent dot products give C = [[19,22],[43,50]] and eight MACs. The selected B[0,0] source bytes are [5,0,0,0]. With the valid-identity wrong-payload fixture on segment zero, its low bit changes 5 to 4. The actual consumer then produces [[18,22],[40,50]], while the original-matrix reference remains unchanged. This demonstrates why a complete correctly addressed transfer does not by itself prove data integrity. No checksum or authenticated integrity scheme is implemented.

For a 2×2 tensor using four-byte slots, one credit, link delay 2 and return delay 3, sends occur at ticks 0, 5, 10 and 15. The last operand arrives at 17; its final return drains at 20; eight MACs publish C at 25. These are independently derived from the stop-and-return recurrence, not a timing table supplied to the model. With four credits and link delay 3, the same four flits inject at 0,1,2,3 and become ready at tick 6.

The default 3×3 B transfer has 36 real bytes, five eight-byte slots and four padding bytes. With two credits and two-tick forward/return delays, sends occur at 0,1,4,5,8; operand readiness is tick 10, drainage tick 12 and output publication tick 37 after 27 MACs. Default C is [[2,5,-1],[5,1,10],[4,1,3]]. A duplicate of the first segment sends 44 valid payload bytes in 48 padded slot bytes, but writes only 36 unique destination bytes. Those denominators must not be merged.

The same 3×3 preset and word naming match the architecture and memory-workload specimens. This is an additive network slice of that operation, not a claim that a joined process-to-device-to-network physical system has been built.

## Source scope and limits

The primary [gem5 Garnet documentation](https://www.gem5.org/documentation/general_docs/ruby/garnet-2/) describes flit granularity, finite buffers and credit signaling, and delayed link traversal. It anchors those concepts only. The model here authors its own single-link order, fixture semantics and timing; it does not execute gem5, routing, virtual-channel allocation, coherence traffic or vendor protocol rules. Exact locators and the AI check date are in `source-review-manifest.json`.

The transfer ledger counts declared data-slot bytes and actual valid payload. Headers, credit-message bytes, framing, coding, arbitration and physical signaling are excluded. There is no measured bandwidth, energy, error probability or retry policy. Source/destination/snapshot arrays remain in browser memory for inspection, so logical slot occupancy is not a heap or hardware memory measurement. The maximum is ten physical flits and 512 synthetic ticks; inputs and imports are bounded before simulation. Matrix values are the fixed small signed presets; arithmetic remains exact within this scope, and output words are explicitly encoded int32.

## Verification

Run `node --experimental-strip-types --test scripts/matrix-network.test.mjs`. All 19 tests pass. They include hand dot products and signed bytes; independent column-wise reference multiplication over all shape/tensor/slot/credit settings and delay extremes; conservation at every snapshot; hand-derived timing recurrences; pause/backpressure; exact destination holes; duplicate and wrong-identity handling; the shared completeness gate; actual wrong operands; bounded worst-case schedules; strict records; and snapshot immutability. `npx tsc --noEmit` passes. Logs are adjacent.

Actor: AI agent `/root/curriculum_assessment`, 2026-09-07. These results are source and automated evidence only. New browser interactions, physical-device, assistive-technology and specialist/learner observations remain unestablished by this package.
