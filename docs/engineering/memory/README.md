# A bit, a stack and a working set

This explorer connects a selected bit to a declared memory hierarchy, follows the selected DRAM die through its stack interfaces, and connects the package's memory capacity to weights, KV cache and transient work. It reuses the atlas's existing stack and workload calculations. A compact symbolic address map makes the relationships inspectable without claiming to reveal a vendor floorplan or physical address function.

## The address is a declared contract

Real HBM provides channel and pseudo-channel structure, as documented by [Micron](https://www.micron.com/products/memory/hbm/hbm3e). Controllers choose how system addresses map into memory fields; [Intel's HBM2 controller guide](https://cdrdv2-public.intel.com/705204/ug-20031-18-1-1-683189-705204.pdf) documents alternative address orders. The explorer uses its own explicit teaching order, with no vendor dimensions or mappings implied.

From least-significant to most-significant byte-address fields:

| Field | Count | Stride in bytes | Bits |
|---|---:|---:|---:|
| Byte within word | 4 | 1 | 0–1 |
| Word column | 256 | 4 | 2–9 |
| Bank | 16 | 1,024 | 10–13 |
| Pseudo-channel | 2 | 16,384 | 14 |
| Logical channel slice within die | 2 | 32,768 | 15 |
| Row | 32,768 | 65,536 | 16–30 |
| Die | Chosen stack height | 2,147,483,648 | 31 upward |

The bit selector chooses one of eight bits inside the addressed byte. It is not another byte-address bit. Four bytes form the illustrative 32-bit word. No burst protocol, ECC storage, repair map, redundancy, subarray layout or cell electrical state is inferred. `byteValue` supplies an example byte for the bit diagram; it is not read from an actual model or memory device.

Every DRAM die has a 2 GiB mapped teaching window. The existing stack model uses decimal GB and retains its complete capacity. For eight dies, the map covers 16 GiB inside the existing 24 GB stack example, and reports the remaining 6,820,130,816 bytes separately. This unmapped capacity is outside the explorer's address window, not defective or unavailable capacity. The teaching channel slices also do not determine external pin counts or bandwidth.

`decodeMemoryAddress` and `encodeMemoryAddress` are exact inverses for valid addresses. Arithmetic avoids JavaScript's 32-bit bitwise truncation. A 12-die stack allows die values 0–11; unused high address patterns are rejected. The selected package stack is a separate index, so changing it preserves the local address fields.

`accessMemoryRow` maintains a small map of open rows per bank. A closed bank needs ACTIVATE then READ; a hit on its open row needs READ; a different row in the same bank needs PRECHARGE, ACTIVATE and READ. Other bank state remains intact. This illustrates the dependencies described by [Microchip](https://onlinedocs.microchip.com/oxy/GUID-B822915F-C375-4172-91BD-AB6F326EB783-en-US-1/GUID-F3B24B38-CBB2-434E-A89A-EC8BB4810756.html). Timing, refresh, arbitration and electrical signaling are outside this state machine.

## Stack structure carries heat and displacement

The stack outline partitions exactly into the existing base thickness, repeated interface gaps and DRAM dies, and cap allowance. Each layer has physical micrometre boundaries, a material role and a selected-die flag. The wider die outline uses a square of the existing die area. Logical bank cells are symbolic coordinates; they do not locate real arrays or TSV routes on that outline.

TC-NCF, MR-MUF and hybrid selection uses the existing `bondRoutes` gap and thermal resistance values. These remain synthetic atlas presets. The [source ledger](memory-interface-sources.json) identifies the published material roles: solder-bearing connections with film or molded underfill, versus copper/dielectric hybrid interfaces. The separate local pad width and assembly offset are declared geometry controls, not vendor capabilities.

The existing one-dimensional stack model supplies temperatures and thermal margins. At each interface, the illustrative temperature excursion combines the ambient-cycle amplitude with a selected fraction of the existing self-heating rise. The free differential expansion is:

    displacement [µm] = mismatch [ppm/K] × 10^-6
                        × temperature excursion [K]
                        × distance from neutral point [mm] × 1,000

For solder-bearing routes, displacement divided by the existing gap is a geometric shear indicator. [NASA/JPL's package study](https://nepp.nasa.gov/files/24512/13_JPL_EEE_Parts_Bulletin_Vol%205%20Issue%203%20JuneJuly%20rec%207%2023%2013.pdf) motivates the relationship. Its CGA/package-board setting does not calibrate HBM joints. Constraint, warpage, elastic modulus, viscoplastic relaxation, cycling damage and fatigue life are not solved. Hybrid returns no solder shear indicator. No route gets a yield or reliability advantage from this analogy.

Visible pad overlap is another independent condition. Equal square pads displaced in one axis have overlap fraction max(0, 1 − offset / pad width). Zero overlap prevents accepted example output; partial overlap alone proves no electrical resistance or reliability result. Assembly registration and later thermal mismatch describe different conditions and are not added into an invented pass/fail threshold.

## Test and qualification remain distinct

Known-good die inputs, post-bond functional evidence and scoped reliability qualification are three separate gates. `synthetic-pass` means fictional supporting evidence is assumed for the example. Pending or failed evidence prevents accepted output. Existing thermal or height limits also remain binding. Mechanical indicators have no invented acceptance threshold.

Starts equal already-screened memory dies divided by dies per stack. The existing conditional stack survival applies once afterward. No wafer defect yield is charged again. Modeled good stacks remain visible even when qualification evidence is pending; accepted example stacks then remain zero. Neither number is a field reliability prediction.

## The bit connects to a workload boundary

The residency view comes directly from `placeInference` through `systemScenario`. Weights are read-only during the selected inference step. KV and workspace are mutable; SRAM holds a reusable compute tile. [PagedAttention](https://arxiv.org/abs/2309.06180) explains why dynamic KV growth matters, but this aggregate model does not implement its paging scheme.

The HBF illustration places only pretrained weights on the read tier. [Sandisk's published exploration](https://www.sandisk.com/company/newsroom/blogs/2025/scaling-beyond-the-wall-inside-sandisks-high-bandwidth-flash-for-ai) discusses that workload. Read-only is this model's placement policy, not a physical claim that NAND cannot be programmed. Flash writes, mutable KV on HBF, endurance and current product availability are not inferred.

A declared contiguous layout within each tier connects the selected stack-local address to a workspace, KV or weight segment, or free capacity. This layout illustrates ownership; it is not an actual runtime allocator or controller address mapping. Package stack stride uses complete existing stack capacity, while each local mapper still covers only its declared window.

Remote data requires a source read, an HBM staging write and a later HBM read. The flow arrays distinguish these operations and preserve the existing traffic accounting. New KV appends, the host-resident append share and the existing activation-traffic allowance are separate flows. Static capacity, staging space and one-step decode headroom are separate results. At context 32,768, the existing default workload fits statically but lacks next-step headroom; changing weight storage from 16 to 8 bits restores headroom. This is a bounded scenario result, not a guarantee for indefinitely growing generation.

## Integration

The [pure TypeScript module](memory-interfaces.ts) has no imports. Supply the atlas's existing modules directly:

```ts
import { referenceSystem } from './reference-system';
import { hbmStackDefaults, bondRoutes } from './numeric-math';
import { systemScenario } from './investigation-models';
import { memoryContextFromAtlas, memoryExplorerDefaults,
         evaluateMemoryExplorer } from './memory-interfaces';

const context = memoryContextFromAtlas(scenario, {
  referenceSystem, hbmStackDefaults, bondRoutes, systemScenario,
});
const result = evaluateMemoryExplorer(memoryExplorerDefaults, context);
```

`hierarchy`, `address.fields`, `bankWindow` and `bits` support the package-to-bit traversal. `stack.layers` and `stack.interfaces` support stack sections; positive Z points upward. `interfaceDetail` holds the selected local geometry and mechanical indicator. `evidence` and `residency` keep acceptance and workload boundaries explicit. `memoryExplorerLessons` links six chapters to existing atlas lessons and evidence IDs.

[Reproducible examples](memory-interface-examples.json) contain complete scenario and explorer inputs. Run the six standalone checks and nine integration checks using a Node runtime with TypeScript stripping:

```sh
ATLAS_REPO_ROOT=/path/to/atlas node --experimental-strip-types --test \
  memory-interfaces.test.mjs atlas-integration.test.mjs
```

The integration suite loads existing atlas modules read-only. It verifies shared values, exact layer partitioning, unit conversions, separate evidence gates, residency conservation, bounded headroom and input rejection. No device, process or learner validation is represented as completed by these software checks.
