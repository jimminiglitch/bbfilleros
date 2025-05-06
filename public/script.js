//────────────────────────────────────────
// 1) BLIP (ignored if no <audio id="blip">)
//────────────────────────────────────────
function playBlip() {
  const blip = document.getElementById("blip");
  if (blip) {
    blip.currentTime = 0;
    blip.play();
  }
}

//────────────────────────────────────────
// 2) OPEN / MINIMIZE / CLOSE / MAXIMIZE & TASKBAR ICONS
//────────────────────────────────────────
let currentZIndex = 10;
const windowStates = {};

function getNextZIndex() {
  return ++currentZIndex;
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Hide start menu
  const startMenu = document.getElementById("start-menu");
  if (startMenu) startMenu.style.display = "none";

  // Lazy-load [data-src]
  win.querySelectorAll("[data-src]").forEach(el => {
    if (!el.src) el.src = el.dataset.src;
  });

  // Show & focus
  win.classList.remove("hidden");
  win.style.display = "flex";
  win.style.zIndex = getNextZIndex();

  // Add taskbar icon
  createTaskbarIcon(id);
}

function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return;
  const btn = document.createElement("button");
  btn.id = `taskbar-icon-${id}`;
  btn.className = "taskbar-icon";
  btn.textContent = id.toUpperCase();
  btn.addEventListener("click", () => {
    const win = document.getElementById(id);
    if (win) {
      const wasHidden = win.classList.toggle("hidden");
      if (!wasHidden) win.style.zIndex = getNextZIndex();
    }
    btn.remove();
  });
  document.getElementById("taskbar-icons").appendChild(btn);
}

function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add("hidden");
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  // Pause any playing video
  const vid = win.querySelector("video");
  if (vid) { vid.pause(); vid.currentTime = 0; }
  win.classList.add("hidden");
  // Remove its taskbar icon
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
      top: "0",
      left: "0",
      width: "100%",
      height: "100%"
    });
  } else {
    win.classList.remove("maximized");
    Object.assign(win.style, windowStates[id]);
  }
}

//────────────────────────────────────────
// 3) CLOCK & START MENU TOGGLE
//────────────────────────────────────────
function updateClock() {
  const clk = document.getElementById("clock");
  if (clk) clk.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

document.getElementById("start-button").addEventListener("click", () => {
  const m = document.getElementById("start-menu");
  if (m) m.style.display = m.style.display === "flex" ? "none" : "flex";
});

// Close start menu on outside click
window.addEventListener("click", e => {
  const sb = document.getElementById("start-button");
  const sm = document.getElementById("start-menu");
  if (sm && !sb.contains(e.target) && !sm.contains(e.target)) {
    sm.style.display = "none";
  }
});

//────────────────────────────────────────
// 4) BOOT SEQUENCE
//────────────────────────────────────────
function runBootSequence() {
  return new Promise(resolve => {
    const bootScreen = document.getElementById("bootScreen");
    const logEl = document.getElementById("boot-log");
    const progress = document.getElementById("progress-bar");
    const msgs = [
      "[ OK ] Initializing hardware...",
      "[ OK ] Loading kernel modules...",
      "[ OK ] Mounting filesystems...",
      "[ OK ] Starting system services...",
      "[ OK ] CyberDeck ready.",
      "[ DONE ] Boot complete."
    ];
    let idx = 0, total = msgs.length;
    const typer = setInterval(() => {
      logEl.textContent += msgs[idx] + "\n";
      progress.style.width = `${((idx + 1)/total)*100}%`;
      idx++;
      if (idx === total) {
        clearInterval(typer);
        setTimeout(() => {
          bootScreen.style.transition = "opacity 0.8s";
          bootScreen.style.opacity = "0";
          setTimeout(() => { bootScreen.style.display = "none"; resolve(); }, 800);
        }, 500);
      }
    }, 400);
  });
}

//────────────────────────────────────────
// 5) DESKTOP ICONS: dblclick + drag-group
//────────────────────────────────────────
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    // Double-click to open window
    icon.addEventListener("dblclick", () => openWindow(icon.dataset.window));

    // Drag selection + group drag
    icon.addEventListener("mousedown", e => {
      e.preventDefault();
      const parentRect = icon.parentElement.getBoundingClientRect();
      const clickRect = icon.getBoundingClientRect();
      let group = icon.classList.contains("selected")
        ? Array.from(document.querySelectorAll(".desktop-icon.selected"))
        : ( () => {
            document.querySelectorAll(".desktop-icon.selected").forEach(ic => ic.classList.remove("selected"));
            icon.classList.add("selected");
            return [icon];
          })();

      const shiftX = e.clientX - clickRect.left;
      const shiftY = e.clientY - clickRect.top;
      const groupData = group.map(ic => {
        const r = ic.getBoundingClientRect();
        const start = { left: r.left-parentRect.left, top: r.top-parentRect.top };
        ic.style.left = `${start.left}px`;
        ic.style.top = `${start.top}px`;
        ic.style.zIndex = getNextZIndex();
        return { icon: ic, start };
      });

      function onMove(ev) {
        const dx = ev.clientX - shiftX - parentRect.left - groupData[0].start.left;
        const dy = ev.clientY - shiftY - parentRect.top  - groupData[0].start.top;
        groupData.forEach(({ icon, start }) => {
          icon.style.left = `${start.left + dx}px`;
          icon.style.top  = `${start.top  + dy}px`;
        });
      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", () => document.removeEventListener("mousemove", onMove), { once: true });
    });

    icon.ondragstart = () => false;
  });
}

