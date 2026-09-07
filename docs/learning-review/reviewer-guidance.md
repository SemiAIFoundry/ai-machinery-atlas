# Scientific review of fabrication and bonding views

Prepared 7 September 2026. This guide supports review of the atlas’s 14 fabrication and bonding routes and their 84 learning stages. It describes what each representation means, which distinctions matter, and what evidence would justify a stronger claim. **Independent specialist review remains pending.**

The [process definitions and source ledger](../../src/lib/data/process-mechanisms.json) identify the lessons, stages, scientific scope, and 16 supporting references. The [drawing model](../../src/lib/process-mechanisms.ts) supplies the corresponding geometry and calculations. These are educational cross-sections and bounded numerical examples; they do not establish a manufacturing recipe or product qualification. The six stages in each route organize a learning sequence, rather than prescribing a universal factory sequence.

## Evidence and illustrative quantities

Manufacturer and research descriptions support the mechanism and its context. The atlas’s geometry, stage boundaries, and numerical examples are educational constructions based on those descriptions. Successful rendering and valid JSON do not constitute independent scientific validation.

All numerical seeds in these views are synthetic, including dimensions that resemble common process dimensions. A measurement label identifies evidence relevant to the process; it does not imply that the atlas acquired that measurement. A future measured trace would need its source, configuration, sample identity, method, and population recorded separately.

The principal references support these distinctions:

