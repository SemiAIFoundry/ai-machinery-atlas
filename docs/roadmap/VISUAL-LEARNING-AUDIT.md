# Visual and learning audit

Audit date: 7 September 2026. Source: `the reviewed atlas checkout`, commit `227647a4ef22c73d3593936e93f7ecd7b109c770` (v1.2.0).

The Atlas has substantial explanatory content and several useful causal numerical models. Its main limitation is that most of the visual experience operates independently of those explanations and calculations. The next release should make existing lessons demonstrable through a few complete scientific experiences before adding more schematic families or lesson rows. Shared geometry is valuable when it represents shared structure; it becomes a teaching problem when unlike mechanisms receive the same visual state or a named process step has no corresponding transformation.

This is a source and model-execution audit, not a learner study. I read the renderer, scene generators, routes, equations, navigation, learning paths, CRG bridge, numerical workbenches and tests. I ran read-only geometry probes and the existing deeper math tests. I did not operate a browser, edit application files, deploy, or independently revalidate the external scientific sources. A separate root-agent browser observation is explicitly identified below. Claims about probable reader confusion are design hypotheses requiring formative review, not measured learning outcomes.

## What already works

- **Distinct explanatory primitives exist.** The original scenes include a diamond-cubic lattice, planar/FinFET/GAA alternatives, an exploded package, DRAM layers/TSVs, a leaf–spine network and attention-like structure. They are not all the same chip model. See [scene-models.ts](../../src/lib/scene-models.ts), especially lines 21–39, 51–58 and 67–82. Selection, isolation, exploded placement and translucent materials offer usable anatomy inspection.
- **Route text has a useful scientific contract.** Each process step declares input, action, output, measurement and downstream reason, with an identified reference route and source. The copper route explicitly distinguishes after-develop resist, after-etch trench and planarized wiring. HBM routes distinguish TC-NCF, mass reflow then molded underfill, and hybrid surface preparation. See [processes.ts](../../src/lib/processes.ts), [memory-processes.ts](../../src/lib/memory-processes.ts), and [ProcessControls](../../src/components/atlas-exploration.tsx).
- **The newer 2D numerical views encode real state.** Adding HBM layers changes capacity, physical-height budget, conditional survival and a distributed temperature ladder while leaving bus bandwidth independent of die count. Memory-placement bars conserve weights/KV across permitted tiers; the decode timeline shares a wall-clock axis and changes with overlap, memory service and collectives. These are strong foundations for the desired engineering experience, even though they are bounded synthetic models. See [numeric-math.ts](../../src/lib/numeric-math.ts) and [numeric-workbench.tsx](../../src/components/numeric-workbench.tsx).
- **Progressive reading and access foundations exist.** Learn/Science/Specs/Connections separate purposes; lessons expose prerequisites, learning objectives and worked examples where authored. Equations use KaTeX HTML plus MathML, a text alternative and optional symbol/unit definitions. Phones activate 3D explicitly; labels and component controls are HTML buttons; animation respects reduced motion and pause; rendering suspends when hidden/inactive. See [Atlas.tsx](../../src/Atlas.tsx), [Equation](../../src/components/equation.tsx), and [atlas-scene.tsx](../../src/components/atlas-scene.tsx).

## What the interactions actually encode

| Interaction | Implemented state change | Present learning limit |
|---|---|---|
| Select a lesson/component | Rebuilds the scene using chapter scene family plus selected ID; highlights a group and changes the field guide | Selection often means the whole shared diagram, rather than an independently meaningful subpart or conserved specimen |
| Explode | Each group moves from its fixed base position along a fixed spread vector | Shows separation; it does not encode a manufacturing transformation or physical displacement model |
| Isolate | Hides groups whose ID differs from the selected lesson | Deep scenes commonly place nearly all anatomy under one selected-ID group, so isolation retains most of the scene |
| Translucent cutaway | Reduces material opacity | It is an X-ray-like rendering mode, not a geometric cutting plane or locally selected section |
| Process slider | Sends an integer 0–5 into per-mesh visibility intervals | A minority of families have stage-specific mesh changes; the route itself is not passed to the geometry update |
| Trace | In deep scenes, selects one of four fixed curves and moving dots | Different names/colors/paths exist, but no payload, rate, temperature, current or conservation state drives the effect |
| Lab controls | Recompute local mathematical outputs, bars and/or a 2D stack/timeline | No result flows back into the main 3D scene or across other labs |
| Learning path | Chooses an ordered list of lesson IDs | No persistent bit, wafer feature, tensor, budget or experimental prediction travels with the reader |

