/** Read-only whole-corpus validation plus independent semantic regressions. */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import {loadCurrent} from '../docs/curation/curation-common.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const repo=process.argv[2]||process.cwd();
const dir=join(repo,'src/lib/data'), katex=createRequire(join(repo,'package.json'))('katex');
const read=name=>JSON.parse(readFileSync(join(dir,name),'utf8'));
const files=read('equation-packs.json');
const expectedProse=['chip-tapeout-productization','cluster-commissioning-gates','topology-job-admission','orbital-evidence-status','crg-problem-statement','crg-55-year-resolution'].sort();
const inputs=loadCurrent(repo).atlas.records.flatMap(lesson=>(lesson.science||[]).map((science,index)=>({pack:'effective authored lesson',id:lesson.id,index,science})));
const catalogs=files.map(name=>({name,data:read(name)}));
const records=new Map(), failures=[], warnings=[], checks=[];let count=0,notationRows=0,implicitKinds=0,fallbackReadings=0;
const settings={displayMode:true,output:'htmlAndMathml',throwOnError:true,strict:'error',trust:false,maxExpand:300,maxSize:15};
function check(name,fn){try{fn();checks.push({name,passed:true});}catch(error){failures.push({name,error:error.message});checks.push({name,passed:false});}}
const offsets={};
for(const {name,data} of catalogs)for(const [id,entries] of Object.entries(data)){const offset=offsets[id]||0;offsets[id]=offset+entries.length;for(const [localIndex,entry] of entries.entries()){
 const key=id+':'+(offset+localIndex);check('unique '+key,()=>assert.ok(!records.has(key)));records.set(key,{...entry,catalog:name});
}}
check('baseline science preserved while validating every effective authored card',()=>assert.ok(inputs.length>=239));
check('catalog/source coverage and card indexing',()=>assert.deepEqual([...records.keys()].sort(),inputs.map(r=>r.id+':'+r.index).sort()));
for(const source of inputs){
 const key=source.id+':'+source.index,e=records.get(key);if(!e)continue;count++;
 const kind=e.kind||'math';if(!e.kind)implicitKinds++;
 check(key+' classification',()=>assert.ok(['math','relationship'].includes(kind)));
 const text=e.text||source.science.equation;if(!e.text)fallbackReadings++;
 check(key+' readable text exists',()=>assert.ok(typeof text==='string'&&text.trim().length>0));
 if(kind==='relationship'){check(key+' prose has no formula',()=>assert.ok(!e.latex));continue;}
 check(key+' explicit math and notation',()=>assert.ok(typeof e.latex==='string'&&e.latex.trim()&&Array.isArray(e.variables)&&e.variables.length));
 const vars=e.variables||[];notationRows+=vars.length;
 check(key+' notation fields and uniqueness',()=>{for(const v of vars)for(const field of ['symbol','meaning','unit'])assert.ok(typeof v[field]==='string'&&v[field].trim(),field);assert.equal(new Set(vars.map(v=>v.symbol)).size,vars.length);});
 check(key+' strict KaTeX and MathML',()=>{const html=katex.renderToString(e.latex,settings);assert.ok(html.includes('<math '));assert.ok(!html.includes('katex-error'));e.tree=katex.__parse(e.latex,settings);});
}
check('original prose relationships remain explicitly classified',()=>{for(const id of expectedProse)assert.equal(records.get(id+':0')?.kind,'relationship');});

