/** Build the accessible companion from its preserved capture record. */
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../..');
const capture=JSON.parse(readFileSync(resolve(here,'capture-manifest.json'),'utf8'));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const stamp=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
const vtt=s=>{const ms=Math.round(s*1000);return `00:${String(Math.floor(ms/60000)).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;};
const route=r=>`./#${r.lesson}~v=1&studio=${r.studio}`;
const directory=resolve(root,'public/connected');mkdirSync(directory,{recursive:true});
copyFileSync(resolve(root,'public/walkthrough/player.js'),resolve(directory,'player.js'));
const nav=capture.frames.map((r,i)=>`<li class="chapter" data-chapter="${r.studio}"><button type="button" class="seek" data-seek="${r.start}" data-title="${esc(r.title)}" aria-controls="walkthrough-video" aria-label="Seek to ${stamp(r.start)}: ${esc(r.title)}" disabled><span class="chapter-index" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span>${esc(r.title)}</span><time>${stamp(r.start)}</time></button><a class="lesson-link" href="${esc(route(r))}">Explore this experience <span aria-hidden="true">↗</span><span class="sr-only">: ${esc(r.title)}</span></a></li>`).join('\n');
const transcript=capture.frames.map(r=>`<section class="transcript-chapter" aria-labelledby="transcript-${r.studio}"><h3 id="transcript-${r.studio}"><time>${stamp(r.start)}</time> ${esc(r.title)}</h3><p>${esc(r.transcript)}</p><a href="${esc(route(r))}">Open the experience and related lesson <span aria-hidden="true">↗</span></a></section>`).join('\n');
let html=readFileSync(resolve(root,'public/walkthrough.html'),'utf8');
html=html.replace('<title>Follow the machinery | AI Machinery Atlas</title>','<title>Inside the machinery | AI Machinery Atlas</title>')
 .replace('A captioned navigation companion to the AI Machinery Atlas: eight engineering experiences, a readable transcript and links to the lessons.','Inspect actual data, learned state, memory faults and recovery through ten captioned atlas moments, with a transcript and interactive lesson links.')
 .replace('<h1>Follow the machinery.</h1>','<h1>Inside the machinery.</h1>')
 .replace('Eight ways to inspect a mechanism, change an assumption and follow the result into the lessons.','Follow actual values through ten moments of discovery: from the material that enables a transition to the learned state that survives a factory fault.')
 .replace('Follow the machinery: eight atlas engineering experiences','Inside the machinery: ten connected learning moments')
 .replaceAll('./walkthrough/','./connected/').replaceAll('navigation.mp4','connected.mp4')
 .replace(/<ol class="chapter-list">[\s\S]*?<\/ol>/,`<ol class="chapter-list">${nav}</ol>`)
 .replace(/<div class="transcript-grid">[\s\S]*?<\/div>\s*<\/section>/,`<div class="transcript-grid">${transcript}</div>\n   </section>`)
 .replace('Actual atlas interface captures, edited with pauses for reading and the original atlas score. Pause whenever you want to inspect a screen.','Actual interface captures, edited with reading pauses and the original Open Horizons score. These are distinct bounded specimens; explicit handoffs preserve state where described. Pause to inspect a screen, then open its experience.')
 .replace('<a href="./build-info.json">Build identity</a>','<a href="./connected/capture.json">Captured build and frame evidence</a><a href="./build-info.json">Current atlas build</a><a href="./walkthrough.html">Original navigation companion</a>')
 .replace('Made for reading, inspecting and returning to the machinery. Original atlas score reused for this companion.','Captured working-preview states retain their individual build identities. Later atlas changes do not relabel this footage. Original instrumental score; no narration. © Semi AI Foundry, LLC.');
writeFileSync(resolve(root,'public/connected.html'),html);
// Leave 1 ms between caption cues: some native players display both cues when
// a chapter seek lands exactly on a shared endpoint.
writeFileSync(resolve(directory,'captions.vtt'),'WEBVTT\n\n'+capture.frames.map((r,i)=>`${i+1}\n${vtt(r.start)} --> ${vtt(r.end-.001)}\n${r.title}. ${r.caption}\n`).join('\n'));
writeFileSync(resolve(directory,'chapters.vtt'),'WEBVTT\n\n'+capture.frames.map(r=>`${vtt(r.start)} --> ${vtt(r.end)}\n${r.title}\n`).join('\n'));
writeFileSync(resolve(directory,'transcript.txt'),'INSIDE THE MACHINERY — AI MACHINERY ATLAS\n\n'+capture.method+'\nInstrumental original score; no narration.\n\n'+capture.frames.map(r=>`${stamp(r.start)} — ${r.title}\n${r.transcript}\nExperience: ${r.lesson} / ${r.studio}\n`).join('\n'));
writeFileSync(resolve(directory,'capture.json'),JSON.stringify(capture,null,2)+'\n');
console.log('Built ten accessible chapters, caption cues, transcript and immutable capture evidence.');
