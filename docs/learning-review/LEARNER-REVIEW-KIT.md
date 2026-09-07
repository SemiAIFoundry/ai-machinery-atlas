# Atlas investigation review kit

Prepared 7 September 2026. Kit version: `atlas-review-kit-1`. **Status: proposed protocol; no participant, physical-device or assistive-technology results are recorded here.**

This kit operationalizes approved ROADMAP R08–R10 and R12–R18, with R25 evidence ownership. It does not close those items by existing, reduce the rest of the approved roadmap, or establish learning efficacy. Phase 3 publication remains dependent on actual phase 2 evidence. [Approved roadmap](../roadmap/ROADMAP.csv) · [Assessment, sections 7–9](../roadmap/ASSESSMENT-AND-ROADMAP.md) · [Implementation ledger](../roadmap/IMPLEMENTATION.md).

## Use these files

1. [Participant task scripts](participant-task-scripts.md): nine cards, three per investigation, followed by a facilitator-only answer key.
2. [Device and accessibility checklist](device-and-accessibility-checklist.md): real-device, keyboard, screen-reader and degraded-resource task checks.
3. [Observation template](observation-template.md): copy once per session; preserve unassisted attempts and later practice separately.
4. [Launch gates](launch-gates.md): required evidence, responsible roles and explicit pending states.
5. [Review fixtures](review-fixtures.json): 31 task-stage documents across nine cards, four functional storage states, and three explicitly synthetic history/import records. Each nested `document` is an import candidate; the enclosing fixture collection is not an app import file.
6. [Fixture generator](generate-review-fixtures.mjs): recomputes expected values from the shipped pure models, checks arithmetic/conservation invariants, and verifies every nested document with the app parser. From the repository root, run `node --experimental-strip-types docs/learning-review/generate-review-fixtures.mjs`.

The scenario fixtures are reviewer setup data, not learner responses or measurements. Do not import an after-state before recording that task's prediction. Reconfirm source/content/model identity and expected values against the exact candidate build before each round; implementation is changing. The [shipped process definitions](../../src/lib/data/process-mechanisms.json) and [process reviewer guidance](reviewer-guidance.md) provide the separate manufacturing review basis.

The current document contract has `version: atlas-investigations-1`, `contentVersion: atlas-learning-2026-09-07`, and `checkVersion: investigation-prompts-1`. Every scenario includes the stored bit and clock-edge count as well as the continuous and integer controls. The fixture file records SHA-256 digests of all four calculation sources. A matching version label alone does not prove that a changed source still reproduces the same numbers.

Fixture parsing and arithmetic checks are preparation evidence only. They do not establish completed browser import/export, preserved conflicting histories, physical-device access, specialist validation, or learner understanding. All such gates remain pending until actual records are attached.

## Session plan

Observe 6–9 actual sessions: two or three curious beginners, two or three technically trained learners, and two or three engineering/instructor users. Prior familiarity is self-reported; record concrete experience rather than using group labels as a score. This small diagnostic sample cannot establish effectiveness, retention, population accessibility, or comparative benefit.

Each participant completes one card from each investigation. The rotation below gives every card two exposures in six sessions and three in nine, while varying task order. IDs are proposed slots, not recruited people.

| Slot | Intended group | Card order |
|---|---|---|
| P01 | Curious beginner | A1 → B2 → C3 |
| P02 | Curious beginner | B1 → C2 → A3 |
| P03 | Technically trained | C1 → A2 → B3 |
| P04 | Technically trained | A1 → B2 → C3 |
| P05 | Engineering/instructor | B1 → C2 → A3 |
| P06 | Engineering/instructor | C1 → A2 → B3 |
| P07, optional | Curious beginner | C1 → A2 → B3 |
| P08, optional | Technically trained | B1 → C2 → A3 |
| P09, optional | Engineering/instructor | A1 → B2 → C3 |

Allow 40–60 minutes: 5 minutes introduction, 8–12 minutes per card, 5–10 minutes export/restore and debrief. These are planning allowances, not success thresholds. Offer a break or stop; record incomplete tasks. Accommodations and assistive technology may require more time. Keep device QA distinct from novice learning sessions; a person may contribute both only when the roles and assistance are recorded separately.

### Before a session

