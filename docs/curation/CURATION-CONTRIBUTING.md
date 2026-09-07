# Contributing a lesson or evidence correction

A useful contribution connects a mechanism to an engineering consequence and gives the reader enough evidence to judge its scope. The curation manifest is an inventory and review queue. Its proposed roles are not assigned people, and a listed URL is not proof that a lesson has been reviewed.

## Make a focused change

1. State the learner outcome: what the reader should calculate, predict, explain or transfer. Keep the lesson ID stable. Use prerequisites only for concepts the lesson actually needs; retain explicit `[]` for roots and keep the prerequisite graph acyclic.
2. Explain the mechanism and one downstream consequence. Include a small worked example with inputs, units, intermediate quantities and a result. Label invented inputs as teaching assumptions. Separate illustrative calculations from reported device specifications or measured system performance.
3. Preserve applicability limits: device regime, process or architecture generation, workload, precision, memory configuration, timing, measurement boundary and any neglected effects. For equations, define every symbol and unit; verify dimensions, limiting cases and accessible text. A conservation or budget identity, empirical fit and analogy need different labels.
4. Keep descriptions learner-facing. Put visual implementation directions in renderer or contributor documentation. Explain what visual position, color, size and motion mean; do not imply verified floorplans, actual die counts or an energy gap that is a spatial distance.
5. Connect the lesson to an appropriate lab and investigation. Use `library` when there is no direct calculator. An engineering link must state its direction and scope; a physical connection does not establish a company supply relationship. Check one upstream assumption and one downstream effect.

## Attach evidence at the claim boundary

Use a primary paper, standard, official technical reference, product documentation or measured result when available. A company's announcement supports what that company announced; it does not by itself establish shipped availability, measured performance or independent validation. Preserve `reported`, `announced`, `research`, `forecast` and `unresolved` distinctions. Attribute organizational research framing, including CRG, to its source.

For each material empirical or numerical claim, record the exact source URL, title, publisher, publication/version label, section/page/table/figure locator, statement, scope and limitations. Include value, unit, denominator, period and configuration when applicable. Do not force a numerical value into a purely conceptual claim. Record a date only for an action actually performed; leave missing publication dates unknown or explicitly undated.

Reading a source title is not a source-scope review. Open the relevant passage, check whether it supports the exact assertion, and note differences in units, population, generation, benchmark, deployment phase or measurement boundary. A failed or inaccessible source remains a review finding. Do not mark a review accepted while its required support is unresolved. For a paid or inaccessible standard, distinguish an accessible official summary from the standard itself.

Keep correction history. Add a replacement claim with `supersedesClaimId`, retain the prior record with `supersededByClaimId`, and explain the changed evidence. Never silently rewrite a research claim into a production fact or upgrade an announcement after merely observing a newer date.

## Record review honestly

Copy `curation-review-event-template.json` into a separate working file, replace its null fields with actual review data, then append the completed event to `curation-review-events.json`. The template is deliberately incomplete and must never be appended unchanged. Store an immutable snapshot or committed revision of the reviewed content and its manifest fingerprint.

Record the real reviewer identity, role and actor type (`human` or `agent`). A source review, a specialist review and a pedagogy review are separate events. Only record a specialist event when a human has actually performed and declared that domain review; a proposed role or an automated check is insufficient. A source-scope review may be done by an agent, with that actor type plainly retained. Neither event certifies a student's mastery.

An accepted source-scope event must cover every source reference and structured claim in the reviewed snapshot. Use exact locators, actual source-check dates and notes. Record `changes-required` for partial or failed work. Do not label incomplete checking as accepted. State `not-applicable` only when a check has no relevant content, with a reason in the notes.

## Before handing off

Run the manifest validator after content merges, then generate the queue using an explicit UTC date. Check that IDs resolve, the prerequisite graph stays acyclic, scope and qualifiers survive, examples recompute and the lesson opens with its intended lab. Exercise the changed visualization or calculation at a meaningful boundary. For a prose-only correction, perform a focused reading review instead of adding a test that merely mirrors the text.

Contributors propose content and reviews; repository integration and publication follow the project's existing workflow. These files do not schedule an automation, assign a reviewer or publish anything.
