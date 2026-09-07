import catalog from './data/process-mechanisms.json';
export const mechanismRoutes = catalog.routes;
export const mechanismSources = catalog.sources;
export const mechanismFor = (lesson: string) => mechanismRoutes.find(r => r.lessonIds.includes(lesson));
export type Shape = { kind: 'rect' | 'circle' | 'line'; x: number; y: number; w: number; h: number; color: string; label?: string; depth?: number };
export type ProcessDrawing = { shapes: Shape[]; caption: string; measurements: { label: string; value: string }[]; formula?: string; scale: string };
const c = { si: '#789bcc', oxide: '#a5d9de', metal: '#e9ac7e', film: '#ecd88d', resist: '#b59bdf', exposed: '#edbcdf', ncf: '#d5a2c7', muf: '#acc79b', solder: '#d8e3e9', dark: '#315265', red: '#f08079', liquid: '#eeab64', alloy: '#c49cdd' };
/** Authored cross-sections. Coordinates are diagram units, never unlabeled physical dimensions. */
export function processDrawing(route: string, step: number, variant = 'cvd', parameter = 10): ProcessDrawing {
  if (!mechanismRoutes.some(r => r.id === route) || !Number.isInteger(step) || step < 0 || step > 5) throw Error('Unknown process state.');
  const shapes: Shape[] = [], measurements: ProcessDrawing['measurements'] = [];
  const rect = (x:number,y:number,w:number,h:number,color:string,label?:string,depth=45) => shapes.push({kind:'rect',x,y,w,h,color,label,depth});
  const circle = (x:number,y:number,r:number,color:string,label?:string) => shapes.push({kind:'circle',x,y,w:r*2,h:r*2,color,label,depth:12});
  const line = (x:number,y:number,x2:number,y2:number,color=c.metal,label?:string) => shapes.push({kind:'line',x,y,w:x2-x,h:y2-y,color,label});
  const wafer = (y=260) => rect(70,y,460,65,c.si,'Silicon');
  let caption = '', formula: string|undefined, scale = 'Schematic cross-section; thicknesses and feature sizes are exaggerated. Read stated values, not screen distances.';
  if (route === 'hbm-tc-ncf' || route === 'hbm-mr-muf') {
    const film = route === 'hbm-tc-ncf', count = (film ? step >= 4 : step >= 1) ? 3 : 1;
    const joined = film ? step >= 3 : step >= 2;
    rect(110,285,380,30,c.si,'Receiving die');
    for(let layer=0;layer<count;layer++) {
      const gap = joined ? 16 : !film ? 24 : step === 2 ? 28 : 60;
      const bottom = 285-layer*(40+gap), top = bottom-gap-40;
      rect(110,top,380,40,c.si,layer===count-1?'DRAM die':undefined);
      if(film && step >= 1) rect(110,bottom-(joined?16:23),380,joined?16:9,c.ncf,'NCF');
      if(!film && step >= 3) rect(110,bottom-16,380,16,c.muf,layer===0?'Molded underfill':undefined);
      for(const x of [155,225,295,365,435]) { rect(x,top+40,20,joined?16:12,c.solder); rect(x,bottom-4,20,4,c.metal); rect(x+7,top,6,40,c.metal); }
    }
    if(!film && step>=3) { rect(92,105,18,210,c.muf);rect(490,105,18,210,c.muf); circle(200,277,5,c.red,'Synthetic void'); }
    caption = film ? 'Metal bumps carry current; non-conductive film supports the interface. Film is present before thermocompression. Repeated bonds form a stack; test does not change its geometry.' : 'Metallic joints form during the reflow sequence; molded material fills the bonded stack afterward. Some implementations include local stabilization before final reflow. A red void is a synthetic inspection example.';
    measurements.push({label:'Drawn DRAM layers',value:String(count)},{label:'Joint state',value:joined?'Formed, schematic':'Not yet formed'},{label:'Drawing seed',value:'40 µm dies; 9 µm final gap (synthetic)'});
  } else if(route==='hbm-hybrid') {
    const gap=step<3?70:0;
    rect(80,245,440,60,c.si,'Lower die'); rect(80,225,440,20,c.oxide,'Bond dielectric');
    rect(80,130-gap,440,60,c.si,'Upper die'); rect(80,190-gap,440,35,c.oxide);
    for(const x of [135,230,325,420]) {rect(x,step<1?218:225,32,27,c.metal);rect(x,190-gap,32,step<1?40:step>=4?35:31,c.metal);}
    if(step===0)for(let i=0;i<12;i++)rect(85+i*35,220+(i%3)*2,24,5,c.oxide);
    if(step===2)for(const x of [110,200,290,380,470])circle(x,216,3,c.film,'Activated surface');
    caption='Local copper/dielectric interface with no solder bump or polymer film. Planarization and surface preparation precede contact and annealing. Yellow marks denote activated surface sites, not added particles. Nanometer-scale surface relief is exaggerated; contact alone does not certify a continuous electrical bond.';
    measurements.push({label:'Illustrative pad / pitch',value:'1.2 / 2.4 µm'},{label:'Illustrative Cu recess',value:'4 nm after planarization'},{label:'Evidence boundary',value:'Research interface; not a qualified HBM product'});
  } else if(route==='cz-crystal') {
    rect(120,245,360,65,c.oxide,'Crucible');
    if(step===0)for(let i=0;i<7;i++)rect(150+i*38,230-(i%2)*15,28,32,c.solder,'Poly-Si');
    if(step>=1&&step<4)rect(145,248,310,32,c.liquid,'Liquid Si');
    if(step>=2) {const seedTop=step===2?193:70;rect(284,seedTop,32,55,c.si,'Seed');line(300,30,300,seedTop);}
    if(step===3)rect(255,125,90,125,c.si,'Growing crystal');
    if(step>=4) {rect(235,125,130,145,c.si,'Single-crystal ingot');for(let x=249;x<365;x+=20)for(let y=143;y<260;y+=20)circle(x,y,2,c.oxide);}
    caption='An oriented seed meets a silicon melt. Material solidifies at the growth front into an ingot. The melt has no fixed crystal lattice; lattice marks appear only in the solid. The vessel and withdrawal are schematic.';
    measurements.push({label:'State being distinguished',value:step===0?'Polycrystalline feed':step===1?'Liquid':step===2?'Seed meets melt':step===3?'Moving solidification front':'Solid crystalline ingot'});
  } else if(route==='wafer-finishing') {
    for(let i=0;i<24;i++) {const rough=step<3?(i%3)*5:0;rect(70+i*19,215+rough,19,68-rough,c.si);if(step<2)rect(70+i*19,210+rough,19,8,c.red);}
    if(step<4)for(const x of [150,310,445])circle(x,205,5,c.red);
    caption='Slicing and conditioning leave geometry and damage to be managed separately. Material removal and polishing reduce the drawn surface relief; cleaning removes sampled particles. Inspection preserves the final wafer geometry.';
    measurements.push({label:'Synthetic thickness samples',value:'702, 700, 706, 701, 703 µm'},{label:'TTV = max − min',value:'6 µm'},{label:'Midplane displacement',value:'0, 5, 8, 5, 0 µm; distinct from TTV'});formula=String.raw`\operatorname{TTV}=\max_i t_i-\min_i t_i`;
  } else if(route==='epitaxial-stack') {
    wafer();
    if(step===2)for(const x of [90,170,260,370,455])rect(x,251,35,9,c.alloy,'Nucleation');
    if(step>=3)rect(70,236,460,24,c.alloy,'Epitaxial layer');
    if(step>=4){rect(70,216,460,20,c.si,'Si');rect(70,192,460,24,c.alloy,'SiGe');rect(70,172,460,20,c.si);}
    caption='Prepared crystalline surfaces support epitaxial growth. The alternating Si/SiGe stack is one authored example; a single-layer film is also possible. Color denotes composition, not a measured strain or defect field.';
    measurements.push({label:'Synthetic SiGe / Si thickness',value:'10 / 8 nm'},{label:'Drawn repetitions',value:step>=4?'2':'Single-layer progression'});
  } else if(route==='surface-contamination') {
    wafer();
    if(step>=1&&step<=3)for(const x of [165,320,430])circle(x,248,9,c.red,'Particle');
    if(step>=2&&step<=3)for(let x=95;x<515;x+=35)circle(x,256,3,c.film,'Adsorbate');
    if(step===3){line(250,140,300,240,c.oxide,'Selected measurement');line(350,140,300,240,c.oxide);}
    caption='Particles and chemical adsorbates have different representations and measurement requirements. Their apparent sizes are deliberately not to scale. A cleaner drawing does not establish species-specific cleanliness or process readiness.';
    measurements.push({label:'Sampled particles before clean',value:'3 illustrative markers'},{label:'Measurement needed',value:'Species, surface state and sampling scope'});
  } else if(route==='thermal-oxidation') {
    const oxide=[0,4,12,24,40,40][step], consumed=[0,1.7,5.1,10.2,17,17][step], factor=2;
    rect(70,240+consumed*factor,460,90-consumed*factor,c.si,'Remaining silicon');
    if(oxide)rect(70,240-(oxide-consumed)*factor,460,oxide*factor,c.oxide,'Grown SiO₂');
    line(50,240,550,240,c.solder,'Original surface');
    caption='Oxidation consumes silicon while oxide grows above and below the original surface. These paired geometry samples illustrate a moving interface; they are not a fitted recipe or an independent stoichiometric calibration.';
    measurements.push({label:'Oxide thickness',value:`${oxide} nm`},{label:'Consumed silicon',value:`${consumed} nm`});formula=String.raw`x_{\mathrm{ox}}^2+A x_{\mathrm{ox}}=B(t+\tau)`;
  } else if(route==='cvd-pvd') {
    rect(70,250,460,70,c.si,'Feature base');rect(70,130,165,120,c.si);rect(365,130,165,120,c.si);
    if(step>=1){const growth=step===1?.25:step===2?.6:1, bottom=(variant==='pvd'?3:8)*growth;rect(70,130-10*growth,165,10*growth,c.film);rect(365,130-10*growth,165,10*growth,c.film);rect(235,250-bottom,130,bottom,c.film,'Bottom film');rect(235,130,variant==='pvd'?2:7,120,c.film);rect(variant==='pvd'?363:358,130,variant==='pvd'?2:7,120,c.film);}
    caption='Compare two prescribed coverage profiles on the same trench. Directional PVD and reaction/transport-dependent CVD can differ in bottom and sidewall coverage. These cases are examples, not universal coverage laws.';
    measurements.push({label:'Target top film',value:'10 nm'},{label:'Target bottom film',value:variant==='pvd'?'3 nm (PVD case)':'8 nm (CVD case)'},{label:'Feature width / depth',value:'100 / 200 nm'});formula=String.raw`S_{\mathrm{bottom}}=t_{\mathrm{bottom}}/t_{\mathrm{top}}`;
  } else if(route==='ald-cycle') {
    wafer();
    if(step>=1)for(let x=100;x<530;x+=40)circle(x,254,6,step>=3?c.film:c.red,step>=3?'Reacted surface':'Bound A');
    if(step===1||step===3)for(let i=0;i<9;i++)circle(115+i*45,160+(i%3)*20,5,step===1?c.red:c.oxide,step===1?'A pulse':'B pulse');
    if(step>=4)rect(70,250,460,8,c.film,'Film increment');
    caption='A and B exposures are separated by purges. Purging removes gas-phase species while the reacted surface remains. A cycle is not guaranteed to deposit one complete atomic plane; growth can include a nucleation delay.';
    measurements.push({label:'Synthetic steady growth',value:'0.08 nm / cycle'},{label:'100 cycles; 10-cycle delay',value:'7.2 nm accumulated film'});formula=String.raw`t=g\max(0,N-N_0)`;
  } else if(route==='resist-track') {
    wafer();rect(70,225,460,35,c.film,'Target film — intact');
    if(step>=1&&step<=3){rect(70,150,460,75,c.resist,'Positive resist');if(step===3)rect(265,150,70,75,c.exposed,'Latent image');}
    if(step>=4){rect(70,150,195,75,c.resist,'Retained resist');rect(335,150,195,75,c.resist);}
    caption='Exposure changes resist chemistry; it does not instantly remove the exposed material. Development opens positive resist while leaving the target film intact. After-etch CD is a separate downstream measurement, not another development state.';
    measurements.push({label:'Developed resist opening',value:'24 nm'},{label:'Separate after-etch comparison',value:'21 nm; transfer bias −3 nm'});formula=String.raw`\Delta\mathrm{CD}=\mathrm{CD}_{\mathrm{etch}}-\mathrm{CD}_{\mathrm{develop}}`;
  } else if(route==='mask-opc') {
    rect(100,95,90,210,c.dark,'Target');rect(260,110,70,180,c.solder,step>=3?'Candidate mask':'Initial mask');
    if(step>=3){rect(250,100,90,20,c.solder);rect(250,280,90,20,c.solder);}
    if(step>=2)rect(step>=4?425:437,step>=4?100:115,step>=4?80:55,step>=4?200:170,c.resist,'Prescribed wafer contour');
    caption='Target, mask and wafer contour remain separate objects. Corner features modify the candidate mask; the displayed contour improvement is prescribed, not calculated by an optical solver. Measured calibration would be required for production OPC.';
    measurements.push({label:'Target edges',value:'0, 24 nm'},{label:'Uncorrected squared edge error',value:'8 nm²'},{label:'Corrected squared edge error',value:'0.5 nm²'});formula=String.raw`E=\sum_i(e_i-e_i^{\mathrm{target}})^2`;scale='Pattern-plane comparison in separate lanes. No common physical mask-to-wafer scale is implied.';
  } else if(route==='lithography-optics') {
    const na=Math.max(.5,Math.min(2,parameter/10));
    line(300,60,190,270,c.oxide);line(300,60,410,270,c.oxide);rect(160,280,280,15,c.resist,'Image plane');
    if(step>=1)line(300-70*na,175,300+70*na,175,c.metal,'Relative aperture');
    if(step>=2)rect(300-35/na,263,70/na,12,c.exposed,'Resolution bound');
    if(step>=3){line(450,280-30/(na*na),450,280+30/(na*na),c.oxide,'Focus range');}
    caption='An abstract aperture diagram accompanies relative resolution and depth-of-focus bounds. This is neither a DUV lens assembly nor an EUV mirror prescription. Resist behavior and transfer still require separate evidence.';
    measurements.push({label:'Relative NA',value:na.toFixed(2)},{label:'Relative resolution bound',value:(1/na).toFixed(3)},{label:'Relative depth of focus',value:(1/na**2).toFixed(3)});formula=String.raw`R\propto\lambda/\mathrm{NA},\qquad\mathrm{DOF}\propto\lambda/\mathrm{NA}^2`;scale='Optical abstraction; normalized bounds hold wavelength and process coefficients fixed.';
  } else if(route==='etch-transfer') {
    const selectivity=Math.max(2,Math.min(20,parameter)), depth=step===0?0:step===1?20:step===2?100:200, consumed=depth/selectivity, remain=Math.max(0,40-consumed), h=depth*.65;
    rect(70,160,180,160,c.si,'Target');rect(350,160,180,160,c.si);rect(250,160+h,100,160-h,c.si);
    if(remain){rect(70,160-remain,180,remain,c.resist,'Remaining mask');rect(350,160-remain,180,remain,c.resist);}
    if(step>=4)for(const x of [258,340])circle(x,160+h-4,4,c.red,'Inspection marker');
    caption=consumed>40?'The requested depth exhausts the mask budget. Geometry is a requested profile, not a feasible result; no selectivity model predicts the failed final shape.':'Directional target removal consumes a finite mask. Residue inspection preserves the etched geometry. This route illustrates removal; it does not deposit or fill copper.';
    measurements.push({label:'Requested target depth',value:`${depth} nm`},{label:'Target / mask selectivity',value:String(selectivity)},{label:'Mask consumed / remaining',value:`${consumed.toFixed(1)} / ${remain.toFixed(1)} nm`},{label:'Mask budget',value:consumed>40?'Exhausted — requested profile unqualified':'Within this thickness-only budget'});formula=String.raw`\Delta t_{\mathrm{mask}}=d_{\mathrm{target}}/S`;
  }
  return { shapes, caption, measurements, formula, scale };
}
