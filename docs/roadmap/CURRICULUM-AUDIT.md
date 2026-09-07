# AI Machinery Atlas: curriculum and scientific-content assessment

Audit date: 7 September 2026. Read-only baseline: `the reviewed atlas checkout`, commit `227647a4ef22c73d3593936e93f7ecd7b109c770`, package version 1.2.0. No product source, deployment, or Sites changes were made.

## Judgment

The atlas is a substantial, coherent introductory engineering reference with a particularly useful manufacturing → memory → useful-work thread. It is not yet a demonstrated mastery-oriented learning platform. Its strongest content separates physical quantities, product scopes, conditional assumptions, and acceptance evidence. Its weakest transition is from knowing the names and relationships to being able to derive, predict, measure, diagnose, and defend a result without the explanation already in view.

The next phase should consolidate the learning and evidence contracts across existing content before another broad increase in lesson count. Three findings merit immediate correction: the equation adapter silently changes three sampled radical expressions, dozens of descriptions expose visual authoring instructions, and expansion chapter band numbers place major subject families under misleading top-level labels.

## Method and limitations

The diagnostic loads the actual `atlas.ts` composition through TypeScript transpilation, including all five content packs and the 53 legacy enrichments. It does not count the JSON files as isolated curricula or assume documentation is current. Counts are nonempty field counts. Content volume uses a documented lexical word counter; it measures authoring volume, never mastery.

The full inventory and schema were inspected; a deliberate 22-lesson sample was read across atomic/device foundations, logic/arithmetic, fabrication, packaging/memory, architectures/software, learning/evaluation, infrastructure/orbital, and CRG. This is a stratified editorial sample, not a random statistical sample or an independent scientific peer review. All 224 lesson descriptions were searched and manually reviewed for explicit visual authoring directions. All 229 science-card display inputs were passed through the exact current equation adapter and KaTeX settings; all eight source expressions containing a radical were then inspected for preserved grouping.

Source links and metadata are counted, not presumed to be correct support. No live URL availability, current vendor specification, or scientific source refresh was performed in this sub-audit. Sources linked from lessons include primary research, official manuals and courses, as well as broad vendor pages and publication directories. The presence of a link does not establish that every sentence or numerical specification is supported by it. Root's runtime/platform assessment supplies separate live-UI findings.

Reproduce from the repository with:

```sh
node curriculum-metrics.mjs
node equation-audit.mjs
```

## Reproducible inventory

| Measure | Current count and denominator |
|---|---:|
| Merged lessons / chapters / journeys | 224 / 62 / 15 |
| Original retained lessons | 97 of 97 |
| Historical milestone entries | 76; entries, not deduplicated scientific discoveries |
| Descriptions, mechanism lists, science cards, checks, source lists present | 224 of 224 lessons for each field |
| Mechanism steps | 926 across 224 lessons |
| Science cards | 229 across 224 lessons; most lessons have exactly one |
| Description length | Median 100 words; range 65–126; mean 100.4 |
| Learning objective, engineering example, evidence note | Each present in 180 of 224 lessons; absent in the same 44 legacy lessons |
| Nonempty prerequisite lists | 127 of 224; all 127 additions, none of the 97 legacy lessons |
| Relationship edges | 1,095 directed entries: 851 `related`, 244 `prerequisite`; not 1,095 independent causal relationships |
| Lesson source links | 460 instances, 268 distinct URLs |
| Structured source ledger | 122 source records, 116 distinct URLs; all 122 have publisher, publication descriptor, checked date, locator, scope |
| Structured claims | 39 claims, linked to 34 of 224 lessons |
| Claim status | 22 reported, 8 research, 6 announced, 2 forecast, 1 unresolved |
| Claim completeness | All 39 have source ID, period, scope, limitations, checked date; 22 have nonempty values, all 22 a denominator, 21 a separate unit field |
| Authored equation definitions with symbol/unit tables | 19 of 229 science cards, all in the latest 14 lessons |
| Formal mathematical rendering | 199 of 229 render in KaTeX; 30 fall back to their original equation text |
| Direct lesson-to-numerical-lab ID | 14 of 224 lessons; other lessons can still open the general lab workbench |
| Checks | 224 single questions, each with exactly 3 options |
| Inline history | 37 of 224 lessons; absence does not imply no global milestone link |

