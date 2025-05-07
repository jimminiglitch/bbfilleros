//────────────────────────────────────────────────────────────────────────────
//   Main Script (public/script.js) - ULTIMATE CYBERPUNK UPGRADE (Fixed)
//────────────────────────────────────────────────────────────────────────────

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function () {
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// DOM ready handler with performance improvements
document.addEventListener("DOMContentLoaded", () => {
  initWindowControls();
  runBootSequence().then(() => {
    initDesktopIcons();
    initStarfield();
    initAudioVisualizer();
    initDOSLoader();
    initGlitchEffects();
  });
});

// 1) WINDOW CONTROLS
function initWindowControls() {
  document.querySelectorAll(".popup-window").forEach((win) => {
    const id = win.id;
    const header = win.querySelector(".window-header");
    const btnMin = header.querySelector(".minimize");
    const btnMax = header.querySelector(".maximize");
    const btnCls = header.querySelector(".close");

    if (btnMin) btnMin.addEventListener("click", () => minimizeWindow(id));
    if (btnMax) btnMax.addEventListener("click", () => toggleMaximizeWindow(id));
    if (btnCls) btnCls.addEventListener("click", () => closeWindow(id));

    // Dragging logic
    let isDragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return;
      if (win.classList.contains("maximized")) return;
      isDragging = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      win.style.zIndex = getNextZIndex();
      win.classList.add("dragging");
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        win.style.left = `${e.clientX - offsetX}px`;
        win.style.top = `${e.clientY - offsetY}px`;
      }
    }, { passive: true });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      win.classList.remove("dragging");
    }, { passive: true });

    // Double-click to maximize
    header.addEventListener("dblclick", (e) => {
      if (e.target.tagName !== "BUTTON") toggleMaximizeWindow(id);
    });

    // Resizing logic
    ["top","right","bottom","left","top-left","top-right","bottom-left","bottom-right"].forEach((dir) => {
      const resizer = document.createElement("div");
      resizer.classList.add("resizer", `resizer-${dir}`);
      win.appendChild(resizer);

      let isResizing = false;
      resizer.addEventListener("mousedown", (e) => {
        if (win.classList.contains("maximized")) return;
        e.preventDefault(); e.stopPropagation();
        isResizing = true; win.classList.add("resizing");
        const startX = e.clientX, startY = e.clientY;
        const startW = parseInt(getComputedStyle(win).width, 10);
        const startH = parseInt(getComputedStyle(win).height, 10);
        const startTop = win.offsetTop, startLeft = win.offsetLeft;

        function doDrag(ev) {
          if (!isResizing) return;
          let newW = startW, newH = startH, newT = startTop, newL = startLeft;
          if (dir.includes("right")) newW = Math.max(300, startW + ev.clientX - startX);
          if (dir.includes("bottom")) newH = Math.max(200, startH + ev.clientY - startY);
          if (dir.includes("left")) {
            const dx = ev.clientX - startX;
            newW = Math.max(300, startW - dx);
            newL = startLeft + dx;
          }
          if (dir.includes("top")) {
            const dy = ev.clientY - startY;
            newH = Math.max(200, startH - dy);
            newT = startTop + dy;
          }
          Object.assign(win.style, {
            width: `${newW}px`, height: `${newH}px`, top: `${newT}px`, left: `${newL}px`
          });
        }
        function stopDrag() {
          isResizing = false; win.classList.remove("resizing");
          window.removeEventListener("mousemove", doDrag);
          window.removeEventListener("mouseup", stopDrag);
        }
        window.addEventListener("mousemove", doDrag, { passive: true });
        window.addEventListener("mouseup", stopDrag, { passive: true });
      });
    });
  });
}

// 2) OPEN / MINIMIZE / CLOSE / MAXIMIZE & TASKBAR ICONS
let currentZIndex = 10;
const windowStates = {};
function getNextZIndex() { return ++currentZIndex; }

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // 1) Hide start menu & deactivate other windows
  document.getElementById("start-menu").style.display = "none";
  document.querySelectorAll(".popup-window").forEach(w => w.classList.remove("active"));

  // 2) Lazy-load iframes
  win.querySelectorAll("iframe[data-src]").forEach(iframe => {
    if (!iframe.src) iframe.src = iframe.dataset.src;
  });

  // 3) Play window-specific audio
  if (id === "toader" || id === "TIGERRR") {
    const audio = document.getElementById(`${id}-audio`);
    if (audio && audio.paused) { audio.volume = 0.6; audio.play().catch(()=>{}); }
  }

  // 4) Lazy-load & play videos
  win.querySelectorAll("video[data-src]").forEach(v => {
    if (!v.src) { v.src = v.dataset.src; v.load(); if (!isMobile()) v.play().catch(() => {}); }
  });

  // 5) Show & focus
  win.classList.remove("hidden");
  win.classList.add("active");
  win.style.display = "flex";
  win.style.zIndex = getNextZIndex();
  win.classList.add("window-opening");
  setTimeout(() => win.classList.remove("window-opening"), 500);

  // 6) Restore bounds or adapt
  const mobile = isMobile();
  if (mobile) {
    Object.assign(win.style, { top:"0", left:"0", width:"100vw", height:"calc(100vh - 36px)", transform:"none" });
  } else {
    const prev = windowStates[id];
    if (prev) Object.assign(win.style, prev);
    // clamp to viewport
    const rect = win.getBoundingClientRect();
    const m=20, vw=window.innerWidth, vh=window.innerHeight;
    let w=rect.width, h=rect.height, l=rect.left, t=rect.top;
    if (rect.width>vw-2*m) w=vw-2*m;
    if (rect.height>vh-2*m) h=vh-2*m;
    if (rect.left<m) l=m;
    if (rect.top<m) t=m;
    if (rect.right>vw-m) l=vw-m-w;
    if (rect.bottom>vh-m) t=vh-m-h;
    Object.assign(win.style, { width:`${w}px`, height:`${h}px`, left:`${l}px`, top:`${t}px` });
  }
}

