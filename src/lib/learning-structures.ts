import * as T from 'three';
import type {NodeGroup,Flow} from './scene-models';
import {binomialSampling,miniatureFloat} from './foundation-models.ts';
export const learningStructureFamilies=['learning-cell','learning-math','learning-data','learning-methods','learning-decoder','learning-adaptation','learning-evaluation','learning-multimodal','learning-control','learning-applications'];
/** Spatial orientation only. Computational values and interventions live in named executable experiences. */
export function buildLearningStructure(family:string,selected:string){
 const root=new T.Group(),main=new T.Group() as NodeGroup;main.userData={id:selected,base:new T.Vector3(),spread:new T.Vector3(),label:new T.Vector3(0,2.8,0)};root.add(main);
 const boxGeo=new T.BoxGeometry(1,1,1),sphereGeo=new T.SphereGeometry(1,12,8),colors={input:0x8baee5,state:0x9fdfc8,output:0xeabd8b,control:0xb2a0df,blocked:0xb97581};
 const material=(c:number)=>new T.MeshStandardMaterial({color:c,metalness:.18,roughness:.5,transparent:true});
 function box(x:number,y:number,z:number,w:number,h:number,d:number,c:number,label:string){const m=new T.Mesh(boxGeo,material(c));m.position.set(x,y,z);m.scale.set(w,h,d);m.userData={id:selected,role:label};main.add(m);return m;}
 function dot(x:number,y:number,z:number,c:number,label:string,r=.16){const m=new T.Mesh(sphereGeo,material(c));m.position.set(x,y,z);m.scale.setScalar(r);m.userData={id:selected,role:label};main.add(m);return m;}
 function link(points:number[][],c:number,label:string){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,20,.025,5,false),material(c));m.userData={id:selected,role:label};main.add(m);}
 function grid(rows:number,cols:number,x:number,y:number,z:number,c:number,label:string,mask=false){for(let i=0;i<rows;i++)for(let j=0;j<cols;j++)if(!mask||j<=i)box(x+j*.35,y,z+i*.35,.28,.08,.28,c,`${label}[${i},${j}]`);}
 const graph=(depth=3)=>{for(let l=0;l<depth;l++){const count=2**l;for(let i=0;i<count;i++){const x=(i-(count-1)/2)*4/count,y=1.8-l*1.4;dot(x,y,0,l===depth-1?colors.output:colors.state,`Search depth ${l}`,l===0?.23:.16);if(l){const parent=(Math.floor(i/2)-(count/2-1)/2)*4/(count/2);link([[parent,y+1.4,0],[x,y,0]],colors.input,'Parent to candidate');}}}};
 if(family==='learning-cell'){
  for(const y of [-.8,.8]){box(-.8,y,0,2,.25,1,colors.input,'Channel/body cross-section');box(-.8,y+.22,0,.75,.05,1,colors.control,'Enlarged oxide dielectric');box(-.8,y+.45,0,.7,.32,1,colors.state,'Gate electrode');for(const x of [-1.7,.1])box(x,y+.1,0,.35,.2,1,colors.output,'Source/drain terminal');}
  link([[-.8,-.35,0],[-2.4,-.35,0],[-2.4,1.25,0],[-.8,1.25,0]],colors.control,'Common input');link([[.1,-.7,0],[.8,-.7,0],[.8,.9,0],[.1,.9,0]],colors.output,'Shared output');link([[.8,0,0],[2.2,0,0]],colors.output,'Load connection');for(const y of [-.12,.12])box(2.2,y,0,.9,.04,1,colors.state,'Capacitive load plate');link([[-1.7,.9,0],[-1.7,1.9,0],[.8,1.9,0]],colors.input,'Supply');link([[-1.7,-.7,0],[-1.7,-1.8,0],[2.2,-1.8,0],[2.2,-.15,0]],colors.input,'Reference');
 }else if(family==='learning-math'){
  if(selected.includes('floating')){const bits=miniatureFloat(1.1875).bits;for(let i=0;i<bits.length;i++)box((i-3)*.75,0,0,.6,bits[i]==='1'?1.4:.3,.7,i===0?colors.output:i<4?colors.control:colors.state,`Bit ${i}: ${bits[i]}`);}
  else if(selected.includes('sampling')){const d=binomialSampling(12,.5);d.rows.forEach((r,i)=>box((i-6)*.4,r.probability*6,0,.3,Math.max(.02,r.probability*12),.45,colors.state,`Binomial count ${i}`));}
  else if(selected.includes('probability')){[.2,.3,.5].forEach((p,i)=>{box((i-1)*1.6,p*2,0,1,p*4,1,colors.state,`Probability ${p}`);link([[(i-1)*1.6,-.5,0],[0,-1.3,0]],colors.input,'Normalized outcome mass');});}
  else if(selected.includes('rank')){box(0,0,0,4,.04,4,colors.input,'Input plane');for(let i=-2;i<=2;i++)link([[i,0,-2],[i,0,2]],colors.input,'Input coordinate');link([[-2,0,0],[0,.6,0],[2,1.2,0]],colors.state,'Retained rank-one direction');for(let i=-2;i<=2;i++)link([[i,0,1.8],[i,.3*i+.6,0]],colors.output,'Projection discards a direction');}
  else{grid(2,3,-3,0,-.3,colors.input,'A');grid(3,2,-.8,.8,-.3,colors.control,'B');grid(2,2,1.7,0,-.3,colors.output,'C');for(let k=0;k<3;k++)link([[-3+k*.35,0,-.3],[-.8,.8,-.3+k*.35],[1.7,0,-.3]],colors.state,'Contract index k');}
 }else if(family==='learning-data'){
  for(let i=0;i<8;i++){box(-2.7,i*.34-1.3,0,.85,.07,1.3,colors.input,`Source family ${i}`);const split=i<4?0:i<6?1:2;const y=(i<4?i-1.5:i%2-.5)*.34;box(1.4,y,split*1.5-1.5,1.1,.07,.9,[colors.state,colors.control,colors.output][split],`Assigned split ${split}`);link([[-2.25,i*.34-1.3,0],[-.3,i*.12-.5,split*.5-.5],[.85,y,split*1.5-1.5]],colors.input,'Source identity retained through transformation');}
 }else if(family==='learning-methods'){
  if(selected==='scalar-state-space-recurrence'){for(let t=0;t<6;t++){const x=(t-2.5)*1.05;box(x,-1,0,.45,.25,.45,colors.input,`Input ${t}`);dot(x,.2,0,colors.state,`Persistent state ${t}`,.22);link([[x,-.8,0],[x,.2,0]],colors.input,'Current input contribution');if(t)link([[x-1.05,.2,0],[x,.2,0]],colors.state,'Retained previous state');box(x,1.4,0,.45,.08,.45,colors.output,`Kernel coefficient ${t}`);link([[x,-1,0],[x,1.4,0],[2.625,1.4,0]],colors.control,'Unrolled age-weighted input path');}}
  else if(selected==='spatial-filter-patch-attention'){grid(5,5,-2.8,-.5,-.7,colors.input,'Input pixel');grid(3,3,-2.45,.15,-.35,colors.control,'Local filter footprint');grid(3,3,-.3,.3,-.35,colors.state,'Valid filter response');grid(1,3,2,1,-.35,colors.output,'Patch aggregation');link([[-2,.1,0],[0,.4,0],[2,1,0]],colors.control,'Local evidence then aggregation');}
  else if(selected==='audio-sampling-spectrum'){for(let i=0;i<24;i++){const x=(i-11.5)*.19,y=Math.sin(i*Math.PI/4);dot(x,y-.3,-1,colors.input,`Signal sample ${i}`,.06);}for(let k=0;k<13;k++){const h=k===3?2:.1;box((k-6)*.36,h/2,1,.22,h,.3,k===3?colors.output:colors.state,`Schematic frequency bin ${k}`);}link([[-2,-1,-1],[0,-1,0],[2,-1,1]],colors.control,'Sample coordinates transform into frequency coordinates');}
  else if(selected.includes('graph')){const nodes=[[0,1.6,0],[-1.7,0,0],[1.7,0,0],[0,-1.6,0]];nodes.forEach((p,i)=>{dot(p[0],p[1],p[2],colors.state,`Node ${i}`, .3);grid(1,3,p[0]-.35,p[1]-.5,.2,colors.input,'Node features');});for(const [i,j] of [[0,1],[0,2],[1,3],[2,3]])link([nodes[i],nodes[j]],colors.output,'Message edge');}
  else{graph(selected.includes('tree')?2:3);if(selected.includes('tree'))for(let i=0;i<3;i++){box((i-1)*1.4,-1,0,1,.2+i*.25,1,colors.output,'Additive fitted stump contribution');}}
 }else if(family==='learning-decoder'||family==='learning-adaptation'){
  grid(4,4,-3,-1,-.5,colors.input,'Token by feature');grid(4,4,-.7,0,-.5,colors.control,'Causal attention',true);grid(4,4,1.6,1,-.5,colors.state,'Updated representation');link([[-2.4,-.8,0],[0,2,0],[2.2,1.2,0]],colors.output,'Residual pathway');
  for(let i=0;i<3;i++){grid(3,3,-.4,-1.1-i*.55,-.3,i===2?colors.output:colors.state,i===2?'Gradient / update':'Trainable projection');}
  if(family==='learning-adaptation'){grid(4,1,3.4,.3,-.5,colors.control,'Low-rank factor A');grid(1,4,3.2,-.5,-.5,colors.output,'Low-rank factor B');link([[2.3,1,0],[3.4,.4,0],[2.3,-1.4,0]],colors.control,'Declared adaptation branch');}
 }else if(family==='learning-control'){
  box(-2,0,0,.8,.8,.8,colors.input,'Observed state');graph(3);box(2.5,-.2,0,.9,.35,1,colors.output,'Applied action / plant');for(const x of [2.2,2.8])dot(x,-.55,0,colors.control,'Simulated wheels',.15);link([[-1.6,0,0],[-.6,1,0],[0,1.8,0]],colors.state,'State to planning');link([[1,-1,0],[2.4,-.2,0],[2.2,-2,0],[-2,-2,0],[-2,-.4,0]],colors.output,'Action, state change, new observation');
 }else if(family==='learning-multimodal'){
  for(let i=0;i<3;i++){grid(4,4,-3,i*.32-.5,-.5,i%2?colors.control:colors.input,'Image / video patch plane');}
  for(let i=0;i<18;i++)box(-.8+i*.13,Math.sin(i*.8)*.4,-1.1,.08,.16,.08,colors.state,'Sampled signal');
  grid(4,3,.4,0,-.5,colors.control,'Projected modality features');grid(4,3,2.1,.6,-.5,colors.output,'Shared representation');link([[-1.9,0,0],[.4,0,0],[2.1,.6,0]],colors.state,'Encoder to projection to representation');
 }else{
  // Evidence and application orientation separates source records, candidate results and a checking boundary.
  for(let i=0;i<5;i++){box(-2.4,i*.3-.6,0,.9,.08,1.3,colors.input,'Identified evidence');link([[-2,i*.3-.6,0],[0,i*.25-.5,0]],colors.state,'Retrieve or transform candidate');box(0,i*.25-.5,0,.6,.12,.8,i===2?colors.blocked:colors.state,'Candidate result');}
  box(1.3,0,0,.1,2,1.8,colors.control,'Independent checking boundary');box(2.5,0,0,.9,.5,1,colors.output,'Accepted or failed task outcome');link([[.4,0,0],[1.3,0,0],[2,0,0]],colors.output,'Evidence checked before conclusion');
 }
 const bounds=new T.Box3().setFromObject(root),center=bounds.getCenter(new T.Vector3());root.position.sub(center);return {root,groups:[main],flows:[] as Flow[],center,boxBounds:bounds,update:undefined as undefined|((step:number|undefined,overlay:string|undefined,time:number)=>void)};
}