//────────────────────────────────────────
// 6) MULTI-SELECT BOX
//────────────────────────────────────────
let selDiv, selStartX, selStartY;
function onSelectStart(e) {
  if (e.target.closest(".desktop-icon, .popup-window, #start-bar, #start-menu")) return;
  selStartX = e.clientX; selStartY = e.clientY;
  selDiv = document.createElement("div");
  selDiv.id = "selection-rect";
  document.body.appendChild(selDiv);
  selDiv.style.left = `${selStartX}px`;
  selDiv.style.top  = `${selStartY}px`;

  function onMove(ev) {
    const x = Math.min(ev.clientX, selStartX);
    const y = Math.min(ev.clientY, selStartY);
    const w = Math.abs(ev.clientX - selStartX);
    const h = Math.abs(ev.clientY - selStartY);
    selDiv.style.left = `${x}px`;
    selDiv.style.top  = `${y}px`;
    selDiv.style.width  = `${w}px`;
    selDiv.style.height = `${h}px`;
    const box = selDiv.getBoundingClientRect();
    document.querySelectorAll(".desktop-icon").forEach(ic => {
      const r = ic.getBoundingClientRect();
      ic.classList.toggle("selected",
        r.left>=box.left && r.right<=box.right && r.top>=box.top && r.bottom<=box.bottom
      );
    });
  }

  function onEnd() {
    selDiv.remove(); selDiv = null;
    document.removeEventListener("mousemove", onMove);
  }

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onEnd, { once: true });
}

