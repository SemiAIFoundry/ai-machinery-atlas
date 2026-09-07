# Nine participant task cards

Status: proposed scripts, not completed sessions. Use the [session protocol and rubric](LEARNER-REVIEW-KIT.md). All values are synthetic. Begin each card from its listed baseline; retain the same scenario while moving among the card's views. Restore reference inputs between cards only after saving/exporting the previous work.

For every card: record and save a prediction before changing inputs; inspect the result; save explanation as practice; answer transfer before testing it. Show participants only their assigned card, not the facilitator key below. Capture whether the app's default prompt or visible result influenced the response.

## A1 — Load, charge and time

**Entry:** “A switch becomes arithmetic.” Reference inputs: 0.8 V, 10 fF, A = 7, B = 5. **Outcome:** distinguish energy/time costs from an exact arithmetic result. **Time allowance:** 8–10 minutes.

**Participant prompt:** “Predict what will happen to supply charging energy, the 50% crossing delay, and A + B if the load changes from 10 to 20 fF while voltage and integer inputs stay fixed. Save your prediction.”

**Do:** Change only the load. Find the displayed energy and delay and a diagram, trace or accessible equivalent that helps explain them. Show where charge is stored and distinguish stored energy from energy drawn from the supply. Check A + B.

**Explain:** “What changed, what stayed fixed, and why? State the units of two quantities you used.”

**Transfer:** “At the same voltage, a different load is 30 fF. Predict its charging energy and crossing delay relative to the original 10 fF case. Would that delay certify the entire adder's maximum clock rate?”

**Observe:** Can the learner find units, separate physical cost from ideal bits, and avoid treating one effective RC element as a timed full circuit?

## A2 — Voltage tradeoff

**Entry:** Switching, reference inputs, load fixed at 10 fF. **Outcome:** explain a bounded voltage/current/energy tradeoff. **Time allowance:** 8–10 minutes.

**Participant prompt:** “Predict the directions of change in charging energy and crossing delay when supply voltage increases from 0.8 to 1.0 V. Save your prediction and say which quantity you are holding fixed.”

**Do:** Change voltage only. Inspect the gate/current representation and effective delay calculation. Find the assumption describing the current model. Use the displayed values or your own calculation to support the explanation.

**Explain:** “Why can a higher voltage use more charging energy yet cross the threshold sooner in this model? Does the integer result change?”

**Transfer:** “A designer suggests reducing voltage to 0.3 V and using the same equation to predict a working circuit. What information would you need before accepting that estimate?” Do not ask the participant to force an out-of-range UI value.

**Observe:** Recognition of the synthetic threshold and model range; distinction between effective resistance and a fully simulated transistor/inverter.

## A3 — Carries and a multiply–accumulate

**Entry:** Switching, reference inputs. **Outcome:** trace exact arithmetic and distinguish numeric correctness from implementation feasibility. **Time allowance:** 8–12 minutes.

**Participant prompt:** “Before entering A = 15 and B = 1, predict their sum, including the final carry, and the value of [A, B, 1] · [3, 2, 1]. Save your prediction.”

**Do:** Enter those values. Follow the four-bit carry trace from the least-significant bit and inspect the MAC products/partial sums. Then double load capacitance without changing A or B.

**Explain:** “Reconstruct both results from the intermediate values. Explain why the physical cost changes while these ideal integer results remain the same.”

**Transfer:** “For A = 11 and B = 6, predict both results without changing the controls yet. If the hardware stores only four output bits, what must its designer decide about the carry?”

**Observe:** Fifth-bit interpretation, least-significant-bit ordering, dot-product meaning, and separation of word-width decisions from UI formatting.

## B1 — A supply bottleneck moves

**Entry:** “Two wafers become an accelerator.” Reference: 40 memory wafers/month, 24 logic wafers/month, 8 DRAM dies/stack, TC-NCF, 650 package assemblies/month. **Outcome:** normalize unlike supply streams before finding accepted output. **Time allowance:** 10–12 minutes.

**Participant prompt:** “If memory wafer starts rise from 40 to 160 per month and everything else stays fixed, will compatible accepted packages rise fourfold? Predict what may limit them and save your prediction.”

**Do:** Record the reference accepted rate, change memory wafers only, then inspect the package-normalized streams. Show where logic dies and HBM stacks enter one package. Find where screening, stack survival and final assembly survival apply.

