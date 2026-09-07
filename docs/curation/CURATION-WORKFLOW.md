# Curation assets and freshness workflow

The manifest contains 224 current merged lessons, 271 distinct URLs, 467 unique lesson–URL pairs, 122 inherited ledger source records and 39 structured claims linked to 34 lessons. Its scope includes lesson citations, historical references and claim sources. It inventories evidence; it performs no live source verification and records no specialist approval.

`curation-manifest.json` is normalized into `lessons`, `sourceCatalog` and `claimCatalog`. Use `lessons[lessonId]` for scope, references, claim IDs, review proposals and links. Sources have stable URL-derived IDs and a reverse index of affected lessons. Claims retain their exact original statements, values, units, denominators, scopes, limitations and status. Existing source/claim dates appear only as `inheritedCheckedOn`, with an explicit provenance warning. New source-verification dates, assigned reviewers, completion dates and due dates are null.

The manifest was generated from the current `atlas-authoring.ts` merge, including integrated description/scaffolding/domain/lab assets and current formal equation assets. `sourceSnapshot` contains file hashes and the base Git commit; the commit alone does not identify uncommitted content. Each lesson has a fingerprint over its merged record, chapter interpretation and formal equations. Regenerate after content integration and validate against that exact working tree.

## Commands

Run from the repository root. An optional repository path can be passed to the builder or validator when using another checkout.

```sh
npm run curation:refresh
node docs/curation/validate-curation-manifest.mjs . 2026-09-07
node docs/curation/curation-freshness.mjs 2026-09-07
```

Use the actual intended UTC as-of date on later runs. The builder and queue write beside their scripts; the validator writes its run report to the ignored `.validation/` directory. The builder preserves an existing review-event file. It regenerates inventory fields; it does not replay events into the manifest's baseline/null review fields. The queue is the derived review state. Never hand-edit generated completion fields to simulate a review.

## Proposed policy, not evidence of freshness

| Sensitivity | Lessons | Proposed interval after source checking |
| --- | ---: | ---: |
| Stable principle | 41 | 365 days |
| Implementation sensitive | 88 | 180 days |
| Product or generation sensitive | 59 | 90 days |
| Research interpretation sensitive | 20 | 90 days |
| Announcement, deployment or forecast sensitive | 16 | 30 days |

These intervals are editorial proposals, not empirically established guarantees. A changed standard, corrected paper, deployment announcement, conflicting result or learner misconception can trigger immediate review. Historical facts may remain sound while a linked living page changes. A stable physical principle may still be explained incorrectly. Review cadence and truth are different questions.

The initial queue has 224 `baseline-review-required` entries: 1 urgent, 35 high and 188 normal priority. The urgent item is the inherited unresolved HBM silicon-intensity claim. These priorities select work; they are not confidence scores or findings that the content is false. Proposed roles cover nine technical/editorial areas and assign no individuals.

## Completing a review

Use the contributor guidance and incomplete event template. Append actual review events; never replace history with a newer date. Each event preserves the reviewed fingerprint, an immutable snapshot location, source/claim ID scope, actual reviewer, actual completion date, actual individual source-check dates, exact source URLs, locators, findings and outcome. Accepted source reviews must cover their complete declared scope. Older events remain valid history when current content changes; they cannot certify the new fingerprint.

The queue reads the latest source-scope event and returns one of:

- `baseline-review-required`: no complete source review is recorded; freshness is unknown.
- `changes-required`: the latest recorded review found outstanding work.
- `content-changed-since-review`: the current fingerprint differs from the accepted review.
- `review-due`: the proposed interval has elapsed.
- `within-proposed-review-interval`: an accepted review covers this fingerprint and is within the interval as of the chosen date.

The due date starts from the **oldest actual source-check date in the accepted review**, bounded by completion date. Completing a review today cannot make an old source check fresh. Inherited ledger dates never start this clock. Events completed in the future and impossible dates are rejected. The queue retains reviewer actor type; an agent source review is not rendered as a human or specialist review. A specialist event has its own identity and current-fingerprint check.

When a source changes, use `sourceCatalog[sourceId].lessonIds` to find affected lessons. Follow `dependentLessonIds`, `engineeringRelationIds` and `investigationIds` to assess consequences. A dependency warrants examination; it does not prove all downstream lessons are wrong. Preserve superseded claims and reviewed snapshots for correction history. A manifest rebuild should be checked into the same change as its content when integrating these assets into a repository.

## Renderer integration

Show the learner the scope, source titles/links, qualified claim labels, actual review state and proposed reviewer role with clear wording. Suggested initial label: **“Sources listed; source-scope review not yet recorded.”** Display inherited dates only as **“Legacy ledger check date (not verified in this update).”** Do not convert `generatedAt`, a null review field or `proposedReviewRole` into a reviewed badge, an owner or a deadline.

A compact learner panel needs only the selected lesson and referenced source/claim records; load the full manifest on demand if bundle size matters. The queue is a contributor planning view, not a student score. Default to current-field validation before integration because parallel content work can change fingerprints.

## Validation scope

`validate-curation-manifest.mjs` checks exact 224-ID coverage; source/claim identity and inherited metadata preservation; current content fingerprints; stable domains and chapter links; prerequisite/related/journey/lab/deep-lab/investigation/engineering links; source-use reverse indices; no prerequisite cycles; and no invented new review dates or assigned reviewers. In-memory date fixtures test unreviewed, changed, failed, elapsed and current review states, including future-date rejection and the old-source-date rule. Fixtures are never written to the real event log.

No link accessibility, exact claim support or human expertise is inferred from structural validation. Publication dates such as “Undated living reference” remain labels, not fabricated ISO dates. A changed source merits a new check and finding, not an automatic status upgrade.
