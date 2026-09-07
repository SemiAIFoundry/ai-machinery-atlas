# Clock crossings, protected words and useful recovery

**hardware-reliability-1** adds two bounded digital mechanisms within HW03/HW10. They have independent state and are presented together because both answer when data is valid to consume. This version does not connect the FIFO's physical word directly to the ECC case and does not close the broader verification, RAS or package-reliability workstreams.

- [Pure model and input records](../../src/lib/hardware-reliability.ts)
- [React component](../../src/components/hardware-reliability.tsx), default `HardwareReliability({onSelect?})`
- [Tests](../../scripts/hardware-reliability.test.mjs), [complete fixtures](scenarios.json), [source review](source-review.json)

## Tagged FIFO across two clocks

`buildFifoTrace(input)` executes a four-slot FIFO with three-bit modulo-eight pointers. The low two binary bits address a slot; the third distinguishes wrap. Binary-reflected Gray encoding is `g = p XOR (p >> 1)`. Each ordinary increment changes one Gray bit. The opposite-domain Gray pointer passes through two ideal receiving registers, clocked only by the receiving clock. Both sides sample **pre-edge state** when their clocks coincide.

Writer readiness derives from the writer's synchronized read pointer. Reader validity derives from its synchronized write pointer. A transfer requires both valid and ready at that domain's edge. These observed pointers lag the actual other domain, so a just-freed slot may not yet make the writer ready. The model's fixed source holds the next tagged value until it is accepted. The consumer is either always ready or ready for two read edges and blocked for two.

The hardware-style control uses its pointers and slots; a separate expected-tag list checks the resulting data. That checker does not decide which word the FIFO reads. The trace exposes write/read edges, pre-edge valid/ready, pointer and synchronizer state after the event, observed data and the accounting identity:

```text
accepted tags = validly consumed tags + canceled tags + outstanding contract tags
```

A coordinated reset cancels all accepted outstanding tags and resets both pointer domains and synchronizers. Source identity continues; canceled tags are not falsely described as delivered. Reset dominates a coincident edge. It is an explicit instantaneous digital reset contract, not a model of reset pulse width, synchronized reset release or physical CDC signoff.

Reader-only reset intentionally violates that shared contract. The default unsafe fixture resets at tick 23 and at tick 35 observes **tag-4 when tag-2 was required**. It halts with a contract violation. The writer can also overrun intended outstanding data after the unilateral reset; the independent expected queue then describes the broken contract, not a valid physical occupancy count. The table retains this evidence rather than silently repairing it.

| Default FIFO scenario | Accepted | Validly consumed | Canceled | Pending at outcome |
|---|---:|---:|---:|---:|
| No reset | 8 | 8 | 0 | 0 |
| Both domains reset at tick 23 | 8 | 5 | 3 | 0 |
| Reader-only reset at tick 23 | 8 | 2 | 0 | 6; contract violated |

Physical bits left in a consumed slot are not cleared by ordinary reads. The UI therefore distinguishes old bits from pending valid tags. This is why a memory location alone does not prove data validity.

