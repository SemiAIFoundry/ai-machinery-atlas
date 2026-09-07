# Model lifecycle curriculum additions

This package adds 37 detailed lessons across eight chapters and appends advanced material to 15 existing lessons. Each addition has a worked relation, variables/units, regime, numerical example, learner check, source scope and prerequisites. Existing lesson text, checks, equations and prerequisite orientation remain intact.

The 423-parameter lifecycle decoder executes the explicitly labeled narrow mechanisms: causal forward/backward learning, token likelihood, constant-rate SGD/Adam with clipping, continuation/replay, one-turn response masking, DPO, a two-action verifiable-reward bandit, generation and checkpoint/evaluation state. The curriculum does **not** represent all 37 topics as simulators. BPE training, packed multi-turn templates, AdamW schedules, PPO/GRPO, reward-model fitting, adapters, distillation, calibration fitting, learned retrieval generation, multimodal training and world/action models remain worked mechanisms. Completing a lesson asset is not completing its proposed flagship experience or demonstrating learner mastery.

## Integration contract

- Add `src/lib/data/model-lifecycle-learning.json` to authored content packs. It contains chapters, complete lesson records, sources, scoped claims and empty milestone/timeline arrays; it preserves the historical timeline.
- Feed `model-lifecycle-enrichments.json.entries` to the shared additive enrichment merger after original enrichment. Append description/mechanism/example/evidence; concatenate additional checks, science and related/source references. Preserve the original primary check and prerequisite graph.
- Register `equations-model-lifecycle-learning.json` after existing equation packs. For the 15 existing IDs, its single entry is an **addition**, aligned with the appended science card. It must not replace or prepend to the original equation array.
- Existing runtime navigation, chapter/domain mapping and contextual model links remain root-owned integration work. Every new chapter declares the stable `learning-intelligence` domain and band 5. The lessons’ laboratory scope explicitly limits executable coverage.

## Reproduce

```sh
python3 docs/model-lifecycle/curriculum/generate.py --check-inputs
python3 docs/model-lifecycle/curriculum/generate.py
node --experimental-strip-types --test scripts/model-lifecycle-curriculum.test.mjs
node --experimental-strip-types --test scripts/model-lifecycle.test.mjs
```

The generator loads the approved `model-candidates.json` beside this script, independently of the current working directory. `--check-inputs` verifies its hash, 52 candidate dispositions, eight family assignments and 33 initial source anchors against `approved-candidates.json`, then exits without writing files. The generator adds three explicitly authored source anchors later, yielding the 36-anchor curriculum. All input files are packaged in the repository.

Running without `--check-inputs` recreates the original authored data and review-record templates; it writes three data files under `src/lib/data` plus the local source manifest and approved inventory. Run that authoring operation only when intentionally regenerating this layer, then compare its output and preserve subsequent review/integration records. The portability repair did not regenerate curriculum content.

Tests use the packaged approved ID/action inventory. The stored original focused curriculum suite has 26 passing tests. It checks candidate disposition, complete record fields, chapter ownership, current combined prerequisite graph, strict KaTeX/MathML, scope/source association, all major numerical examples and selected formula grouping. The original core/workspace suite separately had 26 passing tests, including independent ordinary-number forward and finite-difference gradient oracles, deterministic resume and the actual component’s pure import/exposure boundary. The separate portability record reports checks actually rerun during packaging.

The arithmetic fixtures independently recompute the examples. They are automated numerical evidence, not external scientific peer review or observed learner acceptance. The stored examples identify invented probabilities, state-transition rules and timing assumptions as authored; only explicitly named core fixtures report executed learning outcomes.

## Source and freshness record

`source-review-manifest.json` records 36 primary anchors with exact relevant sections, URLs/editions, actual check date, agent identity, claim/lesson associations and exclusions. It has 52 dispositions covering only new or appended material. Original lesson source review history remains separate. No human reviewer, publication date or source verification date has been invented.

`validation.json` binds focused results and a SHA-256 snapshot of the submitted files. Recheck affected source sections and formula/denominator tests whenever content, objective, tokenizer or executable coverage changes. If a worked mechanism gains an implementation, add its numerical oracle, data/evaluation contract and actual runtime evidence; update the scope label only after those exist. Preserve old dated review events. Specialist, device/accessibility and observed learner reviews remain distinct gates.

`portability-validation.json` records the packaging repair, original approved-plan hash and current identities of the portable input files. Only the plan's local `existingEvidence.repo` metadata was normalized to `.` (the repository root); candidate, family, source and other planning fields remain unchanged. The original manifests and their `fileSnapshots` remain historical submission records. The addendum supersedes only the generator, approved-inventory and README file identities for current portability checks. Original source-review actors, dates, dispositions and historical test results are retained; a portability check is not another scientific source review.
