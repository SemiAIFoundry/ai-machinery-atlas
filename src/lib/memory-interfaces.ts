/** Synthetic address, interface and residency views. Existing atlas models supply all stack/workload totals. */
export const memoryExplorerVersion = 'atlas-memory-interfaces-1';
export type MemoryRoute = 'tc-ncf'|'mr-muf'|'hybrid';
export type EvidenceState = 'not-provided'|'synthetic-pass'|'synthetic-fail';
export type AddressParts = {byteInWord:number;column:number;bank:number;pseudoChannel:number;channelInDie:number;row:number;die:number};
export type AddressField = {id:keyof AddressParts;label:string;count:number;strideBytes:number;lowBit:number;bits:number};
const finite=(n:number,label:string,min=0,max=Infinity)=>{if(!Number.isFinite(n)||n<min||n>max)throw Error(`Invalid ${label}.`);return n;};
const integer=(n:number,label:string,min=0,max=Number.MAX_SAFE_INTEGER)=>{finite(n,label,min,max);if(!Number.isSafeInteger(n))throw Error(`Invalid integer ${label}.`);return n;};

/** A 2 GiB binary teaching window per die, separate from the existing decimal-GB capacity model. */
export function memoryOrganization(dies:number){
 integer(dies,'die count',4,16);
 const dimensions:[keyof AddressParts,string,number][]=[
  ['byteInWord','Byte within 32-bit word',4],['column','Word column',256],['bank','Bank within pseudo-channel',16],
  ['pseudoChannel','Pseudo-channel within channel slice',2],['channelInDie','Logical channel slice within die',2],['row','Row',32768],['die','DRAM die',dies],
 ];
 let stride=1;
 const fields:AddressField[]=dimensions.map(([id,label,count])=>{const field={id,label,count,strideBytes:stride,lowBit:Math.log2(stride),bits:Math.ceil(Math.log2(count))};stride*=count;return field;});
 return {id:'synthetic-window-2gib-per-die',dies,fields,windowBytes:stride,perDieWindowBytes:stride/dies,rowBytes:1024,wordBits:32,scope:'Explicit pedagogical address order. Each die has two logical channel slices. These are not vendor channels, physical cell locations, remapped rows, ECC bits or a complete product capacity map.'};
}
export function decodeMemoryAddress(byteAddress:number,bitInByte:number,dies:number){
 const org=memoryOrganization(dies);integer(byteAddress,'byte address',0,org.windowBytes-1);integer(bitInByte,'bit within byte',0,7);
 const parts=Object.fromEntries(org.fields.map(f=>[f.id,Math.floor(byteAddress/f.strideBytes)%f.count])) as AddressParts;
 const fields=org.fields.map(f=>({...f,value:parts[f.id],binary:parts[f.id].toString(2).padStart(f.bits,'0')}));
 const bankKey=`d${parts.die}/c${parts.channelInDie}/p${parts.pseudoChannel}/b${parts.bank}`;
 return {organization:org,byteAddress,hex:`0x${byteAddress.toString(16)}`,bitInByte,bitInWord:8*parts.byteInWord+bitInByte,parts,fields,bankKey,cellId:`${bankKey}/r${parts.row}/col${parts.column}/bit${8*parts.byteInWord+bitInByte}`};
}
export function encodeMemoryAddress(parts:AddressParts,dies:number){
 const org=memoryOrganization(dies);
 if(!parts||Object.keys(parts).length!==org.fields.length||Object.keys(parts).some(k=>!org.fields.some(f=>f.id===k)))throw Error('Invalid address fields.');
 return org.fields.reduce((sum,f)=>sum+integer(parts[f.id],f.label,0,f.count-1)*f.strideBytes,0);
}
export type OpenRows = Readonly<Record<string,number>>;
export type OpenStackRows = Readonly<Record<number,OpenRows>>;
/** Identical local bank addresses in different packages' stacks never share row-buffer state. */
export function accessStackRow(byteAddress:number,dies:number,stack:number,openStacks:OpenStackRows={}){
 integer(stack,'selected stack',0,63);
 const result=accessMemoryRow(byteAddress,dies,openStacks[stack]||{});
 return {...result,stack,openStacks:{...openStacks,[stack]:result.openRows}};
}
/** Command-order illustration. No timing, refresh, arbitration, bank-group or PHY model is implied. */
export function accessMemoryRow(byteAddress:number,dies:number,openRows:OpenRows={}){
 const address=decodeMemoryAddress(byteAddress,0,dies);
 const org=address.organization;
 for(const [key,row] of Object.entries(openRows)){
  const match=/^d(\d+)\/c(\d+)\/p(\d+)\/b(\d+)$/.exec(key);
  if(!match||key!==`d${Number(match[1])}/c${Number(match[2])}/p${Number(match[3])}/b${Number(match[4])}`||Number(match[1])>=dies||Number(match[2])>=2||Number(match[3])>=2||Number(match[4])>=16)throw Error('Invalid open-bank identity.');
  integer(row,'open row',0,org.fields.find(f=>f.id==='row')!.count-1);
 }
 const previousRow=openRows[address.bankKey],status=previousRow===undefined?'closed-bank':previousRow===address.parts.row?'row-hit':'row-conflict';
 const commands=status==='row-hit'?['READ']:status==='closed-bank'?['ACTIVATE','READ']:['PRECHARGE','ACTIVATE','READ'];
 return {address,status,previousRow:previousRow??null,commands,openRows:{...openRows,[address.bankKey]:address.parts.row},sourceIds:['microchip-bank-access']};
}

