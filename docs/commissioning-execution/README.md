# From a powered device to an accepted matrix result

**commissioning-execution-1** follows one exact 2×2 matrix job through a declared firmware interface, device discovery, driver resources, process and device address spaces, visibility handoffs, owned submission, actual DMA reads, arithmetic, output writes, completion and one optional reset/retry. It is a bounded addition to the runtime and commissioning curriculum.

- [Model](../../src/lib/commissioning-execution.ts), [standalone input records](../../src/lib/commissioning-execution-record.ts)
- [React component](../../src/components/commissioning-execution.tsx), default `CommissioningExecution({onSelect?})`
- [Five lessons](../../src/lib/data/hardware-runtime-learning.json), [eight canonical science cards](../../src/lib/data/equations-hardware-runtime-learning.json)
- [Tests](../../scripts/commissioning-execution.test.mjs), [complete importable fixtures](scenarios.json), [source checks](source-review.json), [validation record](validation.json)

## The exact specimen

The operation and its independent reference reuse the existing architecture module. Inputs are two 2×2 matrices with integer entries from −99 through 99. Four-byte words establish byte counts; there is no floating-point rounding, overflow or timing model. The default A is `[[1,2],[3,4]]`, B is `[[5,6],[7,8]]`, and the intended C is `[[19,22],[43,50]]`.

The device result is accumulated from words actually read through the current translation table. The reference only checks the final consumer output. It never supplies an operand or result to execution.

| Buffer | Process virtual base | Physical base | Device IOVA | Device permission |
|---|---:|---:|---:|---|
| A | 0x1000 | 0x4000 | 0x8000 | Read |
| B | 0x2000 | 0x5000 | 0x9000 | Read |
| C | 0x3000 | 0x6000 | 0xA000 | Write |

Each declared region contains 16 bytes. A word at index 3 begins 12 bytes beyond its base. Virtual 0x100C and device 0x800C both reach physical 0x400C under the correct map. These byte-range checks are teaching abstractions: the 4096-byte spacing of bases does **not** make this a real page-granular IOMMU, CPU page table or pinning implementation. The assumed device address mask is 16 bits.

## Readiness, visibility and ownership

The process can write its matrices while the device remains unavailable. Firmware handoff advertises `matrix-int32-v1`; the incompatible option advertises another ABI and blocks before submissions, DMA or arithmetic. No firmware code or signature is executed. Device discovery is one declared driver match. Resource claim and queue enable are separate states; no native enumeration or register transaction is claimed.

Noncoherent mode has explicit CPU-visible and physical-memory copies. Physical input memory begins at zero. CPU writes make the input cache dirty; the input handoff updates memory. Coherent mode keeps values equal immediately in this digital abstraction. It does not simulate a coherence protocol or remove descriptor ordering/lifetime constraints.

Descriptor preparation precedes ordered publication. Publication transfers all three buffers to device ownership. A deliberate early overwrite of B is rejected before either data copy changes. Four output writes precede a completion record. The host checks job identity and epoch, establishes output visibility, returns ownership, reads its actual C copy once and releases mappings after the device is done.

The model’s translation-install and visibility events are separate teaching actions. They do not correspond one-for-one to `dma_map_single` and `dma_sync` calls. A real DMA API can establish visibility as part of mapping; its correct use depends on the mapping lifecycle.

## Counterexamples and exact outcomes

| Default-matrix scenario | Consumer output | Executed / discarded / committed MACs | DMA input / output bytes |
|---|---|---:|---:|
| Correct map and visibility | `[[19,22],[43,50]]` | 8 / 0 / 8 | 32 / 16 |
| Permitted B→A mapping | `[[7,10],[15,22]]` | 8 / 0 / 8 | 32 / 16 |
| B mapping absent | No publication | 0 / 0 / 0 | 16 / 0 |
| Noncoherent input handoff omitted | Zero matrix | 8 / 0 / 8 | 32 / 16 |
| Noncoherent output handoff omitted | −777 sentinel matrix | 8 / 0 / 8 | 32 / 16 |
| Early reuse attempted | Correct result; action rejected | 8 / 0 / 8 | 32 / 16 |
| Reset after two cells, retry once | Correct result published once | 12 / 4 / 8 | 64 / 24 |
| Reset after two cells, stop | No publication | 4 / 4 / 0 | 32 / 8 |

