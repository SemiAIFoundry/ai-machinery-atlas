import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createLifecycleRun,advanceLifecycleRun,readLifecycleCheckpoint,serializeLifecycleCheckpoint,lifecycleFingerprint} from '../../../../src/lib/model-lifecycle.ts';

const near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<tolerance,`${a} versus ${b}`);
const scores=[0,Math.log(3)],values=[2,6];
const output=s=>{const e=s.map(Math.exp),z=e.reduce((a,b)=>a+b,0);return e.reduce((a,b,i)=>a+b*values[i],0)/z;};
const epsilon=1e-5,derivatives=scores.map((_,i)=>{const plus=[...scores],minus=[...scores];plus[i]+=epsilon;minus[i]-=epsilon;return(output(plus)-output(minus))/(2*epsilon);});
near(output(scores),5);near(derivatives[0],-.75);near(derivatives[1],.75);near(derivatives.reduce((a,b)=>a+b,0),0);
const allowed=Array.from({length:12},(_,i)=>i).filter(i=>i>=5&&i<=7);assert.deepEqual(allowed,[5,6,7]);
const scoreBytes=4096*4096*2;assert.equal(scoreBytes,33554432);assert.equal(scoreBytes/2**20,32);
const nll=[.5,.25,.5].reduce((sum,p)=>sum-Math.log(p),0),mean=nll/3,ppl=Math.exp(mean);
near(nll,Math.log(16));near(mean,.9241962407465937);near(ppl,2.5198420997897464);near(Math.exp(Math.log(9)),9);
const seconds=2e12/20e9;assert.equal(seconds,100);
const first=advanceLifecycleRun(createLifecycleRun(),17),restored=readLifecycleCheckpoint(serializeLifecycleCheckpoint(first));
const resumed=advanceLifecycleRun(restored,23),whole=advanceLifecycleRun(createLifecycleRun(),40);assert.deepEqual(resumed,whole);assert.equal(whole.dataDraws,80);
const reset=structuredClone(first);reset.moments.fill(0);reset.squares.fill(0);const divergent=advanceLifecycleRun(reset,23);assert.notDeepEqual(divergent.weights,whole.weights);
const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0),incoming=[1,-1],outgoing=[.5,-.5],permutedIn=[-1,1],permutedOut=[-.5,.5];
const averagedIn=incoming.map((x,i)=>(x+permutedIn[i])/2),averagedOut=outgoing.map((x,i)=>(x+permutedOut[i])/2);
assert.equal(dot(incoming,outgoing),1);assert.equal(dot(permutedIn,permutedOut),1);assert.equal(dot(averagedIn,averagedOut),0);assert.equal((1+3)/2,2);
const report={checkedAt:new Date().toISOString(),actor:{kind:'agent',identifier:'/root/learning_source_review'},method:'Independent scalar calculations and finite differences; the 17+23 checkpoint reproduction executes the declared implementation and compares the entire state. This is not a device or human specialist review.',attention:{probabilities:[.25,.75],output:output(scores),finiteDifferenceDerivatives:derivatives,epsilon,packedAllowedSlots:allowed,firstCausalOutput:values[0]},attentionIoTiling:{scoreBytes,scoreMiB:scoreBytes/2**20,heads:1,requests:1,bytesPerScore:2},causalPretraining:{totalNllNats:nll,includedTargets:3,meanNllNats:mean,perplexity:ppl,uniformVocabulary:9,uniformNll:Math.log(9)},checkpoint:{decimalTB:2,decimalGBps:20,transferLowerBoundSeconds:seconds,updatesBeforeSave:17,updatesAfterRestore:23,uninterruptedUpdates:40,entireStateExactlyEqual:true,dataDraws:whole.dataDraws,fingerprint:lifecycleFingerprint(whole.weights),resetMomentFingerprint:lifecycleFingerprint(divergent.weights),resetMomentsDiverges:true},averaging:{firstCoefficient:dot(incoming,outgoing),permutedCoefficient:dot(permutedIn,permutedOut),averagedCoefficient:dot(averagedIn,averagedOut),alignedScalarAverage:2},allAssertionsPassed:true};
const destination=fileURLToPath(new URL('./arithmetic-results.json',import.meta.url));
if(process.argv.includes('--write')){if(fs.existsSync(destination))throw new Error('Review results are immutable; choose a new review directory for another dated run.');fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
