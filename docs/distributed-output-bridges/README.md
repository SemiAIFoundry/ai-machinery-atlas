# Distributed computation to useful output

This additive pack contributes four lessons and one chapter to the existing compiler, distributed execution and decoding sequence. It preserves the original content, runtime models and 76-event history. There are eight canonical equations, four qualified evidence cards and six primary references. The chapter belongs to `executable-software`, band 4.

| New lesson | Gap after the existing material | Worked result |
| --- | --- | --- |
| `sharded-matmul-ownership` | `compiler-layout-lowering`, `nccl` and `parallelism-communication-budget` describe partitioning and collectives, but do not reconstruct one product through explicit output ownership. | Two contracted-axis partial matrices become C = [[19,22],[43,50]]. The stated reduce-scatter plus all-gather sends 32 payload bytes across both ranks. |
| `distributed-gradient-weighting` | `parallelism` gives a uniform global-batch count; it does not derive the objective under unequal local item counts. | Two and six squared-error samples require global gradient 2.5 rather than rank-mean gradient 2. Correct scalar SGD gives 9.75 instead of 9.8. |
| `floating-point-reduction-order` | `quantization` treats scalar representation error and compiler lessons discuss legal transformations; they do not demonstrate the reduction-order consequence. | Binary32 additions of [2²⁴, 1, −2²⁴] produce 0 or 1 under the two explicit groupings. |
| `speculative-decoding-verification` | `output-head` mentions speculative scheduling but does not explain strict acceptance, residual correction or accepted-output counting. | A three-symbol correction recovers target probabilities exactly; the iid two-proposal example emits 1.96 tokens per round on average. |

The partition example follows the semantic distinction in [JAX’s sharded matrix multiplication tutorial](https://docs.jax.dev/en/latest/notebooks/shard_map.html) and [NCCL’s collective definitions](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html). Its two-rank exchange and all numeric values are authored.

The distributed-gradient lesson uses the default averaging contract in [pinned PyTorch v2.8.0 source](https://github.com/pytorch/pytorch/blob/v2.8.0/torch/nn/parallel/distributed.py). The loss and unequal-batch derivation are explicit teaching mathematics; custom communication hooks and exhausted-rank join behavior require separate treatment.

The rounding lesson uses [NVIDIA’s archived floating-point guide](https://docs.nvidia.com/cuda/archive/13.1.1/cuda-programming-guide/05-appendices/mathematical-functions.html) and [LLVM’s fast-math permissions](https://llvm.org/docs/LangRef.html#fast-math-flags). It does not assert that a compiler enables reassociation by default. Its local binary32 checks are not a GPU experiment.

The decoding lesson applies the strict correction rule from [Leviathan, Kalman and Matias, ICML 2023](https://proceedings.mlr.press/v202/leviathan23a.html). The toy distributions and timing inputs are synthetic. Target-distribution preservation does not establish factual correctness, identical seeded samples or measured acceleration.

## Files and integration

- `src/lib/data/distributed-output-bridges.json`: compatible content pack with lessons, chapter, sources, claims and empty milestones/timeline arrays.
- `src/lib/data/equations-distributed-output.json`: two canonical equations per lesson, aligned to the science array order.
- `scripts/distributed-output-bridges.test.mjs`: numerical, equation, graph and evidence checks.
- `docs/distributed-output-bridges/source-review-manifest.json`: actual source locators, editions, check dates, agent identity, scope limits and per-lesson review dispositions with complete candidate snapshots.
- `docs/distributed-output-bridges/validation.json`: automated evidence and file hashes; `numerical-tests.tap` retains the test output.

Root owns catalog, science-panel and validator integration, lab mappings and contextual links from existing studio experiences. The source/math author owns only the new pack, equation file, focused test and this evidence folder. Existing calculators provide context under their own limits; the complete new numerical mechanisms are in each lesson’s worked text and structured `workedTrace`.

## Reproduce and curate

Run from the repository:

```sh
node --experimental-strip-types --test --test-reporter=tap scripts/distributed-output-bridges.test.mjs
node node_modules/typescript/bin/tsc --noEmit
```

The 16 tests check output reconstruction independently of the authored partials, unequal-batch gradients against a finite-difference objective, binary32 results by two rounding mechanisms and 441 target/draft distribution pairs including support gaps. The tests do not run JAX, PyTorch, LLVM, NCCL or a language model.

When a lesson changes, compare its source, equation, denominator, assumptions and dependencies with the stored snapshot. A compiler/library upgrade, custom reducer, new dtype, changed tokenizer or acceptance rule triggers the source-specific review recorded in the manifest. Living documentation has a 180-day reminder; pinned, archived or paper sources have a 365-day reminder. A reminder date never certifies freshness or creates a new source-check event. Keep prior events when a replacement source or revised example supersedes a claim.

The source and arithmetic checks identify `/root/curriculum_assessment` as an agent. Integrated mappings can be checked separately against the candidate snapshots. Human specialist, physical-device, assistive-technology and learner reviews remain distinct; none is implied by these automated results.
