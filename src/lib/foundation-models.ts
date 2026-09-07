/** Bounded mathematical specimens; quantities are dimensionless unless explicitly named. */
export const foundationModelVersion='foundations-1';
function finite(x:number,name:string){if(!Number.isFinite(x))throw new RangeError(`${name} must be finite`);return x;}
function integer(x:number,min:number,max:number,name:string){finite(x,name);if(!Number.isInteger(x)||x<min||x>max)throw new RangeError(`${name} must be an integer from ${min} to ${max}`);return x;}
export function multiplyMatrices(a:number[][],b:number[][]){
 if(!a.length||!b.length||a.length>8||b.length>8||!a[0]?.length||!b[0]?.length||a[0].length!==b.length)throw new RangeError('Compatible matrices with at most eight rows are required');
 const k=b.length,n=b[0].length;if(n>8||a.some(r=>r.length!==k)||b.some(r=>r.length!==n))throw new RangeError('Rectangular matrices required');
 [...a.flat(),...b.flat()].forEach(x=>finite(x,'element'));
 const trace:{i:number;j:number;k:number;left:number;right:number;product:number;before:number;after:number}[]=[];
 const result=a.map((row,i)=>Array.from({length:n},(_,j)=>{let s=0;row.forEach((x,t)=>{const product=x*b[t][j],before=s;s+=product;trace.push({i,j,k:t,left:x,right:b[t][j],product,before,after:s});});return s;}));
 return {result,trace,shape:[a.length,n],multiplies:a.length*n*k,inputs:a.length*k+k*n};
}
export function rankSpecimen(large:number,small:number,angleDegrees:number){
 [large,small,angleDegrees].forEach(x=>finite(x,'parameter'));if(large<small||small<0||large>8||Math.abs(angleDegrees)>180)throw new RangeError('Require 0 ≤ small ≤ large ≤ 8');
 const t=angleDegrees*Math.PI/180,u=[Math.cos(t),Math.sin(t)],v=[-u[1],u[0]];
 const rankOne=u.map(x=>u.map(y=>large*x*y)),exact=rankOne.map((r,i)=>r.map((x,j)=>x+small*v[i]*v[j]));
 const errors=exact.map((r,i)=>r.map((x,j)=>x-rankOne[i][j]));
 return {exact,rankOne,errors,frobeniusError:Math.sqrt(errors.flat().reduce((s,x)=>s+x*x,0)),rank:large===0?0:small===0?1:2,droppedDirection:v};
}
export function probabilitySpecimen(logits:number[],target:number){
 if(logits.length<2||logits.length>8)throw new RangeError('Two to eight logits required');logits.forEach(x=>finite(x,'logit'));integer(target,0,logits.length-1,'target');
 const max=Math.max(...logits),shifted=logits.map(x=>Math.exp(x-max)),sum=shifted.reduce((s,x)=>s+x,0),logNormalizer=max+Math.log(sum),probabilities=shifted.map(x=>x/sum);
 const loss=Math.log(sum)+(max-logits[target]);
 return {probabilities,loss,logNormalizer,gradient:probabilities.map((x,i)=>x-(i===target?1:0)),entropy:probabilities.reduce((s,x)=>s-(x?x*Math.log(x):0),0),naiveExponentialSum:logits.reduce((s,x)=>s+Math.exp(x),0)};
}
/** Explicit 1-sign/3-exponent/3-fraction miniature; bias 3, gradual underflow, ties to even. */
export function miniatureFloat(value:number){
 finite(value,'value');const sign=value<0||Object.is(value,-0)?1:0,x=Math.abs(value),bits=(e:number,f:number)=>`${sign} ${e.toString(2).padStart(3,'0')} ${f.toString(2).padStart(3,'0')}`;
 if(x>=15.5)return {value,rounded:sign?-Infinity:Infinity,bits:bits(7,0),classification:'overflow',absoluteError:Infinity,step:null};
 let best={e:0,f:0,y:0,d:x};
 for(let e=0;e<7;e++)for(let f=0;f<8;f++){const y=e===0?f/32:2**(e-3)*(1+f/8),d=Math.abs(x-y);if(d<best.d||(d===best.d&&f%2===0&&best.f%2===1))best={e,f,y,d};}
 const rounded=sign?-best.y:best.y;return {value,rounded,bits:bits(best.e,best.f),classification:best.y===0?'zero':best.e===0?'subnormal':'normal',absoluteError:Math.abs(value-rounded),step:best.e===0?1/32:2**(best.e-6)};
}
export function binomialSampling(n:number,p:number){
 integer(n,1,60,'independent trials');finite(p,'probability');if(p<0||p>1)throw new RangeError('Probability from zero to one required');
 const rows=Array.from({length:n+1},(_,k)=>{let choose=1;for(let i=1;i<=k;i++)choose=choose*(n-i+1)/i;return {successes:k,rate:k/n,probability:choose*p**k*(1-p)**(n-k)};});
 return {rows,expected:p,variance:p*(1-p)/n,standardDeviation:Math.sqrt(p*(1-p)/n),mass:rows.reduce((s,x)=>s+x.probability,0)};
}
export function confoundingExperiment(effect:number,confounded:boolean){
 finite(effect,'effect');if(Math.abs(effect)>20)throw new RangeError('Effect bounded to 20 outcome units');
 // Synthetic outcomes have an identified treatment term and a baseline stratum term.
 const rows=Array.from({length:8},(_,i)=>{const stratum=i<4?'low':'high',treated=confounded?i>=3:i%2===0;return {id:i,stratum,treated,outcome:(stratum==='high'?12:2)+(treated?effect:0)};});
 const mean=(rs:typeof rows)=>rs.reduce((s,x)=>s+x.outcome,0)/rs.length;
 const crude=mean(rows.filter(x=>x.treated))-mean(rows.filter(x=>!x.treated));
 const within=['low','high'].map(stratum=>{const rs=rows.filter(x=>x.stratum===stratum),a=rs.filter(x=>x.treated),b=rs.filter(x=>!x.treated);return {stratum,difference:a.length&&b.length?mean(a)-mean(b):null};});
 return {rows,crude,within,trueAuthoredEffect:effect,identified:within.every(x=>x.difference!==null)};
}
export function annotationDisagreement(adjudicate:boolean){
 const rows=[['a','safe','safe'],['b','review','safe'],['c','unsafe','unsafe'],['d','review','unsafe'],['e','safe','safe'],['f','unsafe','review']].map(([id,first,second])=>({id,first,second,agrees:first===second,selected:first===second?first:adjudicate?'review':'unresolved'}));
 return {rows,agreements:rows.filter(x=>x.agrees).length,total:rows.length,agreement:rows.filter(x=>x.agrees).length/rows.length,retained:rows.filter(x=>x.selected!=='unresolved').length};
}
export type PredictionRow={x:number;y:number};
export const treeTraining:PredictionRow[]=[{x:-3,y:-2},{x:-2,y:-2},{x:-1,y:-2},{x:0,y:2},{x:1,y:2},{x:2,y:2}];
export function fitStumps(rounds:number,learningRate:number){
 integer(rounds,0,12,'rounds');finite(learningRate,'learning rate');if(learningRate<=0||learningRate>1)throw new RangeError('Learning rate in (0,1] required');
 const base=treeTraining.reduce((s,r)=>s+r.y,0)/treeTraining.length,pred=treeTraining.map(()=>base),stumps:{threshold:number;left:number;right:number;loss:number}[]=[];
 for(let t=0;t<rounds;t++){let best:{threshold:number;left:number;right:number;error:number}|undefined;
  for(let i=0;i<treeTraining.length-1;i++){const threshold=(treeTraining[i].x+treeTraining[i+1].x)/2,li=treeTraining.map((r,j)=>r.x<=threshold?j:-1).filter(j=>j>=0),ri=treeTraining.map((r,j)=>r.x>threshold?j:-1).filter(j=>j>=0),avg=(ids:number[])=>ids.reduce((s,j)=>s+treeTraining[j].y-pred[j],0)/ids.length,left=avg(li),right=avg(ri),error=treeTraining.reduce((s,r,j)=>s+(r.y-pred[j]-(r.x<=threshold?left:right))**2,0);if(!best||error<best.error)best={threshold,left,right,error};}
  const s=best!;treeTraining.forEach((r,i)=>pred[i]+=learningRate*(r.x<=s.threshold?s.left:s.right));stumps.push({threshold:s.threshold,left:s.left*learningRate,right:s.right*learningRate,loss:treeTraining.reduce((v,r,i)=>v+(r.y-pred[i])**2,0)/treeTraining.length});
 }
 const predict=(x:number)=>base+stumps.reduce((s,t)=>s+(x<=t.threshold?t.left:t.right),0);
 const test=[{x:-2.5,y:-2},{x:-.75,y:-2},{x:.5,y:2},{x:1.5,y:2}],shifted=test.map(r=>({...r,y:-r.y}));
 const score=(rs:PredictionRow[])=>rs.reduce((s,r)=>s+(r.y-predict(r.x))**2,0)/rs.length;
 return {base,stumps,training:treeTraining.map((r,i)=>({...r,prediction:pred[i]})),test:test.map(r=>({...r,prediction:predict(r.x)})),testMse:score(test),shiftedMse:score(shifted)};
}
export function graphMessagePassing(removeEdge:boolean,steps:number,permutation=[0,1,2,3]){
 integer(steps,0,4,'steps');if(permutation.length!==4||new Set(permutation).size!==4||permutation.some(x=>!Number.isInteger(x)||x<0||x>3))throw new RangeError('Four-node permutation required');
 const originalEdges=[[0,1],[1,2],[2,3],...(removeEdge?[]:[[0,3]])],position=new Map(permutation.map((id,i)=>[id,i])),edges=originalEdges.map(([a,b])=>[position.get(a)!,position.get(b)!]);
 const matrix=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>i===j||edges.some(([a,b])=>a===i&&b===j||a===j&&b===i)?1:0)),degree=matrix.map(r=>r.reduce<number>((s,x)=>s+x,0));
 const normalized=matrix.map((r,i)=>r.map((x,j)=>x/Math.sqrt(degree[i]*degree[j]))),features=permutation.map(i=>[[1,0],[0,1],[2,0],[0,2]][i]);
 const states=[features];for(let t=0;t<steps;t++)states.push(multiplyMatrices(normalized,states.at(-1)!).result.map(r=>r.map(x=>Math.max(0,x))));
 return {nodeIds:permutation,edges,normalized,states,final:states.at(-1)!};
}
export type Board=number[];
const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function searchGame(board:Board,depth:number){
 integer(depth,1,9,'depth');if(board.length!==9||board.some(x=>![0,1,-1].includes(x)))throw new RangeError('Nine cells in {−1,0,1} required');
 const countX=board.filter(x=>x===1).length,countO=board.filter(x=>x===-1).length;if(countX!==countO&&countX!==countO+1)throw new RangeError('Unreachable turn counts');
 const winner=(b:Board)=>{for(const l of lines){const s=l.reduce((v,i)=>v+b[i],0);if(Math.abs(s)===3)return Math.sign(s);}return 0;};
 if(winner(board))throw new RangeError('Choose a position before the game has ended');
 const player=countX===countO?1:-1;let visited=0;
 function solve(b:Board,d:number,p:number):number{visited++;const w=winner(b);if(w)return w*100;if(!b.includes(0))return 0;if(d===0)return lines.reduce((s,l)=>{const xs=l.map(i=>b[i]);return s+(xs.includes(-1)?0:xs.filter(x=>x===1).length)-(xs.includes(1)?0:xs.filter(x=>x===-1).length);},0);const values=b.flatMap((x,i)=>x?[]:[solve(b.map((v,j)=>i===j?p:v),d-1,-p)]);return p===1?Math.max(...values):Math.min(...values);}
 const choices=board.flatMap((x,i)=>x?[]:[{cell:i,value:solve(board.map((v,j)=>i===j?player:v),depth-1,-player)}]);
 const best=choices.reduce((a,b)=>!a||(player===1?b.value>a.value:b.value<a.value)?b:a,undefined as typeof choices[number]|undefined);
 return {player,choices,best:best?.cell??null,visited,depth,heuristic:'Open-line count at truncated leaves; terminal ±100, draw 0. This is an authored heuristic, not a learned value.'};
}

