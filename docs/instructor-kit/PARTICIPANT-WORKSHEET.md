# From a feature to retained work

Name or private label (optional): __________  Build/model reference: __________

Keep the first prediction. Record what changed after inspection in a separate space. All inputs in these activities are synthetic teaching values.

## Fabrication → acceptance

**F1 — What changed?** Start with the default specimen. Follow oxidation, deposition, resist coating, exposure, development, etch and inspection. Which step changes resist chemistry without removing material? Which step opens the mask? Which step removes the target? Does inspection create a new physical profile?

Prediction: ____________________  Observed explanation: ____________________

The nominal target film is 100 nm; actual center-cohort thickness is 100 nm. Overetch is 8%; target-to-mask selectivity is 10; initial mask is 40 nm. Calculate requested target-equivalent etch depth and remaining mask. Then use target-to-stop selectivity 40 and initial oxide 20 nm to find remaining oxide in the opening.

Calculation, with units: __________________________________________________

**F2 — Geometry or evidence?** Choose **Restore nominal example**. Change uncertainty scale from 1 to 3. Predict whether the material thickness and opening width change. Record eligible dies and held-for-review dies per wafer, then identify which package input now limits output.

Before/after prediction: _________________________________________________

Physical state: __________________  Acceptance/output: _____________________

**F3 — Finite mask.** Choose **Restore nominal example** and reduce initial mask to 5 nm. Is a clipped nonnegative drawing enough to make this a valid etch? Cite the reported budget and output status.

_________________________________________________________________________

**F4 — Another gate.** Restore the default mask and set qualification evidence to not provided. Explain why screened die inventory can remain positive while accepted package output is zero.

_________________________________________________________________________

## Operation → architecture

**A1 — One arithmetic contract.** Choose the 2 × 2 example:

    A = [1 2]    B = [5 6]
        [3 4]        [7 8]

Calculate C = AB independently. Follow C[0,0] through its two multiply–accumulate updates. Compare scalar, vector, SIMT and systolic results and whole-operation boundary reads.

C = ______________________  C[0,0] partial sums = __________________________

| Scheme | Required MACs | Schedule steps and their unit | Boundary reads |
|---|---:|---|---:|
| Scalar | | | |
| Vector | | | |
| SIMT | | | |
| Systolic | | | |

Why is the table insufficient to rank actual CPUs, GPUs or matrix accelerators by speed?

_________________________________________________________________________

**A2 — Disabled slots.** Keep four teaching slots but leave only slot 0 enabled. Predict the result and vector/SIMT schedule lengths. Explain what explicitly remaps the work and why masking alone would not calculate omitted outputs.

_________________________________________________________________________

**A3 — An edge tile.** Choose the 3 × 3 signed example, then use a 2 × 2 systolic array. Record the four tile shapes and explain inactive PEs in the final tile. Do the arithmetic count or output values change?

_________________________________________________________________________

## Rack → retained work

**H1 — A boundary for every number.** Choose “One restart in a five-minute run.” Each rack contains eight 850 W running packages and 2,000 W of auxiliary output; conversion efficiency is 0.92. Calculate rack IT input. At 48 V DC, find rack current. At 0.8 V equivalent package rail, find package current. Can these two currents be added?

_________________________________________________________________________

**H2 — Heat constrains admission.** Choose “Less coolant flow.” Flow is 1.1 kg/s, specific heat is 4,180 J/(kg K), and allowed rise is 10 K. Calculate loop heat capacity and the whole-rack count it supports. Are the other installed racks useful service capacity in this scenario?

_________________________________________________________________________

**H3 — Facility boundary.** Choose “A smaller facility feed.” With PUE 1.25 and 60,000 W facility input, calculate how many whole racks fit. Explain why multiplying facility input by PUE again would be incorrect.

_________________________________________________________________________

**H4 — Readiness.** Choose “Operations gate opens late.” When may dispatch begin? The fault still occurs at 150 s. Does 60 s of running guarantee that the first requested 60-running-second checkpoint has committed?

_________________________________________________________________________

**H5 — A particular checkpoint policy.** Compare the default 60-running-second checkpoint request with “Checkpoint every 15 running seconds.” Record final retained steps, durable steps and lost work. Explain why this comparison cannot establish one universally best checkpoint interval.

_________________________________________________________________________

**H7 — Commit before restart (printed or runner activity).** One whole work step takes 1 s. Run from 0 to 8 s; write a checkpoint from 8 to 9 s and commit it from 9 to 9.25 s. Run until a fault at 12 s, wait for repair until 14 s, restore until 15 s, then run to 20 s. Run power is 8 W IT, checkpoint power 4 W, and repair/restore power 2 W. PUE is fixed at 1.25. All readiness gates opened at 0 s.

At the fault: durable steps _____; completed but lost _____; unfinished lost _____.

At 20 s: executed equivalents _____; retained whole steps _____; durable steps _____.

IT energy: __________ J. Facility energy: __________ J. Explain why heat removed by coolant is not added as another electricity total: ___________________________

## Transfer

**X1.** A proposal increases a component's nominal capacity. Give two different reasons why accepted or retained work might not increase. Name the affected boundary and evidence needed in each case.

_________________________________________________________________________

**X2.** Choose one change you would investigate next. Predict its direction of effect, hold another relevant variable fixed, name a measurable outcome, and state one assumption that could invalidate your prediction.

_________________________________________________________________________

One revised explanation I can now defend: __________________________________
