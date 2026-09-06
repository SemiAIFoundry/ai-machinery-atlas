# Third-party notices

AI Machinery Atlas includes or uses the following third-party components. The project's MIT license applies to original project material; it does not replace any upstream license. Preserve this file and the linked `licenses/` directory when distributing source or a compiled release containing these components.

The versions below were checked against the final portable release lockfile. The bundled JavaScript module inventory was also verified with an in-memory Vite production build. `package-lock.json` is the authoritative dependency lockfile. `license-inventory.json` records the origin and SHA-256 of each preserved license text. Refresh this inventory when changing dependencies.

| Component | Version used | License | Full text |
| --- | --- | --- | --- |
| react | 19.2.6 | MIT | [License](licenses/react.txt) |
| react-dom | 19.2.6 | MIT | [License](licenses/react-dom.txt) |
| scheduler | 0.27.0 | MIT | [License](licenses/scheduler.txt) |
| @base-ui/react | 1.7.0 | MIT | [License](licenses/base-ui--react.txt) |
| three | 0.160.1 | MIT | [License](licenses/three.txt) |
| lucide-react | 1.31.0 | ISC | [License](licenses/lucide-react.txt) |
| class-variance-authority | 0.7.1 | Apache-2.0 | [License](licenses/class-variance-authority.txt) |
| clsx | 2.1.1 | MIT | [License](licenses/clsx.txt) |
| tailwind-merge | 3.6.0 | MIT | [License](licenses/tailwind-merge.txt) |
| tw-animate-css | 1.4.0 | MIT | [License](licenses/tw-animate-css.txt) |
| @babel/runtime | 7.29.7 | MIT | [License](licenses/babel--runtime.txt) |
| @floating-ui/react-dom | 2.1.9 | MIT | [License](licenses/floating-ui--react-dom.txt) |
| @floating-ui/utils | 0.2.12 | MIT | [License](licenses/floating-ui--utils.txt) |
| use-sync-external-store | 1.6.0 | MIT | [License](licenses/use-sync-external-store.txt) |
| @base-ui/utils | 0.3.2 | MIT | [License](licenses/base-ui--utils.txt) |
| @floating-ui/dom | 1.8.0 | MIT | [License](licenses/floating-ui--dom.txt) |
| reselect | 5.3.0 | MIT | [License](licenses/reselect.txt) |
| @floating-ui/core | 1.8.0 | MIT | [License](licenses/floating-ui--core.txt) |
| shadcn | 4.18.0 | MIT | [License](licenses/shadcn-primitives.txt) |
| tailwindcss | 4.2.1 | MIT | [License](licenses/tailwindcss.txt) |
| Geist | Google Fonts distribution; retrieved 2026-09-06 | OFL-1.1 | [License](licenses/geist-OFL.txt) |
| Geist Mono | Google Fonts distribution; retrieved 2026-09-06 | OFL-1.1 | [License](licenses/geistmono-OFL.txt) |

## Copied UI source

The generated shadcn UI primitives in `src/components/ui/` and the `shadcn/tailwind.css` stylesheet are covered by the shadcn MIT notice, copyright (c) 2023 shadcn. The compiled browser release includes the copied primitives and CSS, not the shadcn CLI. Base UI and its transitive dependencies are listed separately above.

## Icons

The Lucide license file contains two notices: ISC for Lucide, and MIT for icons derived from Feather (copyright (c) 2013-present Cole Bemis). Both sections are preserved in full. Three.js's notice also covers its included OrbitControls addon and the locally bundled Three.js script used by the film.

## Fonts

Geist and Geist Mono are copyright 2024 The Geist Project Authors and remain licensed under the SIL Open Font License 1.1. The font files are unmodified distributions. Their license is not changed to MIT by being bundled with this application.

## Film and generated narration

The Ascent companion contains project-authored procedural scenes, explanatory script, and code-generated musical score. Its narration is generated using Kokoro-82M v1.0 with the stock `af_heart` voice. The narration credit is retained in the film's research notes.

[Kokoro model card and license](https://huggingface.co/hexgrad/Kokoro-82M) · [Kokoro source](https://github.com/hexgrad/kokoro)

Kokoro's model card identifies its model weights as Apache-2.0. This release includes generated narration audio; it does not redistribute Kokoro model weights, voice embeddings, or TTS inference code. Those upstream materials are not relicensed by the project's MIT license.

## Inspiration and references

The direct-selection and exploded-assembly exploration of [Human Atlas](https://github.com/ashemag/human-atlas) inspired the atlas. Its application is MIT-licensed; its anatomy data has separate terms. This AI atlas uses project-authored procedural geometry and does not distribute BodyParts3D anatomy meshes.

Research papers, vendor documentation, product names, and source links in the curriculum remain the property of their respective owners. Citations identify evidence and do not imply endorsement. No right to third-party trademarks is granted by the project license.

## Scope

This notice set covers the inspected portable application dependencies, generated UI source, font assets, and film attribution. Package managers install additional build tools under their own included licenses. If another dependency or third-party asset is added to a distributed bundle, retain its required notices as well.