The [OpenTitan asynchronous FIFO source](https://github.com/lowRISC/opentitan/blob/master/hw/ip/prim/rtl/prim_fifo_async.sv) supplies a concrete primary example of ready/valid handshakes, Gray pointers and receiving-domain registers. Our compact model is not that RTL: for example, the inspected implementation includes an additional registered decoded read-pointer stage. No equivalence, native RTL run or analog metastability result is claimed.

## Extended Hamming (8,4) and the consumer

`encodeSecded(payload)` and `decodeSecded(bits)` implement one fully declared code. Four data bits occupy positions 3, 5, 6 and 7; parity bits occupy 1, 2 and 4; overall even parity occupies 8. Position numbering is one-based. Payload d0 is its least significant bit.

The decoder computes three parity checks over positions 1…7 whose binary index contains the relevant parity bit, plus the XOR of all eight received bits. Syndrome is `s = check1 + 2 check2 + 4 check4`.

| Syndrome | Overall parity | Decoder action |
|---|---|---|
| 0 | 0 | Supply unchanged payload |
| Nonzero | 1 | Flip the indexed position and supply the corrected payload |
| 0 | 1 | Flip overall-parity position 8 and supply the payload |
| Nonzero | 0 | Report detected double error; supply no payload |

The code has minimum distance four. Tests exhaust all 16 payloads, all 128 single-bit injections and all 448 double-bit injections. They also compare every codeword with a separately specified parity-check matrix and every pair of codewords for minimum distance. The implementation is an explicit teaching derivation; no vendor memory's physical ECC arrangement is inferred.

A three-bit fixture makes the boundary visible. With payload 9 and flips at positions 1, 2 and 3, the decoder reports an overall-parity correction and returns 8. The decoder cannot know the injected truth; the test fixture can. It therefore marks an out-of-guarantee mismatch instead of turning the correction label into a claim of a correct word.

The [OpenTitan ECC tooling documentation](https://opentitan.org/book/util/design/index.html) is primary context for distinct encode/decode and verification artifacts, not a claim that our (8,4) mapping matches one of its generated hardware configurations. [Hamming's 1950 publisher record](https://onlinelibrary.wiley.com/doi/10.1002/j.1538-7305.1950.tb00463.x) establishes the historical publication; its full mathematical text was not available in this review, so no unseen equation is cited as checked.

### Retained work and recovery

`buildEccRecovery(input)` executes a finite consumer that adds one decoded payload per step. One selected read uses the injected codeword. All other reads use a separately assumed healthy word. Checkpoints atomically record completed-step count and the accumulator. Checkpoint storage is assumed intact; that does **not** imply the computed value inside it is correct.

When a read is detected uncorrectable, the consumer does not use its payload. The stop policy publishes no final result. The restore policy resets current state to the most recent checkpoint, discards uncommitted progress and re-executes with an assumed healthy copy. That copy and checkpoint are external assumptions; SECDED did not repair the two-bit error. The fault is injected once, not repeatedly on every retry.

```text
executed computation steps = currently completed steps + steps discarded by restart
```

A failed memory read is counted separately from computation. Current completed and checkpointed work remain distinct, as in the existing retained-work boundary, but this module is an independent exact toy ledger. It does not silently import hall timing, throughput, fault rates or checkpoint durability parameters.

For the default payload 9, six steps, a two-bit fault at step 4 and a checkpoint every two steps:

- Three steps execute before the detected read failure; two are checkpointed.
- Restore discards one completed step.
- Seven computations and eight read attempts complete six useful steps, with final sum 54.
- Stop instead leaves three current steps and two checkpointed steps, with no final output.
- The three-bit miscorrection fixture completes with sum 53 instead of the known reference 54. Its inaccurate state can itself be checkpointed; checkpoint integrity does not establish semantic correctness.

## Teaching and integration

The UI shows two clock-domain panels, four physical slots, synchronizer registers, state flags and a complete event trace. The ECC view exposes bit positions and roles, received changes, parity checks, decoder classification and a synchronized consumer/checkpoint ledger. Keyboard controls, text/tables and narrow-screen layouts do not require motion or 3D.

Suggested tasks:

1. Predict when a writer notices a newly free slot; follow the receiving stages rather than assuming immediate visibility.
2. Compare coordinated and reader-only resets. State which accepted tags are canceled and which observed word violates the original order.
3. Flip a parity bit, then a data bit. Explain why both are correctable without giving them identical syndromes.
4. Predict the discarded work after a double error with checkpoint interval two versus three.
5. Inspect a three-bit miscorrection. Separate what the decoder observes from what the injected fixture knows.

Standalone input records contain `schemaVersion`, `modelVersion`, complete FIFO input and complete ECC input. Import validates before changing live inputs and requires an explicit Save for persistent replacement. The local active key is `atlas-hardware-reliability-input`; incompatible prior text is durably preserved first in `atlas-hardware-reliability-older-inputs`. Backup failure leaves prior active data intact. Portable export retains exact older raw strings, including unreadable recovery data.

## Verification and limits

```sh
node --experimental-strip-types --test scripts/hardware-reliability.test.mjs
node --experimental-strip-types docs/hardware-reliability/verify-fixtures.mjs
npx tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext \
  --moduleResolution bundler --jsx react-jsx --lib es2022,dom,dom.iterable \
  --allowImportingTsExtensions --esModuleInterop \
  src/components/hardware-reliability.tsx src/lib/hardware-reliability.ts
```

The tests include 360 clock/backpressure/reset scenarios, simultaneous-edge sampling, a finite-horizon incomplete case, the exact reset counterexample, exhaustive code guarantees, 384 payload/fault-step/checkpoint recovery configurations, input validation, copied snapshots and storage failure/recovery.

No analog metastability, propagation skew, clock jitter, radiation spectrum, device wear-out, vendor HBM code, physical reset release, operating-system recovery, native RTL proof or hardware measurement is modeled. Source/logic checks are by an AI agent; human specialist, device and learner observations remain unclaimed. Remaining HW03/HW10 implementation is tracked separately from this bounded delivery.
