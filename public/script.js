//────────────────────────────────────────
//   Main Script (script.js)
//────────────────────────────────────────

// Play the blip sound effect (if you add one later)
function playBlip() {
  const blip = document.getElementById("blip");
  if (blip) {
    blip.currentTime = 0;
    blip.play();
  }
}

// Z-index helper for focusing windows
let currentZIndex = 10;
function getNextZIndex() {
  return ++currentZIndex;
}

// Store window positions/sizes for restore after maximize
const windowStates = {};

// ─── OPEN / FOCUS A WINDOW ────────────────────────────────────────────────
function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Hide start menu & deactivate other windows
  document.getElementById("start-menu").style.display = "none";
  document.querySelectorAll(".popup-window").forEach(w => w.classList.remove("active"));

  // Show & focus this one
  win.classList.remove("hidden");
  win.classList.add("active");
  win.style.display = "flex";
  win.style.zIndex = getNextZIndex();

  // Restore position/size if we saved one
  if (windowStates[id]) {
    Object.assign(win.style, windowStates[id]);
    win.classList.remove("maximized");
  }

  // Clamp it to viewport
  const rect = win.getBoundingClientRect();
  const margin = 20;
  const vw = window.innerWidth, vh = window.innerHeight;
  let { left, top, width, height } = rect;
  if (width > vw - margin*2) width = vw - margin*2;
  if (height > vh - margin*2) height = vh - margin*2;
  if (left < margin) left = margin;
  if (top < margin) top = margin;
  if (left + width > vw - margin) left = vw - margin - width;
  if (top + height > vh - margin) top = vh - margin - height;
  win.style.left   = left + "px";
  win.style.top    = top + "px";
  win.style.width  = width + "px";
  win.style.height = height + "px";
}

// ─── MINIMIZE (TO TASKBAR) ────────────────────────────────────────────────
function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return;
  const btn = document.createElement("button");
  btn.id = `taskbar-icon-${id}`;
  btn.className = "taskbar-icon";
  btn.textContent = id.toUpperCase();
  btn.addEventListener("click", () => {
    const win = document.getElementById(id);
    win.classList.remove("hidden");
    win.style.display = "flex";
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

// ─── CLOSE WINDOW ─────────────────────────────────────────────────────────
function closeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Pause any <video> inside and reset
  const vid = win.querySelector("video");
  if (vid) {
    vid.pause();
    vid.currentTime = 0;
  }

  // If it's the music app, pause/reset audio
  if (id === "music") {
    const player = document.getElementById("music-player");
    if (player) {
      player.pause();
      player.currentTime = 0;
    }
  }

  // Hide
  win.classList.add("hidden");
  win.style.display = "none";

  // Remove its taskbar icon
  const icon = document.getElementById(`taskbar-icon-${id}`);
  if (icon) icon.remove();
}

// ─── TOGGLE MAXIMIZE / RESTORE ────────────────────────────────────────────
function toggleMaximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  if (!win.classList.contains("maximized")) {
    // save current
    windowStates[id] = {
      left:   win.style.left,
      top:    win.style.top,
      width:  win.style.width,
      height: win.style.height
    };
    // maximize
    win.classList.add("maximized");
    win.style.left   = "0";
    win.style.top    = "0";
    win.style.width  = "100%";
    win.style.height = "100%";
    // remove taskbar icon if any
    const icon = document.getElementById(`taskbar-icon-${id}`);
    if (icon) icon.remove();
  } else {
    // restore
    Object.assign(win.style, windowStates[id]);
    win.classList.remove("maximized");
  }
}

// ─── HOOK UP HEADER BUTTONS & DRAG ────────────────────────────────────────
document.querySelectorAll(".popup-window").forEach(win => {
  const id     = win.id;
  const header = win.querySelector(".window-header");
  const btnMin = header.querySelector(".minimize");
  const btnMax = header.querySelector(".maximize");
  const btnCls = header.querySelector(".close");

  btnMin && btnMin.addEventListener("click", () => minimizeWindow(id));
  btnMax && btnMax.addEventListener("click", () => toggleMaximizeWindow(id));
  btnCls && btnCls.addEventListener("click", () => closeWindow(id));

  // drag-to-move
  let dragging = false, offsetX = 0, offsetY = 0;
  header.addEventListener("mousedown", e => {
    dragging = true;
    offsetX  = e.clientX - win.offsetLeft;
    offsetY  = e.clientY - win.offsetTop;
    win.style.zIndex = getNextZIndex();
  });
  document.addEventListener("mousemove", e => {
    if (dragging) {
      win.style.left = (e.clientX - offsetX) + "px";
      win.style.top  = (e.clientY - offsetY) + "px";
    }
  });
  document.addEventListener("mouseup", () => { dragging = false; });
});

