/** A tiny, actually fitted retrieval/conditional-token experiment. No remote model or general LLM. */
import {canonicalJson, exactObject} from './automation-contracts.ts';
import {automationTask, createAutomationEnvironment} from './automation-fixtures.ts';
export const learnedModelVersion='atlas-incident-learned-1' as const;
export const incidentCorpusId='atlas-incident-manuals-1' as const;
export const incidentCorpus=createAutomationEnvironment().manuals;
export const learningPairs=[
 {query:'service FAN-7 filter work order',documentId:'manual-fan-7'},
 {query:'fan seven needs maintenance',documentId:'manual-fan-7'},
 {query:'reserve supplies for FAN-7',documentId:'manual-fan-7'},
 {query:'maintenance of fan seven filter',documentId:'manual-fan-7'},
 {query:'repair FAN-7 reserve parts',documentId:'manual-fan-7'},
 {query:'service FAN-9 filter work order',documentId:'manual-fan-9'},
 {query:'fan nine needs maintenance',documentId:'manual-fan-9'},
 {query:'reserve supplies for FAN-9',documentId:'manual-fan-9'},
 {query:'maintenance of fan nine filter',documentId:'manual-fan-9'},
 {query:'repair FAN-9 reserve parts',documentId:'manual-fan-9'},
] as const;
export const tuningPairs=[{query:'fan seven service parts',documentId:'manual-fan-7'},{query:'fan nine service parts',documentId:'manual-fan-9'}] as const;
export const evaluationPairs=[{query:'FAN-7 needs filter maintenance',documentId:'manual-fan-7'},{query:'FAN-9 needs filter maintenance',documentId:'manual-fan-9'},{query:'reserve parts for fan seven',documentId:'manual-fan-7'},{query:'reserve parts for fan nine',documentId:'manual-fan-9'}] as const;
export const decoderTokens=['<bos>','reserve','FAN-7','FAN-9','FILTER-A','FILTER-B','2','1','<eos>'] as const;
const targets=[['reserve','FAN-7','FILTER-A','2','<eos>'],['reserve','FAN-9','FILTER-B','1','<eos>']];
export type ContextCondition='retrieved'|'wrong'|'missing'|'stale';
export type RetrievalMethod='learned'|'lexical';
export type LearningRequest={query:string;method:RetrievalMethod;condition:ContextCondition;rerank?:'none'|'entity-match'};
export const incidentRerankerVersion='authored-entity-reranker-1' as const;
export type IncidentReranking={version:typeof incidentRerankerVersion;kind:'authored-rule';queryEntity:string|null;candidates:{documentId:string;retrievalRank:number;entityMatch:boolean;rerankedRank:number}[];reason:string};
export type FitOptions={seed:number;retrievalSteps:number;decoderSteps:number;learningRate:number};
export const defaultFitOptions:FitOptions={seed:17,retrievalSteps:600,decoderSteps:350,learningRate:0.5};
export type LossPoint={step:number;loss:number};
export type LearnedArtifact={version:typeof learnedModelVersion;corpusId:typeof incidentCorpusId;dimensions:6;vocabulary:string[];queryWeights:number[][];documentWeights:number[][];decoderWeights:number[][];options:FitOptions;retrievalLoss:LossPoint[];decoderLoss:LossPoint[];policyId:string};
export type TokenStep={position:number;previous:string;chosen:string;distribution:{token:string;probability:number}[]};
export type LearningResult={reranking?:IncidentReranking;ranked:{documentId:string;score:number;probability:number;vector:number[]}[];queryVector:number[];knownTokens:string[];unknownTokens:string[];context:null|{id:string;text:string;current:boolean};steps:TokenStep[];text:string;parsed:null|{assetId:string;partId:string;quantity:number};sourceSupported:boolean;taskCorrect:boolean;retrievalCorrect:boolean;accepted:boolean;reason:string};
const zeros=(n:number)=>Array<number>(n).fill(0);
const matrix=(rows:number,cols:number)=>Array.from({length:rows},()=>zeros(cols));
const dot=(a:number[],b:number[])=>a.reduce((s,x,i)=>s+x*b[i],0);
export const tokenizeIncident=(text:string):string[]=>text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g)??[];
export function softmax(logits:number[]):number[]{const max=Math.max(...logits),exp=logits.map(x=>Math.exp(x-max)),sum=exp.reduce((a,b)=>a+b,0);return exp.map(x=>x/sum);}
function logLoss(logits:number[],target:number):number{const max=Math.max(...logits);return max+Math.log(logits.reduce((s,x)=>s+Math.exp(x-max),0))-logits[target];}
function rng(seed:number){let n=seed>>>0;return()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;};}
function indices(text:string,vocabulary:string[]):number[]{return tokenizeIncident(text).map(x=>vocabulary.indexOf(x)).filter(x=>x>=0);}
export function meanEmbedding(text:string,vocabulary:string[],weights:number[][]):number[]{const ids=indices(text,vocabulary),out=zeros(6);for(const id of ids)for(let d=0;d<6;d++)out[d]+=weights[id][d]/ids.length;return out;}
/** Full-batch cross entropy over the two reference passages; exports gradients for independent checks. */
export function retrievalObjective(queryWeights:number[][],documentWeights:number[][],vocabulary:string[],pairs:readonly {query:string;documentId:string}[]=learningPairs){
 const queryGradient=matrix(vocabulary.length,6),documentGradient=matrix(vocabulary.length,6);let loss=0;
 const docs=incidentCorpus.map(x=>meanEmbedding(x.text,vocabulary,documentWeights));
 for(const pair of pairs){const target=incidentCorpus.findIndex(x=>x.id===pair.documentId);if(target<0)throw Error('Unknown supervised document.');const q=meanEmbedding(pair.query,vocabulary,queryWeights),logits=docs.map(d=>dot(q,d)),p=softmax(logits);loss+=logLoss(logits,target)/pairs.length;const qi=indices(pair.query,vocabulary);
  for(let j=0;j<docs.length;j++){const coefficient=(p[j]-(j===target?1:0))/pairs.length,di=indices(incidentCorpus[j].text,vocabulary);for(let d=0;d<6;d++){for(const id of qi)queryGradient[id][d]+=coefficient*docs[j][d]/qi.length;for(const id of di)documentGradient[id][d]+=coefficient*q[d]/di.length;}}
 }
 return{loss,queryGradient,documentGradient};
}
function decoderFeatures(context:number[],previous:number,position:number):number[]{return [...context,...decoderTokens.map((_,i)=>Number(i===previous)),...Array.from({length:5},(_,i)=>Number(i===position)),1];}
export function decoderObjective(weights:number[][],contexts:number[][]){const gradient=matrix(weights.length,weights[0].length);let loss=0;for(let j=0;j<2;j++){let previous=0;for(let pos=0;pos<5;pos++){const target=decoderTokens.indexOf(targets[j][pos] as typeof decoderTokens[number]),features=decoderFeatures(contexts[j],previous,pos),logits=weights.map(row=>dot(row,features)),p=softmax(logits);loss+=logLoss(logits,target)/10;for(let k=0;k<weights.length;k++)for(let d=0;d<features.length;d++)gradient[k][d]+=(p[k]-Number(k===target))*features[d]/10;previous=target;}}return{loss,gradient};}
function update(weights:number[][],gradient:number[][],rate:number){for(let i=0;i<weights.length;i++)for(let j=0;j<weights[i].length;j++)weights[i][j]-=rate*gradient[i][j];}
function fitOptions(value:unknown):FitOptions{exactObject(value,['seed','retrievalSteps','decoderSteps','learningRate']);for(const k of ['seed','retrievalSteps','decoderSteps'] as const)if(!Number.isInteger(value[k])||Number(value[k])<0||Number(value[k])>(k==='seed'?65535:800))throw Error('Invalid fitting budget.');if(typeof value.learningRate!=='number'||!Number.isFinite(value.learningRate)||value.learningRate<0.01||value.learningRate>0.8)throw Error('Invalid learning rate.');return structuredClone(value) as FitOptions;}
function identity(artifact:Omit<LearnedArtifact,'policyId'>){let hash=2166136261;for(const c of canonicalJson(artifact)){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}return `${learnedModelVersion}-${(hash>>>0).toString(16).padStart(8,'0')}`;}
export function fitIncidentModel(patch:Partial<FitOptions>={}):LearnedArtifact{
 const options=fitOptions({...defaultFitOptions,...patch}),random=rng(options.seed);
 // Held-out and tuning queries are deliberately absent from vocabulary fitting and updates.
 const vocabulary=Array.from(new Set([...learningPairs.map(x=>x.query),...incidentCorpus.map(x=>x.text)].flatMap(tokenizeIncident))).sort();
 const initial=(r:number,c:number)=>Array.from({length:r},()=>Array.from({length:c},()=>0.6*(random()-.5)));
 const queryWeights=initial(vocabulary.length,6),documentWeights=initial(vocabulary.length,6),retrievalLoss:LossPoint[]=[],decoderLoss:LossPoint[]=[];
 for(let step=0;step<=options.retrievalSteps;step++){const value=retrievalObjective(queryWeights,documentWeights,vocabulary);if(step===0||step===options.retrievalSteps||step%20===0)retrievalLoss.push({step,loss:value.loss});if(step<options.retrievalSteps)update(queryWeights,value.queryGradient,options.learningRate);if(step<options.retrievalSteps)update(documentWeights,value.documentGradient,options.learningRate);}
 const contexts=incidentCorpus.map(x=>meanEmbedding(x.text,vocabulary,documentWeights)),decoderWeights=initial(decoderTokens.length,6+decoderTokens.length+5+1);
 for(let step=0;step<=options.decoderSteps;step++){const value=decoderObjective(decoderWeights,contexts);if(step===0||step===options.decoderSteps||step%20===0)decoderLoss.push({step,loss:value.loss});if(step<options.decoderSteps)update(decoderWeights,value.gradient,options.learningRate);}
 const artifact:Omit<LearnedArtifact,'policyId'>={version:learnedModelVersion,corpusId:incidentCorpusId,dimensions:6,vocabulary,queryWeights,documentWeights,decoderWeights,options,retrievalLoss,decoderLoss};return{...artifact,policyId:identity(artifact)};
}
const verifiedFits=new Map<string,LearnedArtifact>();
/** Numerical comparison tolerates insignificant engine math differences, never text/schema changes. */
export function sameLearnedNumbers(a:unknown,b:unknown):boolean{if(typeof a==='number'&&typeof b==='number')return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((v,i)=>sameLearnedNumbers(v,b[i]));if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){const x=a as Record<string,unknown>,y=b as Record<string,unknown>;return Object.keys(x).length===Object.keys(y).length&&Object.keys(x).every(k=>Object.hasOwn(y,k)&&sameLearnedNumbers(x[k],y[k]));}return a===b;}
export function validateLearnedArtifact(value:unknown):LearnedArtifact{
 exactObject(value,['version','corpusId','dimensions','vocabulary','queryWeights','documentWeights','decoderWeights','options','retrievalLoss','decoderLoss','policyId']);
 if(value.version!==learnedModelVersion||value.corpusId!==incidentCorpusId||value.dimensions!==6)throw Error('Incompatible learned model or corpus.');fitOptions(value.options);
 const expected=Array.from(new Set([...learningPairs.map(x=>x.query),...incidentCorpus.map(x=>x.text)].flatMap(tokenizeIncident))).sort();if(canonicalJson(value.vocabulary)!==canonicalJson(expected))throw Error('Vocabulary differs from the training contract.');
 for(const [key,rows,cols]of [['queryWeights',expected.length,6],['documentWeights',expected.length,6],['decoderWeights',decoderTokens.length,21]] as const){const m=value[key];if(!Array.isArray(m)||m.length!==rows||m.some(row=>!Array.isArray(row)||row.length!==cols||row.some(x=>typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>100)))throw Error('Invalid fitted weights.');}
 for(const key of ['retrievalLoss','decoderLoss'] as const){const points=value[key];if(!Array.isArray(points)||points.length<1||points.length>42)throw Error('Invalid loss trace.');for(const point of points){exactObject(point,['step','loss']);if(!Number.isInteger(point.step)||Number(point.step)<0||Number(point.step)>800||typeof point.loss!=='number'||!Number.isFinite(point.loss)||point.loss<0||point.loss>100)throw Error('Invalid loss point.');}}
 const {policyId,...model}=value;if(typeof policyId!=='string'||policyId!==identity(model as Omit<LearnedArtifact,'policyId'>))throw Error('Learned artifact identity mismatch.');
 const key=canonicalJson(value.options);let reproduced=verifiedFits.get(key);if(!reproduced){reproduced=fitIncidentModel(value.options as FitOptions);if(verifiedFits.size>=8)verifiedFits.delete(verifiedFits.keys().next().value!);verifiedFits.set(key,reproduced);}
 const {policyId:_reproducedId,...numerical}=reproduced;if(!sameLearnedNumbers(model,numerical))throw Error('Weights or loss trace do not reproduce the declared fitting procedure.');return structuredClone(value) as LearnedArtifact;
}
export function validateLearningRequest(value:unknown):LearningRequest{exactObject(value,value&&typeof value==='object'&&'rerank' in value?['query','method','condition','rerank']:['query','method','condition']);if(typeof value.query!=='string'||value.query.length>200||!['learned','lexical'].includes(value.method as string)||!['retrieved','wrong','missing','stale'].includes(value.condition as string)||('rerank' in value&&!['none','entity-match'].includes(value.rerank as string)))throw Error('Invalid learned request.');return structuredClone(value) as LearningRequest;}
/** A separate authored rule, never a trained cross encoder or an authority grant. */
export function rerankIncidentCandidates(query:string,candidates:{documentId:string}[]):IncidentReranking{
 if(typeof query!=='string'||query.length>200||!Array.isArray(candidates)||candidates.length<1||candidates.length>incidentCorpus.length||new Set(candidates.map(x=>x.documentId)).size!==candidates.length||candidates.some(x=>!incidentCorpus.some(d=>d.id===x.documentId)))throw Error('Invalid reranking candidates.');
 const named=[[/\bfan(?:[- ]7| seven)\b/i,'FAN-7'],[/\bfan(?:[- ]9| nine)\b/i,'FAN-9']] as const;
 const entities=named.filter(([pattern])=>pattern.test(query)).map(([,id])=>id),queryEntity=entities.length===1?entities[0]:null;
 const ordered=candidates.map((x,i)=>({documentId:x.documentId,retrievalRank:i+1,entityMatch:queryEntity!==null&&incidentCorpus.find(d=>d.id===x.documentId)!.assetId===queryEntity})).sort((a,b)=>Number(b.entityMatch)-Number(a.entityMatch)||a.retrievalRank-b.retrievalRank);
 return{version:incidentRerankerVersion,kind:'authored-rule',queryEntity,candidates:ordered.map((x,i)=>({...x,rerankedRank:i+1})),reason:entities.length===0?'No recognized FAN-7/FAN-9 identifier or fan seven/fan nine alias: preserve retrieval order.':entities.length>1?'Both fixture entities are named: preserve retrieval order instead of resolving the ambiguity.':'Promote a candidate whose authored asset metadata matches the one recognized query entity; preserve retrieval order within ties.'};
}
export function inferIncident(model:LearnedArtifact,input:LearningRequest):LearningResult{
 const request=validateLearningRequest(input),tokens=tokenizeIncident(request.query),knownTokens=tokens.filter(x=>model.vocabulary.includes(x)),unknownTokens=tokens.filter(x=>!model.vocabulary.includes(x)),queryVector=meanEmbedding(request.query,model.vocabulary,model.queryWeights);
 const raw=incidentCorpus.map(document=>{const vector=meanEmbedding(document.text,model.vocabulary,model.documentWeights);const score=request.method==='learned'?dot(queryVector,vector):Array.from(new Set(tokens)).filter(x=>tokenizeIncident(document.text).includes(x)).length;return{documentId:document.id,score,vector};});const probabilities=softmax(raw.map(x=>x.score)),ranked=raw.map((x,i)=>({...x,probability:probabilities[i]})).sort((a,b)=>b.score-a.score||a.documentId.localeCompare(b.documentId));
 const reranking=request.rerank==='entity-match'?rerankIncidentCandidates(request.query,ranked):undefined,selection=reranking?reranking.candidates:ranked;
 const selected=incidentCorpus.find(x=>x.id===(request.condition==='wrong'?selection[1]:selection[0]).documentId)!;
 const context=request.condition==='missing'?null:{id:selected.id,text:request.condition==='stale'?selected.text.replace('two FILTER-A','one FILTER-A').replace('one FILTER-B','two FILTER-B'):selected.text,current:request.condition!=='stale'};
 const contextVector=context?meanEmbedding(context.text,model.vocabulary,model.documentWeights):zeros(6),steps:TokenStep[]=[];let previous=0;
 for(let pos=0;pos<5;pos++){const probabilities=softmax(model.decoderWeights.map(row=>dot(row,decoderFeatures(contextVector,previous,pos)))),chosen=probabilities.indexOf(Math.max(...probabilities));steps.push({position:pos,previous:decoderTokens[previous],chosen:decoderTokens[chosen],distribution:decoderTokens.map((token,i)=>({token,probability:probabilities[i]}))});previous=chosen;if(decoderTokens[chosen]==='<eos>')break;}
 const output=steps.map(x=>x.chosen),text=output.join(' '),match=/^reserve (FAN-7|FAN-9) (FILTER-A|FILTER-B) ([12]) <eos>$/.exec(text),parsed=match?{assetId:match[1],partId:match[2],quantity:Number(match[3])}:null;
 const sourceSupported=!!parsed&&!!context&&context.text.toLowerCase().includes(`${parsed.assetId.toLowerCase()} service`)&&context.text.toLowerCase().includes(`reserve ${parsed.quantity===2?'two':'one'} ${parsed.partId.toLowerCase()}`);
 const taskCorrect=!!parsed&&parsed.assetId===automationTask.assetId&&parsed.partId===automationTask.partId&&parsed.quantity===automationTask.quantity;
 // This authored gate checks presence, current revision and syntax. It does not silently replace predictions with ground truth.
 const accepted=!!context&&context.current&&!!parsed;
 return{...(reranking?{reranking}:{}),ranked,queryVector,knownTokens,unknownTokens,context,steps,text,parsed,sourceSupported,taskCorrect,retrievalCorrect:ranked[0].documentId===automationTask.evidenceId,accepted,reason:!context?'No reference context: authored gate abstains.':!context.current?'Stale revision: authored gate requests a current source.':!parsed?'Generated tokens do not parse as the bounded reservation grammar.':'A typed proposal can proceed to independent runtime checks; this is not authorization.'};
}
export function evaluateLearnedRetrieval(model:LearnedArtifact,pairs:readonly {query:string;documentId:string}[]=evaluationPairs){return pairs.map(pair=>{const result=inferIncident(model,{query:pair.query,method:'learned',condition:'retrieved'});return{...pair,predicted:result.ranked[0].documentId,correct:result.ranked[0].documentId===pair.documentId};});}
