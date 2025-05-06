//────────────────────────────────────────
//   Main Script (public/script.js)
//────────────────────────────────────────

//────────────────────────────────────────
// 1) OPEN / MINIMIZE / CLOSE / MAXIMIZE & TASKBAR ICONS
//────────────────────────────────────────
let currentZIndex = 10;
const windowStates = {};

function getNextZIndex() {
  return ++currentZIndex;
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // hide start menu & deactivate other windows
  document.getElementById("start-menu").style.display = "none";
  document.querySelectorAll(".popup-window").forEach(w => w.classList.remove("active"));

  // lazy‐load Snake iframe on first open
  if (id === "snake") {
    const iframe = win.querySelector("iframe[data-src]");
    if (iframe && !iframe.src) iframe.src = iframe.dataset.src;
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
  let newW = rect.width,
      newH = rect.height,
      newLeft = rect.left,
      newTop = rect.top;
  if (newW > vw - margin*2)  newW = vw - margin*2;
  if (newH > vh - margin*2)  newH = vh - margin*2;
  if (newLeft < margin)      newLeft = margin;
  if (newTop  < margin)      newTop  = margin;
  if (rect.right  > vw - margin) newLeft = vw - margin - newW;
  if (rect.bottom > vh - margin) newTop  = vh - margin - newH;
  Object.assign(win.style, {
    width:  `${newW}px`,
    height: `${newH}px`,
    left:   `${newLeft}px`,
    top:    `${newTop}px`
  });

  // ─── Video autoplay fix ────────────────────────────────────────────
  if (id.startsWith("video")) {
    const vid = document.getElementById(`${id}-player`);
    if (vid) {
      vid.muted = true;
      vid.play().catch(() => {});
      vid.addEventListener("play", () => { vid.muted = false; }, { once: true });
    }
  }

  // ─── Reset Nature gallery ───────────────────────────────────────────
  if (id === "nature") {
    initNature();
  }
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
    windowStates[id] = {
      top:    win.style.top,
      left:   win.style.left,
      width:  win.style.width,
      height: win.style.height
    };
    win.classList.add("maximized");
    Object.assign(win.style, { top: "0", left: "0", width: "100%", height: "100%" });
    const icon = document.getElementById(`taskbar-icon-${id}`);
    if (icon) icon.remove();
  } else {
    const s = windowStates[id];
    if (s) Object.assign(win.style, s);
    win.classList.remove("maximized");
  }
}

//────────────────────────────────────────
// 2) CLOCK & START MENU TOGGLE
//────────────────────────────────────────
function updateClock() {
  const clk = document.getElementById("clock");
  if (clk) clk.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

document.getElementById("start-button")
  .addEventListener("click", () => {
    const m = document.getElementById("start-menu");
    m.style.display = m.style.display === "flex" ? "none" : "flex";
  });

//────────────────────────────────────────
// 3) BOOT SEQUENCE (DOMContentLoaded)
//────────────────────────────────────────
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
    let idx = 0, total = msgs.length, interval = 400;

    const typer = setInterval(() => {
      logEl.textContent += msgs[idx] + "\n";
      logEl.scrollTop = logEl.scrollHeight;
      progress.style.width = `${((idx+1)/total)*100}%`;
      idx++;
      if (idx === total) {
        clearInterval(typer);
        setTimeout(() => {
          bootScreen.style.transition = "opacity 0.8s";
          bootScreen.style.opacity = "0";
          setTimeout(() => {
            bootScreen.style.display = "none";
            resolve();
          }, 800);
        }, 500);
      }
    }, interval);
  });
}

//────────────────────────────────────────
// 4) DESKTOP ICONS & GROUP DRAG
//────────────────────────────────────────
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    icon.addEventListener("dblclick", () => openWindow(icon.dataset.window));

    icon.addEventListener("mousedown", e => {
      e.preventDefault();
      const parentRect = icon.parentElement.getBoundingClientRect();
      const clickRect  = icon.getBoundingClientRect();

      let group;
      if (icon.classList.contains("selected")) {
        group = Array.from(document.querySelectorAll(".desktop-icon.selected"));
      } else {
        document.querySelectorAll(".desktop-icon.selected")
          .forEach(ic => ic.classList.remove("selected"));
        icon.classList.add("selected");
        group = [icon];
      }

      const shiftX = e.clientX - clickRect.left;
      const shiftY = e.clientY - clickRect.top;
      const groupData = group.map(ic => {
        const r = ic.getBoundingClientRect();
        const startLeft = r.left - parentRect.left;
        const startTop  = r.top  - parentRect.top;
        ic.style.left   = `${startLeft}px`;
        ic.style.top    = `${startTop}px`;
        ic.style.zIndex = getNextZIndex();
        return { icon: ic, startLeft, startTop };
      });

      function onMouseMove(e) {
        const newLeft = e.clientX - shiftX - parentRect.left;
        const newTop  = e.clientY - shiftY - parentRect.top;
        const dx = newLeft - groupData[0].startLeft;
        const dy = newTop  - groupData[0].startTop;
        groupData.forEach(({ icon, startLeft, startTop }) => {
          icon.style.left = `${startLeft + dx}px`;
          icon.style.top  = `${startTop  + dy}px`;
        });
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", function onUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onUp);
      }, { once: true });
    });

    icon.ondragstart = () => false;
  });
}

//────────────────────────────────────────
// 5) CLICK-AND-DRAG MULTI-SELECT
//────────────────────────────────────────
let selStartX, selStartY, selDiv;
function onSelectStart(e) {
  if (e.target.closest(".desktop-icon, .popup-window, #start-bar, #start-menu")) return;
  selStartX = e.clientX; selStartY = e.clientY;
  selDiv = document.createElement("div");
  selDiv.id = "selection-rect";
  selDiv.style.left   = `${selStartX}px`;
  selDiv.style.top    = `${selStartY}px`;
  selDiv.style.width  = selDiv.style.height = "0px";
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

//────────────────────────────────────────
// 6) NATURE.EXE (Gallery) LOGIC
//────────────────────────────────────────
const natureImages = [
  // Put your exact CDN URLs here:
  "https://cdn.glitch.global/09e9ba26/.../Galloway%20Geese%20at%20Sunset.png?v=1746411517025",
  /* …etc… */
];
let natureIndex = 0;
const natureImgEl = document.getElementById("nature-img");
function preloadImages(urls) {
  urls.forEach(u => { const i = new Image(); i.src = u; });
}
function showNatureImage(idx) {
  natureIndex = (idx + natureImages.length) % natureImages.length;
  if (natureImgEl) natureImgEl.src = natureImages[natureIndex];
}
function initNature() {
  preloadImages(natureImages);
  showNatureImage(0);
}
function prevNature() { showNatureImage(natureIndex - 1); }
function nextNature() { showNatureImage(natureIndex + 1); }

//────────────────────────────────────────
// 7) STARFIELD BACKGROUND
//────────────────────────────────────────
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
      const k  = 128.0/s.z;
      const px = (s.x - canvas.width/2)*k + canvas.width/2;
      const py = (s.y - canvas.height/2)*k + canvas.height/2;
      const sz = Math.max(0,(1 - s.z/canvas.width)*3);
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

//────────────────────────────────────────
// 8) WINDOW HEADER DRAG & BUTTONS
//────────────────────────────────────────
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

//────────────────────────────────────────
// 9) BOOT + INIT
//────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  runBootSequence().then(() => {
    initDesktopIcons();
    initStarfield();
  });
});
window.addEventListener("load", initWindowControls);
window.addEventListener("mousedown", onSelectStart);