//────────────────────────────────────────
// 7) STARFIELD BACKGROUND
//────────────────────────────────────────
function initStarfield() {
  const canvas = document.getElementById("background-canvas");
  const ctx = canvas.getContext("2d");
  function resize() { canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
  window.addEventListener("resize", resize); resize();

  const stars = Array.from({length:300}, () => ({
    x:Math.random()*canvas.width, y:Math.random()*canvas.height,
    z:Math.random()*canvas.width, o:Math.random()
  }));

  (function loop() {
    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    stars.forEach(s => {
      s.z -= 2;
      if(s.z<=0) { s.z=canvas.width; s.x=Math.random()*canvas.width; s.y=Math.random()*canvas.height; }
      const k=128/s.z, px=(s.x-canvas.width/2)*k+canvas.width/2, py=(s.y-canvas.height/2)*k+canvas.height/2;
      const sz=Math.max(0,(1-s.z/canvas.width)*3);
      ctx.globalAlpha=s.o; ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(px,py,sz,0,2*Math.PI); ctx.fill();
    });
    ctx.globalAlpha=1; requestAnimationFrame(loop);
  })();
}

//────────────────────────────────────────
// 8) WINDOW HEADER DRAG & BUTTONS
//────────────────────────────────────────
function initWindowControls() {
  document.querySelectorAll(".popup-window").forEach(win => {
    const header = win.querySelector(".window-header");
    const btnMin = win.querySelector(".minimize");
    const btnMax = win.querySelector(".maximize");
    const btnCls = win.querySelector(".close");
    const id = win.id;

    btnMin && btnMin.addEventListener("click", () => minimizeWindow(id));
    btnMax && btnMax.addEventListener("click", () => toggleMaximizeWindow(id));
    btnCls && btnCls.addEventListener("click", () => closeWindow(id));

    let dragging=false, dx=0, dy=0;
    header.addEventListener("mousedown", e => {
      dragging=true;
      dx = e.clientX-win.offsetLeft;
      dy = e.clientY-win.offsetTop;
      win.style.zIndex = getNextZIndex();
    });
    document.addEventListener("mousemove", e => {
      if(dragging) {
        win.style.left = `${e.clientX-dx}px`;
        win.style.top  = `${e.clientY-dy}px`;
      }
    });
    document.addEventListener("mouseup", () => dragging=false);
  });
}

//────────────────────────────────────────
// 9) NATURE.EXE GALLERY
//────────────────────────────────────────
const natureImages = [
  "https://cdn.glitch.global/.../Galloway%20Geese%20at%20Sunset.png",
  "https://cdn.glitch.global/.../A%20Sedge%20of%20Sandhill%20on%20the%20Green.png",
  "https://cdn.glitch.global/.../GoldenHourGeese.png",
  "https://cdn.glitch.global/.../bombilate%20vicissitude.png",
  "https://cdn.glitch.me/.../SB1012.png",
  "https://cdn.glitch.me/.../Calm%20Reeds.png",
  "https://cdn.glitch.global/.../LeafTrail.png",
  "https://cdn.glitch.me/.../HawkTrail.png",
  "https://cdn.glitch.global/.../TrailMix108.png",
  "https://cdn.glitch.me/.../ToadInTheHole.png"
];
let natureIndex = 0;
function showNatureImage(i) {
  natureIndex = (i + natureImages.length) % natureImages.length;
  document.getElementById("nature-img").src = natureImages[natureIndex];
}
function initNatureGallery() {
  natureImages.forEach(u=>new Image().src=u);
  showNatureImage(0);
  document.getElementById("prevNature").onclick = ()=> showNatureImage(natureIndex-1);
  document.getElementById("nextNature").onclick = ()=> showNatureImage(natureIndex+1);
}

//────────────────────────────────────────
// 10) ARTWORK.EXE GALLERY
//────────────────────────────────────────
const artworkImages = [
  "https://cdn.glitch.global/.../whodat.gif",
  "https://cdn.glitch.global/.../octavia.jpg",
  "https://cdn.glitch.global/.../MilesSwings2025.jpg",
  "https://cdn.glitch.global/.../Leetridoid.jpg",
  "https://cdn.glitch.global/.../decay%20psych.png"
];
let artworkIndex = 0;
function showArtworkImage(i) {
  artworkIndex = (i + artworkImages.length) % artworkImages.length;
  document.getElementById("artwork-img").src = artworkImages[artworkIndex];
}
function initArtworkGallery() {
  artworkImages.forEach(u=>new Image().src=u);
  showArtworkImage(0);
  const btns = document.querySelectorAll("#artwork .gallery-controls button");
  btns[0].onclick = () => showArtworkImage(artworkIndex-1);
  btns[1].onclick = () => showArtworkImage(artworkIndex+1);
}

//────────────────────────────────────────
// 11) TERMINAL
//────────────────────────────────────────
const terminalCommands = {
  help:    "Available: help, about, projects, resume, contact, clear, exit",
  about:   "Benjamin Filler – Media Creator & Narrative Designer",
  projects: "Open PROJECTS.EXE",
  resume:  "Open RESUME.EXE",
  contact: "Open CONTACT.EXE",
  clear:   null,
  exit:    null
};
function initTerminal() {
  const input  = document.getElementById("terminal-input");
  const output = document.getElementById("terminal-output");
  input.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      const cmd = input.value.trim().toLowerCase();
      output.innerHTML += `<div><span>$</span> ${cmd}</div>`;
      if (cmd === "clear") {
        output.innerHTML = "";
      } else if (["about","projects","resume","contact"].includes(cmd)) {
        openWindow(cmd);
      } else if (cmd === "exit") {
        closeWindow("terminal");
      } else {
        const resp = terminalCommands[cmd];
        output.innerHTML += `<div>${resp===null?"":(resp||"Unknown command")}</div>`;
      }
      input.value = "";
      output.scrollTop = output.scrollHeight;
    }
  });
}

//────────────────────────────────────────
// 12) WEATHER WIDGET (requires API key)
//────────────────────────────────────────
async function updateWeather() {
  try {
    const res = await fetch(
      "https://api.openweathermap.org/data/2.5/weather?q=Birmingham&appid=YOUR_API_KEY&units=imperial"
    );
    const data = await res.json();
    const w = document.getElementById("weather-widget");
    if (w) {
      w.innerHTML = `
        <div class="weather-temp">${Math.round(data.main.temp)}°F</div>
        <div class="weather-cond">${data.weather[0].description}</div>
      `;
    }
  } catch (err) {
    console.error("Weather fetch error:", err);
  }
}

//────────────────────────────────────────
// 13) SCREENSAVER
//────────────────────────────────────────
let screensaverTimeout, screensaverActive=false;
function startScreensaver() {
  if (screensaverActive) return;
  const ss = document.createElement("div");
  ss.id="screensaver"; ss.className="screensaver active";
  ss.innerHTML=`<div class="screensaver-content"><img src="/icons/whodat.gif" alt="Screensaver"></div>`;
  document.body.appendChild(ss);
  screensaverActive=true;
}
function stopScreensaver() {
  const ss = document.getElementById("screensaver");
  if (ss) ss.remove();
  screensaverActive=false;
}
function initScreensaverListeners() {
  function reset() {
    clearTimeout(screensaverTimeout);
    stopScreensaver();
    screensaverTimeout = setTimeout(startScreensaver, 300000);
  }
  document.addEventListener("mousemove", reset);
  document.addEventListener("keypress", reset);
  reset();
}

