# AI Machinery Atlas

An interactive learning platform for the machinery behind modern AI: atoms and electronic states, semiconductor fabrication, transistors, arithmetic, memory, packages, computers, infrastructure, executable software, and learning systems.

**[Live demo](https://semiaifoundry.com/ai-atlas/)** · **[Watch The Ascent](https://semiaifoundry.com/ai-atlas/ascent.html)** · **[SemiAIFoundry](https://semiaifoundry.com/)** · **[License](LICENSE)** · **[Third-party notices](THIRD_PARTY_NOTICES.md)**

The atlas pairs a component field guide with selectable, procedural 3D assemblies. Its companion film, *The Ascent*, narrates the progression from attention and early GPT systems toward the current frontier and the open questions around AGI.

## Explore

The September 2026 working edition retains the original v1.0.0 curriculum and adds the first deep hardware-and-realization slice:

| Resource | Coverage |
| --- | --- |
| 210 connected component lessons | Mechanisms, process states, scientific relations, assumptions, contextual specifications, interfaces, tradeoffs, checks, and primary references |
| 57 branches in six navigation bands | Matter and fabrication; circuits and architecture; packaging and machines; connected infrastructure; executable software; learning and intelligence |
| 14 guided paths and journeys | The five original journeys remain, joined by fabrication, package, infrastructure, model–machine, and computation-to-realization traversals |
| 21 numerical labs | The original labs remain, with wafer yield, patterning, CMP, assembly yield, HBM intensity, capacity queues, dataflow, model memory, collectives, hall work, orbital budgets, custom-silicon economics, reliability, and scaling metrics |
| 73 historical and dated milestones | Selected breakthroughs and source-dated infrastructure events linked to lessons and primary references |
| CRG realization bridge | A source-labeled seven-boundary graph from computation intent through chip design, wafer, package, system operation, and verification evidence |

Choose a branch, select a component in the scene or component list, and use **Learn**, **Science**, **Specs**, and **Connections** to investigate it. Drag to orbit, scroll to zoom, separate an assembly with **Explode**, or focus on a part with **Isolate**. Search with the search button or <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd>.

Component URLs use fragments, such as [`#hbm-stack`](https://semiaifoundry.com/ai-atlas/#hbm-stack). Explored lessons and knowledge-check answers are stored in the current browser’s local storage. They are not synchronized between devices.

## What the models mean

The geometry is explanatory and not to scale. Physical components, manufacturing processes, software abstractions, and model behavior are different categories; the field guide explains what each view represents. A schematic array is not a measured chip floorplan, and a connection drawn between model blocks is not evidence of a model’s private reasoning.

Product specifications belong to the named configuration. Published Blackwell and GB200 examples are distinguished from generic assemblies. Numerical labs use explicit, simplified models with stated assumptions; they are learning tools, not design sign-off or production performance forecasts.

“Astra” refers to GPT-6 Astra in Codex in this project’s narrative. The atlas does not establish its parameter count, internal architecture, or deployed hardware. Scaling relationships are empirical and conditional. Neither falling prediction loss nor the historical chronology establishes an AGI date.

## Run locally

Use Node.js **22.13 or later** and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The atlas is a React and TypeScript application with Three.js scenes. It does not require an API key, account, or database.

```sh
npm test
npm run build
npm run preview
```

`npm test` first builds the application, then checks curriculum integrity, scene coverage, numerical invariants, and portable asset references. `npm run build` runs TypeScript checking and creates a static production build in `dist/`. Preview serves that build locally.

## Host the build

Upload the **contents** of `dist/` to a static web host. The Vite base is `./`, so the build supports a domain root or a subdirectory such as `/ai-atlas/` or a GitHub Pages project path. Use a trailing slash for a subdirectory’s entry URL.

Serve the files over HTTP or HTTPS. Opening `index.html` directly through `file://` is not a supported deployment. Component navigation uses URL fragments, so the host does not need a server-side route for each lesson.

All runtime scripts, fonts, and narration ship locally; reference links still lead to their external sources. Retain the generated asset paths and license notices. Check your host’s content security policy against the atlas, its generated style attributes, and the companion film. A policy inherited from a text-only page can block these features. See [release instructions](docs/RELEASING.md) for the verification checklist.

## Releases and updates

The application and educational content are versioned together. [Release v1.0.0](https://github.com/SemiAIFoundry/ai-machinery-atlas/releases/tag/v1.0.0) is the first public release and remains a fixed reference tag. This additive working edition is maintained on `main` while the next compatibility decision is made; it does not rewrite the published v1.0.0 source or assets. Browse the [changelog](CHANGELOG.md) for the current additions. The [live demo](https://semiaifoundry.com/ai-atlas/) follows the current published site build.

Patch releases correct defects, factual errors, references, and notices. Minor releases add lessons, scientific models, or compatible features. Major releases introduce incompatible navigation, saved-progress, data-format, or embedding changes. Each release preserves a fixed source tag, dated release notes, and archive checksums; see the [release guide](docs/RELEASING.md).

## Contribute

Corrections, clearer models, additional primary references, and improvements to accessibility are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing the curriculum or adding a hardware specification. Source and issues are hosted at [SemiAIFoundry/ai-machinery-atlas](https://github.com/SemiAIFoundry/ai-machinery-atlas).

The automated checks do not establish full browser compatibility, accessibility compliance, or scientific completeness. WebMCP tools are registered only when the browser exposes the relevant API. Their browser integration is experimental; the full visible interface remains available without it.

## Origin, attribution, and license

This is a human-directed, AI-assisted project. Its concept, scope, and iterative creative direction came from human requests; Codex assisted with research, curriculum drafting, code, procedural scenes, and release preparation. Review cited sources and report corrections, especially for changing product specifications.

Interaction design was inspired by [ashemag’s Human Atlas](https://github.com/ashemag/human-atlas). The AI curriculum and component geometry were created for this atlas. The companion film includes generated narration using Kokoro’s `af_heart` voice and a procedural score.

Copyright © 2026 Semi AI Foundry, LLC. Atlas-owned source and original content are available under the [MIT License](LICENSE). Dependencies, fonts, generated UI primitives, and other third-party materials retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Linked papers, documentation, trademarks, and product names are not relicensed by this project. Attribution does not imply endorsement.

For citation metadata, see [CITATION.cff](CITATION.cff).
