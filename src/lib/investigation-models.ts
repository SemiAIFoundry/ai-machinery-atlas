import { waferYield, packageCapacity } from './deep-math.ts';
import { hbmStack, hbmStackDefaults, bondRoutes, placementDefaults, placeInference, tokenDefaults, tokenSystem, transferService, GiB, type BondRoute } from './numeric-math.ts';
import { referenceSystem } from './reference-system.ts';

export const investigationVersion = 'atlas-investigations-1';
export const learningContract = {version:investigationVersion, contentVersion:'atlas-learning-2026-09-07', checkVersion:'investigation-prompts-1'} as const;
export type InvestigationId = 'switching' | 'manufacturing' | 'execution';
export type Scenario = {
  route: BondRoute; dies: number; memoryWafers: number; logicWafers: number; bondYield: number;
  packageStations: number; facilityMW: number; pue: number; context: number; batch: number;
  weightBits: number; useHbf: boolean; voltage: number; loadFf: number; a: number; b: number;
  query: number; temperature: number; processStep: number; heldBit:number; clockEdges:number;
};
export const scenarioDefaults: Scenario = {
  route: 'tc-ncf', dies: 8, memoryWafers: 40, logicWafers: 24, bondYield: .995,
  packageStations: 650, facilityMW: 2, pue: 1.2, context: 8192, batch: 8,
  weightBits: 16, useHbf: false, voltage: .8, loadFf: 10, a: 7, b: 5,
  query: 3, temperature: 1, processStep: 0, heldBit:0, clockEdges:0,
};
export const scenarioBounds: Record<Exclude<keyof Scenario, 'route' | 'useHbf'>, readonly [number, number, boolean]> = {
  heldBit:[0,1,true],clockEdges:[0,1000000,true],dies: [4, 16, true], memoryWafers: [1, 160, true], logicWafers: [1, 80, true], bondYield: [.9, 1, false],
  packageStations: [50, 2000, true], facilityMW: [.1, 30, false], pue: [1, 2, false],
  context: [512, 131072, true], batch: [1, 32, true], weightBits: [4, 16, true], voltage: [.5, 1.2, false],
  loadFf: [1, 100, false], a: [0, 15, true], b: [0, 15, true], query: [0, 3, true], temperature: [.2, 5, false], processStep: [0, 5, true],
};
/** Validate imports without coercion, unknown fields, or silent clamping. */
export function validateScenario(value: unknown): Scenario {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('A scenario must be an object.');
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some(k => !(k in scenarioDefaults)) || Object.keys(v).length !== Object.keys(scenarioDefaults).length) throw Error('The scenario has missing or unknown fields.');
  if (v.route !== 'tc-ncf' && v.route !== 'mr-muf' && v.route !== 'hybrid') throw Error('Unknown bonding route.');
  if (typeof v.useHbf !== 'boolean') throw Error('The memory-tier choice must be boolean.');
  for (const [key, [min, max, integer]] of Object.entries(scenarioBounds)) {
    const n = v[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) throw Error(`${key} is outside this model's range.`);
  }
  return { ...v } as Scenario;
}
export function validInvestigationId(value: unknown): value is InvestigationId { return typeof value === 'string' && ['switching', 'manufacturing', 'execution'].includes(value); }

