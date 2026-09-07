# Evidence register — AI Machinery Atlas next release

Research checkpoint: **6 September 2026**. This register identifies useful primary evidence and remaining verification work. A checked source is not blanket validation of every future lesson or numerical claim. Living pages require version/date capture before release.

## Claims that affect the design

| ID | Topic and finding | Evidence / status | Required treatment |
|---|---|---|---|
| C01 | The end-to-end manufacturing story has convergent inputs: logic dies, HBM stacks, interposer/bridge and substrate. | [TSMC CoWoS](https://3dfabric.tsmc.com/english/dedicatedFoundry/technology/cowos.htm), living technical page. | Show assembly alternatives and input dependencies; distinguish this process graph from a chosen navigation order. |
| C02 | TSMC management described packaging capacity as limiting customer growth in the 16 July 2026 call. | [Q2 2026 transcript](https://investor.tsmc.com/english/encrypt/files/encrypt_file/reports/2026-08/3e494f0c14dd0890f897aa044415e21d93486cc4/TSMC%202Q26%20Transcript.pdf), printed p.10. Company-hosted transcript of management remarks. | Dated first-party statement of tightness. It does not expose customer queues, lead times or variant-level allocations. |
| C03 | Available Intel evidence does not establish an EMIB-specific measured queue. | [Intel 2025 Form 10-K](https://www.intc.com/filings-reports/all-sec-filings/content/0000050863-26-000011/intc-20251227.htm), filed 23 January 2026. | Treat wafer/component supply statements and EMIB/EMIB-T technology statements separately. Absence here does not prove unconstrained capacity. |
| C04 | The indexed Micron 3× statement concerns HBM3E versus D5/DDR5, equal bits, same technology node. | [FY Q2 2024 prepared remarks](https://investors.micron.com/static-files/1a8d6c22-3b89-4806-930c-d30cbcd270d5), 20 March 2024. **Primary attachment migration unresolved:** indexed source text supports the qualification, but the old attachment can redirect. | Recover and directly verify the migrated original before making this a release-ready quantitative card. Keep it generation-specific; it is not package footprint or a universal HBM constant. |
| C05 | Historical fitted trends distinguish compute, capacity and bandwidth: ~3× peak compute, ~1.6× DRAM bandwidth and ~1.4× interconnect bandwidth per two years in Figure 1; ~2× single-GPU capacity in Figure 2. | [Gholami et al., AI and Memory Wall](https://arxiv.org/html/2403.14123v1), 21 March 2024, Figures 1–2. | Separate samples, time windows and normalization; retain the paper’s qualifications. Present historical evidence, not a guaranteed forecast or fixed-precision law. |
| C06 | IEA’s April 2026 update estimates 485 TWh of global data-center electricity in 2025 and projects 950 TWh in 2030. | [IEA executive summary](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary), report published 16 April 2026. | All data centers; AI-focused sites are a subset. Keep estimated baseline and central projection distinct. |
| C07 | The U.S. energy outlook is a differently scoped model: LBNL’s 2025 Update was published June 2026. | [LBNL publication record](https://bies.lbl.gov/publications/united-states-data-center-energy-2025). | Keep U.S. and worldwide estimates separate; record model/scenario and publication date. The full report needs retrieval for detailed methodological reuse. |
| C08 | Global buildout comprises partially operating, constructing and proposed capacity. | [OpenAI Stargate sites](https://openai.com/index/five-new-stargate-sites/), 23 September 2025, updated 22 October; [Google India construction milestone](https://blog.google/intl/en-in/google-ai-hub-scaling-indias-ai-infrastructure-and-community-impact/), 28 April 2026; [EuroHPC call](https://www.eurohpc-ju.europa.eu/eurohpc-joint-undertaking-launches-ai-gigafactories-call-2026-07-30_en), 30 July 2026. | Source/status examples, not a completed global census. Model phased sites and avoid adding overlapping campus/operator totals. Refresh each before release. |
| C09 | Orbital compute spans provider-reported demonstrations and proposed systems. Starcloud-1 and Suncatcher have different evidence/status. | [Starcloud-1](https://www.starcloud.com/starcloud-1), living operator page; [Suncatcher v2](https://arxiv.org/html/2511.19468v2), revised 17 June 2026; [prototype mission announcement](https://research.google/blog/exploring-a-space-based-scalable-ai-infrastructure-system-design/), 4 November 2025. | Separate operator-reported flight work, laboratory testing, simulation and planned mission. A demonstrator does not establish commercial fleet economics. |
| C10 | Orbital heat rejection and communication need independent engineering budgets. | [NASA thermal-control guidance](https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/), updated 18 May 2026; [NASA TBIRD completion](https://www.nasa.gov/directorates/somd/space-communications-navigation-program/nasas-record-breaking-laser-demo-completes-mission/), 25 September 2024, updated 26 September. | Radiation to space and a high-rate link demonstration do not establish continuous scalable compute service. Model emitting area, environmental heat, link duty cycle and useful payload separately. |

## Process-science and integration source packets

| ID | Source and date | Curriculum use |
|---|---|---|
| F01 | [ASML: How microchips are made](https://www.asml.com/en/technology/all-about-microchips/how-microchips-are-made), undated living page | Introductory flow, tool roles and layer-dependent patterning |
| F02 | [Applied Materials: New Ways to Shrink](https://ir.appliedmaterials.com/static-files/f2fbf48d-a761-4c4f-ab4c-73f312ab1ebc), 21 April 2022, pp.19–23 | Representative nanosheet integration and selective-material operations; historical mechanism source |
| F03 | [Applied Materials: transistor and wiring innovations](https://ir.appliedmaterials.com/news-releases/news-release-details/applied-materials-unveils-transistor-and-wiring-innovations), 10 February 2026 | Current vendor examples of contact/material/process changes; attribute performance claims |
| F04 | [imec: Scaling the BEOL](https://www.imec-int.com/en/imec-magazine/imec-magazine-september-2019/scaling-the-beol-a-toolbox-filled-with-new-processes-boosters-and-conductors), September 2019 | RC, conductors, routing, semi-damascene and research alternatives |
| F05 | [imec: wafer-to-wafer hybrid bonding](https://www.imec-int.com/en/articles/wafer-wafer-hybrid-bonding-pushing-boundaries-400nm-interconnect-pitch), 19 February 2024 | CMP, surface preparation, alignment, anneal and interconnect pitch; preserve research context |
| F06 | [TSMC CoWoS](https://3dfabric.tsmc.com/english/dedicatedFoundry/technology/cowos.htm), undated living page | CoWoS-S/R/L distinctions and compute/memory integration |
| F07 | [TSMC SoIC](https://3dfabric.tsmc.com/english/dedicatedFoundry/technology/SoIC.htm), undated living page | Dense vertical integration and combinations with CoWoS |
| F08 | [Intel Foundry HPC/AI process and packaging brief](https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2025-11/intel-foundry-hpc-ai-brief.pdf), November 2025 URL; exact day unverified | EMIB/EMIB-T, Foveros, packaging and test access; distinguish roadmaps and announced offerings |
| F09 | [SK hynix: Small Size, Big Impact](https://news.skhynix.com/en/small-size-big-impact/), 27 July 2023 | TSV/microbump and MR-MUF example; thin-die handling/warpage |
| F10 | [SK hynix–TSMC collaboration](https://news.skhynix.com/en/sk-hynix-partners-with-tsmc-to-strengthen-hbm-technological-leadership/), 19 April 2024 | Memory core/base-die roles; historical HBM4 plan, not proof of current production |
| F11 | [Micron HBM3E product page](https://www.micron.com/products/memory/hbm/hbm3e), living page | Generation/configuration-specific bandwidth, capacity and product illustrations |

## Architecture and model–machine source packets

These are representative disclosed designs and methods. They are not an assertion that every example is the newest available product.

| ID | Source and date | Curriculum use |
|---|---|---|
| A01 | [Intel AMX](https://www.intel.com/content/www/us/en/products/docs/accelerator-engines/what-is-intel-amx.html), living page | CPU control/vector/matrix execution distinctions |
| A02 | [NVIDIA Hopper architecture](https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/), 22 March 2022 | SM organization, data movement and specialized arithmetic |
| A03 | [AMD MI300 architecture](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html), living docs; [CDNA 3 white paper](https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/white-papers/amd-cdna-3-white-paper.pdf), pin revision | GPU chiplets, I/O dies, memory and APU comparison |
| A04 | [Google TPU v4 paper](https://arxiv.org/abs/2304.01433v3), 20 April 2023 revision | Specialized dataflow, SparseCore and system connectivity |
| A05 | [Google TPU7x docs](https://docs.cloud.google.com/tpu/docs/tpu7x), updated 26 August 2026 | Newer disclosed specimen; resolve differing GB/GiB labels before normalization |
| A06 | [AWS Trainium2 architecture](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/about-neuron/arch/neuron-hardware/trainium2.html), living docs | Physical/logical cores, data movement, memory, collective engines |
| A07 | [AWS Inferentia2 architecture](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/about-neuron/arch/neuron-hardware/inf2-arch.html), living docs | Inference-oriented architecture and instance/chip boundary |
| A08 | [AWS Trainium3 availability](https://aws.amazon.com/about-aws/whats-new/2025/12/amazon-ec2-trn3-ultraservers/), 2 December 2025 | New-generation update card; separate advertised comparisons from measured results |
| A09 | [Microsoft Maia 200 announcement](https://blogs.microsoft.com/blog/2026/01/26/maia-200-the-ai-accelerator-built-for-inference/), 26 January 2026 | Inference-oriented custom silicon; unknown precision/peak details remain explicit |
| A10 | [Meta next-generation MTIA](https://ai.meta.com/blog/next-generation-meta-training-inference-accelerator-AI-MTIA/), 10 April 2024 | Ranking/recommendation inference, SRAM/LPDDR alternative; historical specimen |
| A11 | [Cerebras WSE-3 Hot Chips presentation](https://hc2024.hotchips.org/assets/program/conference/day2/72_HC2024.Cerebras.Sean.v03.final.pdf), 2024 | Wafer-scale SRAM and dataflow; aggregate on-chip bandwidth differs from HBM link bandwidth |
| A12 | [Groq architecture](https://home.cloud.groq.io/lpu-architecture), living page | Compiler-scheduled streaming; recheck product/corporate status before release |
| A13 | [Roofline technical report](https://digicoll.lib.berkeley.edu/record/136692/files/EECS-2008-134.pdf), 2008 | Arithmetic intensity and attainable-performance bounds |
| A14 | [FlashAttention](https://arxiv.org/abs/2205.14135), 27 May 2022 | IO-aware attention and memory traffic; retain numerical assumptions |
| A15 | [MLCommons inference benchmark definitions](https://mlcommons.org/benchmarks/inference-datacenter/), living page | Workload/quality/latency rules and valid comparison conditions |

## Infrastructure and orbital source packets

| ID | Source and date | Curriculum use |
|---|---|---|
| I01 | [NVIDIA DGX GB rack hardware](https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html), updated 3 March 2026 | Documented rack reference and physical service boundaries |
| I02 | [IEA Key Questions on Energy and AI](https://www.iea.org/reports/key-questions-on-energy-and-ai), 16 April 2026 | Global forecast scenario and AI/all-data-center distinction |
| I03 | [LBNL 2025 Update](https://bies.lbl.gov/publications/united-states-data-center-energy-2025), June 2026 | Separately scoped U.S. energy study; full methodology retrieval pending |
| I04 | [LBNL 2024 data-center report](https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report.pdf), 19 December 2024 | Water accounting and methods; older demand forecast is not the current outlook |
| I05 | [PJM 2026 Load Forecast](https://www.pjm.com/-/media/DotCom/library/reports-notices/load-forecast/2026-load-report.pdf), January 2026 | Regional load methods and grid planning; use the report tables for numbers |
| I06 | [NASA thermal control](https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/), updated 18 May 2026 | Spacecraft heat-transfer mechanisms and constraints |
| I07 | [Suncatcher design paper v2](https://arxiv.org/html/2511.19468v2), 17 June 2026 revision | Proposed system, experiments/simulations and explicitly conditional scaling |
| I08 | [NASA TBIRD mission](https://www.nasa.gov/directorates/somd/space-communications-navigation-program/nasas-record-breaking-laser-demo-completes-mission/), September 2024 | Demonstrated burst communication versus sustained service |

## Evidence work required before implementation reaches publication

- Recover the migrated original Micron attachment and capture exact claim location/context; withhold a production numerical default until then. Distinguish empirical wafer-supply intensity from geometric die area per bit; only apply separate yield losses if the starting metric demonstrably excludes them.
- Build the fabrication flows from reviewed reference sequences, with measurement stage and alternatives explicit.
- Pin living product documentation, define dense/sparse precision and system boundaries, and reconcile unit conflicts.
- Collect current package/memory/substrate capacity statements independently; do not infer one from another’s capex.
- Curate a small verified multi-region facility dataset; establish site/campus/phase identity before expanding geographical coverage.
- Verify current orbital project milestones and identify whether each result is provider-reported, measured by the project authors, simulated or independently corroborated.
- Expand historical sources along device, patterning, interconnect, packaging/HBM, processor/dataflow and distributed/model-compute lineages. Record invention, publication, demonstration and production adoption as different event types.
- Obtain an engineering/editorial review of each proposed equation, process animation and scenario before claiming scientific completeness.


## Pre-freeze gap-review source packets

Reviewed 6 September 2026. These references motivate the six additions in PLAN.md section 16; each future lesson still requires claim-specific review. No new manufacturer capacity, utility consumption, contract price or failure-rate default is established here.

| ID | Source | Use and limitation |
|---|---|---|
| G01 | [TSMC intelligent packaging fab](https://www.tsmc.com/english/dedicatedFoundry/services/apm_intelligent_packaging_fab), living page | MES, process control, automated handling and die-level traceability; does not supply actual dispatching rules, customer queues or a complete facility-utilities specification. |
| G02 | [imec CMOS scaling and STCO](https://www.imec-int.com/en/expertise/cmos-advanced/compute/cmos-scaling), living page | Design/technology/system co-optimization connecting partitioning, memory and power; research context, with no universal optimal design. |
| G03 | [IBM signal and power integrity for chiplet integration](https://research.ibm.com/publications/signal-and-power-integrity-design-and-analysis-for-bunch-of-wires-bow-interface-for-chiplet-integration-on-advanced-packaging), ECTC 2023 | A specific BoW interface study motivates explicit electrical-interface budgets. Do not transfer its numeric results to arbitrary HBM/UCIe/package geometries. |
| G04 | [Chiplet Actuary](https://arxiv.org/abs/2203.12268), 2022 research preprint | Cost-model structure and yield/reuse/heterogeneity tradeoffs. Historical model assumptions are not current wafer, package or contract prices. |
| G05 | [OpenXLA GPU architecture](https://openxla.org/xla/gpu_architecture), living documentation | Representative graph/compiler/kernel/runtime path. Pin a revision before scene authoring; other stacks need their own route labels. |
| G06 | [Google Cloud checkpointing and ML goodput](https://cloud.google.com/blog/products/ai-machine-learning/elastic-training-and-optimized-checkpointing-improve-ml-goodput), provider technical article | Interruptions, recovery, checkpointing and observability as useful-work mechanisms. Provider performance claims are configuration-specific. |

Additional source work: representative tool and cleanroom/subfab utilities; time-dependent manufacturing examples; interface compatibility and dimensional conventions; full memory hierarchy; in-service reliability. Synthetic teaching parameters must remain identified as such until measured, transferable defaults are supported.