**Explain:** “What limits each scenario? Why can't the raw counts of dies, stacks and packages be compared directly? Where would charging initial wafer yield twice go wrong?”

**Transfer:** “Keep memory starts at 160 but suppose logic starts fall to one wafer/month. Predict the new binding stream and whether a full 64-package rack is supported.”

**Observe:** Units and denominators, route/capacity held fixed, expected fractional monthly rates versus whole deployed racks.

## B2 — Capacity is constrained by an interface

**Entry:** Manufacturing, reference 8-die TC-NCF stack. **Outcome:** connect route-specific material/geometry changes to a bounded compatibility test. **Time allowance:** 10–12 minutes.

**Participant prompt:** “Predict what happens to capacity and height when the DRAM count rises from 8 to 12. Must the larger stack produce more compatible systems? Save your prediction.”

**Do:** Set 12 dies and inspect height, compatibility and accepted output. Inspect TC-NCF and hybrid route cross-sections or their accessible equivalents at corresponding assembly states; then select hybrid while keeping 12 dies. Identify a micro-bump/film interface and a direct copper/dielectric interface. Compare the feasible 8-die TC-NCF baseline with the feasible 12-die hybrid scenario. Follow the same scenario to execution and find its package HBM capacity.

**Explain:** “Which consequence comes from die count, which from the selected illustrative interface, and which result is blocked by the envelope? What does this comparison establish about an actual vendor process?”

**Transfer:** “Would a 16-die hybrid stack necessarily fit this same envelope? What additional evidence would be needed to qualify a redesigned package?”

**Observe:** Shared capacity/identity across views, route-specific materials, failure visibility and avoidance of real vendor rankings from synthetic gaps or resistance.

## B3 — A package is not a powered rack

**Entry:** Manufacturing, reference scenario including 2 MW facility power and PUE 1.2. **Outcome:** carry a package scenario into an explicit facility boundary. **Time allowance:** 8–10 minutes.

**Participant prompt:** “Predict whether lowering facility power to 0.1 MW changes accepted packages/month, powered full racks, or system tokens/s. Save your prediction.”

**Do:** Change facility power only. Compare supply-supported and power-supported racks. Move to execution and inspect the same scenario's package and hall results. Return to manufacturing without resetting inputs.

**Explain:** “Why can accepted packages exist while full powered racks are zero? Show where the host/network allowance and facility-to-IT ratio enter.”

**Transfer:** “Return the budget to 2 MW. Would doubling it again guarantee twice as much useful work? Name a remaining constraint and an operational fact this snapshot assumes rather than proves.”

**Observe:** Full-rack rounding, shared input persistence, facility versus IT power, absence of invented commissioning/reliability results.

## C1 — An evaluated attention failure

**Entry:** “A request becomes a result.” Keep the larger resource scenario at reference; select query token “memory,” position 3, score temperature 1. **Outcome:** inspect an actual small tensor calculation and evaluate its limited task. **Time allowance:** 10–12 minutes.

**Participant prompt:** “The miniature task is to retrieve the selected query token. Predict how raising attention score temperature from 1 to 5 changes the attention distribution and whether the readout must still recover ‘memory.’ Save your prediction.”

**Do:** Record the reference weights/readout, then change only score temperature. Identify the causal mask, normalize the allowed weights, reconstruct the two-dimensional weighted value, and compare readout scores/probabilities. State the target and observed output.

**Explain:** “Why does an allowed attention weight differ from a vocabulary readout probability? How can this small computation fail its task even though it completes?”

**Transfer:** “If package memory or facility power increases, would that by itself fix this query's readout? Describe a concrete evaluation you would need before claiming better answers on a real application.”

**Observe:** Masking applies to input attention, not a ban on future vocabulary outputs; task correctness remains separate from resource throughput and general language ability.

## C2 — Live state moves between tiers

**Entry:** Execution, reference scenario: 8-die stack, context 8192, batch 8, 16-bit weights, HBF off. **Outcome:** conserve resident/overflow bytes and reason about service constraints. **Time allowance:** 10–12 minutes.

**Participant prompt:** “Predict which state grows when context rises to 32768 while batch, model parameters and manufactured package stay fixed. Will the total weight bytes change? Save your prediction.”

