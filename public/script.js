//────────────────────────────────────────
//   Main Script (script.js)
//────────────────────────────────────────

// Open a window by ID, play videos & reload iframes
function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Hide start menu & deactivate other windows
  document.getElementById("start-menu").style.display = "none";
  document.querySelectorAll(".popup-window").forEach(w => w.classList.remove("active"));

  // Show & focus this window
  win.classList.remove("hidden");
  win.classList.add("active");
  win.style.display = "flex";
  win.style.zIndex = getNextZIndex();

  // Restore previous position/size if stored
  const stored = windowStates[id];
  if (stored) Object.assign(win.style, stored);

  // Clamp within viewport
  const rect = win.getBoundingClientRect();
  const m = 20, vw = innerWidth, vh = innerHeight;
  let [l,t,w,h] = [rect.left, rect.top, rect.width, rect.height];
  if (w > vw - m*2) w = vw - m*2;
  if (h > vh - m*2) h = vh - m*2;
  if (l < m) l = m;
  if (t < m) t = m;
  if (rect.right > vw - m) l = vw - m - w;
  if (rect.bottom > vh - m) t = vh - m - h;
  Object.assign(win.style, { left: l + "px", top: t + "px", width: w + "px", height: h + "px" });

  // Play any <video> inside
  win.querySelectorAll("video").forEach(v => v.play().catch(()=>{}));
  // Reload any <iframe> (e.g. Snake) to reset its state
  win.querySelectorAll("iframe").forEach(f => {
    const src = f.src;
    f.src = ""; 
    f.src = src;
  });
}

// Create a taskbar icon when you minimize
function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return;
  const btn = document.createElement("button");
  btn.id = `taskbar-icon-${id}`;
  btn.className = "taskbar-icon";
  btn.textContent = id.toUpperCase();
  btn.onclick = () => {
    openWindow(id);
    btn.remove();
  };
  document.getElementById("taskbar-icons").appendChild(btn);
}

function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add("hidden");
  win.style.display = "none";
  createTaskbarIcon(id);
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    // pause & reset any video
    win.querySelectorAll("video").forEach(v => {
      v.pause();
      v.currentTime = 0;
    });
    win.classList.add("hidden");
    win.style.display = "none";
  }
  const icon = document.getElementById(`taskbar-icon-${id}`);
  if (icon) icon.remove();
}

function toggleMaximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  if (!win.classList.contains("maximized")) {
    windowStates[id] = {
      top: win.style.top,
      left: win.style.left,
      width: win.style.width,
      height: win.style.height
    };
    win.classList.add("maximized");
    Object.assign(win.style, {
      top: "0", left: "0", width: "100%", height: "100%"
    });
    const icon = document.getElementById(`taskbar-icon-${id}`);
    if (icon) icon.remove();
  } else {
    Object.assign(win.style, windowStates[id]);
    win.classList.remove("maximized");
  }
}

// z-index
let currentZIndex = 10;
function getNextZIndex() { return ++currentZIndex; }

// save window states
const windowStates = {};

// Clock
function updateClock() {
  const c = document.getElementById("clock");
  if (c) c.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Start menu toggle
const startButton = document.getElementById("start-button");
const startMenu   = document.getElementById("start-menu");
startButton.onclick = () => {
  startMenu.style.display = startMenu.style.display === "flex" ? "none" : "flex";
};

// run as soon as the DOM exists, before heavy assets finish loading
 window.addEventListener("DOMContentLoaded", () => {
  const boot = document.getElementById("bootScreen");
  const log  = document.getElementById("boot-log");
  const bar  = document.getElementById("progress-bar");
  const msgs = [
    "[ OK ] Initializing hardware...",
    "[ OK ] Loading kernel modules...",
    "[ OK ] Mounting filesystems...",
    "[ OK ] Starting system services...",
    "[ OK ] CyberDeck ready.",
    "[ DONE ] Boot complete."
  ];
  let i=0, total=msgs.length;
  const iv = setInterval(()=>{
    log.textContent += msgs[i] + "\n";
    log.scrollTop = log.scrollHeight;
    bar.style.width = `${((i+1)/total)*100}%`;
    if (++i===total) {
      clearInterval(iv);
      setTimeout(()=>{
        boot.style.transition = "opacity .8s";
        boot.style.opacity = 0;
        setTimeout(()=> boot.style.display="none", 800);
      }, 500);
    }
  }, 400);
});

// Project splash
function launchProject(el, name) {
  const s = document.getElementById("project-splash");
  const n = document.getElementById("splash-name");
  if (s && n) {
    n.textContent = name;
    s.classList.remove("hidden");
  }
}
function closeSplash() {
  const s = document.getElementById("project-splash");
  if (s) s.classList.add("hidden");
}

// Drag & window buttons
document.querySelectorAll(".popup-window").forEach(win => {
  const id = win.id;
  const hdr = win.querySelector(".window-header");
  hdr.querySelector(".minimize").onclick = ()=> minimizeWindow(id);
  hdr.querySelector(".maximize").onclick = ()=> toggleMaximizeWindow(id);
  hdr.querySelector(".close").onclick    = ()=> closeWindow(id);

  let dragging=false, ox=0, oy=0;
  hdr.onmousedown = e => {
    dragging=true;
    ox = e.clientX - win.offsetLeft;
    oy = e.clientY - win.offsetTop;
    win.style.zIndex = getNextZIndex();
  };
  document.onmousemove = e => {
    if (dragging) {
      win.style.left = (e.clientX-ox)+"px";
      win.style.top  = (e.clientY-oy)+"px";
    }
  };
  document.onmouseup = ()=> dragging=false;
});

// Desktop icons
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    icon.ondblclick = () => openWindow(icon.dataset.window);
    icon.onmousedown = e => {
      e.preventDefault();
      // group dragging omitted for brevity—unchanged
    };
    icon.ondragstart = ()=>false;
  });
}
window.addEventListener("load", initDesktopIcons);

// Starfield
function initStarfield() {
  const c = document.getElementById("background-canvas");
  const ctx = c.getContext("2d");
  function resize() {
    c.width = innerWidth;
    c.height= innerHeight;
  }
  window.onresize = resize;
  resize();
  const stars = Array.from({length:300}, () => ({
    x:Math.random()*c.width,
    y:Math.random()*c.height,
    z:Math.random()*c.width,
    o:Math.random()
  }));
  (function anim(){
    ctx.fillStyle='rgba(0,0,0,0.4)';
    ctx.fillRect(0,0,c.width,c.height);
    for (let s of stars) {
      s.z-=2;
      if (s.z<=0) {
        s.z=c.width;
        s.x=Math.random()*c.width;
        s.y=Math.random()*c.height;
      }
      const k=128/s.z;
      const px=(s.x-c.width/2)*k+c.width/2;
      const py=(s.y-c.height/2)*k+c.height/2;
      const size=Math.max(0,(1-s.z/c.width)*3);
      ctx.globalAlpha = s.o;
      ctx.beginPath();
      ctx.arc(px,py,size,0,2*Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha=1;
    requestAnimationFrame(anim);
  })();
}
window.addEventListener("load", initStarfield);
