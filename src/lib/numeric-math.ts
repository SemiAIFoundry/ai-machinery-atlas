/** Synthetic, dimensioned engineering models. These are not product specifications. */
const finite=(x:number,name:string,min=0)=>{if(!Number.isFinite(x)||x<min)throw new RangeError(`${name} must be finite and ≥ ${min}`);return x;};
const positive=(x:number,name:string)=>{finite(x,name);if(x===0)throw new RangeError(`${name} must be positive`);return x;};
const fraction=(x:number,name:string)=>{finite(x,name);if(x>1)throw new RangeError(`${name} must be ≤ 1`);return x;};
const integer=(x:number,name:string,min=1)=>{finite(x,name,min);if(!Number.isInteger(x))throw new RangeError(`${name} must be an integer`);return x;};
export const GiB=2**30, MiB=2**20;
export type BondRoute='tc-ncf'|'mr-muf'|'hybrid';
export const bondRoutes={
 'tc-ncf':{name:'TC–NCF',gapUm:12,interfaceKW:.025,description:'Sequential thermocompression with non-conductive film. Micro-bumps connect dies; TSVs traverse the silicon.'},
 'mr-muf':{name:'MR–MUF',gapUm:10,interfaceKW:.02,description:'Mass reflow forms micro-bump joints; molded underfill fills and supports the stack. TSVs traverse the silicon.'},
 hybrid:{name:'Hybrid bonding',gapUm:1,interfaceKW:.012,description:'Prepared dielectric surfaces and copper contacts bond directly. TSV routing and substrate preparation remain necessary.'}
} as const;
export type HbmStackInput={dies:number;dieUm:number;dieGbit:number;gapUm:number;baseUm:number;capUm:number;limitUm:number;dataPins:number;pinGbps:number;efficiency:number;residualDieYield:number;bondYield:number;finalYield:number;diePowerW:number;basePowerW:number;areaMm2:number;siliconWmK:number;interfaceKW:number;coolerKW:number;coolantC:number;limitC:number};
export const hbmStackDefaults:HbmStackInput={dies:8,dieUm:45,dieGbit:24,gapUm:12,baseUm:100,capUm:30,limitUm:720,dataPins:1024,pinGbps:8,efficiency:.8,residualDieYield:.999,bondYield:.995,finalYield:.99,diePowerW:.8,basePowerW:1.5,areaMm2:80,siliconWmK:100,interfaceKW:.025,coolerKW:1.5,coolantC:40,limitC:85};
export function hbmStack(v:HbmStackInput){
 integer(v.dies,'DRAM die count');integer(v.dataPins,'data pins');positive(v.dieUm,'die thickness');positive(v.dieGbit,'die density');positive(v.areaMm2,'die area');positive(v.siliconWmK,'silicon conductivity');
 ['gapUm','baseUm','capUm','limitUm','pinGbps','diePowerW','basePowerW','interfaceKW','coolerKW'].forEach(k=>finite(v[k as keyof HbmStackInput],k));
 ['efficiency','residualDieYield','bondYield','finalYield'].forEach(k=>fraction(v[k as keyof HbmStackInput],k));
 if(!Number.isFinite(v.coolantC)||!Number.isFinite(v.limitC))throw new RangeError('temperatures must be finite');
 const interfaces=v.dies; // n DRAM dies: n−1 inter-DRAM bonds plus one base-die bond.
 const heightUm=v.baseUm+v.capUm+v.dies*v.dieUm+interfaces*v.gapUm;
 const capacityGB=v.dies*v.dieGbit/8,rawGBs=v.dataPins*v.pinGbps/8;
 const conditionalYield=v.residualDieYield**v.dies*v.bondYield**interfaces*v.finalYield;
 const totalPowerW=v.basePowerW+v.dies*v.diePowerW;
 const siliconKW=v.dieUm/(v.siliconWmK*v.areaMm2),layerKW=siliconKW+v.interfaceKW;
 // One-dimensional distributed heat sources, all heat exits through the top.
 // Each downward segment carries only the power generated below that segment.
 const temperatures=Array<number>(v.dies+1);temperatures[v.dies]=v.coolantC+totalPowerW*v.coolerKW;
 for(let below=v.dies-1;below>=0;below--)temperatures[below]=temperatures[below+1]+(v.basePowerW+below*v.diePowerW)*layerKW;
 const peakC=Math.max(...temperatures),heightMarginUm=v.limitUm-heightUm,thermalMarginC=v.limitC-peakC;
 return {interfaces,heightUm,capacityGB,rawGBs,deliveredGBs:rawGBs*v.efficiency,conditionalYield,expectedPer1000:1000*conditionalYield,totalPowerW,siliconKW,layerKW,temperatures,peakC,heightMarginUm,thermalMarginC,withinLimits:heightMarginUm>=0&&thermalMarginC>=0};
}

