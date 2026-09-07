export type Wire=number|string;
export type MappedCircuit={ports:Record<string,{direction:string;bits:Wire[]}>;cells:{name:string;type:string;parameters:Record<string,string>;connections:Record<string,Wire[]>}[]};
/** Execute the actual exported LUT4/register graph. Display fill starts at zero; no hardware reset is inferred. */
export function evaluateMappedAdder(circuit:MappedCircuit,a:number,b:number){
 if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>15||b>15)throw Error('Inputs must be unsigned four-bit integers.');
 const values=new Map<Wire,number>([['0',0],['1',1]]),flipflops=circuit.cells.filter(c=>c.type==='SB_DFF'),luts=circuit.cells.filter(c=>c.type==='SB_LUT4');
 if(luts.length+flipflops.length!==circuit.cells.length)throw Error('Unsupported mapped primitive.');
 for(const [name,value] of [['a',a],['b',b]] as const)circuit.ports[name].bits.forEach((wire,i)=>values.set(wire,(value>>i)&1));
 flipflops.forEach(c=>values.set(c.connections.Q[0],0));
 const bit=(w:Wire)=>{const n=values.get(w);if(n===undefined)throw Error(`Unresolved mapped wire ${w}`);return n;};
 function settle(){
  let pending=[...luts];
  while(pending.length){let progress=false;pending=pending.filter(c=>{const wires=[0,1,2,3].map(i=>c.connections[`I${i}`][0]);if(wires.some(w=>!values.has(w)))return true;const address=wires.reduce<number>((sum,w,i)=>sum+(bit(w)<<i),0),table=parseInt(c.parameters.LUT_INIT,2);values.set(c.connections.O[0],(table>>address)&1);progress=true;return false;});if(!progress)throw Error('Combinational graph is cyclic or incomplete.');}
 }
 const frames=[];
 for(let edge=0;edge<3;edge++){
  // Remove old combinational outputs so only a topological, current-input evaluation can settle.
  luts.forEach(c=>values.delete(c.connections.O[0]));settle();
  frames.push({edge,output:circuit.ports.q.bits.reduce<number>((sum,w,i)=>sum+(bit(w)<<i),0),cells:circuit.cells.map(c=>({name:c.name,type:c.type,ports:Object.fromEntries(Object.entries(c.connections).filter(([k])=>k!=='C').map(([key,w])=>[key,w.map(bit)])),lutAddress:c.type==='SB_LUT4'?[0,1,2,3].reduce((sum,i)=>sum+(bit(c.connections[`I${i}`][0])<<i),0):null}))});
  const updates=flipflops.map(c=>[c.connections.Q[0],bit(c.connections.D[0])] as const);updates.forEach(([w,n])=>values.set(w,n));
 }
 return{a,b,frames,output:frames[2].output};
}
