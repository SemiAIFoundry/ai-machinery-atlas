# Teaching the AI machinery atlas

A reusable, no-account teaching pack for tracing three different boundaries: a wafer feature becomes accepted input, an operation becomes a schedule, and an installed hall becomes retained work. The activities use the atlas's calculated Engineering experiences and can also be completed from the supplied scenario cards and worksheet.

Choose [30 minutes or 90 minutes](SESSION-PLANS.md), give learners the [worksheet](PARTICIPANT-WORKSHEET.md), and retain the [answer key and rubric](INSTRUCTOR-KEY.md). A basic calculator is enough for the core arithmetic. Students may answer on paper or in their own local text file; no sign-in, identifying information or submission service is required. The [optional record template](participant-record-template.json) contains blank responses and no fabricated observations.

Use an atlas build that includes **Fabrication → acceptance**, **Operation → architecture**, and **Rack → retained work**. Its model IDs must match [the scenario contracts](scenario-contracts.json). The current studio URL fragments are:

- `#thermal-oxidation-interface~v=1&studio=fabrication`
- `#tensor-core~v=1&studio=architecture`
- `#memory-to-hall-propagation~v=1&studio=hall`

Append a fragment to the base URL of the selected build. A fragment selects an experience; its numerical state comes from the saved engineering workspace. Inputs for each experience persist in this browser when device storage is available and the content/model versions match. Reloading or switching topics can therefore restore earlier settings. Start each activity with its named preset and the explicit worksheet settings; for fabrication, choose **Restore nominal example**.

Under **Saved engineering workspace**, use **Export inputs** to download a JSON record and **Import inputs** to restore it on a compatible build or another device. Import preserves one recovery copy, available through **Restore previous workspace**. If saving is unavailable, the status message explains that inputs remain in the current session; export a copy before leaving. If an older or incompatible saved record is found, **Export older saved record** preserves its original text; multiple records download together. Those records are kept separately before current inputs replace them. If that preservation cannot be saved, the older data stays in place and current edits remain available to export. An older recovery download does not bypass the current import compatibility checks.

Browser import accepts the atlas-generated workspace record, not this pack's `scenario-contracts.json`, which contains inputs for the teaching runner. Keep predictions and observations on the worksheet; the engineering export stores inputs and selections.

The 14 [scenario contracts](scenario-contracts.json) contain complete model inputs and computed answers. A Node runtime with TypeScript stripping can reproduce them without a browser or network:

```sh
ATLAS_REPO_ROOT=/path/to/atlas node --experimental-strip-types verify-kit.mjs
```

The verifier checks every contract against its model version, hashes and numerical outputs, validates the contributed lesson using the current lesson contract, and independently checks the small checkpoint example. It does not modify the atlas. The `H7` fixture uses deliberately small service rates for hand calculation; those controls are not all exposed in the browser, so use its printed timeline or the runner.

The pack also includes a complete [second-author lesson](second-author-lesson.json), [canonical equations](second-author-equations.json), [source and claim ledger](second-author-evidence.json), [review snapshot](second-author-review-snapshot.json), and [integration proposal](lesson-integration-proposal.json). [Contribution notes](CONTRIBUTION-EXAMPLE.md) explain how to reuse the pattern. The author is explicitly an AI agent. Agent source checks and arithmetic verification are recorded separately from human specialist review and instructor or learner observations, which have not occurred.

These materials teach mechanism reasoning, unit handling and model scope. They do not claim learning efficacy, device qualification, physical fabrication accuracy or commercial performance equivalence. Reuse remains subject to the atlas's current license; this pack introduces no separate license grant.

## Expanded connected investigations

The [next-horizon sequence](next-horizon/README.md) adds corpus lineage, actual decoder training, distributed updates, serving, retrieval-to-action, evaluation, electrical acceptance, code contracts and feedback. It includes three session plans, prediction worksheets, scoped answers and independently checked arithmetic. These materials supplement the original activities.
