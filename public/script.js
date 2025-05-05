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

// Open a window by ID (with SNES iframe rebuild)
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
  if (stored) {
    Object.assign(win.style, stored);
  }

  // Clamp window to viewport
  const rect = win.getBoundingClientRect();
  const margin = 20;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let newLeft = rect.left, newTop = rect.top, newW = rect.width, newH = rect.height;
  if (rect.width > vw - margin * 2) newW = vw - margin * 2;
  if (rect.height > vh - margin * 2) newH = vh - margin * 2;
  if (rect.left < margin) newLeft = margin;
  if (rect.top < margin) newTop = margin;
  if (rect.right > vw - margin) newLeft = vw - margin - newW;
  if (rect.bottom > vh - margin) newTop = vh - margin - newH;
  win.style.left = `${newLeft}px`;
  win.style.top = `${newTop}px`;
  win.style.width = `${newW}px`;
  win.style.height = `${newH}px`;

  // SPECIAL: if this is SNES.EXE, rebuild its iframe
  if (id === "snes") {
    const content = win.querySelector(".window-content");
    const old = content.querySelector("iframe");
    if (old) old.remove();
    const iframe = document.createElement("iframe");
    iframe.src = "/snes.html";
    iframe.style.cssText = "width:100%;height:100%;border:none;display:block;";
    content.appendChild(iframe);
  }
}

// Create a taskbar icon for a minimized window
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

// Minimize (to taskbar) a window
function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add("hidden");
  win.style.display = "none";
  createTaskbarIcon(id);
}

// Close a window (pause media + teardown SNES iframe)
function closeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Pause & rewind any video inside
  const vid = win.querySelector("video");
  if (vid) {
    vid.pause();
    vid.currentTime = 0;
  }

  // Pause & rewind the music player
  if (id === "music") {
    const player = document.getElementById("music-player");
    if (player) {
      player.pause();
      player.currentTime = 0;
    }
  }

  // Hide the window
  win.classList.add("hidden");
  win.style.display = "none";

  // Remove from taskbar if present
  const icon = document.getElementById(`taskbar-icon-${id}`);
  if (icon) icon.remove();

  // SPECIAL: if this is SNES.EXE, remove its iframe
  if (id === "snes") {
    const content = win.querySelector(".window-content");
    const old = content.querySelector("iframe");
    if (old) old.remove();
  }
}

// Toggle maximize / restore
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

// Update clock in the taskbar
function updateClock() {
  const clock = document.getElementById("clock");
  if (clock) clock.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Toggle Start Menu
const startButton = document.getElementById("start-button");
const startMenu = document.getElementById("start-menu");
startButton.addEventListener("click", () => {
  startMenu.style.display = startMenu.style.display === "flex" ? "none" : "flex";
});

// ─── BOOT SCREEN ─────────────────────────────────────────────────────────
window.addEventListener("load", () => {
  const bootScreen = document.getElementById("bootScreen");
  const logEl = document.getElementById("boot-log");
  const progress = document.getElementById("progress-bar");
  const messages = [
    "[ OK ] Initializing hardware...",
    "[ OK ] Loading kernel modules...",
    "[ OK ] Mounting filesystems...",
    "[ OK ] Starting system services...",
    "[ OK ] CyberDeck ready.",
    "[ DONE ] Boot complete."
  ];
  let idx = 0;
  const total = messages.length;
  const interval = 400;
  const typer = setInterval(() => {
    logEl.textContent += messages[idx] + "\n";
    logEl.scrollTop = logEl.scrollHeight;
    progress.style.width = `${((idx + 1) / total) * 100}%`;
    idx++;
    if (idx === total) {
      clearInterval(typer);
      setTimeout(() => {
        bootScreen.style.transition = "opacity 0.8s";
        bootScreen.style.opacity = "0";
        setTimeout(() => {
          bootScreen.style.display = "none";
        }, 800);
      }, 500);
    }
  }, interval);
});

// ─── PROJECT LAUNCH SPLASH ────────────────────────────────────────────────
function launchProject(element, name) {
  const splash = document.getElementById("project-splash");
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

// ─── WINDOW HEADER DRAG & BUTTONS ────────────────────────────────────────
document.querySelectorAll(".popup-window").forEach(win => {
  const id = win.id;
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
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    win.style.zIndex = getNextZIndex();
  });
  document.addEventListener("mousemove", e => {
    if (isDragging) {
      win.style.left = `${e.clientX - offsetX}px`;
      win.style.top = `${e.clientY - offsetY}px`;
    }
  });
  document.addEventListener("mouseup", () => { isDragging = false; });
});

