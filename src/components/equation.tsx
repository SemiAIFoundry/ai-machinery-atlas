import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
export type MathVariable = { symbol: string; meaning: string; unit: string };
export type MathDefinition = { kind?: 'math' | 'relationship'; latex?: string; text?: string; variables?: MathVariable[]; note?: string };
/** Scientific mathematics is authored explicitly. Prose never enters a heuristic parser. */
export function Equation({ latex, text, variables = [], kind = 'math', note }: MathDefinition & { text: string }) {
  const rendered = useMemo(() => {
    if (kind === 'relationship' || !latex) return null;
    try { return katex.renderToString(latex, { displayMode: true, output: 'htmlAndMathml', throwOnError: true, strict: 'error', trust: false, maxExpand: 300, maxSize: 15 }); } catch { return null; }
  }, [latex, kind]);
  return <figure className="equation-block" data-equation-kind={kind} data-math-status={kind === 'relationship' ? 'relationship' : rendered ? 'authored' : 'text'}>
    {rendered ? <div className="formal-equation" role="region" aria-label="Mathematical equation, scroll horizontally if needed" tabIndex={0} dangerouslySetInnerHTML={{ __html: rendered }} /> : <div className="equation equation-prose">{text}</div>}
    {note && <figcaption>{note}</figcaption>}
    {variables.length > 0 && <details className="equation-notation"><summary>Symbols &amp; units</summary><dl>{variables.map(v => <div key={v.symbol}><dt>{v.symbol}</dt><dd>{v.meaning} · <strong>{v.unit}</strong></dd></div>)}</dl></details>}
    {rendered && <details className="equation-text"><summary>Read equation as text</summary><p>{text}</p></details>}
  </figure>;
}