export type MemoryExplorerInput = {
 byteAddress:number;bitInByte:number;byteValue:number;selectedStack:number;padWidthUm:number;registrationOffsetUm:number;
 cteMismatchPpmPerK:number;distanceFromNeutralMm:number;ambientSwingC:number;operatingPowerSwing:number;
 kgdEvidence:EvidenceState;postBondEvidence:EvidenceState;qualificationEvidence:EvidenceState;
};
export const memoryExplorerDefaults:MemoryExplorerInput={
 byteAddress:0,bitInByte:0,byteValue:165,selectedStack:0,padWidthUm:10,registrationOffsetUm:.1,
 cteMismatchPpmPerK:2,distanceFromNeutralMm:2,ambientSwingC:40,operatingPowerSwing:1,
 kgdEvidence:'synthetic-pass',postBondEvidence:'synthetic-pass',qualificationEvidence:'not-provided',
};
type NumericInputKey=Exclude<keyof MemoryExplorerInput,'kgdEvidence'|'postBondEvidence'|'qualificationEvidence'>;
export const memoryExplorerBounds:Record<NumericInputKey,readonly[number,number,boolean]>={
 selectedStack:[0,63,true],byteAddress:[0,16*2**31-1,true],bitInByte:[0,7,true],byteValue:[0,255,true],padWidthUm:[.1,50,false],registrationOffsetUm:[0,50,false],
 cteMismatchPpmPerK:[0,20,false],distanceFromNeutralMm:[0,4,false],ambientSwingC:[0,120,false],operatingPowerSwing:[0,1,false],
};
export function validateMemoryExplorerInput(value:unknown,dies:number):MemoryExplorerInput{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Memory inputs must be an object.');
 const v=value as Record<string,unknown>,keys=Object.keys(memoryExplorerDefaults);
 if(Object.keys(v).length!==keys.length||Object.keys(v).some(k=>!keys.includes(k)))throw Error('Memory inputs have missing or unknown fields.');
 for(const [key,[lo,hi,isInteger]] of Object.entries(memoryExplorerBounds)){if(typeof v[key]!=='number')throw Error(`Invalid ${key}.`);(isInteger?integer:finite)(v[key] as number,key,lo,hi);}
 for(const key of ['kgdEvidence','postBondEvidence','qualificationEvidence'])if(!['not-provided','synthetic-pass','synthetic-fail'].includes(v[key] as string))throw Error(`Invalid ${key}.`);
 decodeMemoryAddress(v.byteAddress as number,v.bitInByte as number,dies);
 return {...v} as MemoryExplorerInput;
}
export type ExistingStack = {
 interfaces:number;heightUm:number;capacityGB:number;rawGBs:number;deliveredGBs:number;conditionalYield:number;totalPowerW:number;siliconKW:number;layerKW:number;
 temperatures:number[];peakC:number;heightMarginUm:number;thermalMarginC:number;withinLimits:boolean;
};
export type ExistingPlacement = {
 size:{weights:number;kv:number;append:number;total:number};caps:{sram:number;hbm:number;host:number;hbf:number};
 hbm:{weights:number;kv:number;workspace:number};hbf:{weights:number;kv:number};host:{weights:number;kv:number};sram:{tile:number};
 missing:{weights:number;kv:number;workspace:number;tile:number};hbmTraffic:number;externalRead:number;requiredStagingBytes:number;stagingFits:boolean;feasible:boolean;
};
export type ExistingSystemResult = {
 stack:ExistingStack;placement:ExistingPlacement;screenedMemoryDies:number;stackStarts:number;goodStacks:number;
 nextStepFits:boolean;executionFeasible:boolean;hostAppendBytes:number;token:{kvAppendBytes:number;activationTraffic:number};
};
export type MemoryContext = {
 sourceId:string;route:MemoryRoute;dies:number;hbmStacksPerPackage:number;
 dieUm:number;baseUm:number;capUm:number;gapUm:number;areaMm2:number;coolantC:number;interfaceKW:number;
 system:ExistingSystemResult;
};
export type AtlasMemoryBindings<S> = {
 referenceSystem:{id:string;package:{hbmStacks:number}};
 hbmStackDefaults:{dieUm:number;baseUm:number;capUm:number;areaMm2:number;coolantC:number};
 bondRoutes:Record<MemoryRoute,{gapUm:number;interfaceKW:number}>;
 systemScenario:(scenario:S)=>ExistingSystemResult;
};
/** Inject the existing imports directly; no stack, BOM, workload or placement coefficients are duplicated. */
export function memoryContextFromAtlas<S extends {route:MemoryRoute;dies:number}>(scenario:S,models:AtlasMemoryBindings<S>):MemoryContext{
 const system=models.systemScenario(scenario),d=models.hbmStackDefaults,route=models.bondRoutes[scenario.route];
 return {sourceId:models.referenceSystem.id,route:scenario.route,dies:scenario.dies,hbmStacksPerPackage:models.referenceSystem.package.hbmStacks,
 dieUm:d.dieUm,baseUm:d.baseUm,capUm:d.capUm,gapUm:route.gapUm,areaMm2:d.areaMm2,coolantC:d.coolantC,interfaceKW:route.interfaceKW,system};
}
export type StackLayer = {id:string;kind:'base'|'interface'|'dram-die'|'cap';zMinUm:number;zMaxUm:number;die:number|null;selected:boolean;temperatureC:number|null;materials:string[];label:string};
export type ResidencySegment = {id:string;workload:'weights'|'kv'|'workspace'|'tile';tier:'sram'|'hbm'|'host'|'hbf';startBytes:number;endBytes:number;bytes:number;mutable:boolean;role:string};
const almost=(a:number,b:number)=>Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(a),Math.abs(b));
function validateContext(c:MemoryContext){
 if(!c||!c.system||!['tc-ncf','mr-muf','hybrid'].includes(c.route))throw Error('Invalid atlas memory context.');
 memoryOrganization(c.dies);integer(c.hbmStacksPerPackage,'package stack count',1,64);
 for(const key of ['dieUm','baseUm','capUm','gapUm','areaMm2','interfaceKW'] as const)finite(c[key],key,0);
 if(c.dieUm===0||c.gapUm===0||c.areaMm2===0)throw Error('Stack geometry must be positive.');
 finite(c.coolantC,'coolant temperature',-273.15);
 const s=c.system.stack,p=c.system.placement;
 if(s.interfaces!==c.dies||s.temperatures.length!==c.dies+1||!almost(s.heightUm,c.baseUm+c.capUm+c.dies*(c.dieUm+c.gapUm)))throw Error('Atlas stack geometry is inconsistent.');
 for(const t of s.temperatures)finite(t,'stack temperature',-273.15);
 finite(s.conditionalYield,'conditional stack survival',0,1);finite(c.system.screenedMemoryDies,'screened memory dies');finite(s.capacityGB,'stack capacity');
 if(s.capacityGB*1e9<memoryOrganization(c.dies).windowBytes)throw Error('Teaching address window exceeds the declared stack capacity.');
 if(!almost(c.system.stackStarts,c.system.screenedMemoryDies/c.dies)||!almost(c.system.goodStacks,c.system.stackStarts*s.conditionalYield))throw Error('Screened-input stack denominator does not close.');
 if(!almost(p.caps.hbm,c.hbmStacksPerPackage*s.capacityGB*1e9))throw Error('Placement capacity does not match the existing package stack boundary.');
 for(const [tier,cap]of Object.entries(p.caps))finite(cap,`${tier} capacity`);
 for(const tier of [p.hbm,p.hbf,p.host,p.sram,p.missing])for(const [key,n]of Object.entries(tier))finite(n,key);
 if(p.hbf.kv!==0)throw Error('HBF cannot hold mutable KV in this read-tier policy.');
 if(!almost(p.hbm.weights+p.host.weights+p.hbf.weights+p.missing.weights,p.size.weights)||!almost(p.hbm.kv+p.host.kv+p.missing.kv,p.size.kv))throw Error('Residency does not conserve workload bytes.');
 if(c.system.hostAppendBytes>c.system.token.kvAppendBytes)throw Error('Host KV append exceeds total append.');
 finite(c.system.hostAppendBytes,'host append');finite(c.system.token.kvAppendBytes,'KV append');
}
function residencyView(c:MemoryContext){
 const p=c.system.placement,segments:ResidencySegment[]=[],offsets={sram:0,hbm:0,host:0,hbf:0};
 const add=(tier:ResidencySegment['tier'],workload:ResidencySegment['workload'],bytes:number,mutable:boolean,role:string)=>{
  const startBytes=offsets[tier];offsets[tier]+=bytes;segments.push({id:`${tier}-${workload}`,tier,workload,startBytes,endBytes:offsets[tier],bytes,mutable,role});
 };
 add('sram','tile',p.sram.tile,true,'Reusable compute tile; not another persistent copy of the whole model.');
 add('hbm','workspace',p.hbm.workspace,true,'Reserved staging and transient workspace.');
 add('hbm','kv',p.hbm.kv,true,'Prior keys and values; next-token appends need additional capacity.');
 add('hbm','weights',p.hbm.weights,false,'Read-only pretrained weights during this inference step.');
 add('host','kv',p.host.kv,true,'Mutable overflow KV, staged through HBM for use.');
 add('host','weights',p.host.weights,false,'Read-only overflow weights.');
 add('hbf','weights',p.hbf.weights,false,'Illustrative read tier for pretrained weights.');
 const boundaries=Object.entries(p.caps).map(([id,capacityBytes])=>({id,capacityBytes,usedBytes:offsets[id as keyof typeof offsets],freeBytes:capacityBytes-offsets[id as keyof typeof offsets],location:id==='sram'?'inside processor die':id==='hbm'?'on accelerator package':id==='host'?'host-side memory':'conceptual read tier; physical integration unspecified'}));
 const flows=[
  {id:'host-to-hbm',from:'host',to:'hbm',bytes:p.host.weights+p.host.kv,operation:'read then stage',scope:'One remote read and one HBM staging write.'},
  {id:'hbf-to-hbm',from:'hbf',to:'hbm',bytes:p.hbf.weights,operation:'read then stage',scope:'Read-only weights; no KV or update writes to HBF.'},
  {id:'hbm-to-compute',from:'hbm',to:'compute',bytes:p.hbm.weights+p.hbm.kv+p.externalRead,operation:'read',scope:'Resident data plus one later read of each staged remote byte.'},
  {id:'compute-to-kv',from:'compute',to:'hbm',bytes:c.system.token.kvAppendBytes,operation:'write',scope:'Every newly generated KV byte reaches the HBM path once.'},
  {id:'hbm-to-host-append',from:'hbm',to:'host',bytes:c.system.hostAppendBytes,operation:'write',scope:'Host-resident share of new KV leaves HBM after staging.'},
  {id:'activation-exchange',from:'compute',to:'hbm',bytes:c.system.token.activationTraffic,operation:'read and write',scope:'Existing activation traffic allowance includes both directions; counted once.'},
 ];
 return {boundaries,segments,flows,placementFeasible:p.feasible,stagingFits:p.stagingFits,requiredStagingBytes:p.requiredStagingBytes,nextStepFits:c.system.nextStepFits,executionFeasible:c.system.executionFeasible,missing:{...p.missing},hbmReadAndStageBytes:p.hbmTraffic,scope:'Uses existing placeInference and systemScenario totals. Static placement and one bounded decode-step headroom remain distinct; no new throughput estimate is created.'};
}
export function evaluateMemoryExplorer(value:MemoryExplorerInput,context:MemoryContext){
 validateContext(context);const input=validateMemoryExplorerInput(value,context.dies),c=context,s=c.system.stack;
 integer(input.selectedStack,'selected package stack',0,c.hbmStacksPerPackage-1);
 const address=decodeMemoryAddress(input.byteAddress,input.bitInByte,c.dies);
 const layers:StackLayer[]=[];let z=0;
 layers.push({id:'base',kind:'base',zMinUm:0,zMaxUm:c.baseUm,die:null,selected:false,temperatureC:s.temperatures[0],materials:['base-silicon','routing'],label:'Base die and routing'});z=c.baseUm;
 const interfaces=[];
 for(let i=0;i<c.dies;i++){
  const materials=c.route==='hybrid'?['copper','bond-dielectric']:['copper','solder',c.route==='tc-ncf'?'ncf':'muf'];
  const temperatureC=Math.max(s.temperatures[i],s.temperatures[i+1]);
  const deltaTemperatureC=input.ambientSwingC+Math.max(0,temperatureC-c.coolantC)*input.operatingPowerSwing;
  const freeMismatchUm=input.cteMismatchPpmPerK*1e-6*deltaTemperatureC*input.distanceFromNeutralMm*1000;
  // Global unconstrained displacement/gap analogy is not a hybrid-bond strain model.
  const solderShearProxy=c.route==='hybrid'?null:freeMismatchUm/c.gapUm;
  interfaces.push({id:`interface-${i}`,index:i,lowerDie:i===0?'base':`die-${i-1}`,upperDie:`die-${i}`,zMinUm:z,zMaxUm:z+c.gapUm,gapUm:c.gapUm,materials,temperatureC,deltaTemperatureC,freeMismatchUm,solderShearProxy,scope:c.route==='hybrid'?'Free expansion mismatch only. No solder compliance, hybrid-bond stress or fatigue model.':'Unconstrained displacement divided by joint gap is an indicator, not a calibrated solder strain, stress or lifetime prediction.'});
  layers.push({id:`interface-${i}`,kind:'interface',zMinUm:z,zMaxUm:z+c.gapUm,die:i,selected:i===address.parts.die,temperatureC,materials,label:`${c.route} interface ${i+1}`});z+=c.gapUm;
  layers.push({id:`die-${i}`,kind:'dram-die',zMinUm:z,zMaxUm:z+c.dieUm,die:i,selected:i===address.parts.die,temperatureC:s.temperatures[i+1],materials:['silicon','dram-arrays','tsv'],label:`DRAM die ${i}`});z+=c.dieUm;
 }
 layers.push({id:'cap',kind:'cap',zMinUm:z,zMaxUm:z+c.capUm,die:null,selected:false,temperatureC:null,materials:['cap'],label:'Cap allowance'});
 const overlapFraction=Math.max(0,1-input.registrationOffsetUm/input.padWidthUm);
 const gates=[
  {id:'known-good-inputs',label:'Known-good die evidence',state:input.kgdEvidence,scope:'Screened die inputs; no initial wafer yield is applied again.'},
  {id:'post-bond-test',label:'Post-bond functional test evidence',state:input.postBondEvidence,scope:'Separate synthetic evidence for assembled interconnect and die function.'},
  {id:'qualification',label:'Scoped reliability qualification',state:input.qualificationEvidence,scope:'Synthetic evidence for a declared use envelope; no field lifetime is calculated.'},
 ];
 const gateStatus=!s.withinLimits?'model-limit-fail':overlapFraction===0?'no-contact-overlap':gates.some(g=>g.state==='synthetic-fail')?'evidence-fail':gates.some(g=>g.state==='not-provided')?'evidence-pending':'accepted-within-example';
 const acceptedExampleStacks=gateStatus==='accepted-within-example'?c.system.goodStacks:0;
 const rows=[Math.max(0,address.parts.row-1),address.parts.row,Math.min(32767,address.parts.row+1)].filter((r,i,a)=>a.indexOf(r)===i);
 const colStart=Math.min(248,Math.max(0,address.parts.column-3));
 const bankWindow=rows.flatMap(row=>Array.from({length:8},(_,i)=>({row,column:colStart+i,selected:row===address.parts.row&&colStart+i===address.parts.column})));
 const bits=Array.from({length:8},(_,bit)=>({bit,value:Math.floor(input.byteValue/2**bit)%2,selected:bit===input.bitInByte}));
 const residency=residencyView(c),packageByteAddress=input.selectedStack*s.capacityGB*1e9+input.byteAddress;
 const segment=residency.segments.find(segment=>segment.tier==='hbm'&&packageByteAddress>=segment.startBytes&&packageByteAddress<segment.endBytes);
 const allocation={packageByteAddress,segmentId:segment?.id??null,workload:segment?.workload??'free',offsetWithinSegmentBytes:segment?packageByteAddress-segment.startBytes:null,scope:'Declared contiguous illustration of HBM tier placement. Stack stride uses existing capacity. This is not an actual model allocation, controller map or vendor physical address.'};
 const hierarchy=[{id:'package',label:'Accelerator package',index:0,count:1},{id:'stack',label:'HBM stack',index:input.selectedStack,count:c.hbmStacksPerPackage},{id:'die',label:'DRAM die',index:address.parts.die,count:c.dies},{id:'channel',label:'Logical channel slice',index:address.parts.channelInDie,count:2},{id:'pseudo-channel',label:'Pseudo-channel',index:address.parts.pseudoChannel,count:2},{id:'bank',label:'Bank',index:address.parts.bank,count:16},{id:'row',label:'Row',index:address.parts.row,count:32768},{id:'column',label:'Word column',index:address.parts.column,count:256},{id:'byte',label:'Byte in word',index:address.parts.byteInWord,count:4},{id:'bit',label:'Bit in byte',index:input.bitInByte,count:8}];
 return {version:memoryExplorerVersion,input,address,hierarchy,allocation,bankWindow,bits,selectedBit:bits[input.bitInByte].value,
  stack:{layers,interfaces,geometry:{unit:'µm',positiveZ:'up',zBounds:[0,s.heightUm],sideUm:Math.sqrt(c.areaMm2)*1000,scope:'Square equal-area die outline. Array locations and TSV paths are conceptual; no routed netlist or physical channel floorplan is supplied.'},heightUm:s.heightUm,capacityBytes:s.capacityGB*1e9,addressWindowBytes:address.organization.windowBytes,unmappedCapacityBytes:s.capacityGB*1e9-address.organization.windowBytes,bandwidth:{rawGBs:s.rawGBs,deliveredGBs:s.deliveredGBs},thermal:{temperatures:[...s.temperatures],peakC:s.peakC,totalPowerW:s.totalPowerW,siliconKW:s.siliconKW,interfaceKW:c.interfaceKW,layerKW:s.layerKW,thermalMarginC:s.thermalMarginC},heightMarginUm:s.heightMarginUm,withinLimits:s.withinLimits},
  interfaceDetail:{unit:'µm',route:c.route,gapUm:c.gapUm,padWidthUm:input.padWidthUm,offsetUm:input.registrationOffsetUm,overlapFraction,materials:interfaces[address.parts.die].materials,selected:interfaces[address.parts.die],scope:'Independent registration geometry. No resistance or yield follows from visible overlap; thermal mismatch is a different operating condition.'},
  evidence:{gates,status:gateStatus,screenedDieInputs:c.system.screenedMemoryDies,starts:c.system.stackStarts,conditionalSurvival:s.conditionalYield,modeledGoodStacks:c.system.goodStacks,acceptedExampleStacks,denominator:'Stacks per selected planning lot from already-screened dies. Conditions do not duplicate wafer yield.',scope:'No evidence state overrides modeled thermal or height limits. Mechanical indicators have no invented qualification threshold.'},
  residency,sourceIds:['micron-hbm-hierarchy','intel-hbm-address','microchip-bank-access','nasa-cte','samsung-tcncf','sk-mrmuf','imec-hybrid','paged-attention','sandisk-hbf'],
 };
}
export type MemoryExplorerResult=ReturnType<typeof evaluateMemoryExplorer>;
export const memoryExplorerLessons = [
 {id:'bit-address',title:'A bit has a declared address',lessonId:'dram-cell-array-fabrication',sourceIds:['micron-hbm-hierarchy','intel-hbm-address']},
 {id:'bank-access',title:'Rows and banks shape a read',lessonId:'hbm-channel-generation-ras',sourceIds:['intel-hbm-address','microchip-bank-access']},
 {id:'stack-path',title:'Array, TSV, interface and base',lessonId:'hbm-base-phy-controller',sourceIds:['micron-hbm-hierarchy','samsung-tcncf','sk-mrmuf','imec-hybrid']},
 {id:'height-thermal',title:'Height and heat share a structure',lessonId:'hbm-stack-thermal-yield',sourceIds:['nasa-cte']},
 {id:'qualification',title:'Known-good is an input boundary',lessonId:'memory-system-qualification',sourceIds:['nasa-cte']},
 {id:'working-set',title:'Which bytes cross which boundary?',lessonId:'memory-working-set-placement',sourceIds:['paged-attention','sandisk-hbf']},
] as const;
