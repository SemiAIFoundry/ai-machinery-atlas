import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {join,relative} from 'node:path';
export function buildIdentity(root=process.cwd()) {
 const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);
 const digest=files=>{const hash=createHash('sha256');for(const file of files.sort()){hash.update(relative(root,file));hash.update('\0');hash.update(readFileSync(file));hash.update('\0');}return hash.digest('hex');};
 const sourceFiles=[...walk(join(root,'src')),...walk(join(root,'scripts')),...walk(join(root,'public')).filter(p=>!relative(join(root,'public'),p).startsWith('lesson-data/')),...['package.json','package-lock.json','vite.config.ts','index.html','tsconfig.json'].map(p=>join(root,p))];
 let commit=null,dirty=true;try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();dirty=Boolean(execFileSync('git',['status','--porcelain','--untracked-files=normal'],{cwd:root,encoding:'utf8'}).trim());}catch{}
 return {schemaVersion:1,edition:JSON.parse(readFileSync(join(root,'package.json'),'utf8')).version,commit,dirty,sourceSha256:digest(sourceFiles),contentSha256:digest(walk(join(root,'src/lib/data'))),modelVersions:{investigations:'atlas-investigations-1',processes:'process-mechanisms-1',learningPrompts:'investigation-prompts-1'},builtAt:new Date().toISOString()};
}