The 22 nonempty claim values include textual ranges, so this is not a count of machine-readable numeric scalars. The one populated value without a separate unit is the HBF card, which combines GB and TB/s in its value string. That is a schema-normalization issue, not missing human-readable units.

A conservative lexical scan finds 108 specification cards containing a digit, distributed over 58 lessons. Only 5 of those 58 lessons have *any* structured claim link. This heuristic includes version/designation numbers and is not a definitive count of unsupported numeric claims. It does demonstrate that the Evidence library is not a comprehensive claim-level provenance index for the Specs tab. All 97 legacy lessons have zero structured-claim links, despite their 199 source-link instances.

### Actual content packs

| Pack | Lessons | Science cards | Objective/example/evidence-note coverage | Prerequisite coverage | Authored equation cards |
|---|---:|---:|---:|---:|---:|
| Original, after enrichment | 97 | 97 | 53/97 | 0/97 | 0 |
| Fabrication, packaging, original HBM depth | 44 | 44 | 44/44 | 44/44 | 0 |
| Architectures and custom silicon | 32 | 32 | 32/32 | 32/32 | 0 |
| Infrastructure and orbital systems | 30 | 30 | 30/30 | 30/30 | 0 |
| CRG | 7 | 7 | 7/7 | 7/7 | 0 |
| Latest memory/infrastructure depth | 14 | 19 | 14/14 | 14/14 | 19 |

`equations-original.json` and `equations-expansion.json` are empty objects. This means their 210 science cards use compatibility conversion; it does **not** mean all 210 are plain text or lack equations. Of those 210, 180 currently render formally and 30 fall back. All 19 authored definitions render.

### Domain depth and taxonomy caution

Current *navigation* bands contain 33 matter/fabrication, 42 circuits/architecture, 67 packaging/machines, 20 connected-infrastructure, 36 executable-software, and 26 learning/intelligence lessons. These are valid UI bucket counts, but misleading subject-coverage measures:

- `architecture.json:5` assigns CPU control to band 2, which `atlas.ts:18` names Packaging & machines. GPU execution, dataflow machines, offload, design and memory economics share this assignment.
- `architecture.json:110` assigns Graph to executable operation to band 5, Learning & intelligence.
- `infrastructure.json:41`, `:59`, `:94`, `:112`, `:130` assign physical power/heat, commissioning, global resources and orbital modules to band 4, Executable software.

Use named domains and stable domain IDs, not unexplained integer positions, when normalizing the curriculum. Some chapters span domains legitimately; their primary placement still needs a deliberate pedagogical rationale.

Workstream counts better reveal the *new* material's center of gravity: W01 materials 4; W02 unit operations 11; W03 integration 7; W04 manufacturing control 6; W05 packaging 14; W06 HBM 8; W07 architectures 14; W08 custom silicon 5; W09 chip-to-hall 21; W10 geography/resources 4; W11 model-machine co-design 19; W12 orbital 7; CRG 7. These sum to 127 additions and exclude 97 legacy lessons. They measure coverage allocation, not validated depth.

## Stratified reading: strengths, limitations, and representative evidence

All paths below are relative to the pinned repository; links use absolute paths for review.

