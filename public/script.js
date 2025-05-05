//────────────────────────────────────────
//   Main Script (script.js)
//────────────────────────────────────────

// Play the blip sound effect
function playBlip() {
  const blip = document.getElementById("blip");
  if (blip) {
    blip.currentTime = 0;
    blip.play();
  }
}

// Z-index helper
let currentZIndex = 10;
function getNextZIndex() {
  return ++currentZIndex;
}

// Remember window positions/sizes
const windowStates = {};

// ─── OPEN & CLOSE WINDOWS ────────────────────────────────────────────────
function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Hide start menu & deactivate other windows
  document.getElementById("start-menu").style.display = "none";
  document.querySelectorAll(".popup-window").forEach(w => w.classList.remove("active"));

  // Show & focus this window
  win.classList.remove("hidden");
  win.classList.add("active");
  win.style.display = "block";
  win.style.zIndex = getNextZIndex();

  // Restore previous position/size if stored
  const stored = windowStates[id];
  if (stored) Object.assign(win.style, stored);

  // Clamp window to viewport
  const rect = win.getBoundingClientRect();
  const margin = 20,
        vw = window.innerWidth,
        vh = window.innerHeight;
  let newLeft = rect.left, newTop = rect.top, newW = rect.width, newH = rect.height;
  if (rect.width > vw - margin*2) newW = vw - margin*2;
  if (rect.height > vh - margin*2) newH = vh - margin*2;
  if (rect.left < margin) newLeft = margin;
  if (rect.top < margin) newTop = margin;
  if (rect.right > vw - margin) newLeft = vw - margin - newW;
  if (rect.bottom > vh - margin) newTop = vh - margin - newH;
  win.style.left = `${newLeft}px`;
  win.style.top  = `${newTop}px`;
  win.style.width  = `${newW}px`;
  win.style.height = `${newH}px`;
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Pause & rewind any <video>
  const vid = win.querySelector("video");
  if (vid) {
    vid.pause();
    vid.currentTime = 0;
  }

  // Pause & rewind music player
  if (id === "music") {
    const player = document.getElementById("music-player");
    if (player) {
      player.pause();
      player.currentTime = 0;
    }
  }

  // Hide it
  win.classList.add("hidden");
  win.style.display = "none";

  // Remove its taskbar icon
  const icon = document.getElementById(`taskbar-icon-${id}`);
  if (icon) icon.remove();
}

// Wrap openWindow/closeWindow to handle SNES iframe
const origOpen = openWindow;
openWindow = function(id) {
  origOpen(id);
  if (id === "snes") {
    const win = document.getElementById("snes");
    const content = win.querySelector(".window-content");
    const old = content.querySelector("iframe");
    if (old) old.remove();
    const iframe = document.createElement("iframe");
    iframe.src   = "/snes.html";
    iframe.style.cssText = "width:100%;height:100%;border:none;display:block;";
    content.appendChild(iframe);
  }
};

const origClose = closeWindow;
closeWindow = function(id) {
  origClose(id);
  if (id === "snes") {
    const win = document.getElementById("snes");
    const old = win.querySelector("iframe");
    if (old) old.remove();
  }
};

// ─── MINIMIZE & TASKBAR ICONS ────────────────────────────────────────────
function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return;
  const btn = document.createElement("button");
  btn.id = `taskbar-icon-${id}`;
  btn.className = "taskbar-icon";
  btn.textContent = id.toUpperCase();
  btn.addEventListener("click", () => {
    const win = document.getElementById(id);
    win.classList.remove("hidden");
    win.style.display = "block";
    win.style.zIndex = getNextZIndex();
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

// ─── TOGGLE MAXIMIZE ─────────────────────────────────────────────────────
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
    win.style.top = "0";
    win.style.left = "0";
    win.style.width = "100%";
    win.style.height = "100%";
    const icon = document.getElementById(`taskbar-icon-${id}`);
    if (icon) icon.remove();
  } else {
    const stored = windowStates[id];
    if (stored) Object.assign(win.style, stored);
    win.classList.remove("maximized");
  }
}

