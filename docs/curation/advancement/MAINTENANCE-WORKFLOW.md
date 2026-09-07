# Keep a model and its evidence connected

Each experience has three distinct identities: its version label, hashes of the actual implementation and supporting content, and fingerprints of the lessons to which it links. A version label can remain unchanged during edits; a file hash or scoped content fingerprint still detects that change. Source uses retain the exact URL, passage, supported statement and explicit exclusions.

The organizational owner is **Semi AI Foundry, LLC**. A proposed technical role describes the expertise needed. The JSON’s null human assignments and reviews are intentional. Agent authorship and source checking are recorded as agent activity, including when the original record names only a role. Instructor and learner observations require actual sessions and remain unclaimed here.

## A source, model or teaching scope changes

1. Find the exact source URL in `sourceCatalog` and follow its experience reverse index. Follow the experience’s lesson links to assess where the explanation is used. Related lessons require examination, not an automatic verdict that they are wrong.
2. Preserve the earlier source statement, exclusions, source-check date, actor and reviewed fingerprint. Record the triggering change: corrected paper, new specification, changed living page, broken locator, model edit or reported misconception.
3. Open the primary source and record the actual passage, edition, access result and finding. A page can be accessible while failing to support the atlas’s particular claim. A source may support the mechanism while leaving every numerical preset synthetic.
4. If a claim changes, create a new revision. Keep the predecessor and successor, with reciprocal `supersedesClaimId` and `supersededByClaimId`. A previous accepted review applies only to its previous fingerprint. Leave the new revision pending until an actual check covers it.
5. Review consequences for units, denominators, visual interpretation, worked values, tests and linked lessons. Re-run the relevant model checks. A passing software test does not supply missing primary-source or specialist evidence.
6. Capture the revised model and lesson identities and append the actual review record. The check date is when that source passage was checked; a later inventory rebuild or event completion cannot refresh an older reading.

The review intervals—365 days for stable principles, 180 for implementation details, 90 for product/research interpretation and 30 for announcements—are proposed maintenance cadences. Corrections or scope changes can trigger review immediately. A calendar deadline is not a confidence score.

## Concrete exercise

Run `exercise-supersession.mjs`. It loads three complete isolated documents from `supersession-recheck-fixture.json`:

| State | Retained evidence | Expected result |
| --- | --- | --- |
| Original Poisson source use | Revision 1 and its simulated scoped check | Agent check recorded for revision 1 |
| Explicit spatial/yield qualifier added | Revision 1 remains; revision 2 names it as predecessor; no new check | Recheck required for revision 2 |
| New scoped check recorded | Both revisions and both simulated events remain | Agent recheck recorded for revision 2 |

This is a workflow demonstration. The synthetic dates and actor are marked as fixtures; it reports no real NIST correction or newly completed source reading. The runner refuses unmarked fixture documents, checks reciprocal links, validates source-use fingerprints and never writes the production event log. Tests also reject using the predecessor’s check to accept its successor, manufactured human approval, future dates and completed metadata on a pending use.

## Completed source checks and their limits

The operating-hall and orbital follow-up readings are recorded in [followup-source-checks.json](followup-source-checks.json). They cover actual source passages and model-use boundaries, including the NASA heat-exchanger equations and the distinction between solar overview context and the specific numeric irradiance page. The PDF’s public download succeeded after the web reader failed; its content hash and pages are retained. These were agent readings, not specialist review.

The eight-experience inventory also preserves the progress/capacity author’s fifteen source-scope events. Selected historical mechanism examples remain distinct from paper measurements. Dated public statements, interconnection requests, awards, billable/leased status and future phase projections have incompatible boundaries and must not be summed into a single capacity total. The 3×/2× growth comparison remains an adjustable assumption.

The realization’s five checks are recorded by the root AI implementation author, including corrected versioned Yosys documentation after the earlier command URLs returned 404. They establish only the stated public-tool semantics and bounded artifact interpretation. No physical device, board, fabrication or ASIC qualification follows from those checks.

Earlier pending states remain in the preserved inventory snapshot. Newly completed source reads carry their actual date and actor; rebuilding the inventory did not create them. No human specialist or learner observation has been added.
