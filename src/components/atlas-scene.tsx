'use client';
import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildModel } from '@/lib/scene-models';
import { byId } from '@/lib/atlas';
type Props={level:string;records:{id:string;name:string}[];selected:string;onSelect:(id:string)=>void;explode:number;isolate:boolean;reset:number;running?:boolean;labels?:boolean;xray?:boolean;signal?:number};
export default function AtlasScene(props:Props){
 const host=useRef<HTMLDivElement>(null),live=useRef(props);useEffect(()=>{live.current=props;},[props]);const [error,setError]=useState('');
 const variant=['materials','transistor','bit-memory'].includes(props.level)?props.selected:'';
 useEffect(()=>{
  const initial=live.current;const el=host.current!;let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch{queueMicrotask(()=>setError('3D is unavailable in this browser. Every lesson, component, specification, and lab remains available in the field guide.'));return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.setClearColor(0x070d13,1);el.appendChild(renderer.domElement);
  const scene=new T.Scene();scene.fog=new T.FogExp2(0x070d13,.012);const camera=new T.PerspectiveCamera(37,1,.05,250);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=2.5;controls.maxDistance=70;controls.maxPolarAngle=Math.PI*.87;
  scene.add(new T.HemisphereLight(0xd2eaff,0x132133,2.7));const key=new T.DirectionalLight(0xffffff,3.5);key.position.set(5,10,7);scene.add(key);const rim=new T.DirectionalLight(0x64bfe0,3);rim.position.set(-6,2,-5);scene.add(rim);const warm=new T.DirectionalLight(0xffc697,1.2);warm.position.set(4,-2,-2);scene.add(warm);
  const model=buildModel(props.level,initial.selected,initial.records.map(r=>r.id));scene.add(model.root);model.root.updateMatrixWorld(true);
  const size=model.boxBounds.getSize(new T.Vector3());let viewReady=false,frame=0,lastReset=initial.reset,last=performance.now(),time=0,needs=true;
  const grid=new T.GridHelper(50,80,0x264353,0x142633);grid.position.y=-size.y/2-.6;scene.add(grid);
  function fit(){const aspect=Math.max(.55,el.clientWidth/el.clientHeight);const extent=Math.max(size.x/aspect,size.y,size.z*.75,5);const distance=extent/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*1.33;camera.position.copy(new T.Vector3(1,.84,1.35).normalize().multiplyScalar(distance));controls.target.set(0,.4,0);controls.update();}
  const overlay=document.createElement('div');overlay.className='model-labels';el.appendChild(overlay);const labels:{button:HTMLButtonElement;group:T.Group;anchor:T.Vector3}[]=[];const seen=new Set<string>();
  for(const group of model.groups){const id=group.userData.id;if(seen.has(id)||!byId[id])continue;seen.add(id);const button=document.createElement('button');button.className='model-label';button.textContent=byId[id].shortName||byId[id].name;button.title=byId[id].name;button.onclick=()=>live.current.onSelect(id);overlay.appendChild(button);const bounds=new T.Box3().setFromObject(group),anchor=bounds.getCenter(new T.Vector3());anchor.y=bounds.max.y+.3;group.worldToLocal(anchor);labels.push({button,group,anchor});}
  const ray=new T.Raycaster(),mouse=new T.Vector2();let down=[0,0];const start=(e:PointerEvent)=>{down=[e.clientX,e.clientY];};function visible(o:T.Object3D):boolean{return o.visible&&(!o.parent||visible(o.parent));}
  const pick=(e:PointerEvent)=>{if(Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=el.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(model.root.children,true).find(h=>h.object instanceof T.Mesh&&h.object.userData.id&&byId[h.object.userData.id]&&visible(h.object));if(hit)live.current.onSelect(hit.object.userData.id);};
  renderer.domElement.addEventListener('pointerdown',start);renderer.domElement.addEventListener('pointerup',pick);renderer.domElement.setAttribute('aria-label','Drag to orbit the component assembly; use the component list for keyboard selection');
  const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(!viewReady){fit();viewReady=true;}needs=true;});resize.observe(el);
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mx=new T.Matrix4();function tick(now:number){frame=requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;const p=live.current;if(p.running&&!motion&&!document.hidden)time+=dt;
   if(lastReset!==p.reset){fit();lastReset=p.reset;}
   for(const group of model.groups){const target=group.userData.base.clone().addScaledVector(group.userData.spread,p.explode/100);group.position.lerp(target,motion?1:.14);group.visible=!p.isolate||group.userData.id===p.selected;group.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial){const selected=group.userData.id===p.selected;o.material.emissive.setHex(selected?0x193e3b:0);o.material.emissiveIntensity=selected?.8:0;if(o.material.userData.baseOpacity===undefined)o.material.userData.baseOpacity=o.material.opacity;const base=o.material.userData.baseOpacity;o.material.opacity=p.xray?(selected?Math.min(base,.7):Math.min(base,.13)):base;o.material.depthWrite=base>.2&&!p.xray;}});}
   for(const f of model.flows){for(let i=0;i<7;i++){const a=(time*.15+i/7)%1;const v=f.curve.getPoint(a);mx.compose(v,new T.Quaternion(),new T.Vector3(.046,.046,.046));f.dots.setMatrixAt(i,mx);}f.dots.instanceMatrix.needsUpdate=true;f.dots.visible=p.running!==false;}
   controls.update();if(!document.hidden||needs){renderer.render(scene,camera);needs=false;}
   for(const item of labels){const pos=item.group.localToWorld(item.anchor.clone()).project(camera);const isSelected=item.group.userData.id===p.selected;item.button.classList.toggle('active',isSelected);item.button.style.display=(p.labels!==false&&visible(item.group)&&pos.z<1&&pos.z>-1)?'block':'none';item.button.style.left=`${(pos.x*.5+.5)*el.clientWidth}px`;item.button.style.top=`${(-pos.y*.5+.5)*el.clientHeight}px`;item.button.style.zIndex=isSelected?'4':'3';}
  }frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);resize.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',start);renderer.domElement.removeEventListener('pointerup',pick);const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();el.replaceChildren();};
 },[props.level,variant]);
 return <div ref={host} className="scene-canvas">{error&&<output className="render-error">{error}</output>}</div>;
}
