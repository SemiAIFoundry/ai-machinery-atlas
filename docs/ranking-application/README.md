# Exposure-aware ranking

This is a complete, bounded recommendation experiment using authored users, items, propensities and potential feedback. It trains an actual three-parameter scoring model, compares recommendations for two separate evaluation users and exposes why selection correction has limits. It is not a real-user study, production recommender, fairness audit or representative benchmark.

## Reproduce and integrate

```sh
node --experimental-strip-types --test scripts/ranking-application.test.mjs
node --experimental-strip-types docs/ranking-application/reproduce.mjs
```

The [model](../../src/lib/ranking-application.ts) exports `buildRankingApplication(input)`, `createExposureLog`, `observedRankingSamples`, `fitRanking`, `rankingObjective`, `rankingMetrics`, `rankEvaluationUser`, `zeroSupportWorlds`, and strict input serialization. [RankingApplication](../../src/components/ranking-application.tsx) accepts optional `onSelect(id)` and has no account requirement. Its shared portable control preserves inputs and displaced raw records under the existing bounded storage contract. Four explicitly authored equations use the shared HTML/MathML renderer with symbols, units and text alternatives.

[example-input.json](example-input.json) is directly restorable. [example-log.json](example-log.json) contains the full declared log, including fields explicitly marked as author-only potential outcomes. [scenarios.json](scenarios.json) contains complete input records and computed outcomes for eight cases. Running the reproduction script with `--write` regenerates these fixtures deliberately; a normal run verifies them and their source fingerprints.

## Experimental population and missing feedback

Six training users each have eight eligible items and two visits: 96 possible observations. Two distinct evaluation users share the catalog and never supply a training click. User features are two authored topic preferences; item features are hardware content, model content and declared popularity. The scorer never receives user identity, item identity, usefulness grade or unshown feedback as a fitted feature.

The exposure policy is either π = 0.6 for every row, π = 0.1 + 0.8 × item popularity, or that popularity policy with π = 0 for items whose popularity is below 0.5. A reproducible pseudorandom draw selects exposure by `draw < π`. These are the probabilities of the ideal declared random-assignment design; they are not estimated from the selected finite log. The deterministic seed replay itself is not a statistical experiment establishing randomness or unbiasedness.

Potential binary feedback is authored before exposure using a separate fixed seed, 331027. Changing the exposure seed/policy leaves it unchanged. The potential-click probability is a convex mixture of `0.1 + 0.8 × topic match` and `0.1 + 0.8 × popularity`. The appeal input selects the mixture. Changing appeal changes the response process and can change potential outcomes. An unshown row stores `click: null`, not zero.

Only shown features, clicks and propensity values enter `fitRanking`. The potential outcome on an unshown row exists solely so this artificial experiment can audit missingness; a real click log would not supply it. A test poisons those author-only fields and confirms that fitting inputs and parameters stay unchanged.

## Actual fitting and its limits

The logit has an intercept, a user–item topic-match coefficient and an item-popularity coefficient. The scorer applies a sigmoid. Gradient descent starts from zero and uses learning rate 0.2 for the selected number of updates. Its binary cross-entropy is evaluated stably as `max(score,0) − click × score + log1p(exp(−abs(score)))`. L2 regularization applies to the two non-intercept parameters. These are pointwise click scores, not proven calibrated probabilities or a learned embedding model.

Observed-only fitting averages loss over the shown rows. Inverse-propensity fitting sums each shown loss divided by its exposure probability, then divides by **all 96 eligible rows**. It does not divide by the sum of weights. The clipped option caps each inverse weight; the misspecification option substitutes 0.6 for the true probability. Different denominator/weight conventions also change the relative effect of the regularizer, so loss values across different objectives are not directly comparable.

