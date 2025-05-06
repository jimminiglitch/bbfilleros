### /script.js
```js
// Core desktop logic with lazy-loading windows
let currentZ = 10;
const windowStates = {};
function getNextZ(){ return ++currentZ; }

function openWindow(id){
  const win = document.getElementById(id);
  if(!win) return;
  document.getElementById('start-menu').style.display='none';
  document.querySelectorAll('.popup-window').forEach(w=>w.classList.remove('active'));
  win.classList.add('active');
  win.style.zIndex = getNextZ();
  // lazy-load iframe content
  const iframe = win.querySelector('iframe');
  if(iframe && !iframe.src){ iframe.src = win.dataset.src; }
  // restore previous geometry
  if(windowStates[id]) Object.assign(win.style, windowStates[id]);
}

function minimizeWindow(id){
  const win = document.getElementById(id);
  if(!win) return;
  win.classList.remove('active');
  const btn = document.createElement('button');
  btn.id = `taskbar-icon-${id}`;
  btn.className = 'taskbar-icon';
  btn.textContent = id.toUpperCase();
  btn.onclick = ()=>{ openWindow(id); document.getElementById(btn.id).remove(); };
  document.getElementById('taskbar-icons').appendChild(btn);
}

function closeWindow(id){
  const win = document.getElementById(id);
  if(win) win.classList.remove('active');
  const icon = document.getElementById(`taskbar-icon-${id}`);
  if(icon) icon.remove();
}

function toggleMax(id){
  const win = document.getElementById(id);
  if(!win) return;
  if(!win.classList.contains('max')){
    windowStates[id] = { top:win.style.top, left:win.style.left, width:win.style.width, height:win.style.height };
    Object.assign(win.style,{top:'0',left:'0',width:'100%',height:'100%'});
    win.classList.add('max');
  } else {
    Object.assign(win.style, windowStates[id]);
    win.classList.remove('max');
  }
}

// Event wiring on load
window.addEventListener('load', ()=>{
  document.querySelectorAll('.popup-window').forEach(win=>{
    const id = win.id;
    win.querySelector('.minimize').onclick = ()=> minimizeWindow(id);
    win.querySelector('.maximize').onclick = ()=> toggleMax(id);
    win.querySelector('.close').onclick    = ()=> closeWindow(id);
    // dragging
    let drag=false, ox=0, oy=0;
    const hdr = win.querySelector('.window-header');
    hdr.onmousedown = e=>{ drag=true; ox=e.clientX-win.offsetLeft; oy=e.clientY-win.offsetTop; win.style.zIndex=getNextZ(); };
    document.onmousemove = e=>{ if(drag) win.style.cssText += `;left:${e.clientX-ox}px;top:${e.clientY-oy}px;`; };
    document.onmouseup = ()=> drag=false;
  });
  // desktop icons
  document.querySelectorAll('.desktop-icon').forEach(ic=>{ ic.ondblclick = ()=> openWindow(ic.dataset.window); ic.ondragstart = ()=> false; });
  // start menu
  const startBtn = document.getElementById('start-button');
  startBtn.onclick = ()=>{
    const m = document.getElementById('start-menu');
    m.style.display = (m.style.display==='flex')?'none':'flex';
  };
  // clock
  setInterval(()=>{ document.getElementById('clock').textContent = new Date().toLocaleTimeString(); },1000);
});

// Starfield background
function initStarfield(){
  const c = document.getElementById('background-canvas'); const ctx = c.getContext('2d');
  function resize(){ c.width=innerWidth; c.height=innerHeight; }
  window.onresize = resize; resize();
  const stars = Array.from({length:300}, ()=>({ x:Math.random()*c.width, y:Math.random()*c.height, z:Math.random()*c.width, o:Math.random() }));
  (function animate(){ ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0,0,c.width,c.height);
    stars.forEach(s=>{
      s.z -= 2; if(s.z<=0){ s.z=c.width; s.x=Math.random()*c.width; s.y=Math.random()*c.height; }
      const k=128/s.z, px=(s.x-c.width/2)*k+c.width/2, py=(s.y-c.height/2)*k+c.height/2;
      ctx.globalAlpha = s.o; ctx.beginPath(); ctx.arc(px,py,(1-s.z/c.width)*3,0,2*Math.PI); ctx.fill();
    }); ctx.globalAlpha =1; requestAnimationFrame(animate);
  })();
}
window.addEventListener('load', initStarfield);