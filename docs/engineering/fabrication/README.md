# From a wafer feature to accepted assembly inputs

This executable teaching model follows one identified feature through eleven stages: incoming silicon, grown oxide, deposited poly-Si, resist coating, latent exposure, development, etch transfer, inspection, wafer screening, package interface assessment and accepted example output. The feature retains its identity and material boundaries. Its surrounding lot contains nine synthetic spatial cohorts, so a local change can alter how many dies reach assembly.

The selected feature is a process slice, not a complete transistor, DRAM or accelerator fabrication sequence. Electrical function is not derived from its shape. The scenario omits many fabrication and interconnect steps before its illustrative assembly. All dimensions, readings, tolerances and survival inputs are teaching choices, with source-supported mechanisms distinguished from scenario assumptions in [the source ledger](fabrication-flow-sources.json).

## What changes physically

Oxidation moves the silicon/oxide interface below the original silicon surface and grows oxide above it. This illustrates the distinction between oxide growth and deposited material. The geometric factor 0.44 is an explicitly illustrative input in this version; the implementation does not integrate or fit oxidation kinetics. The historical [Deal–Grove theoretical excerpt](https://www.columbia.edu/~leonard/TISSSite/mvbd.html) supplies the transport-and-interface-reaction context, not that factor or a modern recipe.

The poly-Si target is added above the oxide. Nominal thickness, spatial thickness variation and measurement uncertainty remain separate. [MIT's CVD lecture](https://ocw.mit.edu/courses/6-152j-micro-nano-processing-technology-fall-2005/cad5227ddbdf120be10a0c372f2ccedd_cvd.pdf) explains why precursor transport and surface reaction matter; this model starts from a prescribed thickness field instead of predicting one from reactor conditions.

Positive resist initially covers the film. Exposure changes the latent region's solubility; it removes no material. Development opens the resist while leaving the deposited target intact. The [ASML resist and lithography sections](https://www.asml.com/en/company/stories/2021/semiconductor-manufacturing-process-steps) support the chemical distinction. The separate target-transfer stage follows the sequence and material selectivity concepts in [MIT's dry-etch lecture](https://ocw.mit.edu/courses/6-152j-micro-nano-processing-technology-fall-2005/59b9f31d836355a3380aa156925508bc_lecture17.pdf).

Etch exposure is expressed as a target-equivalent depth D in nm:

- D = nominal target thickness × (1 + overetch fraction).
- Mask consumption = D / target-to-mask selectivity.
- Target residue = max(0, actual target thickness − D).
- Stop-layer loss = max(0, D − actual target thickness) / target-to-stop selectivity.

Selectivities are fixed dimensionless rate ratios. Transferred CD is the developed opening plus a prescribed etch bias. Ideal vertical boundaries do not predict plasma chemistry, loading, sidewall evolution or roughness. A negative remaining-mask budget stays negative in the reported state. Its requested profile is marked unqualified, even though nonphysical negative solid dimensions are clipped from the geometric representation.

## Three different questions at inspection

A tolerance describes an acceptance requirement. Variation describes differences between specimens. Uncertainty describes the declared range around a synthetic reading. Changing the uncertainty or tolerance sliders changes the decision, not the actual geometry.

A reading interval fully inside the specification passes. A disjoint interval fails. An interval that overlaps a boundary requires review and is held out of accepted output. The declared half-width has no probability distribution or confidence level. This teaching policy draws on the role of uncertainty in [JCGM 106 conformity assessment](https://www.bipm.org/documents/20126/2071204/JCGM_106_2012_E.pdf); it does not establish standards compliance or calibrated metrology. The limits are acceptance specifications, distinct from the statistical control limits described by [NIST](https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc32.htm).

The nine cohorts are assumed homogeneous populations for the example. They are not nine real measurements that establish conformity for every die on a wafer. A selected cohort may fail while other cohorts still contribute accepted dies. The feature decision and lot output should therefore remain visible as separate results.

## Accounting from wafer to package

Square dies are placed on a centered grid within a 300 mm wafer with a 3 mm edge exclusion and a 0.1 mm scribe allowance. Only complete squares whose farthest corner fits inside the usable disk count. The default 100 mm² die produces 597 grid-fit dies per wafer. This is an explicit illustrative layout, not an industry gross-die estimator.

Eligible cohort counts are multiplied by wafer count and by an independent defect-free expectation:

    lambda = defect density [cm^-2] × die area [mm²] / 100
    P(no defect) = exp(-lambda)
    screened dies = eligible dies per wafer × wafer count × P(no defect)

The zero-event probability follows the [Poisson distribution](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366j.htm). Its spatial application and independence from dimensional acceptance are assumptions. Fractional counts are expected quantities for a finite planning lot, not physical fractional parts or a monthly throughput rate.

The illustrative bill of materials uses two screened dies and eight already-accepted HBM stacks per package. Package starts are the minimum of screened dies / 2, accepted HBM stacks / 8 and assembly slots. HBM internal fabrication and stacking yield has already been excluded from the input boundary; it is not applied again.

Conditional assembly survival is:

    residual die survival^2 × package attachment survival^10 × final assembly survival

The ten attachments are two die attachments plus eight HBM-stack package attachments, not the bonds inside each HBM stack. Residual die survival represents later escaped or assembly-related failures conditional on initial screening; it does not recharge initial wafer defect yield. Independence of these later events is another declared approximation.

## Interface evidence is more than visible contact

The package panel distinguishes TC-NCF solder-bearing joints and film, MR-MUF joints and molded underfill, and hybrid copper/dielectric interfaces. These material roles are documented by [Samsung](https://news.samsung.com/global/samsung-develops-industry-first-36gb-hbm3e-12h-dram), [SK hynix](https://news.skhynix.com/en/small-size-big-impact/) and [imec](https://www.imec-int.com/en/articles/wafer-wafer-hybrid-bonding-pushing-boundaries-400nm-interconnect-pitch). The example dimensions do not rank the routes or reproduce vendor products. Hybrid's small local gap is exaggerated for legibility.

Geometric overlap is the area fraction for equal square pads displaced in one axis: max(0, 1 − offset / pad width). Contact resistance and bond strength are independent synthetic observations, not consequences calculated from that overlap. Each has its own acceptance interval. Route selection does not secretly change assumed yield.

Scoped qualification has a separate gate. `synthetic-pass` means a fictional supporting record is assumed for the example. `not-provided` and `synthetic-fail` both prevent accepted output even when supply and interface readings pass. None of these settings establishes real product function, fatigue life, process reliability or field qualification.

## Module contract

[The module](fabrication-flow.ts) has no imports or runtime dependencies. `validateFabricationInput` strictly checks complete input documents against `fabricationDefaults` and `fabricationBounds`; it rejects missing, unknown, nonfinite and out-of-range values.

```ts
import { fabricationDefaults, evaluateFabricationFlow } from './fabrication-flow';

const result = evaluateFabricationFlow({
  ...fabricationDefaults,
  uncertaintyScale: 3,
});
```

The result includes `specimen`, `cohorts`, `stages`, `inspections`, `wafer`, `assembly`, `acceptedOutput`, `outputStatus` and scoped `failures`. Every stage has a stable ID, source IDs, an existing atlas lesson ID, quantities, decisions and cross-section data. `specimen.id` is shared across stages; `specimen.cohortId` separately identifies its cohort. `wafer.centers` provides each grid die's position and cohort for a map.

Cross-sections use physical coordinates with positive Y upward. SVG rendering must invert Y. The feature's nm scale and package interface's µm scale belong in independently labeled panels. Regions marked `overlay` indicate latent state rather than additional material volume. `requested-unqualified` must remain visible whenever a mask budget fails. An interface shape alone must not imply successful electrical or mechanical qualification. Geometry and selected-cohort inspection remain unchanged during screening; the denominator changes at the population boundary.

[Examples](fabrication-flow-examples.json) contain complete inputs and computed expected summaries. Run the meaningful accounting, geometry and failure tests with a Node runtime that supports TypeScript stripping:

```sh
node --experimental-strip-types --test fabrication-flow.test.mjs
```

The examples and tests establish behavior within the declared model. They are not fabrication or package validation evidence.