- [Samsung’s TC-NCF disclosure](https://news.samsung.com/global/samsung-develops-industry-first-36gb-hbm3e-12h-dram) supports the bump-and-film route. Its dated product claims do not define the atlas’s generic numerical inputs.
- [SK hynix’s MR-MUF explanation](https://news.skhynix.com/en/small-size-big-impact/) separates metallic reflow from molded filling and describes advanced placement stabilization. Some variants therefore include local stabilization before final reflow.
- [imec’s wafer-to-wafer hybrid discussion](https://www.imec-int.com/en/articles/wafer-wafer-hybrid-bonding-pushing-boundaries-400nm-interconnect-pitch) and [separate die-to-wafer demonstration](https://www.imec-int.com/en/press/imec-demonstrates-die-wafer-hybrid-bonding-cu-interconnect-pad-pitch-2mm) have different handling and evidence boundaries. Test-vehicle results do not establish complete HBM qualification.
- [SUMCO’s wafer production overview](https://www.sumcosi.com/english/products/process/), [ASM’s epitaxy description](https://www.asm.com/our-technology-products/epitaxy), and [ASM’s ALD description](https://www.asm.com/our-technology-products/ald) support distinct crystal-growth, finishing, and film-growth mechanisms.
- [The Deal–Grove theoretical discussion reproduced by Columbia](https://www.columbia.edu/~leonard/TISSSite/mvbd.html) supports a reaction-and-transport oxidation model. The atlas’s illustrative geometry samples do not supply calibrated time coefficients.
- [ASML’s computational-lithography account](https://www.asml.com/en/products/computational-lithography) supports separating the desired wafer pattern, corrected mask, and predicted image. The atlas’s prescribed contours remain synthetic.

The source ledger also states reference-specific limits. Its MIT course entry is a foundational reference whose index was checked, not a claim that every lecture was independently revalidated. ASML’s broad manufacturing overview supports the photoresist discussion; resist development and subsequent target-film etching remain separate operations in the atlas. Informal descriptions of bump materials do not establish a precise solder alloy.

## How to inspect a route

Begin with its named lesson and stage. Record the route, stage, selected control values, and candidate identity. Compare the learner-facing description with the material boundaries and the stated numerical values. Screen distances are not physical measurements unless the view explicitly defines that scale.

A fabrication stage may add, remove, or transform material. An inspection stage may preserve the geometry while explaining which evidence is needed. Six learning stages do not require six different physical transformations. Conversely, camera motion or a renamed label cannot establish that a material transformation occurred.

The 2D view and optional 3D view represent the same authored geometry. The 3D view provides spatial inspection, without adding an independent physical simulation. Labels and material explanations carry meaning alongside color. Route selection must retain the relevant material distinction; camera position cannot change quantitative state.

Controls need a stated consequence. In the current bounded views, CVD/PVD selection compares two prescribed coverage profiles; relative numerical aperture changes optical scaling bounds; etch selectivity changes the mask budget. Stage and view controls change the process state or presentation. None of these controls predicts production yield, a process window, or material reliability.

A local cross-section, an optical axis, crystal orientation, process order, and a measured profile use different coordinate systems. An exaggerated local surface feature does not become a product-scale dimension merely because it can be inspected in 3D.

## Distinctions to verify

| Route and lesson | Scientific distinction to preserve | Misinterpretation to check |
| --- | --- | --- |
| TC-NCF — `hbm-tc-ncf-route` | Metallic bumps and receiving pads form the electrical path; non-conductive film is present before thermocompression and supports the interface. | The polymer becoming the electrical conductor, or post-reflow mold filling replacing the preapplied film. |
| MR-MUF — `hbm-mr-muf-route` | Placement or local stabilization precedes final metallic joining; inter-die filling and external molding are separate later operations. | Mold filling being treated as metallic joint formation, or all variants being described as wholly unjoined until one final heating event. |
| Hybrid bonding — `hbm-hybrid-bond-route` | Copper and bond dielectric, local planarization, surface preparation, initial contact, and completed bonding are distinct. The schematic does not establish a particular qualified product’s material stack. | Solder or polymer film at the hybrid bond plane; initial contact treated as verified continuity; research metrics transferred to full HBM yield. |
| CZ growth — `electronic-silicon-crystal-growth` | Feed purity, a liquid melt, an oriented seed, and a growing solid crystal are different properties or states. | A rigid lattice in liquid silicon, or pure feedstock automatically described as a perfect single crystal. |
| Wafer finishing — `wafer-finishing-geometry` | Surface relief, damaged material, thickness samples, and midplane-displacement samples concern different features. | TTV treated as bow, or a mirror-like finish treated as proof of chemical cleanliness. |
| Epitaxy — `epitaxial-material-stack` | A prepared crystalline template supports added film; the alternating Si/SiGe layers are one example with stated synthetic thicknesses. | Layer color proving strain, mobility, defect density, or later etch selectivity. |
| Surface contamination — `contamination-and-surface-state` | Particles, chemical adsorbates, and their relevant measurements represent different populations. | Ambient exposure treated as deposited dose, a particle marker treated as a proven root cause, or a clean-looking surface treated as universally ready. |
| Thermal oxidation — `thermal-oxidation-interface` | The oxide outer boundary rises while the silicon/oxide interface moves into silicon relative to the original surface. | A coating entirely above unchanged silicon, or a learning-stage number treated as a calibrated oxidation time. |
| CVD/PVD — `cvd-pvd-film-transport` | The same trench supports two disclosed illustrative top, sidewall, and bottom coverage profiles. | All CVD treated as perfectly conformal, all PVD treated as incapable of sidewall coverage, or thickness alone treated as complete film quality. |
| ALD — `ald-self-limiting-growth` | Surface-bound species persist during a purge; excess gas clears before the complementary exposure. | Both gases continuously coexisting, or one cycle necessarily depositing one complete atomic plane. |
| Resist development — `resist-track-development` | Exposure creates a latent chemical image; development removes selected positive resist while the target film remains intact. | Exposure instantly removing resist, development etching the target film, or after-develop width treated as final electrical width. |
| OPC — `mask-opc-layout` | Target, mask candidate, and prescribed wafer contour are separate objects. | The candidate mask treated as fabricated silicon, every mask correction feature assumed to print, or a supplied contour called measured data. |
| Lithography optics — `lithography-resolution-focus` | Finite aperture, relative resolution, relative depth of focus, and later resist evidence answer different questions. | NA alone proving an accepted printed line, an abstract optical schematic treated as a real scanner, or focus-range markers changing silicon geometry. |
| Etch transfer — `plasma-wet-etch-transfer` | Target removal, consumed mask, remaining mask budget, and later inspection have separate meanings. | All plasma or wet processes assumed to share one profile, an exhausted mask budget treated as feasible, or removal represented as copper deposition. |

## Independent numerical checks

These examples check transparent arithmetic. They do not validate the synthetic inputs as production specifications.

| Quantity | Check | Boundary |
| --- | --- | --- |
| Sample thickness variation | For 702, 700, 706, 701, and 703 µm, max − min = **6 µm**. | Five thickness samples do not constitute standardized full-wafer bow or warp measurements. |
| Bottom/top coverage | Synthetic CVD case: 8/10 = **0.8**. Synthetic PVD case: 3/10 = **0.3**. | Ratios describe the prescribed profiles, not process capability or electrical continuity. |
| ALD accumulation | 0.08 nm/cycle × max(100 − 10, 0) cycles = **7.2 nm**. | The delay is an assumed equivalent-cycle offset; the equation does not model nucleation chemistry. |
| Pattern-transfer bias | A matched after-etch dimension of 21 nm minus an after-develop dimension of 24 nm gives **−3 nm**. | Feature type and sign convention must match; the difference does not identify the cause or electrical width. |
| Prescribed OPC edge error | Against target edges [0, 24] nm, [2, 22] gives **8 nm²** and [0.5, 23.5] gives **0.5 nm²** using unit weights. | These are supplied contours, not outputs of an optical solver. |
| Relative optical scaling | At relative NA = 1.2, fixed wavelength/constants give resolution ratio **0.8333…** and depth-of-focus ratio **0.6944…**. | These ratios do not establish absolute printable dimensions or an accepted process window. |
| Mask consumption | A 200 nm target depth at selectivity 10 consumes **20 nm** of mask, leaving **20 nm** from an initial 40 nm. | Variation and overetch are omitted. An exhausted budget makes the requested profile unqualified. |

The oxidation arrays pair synthetic oxide thickness with consumed silicon. They illustrate a moving boundary; they are neither a calibrated growth curve nor an independently derived stoichiometric-volume calculation. A future oxidation-time control would need dimensioned coefficients, a stated physical regime, and separate validation. Interpolating the six illustrated stages would not by itself implement Deal–Grove kinetics.

An illustrative particle, recess, void, or bowed shape is not an observed failure cause. A defensible diagnosis would connect the same sample to electrical, structural, chemical, and mechanical evidence as relevant. A per-unit screen remains distinct from qualification of a process population or a product’s field reliability.

## Review record and acceptance evidence

Use the [observation template](observation-template.md) to record the actual reviewer, role, date, candidate/source identity, route and stage, evidence, and unresolved issue. Use the [launch gates](launch-gates.md) for the pilot decision. The following checks remain review requirements until completed records are attached:

1. **Route coverage:** each of the 14 lessons resolves to the intended named route and all six stages. Its sources and explanatory text match that route.
2. **Material-state agreement:** adjacent stages preserve, add, remove, or transform the stated materials. Local geometry, labels, and parent/child structures agree, including inspection stages with unchanged geometry.
3. **Representation agreement:** the 2D view, optional 3D view, descriptions, and numerical values refer to the same selected state. The schematic scale and any exaggeration remain clear.
4. **Control meaning:** each enabled control produces its declared consequence. A camera change or view switch cannot change a result; a parameter cannot silently turn an initial process stage into a later one.
5. **Arithmetic and limits:** the independent checks above hold, feature dimensions and units remain consistent, and an infeasible or unqualified result remains visibly distinct from a supported outcome.
6. **Task access:** the essential material explanation and numerical evidence remain usable without WebGL or animation. Keyboard and assistive-technology users can identify the selected stage and its relevant inputs, outputs, and evidence boundary.
7. **Evidence scope:** the review record distinguishes supported mechanism, synthetic illustration, calculation, and measured result. A stage named “qualified output” explains a process concept; it does not certify the illustrated stack.

Where evidence or representation is incomplete, record the affected claim and scope rather than inferring success from visual polish. Detailed rheology, deformation, surface chemistry, optical fields, contact physics, and factory dispatch require additional models and validation beyond these views.