export const foundationModes=[['tensor-index-contracts','Tensor indices'],['linear-map-rank-subspace','Rank and information'],['probability-conditioning-information','Probability and loss'],['floating-number-range-resolution','Floating-point numbers'],['sampling-estimation-uncertainty','Sampling uncertainty'],['ablation-reproduction-design','Controlled comparisons'],['dataset-human-judgment-lineage','Annotation lineage'],['tree-ensemble-baseline','Learn a tree ensemble'],['graph-message-passing','Graph computation'],['search-value-policy-boundary','Search and value']] as const;
export type FoundationMode=typeof foundationModes[number][0];
export const foundationDefaults={mode:'tensor-index-contracts' as FoundationMode,scalar:2,step:0,angle:30,small:1,logit:1,offset:0,float:1.1875,trials:12,probability:.5,effect:3,confounded:false,adjudicate:false,rounds:3,rate:.5,removeEdge:false,graphSteps:1,depth:2};
export type FoundationInput=typeof foundationDefaults;
export function normalizeFoundationInput(value:unknown):FoundationInput{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Expected foundation settings');const s=value as FoundationInput;
 if(Object.keys(s).sort().join()!==Object.keys(foundationDefaults).sort().join()||!foundationModes.some(([id])=>id===s.mode))throw Error('Unknown or missing foundation setting');
 const ranges:{[K in keyof FoundationInput]?:[number,number]}={scalar:[-5,5],step:[0,7],angle:[0,90],small:[0,3],logit:[-4,4],offset:[0,1000],float:[-17,17],trials:[1,40],probability:[0,1],effect:[-5,5],rounds:[0,8],rate:[.1,1],graphSteps:[0,4],depth:[1,5]};
 for(const [key,[min,max]] of Object.entries(ranges)){const v=s[key as keyof FoundationInput];if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error('Invalid foundation '+key);}
 for(const k of ['step','trials','rounds','graphSteps','depth'] as const)if(!Number.isInteger(s[k]))throw Error('Invalid foundation index or count');
 for(const k of ['confounded','adjudicate','removeEdge'] as const)if(typeof s[k]!=='boolean')throw Error('Invalid foundation toggle');return {...s};
}
export function encodeFoundationRecord(input:FoundationInput,content:string){if(typeof content!=='string'||content.length>100)throw Error('Invalid source identity');return JSON.stringify({schema:1,model:foundationModelVersion,content,inputs:normalizeFoundationInput(input)},null,2);}
export function readFoundationRecord(raw:string){if(new TextEncoder().encode(raw).length>20000)throw Error('Record exceeds 20,000 bytes');const r=JSON.parse(raw);if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).sort().join()!=='content,inputs,model,schema'||r.schema!==1||r.model!==foundationModelVersion||typeof r.content!=='string'||r.content.length>100)throw Error('Incompatible foundation record');return{inputs:normalizeFoundationInput(r.inputs),content:r.content};}