// The AST checks inspect grouping, not a snapshot of the entire source formula.
// This diagnostic uses KaTeX's private parse API; the installed version is recorded.
function nodes(value){if(!value||typeof value!=='object')return[];return[...(value.type?[value]:[]),...Object.entries(value).filter(([key])=>!['loc','token'].includes(key)).flatMap(([,v])=>Array.isArray(v)?v.flatMap(nodes):nodes(v))];}
function canon(n){
 if(Array.isArray(n)){const xs=n.map(canon).flat().filter(v=>v!==null&&v!==undefined&&v!=='');return xs.length===1?xs[0]:xs;}
 if(!n)return null;
 if(['ordgroup','styling','font'].includes(n.type))return canon(n.body);
 if(n.type==='kern'||n.type==='spacing')return null;
 if(n.type==='sqrt')return {root:canon(n.body),index:canon(n.index)};
 if(n.type==='genfrac')return {frac:[canon(n.numer),canon(n.denom)]};
 if(n.type==='supsub')return {base:canon(n.base),sub:canon(n.sub),sup:canon(n.sup)};
 if(n.type==='accent')return {accent:n.label,base:canon(n.base)};
 if(n.type==='leftright')return {delimiters:[n.left,n.right],body:canon(n.body)};
 if(n.type==='operatorname')return {operator:canon(n.body)};
 if(n.text!==undefined)return n.text;
 if(n.name!==undefined)return n.name;
 return {type:n.type,body:canon(n.body)};
}
const parse=latex=>katex.__parse(latex,settings), same=(a,b)=>JSON.stringify(canon(a))===JSON.stringify(canon(b));
function subtree(id,index,type,expected){const e=records.get(id+':'+index);assert.ok(e?.tree,id);const wanted=nodes(parse(expected)).find(n=>n.type===type);assert.ok(wanted,'expected '+type);const match=nodes(e.tree).find(n=>n.type===type&&same(n,wanted));assert.ok(match,id+' needs '+expected+' with this grouping');return match;}
const regressions=[
 ['energy-bands',0,'sqrt',String.raw`\sqrt{N_C N_V}`],
 ['energy-bands',0,'genfrac',String.raw`\frac{E_g}{2k_B T}`],
 ['contact',0,'sqrt',String.raw`\sqrt{\frac{\rho_c}{R_{\mathrm{sheet}}}}`],
 ['implantation-anneal-diffusion',0,'sqrt',String.raw`\sqrt{2Dt}`],
 ['attention',0,'genfrac',String.raw`\frac{QK^{\mathsf T}}{\sqrt{d_k}}`],
 ['attention',0,'leftright',String.raw`\left(\frac{QK^{\mathsf T}}{\sqrt{d_k}}+M\right)`],
 ['residual-normalization',0,'sqrt',String.raw`\sqrt{\sigma^2+\varepsilon}`],
 ['loss-optimizer',0,'genfrac',String.raw`\frac{\hat m_t}{\sqrt{\hat v_t}+\varepsilon}`],
 ['loss-optimizer',0,'genfrac',String.raw`\frac{m_t}{1-\beta_1^t}`],
 ['loss-optimizer',0,'genfrac',String.raw`\frac{v_t}{1-\beta_2^t}`],
 ['evaluation',0,'sqrt',String.raw`\sqrt{\frac{\hat p(1-\hat p)}{n}}`],
 ['crystal-lattice',0,'genfrac',String.raw`\frac{\sqrt{3}}{4}`],
 ['pn-junction',0,'genfrac',String.raw`\frac{N_A N_D}{n_i^2}`],
 ['dram-die',0,'genfrac',String.raw`\frac{C_{\mathrm{cell}}}{C_{\mathrm{cell}}+C_{\mathrm{bitline}}}`],
 ['known-good-die-test',0,'genfrac',String.raw`\frac{p(1-c)}{1-pc}`],
 ['temporary-carrier-thinning',0,'genfrac',String.raw`\frac{Et^3}{12(1-\nu^2)}`],
 ['hbm-bonding-process-selection',0,'genfrac',String.raw`\frac{c_{\mathrm{input}}+c_{\mathrm{process}}+c_{\mathrm{test}}}{Y}`],
 ['hbm-stack-height-budget',1,'genfrac',String.raw`\frac{w r\eta}{8}`],
 ['memory-to-hall-propagation',1,'genfrac',String.raw`\frac{P_{\mathrm{IT}}\,\mathrm{PUE}}{R_{\mathrm{accepted}}}`],
 ['memory-to-hall-propagation',0,'genfrac',String.raw`\frac{B_{\mathrm{mem}}}{v_{\mathrm{mem}}}`],
 ['scaling-laws',0,'supsub',String.raw`C^{\beta/(\alpha+\beta)}`],
 ['scaling-laws',0,'supsub',String.raw`C^{\alpha/(\alpha+\beta)}`],
 ['post-training',0,'leftright',String.raw`\left(\pi_\theta(\cdot\mid x)\,\Vert\,\pi_{\mathrm{ref}}(\cdot\mid x)\right)`],
];
for(const [id,index,type,expected] of regressions)check('semantic grouping '+id+' '+expected,()=>subtree(id,index,type,expected));
// Mutation checks confirm that formerly plausible-looking errors are rejected.
const corruptions=[
 ['energy-bands',0,String.raw`n_i=\sqrt{N_C}N_V`,regressions[0]],
 ['contact',0,String.raw`L_T=\frac{\sqrt{\rho_c}}{R_{\mathrm{sheet}}}`,regressions[2]],
 ['implantation-anneal-diffusion',0,String.raw`L=\sqrt{2}Dt`,regressions[3]],
 ['attention',0,String.raw`A=\frac{QK^{\mathsf T}}{\sqrt{d}_k}`,regressions[4]],
 ['attention',0,String.raw`A=\left(\frac{QK^{\mathsf T}+M}{\sqrt{d_k}}\right)`,regressions[5]],
 ['residual-normalization',0,String.raw`d=\sqrt{\sigma^2}+\varepsilon`,regressions[6]],
 ['loss-optimizer',0,String.raw`u=\frac{\hat m_t}{\sqrt{\hat v_t+\varepsilon}}`,regressions[7]],
 ['evaluation',0,String.raw`s=\sqrt{\hat p}\frac{1-\hat p}{n}`,regressions[10]],
 ['dram-die',0,String.raw`a=\frac{C_{\mathrm{cell}}}{C_{\mathrm{cell}}}+C_{\mathrm{bitline}}`,regressions[13]],
 ['hbm-bonding-process-selection',0,String.raw`c=c_{\mathrm{input}}+\frac{c_{\mathrm{process}}+c_{\mathrm{test}}}{Y}`,regressions[16]],
];
for(const [id,index,latex,r] of corruptions)check('reject corrupted grouping '+id+' '+latex,()=>{const e=records.get(id+':'+index),saved=e.tree;try{e.tree=parse(latex);assert.throws(()=>subtree(...r));}finally{e.tree=saved;}});
check('NAND uses logical AND rather than juxtaposed variables',()=>assert.ok(nodes(records.get('nand:0').tree).some(n=>n.text==='\\land')));
check('carry propagation uses explicit XOR and AND',()=>{const xs=nodes(records.get('adder:0').tree);assert.ok(xs.some(n=>n.text==='\\oplus'));assert.ok(xs.some(n=>n.text==='\\land'));assert.ok(xs.some(n=>n.text==='\\lor'));});
check('matrix product retains a true reduction sum',()=>assert.ok(nodes(records.get('mac:0').tree).some(n=>n.type==='op'&&n.name==='\\sum')));
check('capacity formula retains summation across sequences',()=>assert.ok(nodes(records.get('prefill-decode-tier-placement:0').tree).some(n=>n.type==='op'&&n.name==='\\sum')));

