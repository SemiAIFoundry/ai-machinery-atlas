# Additive integration record

Intended location: `docs/curation/advancement/`. Copy this directory as one package. No model, lesson, source claim or historical review record is removed.

The parent lesson manifest continues to inventory the full current corpus. This experience addendum adds model/source-use relationships without converting agent experience checks into completion of all linked lesson reviews. The instructor contribution’s separately reviewed effective lesson snapshot may be appended to the parent event log only after checking its current fingerprint.

Suggested package validation wiring:

```json
{
  "curation:engineering": "node docs/curation/advancement/validate-addendum.mjs . 2026-09-07 && node --test docs/curation/advancement/curation-advancement.test.mjs && node docs/curation/advancement/exercise-supersession.mjs"
}
```

The date above is the current inventory date; maintenance should supply the real intended as-of date. It is not a release date. The scripts use Node built-ins; current-repository validation also uses the existing curation helper and the repository’s TypeScript dependency. Offline schema validation requires no TypeScript package.

Future renderer integration can show the selected experience’s scope and sources, exact model version, actual agent-check state and proposed specialist role. Do not display a global “verified” label or reinterpret a role as an assigned reviewer. Keep pending checks accessible without burdening ordinary navigation with internal workflow history.