The boundary is visible directly in [AtlasScene props](../../src/components/atlas-scene.tsx): the renderer receives scene/selection/display controls, a process-step number and overlay string. It receives no numeric lab model. [Model rebuilding](../../src/components/atlas-scene.tsx) keys on `level:selected` and resets camera fit. The update receives only `signal`, `overlay`, `time` at line 89.

## Measured scene reuse

A read-only Node/Three.js probe built all **127 expansion lessons** from the five content packs. Anatomy signatures compared visible mesh geometry, world transforms, material color/opacity and instance transforms at time zero, ignoring semantic IDs and random UUIDs. These are structural comparisons, not screenshot similarity scores. The **19 assigned deep scene families yield 27 distinct anatomy signatures**. Reuse alone is not a defect; the relevant question is whether a lesson's mechanism is represented.

| Assigned anatomy family | Expansion lessons | Distinct anatomy signatures |
|---|---:|---:|
| Process wafer | 11 | 1 |
| Process tool; fab operations | 4 + 4 | 1 + 1 |
| Device cross-section | 9 | 3 |
| Package route | 10 | 4 |
| HBM detail | 12 | 1 |
| CPU; GPU architecture | 3 + 3 | 1 + 1 |
| Array architecture | 7 | 4 |
| Design flow | 11 | 1 |
| Memory route | 10 | 1 |
| Software flow; model workload | 4 + 7 | 1 + 1 |
| Signal/power | 8 | 1 |
| Rack; capacity; hall; world; orbital | 4 + 4 + 5 + 4 + 7 | 1 each |

The Process view first remaps chapter scenes through [processScene](../../src/Atlas.tsx). Using that exact mapping and comparing visible geometry across steps 0–5 at time zero gives:

| Actual process family | Lessons | Distinct geometric states across six steps |
|---|---:|---:|
| Process wafer | 11 | 6 |
| Device cross-section | 9 | 5 |
| Package route | 18 | 5 |
| HBM detail | 12 | 2 |
| Process tool; fab operations | 4 + 4 | 2 each |
| Hall system; design flow; software flow; orbital system | 25 + 11 + 26 + 7 | 1 each |

Thus **69/127 expansion lessons have no process-step-dependent geometric change**, and **20 more have only two geometric states**. Generic motion can still occur; this count concerns response to the named process steps. The original 97 lessons are excluded from these counts.

## Prioritized findings

### P0 — Bind named processes to their actual transformations

The strongest route text is often paired with the wrong mechanism:

- All 11 `process-wafer` lessons—including crystal growth, oxidation, ALD, film transport and mask/OPC—receive the same single-damascene copper sequence. The geometry shows oxide/resist-like bars, copper fill, a pad and an inspection wire regardless of the selected lesson. [deep-models.ts:20](../../src/lib/deep-models.ts), [routeFor:99](../../src/lib/processes.ts).
- All 12 HBM-detail lessons receive the same eight-layer geometry, fixed TSVs and side controller. Steps 0–2 show one mesh state; steps 3–5 another. TC-NCF film preparation, MR-MUF reflow/molding, and hybrid planarization/clean/contact/anneal have distinct text but no distinct interfacial geometry. Only slab meshes are visibility-gated; die-top tile meshes remain visible throughout, including when their slab is hidden. [deep-models.ts:56](../../src/lib/deep-models.ts).
- Package variants primarily alter two text fields in a shared six-step route. The same `vertical` route combines SoIC/Foveros and describes hybrid or thermocompression bonding. Static package alternatives do differ in full interposer, RDL thickness, embedded bridge and vertical placement, which is worth retaining, but the assembly mechanisms are not equivalently differentiated. [packageVariant](../../src/lib/processes.ts), [package geometry](../../src/lib/deep-models.ts).
- The device family always starts with three horizontal channel sheets; the FinFET special case adds a fin to that shared structure rather than constructing a clean alternative integration route. Step 1 does not change the initial geometry. [deep-models.ts:34](../../src/lib/deep-models.ts).

