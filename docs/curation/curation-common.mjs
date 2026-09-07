import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
export const defaultRepo=process.cwd();
export const readJSON=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export const unique=a=>[...new Set(a)];
export const count=a=>Object.fromEntries(unique(a).sort().map(k=>[k,a.filter(x=>x===k).length]));
export function loadCurrent(repo=defaultRepo){
 const require=createRequire(path.join(repo,'package.json')),ts=require('typescript'),cache={},files=new Set();
 function module(file){
  if(cache[file])return cache[file];files.add(file);const exports={};cache[file]=exports;
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','exports',code)(name=>{const f=path.resolve(path.dirname(file),name);if(name.endsWith('.json')){files.add(f);return readJSON(f);}if(name.startsWith('.'))return module(f+'.ts');return require(name);},exports);return exports;
 }
 const atlas=module(path.join(repo,'src/lib/atlas-authoring.ts'));
 const equations=Object.assign({},...['original','expansion','infrastructure'].map(n=>{const f=path.join(repo,'src/lib/data/equations-'+n+'.json');files.add(f);return readJSON(f);}));
 const engineeringRelations=readJSON(path.join(repo,'src/lib/data/engineering-relations.json'));
 const claims=atlas.contentPacks.flatMap(p=>p.claims),ledgerSources=atlas.contentPacks.flatMap(p=>p.sources);
 const fingerprint=r=>{const c=atlas.chapterFor(r.id);return sha(stable({record:r,chapter:{id:c.id,domainId:c.domainId,read:c.read},formalEquations:equations[r.id]||[]}));};
 return {atlas,equations,engineeringRelations,claims,ledgerSources,fingerprint,sourceFiles:[...files].sort().map(f=>({path:path.relative(repo,f),sha256:sha(fs.readFileSync(f)),bytes:fs.statSync(f).size}))};
}
export const sourceId=url=>'url-'+sha(url).slice(0,20);
export function lessonReferences(record,claims,ledgerSources){
 const byUrl=new Map();
 function add(source,context){if(!byUrl.has(source.url))byUrl.set(source.url,{sourceId:sourceId(source.url),url:source.url,title:source.title,contexts:[]});byUrl.get(source.url).contexts.push(context);}
 for(const source of record.sources)add(source,{field:'sources'});
 for(const [index,event]of(record.history||[]).entries())if(event.source?.url)add(event.source,{field:'history',index,eventTitle:event.title,eventYear:event.year});
 for(const claim of claims.filter(c=>c.lessonIds.includes(record.id))){const s=ledgerSources.find(s=>s.id===claim.sourceId);if(s)add(s,{field:'claim',claimId:claim.id,ledgerSourceId:s.id});}
 return [...byUrl.values()];
}