function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add("window-minimizing");
  setTimeout(() => {
    win.classList.remove("window-minimizing", "window-opening");
    win.classList.add("hidden"); win.style.display="none";
    createTaskbarIcon(id);
  }, 300);
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    win.classList.add("window-closing");
    setTimeout(() => {
      const vid = win.querySelector("video"); if (vid) { vid.pause(); vid.currentTime=0; }
      win.classList.remove("window-closing");
      win.classList.add("hidden"); win.style.display="none";
    }, 300);
  }
  const icon = document.getElementById(`taskbar-icon-${id}`);
  if (icon) icon.remove();
  playSound("close");
}

function toggleMaximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  const doMax = !win.classList.contains("maximized");
  playSound(doMax?"maximize":"restore");

  if (doMax) {
    windowStates[id] = {
      parent: win.parentNode, next: win.nextSibling,
      position:win.style.position, top:win.style.top, left:win.style.left,
      right:win.style.right, bottom:win.style.bottom,
      width:win.style.width, height:win.style.height,
      transform:win.style.transform
    };
    win.classList.add("window-maximizing");
    setTimeout(() => {
      document.body.appendChild(win);
      win.classList.add("maximized"); win.classList.remove("window-maximizing");
      Object.assign(win.style, { position:"fixed", top:"0", left:"0", right:"0", bottom:"36px", width:"auto", height:"auto", transform:"none", zIndex:getNextZIndex() });
    },300);
  } else {
    win.classList.add("window-restoring"); win.classList.remove("maximized");
    setTimeout(() => {
      const prev = windowStates[id]||{};
      Object.assign(win.style, { position:prev.position||"absolute", top:prev.top||"", left:prev.left||"", right:prev.right||"", bottom:prev.bottom||"", width:prev.width||"", height:prev.height||"", transform:prev.transform||"", zIndex:getNextZIndex() });
      if (prev.parent) prev.parent.insertBefore(win, prev.next);
      win.classList.remove("window-restoring");
    },300);
  }
}

// 3) CLOCK & START MENU
function updateClock() {
  const clk = document.getElementById("clock");
  if (clk) {
    const n=new Date();
    const hh=n.getHours().toString().padStart(2,"0");
    const mm=n.getMinutes().toString().padStart(2,"0");
    const ss=n.getSeconds().toString().padStart(2,"0");
    clk.textContent=`${hh}:${mm}:${ss}`;
    clk.classList.add("clock-pulse"); setTimeout(()=>clk.classList.remove("clock-pulse"),500);
  }
}
setInterval(updateClock,1000); updateClock();

document.getElementById("start-button").addEventListener("click",()=>{
  const m=document.getElementById("start-menu");
  const vis=m.style.display==="flex";
  if(vis){ m.classList.add("menu-hiding"); setTimeout(()=>{ m.style.display="none"; m.classList.remove("menu-hiding"); },300); }
  else { m.style.display="flex"; m.classList.add("menu-showing"); setTimeout(()=>m.classList.remove("menu-showing"),300); }
  playSound("click");
});