**Separately observed by the root agent in the browser:** on `#hbm-hybrid-bond-route`, moving Process from “Create bonding surfaces” to “Planarize and measure” changed the step text while retaining the small complete-stack view; no pad topography/CMP interface appeared. This corroborates the source finding for that transition only.

**Acceptance for the next slice:** route ID and step ID select reviewed scene states; each state shows the exact input/transformation/output being described. Provide a visibly persistent specimen, material legend, local dimension/measurement and an honest “text-only process” treatment until a route has an authored visual. Do not count a source URL and six steps as completion of a process visual.

### P0 — Make overlays carry a physical or computational quantity

All deep families add the same four curves from one `overlayPaths` object and move five dots at the same normalized speed. Their names/colors differ, but their endpoints are not derived from selected components, their geometry is not family-specific, and their behavior is unrelated to measured or modeled flow. A heat path on an orbital system, CPU, wafer and memory hierarchy is generated from the same coordinates. [deep-models.ts:89](../../src/lib/deep-models.ts).

For legacy anatomy scenes, `update` is undefined, so the selected Trace value is not applied at all. Existing wire dots remain visible and are driven at one shared animation rate. [scene-models.ts:91](../../src/lib/scene-models.ts), [atlas-scene.tsx:88](../../src/components/atlas-scene.tsx). The UI still offers every trace option and says that power/temperature/production units belong to the system. [Atlas.tsx:63](../../src/Atlas.tsx).

**Acceptance:** each enabled overlay has explicit endpoints, quantity, unit, direction, source/model and legend. A quantitative quantity changes a meaningful visual encoding; an illustrative path is clearly presented as a path, with no suggestion of flux or speed. Only offer applicable traces. Cooling circuits, electrical circuits, information dependencies and material movement need separate semantics.

### P0 — Connect equations, numerical state and scale transitions

Equations are rendered display content keyed by lesson ID and science-card index. Numerical labs have separate React state; the main renderer receives none of it. A lesson can open a lab, but cannot seed it with its selected route, chosen specimen or worked-example values. Only the 14 infrastructure-depth lessons define `labId`; the other 210 lessons open the generic engineering workbench, whose initial mode is capacity. [Atlas.tsx:67](../../src/Atlas.tsx), [lab entry:77](../../src/Atlas.tsx), [DeepWorkbench:31](../../src/components/deep-workbench.tsx).

The central [reference-system.ts](../../src/lib/reference-system.ts) declares package/rack/hall/workload values, but the only runtime consumption found is `logicDies` and `hbmStacks` in the capacity lab. Package, rack, hall, workload and numeric defaults are otherwise independently hard-coded. A selected HBM bonding lesson opens the stack lab at its default TC-NCF preset, even when the lesson is MR-MUF or hybrid.

**Acceptance:** one bounded scenario state owns specimen, workload, quantities and assumptions; the text, equation substitution, 2D result, selected 3D feature and downstream consequence use that state. Preserve it while crossing scales. Do not require every old lesson to adopt a coupled simulation at once; complete the agreed end-to-end reference slice first.

### P1 — Render the intended lesson family, then improve semantic selection

`record.visualFamily` is populated but not used to choose the renderer; `chapter.scene` is authoritative. The expansion inventory contains 11 mismatches. Examples: `hbm-silicon-intensity` is tagged capacity-flow but gets HBM-detail; four CRG records request signal-power/architecture-array/hall-system/model-workload but get design-flow; three training/prefill/MoE placement lessons request model-workload but get memory-route. [RecordEntry](../../src/lib/atlas.ts), [scene selection](../../src/Atlas.tsx).

Even without a mismatch, the `signal-power` family gives the same package anatomy to eye diagrams, rack conversion, coolant-loop separation and facility heat rejection. `memory-route` gives chip economics a register→storage strip. These are code-confirmed mechanism mismatches, not just repetition preferences.

Most deep families start with `group(selected)` and put all parts beneath it. Their labels therefore name the lesson, not each chamber component, CPU queue, flow interface or material. [deep-models.ts:19](../../src/lib/deep-models.ts). Selecting a feature usually navigates and rebuilds rather than retaining a specimen and opening a local section. Camera fit resets, so this is chapter navigation across scales rather than semantic zoom. [atlas-scene.tsx:39](../../src/components/atlas-scene.tsx).