| Lesson and source | Assessment |
|---|---|
| [Silicon atom](../../src/lib/data/records.json) | Useful explicit rejection of planetary-orbit and atom-is-bit misconceptions. Science is charge bookkeeping, not a mechanism for bond formation or bands. Good entry; insufficient by itself as first-principles solid-state explanation. |
| [Energy bands](../../src/lib/data/records.json) | Correctly distinguishes energy axes, holes, state occupancy and nondegenerate equilibrium assumptions. It introduces effective densities of states without a prerequisite bridge; displayed radical grouping is currently corrupted. |
| [MOSFET](../../src/lib/data/records.json) | Strong distinction between continuous current and chosen digital voltage ranges; explicitly bounds long-channel current law. The check only identifies the gate field; it does not test the operating regime or a bias prediction. |
| [Inverter](../../src/lib/data/records.json) | Connects pMOS/nMOS, load charging and switching power. Missing explicit objective/example/prerequisites; no learner task using a transfer curve, valid voltage levels or noise margin. |
| [MAC](../../src/lib/data/records.json) | Good dot-product and finite-precision/FMA distinction. No computed dot product/rounding comparison or link to arithmetic prerequisites; example field is absent. |
| [Etch transfer](../../src/lib/data/fabrication.json) | Good input/mask/stop state separation, selectivity-versus-profile distinction, and 200 nm/10 = 20 nm mask budget with omitted effects stated. Deeper chemistry, transport and loading are named, not modeled. |
| [Metrology/process window](../../src/lib/data/fabrication.json) | Particularly strong measurement-versus-process variance example, finite uncertainty, matched follow-up, and bias caveat. Natural anchor for a real synthetic wafer-map diagnosis exercise. |
| [Hybrid bonding](../../src/lib/data/fabrication.json) | Strong process order and 64% geometric overlap ≠ 64% bonding yield distinction. Electrical continuity, voids and reliability remain evidence to collect, correctly separated from geometric area. |
| [HBM heat and yield](../../src/lib/data/infrastructure-depth.json) | Among strongest content: cross-heating, conditional screened-input yield, interface versus bump probabilities, common-cause caveat; two science cards and formal notation. |
| [HBF read-tier contract](../../src/lib/data/infrastructure-depth.json) | Clear announcement-versus-measurement boundary; capacity/read bandwidth do not imply DRAM latency or write semantics. Numeric bulk-transfer example is labeled synthetic. Current announcement itself was not reverified here. |
| [CPU out-of-order](../../src/lib/data/architecture.json) | Concrete dependency versus independent-operation example and constrained latency bound. A runnable ready/issue/retire trace would turn the description into demonstrated execution understanding. |
| [RTL verification](../../src/lib/data/architecture.json) | Correctly separates coverage from proof and defines a useful FIFO backpressure/reset task. It describes the property rather than requiring the learner to inspect or repair a failing trace. |
| [Tensor IR](../../src/lib/data/architecture.json) | Explicit XW+b/ReLU graph, dimensions and bytes; strong logical-versus-physical boundary. Needs the same data carried through generated layout and execution, rather than a fresh example at each page. |
| [Kernel fusion](../../src/lib/data/architecture.json) | Good 4 MB avoided write/read example and register-spill qualification. Strong seed for measured-versus-modeled trace comparison. |
| [Attention](../../src/lib/data/records.json) | Equations explain row mixing, mask and √d scaling assumptions. The actual check contrasts values with clocks/power, far below the mathematical content. No worked Q/K/V row or prerequisite vector/probability chain. |
| [Loss/optimizer](../../src/lib/data/records.json) | Clearly distinguishes backpropagation and update state; Adam equations and caveats are meaningful. Only 67 description words bridge loss→chain rule→gradients→Adam; objective, example, prerequisites absent and equation falls back. |
| [Evaluation](../../src/lib/data/records.json) | Strong scope, task-distribution and binomial approximation limitations; rightly does not equate one benchmark with AGI. The check recognizes scope rather than interpreting an interval or a biased comparison. |
| [CRG 55-year claim](../../src/lib/data/crg.json) | Organization-authored claim and open qualification are explicit. Its “claim ≠ evidence ≠ qualification” science card is an epistemic distinction, not a physical law or independently validated research result; science-card totals must not be read as 229 scientific derivations. |
| [Signal eye](../../src/lib/data/infrastructure.json) | Strong analog basis of digital links, symbol/bit distinction and 100 ps UI example. No acquired waveform, channel response or BER-confidence exercise yet. |
| [Coolant loops](../../src/lib/data/infrastructure.json) | Clear heat capture, separate loops, residual air heat and circulation-versus-consumption; mass-flow worked arithmetic. Natural junction between energy conservation and facility constraints. |
| [Orbital radiator](../../src/lib/data/infrastructure.json) | Bounded radiation balance and 1 MW ideal-area example explicitly account for environmental heat and views. This is a serious introductory bound, not a claim of spacecraft design closure. |
| [Memory qualification](../../src/lib/data/infrastructure-depth.json) | Excellent end-to-end distinction between component test, integration, commissioning and retained useful work. This should close a shared learner capstone with explicit accepted-result criteria. |