- Freeze the candidate identity: URL, source commit or source digest, content version, model version, check/rubric version, timestamp. Missing identity is a release finding, not a reason to invent a value.
- Use a dedicated review profile or obtain a backup of existing learning files before setup. Never clear a participant's personal work as a convenience. Explain what will be saved; use a participant code in artifacts. Record only consented observations; recording audio/video requires separate consent and is optional.
- Verify the assigned three baseline configurations and corresponding facilitator key. Do not show changed-state outputs or the reasoning guide before the prediction. If a displayed result is already visible, record that exposure; do not call the answer an unaided prediction.
- Show only navigation mechanics in orientation: selecting a case, finding the learning tab, changing a control, and exporting work. Do not teach the scientific answer. When card wording differs from the app's general prompts, tell the participant to prefix their response with the card ID and answer the card; record any confusion this causes.
- For a new case, save the prediction and its baseline scenario before running the change. Later explanation/transfer text belongs to practice. If first-attempt capture is unavailable, retain the dated observation response and file a product finding; that workaround does not pass R17.

### Read aloud

“We are reviewing the atlas. Please tell us what you expect before you change a value, then use what you can inspect to explain the result. Uncertainty is useful. We will record where the interface helps or gets in the way. You can skip a task or stop. The numerical scenarios are synthetic teaching models.”

Use neutral probes: “What are you looking for?”, “What does that number mean to you?”, and “What would you do next?” Avoid naming a bottleneck, pointing to the answer, or confirming correctness until the first attempt is captured. Log the exact help given.

## Prediction, explanation and transfer rubric

Score each dimension separately, with the evidence excerpt. Do not sum these into mastery, pass rates, or an efficacy claim. Record `not_observed` when the interface or session prevented an answer; do not convert it to zero. Keep the initial prediction score unchanged after explanation or practice. An incorrect initial prediction can be valuable formative evidence.

| Score | Prediction, before changed output | Explanation, after inspection | Transfer, before trying the unfamiliar case |
|---|---|---|---|
| 0 | An answer is given but contradicts the relevant modeled relationship without a defensible reason. | Repeats a number or gives a contradictory mechanism. | Repeats the original result despite a changed condition, or makes an unsupported general claim. |
| 1 | Names a plausible direction or outcome with weak/incomplete reasoning. | Identifies an appropriate quantity, representation or constraint, but misses a consequential link or unit. | Recognizes a difference or limitation but cannot apply it to the new case. |
| 2 | Correctly predicts the relevant direction/invariance or feasibility, identifying the changed and held inputs. | Connects cause → modeled state → result using correct quantities/units and at least one relevant boundary. | Applies the mechanism to the new condition and identifies an important assumption or additional evidence needed. |
| 3 | Meets 2 and gives a justified quantitative relation, constraint transition, or checkable conditional prediction. | Reconciles at least two representations, checks a relevant invariant, and distinguishes model evidence from a product or qualification claim. | Gives a defensible new prediction, explains when it would fail, and proposes a specific discriminating measurement or evaluation. |

Precision should match the objective: a beginner may express doubling and masking in words; unfamiliar notation alone is not a scientific error. Record calculation mistakes separately from conceptual mistakes. The facilitator key states essential concepts, not required wording. A correct number without a mechanism cannot earn explanation 2–3.

Record assistance independently: `H0` none; `H1` neutral prompt or ordinary access accommodation; `H2` navigation/control hint; `H3` scientific or procedural answer supplied. An accommodation is not evidence of weaker understanding. Record whether assistance changed the scientific content available. Do not compare raw completion times across access modes as learning performance.

## Synthesis and revision

One learning reviewer and one relevant domain reviewer independently score a shared sample from each investigation before dividing the rest. Retain both scores and rationale where they disagree; reconcile using the actual response. With a sample this small, describe disagreements rather than claiming rubric reliability from a coefficient.

Report task-by-task counts with denominators, actual devices, assistance, exposures, missing observations and exact build identities. Separate observation (“P03 read the available-memory table as including unplaced KV”) from interpretation (“the inventory heading may hide failure”). Attach a reproducible UI issue or content revision. A repeated critical misunderstanding triggers revision, but one clear product-caused critical error is sufficient to block the affected gate. Recheck the corrected path, including a fresh unfamiliar transfer case where feasible; previously coached participants alone cannot demonstrate initial comprehension.

This kit uses formative observation to find problems. Broader efficacy, retention and comparative-learning claims require a later study design and evidence beyond these sessions.
