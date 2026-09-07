import {writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
if(!process.env.ATLAS_REPO_ROOT)throw Error('Set ATLAS_REPO_ROOT to the atlas checkout.');
const repo=resolve(process.env.ATLAS_REPO_ROOT),lib=resolve(repo,'src/lib');
const load=file=>import(pathToFileURL(resolve(lib,file)));
const [a,f,h,hs]=await Promise.all(['architecture-execution.ts','fabrication-flow.ts','operating-hall.ts','operating-hall-scenarios.ts'].map(load));
const contracts=[];
for(const [id,input]of [['A1',a.architecturePresets.two],['A2',{...a.architecturePresets.two,inactiveLanes:[1,2,3]}],['A3',{...a.architecturePresets.three,arraySize:2}]]){
 const r=a.buildArchitectureComparison(input);contracts.push({id,experience:'architecture',modelVersion:a.architectureVersion,lesson:'tensor-core',studio:'architecture',input:r.input,expected:{output:r.reference,traces:Object.fromEntries(Object.entries(r.traces).map(([k,v])=>[k,v.totals]))}});
}
for(const [id,patch]of [['F1',{}],['F2',{uncertaintyScale:3}],['F3',{maskInitialNm:5}],['F4',{qualificationEvidence:'not-provided'}]]){
 const input={...f.fabricationDefaults,...patch},r=f.evaluateFabricationFlow(input);
 contracts.push({id,experience:'fabrication',modelVersion:f.fabricationFlowVersion,lesson:'thermal-oxidation-interface',studio:'fabrication',input,expected:{filmNm:r.specimen.actualFilmNm,developedCdNm:r.specimen.developedCdNm,transferredCdNm:r.specimen.actualCdNm,maskRemainingNm:r.specimen.maskRemainingNm,oxideRemainingNm:r.specimen.remainingOxideNm,grossDies:r.wafer.grossDies,eligibleDies:r.wafer.eligibleDiesPerWafer,reviewDies:r.wafer.reviewDiesPerWafer,screenedGoodDies:r.wafer.screenedGoodDies,assemblyStarts:r.assembly.starts,acceptedOutput:r.acceptedOutput,outputStatus:r.outputStatus}});
}
for(const [i,e]of hs.operatingHallExamples().entries()){
 const r=h.simulateOperatingHall(e.scenario);contracts.push({id:`H${i+1}`,name:e.label,experience:'hall',modelVersion:h.OPERATING_HALL_VERSION,lesson:'memory-to-hall-propagation',studio:'hall',input:e.scenario,expected:{admittedRacks:r.admission.admittedRacks,rackItW:r.admission.maxRackItW,rackCurrentA:r.admission.maxRackCurrentA,packageCurrentA:r.admission.maxPackageCurrentA,service:r.service,final:r.final.counters,fault:r.events.find(e=>e.kind==='fault'),summary:r.summary}});
}
const toy=hs.createOperatingHallScenario();
Object.assign(toy,{workload:hs.denseGemmWorkload(2,2,2,8),installed:{racks:1,packagesPerRack:1},durationS:20,sampleS:.25,faults:[{id:'teaching-stop',atS:12,recoveryDelayS:2,cause:'worker-stop'}],checkpoint:{intervalRunS:8,commitLatencyS:.25},cooling:{massFlowKgS:1,specificHeatJkgK:4180,maxRiseK:10}});
Object.assign(toy.electrical,{facilityFeedLimitW:100,rackBusV:48,rackInputLimitA:100,packageBusV:1,packageRailLimitA:100,conversionEfficiency:1,pue:1.25,auxiliaryRackW:0,packageRunW:8,packageCheckpointW:4,packageRecoveryW:2});
Object.assign(toy.service,{computeOpsPerPackageS:32,memoryBytesPerPackageS:256,networkBytesPerRackS:64,networkHallLimitBytesS:64,checkpointBytesPerRackS:32,checkpointHallLimitBytesS:32,communication:'serialized'});
const r=h.simulateOperatingHall(toy);
contracts.push({id:'H7',name:'Hand-checkable commit and restart',experience:'hall',modelVersion:h.OPERATING_HALL_VERSION,lesson:'retained-work-restart-boundary',studio:'hall',uiAvailability:'Complete contract executes with included runner; tiny service rates are not all exposed by the current browser controls.',input:toy,expected:{admittedRacks:r.admission.admittedRacks,service:r.service,final:r.final.counters,events:r.events,atFault:h.sampleOperatingHall(r,12),atHorizon:h.sampleOperatingHall(r,20),summary:r.summary}});
const files=await Promise.all(['architecture-execution.ts','fabrication-flow.ts','operating-hall.ts','operating-hall-scenarios.ts'].map(async file=>({path:`src/lib/${file}`,sha256:createHash('sha256').update(await readFile(resolve(lib,file))).digest('hex')})));
await writeFile(new URL('scenario-contracts.json',import.meta.url),JSON.stringify({schema:'atlas-instructor-scenarios-1',createdOn:'2026-09-07',modelFiles:files,scope:'Complete synthetic model inputs and reproducible expected outputs. Studio fragments select an experience, not all numeric inputs. No account or student identifier is required.',contracts},null,2)+'\n');
console.log(contracts.map(c=>({id:c.id,experience:c.experience,...(c.id==='H7'?{final:c.expected.final}:{} )})));