// ─── DESKTOP ICON BEHAVIOR ─────────────────────────────────────────────────
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    // double-click to open
    icon.addEventListener("dblclick", () => {
      openWindow(icon.dataset.window);
      playBlip();
    });
    // click+drag group move
    icon.addEventListener("mousedown", e => {
      e.preventDefault();
      // select logic
      let group;
      if (icon.classList.contains("selected")) {
        group = Array.from(document.querySelectorAll(".desktop-icon.selected"));
      } else {
        document.querySelectorAll(".desktop-icon.selected").forEach(i=>i.classList.remove("selected"));
        icon.classList.add("selected");
        group = [icon];
      }
      const parentRect = icon.parentElement.getBoundingClientRect();
      const shiftX     = e.clientX - icon.getBoundingClientRect().left;
      const shiftY     = e.clientY - icon.getBoundingClientRect().top;
      // capture start positions
      const groupData = group.map(ic => {
        const r = ic.getBoundingClientRect();
        ic.style.left = (r.left - parentRect.left) + "px";
        ic.style.top  = (r.top  - parentRect.top ) + "px";
        ic.style.zIndex = getNextZIndex();
        return { icon: ic, startX: r.left - parentRect.left, startY: r.top - parentRect.top };
      });
      function onMove(ev) {
        const newX = ev.clientX - shiftX - parentRect.left;
        const newY = ev.clientY - shiftY - parentRect.top;
        const dx   = newX - groupData[0].startX;
        const dy   = newY - groupData[0].startY;
        groupData.forEach(({ icon, startX, startY }) => {
          icon.style.left = (startX + dx) + "px";
          icon.style.top  = (startY + dy) + "px";
        });
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", function cleanup() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", cleanup);
      }, { once:true });
    });
    icon.ondragstart = () => false;
  });
}
window.addEventListener("load", initDesktopIcons);

// ─── MULTI-SELECT RECTANGLE ───────────────────────────────────────────────
let selStartX, selStartY, selDiv;
function onSelectStart(e) {
  if (e.target.closest(".desktop-icon, .popup-window, #start-bar, #start-menu")) return;
  selStartX = e.clientX;
  selStartY = e.clientY;
  selDiv = document.createElement("div");
  selDiv.id = "selection-rect";
  selDiv.style.left = selStartX + "px";
  selDiv.style.top  = selStartY + "px";
  document.body.appendChild(selDiv);
  document.addEventListener("mousemove", onSelectMove);
  document.addEventListener("mouseup", onSelectEnd, { once:true });
  e.preventDefault();
}
function onSelectMove(e) {
  const x = Math.min(e.clientX, selStartX),
        y = Math.min(e.clientY, selStartY),
        w = Math.abs(e.clientX - selStartX),
        h = Math.abs(e.clientY - selStartY);
  selDiv.style.left   = x + "px";
  selDiv.style.top    = y + "px";
  selDiv.style.width  = w + "px";
  selDiv.style.height = h + "px";
  const box = selDiv.getBoundingClientRect();
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    const r = icon.getBoundingClientRect();
    const inside = r.left>=box.left && r.right<=box.right && r.top>=box.top && r.bottom<=box.bottom;
    icon.classList.toggle("selected", inside);
  });
}
function onSelectEnd() {
  selDiv.remove();
  selDiv = null;
  document.removeEventListener("mousemove", onSelectMove);
}
window.addEventListener("mousedown", onSelectStart);

// ─── NOTES.EXE LOGIC ─────────────────────────────────────────────────────
window.addEventListener("load", () => {
  const notesArea = document.getElementById("notes-area");
  const saved = localStorage.getItem("desktopNotes");
  if (saved) notesArea.value = saved;
  notesArea.addEventListener("blur", () => {
    localStorage.setItem("desktopNotes", notesArea.value);
  });
});