/** A representative two-die package, eight HBM stacks, 64 packages per rack. */
export function systemScenario(input: Scenario) {
  const s = validateScenario(input);
  const stack = hbmStack({ ...hbmStackDefaults, dies: s.dies, bondYield: s.bondYield, ...{ gapUm: bondRoutes[s.route].gapUm, interfaceKW: bondRoutes[s.route].interfaceKW } });
  const logicWafer = waferYield(300, 3, 400, .12), memoryWafer = waferYield(300, 3, 80, .12);
  const logicDies = logicWafer.good * s.logicWafers, screenedMemoryDies = memoryWafer.good * s.memoryWafers;
  // Wafer yield screens inputs; residual die/bond/final survival applies once after selection.
  const stackStarts = screenedMemoryDies / s.dies, goodStacks = stackStarts * stack.conditionalYield;
  const bom = referenceSystem.package, rack = referenceSystem.rack;
  const capacity = packageCapacity({ logic: logicDies, hbm: goodStacks, interposer: 800, substrate: 900, assembly: s.packageStations, logicPer: bom.logicDies, hbmPer: bom.hbmStacks, yield: .98 });
  const compatiblePackages = stack.withinLimits ? capacity.good : 0;
  const packageCapacityGB = bom.hbmStacks * stack.capacityGB;
  const packageW = 900 + bom.hbmStacks * stack.totalPowerW, rackW = rack.packages * packageW + rack.hostAndNetworkKW * 1000;
  const powerRacks = Math.floor(s.facilityMW * 1e6 / s.pue / rackW);
  const supplyRacks = Math.floor(compatiblePackages / rack.packages), activeRacks = Math.min(powerRacks, supplyRacks);
  const hbmGiB = packageCapacityGB * 1e9 / GiB;
  const workload = { ...placementDefaults, context: s.context, batch: s.batch, weightBits: s.weightBits, hbmGiB, useHbf: s.useHbf, hbmGBs: stack.deliveredGBs * 8, packageGBs: 2400 };
  const placement = placeInference(workload);
  const token = tokenSystem({ ...tokenDefaults, ranks: 1, context: s.context, batch: s.batch, weightBits: s.weightBits, hbmGiB, hbmGBs: workload.hbmGBs, packageGBs: workload.packageGBs });
  // Conservative serial tier reads, overlapped with arithmetic; no network for this one-package request.
  // The read-placement model excludes new KV and activation transfers. Add them once
  // on the same constrained HBM/package path to close the declared decode step.
  const additionalBytes = token.kvAppendBytes + token.activationTraffic;
  const additionalService = transferService({ bytes: additionalBytes, sourceGBs: workload.hbmGBs, linkGBs: workload.packageGBs, efficiency: workload.efficiency, latencyUs: workload.hbmLatencyUs, chunkBytes: workload.chunkMiB * 2 ** 20, concurrency: workload.concurrency });
  const hostAppendBytes = placement.size.kv ? token.kvAppendBytes * placement.host.kv / placement.size.kv : 0;
  const hostAppend = transferService({ bytes: hostAppendBytes, sourceGBs: workload.hostGBs, linkGBs: workload.hostLinkGBs, efficiency: workload.efficiency, latencyUs: workload.hostLatencyUs, chunkBytes: workload.chunkMiB * 2 ** 20, concurrency: workload.concurrency });
  // One bounded decode step retains the current KV residency proportions.
  // A host append stages through HBM and then writes host memory; HBF remains read-only.
  const nextStepFits = placement.hbm.weights + placement.hbm.kv + placement.hbm.workspace + token.kvAppendBytes - hostAppendBytes <= placement.caps.hbm && placement.host.weights + placement.host.kv + hostAppendBytes <= placement.caps.host;
  const readSeconds = placement.serialReadSeconds + additionalService.seconds + hostAppend.seconds;
  const stepSeconds = 40e-6 + Math.max(token.computeSeconds, readSeconds);
  const executionFeasible = placement.feasible && nextStepFits && stack.withinLimits;
  const packageTokensPerSecond = executionFeasible ? s.batch / stepSeconds : 0;
  const hallTokensPerSecond = activeRacks * rack.packages * packageTokensPerSecond;
  return { stack, logicWafer, memoryWafer, logicDies, screenedMemoryDies, stackStarts, goodStacks, capacity, compatiblePackages, packageCapacityGB, packageW, rackW, powerRacks, supplyRacks, activeRacks, placement, token, additionalBytes, readSeconds, stepSeconds, hostAppendBytes, nextStepFits, executionFeasible, packageTokensPerSecond, hallTokensPerSecond };
}

