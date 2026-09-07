# Answer key and formative rubric

The answers apply to the included model contracts. Small floating-point differences are acceptable; units, denominators and causal explanations matter more than display rounding. Preserve a learner's first answer when discussing a revision.

## Fabrication

**F1.** Exposure changes positive-resist solubility; development removes resist in the opening; etch transfers the opening into the target. Inspection compares evidence to requirements without changing material geometry. Requested etch depth is 100 × 1.08 = **108 nm**. Mask consumption is 108 / 10 = 10.8 nm, leaving **29.2 nm**. The opening's stop loss is (108 − 100) / 40 = 0.2 nm, leaving **19.8 nm** of oxide. Etch CD is prescribed separately from thickness consumption.

**F2.** Center film remains 100 nm and transferred CD remains 40 nm. At uncertainty scale 1, all **597 dies per wafer** pass the synthetic cohort policy. At scale 3, **81 pass and 516 require review**. Four wafers yield 81 × 4 × exp(−0.12) = **287.362221496359 expected screened dies**. Two dies per package allow **143.681110748180 starts**, now below the 800-package-equivalent HBM supply. The unchanged conditional survival gives **133.655715855235 expected accepted packages per lot**, compared with **744.179747270937** by default. No physical improvement or defect probability change was created by the uncertainty control.

**F3.** Mask remaining is 5 − 10.8 = **−5.8 nm**. This is a failed budget, not a physically negative film. All cohorts are ineligible and accepted output is **zero**. The requested profile remains unqualified even though negative solid geometry is not drawn.

**F4.** The default expected screened die inventory remains **2,117.966002880572 dies**. Missing scoped qualification prevents accepted output. Screening, assembly survival and qualification have different meanings and must not be collapsed into one favorable number.

Common errors: multiplying the initial wafer yield twice, calling a fractional expectation a physical partial die, treating review as acceptance, or assuming a tighter interval repairs geometry.

## Architecture

**A1.** C = [[19, 22], [43, 50]]. C[0,0] starts at zero, becomes 5 after 1 × 5, then 19 after 2 × 7.

| Scheme | MACs | Schedule steps | Boundary reads | Boundary writes | Neighbor hops |
|---|---:|---|---:|---:|---:|
| Scalar | 8 | 8 issue slots | 16 | 4 | 0 |
| Vector | 8 | 4 issue slots | 12 | 4 | 0 |
| SIMT | 8 | 2 issue slots | 16 | 4 | 0 |
| Systolic | 8 | 4 wavefront ticks | 8 | 4 | 8 |

Vector broadcasts an A value across enabled columns of one output row. The systolic arrangement injects operands at edges and forwards them between PEs. SIMT logical per-thread reads are counted separately; real hardware may coalesce or cache them. These schedules omit different machine details and have no shared calibrated clock, memory interface or power model. They establish arithmetic and declared movement differences, not vendor speed rankings.

**A2.** Only slot 0 enabled: vector and SIMT each need **8 issue slots**, with the same C and 8 MACs. Their physical active-MAC fraction is **8 / (8 × 4) = 0.25**. Explicit scheduler remapping places every output on the remaining enabled slot. Merely masking instructions without remapping would omit work. Scalar and systolic schedules do not use this control and stay unchanged.

**A3.** Tile shapes are **2 × 2, 2 × 1, 1 × 2 and 1 × 1**. Only one PE does useful arithmetic in the final tile. There are **27 MACs**, **16 wavefront ticks**, **36 boundary reads**, **9 boundary writes** and **18 neighbor hops**. Final C = [[2, 5, −1], [5, 1, 10], [4, 1, 3]]. Empty PEs, fill and drain contribute schedule slots but no fictitious MACs.

Common errors: equating a lane count with a vendor warp, comparing issue slots and wavefront ticks as identical clock cycles, or counting a neighbor hop as an external HBM read.

## Operating hall

**H1.** Rack IT input = (8 × 850 + 2,000) / 0.92 = **9,565.217391 W**. Rack DC current = 9,565.217391 / 48 = **199.275362 A**. Equivalent package current = 850 / 0.8 = **1,062.5 A**. These currents occur at different voltages and nested boundaries; adding them has no useful circuit interpretation. All eight racks are admitted in the default case.

