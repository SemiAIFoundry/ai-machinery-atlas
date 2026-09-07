# The actual decoder query projection enters the machine

`decoder-query-machine-1` connects a supplied complete `LifecycleRun` to the existing `machine-execution-1` through an explicit precision adapter. It executes an actual selected operator from that checkpoint. It does not replace the checkpoint with the architecture tab's independent integer specimen.

The source is the atlas's synthetic nine-token, six-coordinate causal decoder. Without a carried or restored checkpoint, the component explicitly uses initialized seed 7; it does not call those weights trained. A carried checkpoint retains its optimizer, sampler, history and prior final-test exposure in portable records. This experience performs no updates, generates no final-test cases and does not change model weights.

## Exact mathematical connection

Select a known copy-domain training or development prompt. Inspect the actual decoder forward pass for that prompt, before its answer token. Preserve the first three prompt positions and the first three query output channels. Every inner coordinate remains present:

```text
original query operator: (prompt length × 6) × (6 × 6)
selected query slice:    (3 × 6) × (6 × 3) → (3 × 3)

X[p,k] = (embedding[token[p],k] + position[p,k])
         / sqrt(mean_k((embedding + position)^2) + 1e-5)

Q[p,j] = sum(k=0..5, X[p,k] × WQ[k,j])
        = X[:,0:3] WQ[0:3,:] + X[:,3:6] WQ[3:6,:]
```

The source's sinusoidal positional term has amplitude 0.15. Its RMS rescaling uses width six, epsilon `1e-5`, no centering and no learned gain or bias. Actual query weights occupy row-major checkpoint indices `54 + 6*k + j`. The bridge verifies that its extracted floating-point product agrees with `inspectLifecycleForward(...).queries[0:3,0:3]` before proceeding. Independent tests reconstruct embeddings, positional terms, normalization and query multiplication directly from checkpoint values without using the bridge's helpers.

The query projection mixes coordinates **within** each position; it does not mix token positions. The later causal attention mask applies to `QKᵀ` scores. Attention scores, softmax, value mixing, residuals, feed-forward work, logits, target loss masks and gradients are outside these two machine executions. The full response-only shifted target mask is shown as contextual data only.

## Precision and execution

Each of the four operand tiles independently uses symmetric zero-point-zero quantization:

```text
maximum M ∈ {7, 31, 99}
s = max(abs(tile)) / M
q = sign(x) × min(M, floor(abs(x)/s + 0.5))
x_hat = s × q
```

Zero tiles use `s=1, q=0`. A positive scale is clamped below by `Number.MIN_VALUE` solely to avoid underflow to zero for subnormal binary64 inputs. Ordinary fixture values do not activate that numerical edge case. Ties round away from zero, including negative ties. Each tile executes the existing machine's actual mapped reads, staging ownership, integer MACs, output writes and host ownership return. Its result is `machine.finalOutput`; neither the decoder reference nor a separate matrix helper supplies the accepted result.

The host computes `sA0*sB0*Cint0 + sA1*sB1*Cint1` using binary64. Each integer tile accumulation is bounded by `3*99² = 29,403`, so signed-int32 output narrowing is exact. The rescaled output is not inserted back into the decoder and is not re-quantized.

For one operand term with perturbations bounded by `eA=sA/2` and `eB=sB/2`, expansion of `(A+dA)(B+dB)-AB` gives the absolute bound `|A|eB + |B|eA + eAeB`. Summing that bound over all six inner coordinates bounds each query entry's operand-quantization error. Zero tiles use a zero perturbation bound. The displayed bound excludes floating-point roundoff; tests use a separate tolerance. The maximum absolute error, RMS error and relative Frobenius norm use only the nine selected query entries. Relative error is unavailable for an all-zero reference. A larger code range tightens the ordinary step-size bound; observed error need not decrease monotonically for every checkpoint.

## Bytes, clocks and the intentional failure

Every integer code is stored as a **four-byte signed int32 little-endian word**, regardless of M. There is no packed int4/int8 format or inferred low-bit memory saving. The word inspector provides tile identity, operand coordinate, original activation/weight coordinate, original weight index, integer, four hexadecimal bytes, IOVA, physical address and actual mapped status.

Across two invocations, selected original binary64 operands are 36 scalars / 288 B. Integer operand payloads are 36 words / 144 B, allocated in four padded 48 B buffers / 192 B. Four binary64 scales add 32 B outside machine traffic. Each completed tile also has nine logical output words / 36 B and three 16 B writes / 48 B. Padding and repeated operand reads are included in transaction traffic, not in logical scalar payload. This is a declared machine word representation, not the size of JavaScript objects or checkpoint JSON.

