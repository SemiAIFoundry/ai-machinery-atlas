import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdtempSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join,dirname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {runInNewContext} from 'node:vm';
import {loadCurrent} from '../docs/curation/curation-common.mjs';
const read=p=>readFileSync(p,'utf8'),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const captured=JSON.parse(read('examples/connected-walkthrough/capture-manifest.json'));
test('connected footage retains captured pixels, exact build evidence and the delivered video',()=>{
 assert.equal(captured.durationS,60);assert.equal(captured.frames.length,10);
 let at=0;for(const f of captured.frames){assert.equal(f.start,at);assert.equal(f.end,f.start+f.duration);at=f.end;assert.equal(hash('examples/connected-walkthrough/frames/'+f.file),f.sha256);assert.match(f.captureBuild.sourceSha256,/^[a-f0-9]{64}$/);assert.ok(f.capturedAt);}
 assert.equal(at,60);assert.equal(hash('public/connected/connected.mp4'),captured.artifactSha256);
 assert.deepEqual(JSON.parse(read('public/connected/capture.json')),captured);
 assert.ok(existsSync('public/walkthrough/navigation.mp4'));assert.ok(existsSync('public/ascent.html'));
});
test('every captured experience has a current canonical destination and a readable alternative',()=>{
 const ids=new Set(loadCurrent().atlas.records.map(r=>r.id)),html=read('public/connected.html'),transcript=read('public/connected/transcript.txt');
 assert.equal((html.match(/class="seek"/g)||[]).length,10);
 for(const f of captured.frames){assert.ok(ids.has(f.lesson),f.lesson);assert.ok(html.includes(`studio=${f.studio}`));assert.ok(transcript.includes(f.transcript));}
 assert.match(html,/<video[^>]*controls[^>]*playsinline/);assert.doesNotMatch(html,/<video[^>]*autoplay/);assert.match(html,/kind="captions"[^>]*default/);
 for(const file of ['captions.vtt','chapters.vtt']){const vtt=read('public/connected/'+file);assert.equal((vtt.match(/ --> /g)||[]).length,10);assert.match(vtt,file==='captions.vtt'?/00:00:59\.999/:/00:01:00\.000/);}
 const cues=[...read('public/connected/captions.vtt').matchAll(/00:(\d\d):(\d\d)\.(\d{3}) --> 00:(\d\d):(\d\d)\.(\d{3})/g)].map(m=>({start:+m[1]*60000 + +m[2]*1000 + +m[3],end:+m[4]*60000 + +m[5]*1000 + +m[6]}));
 for(let i=1;i<cues.length;i++)assert.ok(cues[i-1].end<cues[i].start,'Adjacent captions must not overlap on an exact chapter seek.');
 assert.match(html,/Captured build and frame evidence/);
});
function externalPlayer(html,page,base){
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
 assert.equal(scripts.length,1,'Each companion ships one external player.');
 const [,attributes,body]=scripts[0],src=attributes.match(/\bsrc="([^"]+)"/i)?.[1];
 assert.equal(src,`./${page}/player.js`,'Player URL must resolve within a root or subdirectory deployment.');
 assert.equal(body.trim(),'','Executable inline script would be blocked by script-src self.');
 assert.match(attributes,/\bdefer\b/);
 const file=resolve(base,src);assert.ok(existsSync(file),'The referenced player must be shipped.');
 assert.ok(read(file).trim());
 return file;
}
test('both companions ship relative external players for script-src self',()=>{
 for(const page of ['connected','walkthrough'])externalPlayer(read(`public/${page}.html`),page,'public');
 assert.equal(read('public/connected/player.js'),read('public/walkthrough/player.js'));
});
test('regenerating the connected companion also copies its executable player',()=>{
 const fixture=mkdtempSync(join(tmpdir(),'atlas-connected-page-'));
 try{
  for(const file of ['examples/connected-walkthrough/build-page.mjs','examples/connected-walkthrough/capture-manifest.json','public/walkthrough.html','public/walkthrough/player.js']){
   const destination=join(fixture,file);mkdirSync(dirname(destination),{recursive:true});copyFileSync(file,destination);
  }
  execFileSync(process.execPath,[join(fixture,'examples/connected-walkthrough/build-page.mjs')],{cwd:fixture,timeout:10000});
  const player=externalPlayer(read(join(fixture,'public/connected.html')),'connected',join(fixture,'public'));
  assert.equal(read(player),read('public/walkthrough/player.js'));
 }finally{rmSync(fixture,{recursive:true,force:true});}
});
function playerFixture({readyState=1,paused=true}={}){
 const target=()=>{
  const handlers=new Map();
  return {addEventListener(name,callback,options){const rows=handlers.get(name)||[];rows.push({callback,once:options?.once});handlers.set(name,rows);},
   dispatch(name){for(const handler of [...(handlers.get(name)||[])]){handler.callback();if(handler.once)handlers.set(name,handlers.get(name).filter(row=>row!==handler));}}};
 };
 const source=target(),status={textContent:''};
 const video=Object.assign(target(),{readyState,paused,currentTime:0,duration:60,textTracks:[{kind:'captions',mode:'hidden'}],loads:0,focusCalls:0,scrollCalls:0,
  load(){this.loads++;},focus(){this.focusCalls++;},scrollIntoView(){this.scrollCalls++;},querySelector(selector){assert.equal(selector,'source');return source;}});
 const buttons=captured.frames.map(frame=>{
  const attributes=new Map(),classes=new Set(),row={classList:{toggle(name,enabled){if(enabled)classes.add(name);else classes.delete(name);}}};
  return Object.assign(target(),{dataset:{seek:String(frame.start),title:frame.title},disabled:true,attributes,classes,
   closest(selector){assert.equal(selector,'[data-chapter]');return row;},setAttribute(name,value){attributes.set(name,value);},removeAttribute(name){attributes.delete(name);}});
 });
 const document={getElementById(id){if(id==='walkthrough-video')return video;if(id==='playback-status')return status;throw Error('Unexpected element '+id);},
  querySelectorAll(selector){assert.equal(selector,'[data-seek]');return buttons;}};
 runInNewContext(read('public/connected/player.js'),{document},{timeout:1000});
 return {video,status,buttons,source};
}
test('the shipped player seeks chapters without changing pause and updates accessible state',()=>{
 const {video,status,buttons}=playerFixture(),chapter=buttons.find(button=>button.dataset.seek==='24');
 assert.ok(buttons.every(button=>!button.disabled));chapter.dispatch('click');
 assert.equal(video.currentTime,24);assert.equal(video.paused,true);assert.equal(video.focusCalls,1);assert.equal(video.scrollCalls,1);
 assert.equal(status.textContent,chapter.dataset.title+'. Press play to continue.');
 assert.deepEqual(buttons.filter(button=>button.attributes.get('aria-current')==='true'),[chapter]);
 assert.ok(chapter.classes.has('current'));
 video.paused=false;buttons[5].dispatch('click');
 assert.equal(video.currentTime,30);assert.equal(video.paused,false);assert.match(status.textContent,/Playing from this chapter\.$/);
 const loading=playerFixture({readyState:0});loading.buttons[4].dispatch('click');
 assert.equal(loading.video.currentTime,0);assert.equal(loading.video.loads,1);assert.match(loading.status.textContent,/^Loading the video/);
 loading.video.readyState=1;loading.video.dispatch('loadedmetadata');
 assert.equal(loading.video.currentTime,24);assert.equal(loading.video.paused,true);assert.equal(loading.video.textTracks[0].mode,'showing');
 loading.source.dispatch('error');assert.match(loading.status.textContent,/Read the transcript or open an experience/);
});