/** Saturation-current approximation used as an effective RC driver; not a SPICE model. */
export function switchingScenario(s: Scenario) {
  validateScenario(s);
  const thresholdV = .4, betaAperV2 = 100e-6, currentA = .5 * betaAperV2 * (s.voltage - thresholdV) ** 2;
  const capacitanceF = s.loadFf * 1e-15, effectiveOhms = s.voltage / currentA;
  const delaySeconds = Math.LN2 * effectiveOhms * capacitanceF;
  const supplyEnergyJ = capacitanceF * s.voltage ** 2;
  let carry = 0;
  const bits = Array.from({ length: 4 }, (_, bit) => {
    const a = (s.a >> bit) & 1, b = (s.b >> bit) & 1, carryIn = carry;
    const sum = a ^ b ^ carryIn; carry = (a & b) | (carryIn & (a ^ b));
    return { bit, a, b, carryIn, sum, carryOut: carry };
  });
  const terms = [s.a * 3, s.b * 2, 1];
  return { currentA, capacitanceF, effectiveOhms, delaySeconds, supplyEnergyJ, storedEnergyJ: supplyEnergyJ / 2, bits, sum: s.a + s.b, binary: (s.a + s.b).toString(2).padStart(5, '0'), terms, mac: terms.reduce((a, b) => a + b, 0) };
}

export const toyTokens = ['silicon', 'switch', 'memory', 'token'];
export const toyEmbeddings = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const softmax = (values: number[]) => { const max = Math.max(...values), e = values.map(x => Math.exp(x - max)), sum = e.reduce((a, b) => a + b, 0); return e.map(x => x / sum); };
/** Identity Q/K/V projections and a tied output readout. All weights are hand-chosen. */
export function attentionScenario(query: number, temperature: number) {
  if (!Number.isInteger(query) || query < 0 || query > 3 || !Number.isFinite(temperature) || temperature < .2 || temperature > 5) throw Error('Invalid attention controls.');
  const q = toyEmbeddings[query];
  const scores = toyEmbeddings.map(k => (q[0] * k[0] + q[1] * k[1]) / (Math.sqrt(2) * temperature));
  const weights = softmax(scores.slice(0, query + 1));
  while (weights.length < 4) weights.push(0);
  const mixed = [0, 1].map(d => weights.reduce((sum, w, i) => sum + w * toyEmbeddings[i][d], 0));
  const logits = toyEmbeddings.map(e => e[0] * mixed[0] + e[1] * mixed[1]);
  const probabilities = softmax(logits), max = Math.max(...probabilities), predicted = probabilities.indexOf(max);
  return { q, scores, weights, mixed, logits, probabilities, predicted, correct: predicted === query, tied: probabilities.filter(x => Math.abs(x - max) < 1e-10).length > 1 };
}

