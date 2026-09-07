import { Equation, type MathDefinition } from './equation';
import formalEquations from '../lib/generated/formal-equations';
import type { RecordEntry, Chapter } from '../lib/atlas';
import { Button } from './ui/button';
import { FlaskConical } from 'lucide-react';
const equations=formalEquations as Record<string, MathDefinition[]>;
export default function SciencePanel({ record, chapter, onLab }: { record: RecordEntry; chapter: Chapter; onLab: () => void }) {
  return <>
    <div className="detail-section first"><h3>The engineering question</h3><p>{chapter.question}</p></div>
    {record.science?.map((s, i) => {
      const definition = equations[record.id]?.[i];
      return <div className="science-card" key={i}><h3>{s.title}</h3><Equation {...definition} text={definition?.text || s.equation} /><p>{s.explanation}</p><small><strong>Assumptions · </strong>{s.assumptions}</small></div>;
    })}
    <div className="detail-section"><h3>Engineering tradeoff</h3><p>{record.tradeoff}</p></div>
    <div className="detail-section"><h3>Read the representation</h3><p>{chapter.read}</p><p className="scale-note">{record.scale}</p></div>
    {record.history?.map((h, i) => <div className="history-inline" key={i}><span>{h.year}</span><h3>{h.title}</h3><p>{h.significance}</p><a href={h.source.url} target="_blank" rel="noreferrer">{h.source.title} ↗</a></div>)}
    <Button variant="outline" className="wide-button" onClick={onLab}><FlaskConical /> Explore numerical labs</Button>
  </>;
}