[Schnabel et al., ICML 2016, §3.3 Eq. 10 and §4.1 Eq. 12](https://proceedings.mlr.press/v48/schnabel16.pdf) provide the propensity-risk and weighted-learning framework. Positive assignment probabilities and the appropriate propensities matter. The local logistic scorer is an authored implementation of that bounded principle; it is not the paper's matrix factorization. For a **fixed** score function, enumerating every exposure pattern of a separate three-row fixture proves the expected inverse-weighted risk equals full-population risk. A fitted function depends on the same observations; its training-risk estimate is not independent evaluation. Neither finite-sample improvement nor lower ranking error follows automatically.

Weight concentration `(sum w)² / sum(w²)` describes the selected weights. It is not a claim of independent observations or a confidence interval. The raw Horvitz–Thompson mean of binary feedback can leave [0,1] in finite samples; it is never clamped into a probability. Clipping and incorrect propensities change the estimator's expectation, as separate exhaustive tests demonstrate.

The zero-support counterexample creates two authored worlds that change only never-exposed potential outcomes. Their observed samples are identical, but their population means differ by 48/96. Even a perfect small evaluation score cannot recover this missing information.

[Joachims et al., WSDM 2017, §§5.1–5.2 and 7.5](https://www.cs.cornell.edu/~tj/publications/joachims_etal_17a.pdf) distinguish examination, clicks, relevance and propensity misspecification under particular models. Here exposure is directly logged, shown no-clicks are observed binary feedback, and no rank-position examination process is modeled. The appeal counterexample deliberately makes clicks favor popularity while the task still values topic usefulness. Exposure correction cannot redefine the task. The paper's position-based SVM-Rank and noise assumptions are not claimed for this logistic example.

## Evaluation contract

Each evaluation user ranks all eight items. The task's authored usefulness grade is 2 for topic match ≥ 0.7, 1 for match ≥ 0.45, otherwise 0. Gain is explicitly transformed to `2^grade − 1`. DCG@k discounts gain by `log2(rank+1)` and NDCG divides by the best ordering of the same eight candidate grades at the same cutoff. An all-zero ideal gain returns zero by convention. Equal predicted scores use stable item ID order rather than tie averaging.

The [scikit-learn 1.7.2 NDCG definition](https://scikit-learn.org/1.7/modules/generated/sklearn.metrics.ndcg_score.html) supports the discounted-gain/ideal-gain normalization. Our exponential grade transformation is explicit preprocessing, not an undocumented assumption about that library's input convention. scikit-learn is not executed. Independent hand calculations and all 243 five-item grade combinations test the local metric.

Grade 2 defines relevance for recall and precision. Recall divides top-k relevant hits by **all relevant candidates for that user**; precision divides by k. Reported means average the two users equally. They are not click-weighted or restricted to exposed items. The baseline sorts declared catalog popularity without learning.

At the default seed, 45 of 96 observations are shown. The selected IPS fit has mean NDCG@3 ≈ 0.921787; the observed-only fit scores 1; the popularity baseline ≈ 0.039107. With appeal = 1, correctly weighted fitting still obtains the popularity-like score and zero recall for grade-2 usefulness. The example is deliberately honest about a finite correction doing worse and about task mismatch. These authored figures are teaching cases, not evidence about a population.

Evaluation users are disjoint, but repeated inspection/tuning on this visible two-user exercise is exploratory evaluation, not an untouched final test. Repeated-user effects, slate interference, position biases, hidden confounding, estimated propensities, fairness and causal business outcomes remain outside the model. No actual person supplied a click or preference.

## Evidence and scope

[source-review.json](source-review.json) records actual AI-agent primary-source readings and exact locators, without human specialist approval. [validation.json](validation.json) records focused numerical, schema, math-rendering and fixture checks. Browser, physical-device, learner and instructor observations are not inferred from passing model tests.

This application gives the existing `recommendation-ranking-feedback`, `training-data`, `loss-optimizer` and `evaluation` lessons an executable task boundary. It advances the wider application roadmap without claiming to cover all recommendation, user research or societal evaluation mechanisms.
