# Real decoder inference, KV reuse and finite serving admission

`causal-kv-serving-1`, portable schema 1. The underlying trained model remains `causal-decoder-lifecycle-1` (423 parameters). This experience connects a full training or distributed checkpoint to real incremental inference and an authored bounded serving scheduler. It does not estimate hardware speed.

## Integration and API

Default React component `src/components/model-lifecycle-serving.tsx`: `ModelLifecycleServing({checkpoint?: LifecycleRun, distributedCheckpoint?: DistributedTrainingRun, onSelect?: (id: string) => void})`. CSS is scoped in the adjacent file. Proposed studio ID: `serving`. Keep the component behind the studio lazy boundary. It has its own transactional file import/export; do not wrap it in the older fixed-schema record store.

The pure `src/lib/model-lifecycle-serving.ts` module exports `lifecycleServingVersion`, `lifecycleServingMetadata`, `lifecycleServingLimits`, `lifecycleServingDefaults`, types and these functions:

- `createLifecycleKvCache(weights)`, `appendLifecycleKv(weights, cache, token)`, `prefillLifecycleKv(weights, tokens, cache?)`: actual incremental one-layer causal inference. Return retained K/V, current Q/attention/hidden/logits/probabilities and explicit arithmetic accounting.
- `createLifecycleServingRun(lifecycleCheckpoint?, config?)` or `createDistributedServingRun(distributedCheckpoint, config?)`: freeze the complete source and make a new request queue. Distributed input uses its current committed weights, retaining its separate four-example update history; it does not masquerade as a lifecycle checkpoint.
- `stepLifecycleServingRun(run)`, `finishLifecycleServingRun(run)`, `cancelLifecycleServingRequest(run, requestId)`: immutable bounded actions. `servingIsFinished` checks terminal state.
- `servingWeights`, `servingSourceCheckpoint`, `servingMemory`: expose the numerical model and memory denominator.
- `serializeLifecycleServingRun`, `readLifecycleServingRun`: bounded portable records. Import validates the source/configuration and replays the command log, then compares all computed requests, caches, RNG, outputs, timing fields and event traces before returning.
- `importLifecycleServingWorkspace(text, exposureJournal, expectedRevision, currentRevision, config?)` accepts all three record types. Validation and revision guards run before final-exposure journal changes; invalid/stale imports preserve the current run. `retainServingExposure` keeps the shared procedural final-test disclosure through older imports and resets.

The record retains the full source checkpoint, configuration, three or fewer request states, per-request sampling RNG, actual active cache and bounded command/event history. No source optimizer state or training RNG is changed by inference. Exported cache state is checked by replay; the record is not authenticated evidence.

## What is computed

Each new processed token uses the original fixed sinusoidal position signal, pre-RMS normalization, learned Q/K/V projections, causal attention, residual projection, tanh feed-forward layer and vocabulary head. Past K/V rows are reused; the numerical implementation does not call the full-prefix forward to compute its output. The scheduler separately calls the existing full-tape forward as an independent reference. Binary64 requires maximum probability difference below 1e-10; approximate KV instead reports the difference and whether its greedy token changed at that prefix. In this single-layer architecture K/V come from normalized positional embeddings; do not generalize that simplification to every layer of a deep model.

