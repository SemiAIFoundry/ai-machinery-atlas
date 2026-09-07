import fs from 'node:fs';
const files=JSON.parse(fs.readFileSync('src/lib/data/equation-packs.json','utf8'));
if(new Set(files).size!==files.length||files.some(f=>!/^equations-[a-z-]+\.json$/.test(f)))throw Error('Invalid equation pack registry');
const imports=files.map((f,i)=>`import p${i} from '../data/${f}';`).join('\n');
const source=imports+`\nconst result:Record<string,unknown[]>={};\nfor(const pack of [${files.map((_,i)=>'p'+i).join(',')}])for(const [id,entries] of Object.entries(pack))result[id]=[...(result[id]||[]),...entries];\nexport default result;\n`;
fs.mkdirSync('src/lib/generated',{recursive:true});fs.writeFileSync('src/lib/generated/formal-equations.ts',source);