**Do:** Change context only. Account for weights and mutable KV across available tiers, including any unplaced bytes. Inspect workspace/staging, current placement, and room for the next KV append as separate checks. Then allow the hypothetical HBF read tier while keeping the workload fixed; find which bytes move and which feasibility check remains unchanged.

**Explain:** “Why can KV growth push weights out of HBM under this placement policy? What path must remote bytes take before computation? Which service assumption changed when HBF was enabled? If the present inventory fits but the next append does not, why is a runnable rate still withheld?”

**Transfer:** “At the original context, if weight storage precision halves, which byte count halves and which does not? Can this model establish unchanged accuracy or twice the compute speed?”

**Observe:** GB/GiB, capacity versus bandwidth, mutable state never placed in the read-only tier, static placement versus next-step headroom, and no accuracy inference from byte accounting.

## C3 — Detect and recover from infeasible state

**Entry:** In manufacturing choose 4 DRAM dies/stack; then enter execution with context 8192, batch 8, 16-bit weights, HBF off and all other reference inputs. **Outcome:** identify a hard resource failure and preserve a reproducible first attempt. **Time allowance:** 10–12 minutes.

**Participant prompt:** “Predict whether changing to context 131072 and batch 32 can execute using this scenario's available memory. Which evidence would distinguish a slow workload from one that cannot be placed? Save your prediction.”

**Do:** Apply those two workload changes. Reconcile live weights/KV with placed and unplaced inventory. Inspect feasibility and service/rate labels. Keep the manufactured package fixed and reduce context to 8192 and batch to 1. Check current placement and next-step headroom separately. If current placement fits but the next append does not, reduce weight storage from 16 to 8 bits and inspect both checks again. Save the explanation as practice and check that the first prediction and its scenario remain intact.

**Explain:** “Why is time calculated for a partial set of available bytes not evidence that the full workload runs? Why can an inventory fit without leaving room for the next append? Does extra facility power supply missing per-package memory? What does the final weight-precision change establish, and what does it leave unknown?”

**Transfer:** “Would enabling a read-only HBF tier alone make the failed workload fit? Explain using mutable KV, then identify one workload change that could address the failure.”

**Observe:** Zero/withheld runnable rate with a clear cause, missing inventory, recovery without an undeclared hardware change, and first-attempt preservation.

## Common finish: reproduce the work

After the three assigned cards, ask the participant to export one learning file, open an inputs-only share link in a fresh review context, and import the learning file. They should distinguish shared inputs from written answers, locate the original prediction and latest practice, and recover the intended route/workload and results. Do not send a link to anyone. Record the native file/clipboard workflow and any help. A same-browser refresh alone does not test portability. Use the device checklist's existing-history test separately so a clean-profile import cannot conceal accidental overwrites.

## Facilitator-only key — keep separate from participant cards

These are calculations from the disclosed synthetic model, not device measurements or observed learner answers. Recheck on the frozen build. Use displayed rounding or an explicitly stated ±0.5% tolerance for numerical transcription; exact arithmetic, zero/feasibility and integer rack counts have no rounding tolerance. Service-time constants can change with a reviewed model revision; use invariants below rather than freezing an unreviewed latency. The [computed fixture file](review-fixtures.json) records exact outputs and source digests. A conditional internal step estimate is not a runnable latency when placement, stack compatibility, or append headroom fails.

