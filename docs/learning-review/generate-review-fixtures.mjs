import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const destination = dirname(fileURLToPath(import.meta.url));
// Installed location: docs/learning-review. Outside that layout, pass the repository root explicitly.
const repository = process.argv[2] ? resolve(process.argv[2]) : resolve(destination, '../..');
const modelPaths = ['src/lib/investigation-models.ts','src/lib/numeric-math.ts','src/lib/deep-math.ts','src/lib/reference-system.ts'];
const modelSources = modelPaths.map(path => ({path, sha256:createHash('sha256').update(readFileSync(resolve(repository,path))).digest('hex')}));
const {learningContract,scenarioDefaults,systemScenario,switchingScenario,attentionScenario,readInvestigationDocument} = await import(pathToFileURL(resolve(repository,modelPaths[0])).href);
const nearly=(actual,expected)=>assert.ok(Math.abs(actual-expected)<=Math.max(1e-12,Math.abs(expected)*1e-12),`${actual} differs from ${expected}`);
function outputs(s) {
 const a=switchingScenario(s),r=systemScenario(s),t=attentionScenario(s.query,s.temperature);
 return {
  switching:{currentMicroA:a.currentA*1e6,supplyEnergyFJ:a.supplyEnergyJ*1e15,storedEnergyFJ:a.storedEnergyJ*1e15,delayPS:a.delaySeconds*1e12,effectiveOhms:a.effectiveOhms,sum:a.sum,binary:a.binary,bits:a.bits,terms:a.terms,mac:a.mac,D:s.a&1,Q:s.heldBit,clockEdges:s.clockEdges},
  manufacturing:{heightUm:r.stack.heightUm,heightMarginUm:r.stack.heightMarginUm,peakTemperatureC:r.stack.peakC,withinEnvelope:r.stack.withinLimits,stackCapacityGB:r.stack.capacityGB,packageCapacityGB:r.packageCapacityGB,conditionalStackSurvival:r.stack.conditionalYield,screenedLogicDiesPerMonth:r.logicDies,screenedMemoryDiesPerMonth:r.screenedMemoryDies,stackStartsPerMonth:r.stackStarts,goodStacksPerMonth:r.goodStacks,packageEquivalentStreamsPerMonth:r.capacity.stages,limitingSupplyStreams:r.capacity.limiting,rawPackagesPerMonth:r.capacity.raw,acceptedPackagesBeforeCompatibilityPerMonth:r.capacity.good,compatiblePackagesPerMonth:r.compatiblePackages},
  facility:{packagePlanningW:r.packageW,rackPlanningW:r.rackW,powerSupportedFullRacks:r.powerRacks,supplySupportedFullRacks:r.supplyRacks,activeFullRacks:r.activeRacks},
  memory:{requiredBytes:r.placement.size,capacityBytes:r.placement.caps,hbmBytes:r.placement.hbm,hostBytes:r.placement.host,hbfBytes:r.placement.hbf,missingBytes:r.placement.missing,requiredStagingBytes:r.placement.requiredStagingBytes,stagingFits:r.placement.stagingFits,currentPlacementFits:r.placement.feasible,nextStepFits:r.nextStepFits,executionFeasible:r.executionFeasible,newKVBytes:r.token.kvAppendBytes,hostAppendBytes:r.hostAppendBytes},
  execution:{tierReadSeconds:r.placement.serialReadSeconds,readAndAdditionalTransferSeconds:r.readSeconds,computeSeconds:r.token.computeSeconds,candidateStepSeconds:r.stepSeconds,runnableStepSeconds:r.executionFeasible?r.stepSeconds:null,packageTokensPerSecond:r.packageTokensPerSecond,hallTokensPerSecond:r.hallTokensPerSecond},
  attention:{queryIndex:s.query,queryVector:t.q,attentionScores:t.scores,attentionWeights:t.weights,mixedVector:t.mixed,readoutLogits:t.logits,readoutProbabilities:t.probabilities,predictedIndex:t.predicted,predictedToken:['silicon','switch','memory','token'][t.predicted],queryRetrievalCorrect:t.correct,tied:t.tied},
 };
}
function fixture(id,caseId,patch={},purpose='Reviewer setup for the named task stage.') {
 const document={...learningContract,caseId,scenario:{...scenarioDefaults,...patch}};
 assert.deepEqual(readInvestigationDocument(JSON.stringify(document)).scenario,document.scenario);
 const expected=outputs(document.scenario);
 assert.equal(expected.memory.hbfBytes.kv,0);
 nearly(expected.attention.attentionWeights.reduce((a,b)=>a+b,0),1);
 nearly(expected.attention.readoutProbabilities.reduce((a,b)=>a+b,0),1);
 assert.equal(expected.switching.sum,document.scenario.a+document.scenario.b);
 nearly(expected.switching.supplyEnergyFJ,2*expected.switching.storedEnergyFJ);
 const m=expected.memory;
 nearly(m.hbmBytes.weights+m.hostBytes.weights+m.hbfBytes.weights+m.missingBytes.weights,m.requiredBytes.weights);
 nearly(m.hbmBytes.kv+m.hostBytes.kv+m.missingBytes.kv,m.requiredBytes.kv);
 if(!m.executionFeasible)assert.equal(expected.execution.packageTokensPerSecond,0);
 return {id,purpose,document,expected};
}
const cards=[
 {id:'A1',before:{},after:{loadFf:20},transfer:{loadFf:30}},
 {id:'A2',before:{},after:{voltage:1},transferUnsupported:{voltage:.3,reason:'Below the permitted 0.5 V control minimum and the 0.4 V synthetic threshold. Discussion only; not an importable scenario.'}},
 {id:'A3',before:{},after:{a:15,b:1},changedLoad:{a:15,b:1,loadFf:20},transfer:{a:11,b:6}},
 {id:'B1',before:{},after:{memoryWafers:160},transfer:{memoryWafers:160,logicWafers:1}},
 {id:'B2',before:{},after:{dies:12},routeComparison:{dies:12,route:'hybrid'},transfer:{dies:16,route:'hybrid'}},
 {id:'B3',before:{},after:{facilityMW:.1},transfer:{facilityMW:4}},
 {id:'C1',before:{query:2},after:{query:2,temperature:5},transfer:{query:2,temperature:5,facilityMW:4}},
 {id:'C2',before:{},after:{context:32768},hbfComparison:{context:32768,useHbf:true},transfer:{weightBits:8}},
 {id:'C3',before:{dies:4},after:{dies:4,context:131072,batch:32},recovery:{dies:4,context:8192,batch:1},recoveryWithLowerWeightPrecision:{dies:4,context:8192,batch:1,weightBits:8},transfer:{dies:4,context:131072,batch:32,useHbf:true}},
].map(card=>{
 const caseId=card.id.startsWith('A')?'switching':card.id.startsWith('B')?'manufacturing':'execution';
 return {id:card.id,caseId,stages:Object.entries(card).filter(([key])=>key!=='id'&&key!=='transferUnsupported').map(([stage,patch])=>({...fixture(`${card.id}-${stage}`,caseId,patch),stage})),...(card.transferUnsupported?{discussionOnly:card.transferUnsupported}:{})};
});
const storageSequence=[fixture('Q0-reference','switching',{processStep:2},'D=1, Q=0. No edge has been applied.'),fixture('Q1-edge-captures-one','switching',{processStep:2,heldBit:1,clockEdges:1},'One rising edge captures D=1 into Q.'),fixture('Q2-D-changes-Q-holds','switching',{processStep:2,a:6,heldBit:1,clockEdges:1},'A changes to 6, making D=0. Q remains 1 without another edge.'),fixture('Q3-next-edge-captures-zero','switching',{processStep:2,a:6,heldBit:0,clockEdges:2},'A second rising edge captures D=0. Setup/hold satisfaction is assumed, not simulated.')];
const attempt=(label,scenario,minute)=>({prediction:`SYNTHETIC QA ${label}: a record identity marker, not a participant response.`,explanation:`SYNTHETIC QA ${label}: no learning result is claimed.`,transfer:`SYNTHETIC QA ${label}: use only to test preservation and conflict handling.`,savedAt:`2026-09-07T00:${String(minute).padStart(2,'0')}:00.000Z`,scenario});
const historyF=fixture('D01-history-F','switching',{}),historyG=fixture('D01-history-G','switching',{loadFf:20}),inputsOnly=fixture('D01-inputs-only','switching',{loadFf:30});
historyF.document.firstAttempt=attempt('F-first',historyF.document.scenario,0);historyF.document.practice=attempt('P-practice',{...historyF.document.scenario,loadFf:20},1);
historyG.document.firstAttempt=attempt('G-conflicting-first',historyG.document.scenario,2);historyG.document.practice=attempt('G-conflicting-practice',{...historyG.document.scenario,voltage:1},3);
for(const f of [historyF,historyG,inputsOnly])readInvestigationDocument(JSON.stringify(f.document));
const base=cards.find(c=>c.id==='A1').stages[0].expected;
nearly(base.switching.supplyEnergyFJ,6.4);nearly(base.switching.delayPS,Math.log(2)*1000);
const b1=cards.find(c=>c.id==='B1').stages.find(f=>f.stage==='after').expected;nearly(b1.manufacturing.compatiblePackagesPerMonth,650*.98);
const a3=cards.find(c=>c.id==='A3').stages.find(f=>f.stage==='after').expected;assert.equal(a3.switching.mac,48);assert.equal(a3.switching.binary,'10000');
const c1=cards.find(c=>c.id==='C1').stages;assert.equal(c1[0].expected.attention.predictedToken,'memory');assert.equal(c1[1].expected.attention.predictedToken,'switch');
const result={
 schemaVersion:'atlas-review-fixtures-1',kitVersion:'atlas-review-kit-1',generatedOn:new Date().toISOString(),learningContract,modelSources,
 status:'Synthetic setup and computed regression expectations only. No learner, device, measurement, specialist-review, or efficacy result.',
 use:'Import only an individual nested document into the atlas, not this fixture collection. Before/after inputs contain no written answers. History timestamps and QA text are artificial test markers. Do not show changed-state answers before recording a participant prediction.',
 expectedValueScope:'Expected values are outputs of the current pure model, with arithmetic and conservation checks; they are not independent scientific validation. Bytes are integer bytes, GB is decimal, GiB is 2^30 bytes, supply is per month, time is seconds unless suffixed otherwise. candidateStepSeconds is a conditional internal estimate; runnableStepSeconds is null when any required constraint fails.',
 recompute:'From repository root: node --experimental-strip-types docs/learning-review/generate-review-fixtures.mjs. Recheck source digests before using with a candidate.',
 cards,storageSequence,historyFixtures:{procedure:'In a disposable profile, import F, export it, then import G and inputs-only in the specified checklist order. F and prior P must remain identifiable/recoverable. A parser accepting a file is not a passed UI preservation test.',fixtures:[historyF,historyG,inputsOnly]},
};
writeFileSync(resolve(destination,'review-fixtures.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({output:resolve(destination,'review-fixtures.json'),cards:cards.length,cardDocuments:cards.reduce((n,c)=>n+c.stages.length,0),storageDocuments:storageSequence.length,historyDocuments:3,contract:learningContract,modelSources},null,2));
