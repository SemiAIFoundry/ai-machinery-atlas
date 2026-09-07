type Check={question:string;options:string[];answer:number;explanation:string};
type Source={title:string;url:string};
type Science={title:string;equation:string;explanation:string;assumptions:string};
export type LessonEnrichment={appendDescription?:string;appendMechanism?:string[];appendEngineeringExample?:string;appendEvidenceNotes?:string;additionalChecks?:Check[];additionalRelated?:string[];additionalSources?:Source[];additionalScience?:Science[]};
type Enrichable={id:string;description:string;mechanism:string[];engineeringExample?:string;evidenceNotes?:string;checks?:Check[];related:string[];sources:Source[];science?:Science[]};
export function enrichLesson<T extends Enrichable>(lesson:T,additions:Record<string,LessonEnrichment>[]){
 let r={...lesson};const join=(a:string|undefined,b:string|undefined)=>b?[a,b].filter(Boolean).join('\n\n'):a;
 for(const pack of additions){const e=pack[r.id];if(!e)continue;
  r={...r,description:join(r.description,e.appendDescription)!,mechanism:[...r.mechanism,...(e.appendMechanism||[])],engineeringExample:join(r.engineeringExample,e.appendEngineeringExample),evidenceNotes:join(r.evidenceNotes,e.appendEvidenceNotes),checks:[...(r.checks||[]),...(e.additionalChecks||[])],related:[...new Set([...r.related,...(e.additionalRelated||[])])],sources:[...new Map([...r.sources,...(e.additionalSources||[])].map(x=>[x.url,x])).values()],science:[...(r.science||[]),...(e.additionalScience||[])]};
 }
 return r;
}
