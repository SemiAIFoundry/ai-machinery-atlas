# Evaluated application models (R26)

These portable assets connect data, optimization, evaluation and resources through two small applications with every input visible. The sensor case fits a logistic classifier; the retrieval case ranks a fictional manual and copies a cited sentence. Both compute real numerical outputs from authored toy data. Neither measures equipment performance or a production AI system. The runtime modules have no app, browser, network or package dependencies.

## Integration API

```ts
import {
  runSensorApplication, runRetrievalApplication,
  sensorDataset, retrievalDataset,
  type SensorOptions, type RetrievalOptions,
  type SensorApplicationResult, type RetrievalTrace,
} from './evaluated-applications.ts';

const sensor = runSensorApplication({
  steps: 24, learningRate: .3, featureSet: 'both', l2: 0,
  decisionThreshold: .5,
});
const retrieval = runRetrievalApplication({
  topK: 2, minScore: .1, answerMode: 'slot-filtered',
  queryId: 'question-03',
});
```

`evaluated-applications-content.json` contains UI labels, control ranges/defaults, both datasets, learning prompts, worked fixtures and a scoped source catalog. Generate it from the module to keep displayed numbers consistent. Copy the four `.ts` files together; their imports are relative. Exported options accept their fully resolved output again, supporting versioned case persistence. Store the model/data version with saved options and reset the displayed trace cursor on any option change. The helpers expose normalization, prediction, objective/gradient, indexing, scoring, grading and tuning; top-level `run…` functions validate the supported controls.

The sensor `steps` array is zero-indexed. Each entry contains the parameters before the update; each sample's scaled features, logit, probability, label, prediction, loss and gradient; the mean data gradient; the L2 contribution; and the parameters/objective after a simultaneous batch update. `evaluationAfter` is diagnostic evaluation only and never feeds an update. A zero-update run exposes the initial classifier. Training-row predictions use the chosen decision threshold; that threshold does not participate in fitting.

The retrieval `selectedQuery.trace` exposes tokens, ignored terms, query weights, all ranked documents, overlapping term products, selected passage IDs, parsed slots, exact answer/citation and hypothetical per-query cost. `selectedQuery.grade` exposes four citation checks and separate source support, expected value and task correctness. `tuning` and `evaluation` contain all question traces/grades. `calibration` shows eleven threshold trials and the recommendation derived from tuning only; applying that recommendation remains an explicit control change. The question selector accepts IDs from either split, which must remain visibly labeled.

## Sensor arithmetic and limits

