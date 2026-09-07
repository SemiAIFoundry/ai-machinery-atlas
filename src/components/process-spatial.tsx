import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ProcessDrawing } from '../lib/process-mechanisms';
export default function ProcessSpatial({drawing,selected}:{drawing:ProcessDrawing;selected:string}) {
 const host=useRef<HTMLDivElement>(null), latest=useRef({drawing,selected}), update=useRef(()=>{}), [error,setError]=useState('');
 useEffect(()=>{latest.current={drawing,selected};update.current();},[drawing,selected]);
 useEffect(()=>{
  const el=host.current!;let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});}catch{setError('3D is unavailable. Use the cross-section and material legend to inspect the same mechanism.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#091822');el.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Extruded process cross-section. Drag to orbit; the cross-section and text carry the same mechanism.');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,200),controls=new OrbitControls(camera,renderer.domElement);camera.position.set(3,2,16);controls.target.set(0,0,0);controls.enableDamping=false;controls.minDistance=.5;controls.maxDistance=35;controls.update();
  scene.add(new T.HemisphereLight('#f0f7ff','#20392c',3));const light=new T.DirectionalLight('#fff4db',3);light.position.set(5,8,12);scene.add(light);
  let group=new T.Group(),frame=0,visible=true,disposed=false;
  const fit=()=>{const box=new T.Box3().setFromObject(group);if(box.isEmpty())return;const center=box.getCenter(new T.Vector3()),radius=box.getSize(new T.Vector3()).length()/2,angle=Math.min(camera.fov*Math.PI/360,Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect)),distance=1.12*radius/Math.sin(angle);const direction=camera.position.clone().sub(controls.target).normalize();controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);controls.minDistance=Math.max(.2,radius*.5);controls.maxDistance=Math.max(35,distance*3);controls.update();};
  const render=()=>{if(!disposed&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(()=>{frame=0;renderer.render(scene,camera);});};
  const clear=()=>{group.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});scene.remove(group);};
  const rebuild=()=>{clear();group=new T.Group();for(const s of latest.current.drawing.shapes){const active=!latest.current.selected||s.label===latest.current.selected;if(s.kind==='line'){const points=[new T.Vector3((s.x-300)/50,(180-s.y)/50,.65),new T.Vector3((s.x+s.w-300)/50,(180-s.y-s.h)/50,.65)];group.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:s.color})));continue;}const geometry=s.kind==='circle'?new T.CylinderGeometry(s.w/100,s.w/100,(s.depth||12)/50,20):new T.BoxGeometry(s.w/50,s.h/50,(s.depth||45)/50);const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:s.color,roughness:.65,transparent:!active,opacity:active?1:.22,depthWrite:active}));if(s.kind==='circle')mesh.rotation.x=Math.PI/2;mesh.position.set((s.x+(s.kind==='rect'?s.w/2:0)-300)/50,(180-s.y-(s.kind==='rect'?s.h/2:0))/50,0);group.add(mesh);}scene.add(group);fit();render();};
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();fit();render();};
  update.current=rebuild;rebuild();resize();const ro=new ResizeObserver(resize);ro.observe(el);const io=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;render();});io.observe(el);const lost=(event:Event)=>{event.preventDefault();setError('The graphics context was interrupted. Return to Cross-section to continue.');};renderer.domElement.addEventListener('webglcontextlost',lost);controls.addEventListener('change',render);document.addEventListener('visibilitychange',render);
  return()=>{disposed=true;update.current=()=>{};cancelAnimationFrame(frame);ro.disconnect();io.disconnect();controls.dispose();document.removeEventListener('visibilitychange',render);renderer.domElement.removeEventListener('webglcontextlost',lost);clear();renderer.dispose();el.replaceChildren();};
 },[]);
 return <><div className="process-spatial" ref={host}/>{error&&<p role="status">{error}</p>}</>;
}