## Specific release-quality findings

### The math adapter can produce a valid rendering of a different equation

The implementation attempts a regex-only radical conversion at [equation.tsx:26](../../src/components/equation.tsx), then globally turns `]` into `\right]` at line 28. The exact production options were reproduced, including strict errors and the text fallback.

- [Energy bands, source line 237](../../src/lib/data/records.json): `√(N_C N_V)` becomes `\sqrt{N_{C}} N_{V})`. Only N_C remains under the radical. KaTeX accepts this string.
- [Contact, source line 1272](../../src/lib/data/records.json): `√(ρ_c / R_sheet)` becomes an empty `\sqrt{}` followed by the operand outside the radical. KaTeX accepts it.
- [Normalization, source line 7762](../../src/lib/data/records.json): `√(σ²+ε)` suffers the same empty-radical transformation and still renders.

Root's independent live Chrome review of the Energy bands Science tab confirmed the first radical error after the math font had settled. The coordinating review also observed two floating horizontal slabs without an energy axis in the main visual, while the prose correctly says the gap is an energy difference. That is a separate representation-risk finding: correct text does not alone establish a faithful visual.

Attention's simple `√dₖ` and diffusion's `√(2Dt)` convert correctly. These three confirmed semantic defects arise among all eight radical-bearing source expressions; this is not a claim that every automatically rendered equation is wrong. Thirty other cards fall back to readable source text: 22 baseline, 5 fabrication, 1 architecture, 2 infrastructure. Their causes include unmatched `\right]`, duplicate subscripts and unsupported Unicode. Falling back is safer than inventing math, but it is invisible to release validation because the component catches rendering errors. Parse success alone is not sufficient acceptance.

Proposed gate: every authored formula preserves its grouping, indices, exponent and units under source → visible math → accessible text inspection; numerical spot checks use independently stated physical relationships for representative expressions. Authored definitions should replace heuristic inference for scientific content.

### Authoring directions are being presented as explanations

Manual review confirms explicit visual-authoring language in **38 of 224 descriptions**: 29 of 97 baseline and 9 of 127 additions. Ordinary “the atlas shows…” descriptions and legitimate caveats about what a schematic means were excluded. The complete reviewed ID list and descriptions are in `storyboard-audit.json`.

Representative examples: [Tensor Core:2479](../../src/lib/data/records.json) says the visualization “should show” row/column accumulation; [register file:2589](../../src/lib/data/records.json) says the atlas “should depict” bank/spill paths; [GPU die:3454](../../src/lib/data/records.json) instructs “In the exploded view, show…”; [coldplate:4331](../../src/lib/data/records.json) tells the author to use a color change. This is a reader-trust and explanatory-quality issue even if the eventual requested animation happens to exist. Rewrite into causal learner prose, move instructions into reviewed scene specifications, and compare any remaining “shows” claims with the actual model.

### The progress model records recognition, not mastery

