//────────────────────────────────────────
//   Main Script (public/script.js)
//────────────────────────────────────────

// 1) BLIP (ignored if no <audio id="blip"> present)
function playBlip() {
  const blip = document.getElementById("blip");
  if (blip) {
    blip.currentTime = 0;
    blip.play();
  }
}

// 2) OPEN / MINIMIZE / CLOSE / MAXIMIZE & TASKBAR ICONS
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

  // 2) Lazy-load Snake iframe
  if (id === "snake") {
    const iframe = win.querySelector("iframe[data-src]");
    if (iframe && !iframe.src) iframe.src = iframe.dataset.src;
  }

  // 3) Lazy-load any <video data-src> in this window
  win.querySelectorAll("video[data-src]").forEach(v => {
    if (!v.src) {
      v.src = v.dataset.src;
      v.load();
      v.play().catch(() => { /* autoplay may require a gesture */ });
    }
  });

  // 4) Show & focus
  win.classList.remove("hidden");
  win.classList.add("active");
  win.style.display = "flex";
  win.style.zIndex  = getNextZIndex();

  // 5) Restore previous bounds
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

// 3) CLOCK & START MENU TOGGLE
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

// 4) BOOT SEQUENCE (run on DOMContentLoaded)
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
    let idx     = 0;
    const total = msgs.length;
    const delay = 400;

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

// 5) DESKTOP ICONS (double-click to open + drag-group)
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    // double-click to open
    icon.addEventListener("dblclick", () => openWindow(icon.dataset.window));

    // drag-group start
   icon.addEventListener("mousedown", e => {
  e.preventDefault();
  const parentRect = icon.parentElement.getBoundingClientRect();
  const clickRect  = icon.getBoundingClientRect();

  // Build your drag‐group: if this icon was already selected, drag ALL selected;
  // otherwise clear selection & only drag this one.
  let group;
  if (icon.classList.contains("selected")) {
    group = Array.from(document.querySelectorAll(".desktop-icon.selected"));
  } else {
    document.querySelectorAll(".desktop-icon.selected")
      .forEach(ic => ic.classList.remove("selected"));
    icon.classList.add("selected");
    group = [icon];
  }

  // Compute initial offsets
  const shiftX = e.clientX - clickRect.left;
  const shiftY = e.clientY - clickRect.top;

  // Record each icon’s starting position
  const groupData = group.map(ic => {
    const r = ic.getBoundingClientRect();
    const startLeft = r.left - parentRect.left;
    const startTop  = r.top  - parentRect.top;
    ic.style.left  = `${startLeft}px`;
    ic.style.top   = `${startTop}px`;
    ic.style.zIndex = getNextZIndex();
    return { icon: ic, startLeft, startTop };
  });

  // Drag listener
  function onMouseMove(e) {
    const dx = (e.clientX - shiftX - parentRect.left) - groupData[0].startLeft;
    const dy = (e.clientY - shiftY - parentRect.top)  - groupData[0].startTop;
    groupData.forEach(({ icon, startLeft, startTop }) => {
      icon.style.left = `${startLeft + dx}px`;
      icon.style.top  = `${startTop  + dy}px`;
    });
  }

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", () => {
    document.removeEventListener("mousemove", onMouseMove);
  }, { once: true });
});


    // disable native drag ghost
    icon.ondragstart = () => false;
  });
}

// 6) CLICK-AND-DRAG MULTI-SELECT (rainbow selector box)
let selStartX, selStartY, selDiv;

function onSelectStart(e) {
  if (e.target.closest(".desktop-icon, .popup-window, #start-bar, #start-menu")) {
    return;
  }
  selStartX = e.clientX;
  selStartY = e.clientY;
  selDiv    = document.createElement("div");
  selDiv.id = "selection-rect";
  selDiv.style.left   = `${selStartX}px`;
  selDiv.style.top    = `${selStartY}px`;
  selDiv.style.width  = "0px";
  selDiv.style.height = "0px";
  document.body.appendChild(selDiv);

  document.addEventListener("mousemove", onSelectMove);
  document.addEventListener("mouseup", onSelectEnd, { once: true });
  e.preventDefault();
}

function onSelectMove(e) {
  if (!selDiv) return;
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
}

