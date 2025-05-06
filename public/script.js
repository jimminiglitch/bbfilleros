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

  // 1) Hide start menu & deactivate other windows
  document.getElementById("start-menu").style.display = "none";
  document.querySelectorAll(".popup-window").forEach(w => w.classList.remove("active"));

  // 2) Lazy‐load Snake iframe on first open
  if (id === "snake") {
    const iframe = win.querySelector("iframe[data-src]");
    if (iframe && !iframe.src) {
      iframe.src = iframe.dataset.src;
    }
  }

  // 3) Lazy‐load any <video data-src> in this window
  win.querySelectorAll("video[data-src]").forEach(v => {
    if (!v.src) {
      v.src = v.dataset.src;
      v.load();
      v.play().catch(() => { /* autoplay may require an initial user gesture */ });
    }
  });

  // 4) Show & focus this window
  win.classList.remove("hidden");
  win.classList.add("active");
  win.style.display = "flex";
  win.style.zIndex = getNextZIndex();

  // 5) Restore previous position/size if stored
  const stored = windowStates[id];
  if (stored) Object.assign(win.style, stored);

  // 6) Clamp window to viewport
  const rect   = win.getBoundingClientRect();
  const margin = 20;
  const vw     = window.innerWidth;
  const vh     = window.innerHeight;
  let newW     = rect.width,
      newH     = rect.height,
      newLeft  = rect.left,
      newTop   = rect.top;

  if (rect.width  > vw - margin*2) newW    = vw - margin*2;
  if (rect.height > vh - margin*2) newH    = vh - margin*2;
  if (rect.left   < margin)        newLeft = margin;
  if (rect.top    < margin)        newTop  = margin;
  if (rect.right  > vw - margin)   newLeft = vw - margin - newW;
  if (rect.bottom > vh - margin)   newTop  = vh - margin - newH;

  Object.assign(win.style, {
    width:  `${newW}px`,
    height: `${newH}px`,
    left:   `${newLeft}px`,
    top:    `${newTop}px`
  });
}

function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return;
  const btn = document.createElement("button");
  btn.id        = `taskbar-icon-${id}`;
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
    // pause any <video> inside
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
    // store previous bounds
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
    m.style.display = (m.style.display === "flex" ? "none" : "flex");
  });

// ———————————————————————————————————————————————————————————————————————
// 4) BOOT SEQUENCE (run on DOMContentLoaded)
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
    let idx      = 0;
    const total  = msgs.length;
    const delay  = 400;

    const typer = setInterval(() => {
      logEl.textContent += msgs[idx] + "\n";
      logEl.scrollTop = logEl.scrollHeight;
      progress.style.width = `${((idx + 1) / total) * 100}%`;
      idx++;
      if (idx === total) {
        clearInterval(typer);
        setTimeout(() => {
          bootScreen.style.transition = "opacity 0.8s";
          bootScreen.style.opacity    = "0";
          setTimeout(() => {
            bootScreen.style.display = "none";
            resolve();
          }, 800);
        }, 500);
      }
    }, delay);
  });
}

// ———————————————————————————————————————————————————————————————————————
// 5) DESKTOP ICONS (dbl-click to open + drag-group kept as before)
// ———————————————————————————————————————————————————————————————————————
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    icon.addEventListener("dblclick", () => openWindow(icon.dataset.window));
    // …your existing mousedown drag-group code goes here…
  });
}

// ———————————————————————————————————————————————————————————————————————
// CLICK‐AND‐DRAG MULTI‐SELECT
// ———————————————————————————————————————————————————————————————————————
let selStartX, selStartY, selDiv;
function onSelectStart(e) {
  if (e.target.closest(".desktop-icon, .popup-window, #start-bar, #start-menu")) return;
  selStartX = e.clientX; selStartY = e.clientY;
  selDiv = document.createElement("div");
  selDiv.id = "selection-rect";
  selDiv.style.left = `${selStartX}px`;
  selDiv.style.top  = `${selStartY}px`;
  selDiv.style.width = selDiv.style.height = "0px";
  document.body.appendChild(selDiv);
  document.addEventListener("mousemove", onSelectMove);
  document.addEventListener("mouseup",   onSelectEnd, { once: true });
  e.preventDefault();
}
function onSelectMove(e) {
  const x = Math.min(e.clientX, selStartX),
        y = Math.min(e.clientY, selStartY),
        w = Math.abs(e.clientX - selStartX),
        h = Math.abs(e.clientY - selStartY);
  selDiv.style.left   = `${x}px`;
  selDiv.style.top    = `${y}px`;
  selDiv.style.width  = `${w}px`;
  selDiv.style.height = `${h}px`;
  const box = selDiv.getBoundingClientRect();
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    const r = icon.getBoundingClientRect();
    const inside = (
      r.left   >= box.left &&
      r.right  <= box.right &&
      r.top    >= box.top &&
      r.bottom <= box.bottom
    );
    icon.classList.toggle("selected", inside);
  });
}
function onSelectEnd() {
  if (selDiv) selDiv.remove();
  selDiv = null;
  document.removeEventListener("mousemove", onSelectMove);
}

// ———————————————————————————————————————————————————————————————————————
// 6) STARFIELD BACKGROUND
// ———————————————————————————————————————————————————————————————————————
function initStarfield() {
  const canvas = document.getElementById("background-canvas");
  const ctx    = canvas.getContext("2d");
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
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
      const k  = 128.0/s.z;
      const px = (s.x - canvas.width/2)*k + canvas.width/2;
      const py = (s.y - canvas.height/2)*k + canvas.height/2;
      const sz = Math.max(0,(1 - s.z/canvas.width)*3);
      ctx.globalAlpha = s.o;
      ctx.beginPath();
      ctx.arc(px,py,sz,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  })();
}

// ———————————————————————————————————————————————————————————————————————
// 7) WINDOW HEADER DRAG & BUTTONS
// ———————————————————————————————————————————————————————————————————————
function initWindowControls() {
  document.querySelectorAll(".popup-window").forEach(win => {
    const id     = win.id;
    const header = win.querySelector(".window-header");
    const btnMin = header.querySelector(".minimize");
    const btnMax = header.querySelector(".maximize");
    const btnCls = header.querySelector(".close");

    if (btnMin) btnMin.addEventListener("click", () => minimizeWindow(id));
    if (btnMax) btnMax.addEventListener("click", () => toggleMaximizeWindow(id));
    if (btnCls) btnCls.addEventListener("click", () => closeWindow(id));

    let isDragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener("mousedown", e => {
      isDragging = true;
      offsetX    = e.clientX - win.offsetLeft;
      offsetY    = e.clientY - win.offsetTop;
      win.style.zIndex = getNextZIndex();
    });
    document.addEventListener("mousemove", e => {
      if (isDragging) {
        win.style.left = `${e.clientX - offsetX}px`;
        win.style.top  = `${e.clientY - offsetY}px`;
      }
    });
    document.addEventListener("mouseup", () => { isDragging = false; });
  });
}

// ———————————————————————————————————————————————————————————————————————
// 8) KICK IT OFF
// ———————————————————————————————————————————————————————————————————————
document.addEventListener("DOMContentLoaded", () => {
  runBootSequence().then(() => {
    initDesktopIcons();
    initStarfield();
  });
});
window.addEventListener("load", initWindowControls);
window.addEventListener("load", initDesktopIcons);
window.addEventListener("mousedown", onSelectStart);
