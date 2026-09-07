# Infrastructure source-scope review

Actual review: 7 September 2026. Actor: AI agent `/root/final_ledger_audit`. This is an agent review of six complete effective lessons, their chapter interpretation, formal equations, knowledge checks, examples, references, structured claims and declared dependency/visual scope. It is not human specialist approval or a URL-availability-only audit.

[source-review-events.json](source-review-events.json) contains six accepted current-content events and one preserved earlier `changes-required` event. [review-validation.json](review-validation.json) records exact fingerprints and snapshot hashes. Existing global review events and scheduling files were not edited by this reviewer.

| Lesson | Current result | Concrete review boundary |
| --- | --- | --- |
| Facility phases and geographical evidence | Accepted after editorial correction | Nonoverlapping phases, dated status, common units and no unverified census completeness |
| Compatible supply and converging bottlenecks | Accepted | Compatible screened BOM inputs; remaining losses and readiness remain separate |
| Energy forecasts, geography and measurement boundaries | Accepted | Estimated baseline versus conditional projection; US and global scopes overlap |
| Grid interconnection and deliverable electrical capacity | Accepted after correction | Consistent load-side usable-energy convention across question, explanation and formal model |
| Production ramps, inventory and allocation | Accepted | Counts versus rates, lead time and access; no inferred private supplier queue |
| Siting, regional infrastructure and access to compute | Accepted | Dated construction/procurement evidence; preference-dependent normalized decision aid |

Eight distinct primary URLs, 11 current lesson–source uses and four distinct structured claims were checked. Exact source locators and findings are in each event. The review opened the actual OpenAI, Google, EuroHPC, TSMC, IEA, LBNL and PJM source pages. The TSMC annual report passages were read in its PDF; the LBNL review is limited to the cited laboratory abstract, consistent with the lesson's explicit limitation. No unseen full-report methodology is certified.

The review found a real inconsistency in the grid lesson: its formal equation used energy already deliverable at the load, while the question and prose implied an additional deduction for conversion losses and reserves. Root corrected the four relevant fields in `src/lib/data/infrastructure.json`; the reviewer re-read the corrected effective record and checked it against the refreshed manifest before accepting it. The initial failed event and both immutable snapshots remain available. Root also replaced an internal reference to “Root’s facility dataset” in the phase lesson with wording about the atlas's selected records.

[verify-arithmetic.mjs](verify-arithmetic.mjs) independently derives the bounded calculations without importing an atlas simulator. Its actual run passed 18 checks, recorded in [numerical-checks.json](numerical-checks.json): phase selection, floor/BOM constraints, energy units, backup duration, inventory conservation, lead-time labels, allocation and a preference reversal. These checks are synthetic mathematical evidence; they do not establish empirical infrastructure performance.

Dependency inspection covered the local roles and boundary conventions of commissioning, HBM, substrate, rack power, power supply, UPS, scheduler and topology admission. The `capacity-flow` and `world-network` source geometry was inspected as a schematic representation. This is not a new full source review of those prerequisite lessons, browser observation or accurate geospatial census certification.

`build-review-bundle.mjs` assembles the record of the review already performed and validates its schema. It does not fetch sources or authorize a new review date. Immutable snapshot paths must not be overwritten, and a changed lesson requires a new event. No human, physical-device, assistive-technology or learner observations were performed.