export type Workload={paramsB:number;weightBits:number;batch:number;layers:number;context:number;kvHeads:number;headDim:number;kvElementBytes:number};
export const workloadDefaults:Workload={paramsB:70,weightBits:16,batch:8,layers:80,context:8192,kvHeads:8,headDim:128,kvElementBytes:2};
export function inferenceBytes(v:Workload){
 finite(v.paramsB,'parameters');positive(v.weightBits,'weight bits');['batch','layers','kvHeads','headDim'].forEach(k=>integer(v[k as keyof Workload],k));integer(v.context,'context',0);positive(v.kvElementBytes,'KV element bytes');
 const weights=v.paramsB*1e9*v.weightBits/8,append=2*v.batch*v.layers*v.kvHeads*v.headDim*v.kvElementBytes;
 return {weights,kv:append*v.context,append,total:weights+append*v.context};
}
export type TransferInput={bytes:number;sourceGBs:number;linkGBs:number;efficiency:number;latencyUs:number;chunkBytes:number;concurrency:number};
export function transferService(v:TransferInput){
 finite(v.bytes,'transfer bytes');positive(v.sourceGBs,'source bandwidth');positive(v.linkGBs,'link bandwidth');positive(v.efficiency,'transfer efficiency');fraction(v.efficiency,'transfer efficiency');finite(v.latencyUs,'access latency');positive(v.chunkBytes,'chunk size');integer(v.concurrency,'concurrent requests');
 const chunks=Math.ceil(v.bytes/v.chunkBytes),waves=Math.ceil(chunks/v.concurrency),payloadSeconds=v.bytes/(Math.min(v.sourceGBs,v.linkGBs)*v.efficiency*1e9),startupSeconds=waves*v.latencyUs*1e-6,seconds=payloadSeconds+startupSeconds;
 return {chunks,waves,payloadSeconds,startupSeconds,seconds,effectiveGBs:seconds?v.bytes/seconds/1e9:0};
}
export type PlacementInput=Workload & {sramMiB:number;tileMiB:number;hbmGiB:number;hostGiB:number;hbfGiB:number;workspaceGiB:number;policy:'kv-first'|'weights-first';useHbf:boolean;hbmGBs:number;packageGBs:number;hostGBs:number;hostLinkGBs:number;hbfGBs:number;hbfLinkGBs:number;sramGBs:number;sramLatencyUs:number;hbmLatencyUs:number;hostLatencyUs:number;hbfLatencyUs:number;efficiency:number;chunkMiB:number;concurrency:number};
export const placementDefaults:PlacementInput={...workloadDefaults,sramMiB:64,tileMiB:16,hbmGiB:96,hostGiB:256,hbfGiB:512,workspaceGiB:2,policy:'kv-first',useHbf:true,hbmGBs:3000,packageGBs:2500,hostGBs:200,hostLinkGBs:64,hbfGBs:800,hbfLinkGBs:600,sramGBs:20000,sramLatencyUs:.01,hbmLatencyUs:.3,hostLatencyUs:2,hbfLatencyUs:25,efficiency:.75,chunkMiB:8,concurrency:8};
export function placeInference(v:PlacementInput){
 const size=inferenceBytes(v);['sramMiB','tileMiB','hbmGiB','hostGiB','hbfGiB','workspaceGiB'].forEach(k=>finite(v[k as keyof PlacementInput] as number,k));
 if(v.policy!=='kv-first'&&v.policy!=='weights-first')throw new RangeError('unknown placement policy');
 const caps={sram:v.sramMiB*MiB,hbm:v.hbmGiB*GiB,host:v.hostGiB*GiB,hbf:v.useHbf?v.hbfGiB*GiB:0};
 const workspace=Math.min(v.workspaceGiB*GiB,caps.hbm);let hbmFree=caps.hbm-workspace;
 const hbm={weights:0,kv:0,workspace};for(const key of v.policy==='kv-first'?['kv','weights'] as const:['weights','kv'] as const){hbm[key]=Math.min(size[key],hbmFree);hbmFree-=hbm[key];}
 const hbfWeights=Math.min(caps.hbf,size.weights-hbm.weights),hostKv=Math.min(caps.host,size.kv-hbm.kv),hostWeights=Math.min(Math.max(0,caps.host-hostKv),size.weights-hbm.weights-hbfWeights);
 const missing={weights:Math.max(0,size.weights-hbm.weights-hbfWeights-hostWeights),kv:Math.max(0,size.kv-hbm.kv-hostKv),workspace:v.workspaceGiB*GiB-workspace,tile:Math.max(0,v.tileMiB*MiB-caps.sram)};
 const externalWeights=hbfWeights+hostWeights,externalRead=externalWeights+hostKv;
 // All remote bytes are staged: one HBM write and one later HBM read.
 // These are distinct physical transfers. HBM/package is one shared path.
 const hbmTraffic=hbm.weights+hbm.kv+2*externalRead;
 const service=(bytes:number,sourceGBs:number,linkGBs:number,latencyUs:number)=>transferService({bytes,sourceGBs,linkGBs,latencyUs,efficiency:v.efficiency,chunkBytes:v.chunkMiB*MiB,concurrency:v.concurrency});
 const times={hbm:service(hbmTraffic,v.hbmGBs,v.packageGBs,v.hbmLatencyUs),host:service(hostKv+hostWeights,v.hostGBs,v.hostLinkGBs,v.hostLatencyUs),hbf:service(hbfWeights,v.hbfGBs,v.hbfLinkGBs,v.hbfLatencyUs),sram:service(v.tileMiB*MiB,v.sramGBs,v.sramGBs,v.sramLatencyUs)};
 // Upper workspace requirement: one transfer chunk per concurrent request.
 const requiredStagingBytes=externalRead>0?Math.min(externalRead,v.chunkMiB*MiB*v.concurrency):0;
 const stagingFits=workspace>=requiredStagingBytes;
 const feasible=Object.values(missing).every(n=>n<=1e-5)&&stagingFits;
 const limiting=Object.entries(times).filter(([k])=>k!=='sram').sort((a,b)=>b[1].seconds-a[1].seconds)[0][0];
 return {size,caps,hbm,hbf:{weights:hbfWeights,kv:0},host:{weights:hostWeights,kv:hostKv},sram:{tile:Math.min(v.tileMiB*MiB,caps.sram)},missing,hbmTraffic,externalRead,requiredStagingBytes,stagingFits,feasible,times,limiting,serialReadSeconds:times.hbm.seconds+times.host.seconds+times.hbf.seconds,pipelinedReadSeconds:Math.max(times.hbm.seconds,times.host.seconds,times.hbf.seconds)};
}