// ─── CLOCK & START MENU ─────────────────────────────────────────────────
function updateClock() {
  const clock = document.getElementById("clock");
  if (clock) clock.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();
const startButton = document.getElementById("start-button");
const startMenu   = document.getElementById("start-menu");
startButton.addEventListener("click", () => {
  startMenu.style.display = startMenu.style.display === "flex" ? "none" : "flex";
});

// ─── BOOT SCREEN ─────────────────────────────────────────────────────────
window.addEventListener("load", () => {
  const bootScreen = document.getElementById("bootScreen");
  const logEl      = document.getElementById("boot-log");
  const progress   = document.getElementById("progress-bar");
  const messages   = [
    "[ OK ] Initializing hardware...",
    "[ OK ] Loading kernel modules...",
    "[ OK ] Mounting filesystems...",
    "[ OK ] Starting system services...",
    "[ OK ] CyberDeck ready.",
    "[ DONE ] Boot complete."
  ];
  let idx = 0, total = messages.length;
  const typer = setInterval(() => {
    logEl.textContent += messages[idx] + "\n";
    logEl.scrollTop = logEl.scrollHeight;
    progress.style.width = `${((idx+1)/total)*100}%`;
    idx++;
    if (idx === total) {
      clearInterval(typer);
      setTimeout(() => {
        bootScreen.style.transition = "opacity 0.8s";
        bootScreen.style.opacity = "0";
        setTimeout(() => { bootScreen.style.display = "none"; }, 800);
      }, 500);
    }
  }, 400);
});

// ─── PROJECT SPLASH ───────────────────────────────────────────────────────
function launchProject(element, name) {
  const splash     = document.getElementById("project-splash");
  const splashName = document.getElementById("splash-name");
  if (splash && splashName) {
    splashName.textContent = name;
    splash.classList.remove("hidden");
  }
}
function closeSplash() {
  const splash = document.getElementById("project-splash");
  if (splash) splash.classList.add("hidden");
}

// ─── WINDOW DRAGGING & HEADER BUTTONS ────────────────────────────────────
document.querySelectorAll(".popup-window").forEach(win => {
  const id     = win.id;
  const header = win.querySelector(".window-header");
  const btnMin = header.querySelector(".minimize");
  const btnMax = header.querySelector(".maximize");
  const btnCls = header.querySelector(".close");
  if (btnMin) btnMin.addEventListener("click", () => minimizeWindow(id));
  if (btnMax) btnMax.addEventListener("click", () => toggleMaximizeWindow(id));
  if (btnCls) btnCls.addEventListener("click", () => closeWindow(id));
  let dragging = false, offsetX = 0, offsetY = 0;
  header.addEventListener("mousedown", e => {
    dragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    win.style.zIndex = getNextZIndex();
  });
  document.addEventListener("mousemove", e => {
    if (dragging) {
      win.style.left = `${e.clientX - offsetX}px`;
      win.style.top  = `${e.clientY - offsetY}px`;
    }
  });
  document.addEventListener("mouseup", () => dragging = false);
});

// ─── DESKTOP ICONS: DOUBLE-CLICK & DRAG-SELECT ────────────────────────────
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    icon.addEventListener("dblclick", () => {
      openWindow(icon.dataset.window);
      playBlip();
    });
    icon.ondragstart = () => false;
    // (full drag-group logic omitted for brevity)
  });
}
window.addEventListener("load", initDesktopIcons);

// ─── STARFIELD BACKGROUND ────────────────────────────────────────────────
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
    for (let star of stars) {
      star.z -= 2;
      if (star.z <= 0) {
        star.z = canvas.width;
        star.x = Math.random()*canvas.width;
        star.y = Math.random()*canvas.height;
      }
      const k = 128.0 / star.z;
      const px = (star.x - canvas.width/2)*k + canvas.width/2;
      const py = (star.y - canvas.height/2)*k + canvas.height/2;
      const size = Math.max(0, (1 - star.z/canvas.width)*3);
      ctx.globalAlpha = star.o;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  })();
}
window.addEventListener("load", initStarfield);