For each active feature, use the training mean and population standard deviation (denominator 8). The logit is `z = b + w₁x₁ + w₂x₂` and `p = 1/(1+exp(-z))`. Average binary cross-entropy contributes `(p-y)x` to each weight gradient; add `λw`, while leaving the bias unpenalized. Update all parameters together by subtracting the learning rate times the gradient. These equations follow the logistic model and loss derivation in [CS229 §2.1, pages 21–24](https://cs229.stanford.edu/main_notes.pdf); the selected batch average and L2 convention are explicit model choices. Stable equivalent implementations avoid overflow in the sigmoid and cross-entropy.

The 8 training and 6 evaluation readings are invented. Their labels follow an authored vibration threshold of 2.5 mm/s, which is a teaching convention with no real equipment meaning. Training temperature and vibration correlate; two evaluation cases break that relationship. Fitting preprocessing on training alone follows the [scikit-learn data-leakage guidance](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage). Showing evaluation feedback repeatedly makes this an exploration dataset; choosing settings from that feedback does not preserve an untouched generalization test.

At the defaults, the computed weights are approximately `[1.104257, 1.370437]` with bias `0.017714`. All 6 evaluation cases are classified correctly. This denominator is six authored examples, not evidence of general sensor reliability. With temperature alone, the warm/low-vibration case (`eval-05`) receives probability `0.904146`, causing a false positive; the cool/high-vibration case (`eval-06`) receives `0.168595`, causing a false negative. That gives TP=2, TN=2, FP=1 and FN=1: accuracy and recall 4/6 and 2/3 respectively, and false-positive rate 1/3. A decision threshold changes confusion counts without changing weights or cross-entropy.

Precision is `TP/(TP+FP)`, recall `TP/(TP+FN)` and false-positive rate `FP/(FP+TN)`. See the [official metric definitions](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.precision_score.html). This model returns `null` for an undefined denominator and requires both specified quality criteria to be evaluable and pass. Defaults of recall ≥0.8 and false-positive rate ≤0.2 are user-editable teaching constraints, with no certification meaning.

## Retrieval arithmetic and limits

Seven single-fact passages describe fictional Alder, Birch and Cedar bench devices. Vocabulary and document frequency come only from these passages. ASCII word/number tokenization and a listed stop-word set are intentionally simple. The model uses raw term frequency times `ln(N/df)`, then query/document cosine similarity. This is an explicit variant of [TF–IDF weighting](https://nlp.stanford.edu/IR-book/html/htmledition/tf-idf-weighting-1.html) and [query-vector cosine ranking](https://nlp.stanford.edu/IR-book/html/htmledition/queries-as-vectors-1.html). Scores are similarities, not calibrated probabilities. Unknown terms are excluded from the query vector; a zero-norm query retrieves nothing. Positive scores survive `minScore`, then the top K are selected, with document ID breaking score ties.

`top-passage` copies the highest-ranked surviving fact. `slot-filtered` takes the first fact matching a known entity and a narrow attribute keyword group. The parser picks the first entity mentioned, without understanding negation, reference or general paraphrases. Six tuning questions calibrate a score threshold; seven distinct evaluation questions measure selected behavior. Expected fact IDs affect grading, never indexing or answer construction.

At the defaults, 5/7 evaluation questions are task-correct: three correct answers and two correct abstentions. Four questions receive answers, and all four exact citations support their copied sentences. However, `question-03` asks for Birch after mentioning Alder; the parser selects Alder's 20 ms interval, not Birch's 50 ms interval. Its source support is true and its task correctness is false. A paraphrase the parser does not recognize causes the other error. Retrieval recall at K is 5/5, so merely including the expected passage cannot guarantee the answer selector uses it. The default minimum task accuracy of 0.8 therefore fails. The top-passage policy answers all seven with corpus-supported sentences but achieves only 4/7 task correctness.

Support means exact agreement with a known fact's fields and document, response text and citation quote. It does not establish truth outside the authored corpus or semantic support for arbitrary generated prose. Abstaining is correct only when the expected fact set is empty; source support among answers has denominator `answered`, while task accuracy has denominator all questions. If there are no answers, support is `null`, and the combined quality gate does not silently pass.

## Resource scenarios and validation

Sensor inference cost is `fixed + activeFeatures × MAC cost + sigmoid cost`. Defaults produce 20.14 µs. Retrieval cost is `fixed + dictionaryProbes × probe cost + contextTokenCount × token cost`. These are editable synthetic arithmetic assumptions, never observed timings. Context tokens are ASCII words/numbers, not provider billing tokens. Sensor coefficient payload assumes 8 bytes per coefficient; the retrieval index assumes a 4-byte term ID and 8-byte weight per nonzero pair. Both exclude runtime objects and other overhead. Core training work counts exclude diagnostic evaluations, scaling and tracing. Quality and hypothetical latency are separate gates; the asset does not combine them into a vendor performance ranking.

Run from this folder with Node supporting native type stripping:

```sh
node --experimental-strip-types --test evaluated-applications.test.mjs
node --experimental-strip-types generate-application-content.mjs
node --experimental-strip-types validate-application-assets.mjs
```

The validator also runs strict TypeScript checking when `ATLAS_TSC_PATH` points to `typescript/bin/tsc`; without a compiler, that check is explicitly marked not run. It records the Node version, tests, source hashes and generated fixture agreement. Tests include an independent scalar training reference across 27 settings, finite-difference gradients, a dense-vector retrieval reference for every question, data-split isolation, corrupted citations, failure cases and cost/quality separation. This is automated implementation evidence. No specialist review, physical-device validation or learner study has been claimed.
