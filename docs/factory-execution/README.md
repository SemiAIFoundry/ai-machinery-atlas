# Model work through a factory execution boundary

`factory-actual-checkpoint-1` carries one named job, `FACTORY-DECODER-01`, from a complete causal-decoder source checkpoint to a recoverable model artifact. The decoder gradients, optimizer updates, checkpoint contents and replayed state are real numerical computations. The rack, timing, transport and durable-storage protocol are declared teaching assumptions. This does not measure a machine, forecast a factory, or establish production fault tolerance.

## What is connected

| Boundary | Executed mechanism | What is deliberately excluded |
| --- | --- | --- |
| Source → admitted work | Full `LifecycleRun`; actual commissioning self-test; existing whole-rack feed/current/coolant admission | Boot certification, real firmware, manufacturing qualification |
| Reserved examples → two logical ranks | Existing 423-parameter decoder; four copy-domain examples, 1+3 partition, token-weighted next-token objective | Vendor kernels, measured instructions, cache/DRAM traces |
| Ranks → optimizer | Actual gradient numerators, owned reduction shards, owner optimizer slices and reconstructed replicas; independent centralized comparison | NCCL/MPI execution, ring topology, physical packets |
| Live state → storage | Exact full-workspace UTF-8 JSON bytes; old+new capacity check; staged write followed by an atomic marker | Real filesystem persistence guarantees, corruption, replication |
| Whole-job failure → replay | Actual weights, Adam moments, optimizer step, sampler RNG and cursor restored together | Statistical failure rate, partial-rank production recovery, changing membership |
| Committed work → another experience | A compatible complete `DistributedTrainingRun` export/callback | A claim of model quality, scientific usefulness, or AGI |

The supplied model's optimizer configuration is retained. The additional work uses the distributed model's declared copy-domain, next-token branch, regardless of the source's previous training stage. A provided checkpoint can therefore carry learned parameters and existing optimizer moments into this specific additional objective. The source is cloned and never mutated.

The prior machine, commissioning and reliability experiences remain separate inspectable mechanisms. Only commissioning acceptance and operating-hall admission/power boundaries are used here. Lane addresses, ECC probabilities, DRAM time and the operating hall's planning workload totals are not silently assigned to the decoder.

## Run and integrate

From the repository root:

```sh
node --experimental-strip-types --test scripts/factory-execution.test.mjs
node --experimental-strip-types docs/factory-execution/verify-fixtures.mjs
```

The [pure model](../../src/lib/factory-execution.ts) exports:

```ts
buildFactoryExecution(input?: FactoryInput, source?: LifecycleRun): FactoryResult
sampleFactoryExecution(result: FactoryResult, atS: number)
factoryReference(input: FactoryInput, source?: LifecycleRun)
serializeFactoryWorkspace(input: FactoryInput, source: LifecycleRun): string
readFactoryWorkspace(raw: string): { input: FactoryInput; sourceCheckpoint: LifecycleRun }
```

The [React component](../../src/components/factory-execution.tsx) accepts optional `onSelect(id)`, `checkpoint: LifecycleRun`, and `onServing(run: DistributedTrainingRun)`. The supplied checkpoint is used unless a complete workspace has been restored or the learner explicitly selects the seeded source. Only a completed, durably checkpointed run enables the serving handoff. Its accepted checkpoint is readable by the existing distributed experience.

Save/restore retains the complete source and all factory inputs, with an explicit 650,000 UTF-8 byte saved-record limit for this experience (other portable experiences retain their default 20,000 byte limit). The shared portable workspace preserves displaced raw records in its bounded recovery history: up to 30 records and 1 MB, so large workspaces can fill history sooner. Backup or capacity failure leaves the active record and live inputs intact; export recovery before explicitly clearing old copies. File import supports full factory workspaces up to 650,000 bytes; it validates before replacing current state and rejects a stale asynchronous read. The shared text-entry field is limited to 20,000 characters, so larger imports use the file control or saved-workspace restore. The existing exposure journal retains prior final-test exposure; this experience does not open final-test examples.

