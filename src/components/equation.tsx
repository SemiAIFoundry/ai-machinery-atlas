import {useMemo} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
export type MathDefinition={latex:string;variables?:{symbol:string;meaning:string;unit:string}[]};
/** Normalize the legacy equation strings into a single display-math language.
 * New lessons can provide authored LaTeX; older records remain compatible while
 * gaining proper operators, indices and accessible MathML. This is deliberately
 * conservative: uncertain prose stays in the text fallback instead of becoming
 * a fabricated formula.
 */
export function toLatex(source:string){
 let s=source.trim();
const subscriptMap:Record<string,string>={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','ₐ':'a','ₑ':'e','ₕ':'h','ᵢ':'i','ⱼ':'j','ₖ':'k','ₗ':'l','ₘ':'m','ₙ':'n','ₒ':'o','ₚ':'p','ᵣ':'r','ₛ':'s','ₜ':'t','ᵤ':'u','ᵥ':'v','ₓ':'x'};
const superscriptMap:Record<string,string>={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-','ᵀ':'T'};
 s=[...s].map(ch=>subscriptMap[ch]?`_{${subscriptMap[ch]}}`:superscriptMap[ch]?`^{${superscriptMap[ch]}}`:ch).join('');
 const symbols:[RegExp,string][]=[
  [/√/g,'\\sqrt{}'],[/≈/g,'\\approx '],[/≤/g,'\\leq '],[/≥/g,'\\geq '],[/∝/g,'\\propto '],
  [/×/g,'\\times '],[/·/g,'\\cdot '],[/±/g,'\\pm '],[/∞/g,'\\infty '],[/∈/g,'\\in '],
  [/Σ/g,'\\sum '],[/∑/g,'\\sum '],[/∏/g,'\\prod '],[/∇/g,'\\nabla '],[/∂/g,'\\partial '],
  [/⊙/g,'\\odot '],[/⊗/g,'\\otimes '],[/⊕/g,'\\oplus '],[/¬/g,'\\lnot '],[/∧/g,'\\land '],[/∨/g,'\\lor '],
  [/ℝ/g,'\\mathbb{R}'],[/μ/g,'\\mu '],[/σ/g,'\\sigma '],[/τ/g,'\\tau '],[/η/g,'\\eta '],
  [/ε/g,'\\epsilon '],[/ρ/g,'\\rho '],[/λ/g,'\\lambda '],[/π/g,'\\pi '],[/θ/g,'\\theta '],
  [/Δ/g,'\\Delta '],[/Γ/g,'\\Gamma '],[/Λ/g,'\\Lambda '],[/Ω/g,'\\Omega ']
 ];
 // Handle the common compact radical form before the general symbol pass.
 s=s.replace(/√\s*\(?([A-Za-z0-9]+(?:_\{[^}]+\}|_[A-Za-z0-9]+)?)\)?/g,'\\sqrt{$1}');
 for(const [pattern,replacement] of symbols)s=s.replace(pattern,replacement);
 s=s.replace(/\bexp\s*\[/g,'\\exp\\left[').replace(/\]/g,'\\right]');
 // Indices and exponents in the source data use a compact ASCII convention.
 s=s.replace(/([A-Za-z\\}])_([A-Za-z0-9]+)/g,'$1_{$2}');
 s=s.replace(/([A-Za-z0-9\\}])\^([A-Za-z0-9+-]+)/g,'$1^{$2}');
 return s;
}
export function Equation({latex,text,variables=[]}:{latex?:string;text:string;variables?:MathDefinition['variables']}){
 const source=latex||toLatex(text);
 const rendered=useMemo(()=>{if(!source)return null;try{return katex.renderToString(source,{displayMode:true,output:'htmlAndMathml',throwOnError:true,strict:'error',trust:false,maxExpand:300,maxSize:15});}catch{return null;}},[source]);
 return <figure className="equation-block">{rendered?<div className="formal-equation" dangerouslySetInnerHTML={{__html:rendered}}/>:<div className="equation">{text}</div>}{variables.length>0&&<details className="equation-notation"><summary>Symbols &amp; units</summary><dl>{variables.map(v=><div key={v.symbol}><dt>{v.symbol}</dt><dd>{v.meaning}{v.unit&&<> · <strong>{v.unit}</strong></>}</dd></div>)}</dl></details>}<details className="equation-text"><summary>Read equation as text</summary><p>{text}</p></details></figure>;
}