export type TokenInput=Workload & {queryHeads:number;ranks:number;hbmGiB:number;activationBytes:number;computeTFLOPS:number;hbmGBs:number;packageGBs:number;efficiency:number;memoryLatencyUs:number;networkGBs:number;networkLatencyUs:number;collectivesPerLayer:number;launchUs:number;sampleUs:number;overlap:boolean;baseW:number;computeW:number;memoryW:number;networkW:number;hostW:number};
export const tokenDefaults:TokenInput={...workloadDefaults,batch:4,queryHeads:32,ranks:4,hbmGiB:96,activationBytes:2,computeTFLOPS:300,hbmGBs:3000,packageGBs:2400,efficiency:.75,memoryLatencyUs:.3,networkGBs:100,networkLatencyUs:2,collectivesPerLayer:2,launchUs:20,sampleUs:20,overlap:true,baseW:70,computeW:300,memoryW:65,networkW:30,hostW:30};
export type TimelineItem={id:string;name:string;start:number;duration:number;detail:string};
export function tokenSystem(v:TokenInput){
 const bytes=inferenceBytes(v);integer(v.queryHeads,'query heads');integer(v.ranks,'tensor-parallel ranks');integer(v.collectivesPerLayer,'collectives per layer',0);positive(v.activationBytes,'activation element bytes');
 if(v.queryHeads%v.kvHeads!==0||v.queryHeads%v.ranks!==0)throw new RangeError('query heads must divide across KV groups and ranks');
 const kvPartitions=Math.min(v.kvHeads,v.ranks);if(v.kvHeads%kvPartitions!==0)throw new RangeError('KV heads must divide across participating partitions');
 ['computeTFLOPS','hbmGBs','packageGBs','networkGBs'].forEach(k=>positive(v[k as keyof TokenInput] as number,k));positive(v.efficiency,'efficiency');fraction(v.efficiency,'efficiency');
 ['memoryLatencyUs','networkLatencyUs','launchUs','sampleUs','baseW','computeW','memoryW','networkW','hostW'].forEach(k=>finite(v[k as keyof TokenInput] as number,k));
 finite(v.hbmGiB,'HBM capacity');
 const hidden=v.queryHeads*v.headDim,weightBytes=bytes.weights/v.ranks,kvReadBytes=bytes.kv/kvPartitions,kvAppendBytes=bytes.append/kvPartitions;
 const activationTraffic=2*v.batch*hidden*v.activationBytes*v.layers/v.ranks;
 const memoryBytes=weightBytes+kvReadBytes+kvAppendBytes+activationTraffic;
 const residentBytes=weightBytes+kvReadBytes+2*GiB,capacityMarginBytes=v.hbmGiB*GiB-residentBytes;
 const denseFlops=2*v.paramsB*1e9*v.batch/v.ranks,attentionFlops=4*v.batch*v.layers*v.context*v.queryHeads*v.headDim/v.ranks;
 const computeSeconds=(denseFlops+attentionFlops)/(v.computeTFLOPS*1e12*v.efficiency);
 const effectiveMemoryGBs=Math.min(v.hbmGBs,v.packageGBs)*v.efficiency;
 const memorySeconds=memoryBytes/(effectiveMemoryGBs*1e9)+v.layers*v.memoryLatencyUs*1e-6;
 const collectivePayload=v.batch*hidden*v.activationBytes,collectives=v.layers*v.collectivesPerLayer;
 const networkTraffic=2*(v.ranks-1)/v.ranks*collectivePayload*collectives;
 const networkSeconds=networkTraffic/(v.networkGBs*1e9*v.efficiency)+2*(v.ranks-1)*v.networkLatencyUs*1e-6*collectives;
 const launch=v.launchUs*1e-6,sample=v.sampleUs*1e-6,core=v.overlap?Math.max(computeSeconds,memorySeconds):computeSeconds+memorySeconds;
 const seconds=launch+core+networkSeconds+sample;
 const rankEnergyJ=v.baseW*seconds+v.computeW*computeSeconds+v.memoryW*memorySeconds+v.networkW*networkSeconds,energyJ=v.ranks*rankEnergyJ+v.hostW*seconds;
 const computeStart=launch+(v.overlap?0:memorySeconds),networkStart=launch+core;
 const timeline:TimelineItem[]=[
  {id:'launch',name:'Dispatch',start:0,duration:launch,detail:'Host schedules one batched decode step.'},
  {id:'memory',name:'HBM → package → tensor tiles',start:launch,duration:memorySeconds,detail:'Weights, prior KV, new KV and a small activation-traffic allowance. One bandwidth bottleneck covers the HBM/package path.'},
  {id:'compute',name:'Tensor arithmetic',start:computeStart,duration:computeSeconds,detail:'Dense parameter work plus QK and AV attention work, partitioned across tensor-parallel ranks.'},
  {id:'network',name:'Tensor-parallel collectives',start:networkStart,duration:networkSeconds,detail:'Ring communication is serialized with local work in this model. No collective traffic or startup exists for one rank.'},
  {id:'sample',name:'Choose next tokens',start:networkStart+networkSeconds,duration:sample,detail:'A fixed synthetic sampling/readout allowance produces one token per sequence.'}
 ];
 return {hidden,kvPartitions,residentBytes,capacityMarginBytes,fitsMemory:capacityMarginBytes>=0,weightBytes,kvReadBytes,kvAppendBytes,activationTraffic,memoryBytes,denseFlops,attentionFlops,effectiveMemoryGBs,computeSeconds,memorySeconds,collectivePayload,collectives,networkTraffic,networkSeconds,core,seconds,energyJ,perTokenJ:energyJ/v.batch,averageW:seconds?energyJ/seconds:0,tokensPerSecond:seconds?v.batch/seconds:0,overlapSavedSeconds:computeSeconds+memorySeconds-core,timeline,localBottleneck:memorySeconds>=computeSeconds?'Memory / package':'Tensor compute'};
}
