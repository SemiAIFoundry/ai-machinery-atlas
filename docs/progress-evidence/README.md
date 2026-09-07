Repository integration: the authoritative model is `src/lib/progress-evidence.ts`; the component is `src/components/progress-evidence.tsx`; guide/case data are in `src/lib/data/`. Run `node --experimental-strip-types --test scripts/progress-evidence.test.mjs` from the repository root. The portable builder/validator and their source snapshot remain in the original assessment asset folder. The following design notes retain the handoff instructions for context.

# Progress and capacity evidence (R28 + R24)

`progress-atlas.json` adds ten selected breakthrough → mechanism → worked experience → changed bottleneck routes. It links exact existing milestone records and lesson IDs. The combined **76-item timeline remains intact**: this guide supplements it and neither shortens nor deduplicates it. `authored-reference-snapshot.json` captures the 224 lesson IDs and the combined timeline used for reference validation. The guide is selective, not a complete or inevitable history of AI.

`capacity-cases.json` contains five dated primary-source snapshots. Every observation keeps its own unit, cutoff, status and boundary. Each case records source locators, scope limitations, exclusions from aggregation, an actual agent source-check date, a proposed review role and refresh triggers. An unknown publication date remains `null`; partial dates retain their stated precision. “As of” describes the observation, not the day the interface is viewed. No specialist review or private capacity access is asserted.