[Atlas.tsx:66](../../src/Atlas.tsx) reveals the correct option and its explanation after **any** answer; a subsequent click can record that option. [Atlas.tsx:56](../../src/Atlas.tsx) counts the current matching answer as completed. All 224 checks have one question and three options. Many distractors in the sample are physically implausible or unrelated (“mechanical gate,” “CPU clocks,” “raw electrical power”), making recognition particularly easy. There is no stored first-attempt history, transfer response, explanatory rubric, or delayed retrieval evidence in this state model. The UI says “concepts checked,” which is more restrained than “mastered”; the product roadmap should preserve that distinction.

## Twelve high-value gaps and concrete acceptance proposals

These are curriculum design judgments grounded in the inspected implementation, not measured claims of learning efficacy.

| Priority | Gap and next work | Reviewable acceptance |
|---|---|---|
| P0 | Mathematical fidelity and notation: replace inferred scientific equations, including the three confirmed radical errors; cover all lesson science cards with explicit symbols/units or a documented qualitative relation. | Render, text and independently checked expression agree; no silent scientific alteration; authored/fallback counts visible in validation. |
| P0 | Reader prose and domain organization: remove the 38 confirmed authoring directives; normalize expansion bands; audit assertions about what the scene actually shows. | Every sampled description teaches the mechanism in the present tense; named domains match displayed chapters; scene claims can be demonstrated. |
| P1 | Foundation prerequisite chain: connect all 97 originals where appropriate, complete the 44 missing outcomes/examples, and add a short diagnostic route. Avoid adding artificial prerequisites to genuine starting concepts. | Learner can find the required concept or take a short check before bands, transistor current, matrix multiplication and gradients; prerequisites remain acyclic and pedagogically reviewed. |
| P1 | Scientific continuity from atoms to a switching circuit: add bounded bridges for states/bonding→bands/occupancy, field/potential→charge/current, load capacitance→transfer behavior/noise margin. Current prose names these transitions without giving enough intermediate reasoning to derive or test them. | One shared toy device/circuit lets learners explain an observed change from material/bias through current to valid logic, with approximations and scale changes explicit. |
| P1 | Mathematics for learning: vector/dot product, normalization/probability, loss and a scalar chain-rule update before attention/Adam. Present optional engineering depth without making it a barrier to the overview. | Learner computes one attention row and one weight update, checks shapes and units, and explains changed memory/work when dimensions vary. |
| P1 | Meaningful checks: add prediction, short calculation, error diagnosis and explanation prompts with plausible misconception-based alternatives. | Each important outcome is assessed by a new case; first attempt and assisted retry remain distinct; “mastery” requires transfer evidence instead of visited/correct-option counts. |
| P1 | Shared cross-scale capstone: carry the same workload, tensors, package and hall through the existing journeys and numerical labs. | A scenario change (context, precision, yield, interface, power, failure) propagates through declared dependencies, preserving identities, units and accepted-result definition. |
| P1 | Claim-level provenance: connect science/spec/assertion IDs to exact source locators, dated configuration and status. Add reviewer, effective date, review-by, supersession/conflict metadata promised in the plan. | Every released numeric headline resolves to support and scope or a synthetic-input declaration; a reviewer can trace corrections without searching prose source lists. |
| P1 | Experimental and measurement reasoning: build on metrology, hybrid bonding, RTL and signal-eye lessons with small synthetic datasets/traces and competing mechanisms. | Learner selects a discriminating measurement, accounts for uncertainty/common cause, rejects an attractive wrong diagnosis and records limits of inference. |
| P2 | Executable computation evidence: make IR→layout→kernel→memory transfers concrete for one reproducible open toy operation; compare predicted and observed work/traffic at bounded scope. | Same result is verified at each representation; timing/traffic discrepancies are explained rather than treating a toy bound as a benchmark. |
| P2 | Application breadth beyond autoregressive text infrastructure: add a few purpose-driven cases such as retrieval-assisted question answering, image inference, sensor/edge inference, and scientific workloads, selected for distinct data/memory/latency/quality constraints. | Each case starts with task and quality evidence, maps to model/workload and hardware, and closes with an accepted application result; no unsupported general “AI capability” multiplier. |
| P2 | Formative review and content operations: run a documented beginner/engineering pilot, record misconceptions and transfer failures, and assign scientific/editorial ownership for each domain. | Evidence shows what sampled users can explain/predict before and after revision; published conclusions stay within sample size/design; authoring version and reviewer trails are retained. |

