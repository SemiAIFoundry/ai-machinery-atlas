import {useState} from 'react';
const stages=[
 ['01','Intent','function · tensor graph · quality target','Meaning'],
 ['02','Representation','encoding · precision · state','Distinguishability'],
 ['03','Architecture','dataflow · memory · links','Rate / locality'],
 ['04','Chip design','RTL · PDK · layout · masks','Timing / power'],
 ['05','Physical build','wafer · test · package','Yield / interfaces'],
 ['06','System','board · rack · hall · runtime','Capacity / heat'],
 ['07','Evidence','workload · quality · recovery','Useful output']
] as const;
export default function CRGBridge(){
 const [active,setActive]=useState(2);
 const details=[
  'The graph is independent of a particular chip, but the quality target must be explicit before design can preserve it.',
  'Symbols, tensors and state become physical only when an encoding, precision, timing window and error condition are declared.',
  'Execution units, storage levels and links define where the computation waits, reuses data and spends energy.',
  'RTL and layout turn the contract into timing, power, signal-integrity, design-for-test and manufacturability obligations.',
  'Wafer probe, known-good die, bonding and package test expose yield and interface limits that simulation cannot settle.',
  'Power, cooling, fabric, storage and runtime readiness decide whether tested components can deliver sustained work.',
  'Evaluation, recovery and quality measurements close the loop; useful output is scoped evidence, not a nominal hardware count.'
 ];
 return <section className="crg-bridge" aria-labelledby="crg-bridge-title"><div className="crg-bridge-heading"><span className="eyebrow">CRG · COMPUTATION → REALIZATION</span><h3 id="crg-bridge-title">The same computation, carried across seven boundaries</h3><p>Each handoff preserves an invariant and adds a physical obligation. Select a boundary to see what must be communicated and measured.</p></div><div className="crg-flow" role="list">{stages.map(([number,title,fields,gate],i)=><div className={'crg-stage '+(active===i?'active':'')} key={title} role="listitem"><button onClick={()=>setActive(i)} aria-pressed={active===i}><span>{number}</span><strong>{title}</strong><small>{fields}</small></button>{i<stages.length-1&&<b aria-hidden="true">→</b>}</div>)}</div><div className="crg-detail" aria-live="polite"><span className="eyebrow">BOUNDARY {stages[active][0]} · {stages[active][3]}</span><p>{details[active]}</p></div><p className="crg-source-note">Framework source: <a href="https://semiaifoundry.com/updates/communication-theory-of-computation-realization/" target="_blank" rel="noreferrer">Semi AI Foundry · Communication Theory of Computation Realization ↗</a>. The graph is an educational representation and does not disclose a proprietary chip.</p></section>;
}