// Small arithmetic evaluator for inspected scalar AST subtrees. Symbol bindings are
// explicit per scientific case, not inferred from arbitrary variable strings.
const key=n=>JSON.stringify(canon(n));
function evalNode(n,env){
 if(Array.isArray(n))return evalSequence(n,env);
 if(!n)throw Error('Missing arithmetic node');
 if(env.has(key(n)))return env.get(key(n));
 if(['ordgroup','styling','font'].includes(n.type))return evalNode(n.body,env);
 if(n.type==='genfrac')return evalNode(n.numer,env)/evalNode(n.denom,env);
 if(n.type==='sqrt')return Math.sqrt(evalNode(n.body,env));
 if(n.type==='supsub'&&n.sup&&!n.sub)return evalNode(n.base,env)**evalNode(n.sup,env);
 if(n.type==='textord'&&/^\d+(\.\d+)?$/.test(n.text))return Number(n.text);
 throw Error('Unbound or unsupported arithmetic symbol '+key(n));
}
function evalSequence(nodes,env){
 // Combine literal digit runs; parentheses preserve grouping. Other adjacency is multiplication.
 const items=[];for(let i=0;i<nodes.length;i++){
  const n=nodes[i];if(['kern','spacing'].includes(n.type))continue;
  if(n.type==='textord'&&/^\d$/.test(n.text)){let v=n.text;while(nodes[i+1]?.type==='textord'&&/^\d$/.test(nodes[i+1].text))v+=nodes[++i].text;items.push(Number(v));continue;}
  if(['+','-','/','(',')','\\cdot','\\times'].includes(n.text)){items.push(n.text);continue;}
  items.push(evalNode(n,env));
 }
 let pos=0;
 const atom=()=>{if(items[pos]==='('){pos++;const v=sum();assert.equal(items[pos++],')');return v;}if(items[pos]==='-'){pos++;return-atom();}const v=items[pos++];assert.equal(typeof v,'number');return v;};
 const product=()=>{let v=atom();while(pos<items.length&&!['+', '-', ')'].includes(items[pos])){if(items[pos]==='/'){pos++;v/=atom();}else{if(['\\cdot','\\times'].includes(items[pos]))pos++;v*=atom();}}return v;};
 const sum=()=>{let v=product();while(items[pos]==='+'||items[pos]==='-'){const op=items[pos++];const b=product();v=op==='+'?v+b:v-b;}return v;};
 const result=sum();assert.equal(pos,items.length);return result;
}
const bindings=entries=>new Map(entries.map(([latex,value])=>[key(parse(latex)),value]));
const close=(actual,expected,tolerance=1e-11)=>assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),actual+' differs from '+expected);
const numericCases=[
 {id:'energy-bands',type:'sqrt',fragment:String.raw`\sqrt{N_C N_V}`,values:[['N_C',9e18],['N_V',4e18]],expected:6e18,reason:'Geometric-mean density must remain between the two state densities.'},
 {id:'contact',type:'sqrt',fragment:String.raw`\sqrt{\frac{\rho_c}{R_{\mathrm{sheet}}}}`,values:[[String.raw`\rho_c`,4e-12],[String.raw`R_{\mathrm{sheet}}`,100]],expected:2e-7,reason:'Specific resistivity 4e-12 ohm m² / 100 ohms gives a 200 nm transfer length.'},
 {id:'implantation-anneal-diffusion',type:'sqrt',fragment:String.raw`\sqrt{2Dt}`,values:[['D',2],['t',4]],expected:4,reason:'The one-dimensional Gaussian diffusion variance is 2Dt = 16.'},
 {id:'residual-normalization',type:'sqrt',fragment:String.raw`\sqrt{\sigma^2+\varepsilon}`,values:[[String.raw`\sigma`,3],[String.raw`\varepsilon`,7]],expected:4,reason:'Variance 9 and same-unit stabilizer 7 require sqrt(16), not 3 + 7.'},
 {id:'loss-optimizer',type:'genfrac',fragment:String.raw`\frac{\hat m_t}{\sqrt{\hat v_t}+\varepsilon}`,values:[[String.raw`\hat m_t`,10],[String.raw`\hat v_t`,16],[String.raw`\varepsilon`,1]],expected:2,reason:'Adam places epsilon outside sqrt(v); the normalized update is 10/(4+1).'},
 {id:'evaluation',type:'sqrt',fragment:String.raw`\sqrt{\frac{\hat p(1-\hat p)}{n}}`,values:[[String.raw`\hat p`,.25],['n',12]],expected:.125,reason:'Bernoulli variance .1875 divided by 12 trials has standard deviation .125.'},
 {id:'known-good-die-test',type:'genfrac',fragment:String.raw`\frac{p(1-c)}{1-pc}`,values:[['p',.2],['c',.75]],expected:50/850,reason:'Of 1000 inputs, 200 bad and 75% detection leave 50 bad among 850 passes.'},
 {id:'dram-die',type:'genfrac',fragment:String.raw`\frac{C_{\mathrm{cell}}}{C_{\mathrm{cell}}+C_{\mathrm{bitline}}}`,values:[[String.raw`C_{\mathrm{cell}}`,3],[String.raw`C_{\mathrm{bitline}}`,9]],expected:.25,reason:'Charge conservation weights cell-to-precharge voltage by one quarter, not 3/3+9.'},
 {id:'temporary-carrier-thinning',type:'genfrac',fragment:String.raw`\frac{Et^3}{12(1-\nu^2)}`,values:[['E',12],['t',2],[String.raw`\nu`,0]],expected:8,reason:'At zero Poisson ratio stiffness is E t³/12; doubling thickness multiplies stiffness by eight.'},
 {id:'hbm-bonding-process-selection',type:'genfrac',fragment:String.raw`\frac{c_{\mathrm{input}}+c_{\mathrm{process}}+c_{\mathrm{test}}}{Y}`,values:[[String.raw`c_{\mathrm{input}}`,6],[String.raw`c_{\mathrm{process}}`,3],[String.raw`c_{\mathrm{test}}`,1],['Y',.5]],expected:20,reason:'100 starts cost 1000 currency and yield 50 accepted units, giving 20 per accepted unit.'},
 {id:'hbm-stack-height-budget',index:1,type:'genfrac',fragment:String.raw`\frac{w r\eta}{8}`,values:[['w',1024],['r',8e9],[String.raw`\eta`,.8]],expected:819.2e9,reason:'1024 bits per transfer at 8e9 transfers/s and 80% payload gives 819.2 decimal GB/s.'},
 {id:'memory-to-hall-propagation',index:1,type:'genfrac',fragment:String.raw`\frac{P_{\mathrm{IT}}\,\mathrm{PUE}}{R_{\mathrm{accepted}}}`,values:[[String.raw`P_{\mathrm{IT}}`,1000],[String.raw`\mathrm{PUE}`,1.2],[String.raw`R_{\mathrm{accepted}}`,10]],expected:120,reason:'Ten seconds consumes 12000 facility joules and accepts 100 work units, hence 120 J/work.'},
];
for(const c of numericCases)check('independent arithmetic '+c.id,()=>close(evalNode(subtree(c.id,c.index||0,c.type,c.fragment),bindings(c.values)),c.expected));