The priority ordering preserves the prior release's manufacturing/packaging/HBM strength. It does not require expanding the atlas into an encyclopedic physics textbook. A small number of carefully connected foundation and application cases can expose much larger gaps than another set of nominally complete records.

## Prior plan versus observed implementation

The plan remains useful intent; it is not current operational status. [PLAN.md:3](PRIOR-EXPANSION-PLAN.md) still describes v1.0.0 as published, and [IMPLEMENTATION.md:9](PRIOR-IMPLEMENTATION.md) still reports 210 lessons/57 branches. The actual package is v1.2.0 with 224/62. Its “remaining release work” is therefore not reliable evidence that release work is still pending; root should reconcile against git and deployed artifacts.

| Prior intent | Observed current state | Assessment |
|---|---|---|
| B02/B06 containment/process/dependency/workload entities and typed edges | `RecordEntry` plus chapter groupings, process routes and adjacency arrays. `RelationKind` names six kinds, but the actual edge constructor emits only `related` and `prerequisite` (`atlas.ts:12–16`). Fixed dependency lanes have display labels. | Useful navigational adapter exists; full causal/containment ontology remains partial. A declared type union is not evidence all relations are authored. |
| B01 evidence contract and source rules; PLAN:183 full claim schema | 39 structured cards and rich source ledger; lesson Specs remain strings; source lists title/URL only. Reviewer, supersession, review-by and explicit science/spec-to-claim keys are absent from the current content contract. | Substantial partial implementation; not every current claim is covered. |
| B10–B24 substantive manufacturing, HBM, architecture, infrastructure and orbital work | All W01–W12 have content; 127 additions include the latest memory construction/placement/qualification extension. Sampled process order and conditional arithmetic generally strong. | Coverage expansion is real. Do not reopen already delivered topics as if missing; extend depth and learner activity. |
| B25 history of mechanisms | 76 global milestones; 37 lessons with inline history. New packs contribute milestones but no inline history arrays. | Chronology exists. Mechanism-change→limitation→current design causal links need review; count is not a quality measure. |
| B29 CRG bridge and research-claim boundary | Seven lessons, architecture/realization/evidence distinctions, source-attributed 55-year claim. | Present and appropriately qualified in sampled prose. Independent validation of the research claim is outside this audit. |
| B09/B26 beginner/engineering learning review; PLAN:281 explicitly says click-through is not learning evidence | One three-option check per lesson, local visited/answer state; available test scripts focus on build, structure and numerical invariants. No formative learner report found in the inspected release docs or prior implementation record. | Engineering QA and interaction coverage do not establish the required learner outcomes. Treat human learning review as unverified, not complete. |
| Formal math with notation/assumptions | Assumptions on all science cards; only 19 authored notation sets; 30 fallbacks and three confirmed silent radical defects. | Partial and materially uneven implementation; a direct reliability gate is needed. |

The best evidence that the roadmap needs a quality phase is not the count shortfall—there is no count shortfall. It is the gap between the current field-guide interaction and the plan's own requirement that a learner predict a changed constraint, explain it and transfer the explanation to an unfamiliar case.

## Diagnostic artifacts

- `curriculum-metrics.mjs`: read-only merged-content metrics generator.
- `curriculum-metrics.json`: complete metrics, per-band/pack/workstream/lesson counts, missing-field ID sets, claims and numerical-spec heuristic rows.
- `merged-lessons.json`: actual merged lesson data used for the audit; diagnostic copy only.
- `stratified-sample.json`: the 22 fully read lesson records.
- `storyboard-audit.json`: all 38 manually confirmed descriptions with explicit authoring directions.
- `equation-audit.mjs` and `equation-audit.json`: exact adapter/KaTeX reproduction and all 229 results.