// 7) STARFIELD BACKGROUND
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
  const stars = Array.from({ length: numStars }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * canvas.width,
    o: Math.random()
  }));

  (function animate() {
    // fade trails
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw stars
    for (let s of stars) {
      s.z -= 2;
      if (s.z <= 0) {
        s.z = canvas.width;
        s.x = Math.random() * canvas.width;
        s.y = Math.random() * canvas.height;
      }
      const k  = 128.0 / s.z;
      const px = (s.x - canvas.width/2) * k + canvas.width/2;
      const py = (s.y - canvas.height/2) * k + canvas.height/2;
      const sz = Math.max(0, (1 - s.z / canvas.width) * 3);

      ctx.globalAlpha = s.o;
      ctx.fillStyle   = '#fff';
      ctx.beginPath();
      ctx.arc(px, py, sz, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(animate);
  })();
}

// 8) WINDOW HEADER DRAG & BUTTONS
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

// ─── NATURE.EXE (Gallery) ──────────────────────────────────────────────────

// 1) Your Nature image URLs
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

// Preload all the images:
function preloadNature(urls) {
  urls.forEach(u => {
    const i = new Image();
    i.src = u;
  });
}

// Show the image at (wrapped) index i:
function showNatureImage(i) {
  natureIndex = (i + natureImages.length) % natureImages.length;
  natureImgEl.src = natureImages[natureIndex];
}

// Wire up your Prev/Next buttons and kickoff:
function initNatureGallery() {
  preloadNature(natureImages);
  showNatureImage(0);

  // find the two buttons in the nature window:
  const btns = document.querySelectorAll('#nature .window-content > div button');
  if (btns.length === 2) {
    btns[0].onclick = () => showNatureImage(natureIndex - 1);
    btns[1].onclick = () => showNatureImage(natureIndex + 1);
  }
}

// ─── ARTWORK.EXE (Digital Artwork Gallery) ────────────────────────────────

// 1) URLs for your digital artwork images (place these files under /public/artwork/)
const artworkImages = [
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/whodat.gif?v=1746365769069',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/octavia.jpg?v=1746412752104',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/MilesSwings2025.jpg?v=1746410914289',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Leetridoid.jpg?v=1746411261773',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/decay%20psych.png?v=1746500904118'
];

let artworkIndex = 0;
const artworkImgEl = document.getElementById('artwork-img');

// Preload all Artwork images
function preloadArtwork(urls) {
  urls.forEach(u => {
    const i = new Image();
    i.src = u;
  });
}

// Show wrapped-around index
function showArtworkImage(i) {
  artworkIndex = (i + artworkImages.length) % artworkImages.length;
  artworkImgEl.src = artworkImages[artworkIndex];
}

// Initialize your Artwork gallery
function initArtworkGallery() {
  // preload
  preloadArtwork(artworkImages);

  // first image
  showArtworkImage(0);

  // bind buttons
  const btns = document.querySelectorAll('#artwork .gallery-controls button');
  btns[0].onclick = () => showArtworkImage(artworkIndex - 1);
  btns[1].onclick = () => showArtworkImage(artworkIndex + 1);
}

// ──────────────────────────────────────────────────────────────────────────
// ensure it runs after boot + the other inits
document.addEventListener("DOMContentLoaded", () => {
  runBootSequence().then(() => {
    initDesktopIcons();
    initStarfield();
    initNatureGallery();    
    initArtworkGallery();   
  });
});

window.addEventListener("load", initWindowControls);
window.addEventListener("mousedown", onSelectStart);

// Add this to your existing script.js

// Window Animations
function animateWindowOpen(windowId) {
  const win = document.getElementById(windowId);
  if (!win) return;
  
  // Create particles
  for (let i = 0; i < 5; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.width = particle.style.height = Math.random() * 5 + 2 + 'px';
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
  
  // Add ripple effect
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  ripple.style.left = win.offsetLeft + win.offsetWidth/2 + 'px';
  ripple.style.top = win.offsetTop + win.offsetHeight/2 + 'px';
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 500);
}

// Modify openWindow function to use animation
function openWindow(id) {
  // ... existing code ...
  win.classList.remove("hidden");
  win.classList.add("active");
  win.style.display = "flex";
  win.style.zIndex = getNextZIndex();
  
  // Add animation
  animateWindowOpen(id);
  
  // ... rest of existing code ...
}

// Add window snapping
function snapWindowToEdge(win) {
  const rect = win.getBoundingClientRect();
  const margin = 10;
  
  // Snap to edges
  if (rect.left < margin) win.style.left = margin + 'px';
  if (rect.right > window.innerWidth - margin) 
    win.style.left = window.innerWidth - win.offsetWidth - margin + 'px';
  if (rect.top < margin) win.style.top = margin + 'px';
  if (rect.bottom > window.innerHeight - margin) 
    win.style.top = window.innerHeight - win.offsetHeight - margin + 'px';
}

// Add to window drag handler
document.addEventListener("mousemove", e => {
  if (isDragging) {
    win.style.left = `${e.clientX - offsetX}px`;
    win.style.top = `${e.clientY - offsetY}px`;
    snapWindowToEdge(win);
  }
});

// Terminal commands
const terminalCommands = {
  'help': 'Available commands: help, about, projects, contact, exit',
  'about': 'Benjamin Filler - Media Creator & Narrative Designer',
  'projects': 'View projects in PROJECTS.EXE',
  'contact': 'Contact info in CONTACT.EXE',
  'exit': 'Closing terminal...'
};

// Initialize terminal
function initTerminal() {
  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const command = input.value.trim().toLowerCase();
      const response = terminalCommands[command] || 'Command not found';
      
      output.innerHTML += `<div class="terminal-command">${input.value}</div>
                          <div class="terminal-output">${response}</div>`;
      
      input.value = '';
      input.scrollIntoView();
    }
  });
}

