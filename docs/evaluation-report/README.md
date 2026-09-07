# An identified evaluation report

The report runs the existing eight-row sensor fitting procedure. It carries the fitted parameters, normalization, feature selection and update count into a stable model identity, then selects a temperature from {0.5,1,2,4} using four newly authored calibration rows. The six original diagnostic examples remain separate from fitting and calibration.

The report recomputes every probability, decision and accepted row. It exposes accuracy, mean binary log loss, Brier score, coverage and error conditional on acceptance with explicit denominators. Five fixed positive-probability bins show observed positive frequency, not top-class accuracy. Empty bins and zero accepted denominators are unavailable. These few synthetic rows do not establish population calibration or a secret benchmark.

A deliberate contamination switch replaces one diagnostic row with a training-family copy under a new sample ID. The duplicate is detected through retained family identity. This is a declared-identity check, not semantic deduplication or a guarantee that all unknown contamination is absent.

The serialized record contains model, calibration, dataset and report identities plus the input recipe. Import recomputes the complete report and rejects disagreement before replacing the workspace. Short FNV IDs are convenient labels, not authentication; source/build hashes are separately provided by the atlas.

Eight focused tests verify cohort separation, fixed model identity under threshold/calibration changes, independent metrics, empty denominators, renamed duplicates, bin semantics record reproduction and the 0–80 update boundary shared with the sensor model. Run `node --experimental-strip-types --test scripts/evaluation-report.test.mjs`.

Primary scope: Guo et al., *On Calibration of Modern Neural Networks*, [arXiv:1706.04599v2](https://arxiv.org/abs/1706.04599v2), supports temperature-based post-processing and the calibration problem. The model and data here do not reproduce its neural architectures or experiments. The linked scikit-learn leakage guidance supports keeping fitting operations out of the evaluation data. The agent read these primary scopes on 2026-09-07; no independent human specialist or learner observation is claimed.