// ─── NATURE.EXE (Gallery) ─────────────────────────────────────────────────
const natureImages = [
  'https://cdn.glitch.global/…/Galloway%20Geese%20at%20Sunset.png',
  'https://cdn.glitch.global/…/A%20Sedge%20of%20Sandhill%20on%20the%20Green.png',
  'https://cdn.glitch.global/…/GoldenHourGeese.png',
  'https://cdn.glitch.global/…/bombilate%20vicissitude.png',
  'https://cdn.glitch.global/…/SB1012.png',
  'https://cdn.glitch.global/…/Calm%20Reeds.png',
  'https://cdn.glitch.global/…/LeafTrail.png',
  'https://cdn.glitch.global/…/HawkTrail.png',
  'https://cdn.glitch.global/…/TrailMix108.png',
  'https://cdn.glitch.global/…/ToadInTheHole.png'
];
let natureIndex = 0;
const natureImgEl = document.getElementById("nature-img");
function preloadImages(urls) {
  urls.forEach(u => { const i=new Image(); i.src=u; });
}
function showNatureImage(i) {
  natureIndex = (i + natureImages.length) % natureImages.length;
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
  { title: "Morning Synth", url: "https://cdn.glitch.global/.../morning-synth.mp3" },
  { title: "Lo-Fi Beats",  url: "https://cdn.glitch.global/.../lofi-beats.mp3"  },
  { title: "Techno Pulse", url: "https://cdn.glitch.global/.../techno-pulse.mp3" }
];
let trackIndex = 0;
const player = document.getElementById("music-player");
const nowEl  = document.getElementById("now-playing");
const listEl = document.getElementById("playlist");
tracks.forEach((t,i) => {
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
  nowEl.textContent = (player.paused? "❚❚":"▶") + " " + tracks[trackIndex].title;
  Array.from(listEl.children).forEach((li,i)=>{
    li.style.color = i===trackIndex? "var(--neon-green)" : "white";
  });
}
player.addEventListener("ended", nextTrack);

// ─── SNAKE.EXE ────────────────────────────────────────────────────────────
let snakeInterval;
function startSnake() {
  const canvas = document.getElementById("snake-canvas");
  const ctx    = canvas.getContext("2d");
  const grid   = 20;
  let vx=1, vy=0, count=0;
  let snake=[{x:9,y:9}], apple={x:5,y:5};

  document.addEventListener("keydown", e=>{
    if(e.key==="ArrowUp"   && vy===0){ vx=0; vy=-1;}
    if(e.key==="ArrowDown" && vy===0){ vx=0; vy= 1;}
    if(e.key==="ArrowLeft" && vx===0){ vx=-1;vy= 0;}
    if(e.key==="ArrowRight"&& vx===0){ vx= 1;vy= 0;}
  });

  function loop() {
    if (++count < 4) return;  // slow
    count = 0;
    const head = { x: snake[0].x+vx, y: snake[0].y+vy };
    snake.unshift(head);
    if (head.x===apple.x && head.y===apple.y) {
      apple = { x:Math.floor(Math.random()*(canvas.width/grid)), y:Math.floor(Math.random()*(canvas.height/grid)) };
    } else snake.pop();

    // collisions
    if (
      head.x<0|| head.y<0||
      head.x>=canvas.width/grid||
      head.y>=canvas.height/grid||
      snake.slice(1).some(s=>s.x===head.x&&s.y===head.y)
    ) {
      clearInterval(snakeInterval);
      return alert("💥 Game Over! Score: "+(snake.length-1));
    }

    // draw
    ctx.fillStyle="black"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="red";  ctx.fillRect(apple.x*grid, apple.y*grid, grid-2, grid-2);
    ctx.fillStyle="lime";
    snake.forEach(s=>ctx.fillRect(s.x*grid, s.y*grid, grid-2, grid-2));
  }

  snakeInterval = setInterval(loop, 1000/15);
}

// tie snake into open/close
const origOpen = openWindow;
openWindow = id => {
  origOpen(id);
  if (id==="snake" && !snakeInterval) startSnake();
};
const origClose = closeWindow;
closeWindow = id => {
  origClose(id);
  if (id==="snake" && snakeInterval) {
    clearInterval(snakeInterval);
    snakeInterval = null;
  }
};

// ─── CLOCK & START MENU ───────────────────────────────────────────────────
function updateClock() {
  document.getElementById("clock").textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

document.getElementById("start-button")
  .addEventListener("click", ()=>{
    const m = document.getElementById("start-menu");
    m.style.display = (m.style.display==="flex" ? "none" : "flex");
  });

// ─── BOOT SCREEN ANIMATION ────────────────────────────────────────────────
window.addEventListener("load", ()=>{
  const boot = document.getElementById("bootScreen"),
        log  = document.getElementById("boot-log"),
        bar  = document.getElementById("progress-bar");
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
    log.textContent += msgs[i]+"\n";
    log.scrollTop = log.scrollHeight;
    bar.style.width = ((i+1)/total*100)+"%";
    i++;
    if (i===total) {
      clearInterval(iv);
      setTimeout(()=>{
        boot.style.transition="opacity .8s";
        boot.style.opacity="0";
        setTimeout(()=> boot.style.display="none", 800);
      },500);
    }
  },400);
});

// ─── STARFIELD BACKGROUND ─────────────────────────────────────────────────
function initStarfield() {
  const canvas = document.getElementById("background-canvas"),
        ctx    = canvas.getContext("2d");
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  addEventListener("resize", resize);
  resize();
  const stars = Array.from({length:300},()=>({
    x:Math.random()*canvas.width,
    y:Math.random()*canvas.height,
    z:Math.random()*canvas.width,
    o:Math.random()
  }));
  (function anim(){
    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    for (let s of stars) {
      s.z -= 2;
      if (s.z<=0) {
        s.z=canvas.width;
        s.x=Math.random()*canvas.width;
        s.y=Math.random()*canvas.height;
      }
      const k = 128/s.z,
            px = (s.x-canvas.width/2)*k+canvas.width/2,
            py = (s.y-canvas.height/2)*k+canvas.height/2,
            size = Math.max(0,(1-s.z/canvas.width)*3);
      ctx.globalAlpha = s.o;
      ctx.beginPath();
      ctx.arc(px,py,size,0,2*Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(anim);
  })();
}
window.addEventListener("load", initStarfield);