### P1 — Replace generic relationship labels and CRG tabs with a concrete trace

The exported relation type supports `part-of`, `assembled-into`, `executes` and `limited-by`, but generated relationship edges contain only `prerequisite` and `related`. The five production/system lanes are fixed arrays; the current-node card shows at most 16 adjacent edges. No edge carries a physical budget or causes a downstream state change. [atlas.ts:12](../../src/lib/atlas.ts), [DependencyView](../../src/components/atlas-exploration.tsx).

The CRG bridge is seven useful boundary definitions with tab-like text switching. It has no input computation, invariant value, payload/rate/latency/energy/error record, chip artifact or observation to carry through the seven boundaries. It receives no selected lesson or scenario state and initially selects Architecture in every CRG lesson. [crg-bridge.tsx](../../src/components/crg-bridge.tsx). Its research source labeling is a strength. Its present interaction demonstrates the framework's vocabulary, not computation-to-realization traceability.

### P1 — Make learning progress measure a prediction and explanation

Paths are lesson-ID lists; `select()` resets process step, overlay and reading tab, while a detour does not reconcile the stored path index. The path banner can therefore continue showing a step position while a prerequisite/related lesson is selected. URL state retains lesson/view/step/path but not a scenario or lab values. [Atlas.tsx:39](../../src/Atlas.tsx), [journeys](../../src/lib/atlas.ts).

Several checks pose useful causal distinctions—for example unchanged external bandwidth after adding HBM layers, or local topography after a global thickness pass. However, after any answer the correct option is immediately highlighted; the learner can click it to count as checked. There is no prediction-before-control task, explanation capture or transfer problem linked to lab state. All 32 architecture-pack and all 14 infrastructure-depth answers occupy option A; all seven CRG answers occupy option B. This makes “concepts checked” particularly weak as mastery evidence. The code labels it checked/explored, which is preferable to a mastery claim. [answer handling](../../src/Atlas.tsx), [check rendering](../../src/Atlas.tsx).

A 14-entry global glossary exists, but there is no automatic inline acronym or unit help. Beginner material, worked engineering examples and prerequisites are displayed together in `LessonDepth`; selecting a depth level is not implemented. [LessonDepth/Glossary](../../src/components/atlas-exploration.tsx). This may overload beginners; that is a hypothesis for review, not a finding about actual learners.

### P1 — Preserve the learning task without WebGL, not only the prose

Keyboard component buttons, process sliders/buttons, MathML/text equations, paused/reduced motion, explicit phone activation and HTML numeric results are real strengths. They need task-level review:

- The WebGL fallback retains lesson prose and labs but no equivalent anatomy/cross-section diagram. Where inspection is the task, “the complete lesson remains available” does not make the inspection available. [atlas-scene.tsx:20](../../src/components/atlas-scene.tsx).
- The main scene provides orbit instructions and labels, but no structured material/scale legend, specimen state description, or measured local section. Scale notes exist as prose, not an axis or calibrated scale bar.
- Process text changes are not in an `aria-live` region; current-step buttons identify the step, but screen-reader announcement of the changed input/output/action needs testing. By contrast, newer numeric results and the CRG description use live/status regions. [ProcessControls](../../src/components/atlas-exploration.tsx).
- Process mode suppresses model labels and the anatomy component selector. The process's “Study” button navigates to another lesson and resets the step, rather than opening a contextual explanation. [Atlas.tsx:61](../../src/Atlas.tsx).

This audit did not test screen readers, keyboard paths, touch ergonomics, visual contrast or real-device performance. Do not interpret source-level support as passing those gates.

## Numerical causality: strongest examples and limits

The existing command `node --experimental-strip-types --test scripts/deep-math.test.mjs scripts/numeric-math.test.mjs` passed **27/27 tests** on Node 24.14.0. These tests support arithmetic invariants and edge behavior; they do not validate a real fabrication process, clinical-quality learning outcome, or real-hardware accuracy.