The [example workspace](example-workspace.json) is directly importable. Each entry in [scenarios.json](scenarios.json) contains a complete `before` workspace and actual recomputed `after` artifacts and counters. Save an entry's `before` object as JSON to import it. `acceptedArtifact` is null for blocked/stopped scenarios; `durableArtifact` is the last valid source or checkpoint. These are different promises.

## Schedule and dimensions

One rack has two declared package slots. Both ranks begin their local work together. Each rank's assumed finish time is `0.01 s × its valid target count`, with an extra supplied delay on rank 1. The default four-example batch has 6 and 24 valid targets. These times are a scenario mapping, not a FLOP count or measurement of JavaScript computation. A gradient is numerically evaluated when its modeled rank finishes. A fault during an unfinished rank records elapsed slot time without claiming that its full gradient completed.

After both ranks finish, rank 0 and rank 1 send their complete JSON contributions over one serialized central-reducer link. Every payload byte is counted once at its transmitter. Per-message time is latency plus `UTF-8 bytes / bytes per second`. This is not an all-reduce traffic formula. The 423 gradient numerators alone would require 3,384 bytes as packed binary64; the actual teaching JSON also contains decimal representations and ownership metadata. Target counts, scalar values and encoded bytes remain separate units.

The complete owned reduction/update/reconstruction operation has an assumed 0.02 s duration. The numerical core executes reduce-scatter ownership, owner optimizer slices and all-gather reconstruction within that single interval; this factory adapter does not infer extra physical collective transfers or time. The checkpoint retains those actual ownership records and replicas, so they contribute to its exact JSON size. A full blocking checkpoint takes its exact JSON bytes divided by storage throughput, then a 0.05 s commit-marker interval with zero payload bytes. A checkpoint is scheduled at the chosen update cadence and at the final requested update. A checkpoint fault targets the first such write at or after the selected update. A rank fault occurs halfway to the slowest rank finish in the selected round. A failure after an optimizer update occurs before checkpointing it.

## Checkpoint and recovery contract

The source checkpoint exists before the run. Its prior creation is outside the boundary; its first load is counted. The current committed checkpoint and a replacement must coexist until commit, so required capacity is `old bytes + new bytes`. A failed or unfinished replacement preserves the old artifact. A complete write without a completed marker is still not authoritative. Inspection/export copies in the browser are outside this simulated store.

On a fault all live workers stop. The record distinguishes:

- Completed optimizer updates still present in the committed artifact.
- Completed but volatile updates that are lost.
- Completed rank gradients not yet included in a committed optimizer update.
- Unfinished rank time that has no completed gradient.

Recovery waits an assumed 0.4 s, reads the complete earlier artifact, and replays from its optimizer and sampling state. One prescribed fault is repaired; checkpoint corruption, repair failure and repeated faults are excluded. With recovery disabled, no accepted model is published, even though the earlier committed artifact remains exportable.