The two machine invocations are sequential. They have independent address spaces and refresh origins. Each event carries a tile-local machine clock and an offset joined machine clock. Equal-time actions retain ordered indices. A rescaled running accumulator is explicitly a partial preview; acceptance occurs only after both tile outputs have returned to the host and the final combination event occurs. Normalization, quantization, CPU initialization, scale transfer, rescaling, final host addition and reference checking have no assigned service time. Sum the two machine schedules only; do not interpret that sum as measured browser time, a whole-model kernel schedule or hardware latency.

The fault option leaves the second tile's B input unmapped. That actual machine mapping guard prevents its reads and MACs. Tile one remains complete, but there is no complete projection, no invented error metric and no combination event. This is a software mapping fault independent of geometry, refresh settings or physical error probability. The bridge does not yet feed its tensor into the network or joined ECC experience.

## Interface and reproducibility

```ts
buildDecoderProjection(checkpoint, selection = decoderProjectionDefaults)
sampleDecoderProjection(result, orderedEventIndex)
serializeDecoderProjection(checkpoint, selection)
readDecoderProjection(raw) // { checkpoint, selection }

// React; root owns the learning-checkpoint handoff and studio registration.
<DecoderProjection checkpoint={run} onSelect={selectLesson} />
```

Selection contains `exampleId`, `quantizationMax`, `bankPlacement`, `buffers`, `refreshEveryNs` and `fault`. Position, channel and inner-coordinate bounds are fixed by the versioned adapter. Imports require exact envelope/selection/model fields and the decoder's validated complete checkpoint. The bridge also rejects sparse arrays, erased values, non-finite numbers and incompatible identities. Source checkpoint JSON is limited to 600,000 UTF-8 bytes and the envelope to 650,000 UTF-8 bytes. No imported derived results are trusted. Portable saved records use the explicit 650,000 B limit, preserve older exact raw records through the shared recovery workflow, and recompute the trace on restore. File imports reject stale source/selection revisions before replacing state. The shared manual text-entry field remains limited to 20,000 characters.

From the repository root with Node 22.13+:

```sh
node --experimental-strip-types --test scripts/decoder-projection.test.mjs scripts/machine-execution.test.mjs
node --experimental-strip-types docs/decoder-projection/reproduce.mjs
```

The 18 projection tests cover independent source arithmetic, full inner dimension, query orientation, asymmetric signs and ties, zero/subnormal values, randomized quantization bounds, reconstruction from exact payload bytes, actual MAC traces, schedule-only controls, completion gates, clock origins, strict record validation, full trained checkpoint roundtrip, exposure retention and source immutability. Together with 20 existing machine tests, **38/38 pass**. TypeScript checking also passes. These are automated software checks by the authoring agent, not an independent specialist or human learning review. Root owns browser and lesson-navigation validation.

The generated `scenarios.json` records seven reproducible cases, including initialized and two-update checkpoints, a coarse code range, changed scheduling and the mapping fault. Its expected outputs are generated fixtures, not independent proofs; the tests above supply the separate references.

## Primary source scope

RMS rescaling without re-centering is motivated by [Zhang and Sennrich, Root Mean Square Layer Normalization (2019), abstract](https://arxiv.org/abs/1910.07467). The exact epsilon, lack of learned gain and positional formula here come from the atlas's existing toy decoder; they are not claims about the paper's full architecture.

Scale-aware integer products and a product of operand scales are supported by [Jacob et al., Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference (2017), §§2.1–2.2, equations 1–5](https://arxiv.org/html/1712.05877v1#S2.SS1). The paper's general affine zero points, fixed-point output rescaling, fused operators, calibration, quantization-aware training and benchmark performance are not reproduced here. The local symmetric per-tile quantizer, `M` choices and machine timing are authored teaching choices. Precise reviewed locators and support boundaries are recorded in `source-review.json`.

## Short teaching sequence

1. In Learning, make two updates and carry that checkpoint to Projection. Match optimizer step, weight identity and source query indices.
2. Explain why two 3 × 3 products are needed for a width-six projection. Set a query coordinate and inspect its six inner products.
3. Lower M to 7; identify changed codes and scales, then compare the accepted projection error. Four-byte word size stays fixed.
4. Move banks or use one staging slot. Follow the changed queue/ownership schedule while checking that final arithmetic stays identical.
5. Unmap the second B tile. Locate the guard and explain why the first tile cannot substitute for missing coordinates.
6. Restore a saved trained-source workspace and verify that the source, selection and recomputed result agree.
