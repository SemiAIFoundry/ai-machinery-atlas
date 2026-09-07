# A small causal model through its learning lifecycle

This experience implements a real, bounded decoder with **423 trainable parameters**, a reverse-mode derivative tape and actual parameter updates. The same checkpoint can continue into a changed domain, assistant-response-only supervision, DPO or a one-token verifiable-reward experiment. It is the first complete E1/E2 teaching case, not completion of every model-lifecycle candidate.

## Reproduce and integrate

```sh
node --experimental-strip-types --test scripts/model-lifecycle.test.mjs
npx tsc --noEmit
```

The component is a default export from `src/components/model-lifecycle.tsx`, with optional `onSelect:(lessonId:string)=>void`. Its CSS is scoped and imported by the component. It uses existing studio primitives but **does not use StudioRecordStore**. Root integration should lazy-load this destination and keep its full numerical/data module out of the readable entry.

The pure API in `src/lib/model-lifecycle.ts` exports:

- `createLifecycleRun(config)` initializes a decoder and training RNG.
- `advanceLifecycleRun(run, steps)` returns a new state after 1–40 actual updates; input state is untouched.
- `forkLifecycleRun(run, stage, configPatch)` retains weights, optimizer moments and RNG, records a parent identity, and freezes a new reference snapshot.
- `evaluateLifecycleRun(run, split)` computes copy/swap metrics; final evaluation requires explicit prior exposure.
- `openLifecycleFinalTest(run)` records the first final report and evaluated checkpoint identity.
- `inspectLifecycleForward`, `inspectLifecycleExample`, `generateLifecycle` expose forward values, probabilities, masks, gradients and real autoregressive output.
- `lifecycleSupervisedObjective`, `lifecycleDpoObjective`, `lifecycleRewardObjective` expose independently testable losses and derivatives.
- `serializeLifecycleCheckpoint`, `readLifecycleCheckpoint`, `validateLifecycleRun` enforce versioned full-state contracts.
- `lifecycleSchemaMetadata`, `lifecycleTensors`, limits and version constants describe the implementation to integration/curation tools.

No application dependency is required by the pure modules. Runtime fingerprints are compact deterministic identifiers for teaching, **not cryptographic signatures**; this document's source manifest uses SHA-256 for file snapshots.

## Exact scope

Vocabulary size 9, hidden width 6, feed-forward width 12, context limit 8 input tokens, one causal attention head. Learned token embeddings receive fixed sinusoidal positions scaled by 0.15. The block has RMS normalization without learned gains (epsilon 10⁻⁵), attention with learned Q/K/V/output projections, a residual, a normalized tanh feed-forward block and a second residual. A separate learned output matrix and bias predict the next token. Positions, normalization gains and tokenizer are fixed; every listed parameter is trainable.

This is an authored small decoder variant. It is not an exact implementation of the original encoder–decoder Transformer, a named commercial model, RMSNorm's trainable-gain configuration, LoRA, an MoE, PPO or GRPO. It uses JavaScript binary64 arithmetic, not mixed precision. There is no weight decay, dropout, distributed training or performance estimate. The constant learning-rate schedule is part of checkpoint configuration.

The raw weights occupy 423×8 = **3,384 bytes** under the binary64 payload convention. Weights plus two Adam moment arrays occupy **10,152 bytes**. Those figures exclude gradients, activation tape, JavaScript objects, history, references and checkpoint serialization. Tape-node counts are actual scalar graph nodes, not FLOPs or hardware transactions.

## Data and evaluation boundary

The fixed tokenizer maps whitespace-separated authored symbols directly to nine IDs. It is not fitted on any split and does not train BPE. Source identity, author/date, vocabulary identity, document family, split, domain, token sequence, target and response mask are explicit in `model-lifecycle-data.ts`.

Each domain has 12 training, 8 development and 4 final examples. Symbol/filler families are disjoint across splits. Copy training uses homogeneous fillers; development and final reserve different mixed compositions. The two domains share prompts but demand opposite answer symbols. This deliberate conflict makes acquisition/retention tradeoffs visible: perfect simultaneous copy and swap accuracy is impossible without extra task information. It is not a claim about generic continual-learning behavior.

Only training examples enter gradients and sampling. Development answers are displayed continuously and are **development feedback**. The final split is procedurally sealed until opened; the underlying source is inspectable. The first final report retains its evaluated weight identity and update number. Subsequent changes do not rewrite it. Reset/import cannot undo exposure remembered by the current workspace/browser. A new browser or source inspection defeats this teaching seal; it is not benchmark security.

## Objectives and state changes

Pretraining and continuation minimize token-mean negative log likelihood over shifted targets. Continuation changes the domain mixture; replay is sampled from the declared copy fraction. Two sequences form each batch, and valid targets determine the denominator.