LLNL SCR's [Checkpoint and Restart with SCR sections](https://scr.readthedocs.io/en/latest/users/integration.html#checkpoint) require explicit checkpoint completion/validity and restart from available checkpoint files. Those distinctions support this teaching contract; SCR itself is not executed. PyTorch's [general-checkpoint guidance](https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html#saving-loading-a-general-checkpoint-for-inference-and-or-resuming-training) explains why training recovery includes optimizer state beyond model parameters. Our cursor and RNG are additional explicit fields of this numerical experiment.

PyTorch 2.14 [torchrun Failure Modes and Important Notices](https://docs.pytorch.org/docs/2.14/elastic/run.html#failure-modes) describe group-level restart and possible loss of uncheckpointed work. The factory example adopts a whole-job stop but keeps two fixed logical ranks and an authored deterministic schedule. It does not execute torchrun or guarantee the behavior of a production runtime.

## One time and energy ledger

The operating hall supplies whole-rack admission; the adapter uses its documented power equations with the same parameters. A test compares the adapter's run, checkpoint and recovery coefficients directly with actual operating-hall phase outputs. The admission probe's separate workload/time/energy counters are discarded.

For the synthetic admitted rack:

```text
IT input power = (2 × package phase power + 20 W auxiliary) / 0.9
Facility input power = 1.2 × IT input power
Facility overhead = facility input − IT input
Coolant heat = IT input
Coolant temperature rise = IT input / (mass flow × 4180 J/(kg K))
```

Run/checkpoint/recovery package powers are 50/10/5 W, producing facility powers 160 / 53⅓ / 40 W. Rank and network waiting use the run phase power; the model does not claim a measured idle-power curve. Whole-rack admission uses the highest phase load, an equivalent 1 V package rail limited to 60 A, a 48 V rack bus limited to 5 A, the supplied facility feed and a 5 K steady-state coolant-rise limit. Zero admitted racks means no job execution. Readiness delay is outside the energized incremental-job boundary; real commissioning test activity and standing building loads are excluded.

The [DOE/LBNL metering guide, February 2017, §§2.1 and 3.2](https://datacenters.lbl.gov/sites/default/files/DataCenterMeteringandResourceGuide_02072017.pdf) distinguishes IT/facility energy boundaries and power from integrated energy. Our fixed PUE is an assumption applied consistently to all phases, not measured annual PUE or a productivity metric. [OpenStax University Physics 2, §9.5, Eq. 9.12 and The Cost of Electricity](https://openstax.org/books/university-physics-volume-2/pages/9-5-electrical-energy-and-power) gives the DC power and energy-integral relationships used by the ledger. Package/rack currents belong to separate voltage boundaries; they are not summed.

The coolant expression is inherited from the existing [operating-hall science contract](../engineering/operating-hall/SCIENCE.md). Its NASA heat-exchanger reference has a preserved, successful scoped PDF check in the established curation record. The latest web-reader retry failed; [source-review.json](source-review.json) retains both the earlier evidence and this failed recheck without claiming a new reading. The constant specific heat and ideal all-IT heat capture are scenario assumptions, with no temperature transient, pump curve or water-consumption claim.

Every interval has exactly one wall-time phase and one total-power coefficient. Energy is the sum of coefficient × interval duration. Coolant heat is already part of facility heat. There is no additional efficiency, availability, checkpoint-loss or reliability multiplier.

The tested identities are:

```text
Executed updates = rolled-back updates + retained updates
Completed rank computations = rolled-back rank computations
                            + 2 × retained updates + pending completed ranks
Rank busy time + idle slot time = 2 × compute wall time
Facility energy = IT energy + facility overhead energy
Coolant heat = IT energy, under the declared ideal capture boundary
```

## Worked comparisons and validation

The seeded default has three requested updates and checkpoint cadence two. An uninterrupted run reaches three durable updates. The default halfway-write failure loses updates one and two, restores checkpoint zero and executes five updates in total to retain three. Its final weights, first and second moments, optimizer count, RNG and sampler cursor agree with the uninterrupted result. See the generated fixture counters for exact JSON byte counts and resulting times; metadata or dependency schema changes can legitimately change those bytes.

The focused test suite checks independent full-batch objective/Adam/SGD arithmetic, a previously trained source, every fault/cadence combination, before/after-marker durability, incomplete barriers, concurrent rank ownership, storage boundary equality, zero-admission/readiness failures, UTF-8 bytes, cursor integration and strict complete-state restoration. It checks full vectors and state, not just a displayed score.

[validation.json](validation.json) records the actual commands and source fingerprints. Browser rendering, assistive technology, physical-device, instructor, learner and specialist observations are not asserted by these model tests. This bounded connection advances the broader factory roadmap; it does not close all infrastructure, systems-operation or hardware co-design tracks.
