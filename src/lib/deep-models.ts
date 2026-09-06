import * as T from 'three';
type Group=T.Group&{userData:{id:string;base:T.Vector3;spread:T.Vector3;label:T.Vector3}};
export const deepFamilies=['process-wafer','process-tool','device-crosssection','package-route','hbm-detail','architecture-cpu','architecture-gpu','architecture-array','design-flow','signal-power','memory-route','software-flow','fab-operations','capacity-flow','rack-system','hall-system','world-network','orbital-system','model-workload'];
export function buildDeepModel(family:string,selected:string){
 const root=new T.Group(),groups:Group[]=[],flows:{curve:T.CatmullRomCurve3;dots:T.InstancedMesh;color:number}[]=[];const switches:{object:T.Object3D;from:number;to:number}[]=[];
 const c={silicon:0x6b8cad,oxide:0xa8a1d4,copper:0xe5a272,logic:0x74ddc8,memory:0x8599dc,steel:0x617b88,blue:0x67b1ef,dark:0x203e4c};
 const boxGeo=new T.BoxGeometry(1,1,1),sphereGeo=new T.SphereGeometry(1,20,14);
 const material=(color:number,opacity=1)=>new T.MeshStandardMaterial({color,roughness:.34,metalness:.38,transparent:true,opacity});
 const group=(id:string,p=[0,0,0],spread=[0,0,0])=>{const g=new T.Group() as Group;g.position.fromArray(p);g.userData={id,base:g.position.clone(),spread:new T.Vector3(...spread),label:new T.Vector3(0,.7,0)};root.add(g);groups.push(g);return g;};
 const mesh=(g:T.Group,geo:T.BufferGeometry,p:number[],scale:number[],color:number,opacity=1)=>{const m=new T.Mesh(geo,material(color,opacity));m.position.fromArray(p);m.scale.fromArray(scale);m.userData.id=g.userData.id;g.add(m);return m;};
 const box=(g:T.Group,p:number[],s:number[],color:number,opacity=1)=>mesh(g,boxGeo,p,s,color,opacity);
 const ball=(g:T.Group,p:number[],r:number,color:number)=>mesh(g,sphereGeo,p,[r,r,r],color);
 const cylinder=(g:T.Group,p:number[],r:number,h:number,color:number)=>mesh(g,new T.CylinderGeometry(r,r,h,48),p,[1,1,1],color);
 const wire=(g:T.Group,points:number[][],color:number,r=.035)=>{const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(g,new T.TubeGeometry(curve,32,r,6,false),[0,0,0],[1,1,1],color);};
 const tiles=(g:T.Group,nx:number,nz:number,p:number[],dx:number,dz:number,color:number,h=.1)=>{const m=new T.InstancedMesh(boxGeo,material(color),nx*nz),matrix=new T.Matrix4();let i=0;for(let x=0;x<nx;x++)for(let z=0;z<nz;z++){matrix.compose(new T.Vector3(p[0]+x*dx,p[1],p[2]+z*dz),new T.Quaternion(),new T.Vector3(dx*.78,h,dz*.78));m.setMatrixAt(i++,matrix);}m.userData.id=g.userData.id;g.add(m);return m;};
 const at=(o:T.Object3D,from:number,to=5)=>{switches.push({object:o,from,to});return o;};
 const wafer=(g:T.Group,p:number[],r=2.1)=>{cylinder(g,p,r,.13,c.silicon);for(let x=-r+.25;x<r;x+=.36)for(let z=-r+.25;z<r;z+=.36)if(x*x+z*z<(r-.15)**2)box(g,[p[0]+x,p[1]+.09,p[2]+z],[.29,.02,.29],c.dark);};
 const rack=(g:T.Group,p:number[],s=1)=>{for(const x of [-.6,.6])for(const z of [-.5,.5])box(g,[p[0]+x*s,p[1],p[2]+z*s],[.06*s,3.7*s,.06*s],c.steel);for(let i=0;i<10;i++){box(g,[p[0],p[1]-1.6*s+i*.34*s,p[2]],[1.12*s,.23*s,.9*s],i%3===0?c.memory:c.dark);for(let j=0;j<4;j++)box(g,[p[0]-.4*s+j*.27*s,p[1]-1.6*s+i*.34*s,p[2]+.46*s],[.08*s,.025*s,.02*s],c.logic);}};
 const main=group(selected);
 if(family==='process-wafer'){
  box(main,[0,-.55,0],[6,.35,4],c.silicon);at(box(main,[0,-.17,0],[6,.4,4],c.oxide),0,1);
  for(let x=-2.6;x<3;x+=1.3){at(box(main,[x,.16,0],[.6,.2,3.9],0x5da590),1,2);at(box(main,[x,-.17,0],[.8,.4,4],c.oxide),2,5);at(box(main,[x+.65,-.32,0],[.45,.07,4],c.copper),3,5);at(box(main,[x+.65,-.08,0],[.43,.35,4],c.copper),3,5);}
  at(box(main,[0,.18,0],[6,.16,4],c.copper),3,3);
  const waferContext=group('silicon-wafer',[-4,-.7,-3],[-1,0,0]);wafer(waferContext,[0,0,0],1.25);
  const pad=at(cylinder(main,[0,1.2,0],2.9,.25,c.steel),4,4);pad.rotation.x=.07;
  at(wire(main,[[-3,.5,-1.5],[0,.5,-1.5],[3,.5,-1.5]],c.logic,.03),5,5);
 }else if(family==='process-tool'||family==='fab-operations'){
  cylinder(main,[0,-.2,0],2.1,.22,c.steel);cylinder(main,[0,1.7,0],2.25,.18,c.steel);
  mesh(main,new T.CylinderGeometry(2.2,2.2,1.9,48,1,true),[0,.7,0],[1,1,1],c.blue,.1);wafer(main,[0,.05,0],1.4);
  for(let i=-2;i<=2;i++){wire(main,[[i*.55,2.7,0],[i*.55,1.4,0]],c.copper,.045);at(ball(main,[i*.5,.85,0],.08,c.logic),1,3);}
  wire(main,[[2,0,0],[3,0,0],[3,-.8,0],[4,-.8,0]],c.blue,.16);cylinder(main,[4,-.7,0],.5,.7,c.steel);
  box(main,[-3.4,-.05,0],[1.2,.6,1.2],c.dark);wire(main,[[-3.4,.3,0],[-2,.3,0],[0,.3,0]],c.logic,.07);
  if(family==='fab-operations'){for(let j=0;j<4;j++){box(main,[j*1.8-2.7,0,-4],[1.3,1.7,1.2],j%2?c.blue:c.steel);wire(main,[[j*1.8-2.7,2,-4],[j*1.8-2.7,2,0]],c.logic,.04);}wire(main,[[-3,2,-4],[3,2,-4]],c.copper,.08);}
 }else if(family==='device-crosssection'){
  box(main,[0,-1,0],[6,.4,3.8],c.silicon);
  for(let j=0;j<3;j++){box(main,[0,j*.45-.5,0],[4,.16,1.5],c.logic);at(box(main,[0,j*.45-.28,0],[4,.23,1.5],c.oxide),0,2);}
  for(const x of [-2.2,2.2])at(box(main,[x,.1,0],[1,1.6,2],c.copper),2,5);
  const fin=/fin/.test(selected);if(fin){box(main,[0,0,0],[4,1.5,.3],c.logic);}
  at(box(main,[0,1.2,0],[1.3,.25,2.2],c.memory),4,5);for(const z of [-1,1])at(box(main,[0,.4,z],[1.3,1.5,.2],c.memory),4,5);
  for(let j=0;j<2;j++)at(box(main,[0,j*.45-.25,0],[1.3,.2,2.1],c.memory),4,5);
  for(const x of [-2.2,2.2])at(box(main,[x,1.35,0],[.55,1.1,.55],c.steel),5,5);
  if(/beol|contact|backside|via|wiring/.test(selected)){for(let y=0;y<4;y++)for(let x=-2;x<=2;x++)box(main,y%2?[0,1.5+y*.4,x*.55]:[x*.7,1.5+y*.4,0],y%2?[5,.12,.14]:[.14,.12,3.6],y%2?c.copper:c.blue);}
 }else if(family==='package-route'||family==='signal-power'){
  const vertical=/soic|foveros|3d|hybrid/.test(selected),emib=/emib/.test(selected),local=/cowos-l|bridge/.test(selected),rdl=/cowos-r|rdl|fan-out/.test(selected);
  box(main,[0,-.9,0],[7,.45,5],c.dark);for(let y=0;y<3;y++)for(let z=-2;z<=2;z+=.5)box(main,[0,-.75+y*.1,z],[6.8,.025,.035],y%2?c.copper:c.blue);
  if(emib){for(const x of [-1.1,1.1])at(box(main,[x,-.62,0],[1.1,.16,3.5],c.silicon),1);}
  else if(local){at(box(main,[0,-.48,0],[6.5,.12,4.6],c.oxide),1);for(const x of [-1.1,1.1])at(box(main,[x,-.43,0],[.8,.08,3.5],c.silicon),1);}
  else at(box(main,[0,-.45,0],[6.5,rdl?.07:.2,4.6],rdl?c.oxide:c.silicon),1);
  for(let z=-1.9;z<=2;z+=.14)at(box(main,[0,-.29,z],[6.3,.016,.018],c.copper),1);
  at(tiles(main,14,10,[-2.8,-.18,-1.8],.43,.4,c.copper,.08),3);
  const die=group('gpu-die',[0,0,0],[0,1.4,0]);for(const x of [-.78,.78]){at(box(die,[x,0,0],[1.38,.22,3.2],c.logic),2);tiles(die,4,8,[x-.48,.14,-1.3],.3,.35,c.dark,.04);}
  if(vertical){at(box(main,[0,.6,0],[2.5,.2,2.9],c.memory),3);at(tiles(main,12,12,[-1.1,.43,-1.3],.2,.23,c.copper,.07),3);}
  else {const memory=group('hbm-stack',[0,0,0],[1.1,.6,0]);for(const x of [-2.5,2.5])for(const z of [-1.65,-.55,.55,1.65])for(let y=0;y<8;y++)at(box(memory,[x,y*.065,z],[.8,.05,.85],y===7?c.copper:c.memory),2);}
  if(family==='signal-power'){wire(main,[[-3,-.85,-1.7],[0,-.85,-1.7],[0,-.2,0]],c.copper,.09);for(let i=0;i<5;i++)cylinder(main,[-2.8+i*.3,-.35,2],.09,.25,c.blue);wire(main,[[-1.1,.2,1.7],[0,.2,1.7],[1.1,.2,1.7]],c.logic,.05);}
  at(box(main,[0,1.1,0],[5.9,.15,4.1],c.steel,.25),4);
 }else if(family==='hbm-detail'){
  box(main,[0,-1.5,0],[3.6,.2,3.2],c.logic);tiles(main,8,8,[-1.4,-1.35,-1.2],.4,.34,c.dark,.04);
  for(let y=0;y<8;y++){const g=group(selected,[0,-1.12+y*.26,0],[0,y*.25,0]);at(box(g,[0,0,0],[3.3,.16,2.9],c.memory),Math.min(3,y>1?3:0));tiles(g,6,6,[-1.3,.1,-1.1],.45,.4,c.dark,.025);}
  const via=group('through-silicon-via',[0,0,0],[2.2,0,0]);for(const x of [-1,0,1])for(const z of [-.8,0,.8])cylinder(via,[x,0,z],.045,3.2,c.copper);
  const controller=group('hbm-controller',[3,-1.2,0],[1,0,0]);box(controller,[0,0,0],[1.1,.2,2.8],c.logic);for(let z=-1;z<=1;z+=.2)wire(main,[[1.6,-1.3,z],[3,-1.3,z]],c.copper,.02);
 }else if(family==='architecture-cpu'){
  box(main,[0,-.4,0],[8,.15,5],c.dark);for(let i=0;i<5;i++){box(main,[-3+i*1.4,0,-1.5],[1.1,.35,.9],[c.blue,c.memory,c.copper,c.logic,c.blue][i]);wire(main,[[-2.5+i*1.4,.12,-1.5],[-1.8+i*1.4,.12,-1.5]],c.logic,.03);}
  tiles(main,12,4,[-3,.1,.1],.5,.4,c.memory,.12);for(let i=0;i<4;i++)box(main,[-2.6+i*1.7,.6,1.6],[1.25,.28,.7],c.logic);wire(main,[[-2,.7,-1.5],[-2,1.3,0],[2,1.3,0],[2,.6,1.6]],c.copper,.04);box(main,[3.3,.1,.3],[.6,.5,2.1],c.blue);
 }else if(family==='architecture-gpu'){
  box(main,[0,-.3,0],[7,.15,6],c.dark);for(let x=0;x<4;x++)for(let z=0;z<4;z++){box(main,[x*1.6-2.4,0,z*1.4-2.1],[1.35,.12,1.15],c.silicon);tiles(main,4,4,[x*1.6-2.88,.14,z*1.4-2.5],.27,.25,c.logic,.07);box(main,[x*1.6-2.4,.3,z*1.4-2.1],[.5,.15,.5],c.copper);}for(const x of [-3.7,3.7])tiles(main,2,12,[x,0,-2.5],.22,.44,c.memory,.25);
 }else if(family==='architecture-array'){
  if(/wafer/.test(selected)){wafer(main,[0,0,0],3.4);for(let x=-2.5;x<=2.5;x+=.5)for(let z=-2.5;z<=2.5;z+=.5)if(x*x+z*z<9)box(main,[x,.2,z],[.35,.17,.35],c.logic);}
  else if(/photon|optic/.test(selected)){box(main,[0,-.3,0],[7,.15,5],c.silicon);for(let i=0;i<6;i++){wire(main,[[-3,.1,i*.6-1.5],[-1,.1,i*.6-1.5],[1,.1,1.5-i*.6],[3,.1,1.5-i*.6]],c.blue,.045);for(let j=0;j<3;j++){const ring=new T.Mesh(new T.TorusGeometry(.28,.025,8,32),material(c.copper));ring.rotation.x=Math.PI/2;ring.position.set(j*1.7-1.7,.1,i*.6-1.5);ring.userData.id=selected;main.add(ring);}}}
  else if(/fpga/.test(selected)){for(let x=0;x<5;x++)for(let z=0;z<5;z++){box(main,[x-2,0,z-2],[.65,.18,.65],(x+z)%3?c.memory:c.logic);if(x<4)wire(main,[[x-1.6,.2,z-2],[x-1.4,.2,z-2]],c.copper,.025);if(z<4)wire(main,[[x-2,.2,z-1.6],[x-2,.2,z-1.4]],c.blue,.025);}}
  else {for(let x=0;x<6;x++)for(let z=0;z<6;z++){box(main,[x*.75-1.9,0,z*.75-1.9],[.5,.25,.5],c.logic);if(x<5)wire(main,[[x*.75-1.65,.1,z*.75-1.9],[x*.75-1.4,.1,z*.75-1.9]],c.copper,.025);if(z<5)wire(main,[[x*.75-1.9,.15,z*.75-1.65],[x*.75-1.9,.15,z*.75-1.4]],c.blue,.025);}tiles(main,1,6,[-3,0,-1.9],.4,.75,c.copper,.2);tiles(main,6,1,[-1.9,0,-3],.75,.4,c.blue,.2);}
 }else if(family==='memory-route'){
  const ids=['register-file','shared-sram','l2-cache','hbm-stack','ddr-memory','storage'];ids.forEach((id,i)=>{const g=group(id,[i*1.45-3.6,0,0],[0,i*.3,0]);const n=i+2;tiles(g,n,Math.min(n,6),[-n*.065,0,-n*.065],.13,.13,i<3?c.logic:c.memory,.12);for(let y=1;y<=i;y++)box(g,[.1,y*.2,.1],[.6,.1,.8],i===3?c.memory:c.steel);if(i<5)wire(main,[[i*1.45-3.15,.15,0],[i*1.45-2.55,.15,0]],c.copper,.03);});box(main,[0,-.4,0],[9,.08,2],c.dark);
 }else if(family==='software-flow'||family==='design-flow'||family==='model-workload'){
  for(let i=0;i<6;i++){const n=family==='model-workload'?8+i:5;tiles(main,n,4,[-n*.15,(i-2.5)*.7,-.6],.32,.4,i<2?c.blue:i<4?c.memory:c.logic,.1);if(i<5)wire(main,[[2,(i-2.5)*.7,0],[2.8,(i-2)*.7,0],[2,(i-1.5)*.7,0]],c.copper,.035);}
  if(family==='design-flow')wire(main,[[-2.5,-1.8,0],[-3.5,0,0],[-2.5,1.7,0]],c.copper,.06);
 }else if(family==='capacity-flow'){
  wafer(main,[-3,1,-1],1.1);wafer(main,[-3,-.6,1],1.1);box(main,[0,0,0],[1.6,.3,2],c.logic);for(const z of [-1,1])wire(main,[[-2,1-z*.8,z],[0,.3,z],[1,.3,0]],c.copper,.065);rack(main,[3,.1,0],.75);wire(main,[[1,.3,0],[2,.3,0],[3,.3,0]],c.blue,.09);
 }else if(family==='rack-system'){
  rack(main,[0,0,0],1.5);for(let i=0;i<4;i++)wire(main,[[-1.1,-2.2+i*1.2,-.7],[-1.5,-2.2+i*1.2,-1.1],[1.2,2-i*.7,-1.1]],i%2?c.logic:c.blue,.04);wire(main,[[-1.3,-2.5,.5],[-1.3,2.5,.5]],c.blue,.09);wire(main,[[1.3,-2.5,.5],[1.3,2.5,.5]],c.copper,.09);
 }else if(family==='hall-system'){
  for(let x=0;x<4;x++)for(let z=0;z<3;z++)rack(main,[(x-1.5)*1.8,0,(z-1)*2.3],.85);box(main,[0,-1.9,0],[9,.13,8],c.dark);for(let i=0;i<3;i++){wire(main,[[-4.8,1,i*2.3-2.3],[-3,1,i*2.3-2.3],[3.5,1,i*2.3-2.3]],c.blue,.07);box(main,[-5,-.2,i*2.3-2.3],[.8,2,1.1],c.steel);}for(let i=0;i<3;i++)cylinder(main,[i*2-2,0,-5],.6,1.6,c.steel);
 }else if(family==='world-network'){
  ball(main,[0,0,0],2.5,c.dark);for(let lat=-60;lat<=60;lat+=30){const pts=[];for(let a=0;a<=64;a++){const phi=a/64*Math.PI*2;pts.push([2.52*Math.cos(lat*Math.PI/180)*Math.cos(phi),2.52*Math.sin(lat*Math.PI/180),2.52*Math.cos(lat*Math.PI/180)*Math.sin(phi)]);}wire(main,pts,c.blue,.009);}for(let a=0;a<10;a++){const p=[Math.sin(a*2.4)*2.6,Math.cos(a*1.2)*1.7,Math.cos(a*2.4)*2.1];ball(main,p,.06,c.copper);} 
 }else if(family==='orbital-system'){
  const earth=group(selected,[0,-2.7,0]);ball(earth,[0,0,0],1.6,c.blue);box(main,[0,.5,0],[1.1,.75,.9],c.steel);for(const sign of [-1,1]){box(main,[sign*2,.5,0],[2.7,.04,1.8],0x254f8e);tiles(main,8,5,[sign*2-1.15,.53,-.7],.3,.3,c.blue,.02);box(main,[sign*1.25,1.15,-1.3],[1.2,.06,2.1],c.copper);}wire(main,[[0,.5,0],[1,-1,1],[0,-2.7,1.65]],c.logic,.025);const pts=[];for(let a=0;a<=64;a++){const angle=a/64*Math.PI*2;pts.push([4*Math.cos(angle),-2.7+3.5*Math.sin(angle),0]);}wire(main,pts,c.memory,.012);
 }
 if(main.children.length===0)box(main,[0,0,0],[1,1,1],c.logic);
 const boxBounds=new T.Box3().setFromObject(root),center=boxBounds.getCenter(new T.Vector3());
 const overlays=new T.Group();main.add(overlays);const overlayPaths:Record<string,number[][]>={bytes:[[-3,.2,0],[-1,.2,0],[0,.4,0],[2,.4,0],[3,.2,0]],power:[[0,-2,1],[0,-.7,1],[0,0,0]],heat:[[0,.1,0],[0,1.6,0],[2,2,0],[3,2,0]],material:[[-3,1,-1],[-1,.4,-1],[0,0,0],[2,.1,0],[3,.1,1]]};const traces:{kind:string;line:T.Mesh;dots:T.Mesh[];curve:T.CatmullRomCurve3}[]=[];
 for(const [kind,points] of Object.entries(overlayPaths)){const color=kind==='heat'?c.copper:kind==='power'?c.blue:kind==='material'?c.memory:c.logic;const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const line=new T.Mesh(new T.TubeGeometry(curve,32,.04,6,false),new T.MeshBasicMaterial({color,transparent:true,opacity:.7}));overlays.add(line);const dots=Array.from({length:5},()=>{const dot=new T.Mesh(sphereGeo,new T.MeshBasicMaterial({color}));dot.scale.setScalar(.085);overlays.add(dot);return dot;});traces.push({kind,line,dots,curve});}
 root.position.sub(center);
 const update=(progress:number|undefined,overlay:string|undefined,time:number)=>{const step=progress===undefined?5:Math.max(0,Math.min(5,Math.floor(progress)));switches.forEach(s=>{s.object.visible=progress===undefined?!(s.to<5):step>=s.from&&step<=s.to;});if(family==='process-tool'&&progress!==undefined)main.rotation.y=Math.sin(time*.3)*.04;
  for(const trace of traces){const show=overlay===trace.kind;trace.line.visible=show;trace.dots.forEach((dot,i)=>{dot.visible=show;dot.position.copy(trace.curve.getPoint((time*.15+i/5)%1));});}
 };
 return {root,groups,flows,center,boxBounds,update};
}