// Add to window initialization
document.addEventListener("DOMContentLoaded", () => {
  runBootSequence().then(() => {
    initDesktopIcons();
    initStarfield();
    initNatureGallery();
    initArtworkGallery();
    initTerminal();  // Add this
  });
});

// Add to script.js
async function updateWeather() {
  try {
    const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Birmingham&appid=YOUR_API_KEY&units=imperial');
    const data = await response.json();
    
    const weatherWidget = document.getElementById('weather-widget');
    if (weatherWidget) {
      weatherWidget.innerHTML = `
        <div class="weather-temp">${Math.round(data.main.temp)}°F</div>
        <div class="weather-condition">${data.weather[0].description}</div>
        <div class="weather-location">Birmingham, MI</div>
      `;
    }
  } catch (error) {
    console.error('Error fetching weather:', error);
  }
}

// Add this to your HTML in the body
<div id="weather-widget" class="weather-widget">
  Loading weather...
</div>

// Initialize weather
document.addEventListener("DOMContentLoaded", () => {
  updateWeather();
  setInterval(updateWeather, 3600000); // Update every hour
});

// Add to script.js
let screensaverTimeout;
let isScreensaverActive = false;

function startScreensaver() {
  if (isScreensaverActive) return;
  
  const screensaver = document.createElement('div');
  screensaver.className = 'screensaver active';
  screensaver.innerHTML = `
    <div class="screensaver-content">
      <div class="screensaver-artwork">
        <img src="https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/whodat.gif" alt="Artwork">
      </div>
      <div class="screensaver-text">
        <h2>Benjamin Filler</h2>
        <p>Cyber Deck Active</p>
      </div>
    </div>
  `;
  document.body.appendChild(screensaver);
  
  isScreensaverActive = true;
}

function stopScreensaver() {
  const screensaver = document.querySelector('.screensaver');
  if (screensaver) {
    screensaver.remove();
    isScreensaverActive = false;
  }
}

// Listen for activity
document.addEventListener('mousemove', () => {
  clearTimeout(screensaverTimeout);
  stopScreensaver();
  screensaverTimeout = setTimeout(startScreensaver, 300000); // 5 minutes
});

document.addEventListener('keypress', () => {
  clearTimeout(screensaverTimeout);
  stopScreensaver();
  screensaverTimeout = setTimeout(startScreensaver, 300000);
});

