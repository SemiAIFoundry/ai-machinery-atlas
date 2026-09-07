export const controlVersion='closed-loop-1';
export type ControlInput={seed:number;delay:number;noise:number;plantRetention:number;plantGain:number;controller:'predictive'|'proportional'|'open-loop';horizon:number;deadline:number;model:'fitted'|'wrong-gain';disturbance:number};
export const defaultControlInput:ControlInput={seed:17,delay:0,noise:0,plantRetention:.9,plantGain:.2,controller:'predictive',horizon:4,deadline:100,model:'fitted',disturbance:0};
const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
const finite=(x:unknown,a:number,b:number,int=false):x is number=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b&&(!int||Number.isInteger(x));
export function normalizeControlInput(raw:unknown):ControlInput{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Expected control settings');const x=raw as ControlInput;
 if(Object.keys(x).sort().join(',')!==Object.keys(defaultControlInput).sort().join(','))throw Error('Unknown or missing control setting');
 for(const [key,a,b,int] of [['seed',1,999,true],['delay',0,6,true],['noise',0,.15,false],['plantRetention',.5,1.02,false],['plantGain',.05,.4,false],['horizon',1,5,true],['deadline',1,300,true],['disturbance',-.2,.2,false]] as const)if(!finite(x[key],a,b,int))throw Error('Invalid '+key);
 if(!['predictive','proportional','open-loop'].includes(x.controller)||!['fitted','wrong-gain'].includes(x.model))throw Error('Unknown model or controller');return {...x};
}
function rng(seed:number){let state=seed>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return (state+.5)/4294967296;};}
export type Transition={id:string;velocity:number;action:number;nextVelocity:number};
export function identificationData():Transition[]{let v=0;return [1,0,-1,1,1,-1,0,0,1,-1,-1,1].map((action,i)=>{const nextVelocity=.9*v+.2*action;const row={id:'calibration-'+i,velocity:v,action,nextVelocity};v=nextVelocity;return row;});}
export function fitDynamics(rows:Transition[]){
 if(rows.length<2||rows.length>64||rows.some(r=>!r||typeof r.id!=='string'||r.id.length<1||r.id.length>100||![r.velocity,r.action,r.nextVelocity].every(x=>Number.isFinite(x)&&Math.abs(x)<=1e6))||new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Invalid calibration transitions');
 const vv=rows.reduce((s,r)=>s+r.velocity*r.velocity,0),uu=rows.reduce((s,r)=>s+r.action*r.action,0),vu=rows.reduce((s,r)=>s+r.velocity*r.action,0),vy=rows.reduce((s,r)=>s+r.velocity*r.nextVelocity,0),uy=rows.reduce((s,r)=>s+r.action*r.nextVelocity,0),det=vv*uu-vu*vu;
 if(Math.abs(det)<1e-12)throw Error('Calibration cannot identify both parameters');
 const retention=(vy*uu-uy*vu)/det,gain=(uy*vv-vy*vu)/det;
 return {retention,gain,residualMse:rows.reduce((s,r)=>s+(r.nextVelocity-retention*r.velocity-gain*r.action)**2,0)/rows.length,trainIds:rows.map(r=>r.id)};
}
export function plantStep(x:number,v:number,u:number,retention:number,gain:number,disturbance=0){return {x:x+.2*v,v:retention*v+gain*u+disturbance};}
export type Candidate={actions:number[];cost:number;feasible:boolean;finalX:number;finalV:number};
export function planActions(x:number,v:number,horizon:number,retention:number,gain:number){
 if(![x,v,retention,gain].every(Number.isFinite)||!Number.isInteger(horizon)||horizon<1||horizon>5)throw Error('Invalid planning state');
 const candidates:Candidate[]=[];
 function visit(px:number,pv:number,actions:number[],cost:number,feasible:boolean){
  if(actions.length===horizon){candidates.push({actions,cost:cost+6*(px-2)**2+2*pv*pv,feasible,finalX:px,finalV:pv});return;}
  for(const u of [-1,0,1]){const next=plantStep(px,pv,u,retention,gain);visit(next.x,next.v,[...actions,u],cost+(next.x-2)**2+.08*u*u,feasible&&next.x>=-.5&&next.x<=3);}
 }
 visit(x,v,[],0,true);candidates.sort((a,b)=>Number(b.feasible)-Number(a.feasible)||a.cost-b.cost||a.actions.reduce((s,x)=>s+Math.abs(x),0)-b.actions.reduce((s,x)=>s+Math.abs(x),0));
 return {candidates,selected:candidates.find(c=>c.feasible)||null,operations:3**horizon};
}
export function runClosedLoop(raw:unknown){
 const input=normalizeControlInput(raw),training=identificationData(),fitted=fitDynamics(training),model={retention:fitted.retention,gain:input.model==='wrong-gain'?-fitted.gain:fitted.gain},random=rng(input.seed);
 let x=0,v=0,u=0;const states=[{x,v}],sensors:number[]=[],trace:{tick:number;timeSeconds:number;trueX:number;trueV:number;sensor:number;observedAt:number;measurement:number;estimatedV:number;observationAge:number;proposed:number;applied:number;deadlineMiss:boolean;planningFailure:boolean;computeAssumedMs:number;effectiveDeadlineMs:number;disturbance:number;nextX:number;nextV:number;constraintViolated:boolean;candidates:Candidate[];prediction:Candidate|null}[]=[];
 for(let t=0;t<60;t++){
  const sensor=x+(random()*2-1)*input.noise;sensors.push(sensor);const observedAt=Math.max(0,t-input.delay),measurement=sensors[observedAt];
  const previousV=observedAt===0?0:(measurement-sensors[observedAt-1])/.2;
  const measuredV=observedAt===0?0:model.retention*previousV+model.gain*trace[observedAt-1].applied;
  const estimate={x:measurement,v:measuredV};
  const planned=input.controller==='predictive'?planActions(estimate.x,estimate.v,input.horizon,model.retention,model.gain):null;
  const compute=planned?.operations||1,effectiveDeadlineMs=Math.min(input.deadline,200),deadlineMiss=compute>effectiveDeadlineMs;
  let proposed=planned?.selected?.actions[0]??0;
  if(input.controller==='proportional')proposed=clamp(2*(2-measurement)-2*measuredV,-1,1);
  if(input.controller==='open-loop')proposed=t<8?1:t<14?-1:0;
  const planningFailure=!!planned&&!planned.selected;
  const applied=deadlineMiss?u:planningFailure?0:proposed;
  const disturbance=t===25?input.disturbance:0,next=plantStep(x,v,applied,input.plantRetention,input.plantGain,disturbance);
  trace.push({tick:t,timeSeconds:t*.2,trueX:x,trueV:v,sensor,observedAt,measurement,estimatedV:measuredV,observationAge:(t-observedAt)*.2,proposed,applied,deadlineMiss,planningFailure,computeAssumedMs:compute,effectiveDeadlineMs,disturbance,nextX:next.x,nextV:next.v,constraintViolated:next.x<-.5||next.x>3,candidates:planned?.candidates||[],prediction:planned?.selected||null});
  u=applied;x=next.x;v=next.v;states.push({x,v});
 }
 const finalError=Math.abs(x-2),rmsError=Math.sqrt(states.slice(1).reduce((s,r)=>s+(r.x-2)**2,0)/60),violationTicks=trace.filter(r=>r.constraintViolated).map(r=>r.tick),missedDeadlines=trace.filter(r=>r.deadlineMiss).length,goalReached=finalError<=.1&&Math.abs(v)<=.1&&violationTicks.length===0;
 return {version:controlVersion,input,training,fitted,model,trace,states,metrics:{finalError,rmsError,violationTicks,missedDeadlines,finalVelocity:v,goalReached,simulatedSeconds:12,actionEffortSeconds:trace.reduce((s,r)=>s+r.applied*r.applied*.2,0)},assumptions:{cost:'Dimensionless objective using position divided by 1 m, velocity divided by 1 m/s and action divided by one action unit; weights 1, 0.08, 6 and 2 are authored.',sampleSeconds:.2,goal:2,positionLimits:[-.5,3],compute:'One authored millisecond per enumerated action sequence; not measured execution time. Effective deadline is at most the 200 ms physical sample period.',sensor:'Uniform bounded position noise and delayed observations; finite-difference velocity followed by one model-based velocity transition; delayed state is not extrapolated to the present',plant:'Discrete 1D velocity-retention plant in illustrative m and m/s; no real actuator or robot'}};
}
export function encodeControlRecord(input:ControlInput,sourceContent:string){if(typeof sourceContent!=='string'||sourceContent.length>100)throw Error('Invalid source identity');return JSON.stringify({schemaVersion:1,modelVersion:controlVersion,sourceContent,input:normalizeControlInput(input)});}
export function readControlRecord(raw:string){
 if(new TextEncoder().encode(raw).length>12000)throw Error('Record exceeds 12,000 bytes');const r=JSON.parse(raw);
 if(!r||Object.keys(r).sort().join(',')!=='input,modelVersion,schemaVersion,sourceContent'||r.schemaVersion!==1||r.modelVersion!==controlVersion||typeof r.sourceContent!=='string'||r.sourceContent.length>100)throw Error('Unsupported control record; original text remains available');return {input:normalizeControlInput(r.input),sourceContent:r.sourceContent};
}
