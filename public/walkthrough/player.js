(()=>{
  const video=document.getElementById('walkthrough-video');
  const status=document.getElementById('playback-status');
  const buttons=Array.from(document.querySelectorAll('[data-seek]'));
  const chapters=buttons.map(button=>({button,row:button.closest('[data-chapter]'),time:Number(button.dataset.seek),title:button.dataset.title}));
  let pending=null;
  const updateCurrent=()=>{
   let current=chapters[0];
   for(const chapter of chapters)if(video.currentTime>=chapter.time)current=chapter;
   for(const chapter of chapters){
    const active=chapter===current;chapter.row.classList.toggle('current',active);
    if(active)chapter.button.setAttribute('aria-current','true');else chapter.button.removeAttribute('aria-current');
   }
  };
  const seek=chapter=>{
   if(video.readyState===0){pending=chapter;status.textContent='Loading the video for '+chapter.title+'.';video.load();return;}
   const time=Number.isFinite(video.duration)?Math.min(chapter.time,Math.max(0,video.duration-.01)):chapter.time;
   video.currentTime=time;updateCurrent();
   status.textContent=chapter.title+'. '+(video.paused?'Press play to continue.':'Playing from this chapter.');
   video.scrollIntoView({block:'center',behavior:'auto'});video.focus({preventScroll:true});
  };
  for(const chapter of chapters){chapter.button.disabled=false;chapter.button.addEventListener('click',()=>seek(chapter));}
  video.addEventListener('loadedmetadata',()=>{if(pending){const chapter=pending;pending=null;seek(chapter);}});
  video.addEventListener('loadedmetadata',()=>{for(let i=0;i<video.textTracks.length;i++){const track=video.textTracks[i];if(track.kind==='captions')track.mode='showing';}},{once:true});
  video.addEventListener('timeupdate',updateCurrent);video.addEventListener('seeked',updateCurrent);
  const unavailable=()=>{pending=null;status.textContent='The video is unavailable. Read the transcript or open an experience below.';};
  video.addEventListener('error',unavailable);video.querySelector('source').addEventListener('error',unavailable);
  updateCurrent();
 })();
