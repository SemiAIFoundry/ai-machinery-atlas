import {useEffect,useState} from 'react';
import {byId,type RecordEntry} from './atlas';
const cache=new Map<string,RecordEntry>();
export function useLesson(id:string){
 const [entry,setEntry]=useState<RecordEntry|undefined>(cache.get(id)),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;const controller=new AbortController();setError('');const summary=byId[id];const prior=cache.get(id);if(prior){setEntry(prior);return;}setEntry(undefined);
  fetch(`${import.meta.env.BASE_URL}${summary.asset}`,{signal:controller.signal}).then(async response=>{if(!response.ok)throw Error('Lesson download failed.');const value=await response.json();if(value.id!==id||typeof value.description!=='string'||!Array.isArray(value.mechanism)||!Array.isArray(value.sources)||!value.check)throw Error('Lesson data does not match this edition.');cache.set(id,value);if(active)setEntry(value);}).catch(e=>{if(active&&e.name!=='AbortError')setError('This lesson could not be loaded. Check your connection and retry.');});
  return()=>{active=false;controller.abort();};
 },[id,retry]);
 return {lesson:entry?.id===id?entry:undefined,error,retry:()=>setRetry(n=>n+1)};
}