| Model/view | Meaningful causal connection | Missing depth or coupling |
|---|---|---|
| HBM construction | Die count increases capacity, height, power, temperature path and cumulative survival loss; bus bandwidth stays tied to pins/rate/efficiency. Buttons show computed layer temperatures. | Route presets only change synthetic gap and interface resistance; no warpage, bond formation or topology. The app clearly labels these as invented inputs and not measured route rankings. Main 3D remains eight layers. [math:15](../../src/lib/numeric-math.ts), [UI:30](../../src/components/numeric-workbench.tsx) |
| Inference placement | Byte conservation, KV-versus-weight priority, read-only HBF, SRAM fit and staging requirements drive feasibility; latency waves do not multiply bandwidth. | Dense decoder read-pass model only. It does not implement training writes, prefill or MoE routing despite being the linked lab for those lessons. State is not passed to token or hall calculations. [math:49](../../src/lib/numeric-math.ts), [limits:79](../../src/components/numeric-workbench.tsx) |
| Token critical path | Compute/memory overlap uses max versus sum; collectives serialize; HBM/package is one minimum-bandwidth path; energy integrates baseline once and active increments separately. | One resident dense decode step; lacks prefill, offload, expert routing, queueing, faults and temperature coupling. Good 2D temporal encoding is local to the lab. [math:74](../../src/lib/numeric-math.ts), [timeline:94](../../src/components/numeric-workbench.tsx) |
| Capacity and ramp | Divides component rates by BOM counts, identifies the minimum stream, applies assembly yield, gates output until qualification and conserves inventory/backlog. | One combined equivalent supply constraint and scalar ramp; no repeated visits, shared tool states, stage-specific inventory or power-limited commissioning in the same scenario. [deep-math:16](../../src/lib/deep-math.ts) |
| Patterning and CMP | NA changes resolution and depth-of-focus with different exponents; CMP exposes nominal/slow/fast residual thickness and overpolish. | No focus/exposure feasible-region lab; no spatial topography, pattern density, selectivity, dishing/erosion or measured bond readiness. These omissions are stated by the UI. [deep-math:11](../../src/lib/deep-math.ts), [deep-workbench:14](../../src/components/deep-workbench.tsx) |
| Matrix/attention/dataflow | Row/column selection exposes a real dot product; softmax weights change with mask/temperature; tiling reduces modeled bytes at constant FLOPs. | The same small computation is not scheduled through scalar/vector, SIMT and systolic machines. The comparison UI holds prose cards, no common execution trace. [lab:20](../../src/components/lab.tsx), [specimen comparison](../../src/components/specimen-comparison.tsx) |
| Orbital budget | Net radiative flux can become nonpositive; payload drives solar/radiator/storage requirements; contacts bound daily data. | Separate algebraic budgets presented together; no radiation/redundancy/replacement model, geometry feedback or coupled mission/workload feasibility search. The UI states these additional requirements. [deep-math:23](../../src/lib/deep-math.ts) |

## Prior-plan contract assessment

| Approved contract | Assessment from this audit |
|---|---|
| Named process playback and material transformations | Partial: substantive routes, sparse/shared geometry; HBM route mismatch is a priority |
| Coupled cross-sections and persistent selection across scale | Not implemented as an integrated experience; lesson selection/rebuilding substitutes for it |
| Different integration geometry and process order | Partial static geometry; many route steps share templated text/state |
| Distinct, dimensioned flow overlays | Named overlays exist; semantic/quantitative contracts are missing |
| Constraint propagation | Implemented within several labs; absent across scene/lab/package/rack/hall journey |
| Simulated failure and informative inspection | Conceptual prose/checks exist; no inspected defect state or competing-mechanism experiment in the audited scene code |
| Semantic zoom and abstraction transitions | Scale prose and discrete chapter navigation exist; camera rebuild/fit is not semantic zoom |
| Accessible equivalents of the learning task | Strong controls/prose/numeric foundations; full visual-task equivalence and assistive-technology behavior unverified |
| One coherent reference system | Declared centrally; very little consumption, no end-to-end shared scenario |
| Predict, explain and transfer | Static checks and exploration tracking exist; no linked prediction/transfer assessment |

These judgments map to [plan visual interactions](PRIOR-EXPANSION-PLAN.md), [planned labs](PRIOR-EXPANSION-PLAN.md), [integrated slice gate](PRIOR-EXPANSION-PLAN.md) and [learning/reference/visual contracts](PRIOR-EXPANSION-PLAN.md). The plan explicitly says a recorded click-through is not learning evidence. The automated geometry check currently asserts a nonempty selectable group and finite bounds, not a scientifically appropriate mechanism or distinct state: [validate-atlas.mjs:17](../../scripts/validate-atlas.mjs).

