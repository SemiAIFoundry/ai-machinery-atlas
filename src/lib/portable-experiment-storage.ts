/** Local storage transaction for explicitly saved experiment inputs. No implicit lesson completion. */
export type PortableStorage={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void;removeItem:(key:string)=>void};
const capacity=30,maxHistoryBytes=1000000,defaultMaxRecordBytes=20000;
export type PortableWorkspaceOptions={maxRecordBytes?:number};
const bytes=(text:string)=>new TextEncoder().encode(text).length;
const assert=(condition:unknown,message:string)=>{if(!condition)throw Error(message);};
export function createPortableWorkspace(storage:PortableStorage,key:string,options:PortableWorkspaceOptions={}){
 const maxRecordBytes=options.maxRecordBytes??defaultMaxRecordBytes;
 assert(Number.isSafeInteger(maxRecordBytes)&&maxRecordBytes>=1&&maxRecordBytes<=650000,'Portable record limit must be an integer from 1 to 650,000 bytes.');
 let expected:string|null=null,initialError:string|null=null;
 try{expected=storage.getItem(key);}catch{initialError='Browser storage is unavailable. Export the current inputs instead.';}
 const unchanged=()=>{assert(initialError===null,initialError??'');assert(storage.getItem(key)===expected,'Another view changed this saved record. Export current inputs and reload before saving.');};
 const historyKey=key+'.history',legacyKey=key+'.previous';
 function recovery(){return{kind:'atlas-portable-raw-recovery',storageKey:key,activeRaw:storage.getItem(key),historyRaw:storage.getItem(historyKey),legacyPreviousRaw:storage.getItem(legacyKey)};}
 return{
  get initialError(){return initialError;},
  read(){const raw=storage.getItem(key);return raw;},
  save(raw:string){
   assert(typeof raw==='string'&&bytes(raw)<=maxRecordBytes,`Current record exceeds ${maxRecordBytes.toLocaleString('en-US')} bytes.`);unchanged();
   const historyRaw=storage.getItem(historyKey);assert(historyRaw===null||bytes(historyRaw)<=maxHistoryBytes,'Recovery history exceeds its bound; export recovery before replacing it.');
   let history:unknown;try{history=historyRaw===null?[]:JSON.parse(historyRaw);}catch{throw Error('Recovery history is unreadable. Export its exact text before clearing it.');}
   assert(Array.isArray(history)&&history.length<=capacity&&history.every(x=>typeof x==='string'),'Recovery history is invalid. Export its exact text before clearing it.');
   const previous=storage.getItem(legacyKey),next=[...(history as string[])];
   for(const candidate of [previous,expected])if(candidate!==null&&!next.includes(candidate))next.push(candidate);
   assert(next.length<=capacity,'Recovery history is full (30 prior records). Export it before clearing it.');const nextHistory=JSON.stringify(next);assert(bytes(nextHistory)<=maxHistoryBytes,'Recovery history exceeds 1,000,000 bytes. Export it before clearing it.');
   // Exact older data is copied before the active pointer is touched. A failed active write can leave
   // an extra safe recovery copy, but never loses the active record or the reader's current live inputs.
   if(nextHistory!==historyRaw)storage.setItem(historyKey,nextHistory);unchanged();storage.setItem(key,raw);expected=raw;
  },
  recoveryText(){return JSON.stringify(recovery(),null,2);},
  recoveryIdentity(){return JSON.stringify({historyRaw:storage.getItem(historyKey),legacyPreviousRaw:storage.getItem(legacyKey)});},
  clearExportedHistory(identity:string){assert(identity===JSON.stringify({historyRaw:storage.getItem(historyKey),legacyPreviousRaw:storage.getItem(legacyKey)}),'Recovery data changed after export. Export it again before clearing history.');storage.removeItem(legacyKey);storage.setItem(historyKey,'[]');},
  previousRecords(){const raw=storage.getItem(historyKey);assert(raw===null||bytes(raw)<=maxHistoryBytes,'Recovery history exceeds its bound. Export recovery text.');const value=raw===null?[]:JSON.parse(raw);assert(Array.isArray(value)&&value.length<=capacity&&value.every(x=>typeof x==='string'),'Recovery history is unreadable. Export recovery text.');const result=value as string[],legacy=storage.getItem(legacyKey);return legacy!==null&&!result.includes(legacy)?[legacy,...result]:result;},
 };
}
