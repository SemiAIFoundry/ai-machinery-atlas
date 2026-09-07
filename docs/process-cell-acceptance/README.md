# INV-01: oxide geometry to electrical cell acceptance

**process-cell-acceptance-1** carries one named synthetic specimen through evaluated oxide, electrical parameters, current balance, loaded transitions and four separate acceptance gates. It adds two lessons to the existing oxide, transistor, inverter and standard-cell context.

- [Pure model](../../src/lib/process-cell-acceptance.ts), [durable input records](../../src/lib/process-cell-acceptance-record.ts)
- [React component](../../src/components/process-cell-acceptance.tsx), default `ProcessCellAcceptance({onSelect?})`
- [Two lessons](../../src/lib/data/process-cell-learning.json), [eight canonical science cards](../../src/lib/data/equations-process-cell-learning.json)
- [Tests](../../scripts/process-cell-acceptance.test.mjs), [complete specimen fixtures](scenarios.json), [source review](source-review.json), [validation](validation.json)

## Physical and numerical contract

This is a planar long-channel, constant-mobility square-law model. Both channel lengths are 2 μm; nMOS width is 2 μm and pMOS width is 6 μm. The supply is fixed at 1.2 V. Chosen mobility magnitudes are 450 and 150 cm²/(V s), balancing the default current factors through the width ratio. The nMOS multiplier and extra threshold shift are independent scenario parameters.

| Quantity | Declared value or conversion |
|---|---|
| Vacuum permittivity | 8.854×10⁻¹² F/m, rounded teaching constant |
| Oxide relative permittivity | 3.9, assumed SiO₂ approximation |
| Length conversions | nm→m: 10⁻⁹; μm²→m²: 10⁻¹² |
| Mobility conversion | cm²/(V s)→m²/(V s): 10⁻⁴ |
| Fixed threshold intercept | 0.23 V |
| Fixed depletion-charge magnitude | 4×10⁻⁴ C/m² |
| Channel-length modulation | λ=0 |

Evaluated oxide is nominal oxide times one plus its percentage offset. The same `Cox=ε0εr/tox` enters drive factor β, next-gate capacitance and the fixed-charge threshold term. Both threshold magnitudes start as `0.23 V + Qd/Cox`; the nMOS receives its separately declared shift. This follows a fixed-electrostatics parameterization, not a solved doping profile, interface-trap distribution or manufacturing recipe.

A following inverter contributes `Cox(Wn+Wp)L`. Total constant load is integer fanout times that approximation plus the supplied extra capacitance. Full oxide-area capacitance is intentionally simplified. Bias-dependent charge partition, junction/overlap capacitance and extracted interconnect are omitted; the extra load does not pretend to be an extraction result.

## Current and DC transfer

For nonnegative source-referenced voltages, current magnitude is zero below threshold, `β[(VG−VT)VD−VD²/2]` in triode and `β(VG−VT)²/2` in saturation. pMOS uses VSG, VSD and positive |VTp|.

The transfer balances nMOS and pMOS currents. The two ordinary branches are solved analytically and tested against the independent current equation. At the exact switching input, the λ=0 model has an interval of valid output voltages because both saturated currents are independent of drain voltage. The API returns `vout:null`, the interval endpoints and `gain:null`. The graph shows the vertical interval; it does not hide the degeneracy by inventing a unique voltage.

The two unity-gain inputs satisfy `dVout/dVin=−1`. Their actual output levels define VOL and VOH, and the margins are `NML=VIL−VOL` and `NMH=VOH−VIH`. No substitution of ideal rails is made. For balanced devices, an independent closed form verifies these points:

```text
VIL = (3 VDD + 2 VT)/8
VIH = VDD − VIL
VOL = (VDD − 2 VT)/8
VOH = VDD − VOL
NML = NMH = VDD/4 + VT/2
```

## Loaded transitions

A rail-to-rail input step is instantaneous. The other pull device is off, and the constant load follows `C dV/dt = I`. The delay to a voltage threshold is `C ∫dv/I`, evaluated analytically across triode and saturation regimes. A pMOS charge uses the same magnitude integral in the remaining voltage `VDD−Vout`.

In a triode interval with overdrive `u=VDD−VT`, the primitive is:

```text
(1/(βu)) ln[v/(u−v/2)]
```

The ratio inside the logarithm is dimensionless. In saturation, the integral is voltage interval divided by `βu²/2`. Delay multiplies the integral by capacitance, yielding seconds. Independent Simpson quadrature checks both 50% and 10–90% results across 54 process/load corners. Constant-current saturation intervals separately satisfy `t=CΔV/I`.

`outputAfterStep` inverts the same integral for the UI's physical model-time cursor. Curves are sampled from these computed times rather than an arbitrary animation speed. Reaching the exact final ideal rail requires infinite time in this model; reported 50% and 10–90% thresholds are finite.

## Default and counterexamples

| Specimen | Minimum DC noise margin | Maximum 50% delay | Gate outcome |
|---|---:|---:|---|
| Default, 10 nm and one following gate | 0.4729196 V | 0.6997759 ns | All pass |
| Oxide +20%, 12 nm | 0.4845036 V | 0.7598888 ns | Fails 5% geometry tolerance; electrical gates pass |
| Four following gates | 0.4729196 V | 2.4773623 ns | Static gates pass; fails 1 ns delay |
| n mobility 0.5× and +120 mV n threshold shift | 0.3967162 V | 1.8745095 ns | Geometry passes; noise and timing fail |

Default Cox is 0.00345306 F/m², next-gate load is 55.24896 fF, total load is 65.24896 fF and both threshold magnitudes are 0.3458393 V. The balanced switching input is 0.6 V. At that exact input, the permitted ideal output interval is approximately 0.2541607…0.9458393 V.

The acceptance contract checks:

1. Absolute chosen oxide offset against the declared tolerance.
2. Inputs ≤0.3 VDD producing outputs ≥0.8 VDD, and inputs ≥0.7 VDD producing outputs ≤0.2 VDD.
3. Both actual DC noise margins meeting the selected minimum.
4. Both 50% loaded step delays fitting the selected maximum.

These gates refer to one deterministic teaching specimen. Their conjunction is not statistical yield, process qualification, foundry signoff, measured reliability or a prediction for a named technology node. Passing one gate does not waive another.

## Primary evidence and limits

The [MIT 6.012 Fall 2005 lecture collection](https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-fall-2005/pages/lecture-notes/) provides the versioned primary course context. Exact PDF page locators and mechanism comparisons are recorded in the source review. Lectures 8–10 support the electrostatic and long-channel current relations; Lecture 12 supports the unity-gain definitions; Lecture 14 supplies loaded inverter context. Its simple delay estimates are not copied as exact answers: this implementation integrates the declared current law and checks the result independently.

The model excludes channel-length modulation, velocity saturation, mobility degradation, subthreshold and oxide leakage, body-bias variation, quantum confinement, temperature, finite input slew and parasitic extraction. The exact switching degeneracy is an explicit consequence of those idealizations. No calibration or extrapolation to a commercial FinFET/GAA process is permitted by the model scope.

`ngspice` and `xyce` were not found on PATH during this implementation. No package was installed, no native SPICE run occurred, and no external simulator comparison is claimed. Source/logic comparisons are by an AI agent; physical-device, learner and human specialist observations remain unclaimed.

## Reuse and verification

All inputs export with schema/model identity. Import validates before changing current controls. Save writes to `atlas-process-cell-execution-input`; incompatible older raw text is preserved under `atlas-process-cell-execution-older-inputs` before replacement. A failed backup leaves the active saved record intact. No account is needed.

```sh
node --experimental-strip-types --test scripts/process-cell-acceptance.test.mjs
node --experimental-strip-types docs/process-cell-acceptance/verify-fixtures.mjs
npx tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext \
  --moduleResolution bundler --jsx react-jsx --lib es2022,dom,dom.iterable \
  --allowImportingTsExtensions --esModuleInterop \
  src/components/process-cell-acceptance.tsx \
  src/lib/process-cell-acceptance.ts src/lib/process-cell-acceptance-record.ts
```

Tests cover dimensional conversions, regime continuity, 54 current-balance and integral corners, balanced closed forms, numerical derivatives, load scaling, distinct failure cases, finite-time inversion, complete lesson references/equations, exact worked values and portable input recovery.