**H2.** Loop heat capacity = 1.1 × 4,180 × 10 = **45,980 W**. Floor(45,980 / 9,565.217391) = **4 racks**, or 32 packages. Four other installed racks remain unadmitted. Default flow supports eight. Retained steps fall from **1,259 to 807** in this particular five-minute scenario; the ratio need not equal the rack-count ratio because another network boundary and the event schedule matter.

**H3.** Each rack corresponds to 1.25 × 9,565.217391 = **11,956.521739 W** facility input. Floor(60,000 / 11,956.521739) = **5 racks**. IT input already includes its conversion losses, and facility input already includes overhead. Default effective PUE is 1.25; it is an energy boundary ratio, not a work-productivity measure.

**H4.** Dispatch starts at **90 s**, when the last readiness gate opens. Step time is **0.1958505086976 s**. A checkpoint is requested after 60 running seconds and starts only after a complete step: ceil(60 / step time) = 307 steps, or **60.1261061701632 running seconds**. The fault occurs 60 s after dispatch, before that checkpoint starts or commits. **306.356110070881 work equivalents** are lost; there is no previous checkpoint to read. Final retained work is **650 steps**.

**H5.** The 15-running-second policy yields **1,305 retained / 1,232 durable steps**, versus **1,259 / 1,228** for the 60-second request. Lost work is **14.357486611919**, versus **138.882988829362** work equivalents. Committed checkpoints increase from **4 to 16**, and checkpoint-write traffic increases from **34,359,738,368 to 137,438,953,472 bytes**. These are conditional on the chosen fault time, write bandwidth, commit delay and workload schedule. A universal optimum has not been established.

**H7.** The checkpoint becomes valid at **9.25 s**, protecting **8 steps**. The fault at 12 s loses **2 completed steps plus 0.75 of an unfinished step**. After repair and restore, the interval 15–20 s adds **5 whole steps**. At the horizon:

    executed equivalents = 15.75
    durable = 8; volatile completed = 5; in-flight = 0; lost = 2.75
    retained whole steps = 8 + 5 = 13
    15.75 = 8 + 5 + 0 + 2.75

Run time is 8 + 2.75 + 5 = **15.75 s**. IT energy = 15.75 × 8 + 1.25 × 4 + 3 × 2 = **137 J**. Facility energy = 1.25 × 137 = **171.25 J**, or **13.1730769231 J per retained step**. IT heat is 137 J; external overhead heat is 34.25 J; facility rejection is 171.25 J. Adding coolant heat again would double count IT energy. No automatic checkpoint occurs at the observation horizon.

Common errors: calling any completed step restart-durable, assuming a write start is a commit, ignoring partial lost work, erasing energy spent on rollback, adding coolant heat to facility energy, or treating recirculating water flow as consumption.

## Transfer and rubric

**X1.** Accept several defensible pairs: more HBM with insufficient assembly inputs; more dies exceeding stack-height margin; more installed racks without commissioned services; more arithmetic capacity behind a memory/network limit; faster execution that loses more uncheckpointed work under the same fault. The explanation must name the boundary and required evidence.

**X2.** A strong answer states a direction, controlled variable, measurable result and a scope limit. Example: raise flow at fixed power/PUE and predict lower coolant rise until additional whole racks are admitted; measure admitted count and retained steps; acknowledge that pump power and local flow imbalance are held outside this model.

Score four dimensions from 0–3, total **12 points**:

| Dimension | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Calculation and units | Missing or incompatible quantities | A plausible number without unit/boundary | Correct main calculation with a small omission | Correct quantities, units and denominator, independently checked |
| Mechanism | No causal account | Names controls or parts only | Explains one causal link | Explains the chain and a limiting or failure condition |
| Scope and evidence | Treats schematic as proven hardware | Generic disclaimer | Names a relevant assumption | Uses the assumption to bound a conclusion or reject overclaiming |
| Transfer and revision | No transfer | Repeats the original case | Predicts a new case with partial support | Defends a new prediction and explains a revision or counterexample |

The score is a feedback tool, not a validated test scale. Do not infer general mastery or platform efficacy from one session. A learner may receive full reasoning credit after correcting an initial prediction while retaining it in the record.