// 4) BOOT SEQUENCE
function runBootSequence() {
  return new Promise(resolve => {
    const bootScreen=document.getElementById("bootScreen");
    const logEl=document.getElementById("boot-log");
    const progress=document.getElementById("progress-bar");
    const msgs=[
      "[ OK ] Initializing hardware...",
      "[ OK ] Loading kernel modules...",
      "[ OK ] Mounting filesystems...",
      "[ OK ] Starting system services...",
      "[ OK ] Loading neural interface...",
      "[ OK ] Connecting to cyberspace...",
      "[ OK ] CyberDeck v2.0 ready.",
      "[ DONE ] Boot complete.",
    ];
    let idx=0, total=msgs.length, delay=400;
    const typer=setInterval(() => {
      logEl.textContent+=msgs[idx]+"\n";
      logEl.scrollTop=logEl.scrollHeight;
      progress.style.width=`${((idx+1)/total)*100}%`;
      playSound("type");
      idx++;
      if(idx===total) {
        clearInterval(typer);
        setTimeout(() => {
          bootScreen.style.transition="opacity 0.8s";
          bootScreen.style.opacity="0";
          playSound("bootComplete");
          setTimeout(() => { bootScreen.style.display="none"; resolve(); }, 800);
        }, 500);
      }
    }, delay);
  });
}

// 5) DESKTOP ICONS
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    icon.addEventListener("click",()=>{ openWindow(icon.dataset.window); playSound("click"); });
    icon.addEventListener("mouseenter",()=>{ icon.classList.add("icon-hover"); playSound("hover"); });
    icon.addEventListener("mouseleave",()=> icon.classList.remove("icon-hover"));
    icon.addEventListener("mousedown", /* drag-group logic same as before */);
    icon.ondragstart=()=>false;
  });
}

// 6) CLICK-AND-DRAG MULTI-SELECT
let selStartX,selStartY,selDiv;
window.addEventListener("mousedown",onSelectStart);
function onSelectStart(e){ if(e.target.closest(".desktop-icon, .popup-window, #start-bar, #start-menu")) return; selStartX=e.clientX; selStartY=e.clientY; selDiv=document.createElement("div"); selDiv.id="selection-rect"; selDiv.style.left=`${selStartX}px`; selDiv.style.top=`${selStartY}px`; selDiv.style.width="0px"; selDiv.style.height="0px"; document.body.appendChild(selDiv); document.addEventListener("mousemove",onSelectMove,{passive:true}); document.addEventListener("mouseup",onSelectEnd,{once:true,passive:true}); e.preventDefault(); }
function onSelectMove(e){ if(!selDiv)return; const x=Math.min(e.clientX,selStartX), y=Math.min(e.clientY,selStartY), w=Math.abs(e.clientX-selStartX), h=Math.abs(e.clientY-selStartY); selDiv.style.left=`${x}px`; selDiv.style.top=`${y}px`; selDiv.style.width=`${w}px`; selDiv.style.height=`${h}px`; const box=selDiv.getBoundingClientRect(); document.querySelectorAll(".desktop-icon").forEach(icon=>{ const r=icon.getBoundingClientRect(); const inside=r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom; icon.classList.toggle("selected",inside); }); }
function onSelectEnd(){ if(selDiv) selDiv.remove(); selDiv=null; }

// 7) STARFIELD BACKGROUND
function initStarfield() {
  const canvas = document.getElementById("background-canvas");
  const ctx    = canvas.getContext("2d");
  const numStars = 300;
  let stars = [];

  function initStars() {
    stars = Array.from({length:numStars},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,z:Math.random()*canvas.width,o:Math.random()}));
  }

  const handleResize = debounce(()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; initStars(); },250);
  window.addEventListener("resize", handleResize);
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  initStars();

  let lastTime=0;
  const fps=30, frameInterval=1000/fps;
  function animate(timestamp){ if(!lastTime) lastTime=timestamp; const elapsed=timestamp-lastTime; if(elapsed>frameInterval){ lastTime=timestamp-(elapsed%frameInterval); ctx.fillStyle="rgba(0,0,0,0.4)"; ctx.fillRect(0,0,canvas.width,canvas.height); const batchSize=Math.min(100,stars.length); for(let i=0;i<batchSize;i++){ const s=stars[i]; s.z-=2; if(s.z<=0){ s.z=canvas.width; s.x=Math.random()*canvas.width; s.y=Math.random()*canvas.height; s.o=Math.random(); } const k=128.0/s.z; const px=(s.x-canvas.width/2)*k+canvas.width/2; const py=(s.y-canvas.height/2)*k+canvas.height/2; const sz=Math.max(0,(1-s.z/canvas.width)*3); ctx.globalAlpha=s.o; ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(px,py,sz,0,Math.PI*2); ctx.fill(); } stars.push(...stars.splice(0,batchSize)); } ctx.globalAlpha=1; requestAnimationFrame(animate); }
  requestAnimationFrame(animate);
}

// Placeholder functions for audio, DOS, glitch etc.
function initAudioVisualizer(){}
function initDOSLoader(){}
function initGlitchEffects(){}
function playSound(name) { const url=soundEffects[name]; if(!url)return; const a=new Audio(url); a.volume=0.5; a.play().catch(()=>{}); }

// Sound effect URLs
const soundEffects = { click: "...", hover: "...", type: "...", bootComplete: "...", maximize: "...", restore: "...", close: "..." };

// Helper
function isMobile(){ return window.innerWidth<768; }