// Add to script.js
function initMusicPlayer() {
  const musicPlayer = document.createElement('div');
  musicPlayer.className = 'music-player popup-window';
  musicPlayer.innerHTML = `
    <div class="window-header">
      <span>MUSIC.PLAYER</span>
      <button class="minimize">_</button>
      <button class="maximize">▭</button>
      <button class="close">X</button>
    </div>
    <div class="window-content">
      <audio id="music-audio" controls>
        <source src="https://your-music-file.mp3" type="audio/mpeg">
      </audio>
      <div id="music-tracks">
        <div class="track" data-src="https://track1.mp3">Track 1</div>
        <div class="track" data-src="https://track2.mp3">Track 2</div>
        <div class="track" data-src="https://track3.mp3">Track 3</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(musicPlayer);
  
  const audio = document.getElementById('music-audio');
  const tracks = document.querySelectorAll('.track');
  
  tracks.forEach(track => {
    track.addEventListener('click', () => {
      audio.src = track.dataset.src;
      audio.play();
    });
  });
}

// Add to window initialization
document.addEventListener("DOMContentLoaded", () => {
  // ... existing code ...
  initMusicPlayer();
});

// Add to script.js
function initFileExplorer() {
  const explorer = document.createElement('div');
  explorer.className = 'file-explorer popup-window';
  explorer.innerHTML = `
    <div class="window-header">
      <span>FILE.EXPLORER</span>
      <button class="minimize">_</button>
      <button class="maximize">▭</button>
      <button class="close">X</button>
    </div>
    <div class="window-content">
      <div class="explorer-path">C:\Portfolio\</div>
      <div class="explorer-content">
        <div class="file-item folder" data-path="projects">Projects</div>
        <div class="file-item" data-path="resume.pdf">Resume</div>
        <div class="file-item" data-path="contact.html">Contact</div>
        <div class="file-item folder" data-path="artwork">Artwork</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(explorer);
  
  const files = document.querySelectorAll('.file-item');
  
  files.forEach(file => {
    file.addEventListener('click', () => {
      if (file.classList.contains('folder')) {
        // Toggle folder view
        file.classList.toggle('expanded');
      } else {
        // Open file
        const path = file.dataset.path;
        if (path) {
          window.open(path, '_blank');
        }
      }
    });
  });
}

// Add to script.js
function createNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${type === 'info' ? 'ℹ️' : '⚠️'}</span>
    <span class="notification-message">${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Example usage
window.addEventListener('load', () => {
  createNotification('Cyber Deck Initialized', 'info');
});

// Add to script.js
function initWindowStack() {
  const stack = document.createElement('div');
  stack.className = 'window-stack';
  
  document.body.appendChild(stack);
  
  // Update stack when windows open/close
  function updateStack() {
    const windows = document.querySelectorAll('.popup-window:not(.hidden)');
    stack.innerHTML = '';
    
    windows.forEach(win => {
      const item = document.createElement('div');
      item.className = 'window-stack-item';
      item.textContent = win.querySelector('.window-header span').textContent;
      item.addEventListener('click', () => {
        win.classList.add('active');
        win.classList.remove('hidden');
        win.style.display = 'flex';
      });
      stack.appendChild(item);
    });
  }
  
  // Listen for window state changes
  document.addEventListener('click', (e) => {
    if (e.target.closest('.minimize, .maximize, .close')) {
      setTimeout(updateStack, 100);
    }
  });
}

// Add to script.js
document.addEventListener('keydown', (e) => {
  // Alt + Tab for window switching
  if (e.altKey && e.key === 'Tab') {
    const windows = Array.from(document.querySelectorAll('.popup-window:not(.hidden)'));
    const currentIndex = windows.findIndex(win => win.classList.contains('active'));
    const nextIndex = (currentIndex + 1) % windows.length;
    
    if (currentIndex !== -1) {
      windows[currentIndex].classList.remove('active');
    }
    windows[nextIndex].classList.add('active');
  }
  
  // Ctrl + W to close window
  if (e.ctrlKey && e.key === 'w') {
    const activeWin = document.querySelector('.popup-window.active:not(.hidden)');
    if (activeWin) {
      closeWindow(activeWin.id);
    }
  }
  
  // Ctrl + N for new window
  if (e.ctrlKey && e.key === 'n') {
    openWindow('about'); // Default to About window
  }
});

// Add to script.js
function initClipboardManager() {
  const clipboard = document.createElement('div');
  clipboard.className = 'clipboard-manager popup-window';
  clipboard.innerHTML = `
    <div class="window-header">
      <span>CLIPBOARD.MANAGER</span>
      <button class="minimize">_</button>
      <button class="maximize">▭</button>
      <button class="close">X</button>
    </div>
    <div class="window-content">
      <textarea id="clipboard-content" placeholder="Clipboard history..."></textarea>
    </div>
  `;
  
  document.body.appendChild(clipboard);
  
  // Listen for copy/paste
  document.addEventListener('copy', (e) => {
    const text = e.clipboardData.getData('text');
    
    