A valid mapping does not prove the intended object was selected. The B→A case is readable and produces A squared; the missing mapping instead supplies no B operand. Coherent mode removes the two-copy stale-value counterexamples, but early reuse remains invalid.

“Committed MACs” are arithmetic belonging to the accepted attempt. They are **not** proof that the input identity or published result was correct. Semantic comparison remains a separate outcome. Likewise, physical writes can exist without any accepted completion.

## Reset and useful work

Reset-needed leaves the old attempt uncommitted. In the stated contract, reset acknowledgement establishes that the engine has stopped touching old buffers. Only then are mappings retired and buffers returned. Partial output remains inspectable but is not published. A retry assumes intact host inputs and a successfully reinitialized device, clears the output specimen and uses a new epoch for the same `matrix-job-1` identity.

A previously queued host-side notification for the old epoch is rejected. This is not a reset device generating a new old-epoch notification. Wrong-job, premature and duplicate completions are also rejected. The normal publication gate needs a matching live descriptor, current epoch and all four output cells written.

At every event:

```text
executed MACs = active MACs + discarded MACs + committed MACs
submitted attempts = active attempts + canceled attempts + completed attempts
```

The second identity has at most one active attempt. Completed attempts and published results never exceed one. Reset after all four output writes can still discard eight MACs if the completion boundary was not crossed. The pure matrix operation has no external side effects, so a fresh attempt can replace its uncommitted output. This does not imply arbitrary I/O or external actions are safe to replay.

## Lessons and classroom use

1. `firmware-device-contract`: reject an incompatible interface before DMA; separate compatibility from authentication.
2. `process-dma-address-spaces`: resolve one element through virtual and device addresses to physical storage.
3. `iommu-buffer-identity`: compare a permitted wrong alias with an absent mapping and derive both results.
4. `dma-visibility-ownership`: inspect stale copies and reject early reuse even with coherent data.
5. `device-completion-reset-epochs`: account partial work and reject old completions during recovery.

A short exercise uses the default, wrong-mapping and absent-B fixtures. A longer exercise adds omitted handoffs and each reset position. Ask learners to predict the actual read values and publication boundary before opening the event table. The address diagram, text values and full table represent the same state; keyboard controls and narrow layouts do not require motion.

## Primary sources and limits

[Linux 6.16 PCI driver guidance](https://docs.kernel.org/6.16/PCI/pci.html) supplies discovery and resource-lifecycle context. [Linux 6.16 DMA guidance](https://docs.kernel.org/6.16/core-api/dma-api-howto.html) distinguishes address spaces, data visibility, ordering and access lifetime. [Virtio 1.3](https://docs.oasis-open.org/virtio/virtio/v1.3/virtio-v1.3.html) supplies explicit status, initialization, exposed-buffer and reset boundaries. The source review records exact locators and authored-model limits.

This is not a PCI/Virtio-conforming device, real Linux driver, boot or firmware emulator, page-table/IOTLB model, cache-coherence protocol, secure-boot verification, attestation, hardware isolation proof or performance predictor. The finite quiescence, reinitialization and retry assumptions are explicit. No physical device, human learner or human specialist observation is claimed.

## Portable records and verification

Input records include `schemaVersion`, `modelVersion` and all inputs. Import validates before changing live controls and does not overwrite saved input until Save is selected. Incompatible old raw text is preserved before persistent replacement; a failed backup leaves the active record intact. The record keys are `atlas-commissioning-execution-input` and `atlas-commissioning-execution-older-inputs`.

```sh
node --experimental-strip-types --test scripts/commissioning-execution.test.mjs
node --experimental-strip-types docs/commissioning-execution/verify-fixtures.mjs
npx tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext \
  --moduleResolution bundler --jsx react-jsx --lib es2022,dom,dom.iterable \
  --allowImportingTsExtensions --esModuleInterop \
  src/components/commissioning-execution.tsx \
  src/lib/commissioning-execution.ts src/lib/commissioning-execution-record.ts
```

Verification includes all 256 binary 2×2 matrix pairs, 480 combinations of boot/coherence/handoff/fault/reset policy, exact counterexamples, range/permission/epoch boundaries, input validation, copied snapshots and storage-failure recovery. It does not close broader operating-system, firmware-security, RAS or hardware signoff work.
