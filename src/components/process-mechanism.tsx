import { lazy, Suspense, useId, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Equation } from './equation';
import { ProcessControls } from './atlas-exploration';
import { routeFor } from '../lib/processes';
import { mechanismFor, mechanismSources, processDrawing } from '../lib/process-mechanisms';
import ResourceBoundary from './resource-boundary';
import './process-mechanism.css';
const ProcessSpatial = lazy(() => import('./process-spatial'));
export default function ProcessMechanism({recordId,scene,index,onStep,onSelect}:{recordId:string;scene:string;index:number;onStep:(n:number)=>void;onSelect:(id:string)=>void}) {
  const route=mechanismFor(recordId), [spatial,setSpatial]=useState(false), [variant,setVariant]=useState('cvd'), [parameter,setParameter]=useState(10), [selected,setSelected]=useState('');
  const uid=useId(), drawing=useMemo(()=>route?processDrawing(route.id,index,variant,parameter):null,[route,index,variant,parameter]);
  if(!route||!drawing){const fallback=routeFor(scene,recordId);return <div className="process-mechanism process-sequence"><p className="eyebrow">PROCESS RELATIONSHIPS</p><p>{fallback.name}</p><ol>{fallback.steps.map((s,i)=><li key={s.title}><button aria-current={i===index?'step':undefined} onClick={()=>onStep(i)}><span>{i+1}</span>{s.title}</button></li>)}</ol><p>This sequence describes inputs, transformations and evidence gates. It does not simulate changing device geometry.</p><ProcessControls scene={scene} recordId={recordId} index={index} onStep={onStep} onSelect={onSelect}/></div>;}
  const step=route.steps[index], labels=[...new Map(drawing.shapes.filter(s=>s.label).map(s=>[s.label!,s.color])).entries()];
  return <section className="process-mechanism" aria-label={route.name}>
    <div className="mechanism-heading"><div><p className="eyebrow">MECHANISM · {index+1}/6</p><h2>{route.name}</h2></div><Button variant="outline" aria-pressed={spatial} onClick={()=>setSpatial(!spatial)}>{spatial?'Cross-section':'Inspect in 3D'}</Button></div>
    <ol className="mechanism-steps">{route.steps.map((s,i)=><li key={s.id}><button aria-current={i===index?'step':undefined} onClick={()=>{onStep(i);setSelected('');}}><span>{i+1}</span>{s.title}</button></li>)}</ol>
    {(route.id==='cvd-pvd'||route.id==='lithography-optics'||route.id==='etch-transfer')&&<div className="mechanism-parameters">{route.id==='cvd-pvd'?<label>Coverage case<select value={variant} onChange={e=>setVariant(e.target.value)}><option value="cvd">CVD example</option><option value="pvd">Directional PVD example</option></select></label>:<label>{route.id==='etch-transfer'?'Target / mask selectivity':'Relative numerical aperture'}<input type="range" min={route.id==='etch-transfer'?2:5} max={20} step={1} value={parameter} onChange={e=>setParameter(Number(e.target.value))}/><output>{route.id==='etch-transfer'?parameter:(parameter/10).toFixed(1)}</output></label>}</div>}
    {spatial?<ResourceBoundary name="process 3D"><Suspense fallback={<p>Loading spatial cross-section…</p>}><ProcessSpatial drawing={drawing} selected={selected}/></Suspense></ResourceBoundary>:<svg className="mechanism-svg" viewBox="0 0 600 360" role="img" aria-labelledby={`${uid}-title ${uid}-desc`}><title id={`${uid}-title`}>{route.name}: {step.title}</title><desc id={`${uid}-desc`}>{drawing.caption} {drawing.measurements.map(m=>`${m.label}: ${m.value}`).join('. ')}</desc>{drawing.shapes.map((s,i)=>{const common={fill:s.color,opacity:selected&&s.label!==selected? .38:1};return s.kind==='rect'?<rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} {...common}/>:s.kind==='circle'?<circle key={i} cx={s.x} cy={s.y} r={s.w/2} {...common}/>:<line key={i} x1={s.x} y1={s.y} x2={s.x+s.w} y2={s.y+s.h} stroke={s.color} strokeWidth={2} strokeDasharray="5 4"/>;})}</svg>}
    <div className="mechanism-legend" aria-label="Identify a material or feature">{labels.map(([label,color])=><button key={label} aria-pressed={selected===label} onClick={()=>setSelected(selected===label?'':label)}><i style={{background:color}}/>{label}</button>)}</div>
    <p className="mechanism-caption">{drawing.caption}</p><p className="mechanism-scale">{drawing.scale}{spatial?' Depth is an extrusion for inspection; it adds no measured dimension. Drag to orbit.':''}</p>
    <dl className="mechanism-measures">{drawing.measurements.map(m=><div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}</dl>
    {drawing.formula&&<Equation latex={drawing.formula} text={drawing.measurements.map(m=>`${m.label}: ${m.value}`).join('; ')} note="The stated quantities and model scope govern this relationship."/>}
    <section className="mechanism-state" aria-live="polite"><h3>{step.title}</h3><p>{step.transform}</p><dl><div><dt>Input</dt><dd>{step.input}</dd></div><div><dt>Output</dt><dd>{step.output}</dd></div><div><dt>Measurement question</dt><dd>{step.measurement.question}</dd></div></dl><p>{step.measurement.scopeLimit}</p></section>
    <details className="mechanism-evidence"><summary>Representation &amp; source evidence</summary><p>{route.scientificScope}</p>{mechanismSources.filter(s=>route.sourceRefs.includes(s.id)).map(s=><article key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a><p>{s.support}</p><small>{s.scopeLimit}</small></article>)}</details>
  </section>;
}
