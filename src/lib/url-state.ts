export type AtlasUrlState={lesson:string;view:'anatomy'|'process'|'dependencies';processStep:number;path:string;pathStep:number;comparison:string};
export function parseAtlasHash(hash:string):AtlasUrlState{
 const [raw='',query='']=hash.replace(/^#/,'').split('~');let lesson='';try{lesson=decodeURIComponent(raw);}catch{}
 const p=new URLSearchParams(query),known=p.get('v')==='1';const view=known?p.get('view'):null;
 const integer=(name:string)=>Math.min(1000,Math.max(0,Math.floor(Number(p.get(name))||0)));
 return {lesson,view:view==='process'||view==='dependencies'?view:'anatomy',processStep:known?integer('step'):0,path:known?p.get('path')||'':'',pathStep:known?integer('pathStep'):0,comparison:known?p.get('compare')||'':''};
}
export function encodeAtlasHash(s:AtlasUrlState){
 const p=new URLSearchParams();if(s.view!=='anatomy'||s.path||s.comparison){p.set('v','1');if(s.view!=='anatomy')p.set('view',s.view);if(s.view==='process')p.set('step',String(s.processStep));if(s.path){p.set('path',s.path);p.set('pathStep',String(s.pathStep));}if(s.comparison)p.set('compare',s.comparison);}
 return '#'+encodeURIComponent(s.lesson)+(p.size?'~'+p.toString():'');
}
