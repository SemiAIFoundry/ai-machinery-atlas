import {useState} from 'react';
import {ChevronDown, GraduationCap} from 'lucide-react';
import {bands, chapters, records, byId} from '@/lib/atlas';

type Props={chapterId:string;openBands:number[];onToggle:(n:number)=>void;onChapter:(id:string)=>void;onSelect:(id:string)=>void;onModal:(name:string)=>void;completed:number;visited:number;searchable?:boolean};
export default function AtlasNavigation(p:Props){
 const [query,setQuery]=useState('');
 const current=chapters.find(c=>c.id===p.chapterId)!;
 const matches=query.trim()?records.filter(r=>`${r.name} ${r.role}`.toLowerCase().includes(query.toLowerCase())):[];
 return <div className="atlas-navigation">
  {p.searchable&&<label className="contents-search">Find within the atlas<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search lessons and components"/></label>}
  {query.trim()?<nav aria-label="Matching lessons" className="contents-matches">{matches.map(r=><button key={r.id} onClick={()=>p.onSelect(r.id)}><strong>{r.name}</strong><small>{r.role}</small></button>)}{!matches.length&&<p>No lessons match. Try memory, cooling or silicon.</p>}</nav>:<nav aria-label="Atlas hierarchy">{bands.map((b,i)=><div key={b.name} className="band-group"><button className={'band-heading '+(current.band===i?'current':'')} onClick={()=>p.onToggle(i)} aria-expanded={p.openBands.includes(i)}><span className="band-mark" style={{background:b.color}}/><span>{b.name}<small>{b.range}</small></span><ChevronDown size={13} className={p.openBands.includes(i)?'expanded':''}/></button>{p.openBands.includes(i)&&<div className="branch-list">{[...new Set(chapters.filter(c=>c.band===i).map(c=>c.parent||'Foundations'))].map(parent=><details className="nested-domain" key={parent} open={parent==='Foundations'||parent===current.parent}><summary>{parent}</summary>{chapters.filter(c=>c.band===i&&(c.parent||'Foundations')===parent).map(c=><div key={c.id}><button className={'branch-link '+(current.id===c.id?'active':'')} onClick={()=>p.onChapter(c.id)}><span>{c.name}</span><small>{c.ids.length}</small></button>{p.searchable&&current.id===c.id&&<div className="contents-lessons">{c.ids.filter(id=>byId[id]).map(id=><button key={id} onClick={()=>p.onSelect(id)}>{byId[id].name}</button>)}</div>}</div>)}</details>)}</div>}</div>)}</nav>}
  <div className="learning-progress"><GraduationCap size={17}/><div><strong>{p.completed} concepts checked</strong><span>{p.visited} / {records.length} explored</span></div></div>
  <button className="atlas-about" onClick={()=>p.onModal('lifecycle')}>Lifecycle &amp; discipline map</button><button className="atlas-about" onClick={()=>p.onModal('glossary')}>Glossary &amp; units</button><button className="atlas-about" onClick={()=>p.onModal('about')}>How to read this atlas</button>
 </div>;
}