// ─── DESKTOP ICONS (double-click + drag-group) ───────────────────────────
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    icon.addEventListener("dblclick", () => {
      openWindow(icon.dataset.window);
      playBlip();
    });
    icon.addEventListener("mousedown", e => {
      e.preventDefault();
      const parentRect = icon.parentElement.getBoundingClientRect();
      const clickRect = icon.getBoundingClientRect();

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
        const startTop = r.top - parentRect.top;
        ic.style.left = startLeft + "px";
        ic.style.top = startTop + "px";
        ic.style.zIndex = getNextZIndex();
        return { icon: ic, startLeft, startTop };
      });

      function onMouseMove(e) {
        const newLeft = e.clientX - shiftX - parentRect.left;
        const newTop = e.clientY - shiftY - parentRect.top;
        const dx = newLeft - groupData[0].startLeft;
        const dy = newTop - groupData[0].startTop;
        groupData.forEach(({ icon, startLeft, startTop }) => {
          icon.style.left = startLeft + dx + "px";
          icon.style.top = startTop + dy + "px";
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
window.addEventListener("load", initDesktopIcons);

// ─── STARFIELD BACKGROUND ────────────────────────────────────────────────
function initStarfield() {
  const canvas = document.getElementById("background-canvas");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const numStars = 300;
  const stars = Array.from({ length: numStars }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * canvas.width,
    o: Math.random()
  }));

  (function animate() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let star of stars) {
      star.z -= 2;
      if (star.z <= 0) {
        star.z = canvas.width;
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
      }
      const k = 128.0 / star.z;
      const px = (star.x - canvas.width / 2) * k + canvas.width / 2;
      const py = (star.y - canvas.height / 2) * k + canvas.height / 2;
      const size = Math.max(0, (1 - star.z / canvas.width) * 3);
      ctx.beginPath();
      ctx.globalAlpha = star.o;
      ctx.fillStyle = "#fff";
      ctx.arc(px, py, size, 0, Math.PI * 2);
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
  if (e.target.closest(".desktop-icon, .popup-window, #start-bar, #start-menu")) return;
  selStartX = e.clientX; selStartY = e.clientY;
  selDiv = document.createElement("div");
  selDiv.id = "selection-rect";
  selDiv.style.left = `${selStartX}px`;
  selDiv.style.top = `${selStartY}px`;
  selDiv.style.width = selDiv.style.height = "0px";
  document.body.appendChild(selDiv);
  document.addEventListener("mousemove", onSelectMove);
  document.addEventListener("mouseup", onSelectEnd, { once: true });
  e.preventDefault();
}
function onSelectMove(e) {
  const x = Math.min(e.clientX, selStartX),
        y = Math.min(e.clientY, selStartY),
        w = Math.abs(e.clientX - selStartX),
        h = Math.abs(e.clientY - selStartY);
  selDiv.style.left = `${x}px`;
  selDiv.style.top = `${y}px`;
  selDiv.style.width = `${w}px`;
  selDiv.style.height = `${h}px`;
  const box = selDiv.getBoundingClientRect();
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    const r = icon.getBoundingClientRect();
    const inside =
      r.left >= box.left &&
      r.right <= box.right &&
      r.top >= box.top &&
      r.bottom <= box.bottom;
    icon.classList.toggle("selected", inside);
  });
}
function onSelectEnd() {
  if (selDiv) selDiv.remove();
  selDiv = null;
  document.removeEventListener("mousemove", onSelectMove);
}
window.addEventListener("mousedown", onSelectStart);

// ─── NOTES.EXE LOGIC ─────────────────────────────────────────────────────
const notesArea = document.getElementById("notes-area");
window.addEventListener("load", () => {
  const saved = localStorage.getItem("desktopNotes");
  if (saved) notesArea.value = saved;
});
notesArea.addEventListener("blur", () => {
  localStorage.setItem("desktopNotes", notesArea.value);
});

// ─── NATURE.EXE (Gallery) LOGIC ────────────────────────────────────────
const natureImages = [
  /* your list of URLs */
];
let natureIndex = 0;
const natureImgEl = document.getElementById("nature-img");
function preloadImages(urls) {
  urls.forEach(url => new Image().src = url);
}
function showNatureImage(idx) {
  natureIndex = (idx + natureImages.length) % natureImages.length;
  natureImgEl.src = natureImages[natureIndex];
}
function prevNature() { showNatureImage(natureIndex - 1); }
function nextNature() { showNatureImage(natureIndex + 1); }
window.addEventListener("load", () => {
  preloadImages(natureImages);
  showNatureImage(0);
});

// ─── MUSIC.EXE LOGIC ─────────────────────────────────────────────────────
const tracks = [
  /* your track list { title, url } */
];
let trackIndex = 0;
const player = document.getElementById("music-player");
const nowEl = document.getElementById("now-playing");
const listEl = document.getElementById("playlist");
tracks.forEach((t, i) => {
  const li = document.createElement("li");
  li.textContent = t.title;
  li.style.cursor = "pointer";
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
  if (player.paused) player.play();
  else player.pause();
  updateUI();
}
function updateUI() {
  nowEl.textContent = (player.paused ? "❚❚" : "▶") + " " + tracks[trackIndex].title;
  Array.from(listEl.children).forEach((li, i) => {
    li.style.color = i === trackIndex ? "var(--neon-green)" : "white";
  });
}
player.addEventListener("ended", nextTrack);
