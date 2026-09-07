import {inspectLifecycleForward,lifecycleFingerprint,lifecycleLimits,lifecycleModelVersion,lifecycleTensors,readLifecycleCheckpoint,validateLifecycleRun,type LifecycleRun} from './model-lifecycle.ts';
import {lifecycleDataVersion,lifecycleTokenizerVersion,lifecycleExamples,lifecycleVocabulary} from './model-lifecycle-data.ts';
import {buildMachineExecution,machineExecutionVersion,type MachineExecution,type MachineEvent} from './machine-execution.ts';

/** One real decoder operator, with an explicit precision adapter into the integer machine. */
export const decoderProjectionVersion='decoder-query-machine-1';
export const decoderProjectionModels={projection:decoderProjectionVersion,decoder:lifecycleModelVersion,machine:machineExecutionVersion,data:lifecycleDataVersion,tokenizer:lifecycleTokenizerVersion} as const;
export const decoderProjectionLimits={maxRecordBytes:650000,positions:3,channels:3,inner:6,tile:3} as const;
export type DecoderProjectionSelection={exampleId:string;quantizationMax:7|31|99;bankPlacement:'same-bank'|'split-banks';buffers:1|2;refreshEveryNs:0|64|96|160;fault:'none'|'unmapped-second-tile'};
export const decoderProjectionExamples=()=>lifecycleExamples('train','copy').concat(lifecycleExamples('development','copy'));
export const decoderProjectionDefaults:DecoderProjectionSelection={exampleId:'train-copy-a-u',quantizationMax:99,bankPlacement:'same-bank',buffers:2,refreshEveryNs:96,fault:'none'};
function ensure(ok:unknown,message:string):asserts ok{if(!ok)throw Error(message);}
function object(value:unknown,fields:string[],label:string):asserts value is Record<string,unknown>{ensure(value!==null&&typeof value==='object'&&!Array.isArray(value),`${label} must be an object.`);ensure(Object.keys(value).length===fields.length&&fields.every(k=>Object.hasOwn(value,k)),`Invalid ${label} fields.`);}
/** Reject holes, non-finite numbers and values JSON would silently erase before cloning. */
function jsonTree(value:unknown,depth=0):void{
 ensure(depth<=30,'Record nesting exceeds the bound.');
 if(value===null||typeof value==='string'||typeof value==='boolean')return;
 if(typeof value==='number'){ensure(Number.isFinite(value),'Record contains a non-finite number.');return;}
 if(Array.isArray(value)){ensure(Object.keys(value).length===value.length,'Sparse or decorated record array.');for(let i=0;i<value.length;i++){ensure(Object.hasOwn(value,i),'Sparse record array.');jsonTree(value[i],depth+1);}return;}
 ensure(typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype,'Record contains an unsupported value.');for(const x of Object.values(value))jsonTree(x,depth+1);
}
function checkpointCopy(value:unknown):LifecycleRun{jsonTree(value);validateLifecycleRun(value);const raw=JSON.stringify(value);ensure(new TextEncoder().encode(raw).length<=lifecycleLimits.maxCheckpointBytes,'Source checkpoint exceeds 600,000 bytes.');return readLifecycleCheckpoint(raw);}
export function normalizeDecoderProjectionSelection(value:unknown):DecoderProjectionSelection{
 object(value,Object.keys(decoderProjectionDefaults),'projection selection');
 ensure(typeof value.exampleId==='string'&&decoderProjectionExamples().some(e=>e.id===value.exampleId),'Select a known training or development prompt; final-test examples are excluded.');
 ensure([7,31,99].includes(value.quantizationMax as number),'Invalid quantization bound.');ensure(['same-bank','split-banks'].includes(value.bankPlacement as string),'Invalid bank placement.');ensure([1,2].includes(value.buffers as number),'Invalid staging slots.');ensure([0,64,96,160].includes(value.refreshEveryNs as number),'Invalid refresh interval.');ensure(['none','unmapped-second-tile'].includes(value.fault as string),'Invalid projection fault.');return {...value} as DecoderProjectionSelection;
}
export type ProjectionQuantization={original:number[][];codes:number[][];reconstructed:number[][];scale:number;maxAbs:number;halfStep:number;maxAbsError:number};
export function quantizeProjectionTile(matrix:number[][],maximum:7|31|99):ProjectionQuantization{
 ensure([7,31,99].includes(maximum),'Invalid quantization bound.');ensure(Array.isArray(matrix)&&matrix.length===3&&Object.keys(matrix).length===3,'Need a dense 3×3 tile.');
 for(let i=0;i<3;i++){ensure(Object.hasOwn(matrix,i)&&Array.isArray(matrix[i])&&matrix[i].length===3&&Object.keys(matrix[i]).length===3,'Need a dense 3×3 tile.');for(let j=0;j<3;j++)ensure(Object.hasOwn(matrix[i],j)&&Number.isFinite(matrix[i][j])&&Math.abs(matrix[i][j])<=100,'Invalid bounded tile value.');}
 const original=matrix.map(r=>[...r]),maxAbs=Math.max(...matrix.flat().map(Math.abs)),scale=maxAbs===0?1:Math.max(Number.MIN_VALUE,maxAbs/maximum);
 const codes=matrix.map(row=>row.map(v=>{const q=Math.sign(v)*Math.min(maximum,Math.floor(Math.abs(v)/scale+.5));return q===0?0:q;})),reconstructed=codes.map(row=>row.map(q=>q*scale));
 return {original,codes,reconstructed,scale,maxAbs,halfStep:maxAbs===0?0:scale/2,maxAbsError:Math.max(...matrix.flatMap((row,i)=>row.map((v,j)=>Math.abs(v-reconstructed[i][j]))))};
}
export function projectionWordBytes(value:number):number[]{ensure(Number.isInteger(value)&&value>=-2147483648&&value<=2147483647,'Word must be signed int32.');const bytes=new Uint8Array(4);new DataView(bytes.buffer).setInt32(0,value,true);return [...bytes];}
export type ProjectionWord={tile:number;tensor:'A'|'B'|'C';row:number;column:number;sourceRow:number;sourceColumn:number;weightIndex:number|null;value:number;bytes:number[];iova:number;physical:number};
export type DecoderProjectionTile={index:number;innerIndices:number[];a:ProjectionQuantization;b:ProjectionQuantization;machine:MachineExecution;words:ProjectionWord[];outputWords:ProjectionWord[];dequantized:number[][]|null;startNs:number;endNs:number};
export type DecoderProjectionEvent={index:number;tile:number|null;kind:'machine'|'combine';timeNs:number;machineTimeNs:number|null;label:string;machineEvent:MachineEvent|null};
export type DecoderProjectionResult={version:typeof decoderProjectionVersion;selection:DecoderProjectionSelection;source:{weightIdentity:string;optimizerStep:number;dataDraws:number;rng:number;finalOpened:boolean;promptId:string;familyId:string;split:string;promptTokens:number[];promptWords:string[];responseLossMask:number[];originalShape:number[];selectedShape:number[];queryWeightOffset:number};normalized:number[][];queryWeights:number[][];reference:number[][];floatExtractionMaxError:number;tiles:DecoderProjectionTile[];events:DecoderProjectionEvent[];output:number[][]|null;errors:{signed:number[][];maxAbsolute:number;rootMeanSquare:number;relativeFrobenius:number|null;absoluteBound:number[][];maxBound:number}|null;status:'complete'|'mapping-blocked';totals:{machineScheduleNs:number;completedMacs:number;readTransactionBytes:number;writeTransactionBytes:number;operandLogicalBytes:number;operandAllocatedBytes:number;scalesBinary64Bytes:number;selectedOriginalBinary64Bytes:number};assumptions:string[]};
const zero=()=>Array.from({length:3},()=>[0,0,0]);
export const decoderProjectionAssumptions=[
 'This is the supplied decoder checkpoint, not a substituted integer exercise. A contains its actual position-added embeddings after the decoder’s RMS rescaling (epsilon 1e-5, width 6, no centering or learned norm gain). B contains query weights at their actual checkpoint indices.',
 'Only prompt positions 0–2 and query output channels 0–2 are selected. All six inner coordinates contribute through two 3×3 products. The original query operator is prompt-length×6 times 6×6. Tokens and their order are unchanged.',
 'Each A/B tile has its own symmetric zero-point-zero max-absolute scale. Round to nearest, ties away from zero, with codes bounded by the chosen maximum. Zero tiles use scale 1 and code 0; a positive subnormal scale is bounded below by the smallest positive binary64 value to prevent division by zero. This is local post-training quantization of four tiles, not quantization-aware training or a production calibration scheme.',
 'Codes occupy signed int32 little-endian words in the existing machine. A smaller code range does not reduce this machine’s word size or transferred bytes. Scales are separately represented by four binary64 values; their movement is excluded from machine traffic.',
 'Actual mapped reads supply integer MACs. Each completed tile is rescaled in JavaScript binary64, then the two matrices are added. A blocked tile prevents a complete projection output. Outputs are neither re-quantized nor fed back into the decoder.',
 'The query projection does not mix token positions and needs no causal mask. The decoder applies a causal mask later to QKᵀ scores; that attention, softmax, value mixing, feed-forward work, logits, loss mask and backpropagation are outside the machine execution.',
 'The two machine invocations run sequentially with independent address spaces and refresh origins. Summed machine service ns exclude normalization, quantization, initialization, rescaling, final addition and the reference calculation. They are synthetic selected-operator schedules, not browser measurements, decoder latency or a hardware forecast.',
 'The error denominator is only this 3×3 query slice. No answer accuracy, perplexity, whole-model quality or memory saving is inferred. Operand quantization bounds omit floating-point roundoff; tests compare with an explicit numerical tolerance.',
 'The optional unmapped B operand on the second tile is an injected software mapping fault, independent of quantization, geometry or physical error rates. A weight fingerprint is a teaching identity check, not authentication.',
];
export function buildDecoderProjection(checkpoint:LifecycleRun,selection:DecoderProjectionSelection=decoderProjectionDefaults):DecoderProjectionResult{
 const source=checkpointCopy(checkpoint),input=normalizeDecoderProjectionSelection(selection),example=decoderProjectionExamples().find(e=>e.id===input.exampleId)!,tokens=example.tokens.slice(0,example.answerPosition+1),forward=inspectLifecycleForward(source.weights,tokens),query=lifecycleTensors.find(t=>t.name==='query')!;
 ensure(lifecycleLimits.width===6&&query.rows===6&&query.columns===6,'Decoder projection layout changed; adapter needs a new version.');
 const normalized=forward.embeddings.slice(0,3).map(row=>{const inverse=1/Math.sqrt(row.reduce((sum,x)=>sum+x*x,0)*(1/6)+1e-5);return row.map(x=>x*inverse);}),queryWeights=Array.from({length:6},(_,k)=>Array.from({length:3},(_,j)=>source.weights[query.offset+k*6+j])),reference=forward.queries.slice(0,3).map(row=>row.slice(0,3));
 const extracted=normalized.map(row=>Array.from({length:3},(_,j)=>row.reduce((sum,a,k)=>sum+a*queryWeights[k][j],0))),floatExtractionMaxError=Math.max(...reference.flatMap((row,i)=>row.map((v,j)=>Math.abs(v-extracted[i][j]))));
 ensure(floatExtractionMaxError<=1e-12,'Extracted query operands disagree with the decoder; adapter cannot proceed.');
 const tiles:DecoderProjectionTile[]=[],events:DecoderProjectionEvent[]=[];let time=0;
 for(let tile=0;tile<2;tile++){
  const start=tile*3,a=quantizeProjectionTile(normalized.map(row=>row.slice(start,start+3)),input.quantizationMax),b=quantizeProjectionTile(queryWeights.slice(start,start+3),input.quantizationMax),machine=buildMachineExecution({a:a.codes,b:b.codes,bankPlacement:input.bankPlacement,buffers:input.buffers,refreshEveryNs:input.refreshEveryNs,fault:tile===1&&input.fault==='unmapped-second-tile'?'unmapped-b':'none'});
  const words:ProjectionWord[]=[];
  for(const tensor of ['A','B'] as const){const mapping=machine.mappings.find(m=>m.tensor===tensor)!,codes=tensor==='A'?a.codes:b.codes;for(let r=0;r<3;r++)for(let c=0;c<3;c++){const offset=(r*3+c)*4;words.push({tile,tensor,row:r,column:c,sourceRow:tensor==='A'?r:start+r,sourceColumn:tensor==='A'?start+c:c,weightIndex:tensor==='B'?query.offset+(start+r)*6+c:null,value:codes[r][c],bytes:projectionWordBytes(codes[r][c]),iova:mapping.iovaStart+offset,physical:mapping.physicalStart+offset});}}
  const mapping=machine.mappings.find(m=>m.tensor==='C')!,outputWords:ProjectionWord[]=machine.finalOutput?machine.finalOutput.flatMap((row,r)=>row.map((v,c)=>({tile,tensor:'C' as const,row:r,column:c,sourceRow:r,sourceColumn:c,weightIndex:null,value:v,bytes:projectionWordBytes(v),iova:mapping.iovaStart+(r*3+c)*4,physical:mapping.physicalStart+(r*3+c)*4}))):[];
  const dequantized=machine.finalOutput?.map(row=>row.map(x=>x*a.scale*b.scale))??null,endNs=time+machine.totals.durationNs;
  tiles.push({index:tile,innerIndices:[start,start+1,start+2],a,b,machine,words,outputWords,dequantized,startNs:time,endNs});
  for(const e of machine.events)events.push({index:events.length,tile,kind:'machine',timeNs:time+e.timeNs,machineTimeNs:e.timeNs,label:`Tile ${tile+1}: ${e.label}`,machineEvent:e});time=endNs;
 }
 const complete=tiles.every(t=>t.dequantized!==null),output=complete?reference.map((row,r)=>row.map((_,c)=>tiles.reduce((sum,t)=>sum+t.dequantized![r][c],0))):null;
 let errors:DecoderProjectionResult['errors']=null;
 if(output){const signed=output.map((row,r)=>row.map((v,c)=>v-reference[r][c])),absoluteBound=zero();for(const t of tiles)for(let r=0;r<3;r++)for(let c=0;c<3;c++)for(let k=0;k<3;k++)absoluteBound[r][c]+=Math.abs(t.a.original[r][k])*t.b.halfStep+Math.abs(t.b.original[k][c])*t.a.halfStep+t.a.halfStep*t.b.halfStep;
  const squareError=signed.flat().reduce((sum,e)=>sum+e*e,0),squareReference=reference.flat().reduce((sum,e)=>sum+e*e,0);errors={signed,maxAbsolute:Math.max(...signed.flat().map(Math.abs)),rootMeanSquare:Math.sqrt(squareError/9),relativeFrobenius:squareReference===0?null:Math.sqrt(squareError/squareReference),absoluteBound,maxBound:Math.max(...absoluteBound.flat())};events.push({index:events.length,tile:null,kind:'combine',timeNs:time,machineTimeNs:null,label:'Both tile outputs returned to the host. Rescale and add in binary64; host combination time is excluded.',machineEvent:null});
 }
 return {version:decoderProjectionVersion,selection:input,source:{weightIdentity:lifecycleFingerprint(source.weights),optimizerStep:source.optimizerStep,dataDraws:source.dataDraws,rng:source.rng,finalOpened:source.finalOpened,promptId:example.id,familyId:example.familyId,split:example.split,promptTokens:tokens,promptWords:tokens.map(id=>lifecycleVocabulary[id]),responseLossMask:example.mask,originalShape:[tokens.length,6,6],selectedShape:[3,6,3],queryWeightOffset:query.offset},normalized,queryWeights,reference,floatExtractionMaxError,tiles,events,output,errors,status:complete?'complete':'mapping-blocked',totals:{machineScheduleNs:time,completedMacs:tiles.reduce((sum,t)=>sum+t.machine.totals.macs,0),readTransactionBytes:tiles.reduce((sum,t)=>sum+t.machine.totals.readTransactionBytes,0),writeTransactionBytes:tiles.reduce((sum,t)=>sum+t.machine.totals.writeTransactionBytes,0),operandLogicalBytes:144,operandAllocatedBytes:192,scalesBinary64Bytes:32,selectedOriginalBinary64Bytes:288},assumptions:[...decoderProjectionAssumptions]};
}
/** Slider indices preserve event ordering even when several actions share a timestamp. */
export function sampleDecoderProjection(result:DecoderProjectionResult,index:number){
 ensure(Number.isInteger(index)&&index>=0&&index<result.events.length,'Invalid projection event index.');const event=result.events[index];
 if(event.kind==='combine')return {event,partial:result.output!,accepted:true,completedMacs:result.totals.completedMacs};
 const tile=result.tiles[event.tile!],state=event.machineEvent!.state,prior=event.tile===1?result.tiles[0].dequantized:zero();
 const partial=state.partialOutput.map((row,r)=>row.map((v,c)=>(prior?.[r][c]??0)+v*tile.a.scale*tile.b.scale));
 return {event,partial,accepted:false,completedMacs:(event.tile===1?result.tiles[0].machine.totals.macs:0)+state.completedMacs.flat().reduce((sum,n)=>sum+n,0)};
}
export function serializeDecoderProjection(checkpoint:LifecycleRun,selection:DecoderProjectionSelection=decoderProjectionDefaults){const raw=JSON.stringify({schemaVersion:1,models:decoderProjectionModels,checkpoint:checkpointCopy(checkpoint),selection:normalizeDecoderProjectionSelection(selection)});ensure(new TextEncoder().encode(raw).length<=decoderProjectionLimits.maxRecordBytes,'Projection workspace exceeds 650,000 bytes.');return raw;}
export function readDecoderProjection(raw:string):{checkpoint:LifecycleRun;selection:DecoderProjectionSelection}{
 ensure(typeof raw==='string'&&new TextEncoder().encode(raw).length<=decoderProjectionLimits.maxRecordBytes,'Projection workspace exceeds 650,000 bytes.');const v:unknown=JSON.parse(raw);object(v,['schemaVersion','models','checkpoint','selection'],'projection workspace');ensure(v.schemaVersion===1,'Incompatible projection schema.');object(v.models,Object.keys(decoderProjectionModels),'model identities');for(const [k,version] of Object.entries(decoderProjectionModels))ensure(v.models[k]===version,'Incompatible projection model identity.');return {checkpoint:checkpointCopy(v.checkpoint),selection:normalizeDecoderProjectionSelection(v.selection)};
}
