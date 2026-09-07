import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { systemScenario, switchingScenario, attentionScenario, type InvestigationId, type Scenario } from '../lib/investigation-models';

const colors = { silicon: '#6f99cb', memory: '#73bca5', copper: '#e2b47f', dielectric: '#d5e5e6', logic: '#a8a1e3', rejected: '#ad6065', frame: '#1e4352' };
function dispose(root: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
  root.traverse(o => { if (o instanceof T.Mesh || o instanceof T.Line) { geometries.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); } });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}
function spatialModel(id: InvestigationId, s: Scenario) {
  const root = new T.Group(), system = systemScenario(s), circuit = switchingScenario(s);
  const material = (color: string) => new T.MeshStandardMaterial({ color, roughness: .55, metalness: .2 });
  function box(x: number, y: number, z: number, w: number, h: number, d: number, color: string, parent: T.Group = root) { const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material(color)); mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
  function cylinder(x: number, y: number, z: number, radius: number, height: number, color: string, parent: T.Group = root) { const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, height, 48), material(color)); mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
  function line(points: number[][], color: string, parent: T.Group = root) { const geometry = new T.BufferGeometry().setFromPoints(points.map(p => new T.Vector3(...p as [number, number, number]))); parent.add(new T.Line(geometry, new T.LineBasicMaterial({ color }))); }
  function stack(x: number, z: number, scale = 1, parent: T.Group = root) {
    const g = new T.Group(); g.position.set(x, .2, z); g.scale.setScalar(scale); parent.add(g);
    box(0, 0, 0, 2.1, .2, 2.1, colors.logic, g);
    const dieHeight = .16, gap = s.route === 'hybrid' ? .025 : .11;
    for (let i = 0; i < s.dies; i++) {
      const y = .3 + i * (dieHeight + gap);
      box(0, y, 0, 1.9, dieHeight, 1.9, colors.memory, g);
      if (s.route !== 'hybrid') box(0, y - dieHeight / 2 - gap / 2, 0, 1.85, gap * .8, 1.85, s.route === 'tc-ncf' ? '#627a87' : '#a19279', g);
      for (const a of [-.65, 0, .65]) for (const b of [-.65, 0, .65]) cylinder(a, y - dieHeight / 2 - gap / 2, b, .055, gap + .18, colors.copper, g);
    }
    if (s.route === 'mr-muf') { box(-1.03, (s.dies * (dieHeight + gap)) / 2, 0, .1, s.dies * (dieHeight + gap), 2.1, '#a19279', g); box(1.03, (s.dies * (dieHeight + gap)) / 2, 0, .1, s.dies * (dieHeight + gap), 2.1, '#a19279', g); }
    return g;
  }
  function packageModel() {
    box(0, -.4, 0, 10, .3, 7, '#294d4b'); box(0, -.12, 0, 8.8, .14, 5.8, colors.silicon);
    box(-1.45, .2, 0, 2.5, .4, 2.6, colors.logic); box(1.45, .2, 0, 2.5, .4, 2.6, colors.logic);
    for (const x of [-3.3, -1.1, 1.1, 3.3]) for (const z of [-2.1, 2.1]) { stack(x, z, .6); line([[x, .2, z], [x, .2, 0]], colors.copper); }
  }
  function rack(x: number, z: number) {
    const g = new T.Group(); g.position.set(x, 0, z); root.add(g);
    box(-1.05, 2.7, 0, .12, 5.8, 1.6, '#344858', g); box(1.05, 2.7, 0, .12, 5.8, 1.6, '#344858', g);
    for (let row = 0; row < 8; row++) { box(0, row * .66 + .15, 0, 2, .06, 1.7, colors.frame, g); for (let col = 0; col < 8; col++) box(-.82 + col * .23, row * .66 + .33, .55, .17, .3, .55, colors.logic, g); }
    line([[-1.35, -.3, .7], [-1.35, 5.6, .7], [1.35, 5.6, .7]], colors.copper, g);
    line([[1.35, -.3, -.7], [1.35, 5.6, -.7]], '#7bbde0', g);
  }
  let caption = '';
  if (id === 'manufacturing') {
    if (s.processStep <= 1) {
      for (const [x, color, fraction] of [[-4, colors.logic, system.logicWafer.poisson], [4, colors.memory, system.memoryWafer.poisson]] as const) {
        cylinder(x, -.1, 0, 3.2, .14, colors.silicon);
        let n = 0;
        for (let row = -3; row <= 3; row++) for (let col = -3; col <= 3; col++) if (Math.hypot(row, col) < 3.7) { const accepted = s.processStep === 0 || (++n / 45) <= fraction; box(x + row * .73, .06, col * .73, .6, .1, .6, accepted ? color : colors.rejected); }
      }
      caption = 'Separate logic (violet) and memory (green) wafers. Die marks are a sampled schematic; the dimensioned ledger carries the actual expected counts. Red marks illustrate rejected inputs.';
    } else if (s.processStep === 2) {
      stack(0, 0, 1.5); caption = `${s.dies} DRAM layers over one base die. Copper paths traverse silicon and interfaces; ${s.route === 'hybrid' ? 'direct contacts replace the solder gap' : s.route === 'tc-ncf' ? 'film supports the bumped interfaces' : 'molded material surrounds reflowed joints'}. Thicknesses and contact sizes are exaggerated.`;
    } else if (s.processStep === 3) {
      packageModel(); caption = 'One persistent reference package: two violet logic dies, eight green HBM stacks, a silicon routing plane and an organic substrate. Stacks reflect the selected die count and bonding interface.';
    } else if (s.processStep === 4) {
      rack(0, 0); caption = 'One reference rack: 8 shelves × 8 packages = 64. Copper and blue lines identify electrical and cooling services; they are schematic connections without modeled flow rates.';
    } else {
      const shown = Math.min(12, system.activeRacks);
      for (let i = 0; i < shown; i++) rack((i % 4 - 1.5) * 3, Math.floor(i / 4) * 3);
      box(0, -.6, 3, 13, .15, 10, colors.frame);
      caption = `${system.activeRacks} full racks satisfy this one-month supply and power snapshot; ${shown} are drawn. An empty floor means this scenario supports no full racks. Commissioning and reliability evidence are separate.`;
    }
  } else if (id === 'switching') {
    if (s.processStep === 2) {
      box(0,0,0,4,2,2,colors.logic);line([[-5,0,0],[-2,0,0]],colors.memory);line([[2,0,0],[5,0,0]],colors.copper);line([[0,-3,0],[0,-1,0]],colors.silicon);box(-4,.4,0,.6,.3+(s.a&1)*.6,.6,colors.memory);box(4,.4,0,.6,.3+s.heldBit*.6,.6,colors.copper);
      caption = `Functional rising-edge storage element, not a transistor layout. Green input D = ${s.a&1}; copper output Q = ${s.heldBit}. The separate lower lead is the clock. Q retains its value until a rising edge samples D; setup/hold are assumed satisfied.`;
    } else if (s.processStep < 2) {
      box(0, -.65, 0, 7, 1.1, 3.8, colors.silicon);
      box(-2, 0, 0, 1.6, .25, 3, colors.memory); box(2, 0, 0, 1.6, .25, 3, colors.memory);
      box(0, .12, 0, 2.2, .08, 3, colors.dielectric); box(0, .4, 0, 2.1, .45, 3, colors.copper);
      box(0, -.05, 0, 2.4, Math.max(.025, circuit.currentA * 6000), 2.7, '#e6c987');
      line([[0, .7, 0], [0, 1.7, 0], [0, 1.7, -2.4]], colors.copper);
      line([[-2, .3, 0], [-2, .3, -2.4]], colors.copper);
      if (s.processStep >= 1) { box(4.3, .3, 0, .12, 2, 2.2, colors.copper); box(4.65, .3, 0, .12, 2, 2.2, colors.copper); line([[2, .2, 0], [4.25, .2, 0]], colors.copper); }
      caption = `Representative planar nMOS cutaway: blue body, green source/drain, light gate dielectric and copper-colored gate. Channel highlight encodes the ${circuit.currentA * 1e6 < 1 ? 'small' : 'modeled'} current; it is not physical channel thickness. ${s.processStep === 0 ? 'The gate has a separate control lead; no conductor ties it to source or drain.' : s.processStep === 2 ? 'This is the driver and load prerequisite for storage; a latch and its clock are not represented in this cutaway.' : 'The separate plates represent a load capacitor.'}`;
    } else if (s.processStep === 3) {
      for (let i = 0; i < 4; i++) { const bit = circuit.bits[i], x = i * 2.3 - 3.45; box(x, 0, 0, 1.8, .5, 1.8, colors.logic); box(x - .45, .8, -.4, .5, .3 + bit.a * .6, .5, bit.a ? colors.memory : colors.frame); box(x + .45, .8, -.4, .5, .3 + bit.b * .6, .5, bit.b ? colors.memory : colors.frame); box(x, .8, .5, .5, .3 + bit.sum * .6, .5, bit.sum ? colors.copper : colors.frame); if (i < 3) line([[x + .9, .25, 0], [x + 1.4, .25, 0]], bit.carryOut ? '#ffcd80' : '#36505e'); }
      caption = 'Four functional full-adder cells, least-significant bit at left. Raised green inputs and copper sums represent one; bright carry links represent carry-out. Exact values are available in the carry table.';
    } else {
      circuit.terms.forEach((value, i) => { box(i * 3 - 3, 0, 0, 2, .2, 2, colors.logic); box(i * 3 - 3, 1 + value / 20, 0, 1.4, .5 + value / 10, 1.4, colors.memory); if (i < 2) line([[i * 3 - 2, .1, 0], [i * 3 - 1, .1, 0]], colors.copper); });
      caption = `Three product values ${circuit.terms.join(', ')} accumulate to ${circuit.mac}. Height encodes numerical value, not physical transistor count or a hardware floorplan.`;
    }
  } else {
    if (s.processStep < 3) {
      const att = attentionScenario(s.query, s.temperature);
      for (let i = 0; i < 4; i++) { const x = i * 2.2 - 3.3, weight = att.weights[i]; box(x, -.2, -1.8, 1.65, .2, 1.65, i === s.query ? colors.copper : colors.silicon); box(x, weight * 3, 0, 1.2, Math.max(.03, weight * 6), 1.2, i > s.query ? colors.frame : colors.memory); box(x, att.probabilities[i] * 3, 2.2, 1.2, att.probabilities[i] * 6, 1.2, colors.logic); line([[x, 0, -1.8], [x, 0, 2.2]], i > s.query ? '#253844' : colors.copper); }
      caption = 'Token positions run left to right. Rear tiles identify inputs; green heights encode computed attention weights; violet heights encode readout probabilities. Future positions have zero attention. These are mathematical axes, not physical stacks.';
    } else if (s.processStep < 5) {
      const p = system.placement;
      for (const [i, bytes, cap, color] of [[0, p.hbm.weights + p.hbm.kv + p.hbm.workspace, p.caps.hbm, colors.memory], [1, p.host.weights + p.host.kv, p.caps.host, colors.silicon], [2, p.hbf.weights, p.caps.hbf, colors.logic]] as const) { const fraction = cap ? bytes / cap : 0; box(i * 3.5 - 3.5, -.3, 0, 2.5, .2, 3, colors.frame); if (fraction > 0) box(i * 3.5 - 3.5, fraction * 2, 0, 2, fraction * 4, 2.5, color); }
      line([[-3.5, .1, 0], [0, .1, 0], [3.5, .1, 0]], colors.copper);
      caption = 'HBM, host memory and optional HBF from left to right. Heights encode occupied fraction of each tier’s own capacity, so compare byte counts in the table. Only read-only weights enter HBF.';
    } else { rack(0, 0); caption = 'The same 64-package rack closes the resource scenario. The service estimate uses only full racks supported by both supply and power. Application quality is evaluated independently.'; }
  }
  return { root, caption };
}

