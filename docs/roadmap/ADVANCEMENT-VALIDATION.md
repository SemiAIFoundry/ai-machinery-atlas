# Engineering and learning expansion — validation record

Working build reviewed on 7 September 2026. The application version remains 1.2.0. This record describes local implementation and validation; it is not a GitHub release or production deployment.

The [implementation map](ADVANCEMENT.md) retains all 30 original commitments. Construction now includes eight engineering experiences, three connected investigations, 14 process routes with 84 authored stages, a reproducible FPGA realization, source-maintenance contracts, instructor materials and the navigation companion. Four additive distributed-output lessons bring the working corpus to 229 lessons, 63 branches and 16 paths. The 239 science cards comprise 233 formal expressions and six explicitly classified prose relationships.

## Coordinated build and automated checks

The final build identity and test totals are recorded in [advancement-validation.json](advancement-validation.json). All **263 tests** pass (249 application/model tests and 14 curation tests), alongside **1,489 science checks** and all **14 instructor scenario contracts**. Readable-entry JavaScript is **273,042 gzip bytes** against the 350,000-byte limit. Source and content hashes identify the checked working tree; a dirty working tree is not described as a tagged release.

`npm test` builds the static site, validates the complete lesson/prerequisite/relationship graph and canonical mathematics, executes the numerical and state-contract suites, and checks curation and instructor contracts. The teaching checks also exercise a deliberately isolated qualifier-change/supersession/recheck fixture. That fixture creates no real review events.

The hardware example retains an actual Yosys SAT proof, exhaustive 256-case RTL simulation and independent 256-case mapped-netlist simulation, nextpnr placement/routing/timing outputs and an IceStorm bitstream. Browser evaluation uses the exported LUT truth tables and simultaneous register updates. It is a scoped HX1K FPGA artifact with automatically assigned IO; measured board behavior and ASIC signoff are outside its evidence.

The instructor pack verifies 14 complete scenarios against their declared model versions. A separate hand calculation checks retained work, interrupted checkpoint commits and energy accounting. Source-use checks record their actor, locator and exclusions. Human specialist review is not inferred from these checks.

## Actual browser tasks

Observed using the Codex in-app browser on the macOS host. These are desktop and responsive-browser observations, not physical phone observations.

| Task | Observed result |
| --- | --- |
| Fabrication and spatial inspection | Identified specimen, material transforms and uncertainty-based inspection exposed; enlarged optional 3D framing shows the material structure. |
| Memory bank state | Opening a row on stack 0 does not warm stack 1; returning to stack 0 produces a hit. A 12-die construction changes the displayed geometry and stack budget. |
| Exact architecture execution | Systolic steps show partial sums and the completed product `[[19,22],[43,50]]`; scheme-specific controls reflect the selected organization. |
| Routed hardware | `15 + 15` produces `30 / 11110` after pipeline fill. Selecting `b_sampled_SB_DFF_Q_DFFLC` survives a page reload. |
| Hall operation | Withholding operating readiness yields zero useful work. The 150-second fault scenario displays 614 retained steps and about 138.883 lost work equivalents. |
| Evaluated applications | The full-feature sensor case scores 6/6; temperature-only scores 4/6. A retrieved answer can be supported by its passage yet answer the wrong entity; support and task correctness remain separate. |
| Orbital budgets | The declared baseline retains 428 complete products and delivers 336. Slower contacts and a smaller buffer expose waiting and a failed delivery target. |
| Dated progress evidence | Conditional compute/memory indices retain their assumptions. The first capacity case exposes its 7 September source-check date, 90-day review interval and concrete update triggers. |
| Engineering record import | A valid local JSON record restores operands 15/15 and the filled result 30. An out-of-range operand is rejected while current inputs remain intact. |
| Recovery and export | Restoring the previous workspace recovers operand 1. The downloaded JSON passes the current record validator and preserves the selected placed cell. |
| Older content editions | After the content update, the older-record export is offered. New inputs save successfully, the exported older text retains its earlier operand and selected cell, and recovery remains available after reload. The 24 record tests also verify exact raw preservation and backup-failure behavior. |
| Narrow delivery | All eight fully loaded experiences fit a 320×800 viewport: page width 320 px, dialog client/scroll width 303/303 px. Wide tables scroll inside their own regions. Separate 390 px inspection covers the native destination selector, readable controls and mathematics. |
| Keyboard lesson handoff | Enter on a capacity lesson link opens the intended lesson, closes the dialog and focuses `lesson-heading`; browser Back restores the prior engineering destination. |
| Navigation companion | Native keyboard playback works; seeking to 25 seconds preserves pause, and seeking to 48 seconds during playback preserves play. Captions are visible. The phone page has no horizontal overflow. |

The new speculative-decoding Science panel rendered two MathML equations without KaTeX errors; at a 390 px viewport its page/client width was 375/375 px, with the formula in its labeled local scroll region and accessible symbol/text disclosures.

An earlier page attempted to load a removed comparison chunk while the local output directory was rebuilt. Its optional-resource boundary preserved reading, and reloading loaded the current comparison successfully. This was a local rebuild observation, not a production-host test.

The browser exported an actual JSON file; its contents, rather than an automation download notification, were used to validate export. Numerical fixtures exercise malformed records, storage failures, stale imports and recovery boundaries beyond the specific browser tasks above.

## Companion and portable artifacts

The navigation companion is an edited sequence of 18 actual interface captures with reading pauses and an original instrumental score. It is not an uninterrupted screen recording. The [media report](../engineering/WALKTHROUGH-VALIDATION.md) records a clean full decode: 60 seconds, 1,800 frames, 1920×1080 H.264 at 30 fps and stereo AAC. The [reproduction kit](../../examples/walkthrough/README.md) preserves the selected screenshots, capture identity, timeline, original score and licensed font. Portable reproduction was completed independently.

The video SHA-256 is `cb42920629f412a848cac1f27cee7faca2fec630760cbac73969fffcb00ea098`. Its capture identity is intentionally preserved in `public/walkthrough/capture.json`. The capture preceded the final four lesson additions, recovery action and progress metadata correction; these are not retroactively represented as captured. The eight depicted mechanisms remain the same. At capture time the progress metadata label still read `progress-evidence-1`; the final build corrects that label to the already implemented `progress-evidence-2` contract.

The standalone page includes eight chapter links, caption and chapter tracks, a descriptive HTML/plain-text transcript and direct lesson links. Video seeking was verified using the project's Vite preview server, which supplies byte-range responses. A minimal Python HTTP server without range support did not seek correctly; the hosting instructions now make that requirement explicit.

The instructor and hardware ZIP packs include current notices and per-file SHA-256 manifests. Independent standard ZIP decoding verified every entry, license equality and the absence of native simulator executables. The packaged source was also built and passed the full suite in an isolated temporary directory using the existing installed dependencies. Its source and content hashes exactly match the reviewed working tree. This was not a fresh network install. Generated cloud-sync duplicates are excluded from the packaged site.

The full source remains necessary to run the instructor model verifier; the teaching worksheets and worked answers are readable without it.

## Remaining observations

The user will coordinate physical iOS/Android access and 6–9 learner sessions using the [review kit](../learning-review/README.md). Those observations, a human specialist review and assistive-technology checks have not been manufactured or substituted with responsive screenshots. This round does not claim a new forced-WebGL-failure test, physical fabrication accuracy, measured hardware speed, classroom efficacy or public-host verification.

GitHub push, tagging, release creation and production deployment remain paused while the completed build is reviewed. No new release number has been applied.