| Card | Essential evidence and expected relationship |
|---|---|
| A1 | At 0.8 V: supply energy 6.4 → 12.8 fJ; stored energy 3.2 → 6.4 fJ; delay about 693.15 → 1386.29 ps. A + B remains 12. At 30 fF, energy/delay are three times the reference. Single effective RC timing does not certify an adder. |
| A2 | At 1.0 V and 10 fF: 10 fJ, about 385.08 ps; current 18 μA versus 8 μA at 0.8 V. The model uses Vt = 0.4 V and a saturation-current-derived effective R. 0.3 V is outside supported controls/regime; blindly squaring negative overdrive is not a valid on-current extrapolation. |
| A3 | 15 + 1 = 16 = 10000₂; four sum bits zero and final carry one. MAC = 45 + 2 + 1 = 48. Transfer: 11 + 6 = 17 = 10001₂; MAC = 33 + 12 + 1 = 46. Four stored bits require an explicit carry/overflow policy. |
| B1 | Baseline approximately 406.87 accepted packages/month, HBM-limited. At 160 memory wafers: 637/month = 650 × 0.98, assembly-limited. At one logic wafer: approximately 41.54/month, logic-limited, zero full racks. Normalize by two logic dies and eight stacks/package; do not charge initial wafer screening again as residual stack yield. |
| B2 | Height = 100 + 30 + n(45 + route gap), in μm. TC-NCF: n=8 gives 586; n=12 gives 814, failing 720. Hybrid n=12 gives 682 and 288 GB/package; baseline gives 192 GB/package. Both feasible comparison cases have positive accepted output but different stack starts/survival. Hybrid n=16 gives 866, still failing. Geometries distinguish film/micro-bumps and direct copper/dielectric contacts; synthetic preset differences establish no actual route superiority or qualification. |
| B3 | Accepted output stays about 406.87/month. Reference package planning power 963.2 W; rack = 64 × 963.2 + 36000 = 97644.8 W. At 0.1 MW / 1.2, no full rack fits. At 2 MW, power supports 17 racks while supply supports six; doubling power still leaves supply-limited six. Commissioning and reliability are assumed/excluded. |
| C1 | Query 2: at temperature 1, attention ≈ [0.14003, 0.28400, 0.57598, 0], mixed ≈ [−0.43595, 0.28400], readout “memory.” At temperature 5, attention ≈ [0.28745, 0.33112, 0.38142, 0], mixed ≈ [−0.09397, 0.33112], readout “switch,” which fails query retrieval. Attention and readout each normalize separately. Extra memory/power does not change these hand-chosen vectors. |
| C2 | Weights remain 140,000,000,000 bytes. KV grows 20 → 80 GiB. With KV-first placement and 2 GiB workspace, overflow weights are 36,046,829,568 bytes; HBF moves those read-only weights from host, not KV. Present inventory fits, but fully occupied HBM leaves no room for the next 2,621,440-byte KV append under the current fixed-residency policy. Both context-32768 cases therefore withhold runnable rates despite different conditional transfer times. Stored byte totals are conserved. Remote data consumes source/link service and HBM staging writes/reads. Halving weight bits halves weights only; quality/kernel speed are outside this calculation. |
| C3 | Failed workload: 140 GB weights and 1280 GiB KV; missing weights 140,000,000,000 bytes, missing KV 1,005,659,111,424 bytes under the listed capacities/policy. Runnable rate is zero/withheld. At batch 1/context 8192, present inventory fits with 48,831,838,208 weight bytes in host, but fully occupied HBM still lacks room for the 327,680-byte append. At 8-bit weight storage with the same package and reduced workload, 70 GB of weights and 2.5 GiB KV fit with append headroom, so modeled execution becomes feasible. This does not establish unchanged model accuracy. HBF alone cannot eliminate missing mutable KV in the original failed workload; more facility power changes neither per-package capacity nor placement. |

Relevant source contracts: [investigation models](../../src/lib/investigation-models.ts), [numerical models](../../src/lib/numeric-math.ts), [wafer/package math](../../src/lib/deep-math.ts), [investigation interface](../../src/components/investigations.tsx), [reference system](../../src/lib/reference-system.ts). These references locate implementation; they are not independent scientific validation.


## Supplemental storage check — facilitator/device QA

This short check exercises the implemented “Hold a bit” stage without adding an assumed full-circuit timing model to the nine-card learning study. In a disposable review context, use the `Q0`–`Q3` fixture sequence as reference states; perform the actual control actions instead of importing after-states when testing interaction.

1. At reference A = 7, D = 1, stored Q = 0, and zero clock edges, inspect the storage diagram or text equivalent.
2. Apply one rising edge: Q becomes 1 and edge count becomes 1.
3. Change A to 6: D becomes 0, while Q remains 1 and the edge count remains 1.
4. Apply the next rising edge: Q becomes 0 and edge count becomes 2.
5. Export and reimport this state; verify A, D, Q, and edge count. Camera movement must not alter them.

This functional storage result assumes setup and hold requirements are satisfied. It does not calculate metastability, a complete flip-flop circuit, or the adder’s maximum operating frequency. The reference states are synthetic test data; this procedure is not a completed access test.
