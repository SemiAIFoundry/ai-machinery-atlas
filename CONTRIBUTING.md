# Contributing to AI Machinery Atlas

Contributions should help a learner understand how an AI system is assembled and why its parts behave as they do. A smaller, accurate explanation is more useful than a larger collection of unsupported claims.

## Propose a correction or addition

Identify the affected component by its stable ID or fragment URL. Describe the problem, the proposed change, and the primary evidence supporting it. For factual corrections, include a paper, standard, manufacturer manual, or other authoritative source and the relevant section or page.

For a new lesson, explain its place in the hierarchy and its connections to existing lessons. Physical scale is not the only organizing principle: manufacturing steps, software abstractions, and evaluation concepts need their own explicit interpretation.

## Curriculum standards

- Explain the mechanism in concrete steps. Distinguish what the model depicts from what it omits.
- Include the equation’s variables, units, assumptions, and useful operating range. Identify empirical relationships and illustrative constants.
- Tie every product-specific value to its configuration and primary source. Separate peak capability, measured performance, capacity, and bandwidth. Do not turn a marketing process-node name into a measured transistor dimension.
- Describe interfaces and meaningful tradeoffs. Link related records using stable IDs and update guided paths when necessary.
- Include a common misconception and a knowledge check whose explanation teaches the underlying distinction.
- Separate historical evidence, current specifications, and forecasts. Do not infer undisclosed Astra architecture, assign it a hardware platform, or present AGI as an established outcome or date.
- Summarize referenced work in original language. Link to sources rather than copying figures, tables, or long passages without appropriate rights.

## Scene and lab standards

Procedural scenes should expose a mechanism or relationship. Label schematic dimensions and invented counts as teaching choices. Keep selectable geometry associated with a valid curriculum record, and preserve usable text-based selection alongside the 3D view.

Labs must show their model and assumptions. Add numerical checks for substantive changes to the mathematics, including edge cases that could produce invalid units, non-finite results, or misleading plots. A passing unit test does not validate a simplified model against a real device.

Preserve keyboard access, visible focus, readable contrast, and informative control names. Respect reduced-motion preferences where supported and avoid making animation necessary to read the lesson.

## Development and review

Use Node.js 22.13 or later.

```sh
npm ci
npm run dev
npm test
npm run build
```

Keep changes focused. A contribution description should state the learning problem, the resulting behavior, the evidence used, and the checks performed. Report any manual browser checks separately from automated checks; do not imply that one covers the other.

For changes affecting delivery, check both root and subdirectory hosting, fragment links, asset loading, and the companion film. Do not commit dependencies, build caches, access tokens, private deployment metadata, or local absolute paths.

## Licensing and AI assistance

Submit only material you have the right to contribute. Contributions to atlas-owned code and content are provided under the project’s MIT License. Preserve third-party license notices and document any new dependency or bundled asset in `THIRD_PARTY_NOTICES.md`.

Disclose substantial AI assistance when describing a contribution. Contributors remain responsible for checking factual claims, citations, licenses, and behavior. Do not include private material in prompts or source examples intended for a public release.