[Transformers cache documentation](https://huggingface.co/docs/transformers/v4.57.1/cache_explanation) supports retaining past K/V and advancing absolute cache positions during causal inference. The implementation mirrors the local tiny model, not a downloaded Transformer implementation. No training cache is enabled.

The numerical KV payload is 2 (K and V) × 1 layer × 1 head × 6 coordinates × 8 binary64 bytes = **96 bytes per processed token position**. This excludes JS containers, diagnostic copies, source checkpoint, weights and other activations. A token writes 12 KV scalars and logically reads 12 times the current context length. Dense projection multiply-add pairs are 3×6×6 + 6×6 + 6×12 + 12×6 + 6×9 = 342 per processed token; query-key and attention-value products add 12 times context length. Normalization, nonlinearities, bias additions and softmax remain additional arithmetic. These are algorithmic counts, not HBM traffic or measured FLOPs/s.

A request reserves prompt length + requested new tokens − 1 KV positions. The last emitted output is not fed back unless another prediction is needed. Conservative reservation guarantees capacity for all allowed output steps; an oversized request is rejected explicitly. EOS, the output limit or cancellation releases live KV and reservation. Diagnostic snapshots can remain visible after release, outside this finite serving arena.

## Scheduler and a worked contrast

Each synthetic iteration admits eligible requests in FIFO order subject to batch slots and reservation capacity, executes one prefill chunk or decode step per active logical lane, then releases completed requests. A queued request that temporarily cannot fit prevents bypass; a request that can never fit is explicitly rejected. Continuous policy reconsiders admission every iteration; static policy waits for the active group to drain. These authored policies are informed by [Orca's iteration-level scheduling](https://www.usenix.org/conference/osdi22/presentation/yu). No claim is made to implement its distributed execution engine.

On the initialized seed-7 model, set request 1's output limit to one, request 3's arrival to iteration 1, prefill chunks to one and capacity to 24. Continuous admission starts request 3 at tick 5 and completes it at tick 12. Static admission starts it at tick 8 and completes it at tick 15. The generated request sequences are identical in both schedules. The difference follows the assumed slot/admission rules; these ticks are neither measured milliseconds nor a device-performance prediction.

With the same seed-7 model actually pretrained for 320 updates, the default three requests generate `[a, EOS]`, `[a, EOS]`, `[b, EOS]`, matching their expected first answers. Their first-token times are 3, 4 and 7 synthetic iterations. These are tiny training/development fixtures, not untouched-test evidence or broad capability results. Sampling uses independent per-request RNG streams; changing batch scheduling does not reassign random draws between requests.

[PagedAttention sections 2–4](https://arxiv.org/html/2309.06180v1) ground the distinction between prompt processing, autoregressive generation, dynamic KV state and finite batching capacity. This implementation uses conservative reservations and contiguous logical arrays; it does not implement paged allocation, prefix sharing, kernel fusion, preemption or offload. It carries over none of the paper's empirical speedups.

## Validation and remaining review

`node --experimental-strip-types --test scripts/model-lifecycle-serving.test.mjs scripts/model-lifecycle-speculation.test.mjs` passes 39 tests (31 serving and eight speculation). `npx tsc --noEmit` passes. Reports and scope-specific source checks are adjacent. Tests check all eight cache positions against independently implemented full-tape arithmetic for initial/other-seed/trained weights; chunk equivalence; greedy and sampled full-prefix outputs; 18 policy/chunk/slot combinations; actual learned answers; capacity and FIFO boundaries; EOS and cancellation; distributed current-weight import; complete deterministic KV/RNG resume; tampered records; bounded malicious inputs; stale import and persistent final exposure.

Limits: one to three requests, at most eight processed positions/request, one or two generated tokens, three batch slots, a byte budget of up to 24 × 96 bytes, 64 step commands plus at most three cancellations, and 1.8 million serialized characters. Browser, physical device, assistive technology, learner and specialist review remain separate gates and are not claimed by the automated report. Browser storage disclosure is procedural and can be manually cleared; final fixtures remain inspectable source data.

## Actual approximate KV representation

`LifecycleServingConfig.kvFormat` selects `binary64` (default) or `int4-symmetric`. For each six-coordinate K or V row, the authored format uses `scale = max(abs(row))/7`, signed integer codes −7…7 with nearest rounding/ties away from zero, two's-complement nibble packing, and actual unpack/dequantization before attention. A zero row uses scale 1 and zero codes. Code −8 is unused and rejected. `quantizeLifecycleKvRow` / `unpackLifecycleKvRow` expose the calculation.

Packed K/V codes take 12 × 4/8 = 6 bytes per position; two binary64 scales add 16 bytes, for **22 bytes total**, versus 96 binary64 bytes. The byte budget remains `kvPositions × 96`; effective position capacity is floor(byte budget / selected bytes per position). Reconstructed numerical vectors and debug copies remain outside this declared packed-payload arena; this is not a measurement of JavaScript heap allocation. A 384-byte budget fits four binary64 positions or 17 approximate positions. Full-precision weights, queries, normalization and other activations remain unchanged.

The approximation is executed, not just labeled as cheaper. An independent oracle quantizes the full model's raw K/V, rebuilds attention and the remaining layers, and agrees with incremental approximate output. For seed 3 and training prompt `train-copy-a-uuu`, maximum output-probability difference is 0.0009286491 while greedy token changes from `ask` to `<answer>`. Reduced payload does not guarantee unchanged quality.

[KIVI section 3.1](https://arxiv.org/html/2402.02750v2) supplies a concrete quantize/dequantize error mechanism and sections 3.2–3.3 explain that real K/V formats depend on grouping and outlier structure. Our symmetric per-row 4-bit format differs from KIVI's asymmetric per-channel/per-token groups and residual cache; none of its empirical accuracy or speed results are claimed.

## Authored draft verification at the same target weights

`src/lib/model-lifecycle-speculation.ts` exports `lifecycleSpeculationVersion = 'authored-draft-target-greedy-1'`, metadata, `verifyLifecycleDraft(weights, prompt, [proposal0, proposal1])`, and an independent `referenceLifecycleGreedy`. The UI lets a learner propose two vocabulary tokens for the selected request. This diagnostic always verifies against the actual binary64 target greedy rule, independently of the queue's sampling/quantization settings; authored proposals are not a learned draft model.

The target builds its prompt cache and a tentative branch containing the first proposed token, producing both conditional verification distributions. Matching proposals are accepted in order. At the first mismatch the dependent suffix is discarded; a target greedy fallback is emitted. If the first proposal failed, its tentative KV row is discarded and the fallback token's KV is actually recomputed before generating the second target output. A second-position mismatch needs an output correction without replacing the already accepted first-token KV. EOS stops generation and discards any unused post-EOS state. No bonus token is generated past the two-token limit. The final output must equal independently computed full-prefix greedy output.

On the actually pretrained checkpoint, proposals `[a, EOS]` for the first copy prompt are accepted; `[b, EOS]` discards one wrong-prefix KV row and recomputes the fallback `a`; `[a, b]` retains the accepted `a` cache and replaces the second output with EOS. All three finish with `[a, EOS]`. Tests enumerate all 81 two-token proposals for both initialized and learned weights and verify identical target outputs, plus conditional probabilities, EOS, input bounds and source immutability.

[Leviathan et al., sections 2.1–2.3 and Algorithm 1](https://proceedings.mlr.press/v202/leviathan23a/leviathan23a.pdf) establish proposal verification, dependent-prefix rejection and distribution correction. This bounded greedy exercise omits a learned draft, stochastic probability-ratio acceptance, corrected sampling, bonus output and parallel kernels. Its cache work is real but no acceleration or reduced target-call count is claimed. Draft selectors are a diagnostic preview; the portable serving queue retains its own source/configuration/command trace.
