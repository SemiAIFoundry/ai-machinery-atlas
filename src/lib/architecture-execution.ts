/** Pure, dependency-free teaching schedules. No vendor timing or memory-system model. */
export const architectureVersion = 'architecture-execution-1';
export type SchemeId = 'scalar' | 'vector' | 'simt' | 'systolic';
export type Matrix = readonly (readonly number[])[];
export type ArchitectureInput = {
  a: Matrix; b: Matrix;
  /** Optional derived size; accepted for round-tripping normalized inputs. */
  size?: 2 | 3;
  laneCount?: 2 | 4 | 8;
  /** Vector/SIMT teaching slots excluded by the scheduler; work is explicitly remapped. */
  inactiveLanes?: readonly number[];
  /** Systolic array is tiled when smaller than the matrix; padding PEs are gated. */
  arraySize?: 2 | 3;
};
export type NormalizedInput = { a: number[][]; b: number[][]; size: 2 | 3; laneCount: 2 | 4 | 8; inactiveLanes: number[]; arraySize: 2 | 3 };
export type Cell = { row: number; column: number };
export type Operand = { tensor: 'A' | 'B'; row: number; column: number; value: number; k: number };
export type MemoryAccess = {
  id: string; space: 'boundary' | 'local'; direction: 'read' | 'write';
  resource: string; unitId: string; tensor: 'A' | 'B' | 'C'; row: number; column: number;
  value: number; reason: 'operand-load' | 'operand-latch' | 'broadcast-read' | 'initialize' | 'mac-read' | 'accumulate' | 'result-read' | 'result-store';
};
export type Transfer = {
  id: string; kind: 'boundary-in' | 'boundary-out' | 'broadcast' | 'neighbor';
  from: string; to: string; tensor: 'A' | 'B' | 'C'; row: number; column: number; value: number;
  departureStep: number; arrivalStep: number;
};
export type MacOperation = {
  id: string; unitId: string; output: Cell; k: number;
  a: Operand; b: Operand; product: number; accumulatorBefore: number; accumulatorAfter: number;
  localAccumulator: string; completesOutput: boolean;
};
export type UnitState = {
  id: string; position: Cell;
  state: 'mac' | 'masked' | 'edge' | 'fill' | 'drain';
  explanation: string; output: Cell | null; operationId: string | null;
  accumulator: number | null;
};
export type TrafficCount = {
  boundaryReads: number; boundaryWrites: number; localReads: number; localWrites: number;
  neighborHops: number; broadcastDeliveries: number; distinctBoundaryReadAddresses: number;
};
export type ScheduleStep = {
  index: number; label: string; scheduleUnit: 'issue-slot' | 'wavefront-tick';
  group: number; localTick: number;
  tile: { rowStart: number; columnStart: number; rows: number; columns: number } | null;
  operations: MacOperation[]; units: UnitState[]; accesses: MemoryAccess[]; transfers: Transfer[];
  occupancy: { activeMacUnits: number; physicalUnits: number; enabledUnits: number; fractionOfPhysical: number; fractionOfEnabled: number };
  traffic: TrafficCount; partialOutput: number[][]; completed: boolean[][];
};
export type ArchitectureTrace = {
  scheme: SchemeId; title: string; scheduleUnit: ScheduleStep['scheduleUnit'];
  steps: ScheduleStep[]; finalOutput: number[][];
  totals: TrafficCount & { macs: number; scheduleSteps: number; physicalMacSlots: number; activeMacFraction: number };
  assumptions: string[]; sourceIds: string[];
};
export type ArchitectureComparison = {
  version: typeof architectureVersion; input: NormalizedInput; reference: number[][];
  traces: Record<SchemeId, ArchitectureTrace>; invariant: { macsPerScheme: number; outputElements: number; arithmetic: string };
};
export const architecturePresets: Record<'two' | 'three', ArchitectureInput> = {
  two: { a: [[1, 2], [3, 4]], b: [[5, 6], [7, 8]], laneCount: 4, inactiveLanes: [], arraySize: 2 },
  three: { a: [[2, -1, 0], [1, 3, 2], [0, 1, 2]], b: [[1, 2, 1], [0, -1, 3], [2, 1, 0]], laneCount: 4, inactiveLanes: [], arraySize: 3 },
};
const matrix = <T>(n: number, value: T): T[][] => Array.from({ length: n }, () => Array.from({ length: n }, () => value));
const copy = <T>(m: T[][]): T[][] => m.map(row => [...row]);
function ensure(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
export function normalizeArchitectureInput(value: unknown): NormalizedInput {
  ensure(value && typeof value === 'object' && !Array.isArray(value), 'Architecture input must be an object.');
  const v = value as Record<string, unknown>;
  ensure(Object.keys(v).every(k => ['a', 'b', 'size', 'laneCount', 'inactiveLanes', 'arraySize'].includes(k)), 'Unknown architecture input field.');
  ensure(Array.isArray(v.a) && [2, 3].includes(v.a.length), 'A must be square with size 2 or 3.');
  const n = v.a.length as 2 | 3;
  ensure(v.size === undefined || v.size === n, 'Declared size does not match the matrices.');
  for (const name of ['a', 'b']) {
    const m = v[name];
    ensure(Array.isArray(m) && m.length === n, `${name.toUpperCase()} must have the same square size.`);
    for (const row of m) {
      ensure(Array.isArray(row) && row.length === n, `${name.toUpperCase()} has an invalid row.`);
      for (let j = 0; j < n; j++) ensure(Number.isInteger(row[j]) && Math.abs(row[j]) <= 99, 'Matrix entries must be integers from -99 through 99.');
    }
  }
  const laneCount = v.laneCount === undefined ? 4 : v.laneCount;
  ensure(laneCount === 2 || laneCount === 4 || laneCount === 8, 'laneCount must be 2, 4 or 8.');
  const inactive = v.inactiveLanes === undefined ? [] : v.inactiveLanes;
  ensure(Array.isArray(inactive) && [...inactive].every(x => Number.isInteger(x) && x >= 0 && x < laneCount), 'inactiveLanes must contain valid zero-based slot indices.');
  ensure(new Set(inactive).size === inactive.length, 'inactiveLanes cannot contain duplicates.');
  ensure(inactive.length < laneCount, 'Keep at least one vector/SIMT lane enabled.');
  const arraySize = v.arraySize === undefined ? n : v.arraySize;
  ensure(arraySize === 2 || arraySize === 3, 'arraySize must be 2 or 3.');
  return { a: (v.a as number[][]).map(r => [...r]), b: (v.b as number[][]).map(r => [...r]), size: n, laneCount, inactiveLanes: [...inactive].sort((a,b) => a-b), arraySize };
}
/** A separate row/column reduction; schedule generation never consumes its result. */
export function referenceMultiply(a: Matrix, b: Matrix): number[][] {
  const x = normalizeArchitectureInput({ a, b });
  return x.a.map(row => x.b[0].map((_, j) => row.reduce((sum, aValue, k) => sum + aValue * x.b[k][j], 0)));
}
const sharedAssumptions = [
  'C = A B with C initially zero. Exact signed integer arithmetic; entries are bounded to ±99, so every product and partial sum is exactly representable by JavaScript numbers. No rounding, overflow, saturation or sparse-zero skipping is modeled.',
  'A schedule slot groups stated actions in a chosen teaching dataflow. It is not an ISA instruction count, measured cycle, clock period or latency prediction. Load, compute and store actions inside a slot do not imply real single-cycle hardware.',
  'Boundary counts are logical scalar-word reads/writes at the declared input/output boundary. This boundary is not labeled HBM, DRAM or cache. No cache lines, transaction coalescing, bank conflicts, bandwidth, instructions, energy or device timing are inferred.',
  'Local counts represent the explicitly named operand latches and accumulator accesses. Transfers show where those same values go; do not add transfer counts to memory accesses as if they were distinct off-chip transactions.',
  'Active-MAC fraction divides executing MAC units by declared physical teaching slots, including masked, edge, fill and drain slots. It is not GPU resident-warp occupancy or a cross-device performance score.',
];
function traffic(accesses: MemoryAccess[], transfers: Transfer[]): TrafficCount {
  const count = (space: MemoryAccess['space'], direction: MemoryAccess['direction']) => accesses.filter(a => a.space === space && a.direction === direction).length;
  return { boundaryReads: count('boundary','read'), boundaryWrites: count('boundary','write'), localReads: count('local','read'), localWrites: count('local','write'), neighborHops: transfers.filter(t => t.kind === 'neighbor').length, broadcastDeliveries: transfers.filter(t => t.kind === 'broadcast').length, distinctBoundaryReadAddresses: new Set(accesses.filter(a => a.space === 'boundary' && a.direction === 'read').map(a => `${a.tensor}:${a.row}:${a.column}`)).size };
}
function makeTrace(scheme: SchemeId, x: NormalizedInput): ArchitectureTrace {
  const n = x.size, partial = matrix(n, 0), completed = matrix(n, false), steps: ScheduleStep[] = [];
  const scheduleUnit = scheme === 'systolic' ? 'wavefront-tick' : 'issue-slot';
  const physical = scheme === 'scalar' ? 1 : scheme === 'systolic' ? x.arraySize ** 2 : x.laneCount;
  const title = { scalar: 'One scalar accumulator at a time', vector: 'One row vector group at a time', simt: 'One output per thread slot', systolic: 'Output-stationary neighbor dataflow' }[scheme];
  const start = (group: number, localTick: number, tile: ScheduleStep['tile'], label: string): ScheduleStep => ({ index: steps.length, label, scheduleUnit, group, localTick, tile, operations: [], units: [], accesses: [], transfers: [], occupancy: { activeMacUnits: 0, physicalUnits: physical, enabledUnits: physical, fractionOfPhysical: 0, fractionOfEnabled: 0 }, traffic: traffic([],[]), partialOutput: [], completed: [] });
  const access = (s: ScheduleStep, space: MemoryAccess['space'], direction: MemoryAccess['direction'], unitId: string, tensor: MemoryAccess['tensor'], row: number, column: number, value: number, reason: MemoryAccess['reason'], resource: string) => {
    s.accesses.push({ id: `${scheme}:s${s.index}:a${s.accesses.length}`, space, direction, resource, unitId, tensor, row, column, value, reason });
  };
  const transfer = (s: ScheduleStep, kind: Transfer['kind'], from: string, to: string, operand: Pick<Transfer,'tensor'|'row'|'column'|'value'>, delay = 0) => {
    s.transfers.push({ id: `${scheme}:s${s.index}:t${s.transfers.length}`, kind, from, to, ...operand, departureStep: s.index, arrivalStep: s.index + delay });
  };
  const operand = (tensor: 'A'|'B', row: number, column: number, k: number): Operand => ({ tensor, row, column, k, value: tensor === 'A' ? x.a[row][column] : x.b[row][column] });
  const boundaryLoad = (s: ScheduleStep, unit: string, o: Operand) => {
    access(s,'boundary','read',unit,o.tensor,o.row,o.column,o.value,'operand-load',`${o.tensor}[${o.row},${o.column}]`);
    transfer(s,'boundary-in',`boundary:${o.tensor}[${o.row},${o.column}]`,`${unit}:${o.tensor}`,o);
  };
  const mac = (s: ScheduleStep, unit: string, position: Cell, output: Cell, a: Operand, b: Operand): UnitState => {
    const {row:i,column:j} = output, k = a.k;
    ensure(k === b.k && a.row === i && b.column === j && a.column === k && b.row === k, 'Unmatched operand tokens at a MAC.');
    const acc = `${unit}:acc`, before = partial[i][j];
    if (k === 0 && scheme !== 'systolic') access(s,'local','write',unit,'C',i,j,0,'initialize',acc);
    for (const o of [a,b]) {
      access(s,'local','write',unit,o.tensor,o.row,o.column,o.value,'operand-latch',`${unit}:${o.tensor}`);
      access(s,'local','read',unit,o.tensor,o.row,o.column,o.value,'mac-read',`${unit}:${o.tensor}`);
    }
    access(s,'local','read',unit,'C',i,j,before,'mac-read',acc);
    const product = a.value * b.value, after = before + product;
    access(s,'local','write',unit,'C',i,j,after,'accumulate',acc);
    partial[i][j] = after;
    const op: MacOperation = { id:`${scheme}:mac:${i}:${j}:${k}`, unitId:unit, output, k, a:{...a}, b:{...b}, product, accumulatorBefore:before, accumulatorAfter:after, localAccumulator:acc, completesOutput:k===n-1 };
    s.operations.push(op);
    if (op.completesOutput) {
      completed[i][j] = true;
      access(s,'local','read',unit,'C',i,j,after,'result-read',acc);
      access(s,'boundary','write',unit,'C',i,j,after,'result-store',`C[${i},${j}]`);
      transfer(s,'boundary-out',acc,`boundary:C[${i},${j}]`,{tensor:'C',row:i,column:j,value:after});
    }
    return { id:unit, position, state:'mac', explanation:`C[${i},${j}]: ${before} + ${a.value} × ${b.value} = ${after}`, output, operationId:op.id, accumulator:after };
  };
  const finish = (s: ScheduleStep, enabled: number) => {
    const active = s.operations.length;
    s.occupancy = { activeMacUnits:active, physicalUnits:physical, enabledUnits:enabled, fractionOfPhysical:active/physical, fractionOfEnabled:active/enabled };
    s.traffic = traffic(s.accesses,s.transfers);s.partialOutput = copy(partial);s.completed = copy(completed);steps.push(s);
  };
  if (scheme === 'scalar') {
    for (let i=0;i<n;i++) for(let j=0;j<n;j++) for(let k=0;k<n;k++) {
      const s=start(i*n+j,k,null,`Scalar C[${i},${j}], reduction index ${k}`), unit='scalar-0', a=operand('A',i,k,k), b=operand('B',k,j,k);
      boundaryLoad(s,unit,a);boundaryLoad(s,unit,b);s.units.push(mac(s,unit,{row:0,column:0},{row:i,column:j},a,b));finish(s,1);
    }
  } else if (scheme === 'vector' || scheme === 'simt') {
    const enabled = Array.from({length:x.laneCount},(_,i)=>i).filter(i=>!x.inactiveLanes.includes(i));
    const groups: Cell[][] = [];
    if (scheme === 'vector') {
      for(let i=0;i<n;i++) for(let j=0;j<n;j+=enabled.length) groups.push(Array.from({length:Math.min(enabled.length,n-j)},(_,d)=>({row:i,column:j+d})));
    } else {
      const outputs=Array.from({length:n*n},(_,flat)=>({row:Math.floor(flat/n),column:flat%n}));
      for(let offset=0;offset<outputs.length;offset+=enabled.length)groups.push(outputs.slice(offset,offset+enabled.length));
    }
    for (const [g,outputs] of groups.entries()) for(let k=0;k<n;k++) {
      const s=start(g,k,null,`${scheme==='vector'?'Row-vector group':'Thread group'} ${g+1}, reduction index ${k}`);
      let broadcast: Operand | null = null;
      if(scheme==='vector') {
        broadcast=operand('A',outputs[0].row,k,k);boundaryLoad(s,'vector-control',broadcast);
        access(s,'local','write','vector-control','A',broadcast.row,broadcast.column,broadcast.value,'operand-latch','vector-control:scalar-A');
        access(s,'local','read','vector-control','A',broadcast.row,broadcast.column,broadcast.value,'broadcast-read','vector-control:scalar-A');
      }
      for(let lane=0;lane<x.laneCount;lane++) {
        const unit=`${scheme}-lane-${lane}`, position={row:0,column:lane}, rank=enabled.indexOf(lane), output=outputs[rank];
        if(rank<0 || !output) {
          s.units.push({id:unit,position,state:rank<0?'masked':'edge',explanation:rank<0?'Excluded slot: the scheduler maps its mathematical work to enabled slots.':'No output in this group; edge/tail slot performs no MAC or operand access.',output:null,operationId:null,accumulator:null});continue;
        }
        const a=broadcast||operand('A',output.row,k,k),b=operand('B',k,output.column,k);
        if(broadcast)transfer(s,'broadcast','vector-control:scalar-A',`${unit}:A`,a);else boundaryLoad(s,unit,a);
        boundaryLoad(s,unit,b);s.units.push(mac(s,unit,position,output,a,b));
      }
      finish(s,enabled.length);
    }
  } else {
    const size=x.arraySize;
    let group=0;
    for(let rowStart=0;rowStart<n;rowStart+=size)for(let columnStart=0;columnStart<n;columnStart+=size){
      const height=Math.min(size,n-rowStart),width=Math.min(size,n-columnStart),tile={rowStart,columnStart,rows:height,columns:width};
      let aInputs=matrix<Operand|null>(size,null),bInputs=matrix<Operand|null>(size,null);
      for(let t=0;t<n+height+width-2;t++){
        const s=start(group,t,tile,`Tile (${rowStart},${columnStart}), wavefront tick ${t}`);
        if(t===0)for(let r=0;r<height;r++)for(let c=0;c<width;c++)access(s,'local','write',`pe-${r}-${c}`,'C',rowStart+r,columnStart+c,0,'initialize',`pe-${r}-${c}:acc`);
        for(let r=0;r<height;r++){const k=t-r;if(k>=0&&k<n){const a=operand('A',rowStart+r,k,k);ensure(!aInputs[r][0],'A edge collision');aInputs[r][0]=a;boundaryLoad(s,`pe-${r}-0`,a);}}
        for(let c=0;c<width;c++){const k=t-c;if(k>=0&&k<n){const b=operand('B',k,columnStart+c,k);ensure(!bInputs[0][c],'B edge collision');bInputs[0][c]=b;boundaryLoad(s,`pe-0-${c}`,b);}}
        const nextA=matrix<Operand|null>(size,null),nextB=matrix<Operand|null>(size,null);
        for(let r=0;r<size;r++)for(let c=0;c<size;c++){
          const unit=`pe-${r}-${c}`,position={row:r,column:c},output={row:rowStart+r,column:columnStart+c};
          if(r>=height||c>=width){s.units.push({id:unit,position,state:'edge',explanation:'Padding PE has no valid output in this tile; injection and forwarding into it are gated.',output:null,operationId:null,accumulator:null});continue;}
          const a=aInputs[r][c],b=bInputs[r][c];ensure(Boolean(a)===Boolean(b),'Only one operand reached a systolic PE.');
          if(a&&b){
            s.units.push(mac(s,unit,position,output,a,b));
            if(c+1<width){nextA[r][c+1]={...a};transfer(s,'neighbor',`${unit}:A`,`pe-${r}-${c+1}:A`,a,1);}
            if(r+1<height){nextB[r+1][c]={...b};transfer(s,'neighbor',`${unit}:B`,`pe-${r+1}-${c}:B`,b,1);}
          }else{
            const state=t<r+c?'fill':'drain';s.units.push({id:unit,position,state,explanation:state==='fill'?'The skewed operand wavefront has not reached this PE.':'This PE finished its dot product while later PEs drain.',output,operationId:null,accumulator:partial[output.row][output.column]});
          }
        }
        finish(s,height*width);aInputs=nextA;bInputs=nextB;
      }
      ensure([...aInputs.flat(),...bInputs.flat()].every(v=>v===null),'Undrained systolic token.');group++;
    }
  }
  ensure(steps.flatMap(s=>s.operations).length===n**3,'Schedule lost a required MAC.');
  ensure(new Set(steps.flatMap(s=>s.operations).map(o=>o.id)).size===n**3,'Schedule repeats a MAC.');
  ensure(completed.flat().every(Boolean),'An output did not complete.');
  const counts=traffic(steps.flatMap(s=>s.accesses),steps.flatMap(s=>s.transfers));
  const specific={
    scalar:['A deliberately simple scalar loop keeps one output accumulator local and reloads two operands for every MAC. It does not represent an optimized CPU with caches, superscalar issue, vector units or blocked reuse.','Vector/SIMT lane masks and systolic array size do not alter this scalar schedule.'],
    vector:['The schedule groups columns of one output row. One A[i,k] scalar is loaded and broadcast per group/slot; B[k,j] and C accumulators are per enabled lane. This is an abstract vector-scalar integer MAC pattern.','Inactive slots are excluded by an explicit work-to-enabled-lane mapping, including gather/scatter semantics when needed; masking alone would not magically compute omitted outputs. Tail lanes have no accesses. No particular physical RVV lane count, mask policy or timing is asserted.'],
    simt:['Each thread slot owns one output element and advances the k loop with the group. Logical per-thread A/B reads are counted separately, even for matching addresses. Real memory coalescing, caching or broadcast may merge physical transactions.','Two, four or eight slots are teaching group sizes, not NVIDIA warp sizes. This model has no branch-path divergence, resident-warp scheduling, implicit cross-thread synchronization or hardware occupancy model. Inactive slots trigger explicit work remapping.'],
    systolic:['Output-stationary rectangular tiles retain C at PEs. A moves east and B south by exactly one neighbor per tick. Row/column skew injects A at k+r and B at k+c, so matching operands meet at tick k+r+c.','Tiles execute sequentially with no overlap or cache reuse across tiles. Padding rows/columns are gated. One tick permits each ready PE to MAC and directly write its finished C; result-network and memory-port contention are omitted.','MAC operand reads fan out to neighbor forwarding without an additional local read in this declared model. Array-edge injections are boundary reads; neighbor hops are separate on-array movement. This is not a proprietary TPU/Tensor Core reconstruction.'],
  }[scheme];
  return {scheme,title,scheduleUnit,steps,finalOutput:copy(partial),totals:{...counts,macs:n**3,scheduleSteps:steps.length,physicalMacSlots:steps.length*physical,activeMacFraction:n**3/(steps.length*physical)},assumptions:[...sharedAssumptions,...specific],sourceIds:scheme==='vector'?['riscv-vector-v1']:scheme==='simt'?['cuda-simt-guide']:scheme==='systolic'?['kung-systolic-1982']:['matrix-definition']};
}
export function buildArchitectureComparison(value: ArchitectureInput): ArchitectureComparison {
  const input=normalizeArchitectureInput(value),reference=referenceMultiply(input.a,input.b);
  const traces=Object.fromEntries((['scalar','vector','simt','systolic'] as const).map(s=>[s,makeTrace(s,input)])) as Record<SchemeId,ArchitectureTrace>;
  for(const trace of Object.values(traces))ensure(trace.finalOutput.every((row,i)=>row.every((v,j)=>v===reference[i][j])),`${trace.scheme} disagrees with the independent row/column reduction.`);
  return {version:architectureVersion,input,reference,traces,invariant:{macsPerScheme:input.size**3,outputElements:input.size**2,arithmetic:'Exact integer C[i,j] = sum_k A[i,k] B[k,j], with k increasing for every output.'}};
}
