/** One synthetic configuration; not a vendor product or an Astra disclosure. */
export const referenceSystem = {
 id:'atlas-reference-v1', name:'Illustrative two-die accelerator system',
 package:{logicDies:2,hbmStacks:8,interposers:1,substrates:1,hbmGBPerStack:24,powerW:1000},
 rack:{packages:64,powerKW:100,hostAndNetworkKW:36},
 hall:{facilityMW:20,pue:1.2},
 workload:{parametersB:70,weightBits:16,kvBytes:2,layers:80,kvHeads:8,headDimension:128,contextTokens:8192,batch:8},
 provenance:'Synthetic teaching inputs. Capacity is decimal GB; workload storage can be displayed in GiB. Power is a planning point, not a measured load curve.'
} as const;
