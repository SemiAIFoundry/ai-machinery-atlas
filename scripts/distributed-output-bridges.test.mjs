import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import katex from 'katex';
import {loadAuthoredAtlas} from './atlas-authoring.mjs';
const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url),'utf8'));
const pack=read('../src/lib/data/distributed-output-bridges.json'),equations=read('../src/lib/data/equations-distributed-output.json'),sources=read('../docs/distributed-output-bridges/source-review-manifest.json');
const lesson=id=>pack.lessons.find(x=>x.id===id),trace=id=>lesson(id).workedTrace,near=(a,b,tol=1e-12)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} differs from ${b}`);
const sum=xs=>xs.reduce((a,b)=>a+b,0),matrixSum=xs=>xs[0].map((row,i)=>row.map((_,j)=>sum(xs.map(x=>x[i][j]))));
// Independent direct dot product; no authored expected partials enter this calculation.
function multiply(a,b){return a.map(row=>b[0].map((_,j)=>sum(row.map((x,k)=>x*b[k][j]))));}
function partials(a,b,partitions){return partitions.map(ks=>a.map(row=>b[0].map((_,j)=>sum(ks.map(k=>row[k]*b[k][j])))));}
const authored=await loadAuthoredAtlas();
test('four additive lessons form one existing-domain chapter with valid identifiers and no prerequisite cycles',()=>{
 assert.equal(pack.lessons.length,4);assert.equal(pack.chapters.length,1);assert.deepEqual(pack.timeline,[]);assert.equal(new Set(pack.lessons.map(x=>x.id)).size,4);assert.deepEqual(pack.chapters[0].ids,pack.lessons.map(x=>x.id));assert.equal(pack.chapters[0].domainId,'executable-software');assert.equal(pack.chapters[0].band,4);
 const combined=new Map(authored.records.map(x=>[x.id,x]));for(const l of pack.lessons)combined.set(l.id,l);const state=new Map();
 function visit(id){assert.ok(combined.has(id),`Unknown ${id}`);assert.notEqual(state.get(id),'active',`Cycle through ${id}`);if(state.get(id)==='done')return;state.set(id,'active');for(const p of combined.get(id).prerequisites??[])visit(p);state.set(id,'done');}
 for(const l of combined.values())visit(l.id);for(const l of pack.lessons)for(const id of l.related)assert.ok(combined.has(id),id);
});
test('every lesson has substantive scoped explanation, worked content and multiple answerable checks',()=>{
 for(const l of pack.lessons){assert.ok(l.description.length>700,l.id);assert.ok(l.engineeringExample.length>650,l.id);assert.ok(l.mechanism.length>=6,l.id);assert.ok(l.learningObjective.length>60);assert.ok(l.prerequisites.length>=3);assert.ok(l.evidenceNotes.includes('authored')||l.evidenceNotes.includes('synthetic'));assert.ok(l.interfaces.some(x=>x.direction==='in')&&l.interfaces.some(x=>x.direction==='out'));for(const c of [l.check,...l.checks]){assert.ok(c.options.length>=3);assert.ok(Number.isInteger(c.answer)&&c.answer>=0&&c.answer<c.options.length);assert.ok(c.explanation.length>30);}assert.equal(l.investigationId,'execution');assert.doesNotMatch(l.description,/\b(show the|draw the|animate the|the viewer|the atlas lets)\b/i);}
});
test('eight canonical equations render strictly and pair with populated scientific assumptions and variable units',()=>{
 assert.deepEqual(Object.keys(equations),pack.lessons.map(x=>x.id));let count=0;
 for(const l of pack.lessons){assert.equal(equations[l.id].length,l.science.length);assert.equal(l.science.length,2);for(let i=0;i<l.science.length;i++){const e=equations[l.id][i];assert.equal(e.kind,'math');assert.ok(e.text.length>40);assert.ok(e.variables.length>=2);assert.ok(e.variables.every(v=>v.symbol&&v.meaning&&v.unit));assert.ok(l.science[i].assumptions.length>60);assert.doesNotThrow(()=>katex.renderToString(e.latex,{throwOnError:true,strict:'error',displayMode:true}));count++;}}
 assert.equal(count,8);
});
test('all lesson source references are covered by scoped, actually dated agent checks without invented human review',()=>{
 const byId=new Map(sources.sources.map(x=>[x.id,x]));assert.equal(byId.size,6);assert.equal(sources.humanSpecialistReview,null);
 for(const l of pack.lessons){const expected=l.sourceIds.map(id=>byId.get(id));assert.ok(expected.every(Boolean));assert.deepEqual(l.sources.map(x=>x.url).sort(),expected.map(x=>x.url).sort());for(const s of expected){assert.ok(s.lessonIds.includes(l.id));assert.equal(s.actorType,'agent');assert.equal(s.checkedOn,'2026-09-07');assert.equal(s.humanSpecialistReview,null);assert.ok(s.locator.length>40&&s.scope.length>60&&s.triggers.length>=2);assert.ok(s.recheckCadenceDays>0);assert.equal(s.sourcePublicationDate,null);}}
});
test('pack evidence cards preserve source identity, applicable lessons and explicit non-performance limits',()=>{
 const ids=new Set(pack.lessons.map(l=>l.id)),sourceIds=new Set(pack.sources.map(s=>s.id));assert.equal(pack.sources.length,6);assert.equal(pack.claims.length,4);assert.deepEqual(pack.milestones,[]);for(const c of pack.claims){assert.ok(sourceIds.has(c.sourceId));assert.ok(c.lessonIds.every(id=>ids.has(id)));assert.ok(['reported','research'].includes(c.status));assert.equal(c.checkedOn,'2026-09-07');assert.ok(c.scope.length>35&&c.limitations.length>70&&c.denominator);}
});
test('inner-dimension partials independently reconstruct the exact matrix and both receive layouts',()=>{
 const t=trace('sharded-matmul-ownership'),{a,b,partitions}=t.input,ps=partials(a,b,partitions),reference=multiply(a,b);assert.deepEqual(ps,t.partialProducts);assert.deepEqual(matrixSum(ps),reference);assert.deepEqual(reference,t.reduceScatterRows);assert.deepEqual(t.gatheredByRank,[reference,reference]);assert.notDeepEqual(ps.flat(),reference);
});
test('the explicit two-phase exchange transports the correct row once at the sender boundary',()=>{
 const t=trace('sharded-matmul-ownership'),ps=t.partialProducts,rs=t.phases[0].sends,ag=t.phases[1].sends;assert.deepEqual(rs[0].payload,ps[0][1]);assert.deepEqual(rs[1].payload,ps[1][0]);assert.deepEqual(ag.map(x=>x.payload),t.reduceScatterRows);
 let total=0;const perRank=[0,0];for(const phase of t.phases)for(const e of phase.sends){assert.notEqual(e.from,e.to);assert.equal(e.bytes,e.payload.length*t.input.bytesPerElement);total+=e.bytes;perRank[e.from]+=e.bytes;}assert.equal(total,t.totalSentBytes);assert.equal(total,32);assert.deepEqual(perRank,[16,16]);
});
test('different contracted-axis partitions preserve products across signed small matrix specimens',()=>{
 for(let n=2;n<=4;n++)for(let seed=-3;seed<=3;seed++){const a=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>((i*n+j+seed)%7)-3)),b=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>(i-j)*seed));for(const ks of [Array.from({length:n},(_,i)=>[i]),[Array.from({length:n},(_,i)=>i).filter(i=>i%2===0),Array.from({length:n},(_,i)=>i).filter(i=>i%2===1)]])assert.deepEqual(matrixSum(partials(a,b,ks)),multiply(a,b));}
});
test('global gradient follows the actual eight-item squared-error objective and agrees with finite differences',()=>{
 const t=trace('distributed-gradient-weighting'),{parameter:w,rankTargets,learningRate:lr}=t.input,counts=rankTargets.map(x=>x.length),means=rankTargets.map(ys=>sum(ys.map(y=>w-y))/ys.length),ys=rankTargets.flat(),global=sum(ys.map(y=>w-y))/ys.length;
 assert.deepEqual(counts,t.localCounts);assert.deepEqual(means,t.localGradientMeans);near(global,t.globalGradient);near(sum(means)/means.length,t.unweightedRankGradient);near(w-lr*global,t.correctNextParameter);near(w-lr*t.unweightedRankGradient,t.unweightedNextParameter);
 const objective=w=>sum(ys.map(y=>.5*(w-y)**2))/ys.length,h=1e-4;near((objective(w+h)-objective(w-h))/(2*h),global,1e-9);
});
test('sample-weighted rank means equal flattening for uneven groups; unweighted rank means need not',()=>{
 for(let n0=1;n0<=7;n0++)for(let n1=1;n1<=7;n1++)for(const m0 of [-2,0,1])for(const m1 of [-3,1,4]){const n=n0+n1,global=(n0*m0+n1*m1)/n,scaledMean=((2*n0/n)*m0+(2*n1/n)*m1)/2;near(scaledMean,global);if(n0===n1)near(global,(m0+m1)/2);}
 const t=trace('distributed-gradient-weighting'),n=sum(t.localCounts),p=t.localCounts.length,scales=t.localCounts.map(c=>p*c/n);assert.deepEqual(scales,t.meanReducerScales);assert.deepEqual(scales.map((s,i)=>s*t.localGradientMeans[i]),t.scaledLocalGradients);near(sum(t.scaledLocalGradients)/p,t.globalGradient);assert.notEqual(t.globalGradient,t.unweightedRankGradient);
});
test('binary32 cancellation trace and reference error use two independent rounding mechanisms',()=>{
 const t=trace('floating-point-reduction-order'),{a,b,c}=t.input,f=Math.fround,f32=x=>new Float32Array([x])[0];for(const round of [f,f32]){assert.equal(round(a+b),t.left.firstRounded);assert.equal(round(round(a+b)+c),t.left.result);assert.equal(round(b+c),t.right.firstRounded);assert.equal(round(a+round(b+c)),t.right.result);}
 assert.equal(Number(BigInt(a)+BigInt(b)+BigInt(c)),t.exactReference);assert.equal(a+b,t.left.firstExact);assert.equal(b+c,t.right.firstExact);assert.equal(Math.abs(t.left.result-t.exactReference)<=t.absoluteTolerance,t.leftPasses);assert.equal(Math.abs(t.right.result-t.exactReference)<=t.absoluteTolerance,t.rightPasses);assert.equal((a+b)+c,t.exactReference);
});
test('binary32 spacing and ties-to-even are checked on both sides of the power-of-two boundary',()=>{
 const f=Math.fround,p=2**24;assert.equal(f(p+1),p);assert.equal(f(p+2),p+2);assert.equal(f(p+3),p+4);assert.equal(f(p-1),p-1);const buffer=new ArrayBuffer(4),view=new DataView(buffer);view.setFloat32(0,p);const bits=view.getUint32(0);view.setUint32(0,bits+1);assert.equal(view.getFloat32(0)-p,2);view.setUint32(0,bits-1);assert.equal(p-view.getFloat32(0),1);
});
// Probability-mass enumeration independently accounts for accepted and rejected branches.
function correctedDistribution(p,q){const accepted=p.map((x,i)=>Math.min(x,q[i])),alpha=sum(accepted),residual=p.map((x,i)=>Math.max(0,x-q[i])),z=sum(residual),r=z?residual.map(x=>x/z):null;return {accepted,alpha,correction:r,output:accepted.map((x,i)=>x+(1-alpha)*(r?.[i]??0))};}
test('speculative sampling recovers the exact toy target rather than accepting the draft unconditionally',()=>{
 const t=trace('speculative-decoding-verification'),{target:p,draft:q}=t.input,r=correctedDistribution(p,q);r.accepted.forEach((x,i)=>near(x,t.acceptedMass[i]));p.forEach((x,i)=>near(Math.min(1,x/q[i]),t.conditionalAcceptance[i]));near(r.alpha,t.acceptanceRate);near(1-r.alpha,t.rejectionProbability);r.correction.forEach((x,i)=>near(x,t.correctionDistribution[i]));r.output.forEach((x,i)=>near(x,t.outputDistribution[i]));assert.notDeepEqual(q,r.output);
});
test('correction mass preserves target distributions across support gaps, equality and a simplex grid',()=>{
 const distributions=[];for(let a=0;a<=5;a++)for(let b=0;b<=5-a;b++)distributions.push([a/5,b/5,(5-a-b)/5]);
 for(const p of distributions)for(const q of distributions){const r=correctedDistribution(p,q);r.output.forEach((x,i)=>near(x,p[i]));near(sum(r.output),1);assert.ok(r.alpha>=-1e-12&&r.alpha<=1+1e-12);if(r.correction)near(sum(r.correction),1);}
 const equal=correctedDistribution([.5,.5],[.5,.5]);assert.equal(equal.correction,null);assert.equal(equal.alpha,1);const disjoint=correctedDistribution([1,0],[0,1]);assert.equal(disjoint.alpha,0);assert.deepEqual(disjoint.output,[1,0]);
});
test('iid output counts include the correction/bonus and handle zero and perfect acceptance',()=>{
 const t=trace('speculative-decoding-verification'),a=t.acceptanceRate,counts=[1,2,3],probabilities=[1-a,a*(1-a),a*a];probabilities.forEach((x,i)=>near(x,t.iidOutputCounts.probabilities[i]));near(sum(probabilities),1);near(sum(counts.map((k,i)=>k*probabilities[i])),t.iidOutputCounts.expected);near(t.iidOutputCounts.expected,1+a+a*a);
 for(let gamma=0;gamma<=6;gamma++)for(const alpha of [0,.2,.6,1]){const probs=Array.from({length:gamma+1},(_,i)=>i===gamma?alpha**i:alpha**i*(1-alpha)),expected=sum(probs.map((p,i)=>p*(i+1)));near(sum(probs),1);near(expected,sum(Array.from({length:gamma+1},(_,i)=>alpha**i)));if(alpha===0)assert.equal(expected,1);if(alpha===1)assert.equal(expected,gamma+1);}
});
test('throughput uses separately assumed round times and can reverse the apparent acceleration',()=>{
 const t=trace('speculative-decoding-verification'),c=t.timingAssumptions,k=t.iidOutputCounts.expected,baseline=1000/c.baselineMsPerToken,fast=k*1000/(c.draftTotalMs+c.verificationMs+c.overheadMs),slow=k*1000/(c.draftTotalMs+t.slowerVerificationMs+c.overheadMs);near(fast,t.conditionalTokensPerSecond);near(slow,t.slowerConditionalTokensPerSecond);assert.ok(fast>baseline&&slow<baseline);assert.match(lesson('speculative-decoding-verification').evidenceNotes,/millisecond values are authored/);
});
