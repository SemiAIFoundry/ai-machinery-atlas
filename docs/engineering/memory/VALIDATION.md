# Software validation

Validated 2026-09-07. All 15 Node tests pass: six standalone address/state tests and nine tests against the existing atlas modules loaded read-only. Strict TypeScript checking also passes with the actual `systemScenario`, `referenceSystem`, `hbmStackDefaults` and `bondRoutes` types supplied to the adapter.

Tests verify exact addressing above 32 bits and through 12-die boundaries; row-hit/conflict command order and independent bank state; bit/byte separation; strict input rejection; exact existing stack height and thermal results; geometry partitioning; micrometre unit conversion; distinct known-good, test and qualification gates; unchanged conditional survival; workload-byte conservation; independent source, staging and later read traffic; selected-stack allocation; bounded next-step recovery; and rejection of inconsistent context totals.

The current default stack has height 586 µm, peak model temperature 52.9035 °C and capacity 24,000,000,000 bytes. Its address explorer covers 17,179,869,184 bytes and labels the remaining capacity as outside this declared window. Default scoped qualification is pending; the 3,321.415308049921 modeled good stacks are visible but accepted example output remains zero. Assuming a synthetic qualification pass permits that expectation within the teaching contract.

With context length 32,768, the current 16-bit workload fits the aggregate tiers but lacks bounded next-step KV headroom. Using 8-bit weights restores headroom. Enabling the HBF read tier moves 36,046,829,568 weight bytes there in the long-context example, but does not by itself repair headroom. A 16-die TC-NCF stack exceeds the existing height limit and stays ineligible even when all synthetic evidence gates are set to pass.

Nine complete input examples reproduce these outcomes. All nine source IDs, six linked lesson IDs and local Markdown bundle links were checked. The source ledger separates published mechanisms from the model's invented address organization, control presets and geometric analogies.

No device measurements, real package qualification, instructor observations or learner sessions are represented as completed.
