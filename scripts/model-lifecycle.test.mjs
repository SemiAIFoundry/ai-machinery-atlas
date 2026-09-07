import test from 'node:test';
import assert from 'node:assert/strict';
import {createLifecycleRun,advanceLifecycleRun,forkLifecycleRun,evaluateLifecycleRun,inspectLifecycleForward,lifecycleSupervisedObjective,lifecycleDpoObjective,lifecycleRewardObjective,lifecycleExamples,lifecycleVocabulary,lifecycleTensors,lifecycleParameterCount,lifecycleUnigramBaseline,generateLifecycle,openLifecycleFinalTest,readLifecycleCheckpoint,serializeLifecycleCheckpoint,validateLifecycleRun,resolveLifecycleConfig,lifecycleFingerprint} from '../src/lib/model-lifecycle.ts';
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b} (tol ${tol})`);
const copy=x=>structuredClone(x);

// Numerical oracle uses ordinary numbers, no tape, no production forward/loss/gradient helper.
function referenceLogProbabilities(weights,tokens){
 const D=6,H=12,V=9,tensors=Object.fromEntries(lifecycleTensors.map(t=>[t.name,t]));
 const w=(name,r,c)=>weights[tensors[name].offset+r*tensors[name].columns+c];
 const lin=(x,name,bias)=>Array.from({length:tensors[name].columns},(_,j)=>x.reduce((s,a,k)=>s+a*w(name,k,j),0)+(bias?w(bias,0,j):0));
 const norm=x=>{const denominator=Math.sqrt(x.reduce((s,v)=>s+v*v,0)/D+1e-5);return x.map(v=>v/denominator);};
 const logitsToLogs=logits=>{let sum=0,max=Math.max(...logits);for(const a of logits)sum+=Math.exp(a-max);return logits.map(a=>a-max-Math.log(sum));};
 const embedding=tokens.map((id,pos)=>Array.from({length:D},(_,j)=>w('embedding',id,j)+.15*(j%2?Math.cos(pos/Math.pow(10000,(j-1)/D)):Math.sin(pos/Math.pow(10000,j/D)))));
 const qs=embedding.map(x=>lin(norm(x),'query')),ks=embedding.map(x=>lin(norm(x),'key')),vs=embedding.map(x=>lin(norm(x),'value'));
 return embedding.map((x,i)=>{const scores=[];for(let k=0;k<=i;k++){let dot=0;for(let j=0;j<D;j++)dot+=qs[i][j]*ks[k][j];scores.push(dot/Math.sqrt(D));}const probs=logitsToLogs(scores).map(Math.exp),mix=Array(D).fill(0);for(let k=0;k<=i;k++)for(let j=0;j<D;j++)mix[j]+=probs[k]*vs[k][j];const out=lin(mix,'attentionOutput'),res=x.map((v,j)=>v+out[j]),ff=lin(lin(norm(res),'feedForwardIn','feedForwardBias').map(Math.tanh),'feedForwardOut','feedForwardOutBias');assert.equal(ff.length,D);assert.equal(tensors.feedForwardIn.columns,H);const logp=logitsToLogs(lin(res.map((v,j)=>v+ff[j]),'unembedding','logitBias'));assert.equal(logp.length,V);return logp;});
}
function referenceLoss(weights,examples,responseOnly=false){let loss=0,count=0;for(const ex of examples){const logp=referenceLogProbabilities(weights,ex.tokens.slice(0,-1));for(let j=0;j<logp.length;j++)if(!responseOnly||ex.mask[j]){loss-=logp[j][ex.tokens[j+1]];count++;}}return loss/count;}
function referenceDpo(weights,reference,examples,beta){const response=(w,ex)=>{const lp=referenceLogProbabilities(w,ex.tokens.slice(0,-1));let value=0;for(let i=ex.answerPosition;i<lp.length;i++)value+=lp[i][ex.tokens[i+1]];return value;};return examples.reduce((sum,chosen)=>{const rejected=copy(chosen);rejected.tokens[rejected.tokens.length-2]=chosen.answer===1?2:1;const margin=beta*(response(weights,chosen)-response(weights,rejected)-response(reference,chosen)+response(reference,rejected));return sum+Math.log(1+Math.exp(-margin));},0)/examples.length;}
const gradientOracle=(weights,index,objective)=>{const plus=[...weights],minus=[...weights],epsilon=1e-5;plus[index]+=epsilon;minus[index]-=epsilon;return(objective(plus)-objective(minus))/(2*epsilon);};
const train=(run,n)=>{while(n){const steps=Math.min(n,40);run=advanceLifecycleRun(run,steps);n-=steps;}return run;};
let base;
const trainedBase=()=>base??=train(createLifecycleRun(),320);

test('fixed corpus lineage splits precede fitting and contain disjoint prompt families',()=>{
 const sets=['train','development','final'].map(s=>new Set(lifecycleExamples(s,'copy').map(x=>x.familyId)));assert.deepEqual(sets.map(s=>s.size),[12,8,4]);for(let i=0;i<sets.length;i++)for(let j=i+1;j<sets.length;j++)assert([...sets[i]].every(id=>!sets[j].has(id)));
 for(const split of ['train','development','final'])for(const domain of ['copy','swap'])for(const ex of lifecycleExamples(split,domain)){assert.equal(ex.tokens.map(i=>lifecycleVocabulary[i]).join(' '),ex.text);assert.equal(ex.mask.reduce((a,b)=>a+b),2);assert.equal(ex.tokens.at(-1),7);assert.equal(ex.tokens[ex.answerPosition],6);assert.equal(ex.tokens[ex.answerPosition+1],ex.answer);}
 const a=lifecycleExamples('development','copy'),b=lifecycleExamples('development','swap');assert(a.every((ex,i)=>ex.familyId===b[i].familyId&&ex.answer!==b[i].answer));
});
test('complete decoder forward matches an independent numerical implementation',()=>{
 const run=createLifecycleRun();for(const ex of lifecycleExamples('development','copy').slice(0,2)){const actual=inspectLifecycleForward(run.weights,ex.tokens.slice(0,-1)),expected=referenceLogProbabilities(run.weights,ex.tokens.slice(0,-1));for(let i=0;i<expected.length;i++)for(let j=0;j<9;j++)near(actual.logProbabilities[i][j],expected[i][j],2e-13);}
});
test('all parameter groups have checked supervised gradients, including shared embedding paths',()=>{
 const run=createLifecycleRun(),examples=[lifecycleExamples('train','copy')[0],lifecycleExamples('train','copy')[6]],g=lifecycleSupervisedObjective(run.weights,examples);near(g.loss,referenceLoss(run.weights,examples),1e-13);
 const indices=lifecycleTensors.flatMap(t=>[t.offset,Math.min(t.offset+t.size-1,t.offset+Math.floor(t.size/2))]);for(const i of indices)near(g.gradient[i],gradientOracle(run.weights,i,w=>referenceLoss(w,examples)),2e-6);
 assert(g.gradient.some(g=>Math.abs(g)>1e-3));assert.equal(g.gradient.length,lifecycleParameterCount);
});
test('SFT masks remove prompt targets, use the correct denominator and retain response gradients',()=>{
 const run=createLifecycleRun(),examples=[lifecycleExamples('train','swap')[0],lifecycleExamples('train','swap')[8]],g=lifecycleSupervisedObjective(run.weights,examples,true);assert.equal(g.targetCount,4);near(g.loss,referenceLoss(run.weights,examples,true),1e-13);const all=lifecycleSupervisedObjective(run.weights,examples,false);assert(all.targetCount>4);assert.notEqual(all.loss,g.loss);for(const i of [0,15,64,320,420])near(g.gradient[i],gradientOracle(run.weights,i,w=>referenceLoss(w,examples,true)),2e-6);
});
test('causal prefix outputs are invariant to later token changes and extension',()=>{
 const run=createLifecycleRun(),tokens=lifecycleExamples('train','copy')[0].tokens.slice(0,-1),changed=[...tokens];changed[4]=2;const a=inspectLifecycleForward(run.weights,tokens),b=inspectLifecycleForward(run.weights,changed),prefix=inspectLifecycleForward(run.weights,tokens.slice(0,3));assert.deepEqual(a.logits.slice(0,4),b.logits.slice(0,4));assert.deepEqual(a.logits.slice(0,3),prefix.logits);a.attention.forEach((row,i)=>{assert.equal(row.length,i+1);near(row.reduce((s,v)=>s+v,0),1,1e-14);});
});
test('zero output weights produce uniform probabilities and cross-entropy ln vocabulary',()=>{
 const weights=Array(lifecycleParameterCount).fill(0),ex=lifecycleExamples('train','copy')[0],r=lifecycleSupervisedObjective(weights,[ex]);near(r.loss,Math.log(9));assert(r.gradient.every(Number.isFinite));
});
test('first SGD and Adam updates follow independently calculated update rules after clipping',()=>{
 for(const optimizer of ['sgd','adam']){const run=createLifecycleRun({optimizer}),r=advanceLifecycleRun(run),u=r.lastUpdate,h=r.history[0];for(const i of [0,12,70,170,410]){const g=u.gradient[i]*h.clipScale,update=optimizer==='sgd'?g:g/(Math.abs(g)+1e-8);near(r.weights[i],run.weights[i]-.015*update,2e-13);near(r.moments[i],.1*g,1e-13);near(r.squares[i],.001*g*g,1e-13);}assert.equal(run.step,0);assert.equal(run.history.length,0);}
});
test('same seed and checkpointed RNG/optimizer/cursor reproduce uninterrupted training exactly',()=>{
 const first=train(createLifecycleRun(),17),resumed=train(readLifecycleCheckpoint(serializeLifecycleCheckpoint(first)),23),whole=train(createLifecycleRun(),40);assert.deepEqual(resumed,whole);const wrong=copy(first);wrong.moments.fill(0);wrong.squares.fill(0);assert.notDeepEqual(train(wrong,23).weights,whole.weights);
});
test('pretraining learns reserved context compositions and beats a training-fitted unigram baseline',()=>{
 const before=evaluateLifecycleRun(createLifecycleRun()),run=trainedBase(),after=evaluateLifecycleRun(run),baseline=lifecycleUnigramBaseline();assert.equal(after.copy.correct,8);assert(after.copy.answerLoss<.06);assert(after.copy.answerLoss<before.copy.answerLoss/10);assert(after.copy.tokenLoss<baseline.tokenLoss);assert(run.history.every(h=>h.exampleIds.every(id=>id.startsWith('train-copy-'))));assert.equal(run.finalOpened,false);
});
test('actual SFT changes weights and acquires the deliberately incompatible rule, exposing retention loss',()=>{
 const original=trainedBase(),branch=forkLifecycleRun(original,'sft'),after=train(branch,120),e=evaluateLifecycleRun(after);assert.equal(e.swap.correct,8);assert.equal(e.copy.correct,0);assert(e.swap.answerLoss<.01);assert.deepEqual(branch.reference,original.weights);assert.deepEqual(after.reference,original.weights);assert.equal(original.stage,'pretrain');assert(after.history.slice(original.step).every(h=>h.targets===4));
});
test('continuation keeps all-token supervision and replay samples both declared training domains',()=>{
 const original=trainedBase(),branch=train(forkLifecycleRun(original,'continue',{replayRate:.5}),40),recent=branch.history.slice(original.step),ids=recent.flatMap(h=>h.exampleIds);assert(ids.some(id=>id.startsWith('train-copy-'))&&ids.some(id=>id.startsWith('train-swap-')));assert(recent.every(h=>h.targets>=12));assert.notDeepEqual(branch.weights,original.weights);assert(branch.dataDraws===branch.step*2);
});
test('DPO loss and gradient match independent response likelihood-ratio calculation',()=>{
 const run=createLifecycleRun(),reference=[...run.weights],weights=run.weights.map((w,i)=>w+(i%13===0?.01:0)),examples=[lifecycleExamples('train','swap')[0],lifecycleExamples('train','swap')[6]],beta=.3,r=lifecycleDpoObjective(weights,reference,examples,beta);near(r.loss,referenceDpo(weights,reference,examples,beta),1e-13);near(lifecycleDpoObjective(reference,reference,examples,beta).loss,Math.log(2));for(const i of [5,70,165,309,415])near(r.gradient[i],gradientOracle(weights,i,w=>referenceDpo(w,reference,examples,beta)),2e-6);
});
test('DPO trains actual policy parameters while preserving its frozen reference; objective improvement is not task equivalence',()=>{
 const branch=forkLifecycleRun(trainedBase(),'dpo'),examples=[lifecycleExamples('train','swap')[0],lifecycleExamples('train','swap')[6]],before=lifecycleDpoObjective(branch.weights,branch.reference,examples).loss,after=train(branch,80);assert(lifecycleDpoObjective(after.weights,after.reference,examples).loss<before);assert.deepEqual(branch.reference,after.reference);assert.notDeepEqual(branch.weights,after.weights);
});
test('reward samples come from the current policy with explicit checked outcomes and detached baselines',()=>{
 const run=createLifecycleRun(),examples=[lifecycleExamples('train','swap')[0],lifecycleExamples('train','swap')[6]],r=lifecycleRewardObjective(run.weights,run.weights,examples,123,.2,'correct');assert.equal(r.rollouts.length,8);assert(r.gradient.every(Number.isFinite));near(r.details[0].value,0,1e-13);for(const a of r.rollouts){assert.equal(a.reward,Number(a.action===examples.find(e=>e.id===a.exampleId).answer));near(a.advantage,a.reward-a.baseline);assert(a.probability>0&&a.probability<1);}assert.deepEqual(r,lifecycleRewardObjective(run.weights,run.weights,examples,123,.2,'correct'));
 const wrong=lifecycleRewardObjective(run.weights,run.weights,examples,123,.2,'always-a');assert(wrong.rollouts.some(a=>a.reward!==Number(a.action===examples.find(e=>e.id===a.exampleId).answer)));
});
test('reward continuation is checkpoint reproducible with rollout RNG and finite updates',()=>{
 const branch=forkLifecycleRun(trainedBase(),'reward'),first=train(branch,7),resumed=train(readLifecycleCheckpoint(serializeLifecycleCheckpoint(first)),9),whole=train(branch,16);assert.deepEqual(resumed,whole);assert(whole.history.slice(branch.step).every(h=>h.rollouts.length===8));assert.notDeepEqual(branch.weights,whole.weights);
});
test('sampled score-function and exact KL gradients match an independent frozen-rollout surrogate',()=>{
 const run=createLifecycleRun(),reference=run.weights,weights=reference.map((w,i)=>w+(i%11===0?.03:0)),examples=[lifecycleExamples('train','swap')[0],lifecycleExamples('train','swap')[6]],beta=.2,r=lifecycleRewardObjective(weights,reference,examples,17,beta,'correct');
 const surrogate=w=>examples.reduce((sum,ex)=>{const two=values=>{const lp=referenceLogProbabilities(values,ex.tokens.slice(0,ex.answerPosition+1)).at(-1),max=Math.max(lp[1],lp[2]),z=Math.exp(lp[1]-max)+Math.exp(lp[2]-max);return[lp[1]-max-Math.log(z),lp[2]-max-Math.log(z)];};const lp=two(w),ref=two(reference),samples=r.rollouts.filter(x=>x.exampleId===ex.id);const score=samples.reduce((s,a)=>s-a.advantage*lp[a.action-1],0)/samples.length,kl=lp.reduce((s,x,j)=>s+Math.exp(x)*(x-ref[j]),0);return sum+score+beta*kl;},0)/examples.length;
 near(r.loss,surrogate(weights),1e-13);for(const i of [0,25,100,188,325,420])near(r.gradient[i],gradientOracle(weights,i,surrogate),2e-6);
});
test('generation is actual autoregressive inference with a separate RNG and no weight updates',()=>{
 const r=trainedBase(),snapshot=copy(r),ex=lifecycleExamples('development','copy')[0],g=generateLifecycle(r,ex.tokens.slice(0,ex.answerPosition+1));assert.deepEqual(g.tokens,[ex.answer,7]);assert.deepEqual(r,snapshot);assert.deepEqual(generateLifecycle(r,[0,1,3,5,6],'sample',1),generateLifecycle(r,[0,1,3,5,6],'sample',1));
});
test('sealed-final reports require explicit opening, retain evaluated identity and are not recomputed after learning',()=>{
 const r=trainedBase();assert.throws(()=>evaluateLifecycleRun(r,'final'),/sealed/);const opened=openLifecycleFinalTest(r);assert.equal(opened.finalReport.copy.correct,4);assert.equal(opened.finalReport.fingerprint,lifecycleFingerprint(r.weights));const changed=train(forkLifecycleRun(opened,'sft'),10);assert.deepEqual(changed.finalReport,opened.finalReport);assert.notEqual(lifecycleFingerprint(changed.weights),changed.finalReport.fingerprint);assert.deepEqual(readLifecycleCheckpoint(serializeLifecycleCheckpoint(changed)),changed);assert.equal(r.finalOpened,false);
});
test('checkpoint validation rejects unknown fields, nonfinite/oversized state, invalid source IDs and inconsistent counters',()=>{
 const r=advanceLifecycleRun(createLifecycleRun());for(const mutate of [x=>x.hidden=true,x=>x.weights.push(0),x=>x.weights[0]=null,x=>x.config.unknown=true,x=>x.rng=0,x=>x.dataDraws=1,x=>x.optimizerStep=99,x=>x.history[0].exampleIds[0]='final-copy-a-uvu',x=>x.history[0].rollouts=Array(999).fill({}),x=>x.squares[0]=-1,x=>x.lastUpdate.after[0]+=1,x=>x.stage='PPO',x=>x.schemaVersion=2]){const bad=copy(r);mutate(bad);assert.throws(()=>readLifecycleCheckpoint(JSON.stringify(bad)));}assert.throws(()=>readLifecycleCheckpoint(' '.repeat(600001)));assert.deepEqual(r,readLifecycleCheckpoint(serializeLifecycleCheckpoint(r)));
});
test('bounded CPU and invalid operation failures preserve the previous workspace',()=>{
 const run=createLifecycleRun(),snapshot=copy(run);for(const n of [0,-1,41,1e9,NaN,Infinity])assert.throws(()=>advanceLifecycleRun(run,n));assert.deepEqual(run,snapshot);assert.throws(()=>resolveLifecycleConfig({unknown:1}));assert.throws(()=>inspectLifecycleForward(run.weights,Array(100000).fill(1)));assert.throws(()=>lifecycleSupervisedObjective(run.weights,Array(10000).fill(lifecycleExamples('train','copy')[0])));validateLifecycleRun(run);
});

// These are the exact pure workspace functions called by the component's load/import/commit boundary.
const {createLifecycleExposureJournal,loadLifecycleWorkspace,importLifecycleWorkspace,lifecycleWorkspaceKeys}=await import('../src/lib/model-lifecycle-workspace.ts');
const memoryStorage=()=>{const values=new Map();return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
test('component workspace boundary retains final exposure across an older import and a new initialized run',()=>{
 const storage=memoryStorage(),journal=createLifecycleExposureJournal(storage),old=createLifecycleRun(),opened=openLifecycleFinalTest(old);
 journal.retain(opened);assert.equal(storage.getItem(lifecycleWorkspaceKeys.exposure),'true');
 const restored=importLifecycleWorkspace(serializeLifecycleCheckpoint(old),journal,0,0);assert.equal(restored.finalOpened,true);assert.equal(restored.finalReport,null);assert.equal(old.finalOpened,false);
 const reset=journal.retain(createLifecycleRun({seed:8}));assert.equal(reset.finalOpened,true);assert.equal(journal.hasSeen(),true);
});
test('imported exposed checkpoint persists independent disclosure before any explicit save',()=>{
 const storage=memoryStorage(),old=createLifecycleRun();storage.setItem(lifecycleWorkspaceKeys.checkpoint,serializeLifecycleCheckpoint(old));
 const imported=importLifecycleWorkspace(serializeLifecycleCheckpoint(openLifecycleFinalTest(old)),createLifecycleExposureJournal(storage),3,3);assert.equal(imported.finalOpened,true);
 // Simulate a fresh component after importing but without saving weights.
 const reloaded=loadLifecycleWorkspace(storage);assert.equal(reloaded.step,old.step);assert.equal(reloaded.finalOpened,true);assert.equal(reloaded.finalReport,null);
});
test('invalid and stale asynchronous imports preserve both the run and exposure journal',()=>{
 const storage=memoryStorage(),journal=createLifecycleExposureJournal(storage),run=createLifecycleRun(),snapshot=JSON.stringify(run),exposed=serializeLifecycleCheckpoint(openLifecycleFinalTest(run));
 assert.throws(()=>importLifecycleWorkspace('{bad',journal,1,1));assert.equal(journal.hasSeen(),false);assert.equal(storage.values.size,0);
 assert.throws(()=>importLifecycleWorkspace(exposed,journal,1,2),/run changed/);assert.equal(journal.hasSeen(),false);assert.equal(storage.values.size,0);assert.equal(JSON.stringify(run),snapshot);
});
test('unavailable storage retains exposure within the mounted workspace and exported checkpoint',()=>{
 const storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}},journal=createLifecycleExposureJournal(storage),old=createLifecycleRun();
 journal.retain(openLifecycleFinalTest(old));const imported=importLifecycleWorkspace(serializeLifecycleCheckpoint(old),journal,0,0);assert.equal(imported.finalOpened,true);assert.equal(journal.storageAvailable(),false);assert.equal(readLifecycleCheckpoint(serializeLifecycleCheckpoint(imported)).finalOpened,true);
});
test('corrupt saved bytes remain recoverable while an independent exposure marker survives load',()=>{
 const storage=memoryStorage();storage.setItem(lifecycleWorkspaceKeys.checkpoint,'corrupt saved content');storage.setItem(lifecycleWorkspaceKeys.exposure,'true');
 const loaded=loadLifecycleWorkspace(storage);assert.equal(loaded.finalOpened,true);assert.equal(storage.getItem(lifecycleWorkspaceKeys.checkpoint),'corrupt saved content');assert.equal(loaded.step,0);
});
test('fresh workspace stays procedurally unopened and does not manufacture an exposure write',()=>{
 const storage=memoryStorage(),run=loadLifecycleWorkspace(storage);assert.equal(run.finalOpened,false);assert.equal(storage.values.size,0);
 const clone=importLifecycleWorkspace(serializeLifecycleCheckpoint(run),createLifecycleExposureJournal(storage),0,0);assert.equal(clone.finalOpened,false);assert.equal(storage.values.size,0);
});

test('an already mounted journal incorporates exposure recorded by another workspace before importing old state',()=>{const bytes=new Map(),storage={getItem:k=>bytes.get(k)??null,setItem:(k,v)=>bytes.set(k,v)},first=createLifecycleExposureJournal(storage),second=createLifecycleExposureJournal(storage);first.retain({...createLifecycleRun(),finalOpened:true});assert.equal(second.hasSeen(),false);const restored=importLifecycleWorkspace(serializeLifecycleCheckpoint(createLifecycleRun()),second,0,0);assert.equal(restored.finalOpened,true);assert.equal(second.hasSeen(),true);});
