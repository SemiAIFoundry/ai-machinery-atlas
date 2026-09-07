export type AtlasUrlState={lesson:string;view:'anatomy'|'process'|'dependencies';processStep:number;path:string;pathStep:number;comparison:string;investigation?:string;scenario?:string;studio?:string;explore?:string};
export function parseAtlasHash(hash:string):AtlasUrlState{
 const [raw='',query='']=hash.replace(/^#/,'').split('~');let lesson='';try{lesson=decodeURIComponent(raw);}catch{}
 const p=new URLSearchParams(query),known=p.get('v')==='1';const view=known?p.get('view'):null;
 const integer=(name:string)=>Math.min(1000,Math.max(0,Math.floor(Number(p.get(name))||0)));
 return {lesson,explore:known&&p.get('explore')==='lifecycle'?'lifecycle':'',view:view==='process'||view==='dependencies'?view:'anatomy',processStep:known?integer('step'):0,path:known?p.get('path')||'':'',pathStep:known?integer('pathStep'):0,comparison:known?p.get('compare')||'':'',studio:known?['fabrication','architecture','realization','memory','hall','applications','orbital','progress','foundations','learning','automation','machine','reliability','control','commissioning','retrieval','families','distributed','evaluation','decisions','cell','serving','data','factory','memory-workload','ranking','network','projection'].find(id=>id===p.get('studio'))||'':'',investigation:known?p.get('case')||'':'',scenario:known&&(p.get('scenario')?.length||0)<10000?p.get('scenario')||'':''};
}
export function encodeAtlasHash(s:AtlasUrlState){
 const p=new URLSearchParams();if(s.view!=='anatomy'||s.path||s.comparison||s.investigation||s.studio||s.explore){p.set('v','1');if(s.explore==='lifecycle')p.set('explore','lifecycle');if(s.view!=='anatomy')p.set('view',s.view);if(s.view==='process')p.set('step',String(s.processStep));if(s.path){p.set('path',s.path);p.set('pathStep',String(s.pathStep));}if(s.comparison)p.set('compare',s.comparison);if(s.studio)p.set('studio',s.studio);if(s.investigation){p.set('case',s.investigation);if(s.scenario)p.set('scenario',s.scenario);}}
 return '#'+encodeURIComponent(s.lesson)+(p.size?'~'+p.toString():'');
}