SFT trains only the answer and end token. Prompt targets contribute no loss. This is a one-turn symbol dialogue with an explicit answer marker, not a complete production chat-template framework.

DPO uses the sum of answer/end-token log probabilities for chosen and rejected responses. The objective is equation 7 of the cited paper with a frozen branch-reference model. Chosen labels are authored swap answers, not recorded human preferences. Loss is averaged by preference pair, not token. Improving DPO loss does not guarantee better full-vocabulary task accuracy; the UI reports the latter independently.

Reward training samples four answers per prompt from the model's **conditional two-action a/b distribution**. It uses REINFORCE with a detached, exactly computed expected-reward baseline and adds exact categorical KL against the frozen reference. The baseline cancels in expectation because the sum of policy-probability derivatives is zero. Gradients do not flow through sampled actions, rewards or the baseline. This is a contextual bandit with a single discrete action, not free-form language reasoning. The faulty checker rewards every `a`; a rewarded wrong answer is directly inspectable.

Adam uses β₁=0.9, β₂=0.999 and epsilon 10⁻⁸ with bias correction. Global norm clipping precedes moment updates. The SGD option uses the clipped raw gradient; moment arrays continue accumulating so returning to Adam has an explicit retained-history meaning. Stage transitions preserve optimizer history, while resetting a model clears it. Optimizer choice is separate from training objective.

## Actual automated evidence

The 27-test numerical and workspace suite checks independent forward calculations, finite-difference gradients across every tensor group, SFT masks, causal prefix invariance, initial optimizer equations, exact checkpoint resume, DPO gradients, frozen-rollout score-function/KL gradients, generation and invalid-state rejection. Results are captured in `test-results.txt` and `validation.json`.

With default seed 7 and learning rate 0.015, 320 base updates currently yield **8/8 development copy answers** and, when explicitly opened, **4/4 final copy answers**. A 120-update SFT fork yields **8/8 swap** and **0/8 copy** development answers. These are actual fixture computations with a deliberately simple and conflicting task—not broad language competence, learning efficacy or model safety evidence. No hard-coded curve or precomputed trained weights are used.

The suite also checks that a stored checkpoint resumed for 23 updates equals an uninterrupted 40-update run after a 17-update save, including optimizer/RNG/cursor/history. A weights-only reset of optimizer moments produces a different result.

## Persistence and UI review boundaries

The workspace provides explicit local save/restore and full JSON export/import. An independent browser exposure marker and in-memory journal survive earlier imports and resets; importing an exposed record immediately persists the marker even before a weight save. Invalid imports are parsed/validated before replacing state; an asynchronous file read is rejected if the run changed while reading. Chunked training checks cancellation/unmount identity and never writes browser storage automatically. Local saved bytes are not erased when loading fails.

The JSON contract rejects unknown fields, incompatible versions, oversized arrays/history/files, nonfinite numbers, invalid tokens/source IDs and inconsistent counters. Limits bound context, batch, parameters, rollout count and updates. Imported reports are schema-checked teaching records, not authenticated empirical evidence.

This handoff includes source inspection, numerical tests and TypeScript checking. Browser interaction, physical devices, accessibility learning tasks and human specialist review are separate integration gates; none is implied by the numerical test count.

## Sources

Primary locators, checked dates, actor, scope, exclusions and file snapshots are recorded in `source-review-manifest.json`. The architecture follows scaled attention, causal masking and positional mechanisms from [Attention Is All You Need](https://arxiv.org/html/1706.03762v7), with a declared normalization variant anchored by [RMSNorm equation 4](https://arxiv.org/html/1910.07467v1). Derivative mechanics are grounded in [PyTorch autograd notes](https://docs.pytorch.org/docs/2.14/notes/autograd.html); the implementation itself is independent TypeScript.

[DPO equation 7](https://arxiv.org/html/2305.18290v3), [Adam's documented algorithm](https://docs.pytorch.org/docs/2.14/generated/torch.optim.Adam.html), [score-function estimation](https://docs.pytorch.org/docs/2.14/distributions.html#score-function) and [assistant-only supervision](https://huggingface.co/docs/trl/sft_trainer) support the selected objectives. Toy data, dimensions, task conflict and controls are authored teaching choices. Source checks do not imply reproduction of the cited research experiments or human peer review.

## Connected handoffs

`ModelLifecycleProps` accepts an optional initial `checkpoint`, `onCheckpoint(run)` for the initial and each committed state, and explicit `onDistributed(run)` / `onServing(run)` handoffs. Callbacks receive cloned full state. Buttons are disabled during chunked training. The independent exposure journal refreshes storage before retaining a checkpoint, so another mounted workspace cannot restore an older untouched-test disclosure after exposure was recorded elsewhere.

Actual weighted rank updates are documented in `distributed/README.md`; actual KV inference, quantization and authored draft verification are documented in `serving/README.md`. All branches retain their distinct data/optimizer and inference-state semantics.
