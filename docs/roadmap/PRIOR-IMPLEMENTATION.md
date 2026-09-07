# Implementation record

Started 6 September 2026. Full scope is additive; no previous coverage removed.

## Implemented in the current working edition

- Plan and backlog: updated for explicit cumulative authorization, including the additive CRG computation-to-realization module.
- Baseline compatibility: all 97 original lessons, 26 original branches, five original journeys, seven original labs, and 41 original milestones remain in the merged curriculum.
- Deep content packs: fabrication/packaging/HBM (44 lessons), processing architectures and custom silicon (32), infrastructure/orbital systems (30), and CRG (7) are integrated with the baseline for 210 lessons and 57 branches.
- Shared schema and navigation: typed content adapters, nested bands/chapters, prerequisites and relationships, versioned fragment state, process playback, connection views, architecture comparison, global map, and source-dated evidence cards.
- Science and labs: formal KaTeX/MathML equations with notation/assumptions; 14 additional quantitative labs; deep-math invariants; capacity/ramp, HBM, dataflow, reliability, orbital and custom-silicon models.
- CRG: seven-boundary interactive bridge, chip-design process route, source-labeled approximately 55-year claim, communication-edge equations, and verification loop from simulation to workload evidence.
- Runtime and accessibility: constrained-graphics text paths, keyboard/list equivalents, pause controls, local assets, and root/subdirectory-compatible static build.

## Verified

- `npm test` passes: TypeScript, Vite production build, curriculum/reference checks, 13 deep-math tests, 4 portable-build tests, license checks, and film asset parsing.
- Browser QA on the served preview covers formal attention and CRG equations, CRG Learn/Process views, expanded capacity/lab workbench, global infrastructure map, architecture comparison, search, process controls, and zero console warnings/errors in the exercised paths.
- The build retains KaTeX assets locally and emits a Vite chunk-size warning for the 1.78 MB initial JavaScript bundle; this is recorded for the next performance pass rather than hidden.

## Remaining release work

- Copy the verified static build into the SemiAIFoundry Sites source, run its release checks, and deploy the updated `/ai-atlas/` path.
- Create the reviewed source/static archive set and checksums for the additive working edition without altering the fixed v1.0.0 tag.
- Commit and push the portable source as `SemiAIFoundry`; use the authenticated deploy flow only after local artifacts and site checks pass.
- Refresh the walkthrough/navigation chapter map to include the CRG and comparison routes; the existing v1.0.0 film remains linked directly.
