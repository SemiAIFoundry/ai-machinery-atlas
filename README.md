# AI Machinery Atlas

An interactive learning platform for the machinery behind modern AI: atoms and electronic states, semiconductor fabrication, transistors, arithmetic, memory, packages, computers, infrastructure, executable software, and learning systems.

**[Explore the atlas](https://semiaifoundry.com/ai-atlas/)** · **[SemiAIFoundry](https://semiaifoundry.com/)** · **[License](LICENSE)** · **[Third-party notices](THIRD_PARTY_NOTICES.md)**

The atlas pairs a component field guide with selectable, procedural 3D assemblies. Its companion film, *The Ascent*, narrates the progression from attention and early GPT systems toward the current frontier and the open questions around AGI.

## Explore

The September 2026 reference edition contains:

| Resource | Coverage |
| --- | --- |
| 97 component lessons | Mechanisms, scientific relations and assumptions, contextual specifications, interfaces, tradeoffs, checks, and primary references |
| 26 branches in six navigation bands | Matter and fabrication; circuits and architecture; packaging and machines; connected infrastructure; executable software; learning and intelligence |
| Five guided paths | From matter to a machine; how it is made; follow one token; follow the energy; follow a training step |
| Seven numerical labs | Transistor current, matrix multiplication, roofline limits, thermal resistance, causal attention, KV memory, and scaling |
| 41 historical milestones | Selected breakthroughs linked to lessons and original sources |

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

## Contribute

Corrections, clearer models, additional primary references, and improvements to accessibility are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing the curriculum or adding a hardware specification. Source and issues are hosted at [SemiAIFoundry/ai-machinery-atlas](https://github.com/SemiAIFoundry/ai-machinery-atlas).

The automated checks do not establish full browser compatibility, accessibility compliance, or scientific completeness. WebMCP tools are registered only when the browser exposes the relevant API. Their browser integration is experimental; the full visible interface remains available without it.

## Origin, attribution, and license

This is a human-directed, AI-assisted project. Its concept, scope, and iterative creative direction came from human requests; Codex assisted with research, curriculum drafting, code, procedural scenes, and release preparation. Review cited sources and report corrections, especially for changing product specifications.

Interaction design was inspired by [ashemag’s Human Atlas](https://github.com/ashemag/human-atlas). The AI curriculum and component geometry were created for this atlas. The companion film includes generated narration using Kokoro’s `af_heart` voice and a procedural score.

Atlas-owned source and original content are available under the [MIT License](LICENSE). Dependencies, fonts, generated UI primitives, and other third-party materials retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Linked papers, documentation, trademarks, and product names are not relicensed by this project. Attribution does not imply endorsement.

For citation metadata, see [CITATION.cff](CITATION.cff).
