/** Integrated educational process slice. All scenario numbers and metrology records are synthetic. */
export const fabricationFlowVersion = 'atlas-fabrication-flow-1';
export type InterfaceRoute = 'tc-ncf' | 'mr-muf' | 'hybrid';
export type Decision = 'pass' | 'review' | 'fail';
export type FabricationInput = {
  waferCount:number; dieAreaMm2:number; defectDensityCm2:number; selectedCohort:number;
  oxideNominalNm:number; oxideBiasNm:number; filmNominalNm:number; depositionBiasNm:number;
  thicknessVariationNm:number; targetCdNm:number; lithographyBiasNm:number; cdVariationNm:number;
  etchCdBiasNm:number; maskInitialNm:number; targetMaskSelectivity:number; targetStopSelectivity:number;
  overetchFraction:number; toleranceScale:number; uncertaintyScale:number;
  interfaceRoute:InterfaceRoute; alignmentOffsetUm:number; contactResistanceMilliOhm:number;
  bondStrengthMPa:number; qualificationEvidence:'not-provided'|'synthetic-pass'|'synthetic-fail';
  acceptedHbmStacks:number; assemblySlots:number; residualDieSurvival:number; interfaceSurvival:number; finalAssemblySurvival:number;
};
export const fabricationDefaults:FabricationInput = {
 waferCount:4,dieAreaMm2:100,defectDensityCm2:.12,selectedCohort:4,
 oxideNominalNm:20,oxideBiasNm:0,filmNominalNm:100,depositionBiasNm:0,thicknessVariationNm:4,
 targetCdNm:40,lithographyBiasNm:-2,cdVariationNm:2,etchCdBiasNm:2,maskInitialNm:40,
 targetMaskSelectivity:10,targetStopSelectivity:40,overetchFraction:.08,toleranceScale:1,uncertaintyScale:1,
 interfaceRoute:'tc-ncf',alignmentOffsetUm:.1,contactResistanceMilliOhm:20,bondStrengthMPa:2,
 qualificationEvidence:'synthetic-pass',acceptedHbmStacks:6400,assemblySlots:1500,
 residualDieSurvival:.999,interfaceSurvival:.995,finalAssemblySurvival:.98,
};
type NumericKey = Exclude<keyof FabricationInput,'interfaceRoute'|'qualificationEvidence'>;
export const fabricationBounds:Record<NumericKey,readonly[number,number,boolean]> = {
 waferCount:[1,20,true],dieAreaMm2:[20,500,false],defectDensityCm2:[0,2,false],selectedCohort:[0,8,true],
 oxideNominalNm:[10,60,false],oxideBiasNm:[-8,8,false],filmNominalNm:[60,160,false],depositionBiasNm:[-20,20,false],thicknessVariationNm:[0,12,false],
 targetCdNm:[24,80,false],lithographyBiasNm:[-10,10,false],cdVariationNm:[0,6,false],etchCdBiasNm:[-6,6,false],maskInitialNm:[5,80,false],targetMaskSelectivity:[2,30,false],targetStopSelectivity:[5,200,false],overetchFraction:[0,.4,false],
 toleranceScale:[.25,2,false],uncertaintyScale:[0,5,false],alignmentOffsetUm:[0,8,false],contactResistanceMilliOhm:[0,150,false],bondStrengthMPa:[0,5,false],acceptedHbmStacks:[0,20000,true],assemblySlots:[0,5000,true],residualDieSurvival:[.8,1,false],interfaceSurvival:[.8,1,false],finalAssemblySurvival:[.8,1,false],
};
export function validateFabricationInput(value:unknown):FabricationInput {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Fabrication inputs must be an object.');
 const v=value as Record<string,unknown>, keys=Object.keys(fabricationDefaults);
 if(Object.keys(v).length!==keys.length||Object.keys(v).some(k=>!keys.includes(k)))throw Error('Fabrication inputs have unknown or missing fields.');
 if(!['tc-ncf','mr-muf','hybrid'].includes(v.interfaceRoute as string))throw Error('Unknown interface route.');
 if(!['not-provided','synthetic-pass','synthetic-fail'].includes(v.qualificationEvidence as string))throw Error('Unknown qualification evidence state.');
 for(const [key,[lo,hi,integer]] of Object.entries(fabricationBounds)){const n=v[key];if(typeof n!=='number'||!Number.isFinite(n)||n<lo||n>hi||(integer&&!Number.isInteger(n)))throw Error(`${key} is outside this model's range.`);}
 return {...v} as FabricationInput;
}
export type Inspection = {id:string;label:string;unit:string;reading:number;halfWidth:number;interval:[number,number];specification:[number,number];decision:Decision;sourceIds:string[];scope:string};
/** Set containment, not a probability: uncertainty half-width has no claimed confidence level. */
export function inspectInterval(id:string,label:string,unit:string,reading:number,halfWidth:number,lower:number,upper:number,scope:string,sourceIds=['jcgm-conformity'],physicalMinimum=-Infinity):Inspection {
 if(![reading,halfWidth,lower,upper].every(Number.isFinite)||halfWidth<0||lower>upper)throw Error('Invalid dimensioned inspection interval.');
 if(reading<physicalMinimum)throw Error('Reading is below the stated physical minimum.');
 const interval:[number,number]=[Math.max(physicalMinimum,reading-halfWidth),reading+halfWidth];
 const decision:Decision=interval[0]>=lower&&interval[1]<=upper?'pass':interval[1]<lower||interval[0]>upper?'fail':'review';
 return{id,label,unit,reading,halfWidth,interval,specification:[lower,upper],decision,sourceIds,scope};
}
export type Region = {id:string;material:'silicon'|'grown-oxide'|'deposited-poly-Si'|'resist'|'latent-resist'|'copper'|'solder'|'ncf'|'muf'|'bond-dielectric';xMin:number;xMax:number;yMin:number;yMax:number;overlay?:boolean;label:string};
export type Section = {id:string;unit:'nm'|'µm';xBounds:[number,number];yBounds:[number,number];datum:string;positiveY:'up';geometryStatus:'illustrative-estimate'|'requested-unqualified';regions:Region[];annotations:{label:string;x:number;y:number}[]};
export type Cohort = {id:string;index:number;x:number;y:number;dieCount:number;nominalFilmNm:number;actualFilmNm:number;developedCdNm:number;actualCdNm:number;oxideNm:number;consumedSiNm:number;remainingOxideNm:number;remainingTargetNm:number;requestedEtchDepthNm:number;maskConsumedNm:number;maskRemainingNm:number;maskBudgetValid:boolean;checks:Inspection[];decision:Decision};
export type Stage = {id:string;title:string;specimenId:string;lessonId:string;summary:string;kind:'material'|'inspection'|'inventory'|'integration';sourceIds:string[];sections:Section[];quantities:{label:string;value:number;unit:string}[];decision:Decision|'not-assessed';failureIds:string[];scope:string};
export const fabricationStageIds=['incoming','oxidized','deposited','resist-coated','latent-image','developed','etched','inspected','wafer-screened','package-interface','accepted-output'] as const;
const combine=(decisions:Decision[]):Decision=>decisions.includes('fail')?'fail':decisions.includes('review')?'review':'pass';
function waferLayout(area:number){
 const radius=147, side=Math.sqrt(area),pitch=side+.1,limit=Math.ceil(radius/pitch),cohorts=Array.from({length:9},()=>0);
 const centers:{xMm:number;yMm:number;cohort:number}[]=[];
 for(let row=-limit;row<=limit;row++)for(let col=-limit;col<=limit;col++){
  const x=col*pitch,y=row*pitch;
  if(Math.hypot(Math.abs(x)+side/2,Math.abs(y)+side/2)>radius)continue;
  const bin=(n:number)=>n< -radius/3?0:n>radius/3?2:1,cohort=bin(y)*3+bin(x);cohorts[cohort]++;centers.push({xMm:x,yMm:y,cohort});
 }
 return{diameterMm:300,edgeExclusionMm:3,scribeAllowanceMm:.1,dieSideMm:side,centers,cohortCounts:cohorts,grossDies:centers.length};
}
const uncertaintyScope='Synthetic reading with a declared uncertainty half-width; no probability distribution, confidence level, or instrument qualification is inferred.';
function cohort(input:FabricationInput,index:number,dieCount:number):Cohort {
 const x=index%3-1,y=Math.floor(index/3)-1;
 const actualFilmNm=input.filmNominalNm+input.depositionBiasNm+y*input.thicknessVariationNm;
 const oxideNm=input.oxideNominalNm+input.oxideBiasNm;
 const developedCdNm=input.targetCdNm+input.lithographyBiasNm+x*input.cdVariationNm;
 const actualCdNm=developedCdNm+input.etchCdBiasNm;
 // Thickness consumed is a disclosed illustrative geometric ratio, not calibrated oxidation kinetics.
 const consumedSiNm=.44*oxideNm;
 const requestedEtchDepthNm=input.filmNominalNm*(1+input.overetchFraction);
 const remainingTargetNm=Math.max(0,actualFilmNm-requestedEtchDepthNm);
 const stopLossNm=Math.max(0,requestedEtchDepthNm-actualFilmNm)/input.targetStopSelectivity;
 const remainingOxideNm=Math.max(0,oxideNm-stopLossNm);
 const maskConsumedNm=requestedEtchDepthNm/input.targetMaskSelectivity,maskRemainingNm=input.maskInitialNm-maskConsumedNm,maskBudgetValid=maskRemainingNm>=0;
 const u=input.uncertaintyScale,t=input.toleranceScale;
 const checks=[
  inspectInterval('film-thickness','Deposited film thickness','nm',actualFilmNm,1.5*u,input.filmNominalNm-8*t,input.filmNominalNm+8*t,uncertaintyScope),
  inspectInterval('transferred-cd','Transferred opening CD','nm',actualCdNm,.5*u,input.targetCdNm-3*t,input.targetCdNm+3*t,'Synthetic opening width after transfer; etch bias is prescribed, not predicted from plasma conditions. '+uncertaintyScope),
  inspectInterval('remaining-mask','Remaining mask budget','nm',maskRemainingNm,1*u,5,input.maskInitialNm,'Lower limit is an illustrative 5 nm reserve; a negative budget is never repaired by clipping the drawing. '+uncertaintyScope),
  inspectInterval('clear-target','Target remaining in opening','nm',remainingTargetNm,.2*u,0,2,'Maximum 2 nm residue is an illustrative specification, not a functional electrical criterion. '+uncertaintyScope,['jcgm-conformity','mit-dry-etch'],0),
  inspectInterval('stop-oxide','Remaining stop oxide','nm',remainingOxideNm,(.5+1.5/input.targetStopSelectivity)*u,input.oxideNominalNm-3*t,input.oxideNominalNm+3*t,'Worst-case thickness half-width adds oxide uncertainty and deposited-film uncertainty divided by fixed stop selectivity. No leakage/reliability follows from thickness. '+uncertaintyScope,['jcgm-conformity','mit-dry-etch'],0),
 ];
 return{id:`cohort-${index}`,index,x,y,dieCount,nominalFilmNm:input.filmNominalNm,actualFilmNm,developedCdNm,actualCdNm,oxideNm,consumedSiNm,remainingOxideNm,remainingTargetNm,requestedEtchDepthNm,maskConsumedNm,maskRemainingNm,maskBudgetValid,checks,decision:maskBudgetValid?combine(checks.map(c=>c.decision)):'fail'};
}
function featureSection(c:Cohort,stage:number,input:FabricationInput):Section{
 const span=Math.max(160,input.targetCdNm*2),left=-span/2,right=span/2,regions:Region[]=[];
 const add=(id:string,material:Region['material'],xMin:number,xMax:number,yMin:number,yMax:number,label:string,overlay=false)=>{if(xMax>xMin&&yMax>yMin)regions.push({id,material,xMin,xMax,yMin,yMax,label,...(overlay?{overlay:true}:{})});};
 const oxide=stage>=1?c.oxideNm:0,consumed=stage>=1?c.consumedSiNm:0,oxideTop=oxide-consumed,filmTop=oxideTop+c.actualFilmNm;
 add('substrate','silicon',left,right,-100,-consumed,'Silicon substrate');
 if(stage>=1){
  if(stage>=6){add('oxide-left','grown-oxide',left,-c.actualCdNm/2,-consumed,oxideTop,'Grown SiO₂');add('oxide-right','grown-oxide',c.actualCdNm/2,right,-consumed,oxideTop,'Grown SiO₂');add('oxide-opening','grown-oxide',-c.actualCdNm/2,c.actualCdNm/2,-consumed,c.remainingOxideNm-consumed,'Stop oxide in opening');}
  else add('oxide','grown-oxide',left,right,-consumed,oxideTop,'Grown SiO₂');
 }
 if(stage>=2){
  if(stage>=6){add('target-left','deposited-poly-Si',left,-c.actualCdNm/2,oxideTop,filmTop,'Deposited poly-Si target');add('target-right','deposited-poly-Si',c.actualCdNm/2,right,oxideTop,filmTop,'Deposited poly-Si target');add('target-opening','deposited-poly-Si',-c.actualCdNm/2,c.actualCdNm/2,oxideTop,oxideTop+c.remainingTargetNm,'Target residue');}
  else add('target','deposited-poly-Si',left,right,oxideTop,filmTop,'Deposited poly-Si target');
 }
 if(stage>=3){const mask=stage>=6?Math.max(0,c.maskRemainingNm):input.maskInitialNm;
  if(stage>=5){add('mask-left','resist',left,-c.developedCdNm/2,filmTop,filmTop+mask,'Retained resist');add('mask-right','resist',c.developedCdNm/2,right,filmTop,filmTop+mask,'Retained resist');}
  else{add('mask','resist',left,right,filmTop,filmTop+mask,'Positive resist');if(stage===4)add('latent','latent-resist',-c.developedCdNm/2,c.developedCdNm/2,filmTop,filmTop+mask,'Latent soluble region',true);}
 }
 return{id:'same-die-feature',unit:'nm',xBounds:[left,right],yBounds:[-100,filmTop+input.maskInitialNm+12],datum:'Original silicon surface y = 0',positiveY:'up',geometryStatus:stage>=6&&!c.maskBudgetValid?'requested-unqualified':'illustrative-estimate',regions,annotations:[{label:'Original Si surface',x:left,y:0}]};
}
function interfaceSection(input:FabricationInput):Section{
 const hybrid=input.interfaceRoute==='hybrid',gap=hybrid?.15:6,pad=hybrid?2:20,span=pad*5,regions:Region[]=[];
 const add=(id:string,material:Region['material'],xMin:number,xMax:number,yMin:number,yMax:number,label:string)=>regions.push({id,material,xMin,xMax,yMin,yMax,label});
 add('lower-die','silicon',-span/2,span/2,-20,0,'Receiving die');add('upper-die','silicon',-span/2+input.alignmentOffsetUm,span/2+input.alignmentOffsetUm,gap,gap+20,'Selected screened die');
 if(hybrid){add('lower-dielectric','bond-dielectric',-span/2,span/2,0,gap/2,'Bond dielectric');add('upper-dielectric','bond-dielectric',-span/2+input.alignmentOffsetUm,span/2+input.alignmentOffsetUm,gap/2,gap,'Bond dielectric');}
 else add('support',input.interfaceRoute==='tc-ncf'?'ncf':'muf',-span/2,span/2,0,gap,input.interfaceRoute==='tc-ncf'?'Non-conductive film':'Molded underfill');
 for(const [i,x]of[-pad*1.5,0,pad*1.5].entries()){add(`pad-${i}`,'copper',x-pad/2,x+pad/2,-1,0,'Receiving Cu pad');add(`contact-${i}`,hybrid?'copper':'solder',x-pad/2+input.alignmentOffsetUm,x+pad/2+input.alignmentOffsetUm,0,gap,hybrid?'Direct copper connection':'Solder-bearing joint');}
 return{id:'package-interface',unit:'µm',xBounds:[-span/2-2,span/2+input.alignmentOffsetUm+2],yBounds:[-22,gap+22],datum:'Receiving die surface y = 0; separate scale from the wafer feature',positiveY:'up',geometryStatus:'illustrative-estimate',regions,annotations:[]};
}
export function evaluateFabricationFlow(value:FabricationInput){
 const input=validateFabricationInput(value),layout=waferLayout(input.dieAreaMm2),cohorts=layout.cohortCounts.map((n,i)=>cohort(input,i,n)),selected=cohorts[input.selectedCohort];
 const eligibleDiesPerWafer=cohorts.filter(c=>c.decision==='pass').reduce((sum,c)=>sum+c.dieCount,0),reviewDiesPerWafer=cohorts.filter(c=>c.decision==='review').reduce((sum,c)=>sum+c.dieCount,0);
 // D0 is per cm²; mm² / 100 converts area before the dimensionless Poisson mean.
 const poissonMean=input.defectDensityCm2*input.dieAreaMm2/100,defectFreeProbability=Math.exp(-poissonMean);
 const screenedGoodDies=eligibleDiesPerWafer*input.waferCount*defectFreeProbability;
 const padWidthUm=input.interfaceRoute==='hybrid'?2:20,alignmentU=.05*input.uncertaintyScale;
 const interfaceChecks=[
  inspectInterval('alignment','Absolute placement offset','µm',input.alignmentOffsetUm,alignmentU,0,padWidthUm*.2,'Synthetic geometric registration criterion shared as a fraction of pad width. It predicts neither electrical resistance nor bond yield.',['jcgm-conformity','imec-hybrid'],0),
  inspectInterval('contact-resistance','Contact resistance example','mΩ',input.contactResistanceMilliOhm,2*input.uncertaintyScale,0,50,'An independent synthetic electrical reading. Resistance is not calculated from overlap.',['jcgm-conformity'],0),
  inspectInterval('bond-strength','Bond-strength example','MPa',input.bondStrengthMPa,.1*input.uncertaintyScale,1,10,'An independent synthetic mechanical reading and acceptance minimum; no fatigue or field lifetime is predicted.',['jcgm-conformity'],0),
 ];
 const interfaceDecision=combine(interfaceChecks.map(c=>c.decision));
 const streams=[{id:'screened-dies',value:screenedGoodDies/2,unit:'packages / lot'},{id:'accepted-hbm',value:input.acceptedHbmStacks/8,unit:'packages / lot'},{id:'assembly-slots',value:input.assemblySlots,unit:'packages / lot'}];
 const starts=Math.min(...streams.map(s=>s.value)),conditionalSurvival=input.residualDieSurvival**2*input.interfaceSurvival**10*input.finalAssemblySurvival;
 const screenedPackages=interfaceDecision==='pass'?starts*conditionalSurvival:0;
 const acceptedOutput=input.qualificationEvidence==='synthetic-pass'?screenedPackages:0;
 const outputStatus: 'accepted-within-example'|'no-eligible-dies'|'no-hbm-inputs'|'no-assembly-capacity'|'interface-review'|'interface-fail'|'qualification-pending'|'qualification-fail' = screenedGoodDies===0?'no-eligible-dies':input.acceptedHbmStacks===0?'no-hbm-inputs':input.assemblySlots===0?'no-assembly-capacity':interfaceDecision==='review'?'interface-review':interfaceDecision==='fail'?'interface-fail':input.qualificationEvidence==='not-provided'?'qualification-pending':input.qualificationEvidence==='synthetic-fail'?'qualification-fail':'accepted-within-example';
 const failures=[...selected.checks.filter(c=>c.decision!=='pass').map(c=>({id:c.id,scope:'selected-cohort',status:c.decision})),...interfaceChecks.filter(c=>c.decision!=='pass').map(c=>({id:c.id,scope:'package-interface',status:c.decision})),...(input.qualificationEvidence!=='synthetic-pass'?[{id:'qualification-evidence',scope:'lot',status:input.qualificationEvidence==='synthetic-fail'?'fail':'review'}]:[]),...(screenedGoodDies===0?[{id:'no-eligible-dies',scope:'lot',status:reviewDiesPerWafer?'review':'fail'}]:[])];
 const definitions:[string,string,string,Stage['kind'],string[],string][]=[
 ['incoming','One identified silicon specimen','silicon-wafer','material',['mit-cvd'],'The identified die belongs to a synthetic wafer population.'],
 ['oxidized','Grown oxide and consumed silicon','thermal-oxidation-interface','material',['deal-grove'],'The oxide grows across the original surface; its 0.44 silicon-consumption ratio is illustrative geometry, not calibrated kinetics.'],
 ['deposited','A separate deposited target film','cvd-pvd-film-transport','material',['mit-cvd'],'The poly-Si target adds material above the grown oxide. Its synthetic spatial thickness field is independent of measurement uncertainty.'],
 ['resist-coated','Continuous positive resist','resist-track-development','material',['asml-resist'],'The mask covers the target before a latent image or opening exists.'],
 ['latent-image','Exposure changes resist state','resist-track-development','material',['asml-resist'],'The latent region identifies changed solubility. Exposure removes neither resist nor target material.'],
 ['developed','A developed resist opening','resist-track-development','material',['asml-resist'],'Development opens the resist and leaves the target film intact.'],
 ['etched','Target removal and mask consumption','plasma-wet-etch-transfer','material',['mit-dry-etch'],'One prescribed etch exposure removes target, may consume stop oxide, and consumes finite mask. Exhausted mask marks a requested, unqualified geometry.'],
 ['inspected','Dimensioned inspection and uncertainty','fab-metrology-process-window','inspection',['jcgm-conformity','nist-limits'],'Synthetic readings and uncertainty intervals are compared with stated tolerances. Review is not acceptance, and tighter measurement uncertainty does not repair the specimen.'],
 ['wafer-screened','Screened inputs have a new denominator','dram-die','inventory',['nist-poisson'],'Cohort acceptance and an independent Poisson defect assumption produce expected screened inputs. Nine synthetic cohorts are an assumed population model, not sufficient real wafer sampling.'],
 ['package-interface','Separate interface evidence','hbm-bonding-process-selection','integration',['samsung-tcncf','sk-mrmuf','imec-hybrid'],'Two screened dies and eight already-accepted HBM stacks enter the illustrative BOM. Alignment, electrical, mechanical and scoped qualification evidence are independent conditions.'],
 ['accepted-output','Accepted output within this example','memory-system-qualification','inventory',['jcgm-conformity'],'Only the illustrated acceptance policy is satisfied. Product function, process reliability, and field qualification are not established by this selected-feature flow.'],
 ];
 const specimenId=`wafer-teaching-01/${selected.id}/feature-A`;
 const stages:Stage[]=definitions.map(([id,title,lessonId,kind,sourceIds,summary],i)=>({
  id,title,lessonId,kind,sourceIds,summary,specimenId,
  sections:[featureSection(selected,Math.min(i,7),input),...(i>=9?[interfaceSection(input)]:[])],
  quantities:[{label:'Nominal target-film thickness',value:input.filmNominalNm,unit:'nm'},{label:'Target opening CD',value:input.targetCdNm,unit:'nm'},
   ...(i>=1?[{label:'Synthetic grown-oxide reading',value:selected.oxideNm,unit:'nm'},{label:'Illustrative consumed silicon',value:selected.consumedSiNm,unit:'nm'}]:[]),
   ...(i>=2?[{label:'Synthetic deposited-film reading',value:selected.actualFilmNm,unit:'nm'}]:[]),
   ...(i>=3?[{label:'Remaining mask',value:i>=6?selected.maskRemainingNm:input.maskInitialNm,unit:'nm'}]:[]),
   ...(i>=5?[{label:'Developed opening CD',value:selected.developedCdNm,unit:'nm'}]:[]),
   ...(i>=6?[{label:'Transferred opening CD estimate',value:selected.actualCdNm,unit:'nm'},{label:'Remaining target in opening',value:selected.remainingTargetNm,unit:'nm'},{label:'Remaining stop oxide in opening',value:selected.remainingOxideNm,unit:'nm'}]:[]),
   ...(i>=8?[{label:'Screened good dies',value:screenedGoodDies,unit:'expected dies / lot'}]:[]),
   ...(i>=10?[{label:'Accepted example output',value:acceptedOutput,unit:'expected packages / lot'}]:[])],
  decision:i<7?'not-assessed':i<9?selected.decision:i===9?interfaceDecision:acceptedOutput>0?'pass':outputStatus.includes('pending')||outputStatus.includes('review')||(outputStatus==='no-eligible-dies'&&reviewDiesPerWafer>0)?'review':'fail',
  failureIds:i<7?[]:i<9?selected.checks.filter(c=>c.decision!=='pass').map(c=>c.id):failures.map(f=>f.id),
  scope:'Selected educational process slice. Omitted transistor/interconnect fabrication and full functionality are not derived; later interface geometry uses a separate µm scale.'
 }));
 return{version:fabricationFlowVersion,input,specimen:{...selected,cohortId:selected.id,id:specimenId},stages,cohorts,inspections:[...selected.checks,...interfaceChecks],wafer:{...layout,eligibleDiesPerWafer,reviewDiesPerWafer,failedDiesPerWafer:layout.grossDies-eligibleDiesPerWafer-reviewDiesPerWafer,poissonMean,defectFreeProbability,screenedGoodDies},assembly:{streams,starts,limiting:streams.filter(s=>Math.abs(s.value-starts)<1e-9).map(s=>s.id),logicDiesPerPackage:2,hbmStacksPerPackage:8,packageAttachmentInterfaces:10,conditionalSurvival,interfaceDecision,interfaceChecks,padWidthUm,geometricOverlapFraction:Math.max(0,1-input.alignmentOffsetUm/padWidthUm),screenedPackages,qualificationEvidence:input.qualificationEvidence},acceptedOutput,outputStatus,failures};
}
export type FabricationResult = ReturnType<typeof evaluateFabricationFlow>;