// Check compute-optimal exponents against an independent numerical minimization
// of the fixed-compute loss, rather than the atlas's implementation of scaling laws.
function minimizeLogSize(compute){
 const loss=logN=>{const N=Math.exp(logN),D=compute/(6*N);return 3/N**2+5/D;};
 let left=-8,right=20;const phi=(Math.sqrt(5)-1)/2;
 for(let i=0;i<180;i++){const a=right-phi*(right-left),b=left+phi*(right-left);if(loss(a)<loss(b))right=b;else left=a;}
 return Math.exp((left+right)/2);
}
check('scaling allocation exponents match constrained numerical optimum',()=>{
 const C1=6e4,C2=6e7,n1=minimizeLogSize(C1),n2=minimizeLogSize(C2);
 const exponentN=subtree('scaling-laws',0,'supsub',String.raw`C^{\beta/(\alpha+\beta)}`);
 const exponentD=subtree('scaling-laws',0,'supsub',String.raw`C^{\alpha/(\alpha+\beta)}`);
 const env=bindings([['C',C2/C1],[String.raw`\alpha`,2],[String.raw`\beta`,1]]);
 close(n2/n1,evalNode(exponentN,env),1e-6);
 close((C2/n2)/(C1/n1),evalNode(exponentD,env),1e-6);
});