- [TSMC's July 2026 call](https://investor.tsmc.com/english/encrypt/files/encrypt_file/reports/2026-08/3e494f0c14dd0890f897aa044415e21d93486cc4/TSMC%202Q26%20Transcript.pdf) supports management-level capacity commentary, not customer queue positions.
- [Berkeley Lab's 2026 queue report](https://eta.lbl.gov/publications/queued-2026-edition-characteristics) describes proposed transmission-connected generation/storage at end 2025, not operating data-center load.
- [INCITE's 2026 awards](https://www.alcf.anl.gov/news/incite-program-awards-supercomputing-time-75-high-impact-projects-0) identify bounded access grants; unlike system node-hours are not interchangeable compute units.
- [Core Scientific's Q2 release](https://investors.corescientific.com/news-events/press-releases/detail/139/core-scientific-announces-second-quarter-2026-results) distinguishes billable service from signed customer capacity. Its observations have different stated cutoffs.
- [Galaxy's Q2 presentation](https://investor.galaxy.com/static-files/bd9f9727-1a8f-4fa1-8533-175e10020d7f) distinguishes a delivered phase, future contracted phases and gross versus IT power. These overlapping quantities must not be added.

## Pure arithmetic API

`src/lib/progress-evidence.ts` has no app or network dependencies. Its current model version is `progress-evidence-2`. All exercise inputs are synthetic and are separate from the source cases.

```ts
compareGrowthIndices({scenario: 'compute-memory', memoryMetric: 'bandwidth', periodYears: 2, periods: 5, computeFactor: 3, comparisonFactor: 2});
allocatePackageCapacity({testSlots: 75, policy: 'listed-order'});
allocateHallCapacity({coolingITMW: .85, policy: 'first-fit'});
sourceFreshness('2026-09-07', 90, '2026-12-06');
```

The default growth comparator answers the requested conditional scenario: compute scales 3× and memory scales 2× **per two-year interval**. The named default compares assumed per-accelerator dense FP16 peak FLOP/s with memory-interface bandwidth in bytes/s. A selector can instead make the memory metric capacity in bytes; capacity and bandwidth are distinct constraints, and neither is silently substituted for the other. The prior compute-versus-commissioned-facility-IT-power comparison remains an explicitly named alternative. These are adjustable assumptions, not fitted empirical rates, a forecast or a universal law.

Each metric starts at its own index 100 in 2026. Five two-year intervals end in 2036 at indices 24,300 and 3,200. Their ratio, 7.59375, describes only the relative changes of the two normalized indices. It establishes no actual performance deficit, queue or physical conversion between units. The period selector offers one or two years; changing it reinterprets the entered factors and does not silently annualize them. Keep precision, operation counting, device boundary, memory tier/interface convention and base-year normalization explicit when comparing actual measurements. No primary source observation supplies these synthetic growth factors.

The package scenario computes `min(qualified logic dies, floor(qualified HBM stacks / stacks per package), assembly slots, test slots)`. Defaults give 75 packages from constraints 120, 80, 90 and 75. Listed-order partial shipments allocate `[50,25,0]` against requests `[50,40,20]`; largest-remainder proportional allocation gives `[34,27,14]`. Raising test slots to 100 moves the constraint to the 80 HBM-equivalent packages. Units are assumed mutually compatible, one-for-one after qualification, with no yield loss/rework or within-period replenishment. This does not encode any foundry customer priority or real product inventory.

The hall scenario bounds concurrent racks by installation, commissioning, facility input divided by an assumed fixed PUE factor and IT rack power, and available IT heat rejection divided by IT rack power. Defaults give `min(12,9,10,8)=8`. Whole-rack jobs `[5,4,3]` produce `[5,0,3]` under first-fit and `[5,0,0]` under strict-order. This instantaneous admission model omits topology, memory compatibility, fairness, duration and wait times. PUE is an assumption, not a measured facility property. IT heat rejection is not added again as electrical demand. The tiny whole-unit tolerance repairs binary rounding near an integer, not a substantive power deficit.

Other helpers provide gate charge/energy, uniform-wire lumped RC, parallel-lane byte rate, exact small integer matrix multiplication, a scalar Adam trace, one-row online softmax and block KV allocation. Every result contains its arithmetic boundary. The Adam example differs from R26's batch-gradient classifier; it does not demonstrate training convergence. The output-stationary R21 array differs from the weight-stationary TPU datapath described in the 2017 paper. The online-softmax row is a limited arithmetic illustration, not a complete FlashAttention kernel or an HBM-traffic benchmark. Historical primary-source locators and scope are in `progress-atlas.json`.

## Refresh and validation

Refresh a case when its source-specific trigger occurs or its review cadence expires. Read the replacement primary source, retain its actual status/measurement cutoff and definitions, and compare matching observations. Append a revision with the previous case/revision identifier in `supersedes` when it replaces the same scope; preserve old projections and snapshots. A later publication does not turn an announcement into operating capacity. A runtime date or passing build never writes a new source-check date. `sourceFreshness` returns only a reminder status; an absent check remains baseline-review-needed, and an overdue source remains a dated observation until reviewed.

From this folder:

```sh
node --experimental-strip-types build-progress-assets.mjs
node --experimental-strip-types --test progress-models.test.mjs
ATLAS_TSC_PATH=/path/to/typescript/bin/tsc node --experimental-strip-types validate-progress-assets.mjs
```

The validator checks reproducible fixtures, source/lesson/milestone references and hashes; runs independent arithmetic tests; and records strict TypeScript status. Automated evidence covers implementation and explicit invariants only. Device, accessibility, specialist and learner validation are not implied.

## Proposed UI integration

Copy `progress-evidence.tsx` to `src/components/progress-evidence.tsx`; copy the model as `src/lib/progress-evidence.ts`; copy the two guide/case JSON files to `src/lib/data/`. The UI uses existing `studio-primitives`, lightweight atlas names and the actual pure functions. It loads the worked arithmetic from helpers, not rounded display strings. Import the component lazily alongside the other studio experiences.

Optional props are `onSelectLesson(id)`, `onOpenHistory(milestone)` and `onOpenExperience(studioId)`. The first can call the app's existing lesson selector. The history callback should open the existing complete timeline, ideally at the exact supplied milestone; the guide also retains its original source link. The experience callback can select the existing architecture/operating-hall experience. Without callbacks, lesson hash links and original source links remain usable. Source dates/units/status and simulation assumptions stay in learner views; review roles and internal curation metadata do not appear as instructional text.

The separate UI validation uses a temporary integration tree outside the repo, links to actual existing dependencies and primitives, and compiles with the repo TypeScript compiler. It does not launch a browser, alter the app, or claim visual/device verification. Root should integrate and run the app's own checks after copying the assets.


## Workspace and current source integration

The source tree is authoritative. The progress view, selected breakthrough, each worked control, allocation choices and the growth scenario/metric/period persist through `useStudioState`. Workspace imports check these values before rendering. Dated capacity cards expose their recorded source-check date, cadence, concrete update triggers and supersession scope; runtime dates do not rewrite source-check history. The consolidated primary-source metadata remains `docs/progress-evidence/source-review-manifest.json`.

Run `node --experimental-strip-types --test scripts/progress-evidence.test.mjs scripts/studio-record.test.mjs` and `node node_modules/typescript/bin/tsc --noEmit` from the repository. The record controller tests exercise failed/invalid imports, recovery swaps, stale callbacks, default registration, cross-field constraints and conservative browser import computation limits. Model validators still define scientific input bounds; the record additionally limits import work to 2,001 regular samples, a conservative 5,000-transition bound and 25,000,000 estimated sample/transition comparisons. The record shape caps scenario event lists at 100; these are browser responsiveness constraints, not physical limits. Defaults and all authored operating presets pass. Full simulations are validated only after those cheap bounds pass.
