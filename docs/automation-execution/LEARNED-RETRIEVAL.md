# Fitted retrieval → typed proposal → durable action

This experience actually updates numerical parameters and uses the fitted parameters during inference. Its boundary is a deliberately small fictional maintenance task, **incident-017**, using the same two reference manuals and inventory as durable automation. It is not a remote model, general language model, vendor agent or implementation of DPR/RAG at research scale.

## Executable contract

`src/lib/automation-learning-model.ts` exports `fitIncidentModel`, `inferIncident`, `evaluateLearnedRetrieval`, `validateLearnedArtifact` and the authored dataset. Fitting is deterministic for a seed and bounded configuration. Vocabulary fitting uses ten training requests and two reference texts. Two tuning requests and four evaluation requests are distinct strings and do not update vocabulary or weights. They are recombinations of familiar words/entities, not unseen-machine evaluation. The decoder's two action targets are training sentences, so its exact-sentence success is not held-out generation evidence. After readers repeatedly inspect evaluation results, those results become development feedback.

The retriever has two separate token-embedding tables, each with six columns. For query tokens `Q` and passage tokens `D`, known token occurrences are averaged:

```
q = sum(E_query[token] for token in Q) / |Q|
d = sum(E_document[token] for token in D) / |D|
score_j = q · d_j
p_j = exp(score_j) / sum_k exp(score_k)
L_retrieval = mean_examples(-log(p_correct_passage))
```

Unknown tokens contribute neither a learned vector nor a divisor term. An entirely unknown query receives the zero vector and ties both passages. All coordinates and scores are dimensionless; coordinates have no assigned semantic axes. The lexical baseline counts distinct exact token overlaps, not BM25. Both methods show a score softmax solely as a normalized ranking diagnostic, never a calibrated probability of correctness. Document-ID order resolves ties.