## Three concrete exemplar experiences

### 1. From a local copper surface to a working memory package

**Question:** Why can a surface that passes average-thickness control still fail to make a useful package?

Keep one marked die site on a wafer and one selected bond interface through local section, die, stack and package views. Start with a bounded spatial topography example that contains a local recess/particle and an explicit measurement resolution. Scrub patterned surface → planarization → measurement → cleaning/handling → contact → anneal → electrical test. Only claim what the chosen reference route supports. Use distinct geometry and order for TC-NCF, MR-MUF and hybrid alternatives; comparisons retain the same stack/BOM constraints while exposing route-specific unknowns.

Couple local inputs to illustrative contact/continuity outcomes with disclosed toy coefficients, then feed conditional assembly survival into the already working package-capacity model. Let the learner choose local profilometry, particle inspection or electrical continuity evidence and explain what each can and cannot distinguish. The same scalar outputs drive a 2D section and optional 3D shell; units and material legend remain visible.

**Demonstrable result:** a learner predicts that an unchanged average can hide local failure, chooses relevant evidence, then explains how better bonding yield may cease to increase output when HBM supply becomes limiting. Gate release on reviewed process states, unit/conservation checks and a short unfamiliar-case transfer exercise.

### 2. Carry one matrix tile from meaning to execution

**Question:** How can the same answer require different movement, waiting and energy on different machines?

Reuse the existing small matrix product as a persistent specimen. Select one output element, display its exact row/column dependencies, then run the same task through a simple scalar/vector schedule, a SIMT lane schedule and a systolic schedule. Show operand identity, registers/local storage, load/store events, partial sums and idle/dependent work. A step changes numbers and ownership, not merely camera position or moving particles. State toy machine assumptions openly; this is an architecture mechanism comparison, not a product benchmark.

Allow tile size, available local memory and a branch/data-dependency pattern to change. Keep the mathematical output invariant while recalculating traffic and schedule. Connect graph → layout/kernel → runtime dispatch → local arithmetic to the existing dataflow and token timeline models, with explicit abstraction transitions. Give the CRG bridge a real trace: required result, encoding/precision, payload per edge, resource bound, build assumptions and verification result.

**Demonstrable result:** a learner identifies an unchanged answer with reduced external traffic, predicts which machine/resource waits, and explains a counterexample where more arithmetic capacity does not shorten time. A text event ledger and 2D schedule expose the complete task without animation or WebGL.

### 3. One useful decode workload, constrained from memory to hall

**Question:** If memory capacity or supply improves, when does useful delivered work actually improve?

Start from one dimensioned dense workload and the central illustrative package/rack/hall BOM. Use the existing placement, token and capacity/ramp models as separate validated components of a shared scenario. Display a consistent ledger: weights/KV/workspace; packages and stacks; bytes per step; HBM/package/network time; power-supported racks; qualified/commissioned units; accepted output at a fixed quality/latency boundary. Preserve that ledger while zooming from selected memory allocation to package to rack to hall.

Let the learner add HBM layers, change resident capacity or move cold weights to a conditional read tier, then observe whether capacity, bandwidth, communication, thermal budget, package supply or readiness binds. Distinguish *memory fits*, *time is acceptable*, *hardware can be supplied*, and *capacity is commissioned*. Add one explicitly bounded checkpoint/interruption scenario for retained work; do not multiply unrelated availability ratios into a fleet claim. Use the same workload for an optional orbital budget comparison, with unclosed requirements visible.

**Demonstrable result:** the learner predicts a bottleneck change, explains why nominal chips or memory bytes are insufficient, and transfers the reasoning to a changed batch/context or supply constraint. This directly exercises the original first-slice criterion without depending on a new content catalog.

## Audit boundary and next validation

The central conclusion is supported by source wiring, executed model probes, numerical invariants and one separately reported browser transition. This audit does not prove that readers learn little, that all reused scenes should be removed, or that any simulation is physically predictive. Preserve the useful reading content, distinct existing anatomy and causal 2D labs. Validate the next complete experience through scientific review of actual state transitions, task-equivalent keyboard/text views, and documented beginner/engineering formative sessions that ask learners to predict, explain and transfer.
