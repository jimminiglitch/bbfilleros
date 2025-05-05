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

// Open a window by ID
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
  if (rect.width > vw - margin*2) newW = vw - margin*2;
  if (rect.height > vh - margin*2) newH = vh - margin*2;
  if (rect.left < margin) newLeft = margin;
  if (rect.top < margin) newTop = margin;
  if (rect.right > vw - margin) newLeft = vw - margin - newW;
  if (rect.bottom > vh - margin) newTop = vh - margin - newH;
  win.style.left   = `${newLeft}px`;
  win.style.top    = `${newTop}px`;
  win.style.width  = `${newW}px`;
  win.style.height = `${newH}px`;
}

// Taskbar icons & window controls
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

function closeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    // === pause any video inside ===
    const vid = win.querySelector('video');
    if (vid) {
      vid.pause();
      vid.currentTime = 0;
    }
    // ==============================
    win.classList.add('hidden');
    win.style.display = 'none';
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

// Z-index helper
let currentZIndex = 10;
function getNextZIndex() {
  return ++currentZIndex;
}

// Remember window positions/sizes
const windowStates = {};

// Clock in the taskbar
function updateClock() {
  const clock = document.getElementById("clock");
  if (clock) clock.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Toggle Start Menu
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
  let idx = 0;
  const total = messages.length;
  const interval = 400;
  const typer = setInterval(() => {
    logEl.textContent += messages[idx] + "\n";
    logEl.scrollTop = logEl.scrollHeight;
    progress.style.width = `${((idx + 1)/total)*100}%`;
    idx++;
    if (idx === total) {
      clearInterval(typer);
      setTimeout(() => {
        bootScreen.style.transition = "opacity 0.8s";
        bootScreen.style.opacity = "0";
        setTimeout(() => { bootScreen.style.display = "none"; }, 800);
      }, 500);
    }
  }, interval);
});

// ─── PROJECT LAUNCH SPLASH ────────────────────────────────────────────────
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

