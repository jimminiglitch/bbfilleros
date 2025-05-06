//────────────────────────────────────────
//   Main Script (public/script.js)
//────────────────────────────────────────

// ———————————————————————————————————————————————————————————————————————
// 1) BLIP (ignored if no <audio id="blip"> present)
// ———————————————————————————————————————————————————————————————————————
function playBlip() {
  const blip = document.getElementById("blip");
  if (blip) {
    blip.currentTime = 0;
    blip.play();
  }
}

// ———————————————————————————————————————————————————————————————————————
// 2) OPEN / MINIMIZE / CLOSE / MAXIMIZE & TASKBAR ICONS
// ———————————————————————————————————————————————————————————————————————
let currentZIndex = 10;
const windowStates = {};

function getNextZIndex() {
  return ++currentZIndex;
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // hide start menu
  document.getElementById("start-menu").style.display = "none";
  document.querySelectorAll(".popup-window").forEach(w => w.classList.remove("active"));

  // lazy-load Snake iframe
  if (id === "snake") {
    const iframe = win.querySelector("iframe[data-src]");
    if (iframe && iframe.src === "") {
      iframe.src = iframe.dataset.src;
    }
  }

  // show & focus
  win.classList.remove("hidden");
  win.classList.add("active");
  win.style.display = "flex";
  win.style.zIndex = getNextZIndex();

  // restore previous bounds
  const stored = windowStates[id];
  if (stored) Object.assign(win.style, stored);

  // clamp to viewport
  const rect = win.getBoundingClientRect();
  const margin = 20;
  const vw = innerWidth, vh = innerHeight;
  let [newW,newH,newLeft,newTop] = [rect.width,rect.height,rect.left,rect.top];
  if (rect.width > vw - margin*2)  newW = vw - margin*2;
  if (rect.height > vh - margin*2) newH = vh - margin*2;
  if (rect.left   < margin)        newLeft = margin;
  if (rect.top    < margin)        newTop  = margin;
  if (rect.right  > vw - margin)   newLeft = vw - margin - newW;
  if (rect.bottom > vh - margin)   newTop  = vh - margin - newH;
  Object.assign(win.style, {
    left:   `${newLeft}px`,
    top:    `${newTop}px`,
    width:  `${newW}px`,
    height: `${newH}px`
  });
}

function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return;
  const btn = document.createElement("button");
  btn.id = `taskbar-icon-${id}`;
  btn.className = "taskbar-icon";
  btn.textContent = id.toUpperCase();
  btn.addEventListener("click", () => {
    openWindow(id);
    btn.remove();
  });
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
    // pause any <video>
    const vid = win.querySelector("video");
    if (vid) { vid.pause(); vid.currentTime = 0; }
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
    // store
    windowStates[id] = {
      top:    win.style.top,
      left:   win.style.left,
      width:  win.style.width,
      height: win.style.height
    };
    win.classList.add("maximized");
    Object.assign(win.style, {
      top:    "0",
      left:   "0",
      width:  "100%",
      height: "100%"
    });
    const ic = document.getElementById(`taskbar-icon-${id}`);
    if (ic) ic.remove();
  } else {
    // restore
    const s = windowStates[id];
    if (s) Object.assign(win.style, s);
    win.classList.remove("maximized");
  }
}

// ———————————————————————————————————————————————————————————————————————
// 3) CLOCK & START MENU TOGGLE
// ———————————————————————————————————————————————————————————————————————
function updateClock() {
  const clk = document.getElementById("clock");
  if (clk) clk.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

document.getElementById("start-button")
  .addEventListener("click", () => {
    const m = document.getElementById("start-menu");
    m.style.display = m.style.display === "flex"? "none" : "flex";
  });

// ———————————————————————————————————————————————————————————————————————
// 4) BOOT SEQUENCE (now on DOMContentLoaded, not window.load)
// ———————————————————————————————————————————————————————————————————————
function runBootSequence() {
  return new Promise(resolve => {
    const bootScreen = document.getElementById("bootScreen");
    const logEl      = document.getElementById("boot-log");
    const progress   = document.getElementById("progress-bar");
    const msgs = [
      "[ OK ] Initializing hardware...",
      "[ OK ] Loading kernel modules...",
      "[ OK ] Mounting filesystems...",
      "[ OK ] Starting system services...",
      "[ OK ] CyberDeck ready.",
      "[ DONE ] Boot complete."
    ];
    let idx = 0;
    const total = msgs.length;
    const interval = 400;

    const typer = setInterval(() => {
      logEl.textContent += msgs[idx] + "\n";
      logEl.scrollTop = logEl.scrollHeight;
      progress.style.width = `${((idx+1)/total)*100}%`;
      idx++;
      if (idx === total) {
        clearInterval(typer);
        setTimeout(()=>{
          bootScreen.style.transition = "opacity 0.8s";
          bootScreen.style.opacity = "0";
          setTimeout(()=>{
            bootScreen.style.display = "none";
            resolve();
          }, 800);
        }, 500);
      }
    }, interval);
  });
}

// ———————————————————————————————————————————————————————————————————————
// 5) DRAG & ICON DOUBLE-CLICK GROUP MOVE
// ———————————————————————————————————————————————————————————————————————
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    // double-click to open
    icon.addEventListener("dblclick", () => {
      openWindow(icon.dataset.window);
      playBlip();
    });

    // drag-group logic omitted for brevity (keep your existing code)
    // …
  });
}

// ———————————————————————————————————————————————————————————————————————
// 6) STARFIELD BACKGROUND
// ———————————————————————————————————————————————————————————————————————
function initStarfield() {
  const canvas = document.getElementById("background-canvas");
  const ctx    = canvas.getContext("2d");

  function resize() {
    canvas.width  = innerWidth;
    canvas.height = innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const numStars = 300;
  const stars = Array.from({length:numStars}, () => ({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    z: Math.random()*canvas.width,
    o: Math.random()
  }));

  (function animate() {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    for (let s of stars) {
      s.z -= 2;
      if (s.z <= 0) {
        s.z = canvas.width;
        s.x = Math.random()*canvas.width;
        s.y = Math.random()*canvas.height;
      }
      const k   = 128.0/s.z;
      const px  = (s.x - canvas.width/2)*k + canvas.width/2;
      const py  = (s.y - canvas.height/2)*k + canvas.height/2;
      const sz  = Math.max(0,(1 - s.z/canvas.width)*3);
      ctx.beginPath();
      ctx.globalAlpha = s.o;
      ctx.fillStyle = '#fff';
      ctx.arc(px,py,sz,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  })();
}

// ———————————————————————————————————————————————————————————————————————
// 7) SELECT-BOX, NOTES, NATURE, PROJECT SPLASH, MUSIC, VIDEOS, ETC.
//    (leave your existing handlers in place…)
// ———————————————————————————————————————————————————————————————————————

// [ ... your existing code for multi-select, notes, nature, projects, music, videos … ]

// ———————————————————————————————————————————————————————————————————————
// 8) KICK IT OFF
// ———————————————————————————————————————————————————————————————————————
document.addEventListener("DOMContentLoaded", () => {
  runBootSequence().then(() => {
    initDesktopIcons();
    initStarfield();
    // any other on-ready setup you had under window.load…
  });
});