// ─── CLICK-AND-DRAG MULTI-SELECT ─────────────────────────────────────────
let selStartX, selStartY, selDiv;
function onSelectStart(e) {
  if (e.target.closest('.desktop-icon, .popup-window, #start-bar, #start-menu'))
    return;
  selStartX = e.clientX; selStartY = e.clientY;
  selDiv = document.createElement('div');
  selDiv.id = 'selection-rect';
  selDiv.style.left = `${selStartX}px`;
  selDiv.style.top  = `${selStartY}px`;
  selDiv.style.width = selDiv.style.height = '0px';
  document.body.appendChild(selDiv);
  document.addEventListener('mousemove', onSelectMove);
  document.addEventListener('mouseup', onSelectEnd, { once: true });
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
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    const r = icon.getBoundingClientRect();
    const inside = r.left>=box.left && r.right<=box.right &&
                   r.top>=box.top   && r.bottom<=box.bottom;
    icon.classList.toggle('selected', inside);
  });
}
function onSelectEnd() {
  if (selDiv) selDiv.remove();
  selDiv = null;
  document.removeEventListener('mousemove', onSelectMove);
}
window.addEventListener('mousedown', onSelectStart);

// ─── NOTES.EXE LOGIC ─────────────────────────────────────────────────────
const notesArea = document.getElementById('notes-area');
window.addEventListener('load', () => {
  const saved = localStorage.getItem('desktopNotes');
  if (saved) notesArea.value = saved;
});
notesArea.addEventListener('blur', () => {
  localStorage.setItem('desktopNotes', notesArea.value);
});

// ─── NATURE.EXE (Gallery) LOGIC ─────────────────────────────────────────
const natureImages = [
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Galloway%20Geese%20at%20Sunset.png?v=1746411517025',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/A%20Sedge%20of%20Sandhill%20on%20the%20Green.png?v=1746411505927',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/GoldenHourGeese.png?v=1746411283749',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/bombilate%20vicissitude.png?v=1746411262153',
  'https://cdn.glitch.me/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/SB1012.png?v=1746413539089',
  'https://cdn.glitch.me/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Calm%20Reeds.png?v=1746413471050',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/LeafTrail.png?v=1746413486576',
  'https://cdn.glitch.me/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/HawkTrail.png?v=1746413521889',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/TrailMix108.png?v=1746413545072',
  'https://cdn.glitch.me/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/ToadInTheHole.png?v=1746413566459'
];
let natureIndex = 0;
const natureImgEl = document.getElementById('nature-img');
function preloadImages(urls) { urls.forEach(u=> new Image().src=u); }
function showNatureImage(idx) {
  natureIndex = (idx + natureImages.length) % natureImages.length;
  natureImgEl.src = natureImages[natureIndex];
}
function prevNature() { showNatureImage(natureIndex - 1); }
function nextNature() { showNatureImage(natureIndex + 1); }
window.addEventListener('load', () => {
  preloadImages(natureImages);
  showNatureImage(0);
});

// ─── MUSIC.EXE LOGIC ─────────────────────────────────────────────────────
// (drop your real track objects in here)
const tracks = [
  { title: "Morning Synth", url: "https://cdn.glitch.global/.../morning-synth.mp3" },
  { title: "Lo-Fi Beats",  url: "https://cdn.glitch.global/.../lofi-beats.mp3"  },
  { title: "Techno Pulse", url: "https://cdn.glitch.global/.../techno-pulse.mp3" }
];
let trackIndex = 0;
const player = document.getElementById('music-player');
const nowEl  = document.getElementById('now-playing');
const listEl = document.getElementById('playlist');
tracks.forEach((t,i) => {
  const li = document.createElement('li');
  li.textContent = t.title;
  li.style.cursor = 'pointer';
  li.onclick = () => playTrack(i);
  listEl.appendChild(li);
});
function playTrack(i) {
  trackIndex = (i + tracks.length) % tracks.length;
  player.src = tracks[trackIndex].url;
  player.play();
  updateUI();
}
function nextTrack() { playTrack(trackIndex + 1); }
function prevTrack() { playTrack(trackIndex - 1); }
function togglePlay() {
  player.paused ? player.play() : player.pause();
  updateUI();
}
function updateUI() {
  nowEl.textContent = (player.paused ? '❚❚' : '▶') + ' ' + tracks[trackIndex].title;
  Array.from(listEl.children).forEach((li,i) => {
    li.style.color = i === trackIndex ? 'var(--neon-green)' : 'white';
  });
}
player.addEventListener('ended', nextTrack);