Full-batch gradient descent updates both embedding tables. Each query uses the other of the two manuals as its negative passage. Default controls are seed 17, 600 retrieval updates, 350 decoder updates and learning rate 0.5. The implementation exposes its gradients for independent finite-difference tests. Its six-dimensional mean encoder is an authored simplification of the learned dual-encoder/dot-product/negative-log-likelihood mechanism described in [DPR §3.1–3.2](https://arxiv.org/html/2004.04906v3). It uses no BERT, FAISS, pretrained parameters, in-batch large-corpus retrieval or transferred benchmark score.

After retrieval fitting, the document embedding table is frozen. Decoder features concatenate six context coordinates, a nine-category previous-token one-hot vector, a five-category position one-hot vector and a constant bias. A learned 9×21 matrix projects these 21 values to nine token logits. Cross entropy trains the two five-token targets; the target prior token supplies the next training input. At inference, greedy selection supplies the next prior token and generation stops at EOS or five positions. This is a linear conditional token model with a previous-symbol dependency, not a recurrent hidden-state network or transformer. The distinction between true prior tokens during training and generated prior tokens at inference follows the training/inference issue described in the [Scheduled Sampling abstract](https://arxiv.org/abs/1506.03099); scheduled sampling itself is not implemented.

The model's action facts arise from fitted context-dependent logits, not a document-ID lookup during inference. The only fixed output structure is the bounded vocabulary, maximum position count and parser grammar. Its tiny training set nevertheless permits memorization of both action sentences; that is disclosed. Feeding the opposite passage changes the generated machine/part/quantity. Removing context still permits outputs from learned biases and prior symbols. This illustrates conditional generation from retrieved material without claiming the marginalization, sequence model or evaluation of [RAG](https://arxiv.org/abs/2005.11401).

## Explicit candidate reranking

Between initial retrieval and context selection, readers can enable `rerank: 'entity-match'`. This is a separate **authored rule**, version `authored-entity-reranker-1`, not an additional fitted model. It recognizes the literal fixture aliases FAN-7 / fan 7 / fan seven and FAN-9 / fan 9 / fan nine. When exactly one distinct entity is named, it promotes retrieved candidates whose authored asset metadata matches that entity. Ties preserve initial retrieval order. Requests naming neither or both entities preserve the entire order. The rule does not understand negation: “Do not use FAN-9” still matches FAN-9. It cannot add a missing candidate, verify a source, resolve intent or grant authority.

`rerankIncidentCandidates(query, candidates)` exposes each candidate's initial rank, entity-match flag and resulting rank. The initial `ranked` array, numerical scores, softmax diagnostic, fitted weights and model identity remain unchanged. The `retrievalCorrect` diagnostic still describes initial retrieval against incident-017. Context interventions apply after optional reranking. Query “reserve parts for fan nine” with lexical retrieval illustrates the distinction: the tied initial scores choose FAN-7 by ID order; the rule promotes FAN-9, yielding a source-supported proposal that still fails the fixed FAN-7 incident objective.

The [Passage Re-ranking with BERT abstract](https://arxiv.org/abs/1901.04085) documents a contrasting learned reranking approach. This experience implements no BERT, learned cross scorer or paper benchmark. Its narrower rule makes the placement and limits of a second selection stage directly inspectable.

## Actual interventions and independent checks

| Intervention | Executed change | What can be concluded |
| --- | --- | --- |
| Learned vs lexical ranking | Learned embedding dot product vs distinct exact-token overlap, same query and corpus | Whether these two retrieval rules choose the target passage in this fixture |
| Optional entity reranking | Reorder the existing candidates using explicit query-entity aliases and authored asset metadata | Whether a separate rule changes selected context while preserving retrieval scores and fitted parameters |
| Zero gradient updates | Use seeded initial parameters | Whether fitting changes objective and downstream behavior |
| Force other reference | Feed the second-ranked current text after retrieval and optional reranking | A source-supported proposal may target the wrong incident |
| Missing reference | Feed the zero context vector | Generation can continue without evidence; an authored gate abstains |
| Stale reference | Change the quantity in the selected text and mark that authored revision stale | Learned output can conflict with context; an authored revision gate abstains |
| Runtime reference changed | Workflow search returns text different from the frozen proposal context | The bridge refuses the old proposal before reservation |

Source support is a deliberately exact fact check against the controlled sentence grammar: do the generated asset and quantity/part phrase occur in the supplied context? It is not a general entailment model. Incident field correctness independently checks FAN-7/FILTER-A/2. Neither diagnostic changes generated tokens. The proposal gate checks context presence/current revision and parseable syntax; it does not secretly replace wrong predictions with correct task facts. The runtime then independently validates tool arguments, enforces capabilities, requests exact human review and evaluates final inventory/work-order state. A wrong FAN-9 proposal can pass all service contracts, produce a supported FAN-9 work order and still fail incident-017. That is an intentional executable counterexample.

The source-current flag is authored metadata for these fixtures; no real document signature or live revision service is simulated. Runtime text equality is the concrete binding check in the shared corpus. No uncertainty threshold is learned or claimed. Unknown words and two-way score ties remain visible rather than becoming fabricated semantic confidence.

## Versioned handoff and journal compatibility

`src/lib/automation-learned-bridge.ts` exports:

```ts
createLearnedHandoff(model, request): LearnedActionHandoff
validateLearnedHandoff(value): LearnedActionHandoff
learnedPolicyAdapter(handoff): PolicyAdapter
```

The handoff has version `atlas-incident-proposal-1`, task `incident-017`, corpus `atlas-incident-manuals-1`, model version `atlas-incident-learned-1`, frozen parameter tables and loss traces, fitting options, request/context intervention and regenerated token distributions/result. It is a separate artifact from the lifecycle experiment's symbol decoder, a trained model checkpoint for a different vocabulary/task, a workflow journal or a human approval.

Reranking is a backward-compatible optional request field: `rerank?: 'none' | 'entity-match'`. Existing three-field requests retain their exact shape and produce no new result key. Explicit `none` produces the same result. Active reranking adds the versioned `result.reranking` trace, which is recomputed during handoff validation and retained through journal export/reload. The adapter's displayed policy description includes the reranker version; its configuration identity remains the frozen fitted model identity. No handoff, model or journal version changes for this optional stage.

Artifact validation bounds the data shape and finite numerical ranges, checks its content-derived identity, reruns the declared bounded fitting recipe and compares weights/loss traces. Up to eight reproduced fits are cached for validation only. Numerical comparisons allow relative/absolute tolerance `1e-10` for insignificant math-library differences; strings, booleans, schema, task/corpus identities and generated token choices must match exactly. The ID is a noncryptographic content checksum, not a signature or source-authenticity proof. The handoff validator recomputes frozen inference and rejects conflicting generated text or claimed diagnostics. The UI accepts at most 250,000 bytes for a fitted proposal. Existing workflow archives retain their 500,000-byte limit.

`JournalDocument.learnedHandoff` is optional. Existing authored journals remain valid. A learned run saves the whole validated handoff before its first transition. `createAutomationRun(scenario, handoff?)` and `workspace.start(scenario, handoff?)` accept it. The engine reconstructs its adapter from the saved document; it never silently falls back to an authored reservation after reload. Replay checks that proposed calls and their model identity match the frozen handoff and authored continuation. Archive validation still independently executes recorded effects against the fixture. The existing raw backup, exact approval fingerprint, separate environment commit, receipt recovery, import and stale-workspace checks remain active.

The adapter's outer workflow is authored: read the incident asset, search the current reference set, submit the learned reservation, obtain/recover its receipt, then create the linked work order. It does not claim the fitted model chose this entire plan. The `schema-error` case deliberately converts the generated numeric quantity to a string after generation; the schema boundary rejects that injected type fault. `wrong-entity` reorders runtime references but does not overwrite the upstream frozen selection. A learned proposal from the stale/missing intervention reaches the authored refusal, not a business write. No generated output can authorize registry export or approve its own reservation.

Model fitting/generation happens before the synthetic workflow clock. The E5 service/queue/review counters do not count neural inference runtime, device work, model tokens, energy or networking cost. Policy and corpus identities appear in both views and the workflow archive.

## UI integration

```tsx
<RetrievalLearningExplorer
  onSelect={(lessonId) => openLesson(lessonId)}
  onAutomation={(handoff) => { setHandoff(handoff); openStudio('automation'); }}
/>
<AutomationExplorer onSelect={openLesson} handoff={handoff} />
```

`RetrievalLearningExplorer` is the default export of `src/components/retrieval-learning-explorer.tsx`; both callbacks are optional. It shows controls separate from applied fitting state, request/reranker/condition inputs, actual index scores, a separate candidate-reranking trace, source text, generated tokens with per-token probability meters, all six coordinates, loss tables, train/tuning/evaluation examples and four-condition comparison. The fitted proposal can be exported/imported without implying workflow progress. These local learning controls reset on an ordinary unpreserved mount; exported proposals restore them. The durable workflow saves its own accepted handoff independently. Root owns any broader studio persistence/navigation integration.

Navigation sends a proposal for inspection only. **Start run from learned proposal** explicitly starts the new fictional environment and retains the prior raw run through the existing backup transaction. **Approve this reservation** remains the concrete independent human action. Both baseline authored policies remain available through **Start configured run** and the baseline comparison. No hidden network call, API key or general model reasoning is introduced.

## Validation and remaining boundaries

Run from the repository root:

```
node --experimental-strip-types --test scripts/automation-learning-model.test.mjs scripts/automation-execution.test.mjs scripts/automation-learning.test.mjs
npx tsc --noEmit
```

The learned suite has 35 tests, including hand-derived uniform losses (`ln 2`, `ln 9`), central finite differences for both encoder tables and decoder features, objective decrease, data split/vocabulary boundaries, frozen determinism, real context ablations, source-vs-task counterexamples, malformed artifacts, learned handoff import/reload before proposal, exact review, authority denial, cancellation, duplicate delivery, lost acknowledgement, interrupted result append, schema corruption and backup failure. Reranking tests independently check changed selection with unchanged weights/scores, missing candidates, ambiguity and negation limits, intervention ordering, old-request compatibility, durable trace recovery, authority denial and tamper rejection. Strict request tests reject enum arrays and nonfinite fitting rates. The existing 35 execution and 16 curriculum tests also remain relevant. Browser interaction/phone layout validation belongs to root's integrated QA, not to these Node results.

This completes a bounded learned-request/retrieval/proposal bridge and preserves runtime authority. It does not supply open-domain QA, general conversational generation, actual external model inference, learned long-horizon planning, multi-agent coordination, remote retrieval, production identity or distributed storage. The small held-out retrieval denominator and trained action vocabulary must stay visible when describing the experience.

Primary-source review metadata is in `learned-source-review.json`. Data-leakage handling follows the official [scikit-learn guidance on train-only fitting](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage), with the narrower fixture/generalization caveats above.
