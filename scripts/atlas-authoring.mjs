import fs from 'node:fs';
import ts from 'typescript';
/** Load the complete authored corpus for generation and validation, never in a browser bundle. */
export async function loadAuthoredAtlas(){
 let source=fs.readFileSync('src/lib/atlas-authoring.ts','utf8')
 .replace(/import (\w+) from '(\.\/data\/[^']+\.json)';/g,(_,name,path)=>'const '+name+'='+fs.readFileSync('src/lib/'+path,'utf8')+';')
 .replace("import {legacyEnrichments} from './legacy-enrichments';",()=>ts.transpileModule(fs.readFileSync('src/lib/legacy-enrichments.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace('export const legacyEnrichments','const legacyEnrichments'));
 return import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
}
