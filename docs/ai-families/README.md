# Contrasting computational structures

Five small experiments expose different operations and failure modes. The same score is not used to rank unrelated tasks.

| Specimen | Actual computation | Deliberate boundary |
| --- | --- | --- |
| Conditional experts | Two ordinary-least-squares scalar fits, top-k score normalization, route capacity and accepted-output error | The sign-based gate is authored, not trained. Dropped routes reject the whole output. |
| Persistent state | A scalar linear recurrence and independently unrolled finite convolution, with an explicit reset | No trained S4, selective state-space model or language benchmark. |
| Spatial evidence | Two authored 3×3 valid cross-correlation filters on 5×5 images; nine patch vectors and one identity-projection attention query | No learned convolution or visual-language encoder. Edge placement exposes the limited classifier. |
| Signal spectrum | Thirty-two samples, an optional symmetric Hann window, exact complex DFT and displayed power per bin | No speech recognition, mel model or power spectral density estimate. Aliasing occurs before the transform. |
| Denoising | Stored noisy scalar examples at twelve variance levels, a fitted nearest-neighbor noise regressor and seeded reverse transitions | No trained neural denoiser or image generation claim. A single sample's distance to ±1 is not a distribution-quality metric. |

The specimens reveal why architecture, data representation and task assumptions matter together. Increasing expert count changes a mixture's function, persistent state changes information lifetime, a local filter has spatial boundary behavior, sampling can erase distinctions, and a learned denoiser depends on the training distribution and approximation regime.

## Reproduction

Run `node --experimental-strip-types --test scripts/ai-family-models.test.mjs` for independent numerical references, intentional failure cases and record validation. Run `node --experimental-strip-types docs/ai-families/verify-fixtures.mjs` to record current implementation hashes and scenario outputs. Records contain validated inputs and content/model identity. Restoring recomputes outputs; it does not certify an independently observed result or complete a lesson.

## Source scope

The primary-source scope dispositions are in `source-review.json`. They support named equations and architectural ideas, not the invented corpus, parameter settings or measured performance. The 3D scenes orient the learner to information structure. Exact arrays and interventions are in the executable experience, including a table-based path that does not require 3D.

External specialist and learner observations remain open.
