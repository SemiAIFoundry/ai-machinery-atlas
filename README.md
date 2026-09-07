# AI Machinery Atlas

A 3D learning platform for the machinery behind modern AI: atoms and electronic states, transistors, arithmetic, chip design and fabrication, packaging and HBM, processing architectures, computers and infrastructure, executable software, and learning systems.

**[Live demo](https://semiaifoundry.com/ai-atlas/)** · **[Watch The Ascent](https://semiaifoundry.com/ai-atlas/ascent.html)** · **[SemiAIFoundry](https://semiaifoundry.com/)** · **[License](LICENSE)** · **[Third-party notices](THIRD_PARTY_NOTICES.md)**

The atlas pairs a component field guide with selectable, procedural 3D assemblies, formal equations, numerical labs, and cited history. Its companion film, *The Ascent*, narrates the progression from attention and early GPT systems toward the current frontier and the open questions around AGI. The project is a connected account of how matter, devices, circuits, architectures, infrastructure, software, training, inference, and evaluation become useful intelligence. The CRG bridge connects computation intent with chip design, physical realization, and verification evidence.

**Current release: [v1.2.0](https://github.com/SemiAIFoundry/ai-machinery-atlas/releases/tag/v1.2.0).** A comprehensive reference edition with device-adaptive learning, connected scientific and engineering coverage, and interactive systems labs.

**Software and original content: academic, public-interest research, personal and hobby use permitted with attribution. Commercial use requires a separate written license from Semi AI Foundry, LLC.** Read the [Research and Noncommercial License](LICENSE) and [commercial-use guidance](COMMERCIAL_LICENSE.md). The software is source-available.

**Current scope:** 224 lessons · 62 branches · 15 guided paths · 24 numerical labs · 76 historical and dated milestones.

## Development preview

The next candidate retains the full reference curriculum and adds three connected investigations: **a switch becomes arithmetic**, **two wafers become an accelerator**, and **a request becomes a result**. Shared inputs connect charge and timing, exact arithmetic, wafer and package yield, HBM placement, and bounded execution estimates. A four-token attention calculation makes its intermediate values inspectable. Predictions, explanations and transfer answers can be saved, exported and imported; shared scenario links contain inputs only.

Fourteen manufacturing routes now expose 84 authored material states through matching cross-sections and optional 3D inspection. The science catalog uses explicit formal expressions or prose relationships. Lesson detail loads on demand, and each build includes its source/content identity.

This candidate is undergoing [device, specialist and learner review](docs/learning-review/README.md). Browser viewport checks and automated tests are recorded separately from physical-device and learner evidence. See the [implementation ledger](docs/roadmap/IMPLEMENTATION.md), [complete approved roadmap](docs/roadmap/ROADMAP.csv), and [curation workflow](docs/curation/CURATION-WORKFLOW.md). The published demo and v1.2.0 release remain the reference edition until a reviewed successor is released.

## What the atlas covers

| Resource | Coverage |
| --- | --- |
| 224 connected lessons | Mechanisms, process states, formal equations, assumptions, contextual specifications, interfaces, engineering tradeoffs, knowledge checks, and primary references |
| 62 branches in six navigation bands | Matter and fabrication; circuits and architecture; packaging and machines; connected infrastructure; executable software; learning and intelligence |
| 15 guided paths | Connected journeys through AI foundations, fabrication, packaging, memory realization, infrastructure, model–machine relationships, and computation-to-realization boundaries |
| 24 numerical labs | Transistor behavior, matrix multiplication, roofline bounds, thermal resistance, attention, KV memory and scaling; wafer yield, patterning, CMP, assembly yield, HBM intensity and stack construction; capacity queues, dataflow, model memory and inference placement, collectives and token paths; hall work, orbital budgets, custom-silicon economics and reliability |
| 76 historical and dated milestones | Selected breakthroughs and source-dated infrastructure events linked to lessons and primary references |
| CRG realization bridge | A source-labeled seven-boundary graph from computation intent through chip design, wafer, package, system operation, and verification evidence |
| The Ascent | A standalone cinematic companion tracing attention and early GPT systems toward the AI frontier |

The physical and systems curriculum follows chip design and verification through fabrication, wafer processing, advanced packaging, HBM and HBF, processing-unit architectures, and custom silicon. It examines manufacturing and capacity constraints alongside global infrastructure, orbital compute, reliability, economics, and the relationship between models and machines.

Memory and integration coverage connects HBM stack height, thermal and yield limits, TCB/TC-NCF, MR-MUF and hybrid bonding to HBF read-tier contracts, prefetching, working-set placement, training, prefill, decode and MoE. Process playback follows distinct manufacturing routes; numerical labs carry memory and communication constraints into system capacity and hall qualification.

The learning loop is consistent across scales: inspect a mechanism, state the assumptions, follow its interfaces, test a small model, compare it with evidence, and carry the constraint into the next scale. Product announcements, standards specifications, research demonstrations and measured deployment evidence retain their source, scope and date.

## Learning across devices

Phones open with readable lessons, searchable contents, accessible menus and an explicitly activated model workspace. Tablets use adaptable panes; larger screens place the field guide beside the model. Touch controls, comparison cards, equations and process explanations accommodate narrow screens.

Models render on demand when paused and suspend when hidden or offscreen. Formal mathematics includes units, assumptions and text alternatives. The workbench exposes numerical inputs, effective-rate limits and model boundaries so learners can inspect how a result changes.

## Explore

On phones, start reading immediately and use **Contents** to choose a topic; open **Explore 3D** when you want to manipulate the model. On larger screens, choose a branch and select a component in the scene or component list. Use **Learn**, **Science**, **Specs**, and **Connections** to investigate it. Drag to orbit, scroll to zoom, separate an assembly with **Explode**, or focus on a part with **Isolate**. Search with the search button or <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd>.

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

`npm test` first builds the application, then checks curriculum integrity, canonical mathematics, scene coverage, numerical invariants, saved-record contracts, source-ledger consistency, delivery budgets, and portable asset references. `npm run build` runs TypeScript checking and creates a static production build in `dist/`. Preview serves that build locally.

## Host the build

Upload the **contents** of `dist/` to a static web host. The Vite base is `./`, so the build supports a domain root or a subdirectory such as `/ai-atlas/` or a GitHub Pages project path. Use a trailing slash for a subdirectory’s entry URL.

Serve the files over HTTP or HTTPS. Opening `index.html` directly through `file://` is not a supported deployment. Component navigation uses URL fragments, so the host does not need a server-side route for each lesson.

All runtime scripts, fonts, and narration ship locally; reference links still lead to their external sources. Retain the generated asset paths, the complete `lesson-data/` directory, `build-info.json`, and license notices. Check your host’s content security policy against the atlas, its generated style attributes, and the companion film. A policy inherited from a text-only page can block these features. See [release instructions](docs/RELEASING.md) for the verification checklist.

## Releases and updates

The application and educational content are versioned together. [Release v1.2.0](https://github.com/SemiAIFoundry/ai-machinery-atlas/releases/tag/v1.2.0) is the current release. The [live demo](https://semiaifoundry.com/ai-atlas/) follows the current published site build. See the [release notes](docs/RELEASE-NOTES-v1.2.0.md) and [changelog](CHANGELOG.md) for current coverage and validation.

Earlier releases were pulled and replaced by v1.2.0, an upgraded and more comprehensive atlas.

Patch releases correct defects, factual errors, references, and notices. Minor releases add lessons, scientific models, or compatible features. Major releases introduce incompatible navigation, saved-progress, data-format, or embedding changes. Active releases use fixed source tags, dated release notes, and archive checksums; see the [release guide](docs/RELEASING.md).

## Contribute

Corrections, clearer models, additional primary references, and improvements to accessibility are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing the curriculum or adding a hardware specification. Source and issues are hosted at [SemiAIFoundry/ai-machinery-atlas](https://github.com/SemiAIFoundry/ai-machinery-atlas).

The automated checks do not establish full browser compatibility, accessibility compliance, or scientific completeness. WebMCP tools are registered only when the browser exposes the relevant API. Their browser integration is experimental; the full visible interface remains available without it.

## Origin, attribution, and license

This is a human-directed, AI-assisted project. Its concept, scope, and iterative creative direction came from human requests; Codex assisted with research, curriculum drafting, code, procedural scenes, and release preparation. Review cited sources and report corrections, especially for changing product specifications.

Interaction design was inspired by [ashemag’s Human Atlas](https://github.com/ashemag/human-atlas). The AI curriculum and component geometry were created for this atlas. The companion film includes generated narration using Kokoro’s `af_heart` voice and a procedural score.

Copyright © 2026 Semi AI Foundry, LLC. Atlas-owned software and original content are available under the [AI Machinery Atlas Research and Noncommercial License 1.0](LICENSE), following the CRG Systems licensing scheme. Academic, public-interest research, personal and hobby use are permitted with attribution; commercial use requires a separate written agreement. [Request commercial licensing](https://semiaifoundry.com/contact/). Dependencies, fonts, generated UI primitives, and other third-party materials retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Linked papers, documentation, trademarks, and product names are not relicensed by this project. Attribution does not imply endorsement.

For citation metadata, see [CITATION.cff](CITATION.cff).
