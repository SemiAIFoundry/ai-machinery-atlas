'use client';
import {useEffect, useRef, useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {buildModel} from '@/lib/scene-models';
import {byId} from '@/lib/atlas';
type Props={level:string;records:{id:string;name:string}[];selected:string;onSelect:(id:string)=>void;explode:number;isolate:boolean;reset:number;running?:boolean;labels?:boolean;xray?:boolean;signal?:number;overlay?:string;active?:boolean;lowPower?:boolean};
type Model=ReturnType<typeof buildModel>;
function disposeObjects(root:T.Object3D){
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
 root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
export default function AtlasScene(props:Props){
 const host=useRef<HTMLDivElement>(null),live=useRef(props),refresh=useRef<()=>void>(()=>{});
 const [error,setError]=useState(''),[generation,setGeneration]=useState(0);
 useEffect(()=>{live.current=props;refresh.current();},[props]);
 useEffect(()=>{
  const el=host.current!;let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:!live.current.lowPower,alpha:false,powerPreference:'default'});}catch{setError('3D is unavailable in this browser. The complete lesson, specifications and labs remain available below.');return;}
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.setClearColor(0x070d13,1);el.appendChild(renderer.domElement);
  const scene=new T.Scene();scene.fog=new T.FogExp2(0x070d13,.012);const camera=new T.PerspectiveCamera(37,1,.05,400);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=2.5;controls.maxDistance=150;controls.maxPolarAngle=Math.PI*.87;
  scene.add(new T.HemisphereLight(0xd2eaff,0x132133,2.7));const key=new T.DirectionalLight(0xffffff,3.5);key.position.set(5,10,7);scene.add(key);const rim=new T.DirectionalLight(0x64bfe0,3);rim.position.set(-6,2,-5);scene.add(rim);const warm=new T.DirectionalLight(0xffc697,1.2);warm.position.set(4,-2,-2);scene.add(warm);
  const grid=new T.GridHelper(50,80,0x264353,0x142633);scene.add(grid);
  const labelLayer=document.createElement('div');labelLayer.className='model-labels';el.appendChild(labelLayer);
  let model:Model|null=null,modelKey='',frame=0,time=0,last=performance.now(),lastReset=-1,inView=false,lost=false,disposed=false,dirty=true,lastPaint=0,ratio=0;
  let size=new T.Vector3(5,5,5),lastWidth=0,lastHeight=0,labels:{button:HTMLButtonElement;group:T.Group;anchor:T.Vector3}[]=[];
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const canRender=()=>!disposed&&!lost&&inView&&!document.hidden&&live.current.active!==false;
  function schedule(){if(canRender()&&!frame)frame=requestAnimationFrame(tick);}
  function invalidate(){dirty=true;schedule();}
  function fit(){
   const aspect=Math.max(.1,el.clientWidth/Math.max(1,el.clientHeight));
   const extent=Math.max(size.x/aspect,size.y,size.z*.75,5);
   const distance=extent/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*(live.current.signal===undefined?1.4:1.75);
   camera.position.copy(new T.Vector3(1,.84,1.35).normalize().multiplyScalar(distance));controls.target.set(0,.4,0);controls.update();
  }
  function rebuild(){
   const p=live.current,key=p.level+':'+p.selected;
   if(key===modelKey)return;
   if(model){scene.remove(model.root);disposeObjects(model.root);}
   model=buildModel(p.level,p.selected,p.records.map(r=>r.id));modelKey=key;scene.add(model.root);model.root.updateMatrixWorld(true);size=model.boxBounds.getSize(new T.Vector3());grid.position.y=-size.y/2-.6;
   labelLayer.replaceChildren();labels=[];const seen=new Set<string>();
   for(const group of model.groups){const id=group.userData.id;if(seen.has(id)||!byId[id])continue;seen.add(id);const button=document.createElement('button');button.className='model-label';button.textContent=byId[id].shortName||byId[id].name;button.title=byId[id].name;button.onclick=()=>live.current.onSelect(id);labelLayer.appendChild(button);const bounds=new T.Box3().setFromObject(group),anchor=bounds.getCenter(new T.Vector3());anchor.y=bounds.max.y+.3;group.worldToLocal(anchor);labels.push({button,group,anchor});}
   fit();lastReset=p.reset;dirty=true;
  }
  function syncSize(){
   const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;
   const nextRatio=Math.min(window.devicePixelRatio,live.current.lowPower?1:1.75);
   if(w===lastWidth&&h===lastHeight&&ratio===nextRatio)return;
   lastWidth=w;lastHeight=h;
   if(ratio!==nextRatio){renderer.setPixelRatio(nextRatio);ratio=nextRatio;}
   renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();fit();invalidate();
  }
  function refreshScene(){
   controls.enabled=live.current.active!==false;
   if(!canRender()){cancelAnimationFrame(frame);frame=0;el.dataset.renderState='suspended';return;}
   rebuild();syncSize();invalidate();
  }
  refresh.current=refreshScene;
  function visible(o:T.Object3D):boolean{return o.visible&&(!o.parent||visible(o.parent));}
  const ray=new T.Raycaster(),mouse=new T.Vector2();let down:{x:number;y:number;pointer:number}|null=null;
  const start=(e:PointerEvent)=>{if(e.isPrimary)down={x:e.clientX,y:e.clientY,pointer:e.pointerId};};
  const cancel=()=>{down=null;};
  const pick=(e:PointerEvent)=>{const origin=down;down=null;if(!origin||origin.pointer!==e.pointerId||!model||!canRender()||Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>8)return;const r=el.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(model.root.children,true).find(h=>h.object instanceof T.Mesh&&h.object.userData.id&&byId[h.object.userData.id]&&visible(h.object));if(hit)live.current.onSelect(hit.object.userData.id);};
  renderer.domElement.addEventListener('pointerdown',start);renderer.domElement.addEventListener('pointerup',pick);renderer.domElement.addEventListener('pointercancel',cancel);renderer.domElement.setAttribute('aria-label','Interactive component assembly. Drag to orbit; use component buttons to select a part.');
  const onLost=(e:Event)=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;el.dataset.renderState='unavailable';setError('The 3D connection was interrupted. Your reading progress is saved.');};
  renderer.domElement.addEventListener('webglcontextlost',onLost);
  controls.addEventListener('change',invalidate);
  const resize=new ResizeObserver(syncSize);resize.observe(el);
  const visibility=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??false;refreshScene();},{threshold:.01});visibility.observe(el);
  document.addEventListener('visibilitychange',refreshScene);motion.addEventListener('change',invalidate);
  const mx=new T.Matrix4(),quaternion=new T.Quaternion(),dotScale=new T.Vector3(.046,.046,.046),target=new T.Vector3();
  function tick(now:number){
   frame=0;if(!canRender())return;rebuild();if(!model)return;
   const p=live.current,animate=p.running!==false&&!motion.matches;
   if(animate&&p.lowPower&&!dirty&&now-lastPaint<1000/30){schedule();return;}
   const dt=Math.max(0,Math.min((now-last)/1000,.05));last=now;if(animate)time+=dt;
   if(lastReset!==p.reset){fit();lastReset=p.reset;}
   let settling=false;
   for(const group of model.groups){
    target.copy(group.userData.base).addScaledVector(group.userData.spread,p.explode/100);
    if(group.position.distanceToSquared(target)>.00001){group.position.lerp(target,motion.matches?1:.22);settling=true;}else group.position.copy(target);
    group.visible=!p.isolate||group.userData.id===p.selected;
    if(dirty)group.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial){const selected=group.userData.id===p.selected;o.material.emissive.setHex(selected?0x193e3b:0);o.material.emissiveIntensity=selected?.8:0;if(o.material.userData.baseOpacity===undefined)o.material.userData.baseOpacity=o.material.opacity;const base=o.material.userData.baseOpacity;o.material.opacity=p.xray?(selected?Math.min(base,.7):Math.min(base,.13)):base;o.material.depthWrite=base>.2&&!p.xray;}});
   }
   for(const f of model.flows){for(let i=0;i<7;i++){const v=f.curve.getPoint((time*.15+i/7)%1);mx.compose(v,quaternion,dotScale);f.dots.setMatrixAt(i,mx);}f.dots.instanceMatrix.needsUpdate=true;f.dots.visible=true;}
   model.update?.(p.signal,p.overlay,time);controls.update();renderer.render(scene,camera);lastPaint=now;dirty=false;
   for(const item of labels){const pos=item.group.localToWorld(item.anchor.clone()).project(camera),selected=item.group.userData.id===p.selected;item.button.classList.toggle('active',selected);item.button.style.display=(p.labels!==false&&visible(item.group)&&pos.z<1&&pos.z>-1)?'block':'none';item.button.style.left=(pos.x*.5+.5)*el.clientWidth+'px';item.button.style.top=(-pos.y*.5+.5)*el.clientHeight+'px';item.button.style.zIndex=selected?'4':'3';}
   el.dataset.renderState=animate?'animated':'idle';if(animate||settling)schedule();
  }
  return()=>{disposed=true;refresh.current=()=>{};cancelAnimationFrame(frame);resize.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',refreshScene);motion.removeEventListener('change',invalidate);controls.removeEventListener('change',invalidate);controls.dispose();renderer.domElement.removeEventListener('pointerdown',start);renderer.domElement.removeEventListener('pointerup',pick);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('webglcontextlost',onLost);disposeObjects(scene);renderer.dispose();el.replaceChildren();};
 },[generation]);
 return <div className="scene-canvas"><div ref={host} className="scene-surface"/>{error&&<output className="render-error">{error}<button onClick={()=>{setError('');setGeneration(n=>n+1);}}>Reload 3D</button></output>}</div>;
}