export default function InvestigationScene({ id, scenario }: { id: InvestigationId; scenario: Scenario }) {
  const host = useRef<HTMLDivElement>(null), state = useRef({ id, scenario }), refresh = useRef(() => {});
  const [caption, setCaption] = useState(''), [error, setError] = useState(''), [generation, setGeneration] = useState(0);
  useEffect(() => { state.current = { id, scenario }; refresh.current(); }, [id, scenario]);
  useEffect(() => {
    const el = host.current!; let renderer: T.WebGLRenderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'low-power' }); } catch { setError('3D is unavailable. Select Show diagram for the same quantities and relationships.'); return; }
    renderer.setClearColor('#07141e'); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Spatial representation. Drag to orbit. The diagram and tables provide equivalent quantities.');
    const scene = new T.Scene(), camera = new T.PerspectiveCamera(40, 1, .05, 200), controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false; controls.minDistance = 2; controls.maxDistance = 70;
    scene.add(new T.HemisphereLight('#e2f0ff', '#173226', 3)); const light = new T.DirectionalLight('#ffffff', 3); light.position.set(4, 12, 8); scene.add(light);
    let root: T.Group | undefined, key = '', disposed = false, visible = true, frame = 0;
    const render = () => { if (!disposed && visible && !document.hidden && !frame) frame = requestAnimationFrame(() => { frame = 0; renderer.render(scene, camera); }); };
    const size = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); render(); };
    const rebuild = () => {
      if (root) { scene.remove(root); dispose(root); }
      const model = spatialModel(state.current.id, state.current.scenario); root = model.root; scene.add(root); setCaption(model.caption);
      const next = state.current.id + ':' + state.current.scenario.processStep;
      if (next !== key) { key = next; const bounds = new T.Box3().setFromObject(root), center = bounds.getCenter(new T.Vector3()), extent = bounds.getSize(new T.Vector3()); camera.aspect = el.clientWidth / Math.max(1, el.clientHeight); const span = Math.max((extent.x + extent.z * .45) / camera.aspect, extent.y + extent.z * .6, 3); const distance = span / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2))) * 1.2; controls.target.copy(center); camera.position.copy(center).add(new T.Vector3(1, .9, 1.4).normalize().multiplyScalar(distance)); controls.update(); }
      size(); render();
    };
    refresh.current = rebuild; rebuild();
    const resize = new ResizeObserver(size); resize.observe(el);
    const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; render(); }); observer.observe(el);
    const lost = (event: Event) => { event.preventDefault(); setError('The graphics context was interrupted. The diagram remains available.'); };
    renderer.domElement.addEventListener('webglcontextlost', lost); controls.addEventListener('change', render); document.addEventListener('visibilitychange', render);
    return () => { disposed = true; refresh.current = () => {}; cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); controls.removeEventListener('change', render); controls.dispose(); document.removeEventListener('visibilitychange', render); renderer.domElement.removeEventListener('webglcontextlost', lost); dispose(scene); renderer.dispose(); el.replaceChildren(); };
  }, [generation]);
  return <><div className="investigation-three" ref={host}/>{error ? <div className="investigation-three-fallback" role="status">{error}<button onClick={() => { setError(''); setGeneration(n => n + 1); }}>Retry 3D</button></div> : <p className="investigation-scene-caption">{caption} Drag to orbit; scroll to zoom.</p>}</>;
}