export type LearningAttempt = { prediction: string; explanation: string; transfer: string; savedAt: string; scenario: Scenario };
export type LearningHistoryEntry = {reason:'previous-practice'|'imported-first'; attempt:LearningAttempt};
export type LearningRecord = {firstAttempt?:LearningAttempt;practice?:LearningAttempt;history?:LearningHistoryEntry[]};
export type InvestigationDocument = typeof learningContract & LearningRecord & { caseId: InvestigationId; scenario: Scenario };
function readAttempt(value: unknown): LearningAttempt | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid learning record.');
  const v = value as Record<string, unknown>;
  if (['prediction', 'explanation', 'transfer'].some(k => typeof v[k] !== 'string' || (v[k] as string).length > 4000) || typeof v.savedAt !== 'string' || !Number.isFinite(Date.parse(v.savedAt))) throw Error('Invalid learning record text or date.');
  return { prediction: v.prediction as string, explanation: v.explanation as string, transfer: v.transfer as string, savedAt: v.savedAt as string, scenario: validateScenario(v.scenario) };
}
export function readInvestigationDocument(text: string): InvestigationDocument {
  if (text.length > 100000) throw Error('The learning file is too large.');
  const v = JSON.parse(text);
  if (!v || v.version !== investigationVersion || v.contentVersion !== learningContract.contentVersion || v.checkVersion !== learningContract.checkVersion || !validInvestigationId(v.caseId)) throw Error('This learning file uses an unsupported model version.');
  if(v.history!==undefined&&(!Array.isArray(v.history)||v.history.length>4))throw Error('This learning file has too many archived records.');
  const history:LearningHistoryEntry[]=(v.history||[]).map((h:unknown)=>{if(!h||typeof h!=='object'||!('reason' in h)||!('attempt' in h)||(h.reason!=='previous-practice'&&h.reason!=='imported-first'))throw Error('Invalid archived record.');const attempt=readAttempt(h.attempt);if(!attempt)throw Error('Missing archived attempt.');return {reason:h.reason,attempt};});
  return { ...learningContract, caseId: v.caseId, scenario: validateScenario(v.scenario), firstAttempt: readAttempt(v.firstAttempt), practice: readAttempt(v.practice),history };
}

export type BrowserLearningState = { scenario: Scenario; work: Partial<Record<InvestigationId, LearningRecord>>; warnings: string[] };
/** Recover independent valid records without converting a damaged case into data loss. */
export function readBrowserLearningState(text: string): BrowserLearningState {
  const saved = JSON.parse(text);
  if (!saved || typeof saved !== 'object' || !saved.current) throw Error('Missing saved model identity.');
  // Check identity separately from current inputs; records use this storage envelope's versions.
  readInvestigationDocument(JSON.stringify({...saved.current, scenario: scenarioDefaults}));
  const warnings: string[] = [], work: BrowserLearningState['work'] = {};
  let scenario = {...scenarioDefaults};
  try { scenario = validateScenario(saved.current.scenario); } catch { warnings.push('The last inputs could not be restored.'); }
  for (const caseId of ['switching','manufacturing','execution'] as const) {
    if (saved.work?.[caseId] === undefined) continue;
    try {
      const stored = saved.work[caseId];
      if (!stored || typeof stored !== 'object' || Array.isArray(stored)) throw Error('Invalid case record.');
      const doc = readInvestigationDocument(JSON.stringify({...learningContract,caseId,scenario,firstAttempt:stored.firstAttempt,practice:stored.practice,history:stored.history}));
      work[caseId] = {firstAttempt:doc.firstAttempt,practice:doc.practice,history:doc.history};
    } catch { warnings.push(`The ${caseId} learning record could not be restored.`); }
  }
  return {scenario,work,warnings};
}

/** Keep local first work and retain displaced import records rather than silently overwriting them. */
export function mergeLearningRecords(current:LearningRecord|undefined,incoming:LearningRecord):LearningRecord {
 const same=(a:LearningAttempt|undefined,b:LearningAttempt|undefined)=>JSON.stringify(a)===JSON.stringify(b);
 const firstAttempt=current?.firstAttempt||incoming.firstAttempt,practice=incoming.practice||current?.practice;
 const history:LearningHistoryEntry[]=[...(current?.history||[]),...(incoming.history||[])];
 if(current?.practice&&incoming.practice&&!same(current.practice,incoming.practice))history.push({reason:'previous-practice',attempt:current.practice});
 if(current?.firstAttempt&&incoming.firstAttempt&&!same(current.firstAttempt,incoming.firstAttempt))history.push({reason:'imported-first',attempt:incoming.firstAttempt});
 const unique=history.filter((h,i,all)=>!same(h.attempt,firstAttempt)&&!same(h.attempt,practice)&&all.findIndex(x=>same(x.attempt,h.attempt))===i);
 if(unique.length>4)throw Error('This import would exceed the four-record history limit. Export both records and keep them separately; your saved work has not changed.');
 return {firstAttempt,practice,history:unique};
}