// ─── WINDOW HEADER DRAG & BUTTONS ────────────────────────────────────────
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
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
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
        ic.style.left = startLeft + "px";
        ic.style.top  = startTop  + "px";
        ic.style.zIndex = getNextZIndex();
        return { icon: ic, startLeft, startTop };
      });

      function onMouseMove(e) {
        const newLeft = e.clientX - shiftX - parentRect.left;
        const newTop  = e.clientY - shiftY - parentRect.top;
        const dx = newLeft - groupData[0].startLeft;
        const dy = newTop - groupData[0].startTop;
        groupData.forEach(({ icon, startLeft, startTop }) => {
          icon.style.left = startLeft + dx + "px";
          icon.style.top  = startTop  + dy + "px";
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

// ─── SNAKE GAME (rainbow psych-trails + score/levels/music) ─────────────
function initSnake() {
  const canvas = document.getElementById('snake-canvas');
  const ctx    = canvas.getContext('2d');
  const ui     = {
    score: document.getElementById('snake-score'),
    level: document.getElementById('snake-level'),
    best:  document.getElementById('snake-best'),
    status:document.getElementById('snake-status')
  };
  const music  = document.getElementById('snake-music');

  const GRID = 20;
  let cols, rows, snake, dx, dy, apple, hueOffset;
  let lastTime = 0, speed = 5, frameAcc = 0;
  let score = 0, level = 1, best = 0;
  let paused = false, gameOver = false;

  // load best score
  best = Number(localStorage.getItem('snakeBest')||0);
  ui.best.textContent = `Best: ${best}`;

  function reset() {
    cols = Math.floor(canvas.width/GRID);
    rows = Math.floor(canvas.height/GRID);
    snake = [{ x:~~(cols/2), y:~~(rows/2) }];
    dx = 1; dy = 0;
    placeApple();
    score = 0; level = 1; speed = 5; hueOffset = 0;
    ui.score.textContent = `Score: ${score}`;
    ui.level.textContent = `Level: ${level}`;
    ui.status.textContent = paused ? 'Paused' : 'Running';
    gameOver = false;
    music.currentTime = 0;
    if (!music.paused) return;
    // require a user interaction to start music
    music.play().catch(()=>{ /* will start on first click */ });
  }

  function placeApple() {
    apple = {
      x: Math.floor(Math.random()*cols),
      y: Math.floor(Math.random()*rows)
    };
    // avoid placing on snake
    if (snake.some(s => s.x===apple.x && s.y===apple.y)) placeApple();
  }

  window.addEventListener('keydown', e => {
    if (e.key === ' ') {
      paused = !paused;
      ui.status.textContent = paused ? 'Paused' : 'Running';
    }
    if (paused || gameOver) return;
    if (e.key==='ArrowUp'    && dy===0) { dx=0; dy=-1; }
    if (e.key==='ArrowDown'  && dy===0) { dx=0; dy= 1; }
    if (e.key==='ArrowLeft'  && dx===0) { dx=-1;dy= 0; }
    if (e.key==='ArrowRight' && dx===0) { dx= 1;dy= 0; }
  });

  function update(delta) {
    if (paused || gameOver) return;
    frameAcc += delta;
    const interval = 1000 / (speed + level*0.5);
    if (frameAcc < interval) return;
    frameAcc = 0;

    // move
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // eat?
    if (head.x===apple.x && head.y===apple.y) {
      score += 10;
      ui.score.textContent = `Score: ${score}`;
      if (score > best) {
        best = score;
        localStorage.setItem('snakeBest', best);
        ui.best.textContent = `Best: ${best}`;
      }
      if (score % 50 === 0) {
        level++;
        ui.level.textContent = `Level: ${level}`;
      }
      placeApple();
    } else {
      snake.pop();
    }

    // collision?
    if (
      head.x<0||head.y<0||
      head.x>=cols||head.y>=rows||
      snake.slice(1).some(s=>s.x===head.x&&s.y===head.y)
    ) {
      gameOver = true;
      ui.status.textContent = 'Game Over';
      return;
    }
  }

  function draw() {
    // fade for trail
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // apple
    ctx.fillStyle = 'magenta';
    ctx.fillRect(apple.x*GRID, apple.y*GRID, GRID-2, GRID-2);

    // snake
    snake.forEach((seg,i) => {
      const hue = (hueOffset + i*10 + level*20) % 360;
      ctx.fillStyle = `hsl(${hue},100%,50%)`;
      ctx.fillRect(seg.x*GRID, seg.y*GRID, GRID-2, GRID-2);
    });

    hueOffset = (hueOffset + 1 + level) % 360;
  }

  function loop(ts) {
    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    lastTime = ts;
    update(delta);
    draw();
    requestAnimationFrame(loop);
  }

  // resize canvas full-window
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight - 36; // leave taskbar
  }
  window.addEventListener('resize', resize);
  resize();

  reset();
  requestAnimationFrame(loop);
}

// wrap your openWindow so Snake boots on demand
const _open = openWindow;
openWindow = id => {
  _open(id);
  if (id==='snake') initSnake();
};


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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let star of stars) {
      star.z -= 2;
      if (star.z <= 0) {
        star.z = canvas.width;
        star.x = Math.random()*canvas.width;
        star.y = Math.random()*canvas.height;
      }
      const k = 128.0/star.z;
      const px = (star.x - canvas.width/2)*k + canvas.width/2;
      const py = (star.y - canvas.height/2)*k + canvas.height/2;
      const size = Math.max(0, (1-star.z/canvas.width)*3);
      ctx.beginPath();
      ctx.globalAlpha = star.o;
      ctx.fillStyle = '#fff';
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
  if (e.target.closest('.desktop-icon, .popup-window, #start-bar, #start-menu')) return;
  selStartX = e.clientX; selStartY = e.clientY;
  selDiv = document.createElement('div');
  selDiv.id = 'selection-rect';
  selDiv.style.left = `${selStartX}px`;
  selDiv.style.top  = `${selStartY}px`;
  selDiv.style.width = selDiv.style.height = '0px';
  document.body.appendChild(selDiv);
  document.addEventListener('mousemove', onSelectMove);
  document.addEventListener('mouseup', onSelectEnd, { once:true });
  e.preventDefault();
}
function onSelectMove(e) {
  const x = Math.min(e.clientX, selStartX),
        y = Math.min(e.clientY, selStartY),
        w = Math.abs(e.clientX - selStartX),
        h = Math.abs(e.clientY - selStartY);
  selDiv.style.left = `${x}px`;
  selDiv.style.top  = `${y}px`;
  selDiv.style.width  = `${w}px`;
  selDiv.style.height = `${h}px`;
  const box = selDiv.getBoundingClientRect();
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    const r = icon.getBoundingClientRect();
    const inside = r.left>=box.left && r.right<=box.right && r.top>=box.top && r.bottom<=box.bottom;
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

// ─── NATURE.EXE (Gallery) LOGIC ────────────────────────────────────────

// 1) List all of your Nature URLs here:
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

// 2) Preload them so clicks are instant
function preloadImages(urls) {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

// 3) Show any index (wrapping around)
function showNatureImage(idx) {
  natureIndex = (idx + natureImages.length) % natureImages.length;
  natureImgEl.src = natureImages[natureIndex];
}

// 4) Expose functions your buttons call
function prevNature() { showNatureImage(natureIndex - 1); }
function nextNature() { showNatureImage(natureIndex + 1); }

// 5) On initial load: preload all & display first
window.addEventListener('load', () => {
  preloadImages(natureImages);
  showNatureImage(0);
});




// ─── MUSIC.EXE LOGIC ─────────────────────────────────────────────────────

// 1) Your music files (hosted in assets or elsewhere)
const tracks = [
  { title: "Morning Synth", url: "https://cdn.glitch.global/.../morning-synth.mp3" },
  { title: "Lo-Fi Beats",  url: "https://cdn.glitch.global/.../lofi-beats.mp3"  },
  { title: "Techno Pulse", url: "https://cdn.glitch.global/.../techno-pulse.mp3" }
];

let trackIndex = 0;
const player     = document.getElementById("music-player");
const nowEl      = document.getElementById("now-playing");
const listEl     = document.getElementById("playlist");

// 2) Populate the playlist UI
tracks.forEach((t, i) => {
  const li = document.createElement("li");
  li.textContent = t.title;
  li.style.cursor = "pointer";
  li.onclick = () => playTrack(i);
  listEl.appendChild(li);
});

// 3) Core playback functions
function playTrack(i) {
  trackIndex = (i + tracks.length) % tracks.length;
  player.src = tracks[trackIndex].url;
  player.play();
  updateUI();
}

function nextTrack() { playTrack(trackIndex + 1); }
function prevTrack() { playTrack(trackIndex - 1); }

function togglePlay() {
  if (player.paused) {
    player.play();
  } else {
    player.pause();
  }
  updateUI();
}

// 4) Update “Now playing…” text & highlight
function updateUI() {
  nowEl.textContent = (player.paused ? "❚❚" : "▶") + " " + tracks[trackIndex].title;
  Array.from(listEl.children).forEach((li, i) => {
    li.style.color = i === trackIndex ? "var(--neon-green)" : "white";
  });
}

// 5) Auto-advance when one track ends
player.addEventListener("ended", nextTrack);

// 6) Pause/reset on window close
const origClose = closeWindow;
closeWindow = id => {
  if (id === "music" && player) {
    player.pause();
    player.currentTime = 0;
  }
  origClose(id);
};

