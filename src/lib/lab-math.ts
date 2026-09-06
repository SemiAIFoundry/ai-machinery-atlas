export function mosfetCurrent(vg:number,vd:number,vt=.4,beta=100){const over=Math.max(0,vg-vt);return vd>=over?.5*beta*over*over:beta*(over*vd-.5*vd*vd);}
export function matmul(a:number[][],b:number[][]){return a.map(row=>b[0].map((_,j)=>row.reduce((sum,v,k)=>sum+v*b[k][j],0)));}
export function attentionWeights(q:number[][],k:number[][],causal=true,temperature=1){return q.map((v,i)=>{const scores=k.map((key,j)=>causal&&j>i?-Infinity:v.reduce((a,x,n)=>a+x*key[n],0)/Math.sqrt(v.length)/temperature);const max=Math.max(...scores);const exp=scores.map(s=>Math.exp(s-max));const sum=exp.reduce((a,b)=>a+b,0);return exp.map(e=>e/sum);});}
export const roofline=(peak:number,bandwidth:number,intensity:number)=>Math.min(peak,bandwidth*intensity);
export const kvBytes=(batch:number,layers:number,tokens:number,heads:number,width:number,bytes:number)=>2*batch*layers*tokens*heads*width*bytes;
export const thermalRise=(power:number,resistance:number)=>power*resistance;
export const scaledLoss=(compute:number,alpha=.15)=>1+2*Math.pow(compute,-alpha);
