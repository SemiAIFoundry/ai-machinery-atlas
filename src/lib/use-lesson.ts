import {useEffect,useState} from 'react';
import {byId,type RecordEntry} from './atlas';
import {validateLessonRecord} from './lesson-contract';
const cache=new Map<string,RecordEntry>();
export function useLesson(id:string){
 const [entry,setEntry]=useState<RecordEntry|undefined>(cache.get(id)),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;const controller=new AbortController();setError('');const summary=byId[id];if(!summary){setEntry(undefined);setError('This lesson is not part of the current edition.');return;}const prior=cache.get(id);if(prior){setEntry(prior);return;}setEntry(undefined);
  fetch(`${import.meta.env.BASE_URL}${summary.asset}`,{signal:controller.signal}).then(async response=>{if(!response.ok)throw Error('Lesson download failed.');const value=validateLessonRecord(await response.json(),id);cache.set(id,value);if(active)setEntry(value);}).catch(e=>{if(active&&e.name!=='AbortError')setError('This lesson could not be loaded. Check your connection and retry.');});
  return()=>{active=false;controller.abort();};
 },[id,retry]);
 return {lesson:entry?.id===id?entry:undefined,error,retry:()=>setRetry(n=>n+1)};
}
