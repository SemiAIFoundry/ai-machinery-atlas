import type {LearnedActionHandoff} from './automation-learned-bridge.ts';
/** Synthetic incident environment. These quantities are fixture data, not equipment guidance. */
export const automationVersion = 'atlas-automation-1';
export type AutomationMode = 'fixed-workflow' | 'authored-policy';
export type AutomationCase = 'normal' | 'commit-timeout' | 'duplicate-delivery' | 'schema-error' | 'authority-denied' | 'malicious-manual' | 'cancel-before-write' | 'cancel-after-commit' | 'wrong-entity';
export type AutomationScenario = {version:typeof automationVersion;runId:string;caseId:AutomationCase;mode:AutomationMode;maxCalls:number;admissionDelayMs:number;approvalWaitMs:number};
export type ToolName = 'read_asset'|'search_manual'|'reserve_part'|'lookup_receipt'|'create_work_order'|'export_registry';
export type ToolCall = {name:ToolName;arguments:Record<string,unknown>};
export type ValidToolCall =
 | {name:'read_asset';arguments:{assetId:string}}
 | {name:'search_manual';arguments:{assetId:string}}
 | {name:'reserve_part';arguments:{assetId:string;partId:string;quantity:number;evidenceId:string;idempotencyKey:string}}
 | {name:'lookup_receipt';arguments:{idempotencyKey:string}}
 | {name:'create_work_order';arguments:{assetId:string;reservationId:string;evidenceId:string;idempotencyKey:string}}
 | {name:'export_registry';arguments:{destination:string}};
export type Manual = {id:string;assetId:string;partId:string;quantity:number;text:string;trust:'untrusted-reference'};
export type Reservation = {id:string;assetId:string;partId:string;quantity:number;evidenceId:string};
export type WorkOrder = {id:string;assetId:string;reservationId:string;evidenceId:string};
export type Receipt = {key:string;fingerprint:string;tool:'reserve_part'|'create_work_order';result:Reservation|WorkOrder;committedAtMs:number};
export type AutomationEnvironment = {assets:{id:string;label:string}[];manuals:Manual[];stock:Record<string,number>;reservations:Reservation[];workOrders:WorkOrder[];receipts:Receipt[];exports:string[]};
export type ToolResult = {ok:boolean;code:string;value:unknown;reusedReceipt?:boolean};
export type EventKind = 'delivery-received'|'delivery-started'|'delivery-deduplicated'|'call-proposed'|'schema-valid'|'schema-rejected'|'authority-granted'|'authority-denied'|'approval-requested'|'approval-granted'|'approval-denied'|'service-started'|'tool-result'|'service-replayed'|'transport-timeout'|'worker-restarted'|'cancel-requested'|'run-canceled'|'run-completed'|'run-failed';
export type AutomationEvent = {seq:number;atMs:number;kind:EventKind;detail:string;data:Record<string,unknown>};
export type JournalDocument = {version:typeof automationVersion;scenario:AutomationScenario;events:AutomationEvent[];learnedHandoff?:LearnedActionHandoff};
export type EnvironmentDocument = {version:typeof automationVersion;runId:string;value:AutomationEnvironment};
export type AutomationSnapshot = {document:JournalDocument;environment:AutomationEnvironment};
export type RunStatus = 'queued'|'running'|'awaiting-approval'|'recovering'|'completed'|'failed'|'canceled';
export type PipelineStage = 'validate'|'authorize'|'approval'|'service'|'result';
export type ObservedCall = {id:string;call:ToolCall;result:ToolResult};
export type AutomationState = {status:RunStatus;atMs:number;queue:number;deliveries:number;duplicateDeliveries:number;active:boolean;pending:null|{id:string;call:ToolCall;stage:PipelineStage;approvedFingerprint?:string};observations:ObservedCall[];callCount:number;errorCount:number;cancelRequested:boolean;lastDetail:string};
export type PolicyDecision = {kind:'call';call:ToolCall}|{kind:'complete';detail:string}|{kind:'fail';detail:string};
/** A future real-model adapter receives only observable state and must return observable calls.
 * Model provenance is mandatory; generated internal reasoning is neither requested nor recorded. */
export type PolicyAdapter = {identity:{kind:'actual-model';provider:string;model:string;configurationId:string};decide:(observation:Readonly<AutomationState>,scenario:Readonly<AutomationScenario>)=>PolicyDecision};
export const isObject=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
export function exactObject(value:unknown,keys:readonly string[]):asserts value is Record<string,unknown>{if(!isObject(value)||Object.keys(value).length!==keys.length||Object.keys(value).some(k=>!keys.includes(k)))throw Error('Unexpected or missing fields.');}
export function canonicalJson(value:unknown):string {if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']';if(isObject(value))return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalJson(value[k])).join(',')+'}';return JSON.stringify(value);}
export function validateAutomationScenario(value:unknown):AutomationScenario {
 exactObject(value,['version','runId','caseId','mode','maxCalls','admissionDelayMs','approvalWaitMs']);
 if(value.version!==automationVersion||typeof value.runId!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(value.runId))throw Error('Invalid automation identity.');
 if(!['normal','commit-timeout','duplicate-delivery','schema-error','authority-denied','malicious-manual','cancel-before-write','cancel-after-commit','wrong-entity'].includes(String(value.caseId))||!['fixed-workflow','authored-policy'].includes(String(value.mode)))throw Error('Invalid automation case or policy.');
 for(const [key,min,max] of [['maxCalls',1,30],['admissionDelayMs',0,5000],['approvalWaitMs',0,60000]] as const)if(typeof value[key]!=='number'||!Number.isInteger(value[key])||value[key]<min||value[key]>max)throw Error('Invalid automation budget or synthetic time.');
 return structuredClone(value) as AutomationScenario;
}
