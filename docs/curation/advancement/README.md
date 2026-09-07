# Engineering curation and maintenance

This addendum connects the eight Engineering studio experiences to their exact model snapshot, related atlas lessons, primary-source uses, scientific limits and maintenance roles. **Semi AI Foundry, LLC** is the organizational maintenance owner. Technical specialist roles are proposed; no named human assignment or specialist approval is recorded.

The current inventory contains 57 exact source URLs and 62 scoped uses. All 62 uses have an explicit scoped agent source-check record. The follow-up readings completed the previously missing hall/orbital metadata and corrected the solar numeric citation. “Not recorded” means the available evidence is incomplete; it does not assert that nobody has read the page. The [source inventory](SOURCE-REVIEW-INVENTORY.md) identifies each case.

An agent check covers the statement and exclusions attached to one source use. It does not certify every linked lesson, the numerical model, classroom effectiveness or human specialist review. All synthetic parameters and model limits remain visible. The [existing lesson curation workflow](../CURATION-WORKFLOW.md) and its event history remain separate.

## Use the records

- [Engineering curation addendum](engineering-curation-addendum.json): model versions and file hashes; lesson fingerprints and navigation; exact source locators; assumptions; per-use check provenance; proposed recheck intervals and roles.
- [Actual hall/orbital follow-up readings](followup-source-checks.json): locators, findings and the successful public PDF retrieval after web-reader failure.
- [Source review inventory](SOURCE-REVIEW-INVENTORY.md): readable list of checked and pending source uses.
- [Maintenance workflow](MAINTENANCE-WORKFLOW.md): how to respond to changed source content, models and teaching scope.
- [Supersession exercise](supersession-recheck-fixture.json): complete isolated before/change/recheck documents, with both claim revisions retained.
- [Validation report](validation-report.json) and [exercise results](exercise-results.json): automated evidence and its limits.

## Run the checks

From the repository root, after integration under `docs/curation/advancement`:

```sh
node docs/curation/advancement/validate-addendum.mjs . 2026-09-07
node --test docs/curation/advancement/curation-advancement.test.mjs
node docs/curation/advancement/exercise-supersession.mjs
```

Use the actual intended as-of date. Validation checks the current files and lesson fingerprints and reports changed content. It retrieves no URLs and grants no new reviewed badge. The proposed due date starts at the actual source-check date, never the inventory timestamp.

For an artifact-only metadata check without a repository or TypeScript dependency:

```sh
node docs/curation/advancement/validate-addendum.mjs --offline 2026-09-07
```

The offline report explicitly marks repository snapshot checks as not run. The fixture runner writes only its isolated exercise result and never appends a real review event.

After assessing integration changes, the builder can capture the current inventory:

```sh
node docs/curation/advancement/build-addendum.mjs . 2026-09-07
```

Review its diff. Regeneration is inventory maintenance, not source review. It preserves existing recorded source checks when a source-use fingerprint changes, so changed qualifiers cannot silently inherit an accepted check. A new actual check must name the actor, date, exact source passage, finding and current scope. Keep the earlier record as history.

The delivery snapshot includes the shared studio primitives, input record and recovery implementation, lesson continuation mapping and CSS, plus the extruded cross-section renderer for fabrication and memory. Camera framing and viewport size are delivery concerns; they do not calibrate the physical model or create a new primary-source check. The complete build identity separately covers packaging and public assets.