// Independent dimensional bookkeeping for representative scientific relations.
// Dimensions are mass, length, time, current, temperature; counts are dimensionless.
const dim={kg:[1,0,0,0,0],m:[0,1,0,0,0],s:[0,0,1,0,0],A:[0,0,0,1,0],K:[0,0,0,0,1],none:[0,0,0,0,0]};
const times=(...vs)=>vs.reduce((a,b)=>a.map((x,i)=>x+b[i]),[0,0,0,0,0]),power=(a,n)=>a.map(x=>x*n||0),over=(a,b)=>times(a,power(b,-1));
const J=[1,2,-2,0,0],W=[1,2,-3,0,0],V=[1,2,-3,-1,0],F=[-1,-2,4,2,0],ohm=[1,2,-3,-2,0],Pa=[1,-1,-2,0,0];
const dimensional=[
 ['CV² is charging energy',times(F,power(V,2)),J],
 ['RC is time',times(ohm,F),dim.s],
 ['Preston coefficient is inverse pressure',over(over(dim.m,dim.s),times(Pa,over(dim.m,dim.s))),power(Pa,-1)],
 ['specific contact resistivity / sheet resistance has length squared',over(times(ohm,power(dim.m,2)),ohm),power(dim.m,2)],
 ['thermal kB T / q is volts',over(times(over(J,dim.K),dim.K),times(dim.A,dim.s)),V],
 ['Stefan–Boltzmann sigma A T⁴ is power',times(over(W,times(power(dim.m,2),power(dim.K,4))),power(dim.m,2),power(dim.K,4)),W],
 ['plate stiffness E t³ has torque dimensions',times(Pa,power(dim.m,3)),J],
];
for(const [name,actual,expected] of dimensional)check('dimensions '+name,()=>assert.deepEqual(actual,expected));

