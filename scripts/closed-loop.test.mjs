import test from 'node:test';import assert from 'node:assert/strict';
import {defaultControlInput,runClosedLoop,plantStep,identificationData,fitDynamics,planActions,normalizeControlInput,encodeControlRecord,readControlRecord} from '../src/lib/closed-loop.ts';
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
test('system identification recovers independently selected linear coefficients and rejects unidentifiable calibration',()=>{
 for(const [a,b] of [[.9,.2],[.65,.35],[-.2,.5]]){const rows=[[-1,0],[0,1],[2,-1],[-2,1]].map(([velocity,action],i)=>({id:String(i),velocity,action,nextVelocity:a*velocity+b*action}));const fit=fitDynamics(rows);close(fit.retention,a);close(fit.gain,b);close(fit.residualMse,0);}
 assert.throws(()=>fitDynamics([{id:'a',velocity:0,action:0,nextVelocity:0},{id:'b',velocity:0,action:0,nextVelocity:1}]),/cannot identify/);
});
test('the declared physical transition uses current velocity and preserves state until the next sample',()=>{assert.deepEqual(plantStep(2,3,-1,.9,.2,.1),{x:2.6,v:2.6});});
test('search enumerates every bounded sequence and selects the independently evaluated minimum feasible cost',()=>{
 const planned=planActions(.5,.2,3,.9,.2);assert.equal(planned.candidates.length,27);assert.equal(new Set(planned.candidates.map(x=>x.actions.join(','))).size,27);
 for(const c of planned.candidates){let x=.5,v=.2,cost=0,feasible=true;for(const u of c.actions){const nx=x+.2*v;v=.9*v+.2*u;x=nx;cost+=(x-2)**2+.08*u*u;feasible&&=x>=-.5&&x<=3;}cost+=6*(x-2)**2+2*v*v;close(c.cost,cost);assert.equal(c.feasible,feasible);close(c.finalX,x);}
 close(planned.selected.cost,Math.min(...planned.candidates.filter(c=>c.feasible).map(c=>c.cost)));assert.equal(planActions(10,0,3,.9,.2).selected,null);
});
test('episode transitions and observed timestamps reconcile without exposing true state to the controller',()=>{
 const r=runClosedLoop({...defaultControlInput,delay:3,noise:.07});for(let i=0;i<60;i++){const t=r.trace[i];close(t.nextX,t.trueX+.2*t.trueV);close(t.nextV,.9*t.trueV+.2*t.applied+t.disturbance);assert.equal(t.observedAt,Math.max(0,i-3));assert.equal(t.measurement,r.trace[t.observedAt].sensor);close(t.observationAge,(i-t.observedAt)*.2);assert.equal(r.states[i+1].x,t.nextX);assert.ok(Math.abs(t.sensor-t.trueX)<=.07);}
 assert.deepEqual(r,runClosedLoop({...defaultControlInput,delay:3,noise:.07}));
});
test('nominal planner and simpler feedback both settle; comparative denominators remain identical',()=>{
 for(const controller of ['predictive','proportional']){const r=runClosedLoop({...defaultControlInput,controller});assert.equal(r.metrics.goalReached,true);assert.equal(r.trace.length,60);assert.equal(r.metrics.simulatedSeconds,12);assert.equal(r.metrics.violationTicks.length,0);assert.ok(r.metrics.finalError<.1&&Math.abs(r.metrics.finalVelocity)<.1);}
 assert.equal(runClosedLoop({...defaultControlInput,controller:'open-loop'}).metrics.goalReached,false);
});
test('delay, bad model and deadline failures are actual applied-action consequences',()=>{
 const delay=runClosedLoop({...defaultControlInput,delay:4}),wrong=runClosedLoop({...defaultControlInput,model:'wrong-gain'}),deadline=runClosedLoop({...defaultControlInput,deadline:40});assert.ok(delay.metrics.violationTicks.length>0);assert.ok(wrong.metrics.violationTicks.length>0);assert.equal(deadline.metrics.missedDeadlines,60);assert.ok(deadline.trace.every(t=>t.applied===0));assert.equal(deadline.metrics.finalError,2);
 const long=runClosedLoop({...defaultControlInput,horizon:5});assert.equal(long.metrics.missedDeadlines,60);
});
test('plant intervention does not train on episode truth or rewrite calibration',()=>{
 const a=runClosedLoop(defaultControlInput),b=runClosedLoop({...defaultControlInput,plantRetention:1.02,plantGain:.4});assert.deepEqual(a.training,b.training);assert.deepEqual(a.fitted,b.fitted);assert.deepEqual(a.training,identificationData());assert.ok(Math.abs(b.metrics.finalVelocity)>.1);assert.notDeepEqual(a.states,b.states);assert.equal(a.metrics.goalReached,true);assert.equal(b.metrics.goalReached,false);
});
test('portable inputs round-trip, reject unknown/version/nonfinite state and do not mutate source text',()=>{
 const raw=encodeControlRecord(defaultControlInput,'old-content');assert.deepEqual(readControlRecord(raw),{input:defaultControlInput,sourceContent:'old-content'});assert.equal(encodeControlRecord(readControlRecord(raw).input,'old-content'),raw);
 for(const x of [{...defaultControlInput,seed:1.5},{...defaultControlInput,noise:NaN},{...defaultControlInput,rogue:1},{...defaultControlInput,delay:99}])assert.throws(()=>normalizeControlInput(x));assert.throws(()=>readControlRecord(raw.replace('closed-loop-1','closed-loop-2')));assert.throws(()=>readControlRecord(' '.repeat(12001)));assert.deepEqual(defaultControlInput,{seed:17,delay:0,noise:0,plantRetention:.9,plantGain:.2,controller:'predictive',horizon:4,deadline:100,model:'fitted',disturbance:0});
});
test('compute allowance cannot exceed the physical sampling period',()=>{const r=runClosedLoop({...defaultControlInput,horizon:5,deadline:300});assert.equal(r.metrics.missedDeadlines,60);assert.ok(r.trace.every(t=>t.computeAssumedMs===243&&t.effectiveDeadlineMs===200&&t.applied===0));assert.equal(r.metrics.finalError,2);});
test('nominal delayed velocity estimate matches the observation timestamp and effort has action-squared time units',()=>{for(const delay of [0,5]){const r=runClosedLoop({...defaultControlInput,delay});for(const t of r.trace)close(t.estimatedV,r.states[t.observedAt].v);close(r.metrics.actionEffortSeconds,r.trace.reduce((s,t)=>s+t.applied**2,0)*.2);}});
test('calibration rejects nonfinite, unbounded or duplicate-identity rows and record encoder rejects invalid source identity',()=>{const rows=identificationData();for(const change of [r=>r[0].velocity=Infinity,r=>r[0].action=1e100,r=>r[0].id=r[1].id]){const bad=structuredClone(rows);change(bad);assert.throws(()=>fitDynamics(bad));}assert.throws(()=>encodeControlRecord(defaultControlInput,'x'.repeat(101)));assert.throws(()=>readControlRecord('"'+'🧠'.repeat(3000)+'"'));});
