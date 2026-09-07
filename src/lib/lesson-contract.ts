import type {RecordEntry} from './atlas';
const object=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==='string');
const fields=(v:unknown,names:string[])=>object(v)&&names.every(k=>typeof v[k]==='string');
const rows=(v:unknown,names:string[])=>Array.isArray(v)&&v.every(x=>fields(x,names));
/** Validate every field the reader renders before placing fetched content in its cache. */
export function validateLessonRecord(value:unknown,id:string):RecordEntry {
 if(!object(value)||value.id!==id)throw Error('Lesson identity does not match this edition.');
 const required=['id','level','name','shortName','role','description','tradeoff','whyAI','scale','kind','misconception'];
 if(!fields(value,required)||!strings(value.related)||!strings(value.mechanism)||!rows(value.specs,['label','value','context'])||!rows(value.interfaces,['name','direction','signal'])||!rows(value.sources,['title','url']))throw Error('Incomplete lesson content.');
 const c=value.check;
 if(!fields(c,['question','explanation'])||!object(c)||!strings(c.options)||c.options.length<2||typeof c.answer!=='number'||!Number.isInteger(c.answer)||c.answer<0||c.answer>=c.options.length)throw Error('Invalid lesson knowledge check.');
 for(const key of ['deepLabId','investigationId','labScope','labId','branch','subbranch','learningObjective','workstream','visualFamily','engineeringExample','evidenceNotes'])if(value[key]!==undefined&&typeof value[key]!=='string')throw Error('Invalid lesson metadata.');
 if(value.prerequisites!==undefined&&!strings(value.prerequisites))throw Error('Invalid prerequisite list.');
 if(value.checks!==undefined&&(!Array.isArray(value.checks)||!value.checks.every(x=>fields(x,['question','explanation'])&&object(x)&&strings(x.options)&&x.options.length>=2&&typeof x.answer==='number'&&Number.isInteger(x.answer)&&x.answer>=0&&x.answer<x.options.length)))throw Error('Invalid further-practice check.');
 if(value.science!==undefined&&!rows(value.science,['title','equation','explanation','assumptions']))throw Error('Invalid scientific explanation.');
 if(value.history!==undefined&&(!Array.isArray(value.history)||!value.history.every(h=>fields(h,['title','significance'])&&object(h)&&(typeof h.year==='string'||(typeof h.year==='number'&&Number.isFinite(h.year)))&&fields(h.source,['title','url']))))throw Error('Invalid historical reference.');
 return value as unknown as RecordEntry;
}