// Explicit manual symbol-inventory checks, not automatic symbol discovery.
check('HBM capacity card defines N on that card',()=>assert.ok(records.get('hbm-stack-height-budget:1').variables.some(v=>v.symbol==='N'),'Add N: number of memory dies; count. The preceding card defines it, but this card has its own notation table.'));
const expectedUnits=[['energy-bands','k_B','eV/K'],['energy-bands','T','K'],['contact','ρ_c','Ω·m²'],['cmp','k_P','Pa⁻¹'],['orbital-radiator-budget','T_r','K'],['orbital-radiator-budget','T_s','K']];
for(const [id,symbol,unit] of expectedUnits)check('domain unit '+id+' '+symbol,()=>assert.equal(records.get(id+':0').variables.find(v=>v.symbol===symbol)?.unit,unit));
if(implicitKinds)warnings.push({name:'Legacy implicit math classification',count:implicitKinds,detail:'Supported by the current renderer default; original and expansion entries are explicit.'});
if(fallbackReadings)warnings.push({name:'Legacy source-shorthand fallback',count:fallbackReadings,detail:'Infrastructure-depth uses its original equation string as the accessible reading. All 210 new entries have authored prose readings.'});
const summary={date:new Date().toISOString(),repo,katexVersion:katex.version,settings,sourceCards:inputs.length,validatedCards:count,math:[...records.values()].filter(e=>(e.kind||'math')==='math').length,relationships:[...records].filter(([,e])=>e.kind==='relationship').map(([key])=>key),notationRows,semanticGroupingChecks:regressions.length,groupingMutationChecks:corruptions.length,independentNumericCases:numericCases.map(({id,index=0,expected,reason})=>({id,index,expected,reason})),independentOptimizationChecks:1,dimensionalChecks:dimensional.length,totalChecks:checks.length,passedChecks:checks.filter(x=>x.passed).length,failures,warnings,sourceHashes:Object.fromEntries(files.map(name=>[name,createHash('sha256').update(readFileSync(join(dir,name))).digest('hex')]))};
if(process.env.ATLAS_SCIENCE_REPORT)writeFileSync(process.env.ATLAS_SCIENCE_REPORT,JSON.stringify(summary,null,2)+'\n');
console.log(`${summary.passedChecks}/${summary.totalChecks} scientific checks passed: ${summary.math} math cards, ${summary.relationships.length} prose relationships.`);if(failures.length)console.error(failures);if(failures.length)process.exitCode=1;
