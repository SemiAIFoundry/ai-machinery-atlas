import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {deflateRawSync} from 'node:zlib';

// Deterministic ZIP records use a fixed DOS timestamp and preserve relative paths.
const root=process.cwd(),walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);
const crc32=bytes=>{let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;};
function zip(entries){
 const parts=[],directory=[];let offset=0;
 for(const [path,bytes] of entries.sort(([a],[b])=>a.localeCompare(b))){
  const name=Buffer.from(path),body=deflateRawSync(bytes,{level:9}),crc=crc32(bytes),local=Buffer.alloc(30),central=Buffer.alloc(46);
  local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt16LE(33,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(body.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(name.length,26);
  central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt16LE(8,10);central.writeUInt16LE(33,14);central.writeUInt32LE(crc,16);central.writeUInt32LE(body.length,20);central.writeUInt32LE(bytes.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(offset,42);
  parts.push(local,name,body);directory.push(central,name);offset+=local.length+name.length+body.length;
 }
 const index=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(index.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...parts,index,end]);
}
const notices=['LICENSE','NOTICE','COMMERCIAL_LICENSE.md','THIRD_PARTY_NOTICES.md',...walk('licenses')];
function pack(output,files,guide){
 const entries=[...new Set([...notices,...files])].filter(p=>!p.endsWith('-sim')).map(p=>[relative(root,join(root,p)),readFileSync(p)]);
 entries.push(['START-HERE.md',Buffer.from(guide)]);
 const manifest=entries.map(([path,b])=>({path,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}));
 entries.push(['FILES-SHA256.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n')]);
 const bytes=zip(entries);writeFileSync(join('public',output),bytes);console.log(`${output}: ${entries.length} files, ${bytes.length} bytes`);
}
pack('instructor-kit.zip',walk('docs/instructor-kit'), '# Atlas instructor pack\n\nStart with docs/instructor-kit/README.md and SESSION-PLANS.md. Worksheets and answer keys are usable on paper. Reproducing all contracts requires a matching full atlas source checkout; set ATLAS_REPO_ROOT as described in the guide. The pack contains no participant observations. Current license and third-party notices are included.\n');
pack('realization-artifact.zip',[...walk('examples/realization'),'public/realization-data/adder.json'], '# Computation-to-FPGA artifact\n\nStart with examples/realization/README.md. Run the declared public toolchain from examples/realization to reproduce the flow. Retain this directory structure for the generated browser summary. Logs, RTL, mapped/routed resources and hashes can be inspected without installing tools. The bitstream is an unqualified tool artifact with automatically assigned IO, not a board programming recipe. Current license and third-party notices are included.\n');
