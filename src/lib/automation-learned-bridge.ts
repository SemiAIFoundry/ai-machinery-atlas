/** Versioned model-to-workflow boundary. Frozen inference is data, never tool authority. */
import {exactObject,isObject,type AutomationScenario,type AutomationState,type PolicyAdapter,type PolicyDecision,type ToolCall,type Reservation} from './automation-contracts.ts';
import {automationTask} from './automation-fixtures.ts';
import {incidentCorpusId,inferIncident,sameLearnedNumbers,validateLearnedArtifact,validateLearningRequest,type LearnedArtifact,type LearningRequest,type LearningResult} from './automation-learning-model.ts';
export const learnedHandoffVersion='atlas-incident-proposal-1' as const;
export type LearnedActionHandoff={version:typeof learnedHandoffVersion;taskId:typeof automationTask.id;corpusId:typeof incidentCorpusId;model:LearnedArtifact;request:LearningRequest;result:LearningResult};
export function createLearnedHandoff(model:LearnedArtifact,request:LearningRequest):LearnedActionHandoff{const valid=validateLearnedArtifact(model),input=validateLearningRequest(request);return{version:learnedHandoffVersion,taskId:automationTask.id,corpusId:incidentCorpusId,model:valid,request:input,result:inferIncident(valid,input)};}
export function validateLearnedHandoff(value:unknown):LearnedActionHandoff{exactObject(value,['version','taskId','corpusId','model','request','result']);if(value.version!==learnedHandoffVersion||value.taskId!==automationTask.id||value.corpusId!==incidentCorpusId)throw Error('Incompatible learned proposal boundary.');const expected=createLearnedHandoff(validateLearnedArtifact(value.model),validateLearningRequest(value.request));if(!sameLearnedNumbers(value,expected))throw Error('Learned proposal does not match frozen model inference.');return expected;}
const successful=(s:AutomationState,name:string)=>s.observations.filter(x=>x.call.name===name&&x.result.ok);
export function learnedReservationDecision(state:AutomationState,handoff:LearnedActionHandoff,scenario?:AutomationScenario):PolicyDecision{
 const call=(name:ToolCall['name'],args:Record<string,unknown>):PolicyDecision=>({kind:'call',call:{name,arguments:args}}),last=state.observations.at(-1);
 if(last&&!last.result.ok){if(last.result.code==='ambiguous-timeout')return call('lookup_receipt',{idempotencyKey:`${automationTask.id}:reservation`});return{kind:'fail',detail:`The authored outer workflow stopped after ${last.result.code}. Learned output does not grant authority or repair a failed tool.`};}
 if(successful(state,'create_work_order').length)return{kind:'complete',detail:'The authored outer workflow reports completion; independently inspect the environment against incident-017.'};
 if(!successful(state,'read_asset').length)return call('read_asset',{assetId:automationTask.assetId});
 if(!successful(state,'search_manual').length)return call('search_manual',{assetId:automationTask.assetId});
 const result=handoff.result;if(!result.accepted||!result.parsed||!result.context)return{kind:'fail',detail:result.reason};
 // The corpus is identified in the handoff, but the runtime still supplies the current reference set.
 const manuals=successful(state,'search_manual').at(-1)!.result.value;if(!Array.isArray(manuals)||!manuals.some(x=>isObject(x)&&x.id===result.context!.id&&x.text===result.context!.text))return{kind:'fail',detail:'The runtime reference text differs from the frozen learned context. Obtain a new current proposal.'};
 let reservation:Reservation|undefined;
 const direct=successful(state,'reserve_part').at(-1)?.result.value;if(isObject(direct)&&typeof direct.id==='string')reservation=direct as Reservation;
 const receipt=successful(state,'lookup_receipt').at(-1)?.result.value;if(!reservation&&isObject(receipt)&&isObject(receipt.result)&&typeof receipt.result.id==='string')reservation=receipt.result as Reservation;
 if(!reservation)return call('reserve_part',{...result.parsed,quantity:scenario?.caseId==='schema-error'?String(result.parsed.quantity):result.parsed.quantity,evidenceId:result.context.id,idempotencyKey:`${automationTask.id}:reservation`});
 return call('create_work_order',{assetId:reservation.assetId,reservationId:reservation.id,evidenceId:reservation.evidenceId,idempotencyKey:`${automationTask.id}:work-order`});
}
export function learnedPolicyAdapter(value:LearnedActionHandoff):PolicyAdapter{const handoff=validateLearnedHandoff(value);return{identity:{kind:'actual-model',provider:'Atlas local teaching computation',model:'Fitted mean-embedding retriever + conditional token softmax; authored outer workflow'+(handoff.result.reranking?`; reranker ${handoff.result.reranking.version}`:''),configurationId:handoff.model.policyId},decide:(state,scenario)=>learnedReservationDecision(state,handoff,scenario)};}