//────────────────────────────────────────
// 14) MUSIC PLAYER
//────────────────────────────────────────
function initMusicPlayer() {
  const mp = document.getElementById("music-player");
  const playlist = ["track1.mp3","track2.mp3","track3.mp3"];
  let idx=0;
  function loadTrack(i) {
    mp.src = playlist[i]; mp.play();
    document.getElementById("now-playing").textContent=`▶ ${playlist[i]}`;
  }
  document.getElementById("prevTrack").onclick = ()=> loadTrack((--idx+playlist.length)%playlist.length);
  document.getElementById("nextTrack").onclick = ()=> loadTrack((++idx)%playlist.length);
  document.getElementById("togglePlay").onclick = ()=> mp.paused?mp.play():mp.pause();
  playlist.forEach(t=>{/*prefetch*/});
}

//────────────────────────────────────────
// 15) FILE EXPLORER
//────────────────────────────────────────
function initFileExplorer() {
  const explorer = document.createElement("div");
  explorer.id="file-explorer"; explorer.className="popup-window hidden";
  explorer.innerHTML=`
    <div class="window-header">
      <span>FILE EXPLORER</span>
      <button class="close" onclick="closeWindow('file-explorer')">X</button>
    </div>
    <div class="window-content">
      <div>C:\\Portfolio\\</div>
      <ul>
        <li>about.txt</li><li>resume.pdf</li><li>contact.html</li>
      </ul>
    </div>`;
  document.body.appendChild(explorer);
}

//────────────────────────────────────────
// 16) NOTIFICATIONS
//────────────────────────────────────────
function createNotification(msg,type="info") {
  const n = document.createElement("div");
  n.className=`notification ${type}`;
  n.textContent=msg;
  document.body.appendChild(n);
  setTimeout(()=>n.remove(),3000);
}

//────────────────────────────────────────
// 17) WINDOW STACK PANEL
//────────────────────────────────────────
function initWindowStack() {
  const panel = document.createElement("div");
  panel.id="window-stack"; document.body.appendChild(panel);
  document.addEventListener("click",()=>{
    panel.innerHTML="";
    document.querySelectorAll(".popup-window:not(.hidden)").forEach(win=>{
      const item=document.createElement("div");
      item.textContent=win.querySelector(".window-header span").innerText;
      item.onclick=()=> openWindow(win.id);
      panel.appendChild(item);
    });
  });
}

//────────────────────────────────────────
// 18) KEYBOARD SHORTCUTS
//────────────────────────────────────────
document.addEventListener("keydown", e=>{
  if(e.altKey&&e.key==="Tab"){
    const wins=Array.from(document.querySelectorAll(".popup-window:not(.hidden)"));
    const idx=wins.findIndex(w=>w.classList.contains("active"));
    wins[idx]?.classList.remove("active");
    wins[(idx+1)%wins.length]?.classList.add("active");
  }
  if(e.ctrlKey&&e.key==="w"){
    const active=document.querySelector(".popup-window.active:not(.hidden)");
    if(active) closeWindow(active.id);
  }
  if(e.ctrlKey&&e.key==="n") openWindow("about");
});

//────────────────────────────────────────
// 19) CLIPBOARD MANAGER
//────────────────────────────────────────
function initClipboardManager() {
  const clip = document.createElement("div");
  clip.id="clipboard-manager"; clip.className="popup-window hidden";
  clip.innerHTML=`
    <div class="window-header">
      <span>CLIPBOARD MANAGER</span>
      <button class="close" onclick="closeWindow('clipboard-manager')">X</button>
    </div>
    <div class="window-content">
      <textarea id="clipboard-history" readonly></textarea>
    </div>`;
  document.body.appendChild(clip);
  document.addEventListener("copy", e=>{
    const text=e.clipboardData.getData("text/plain");
    const hist=document.getElementById("clipboard-history");
    hist.value+=text+"\n";
  });
}

//────────────────────────────────────────
// 20) INITIALIZATION
//────────────────────────────────────────
document.addEventListener("DOMContentLoaded", ()=>{
  runBootSequence().then(()=>{
    initDesktopIcons();
    initStarfield();
    initNatureGallery();
    initArtworkGallery();
    initTerminal();
    updateWeather();
    initScreensaverListeners();
    initMusicPlayer();
    initFileExplorer();
    initWindowStack();
    initClipboardManager();
  });
});
window.addEventListener("load", initWindowControls);
window.addEventListener("mousedown", onSelectStart);
