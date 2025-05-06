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

// 2) WINDOW MANAGEMENT
let currentZIndex = 10;
const windowStates = {};
const windowAnimations = new WindowAnimations();
const windowSnapping = new WindowSnapping();

function getNextZIndex() {
  return ++currentZIndex;
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Hide start menu & deactivate other windows
  document.getElementById("start-menu").style.display = "none";
  document.querySelectorAll(".popup-window").forEach(w => w.classList.remove("active"));

  // Lazy-load Snake iframe
  if (id === "snake") {
    const iframe = win.querySelector("iframe[data-src]");
    if (iframe && !iframe.src) iframe.src = iframe.dataset.src;
  }

  // Lazy-load any <video data-src> in this window
  win.querySelectorAll("video[data-src]").forEach(v => {
    if (!v.src) {
      v.src = v.dataset.src;
      v.load();
      v.play().catch(() => { /* autoplay may require a gesture */ });
    }
  });

  // Show & focus
  win.classList.remove("hidden");
  win.classList.add("active");
  win.style.display = "flex";
  win.style.zIndex = getNextZIndex();

  // Add window to animation system
  windowAnimations.addWindow(win);

  // Restore previous bounds
  const stored = windowStates[id];
  if (stored) Object.assign(win.style, stored);

  // Clamp window to viewport
  const rect = win.getBoundingClientRect();
  const margin = 20;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let newW = rect.width,
      newH = rect.height,
      newLeft = rect.left,
      newTop = rect.top;

  if (rect.width > vw - margin * 2) newW = vw - margin * 2;
  if (rect.height > vh - margin * 2) newH = vh - margin * 2;
  if (rect.left < margin) newLeft = margin;
  if (rect.top < margin) newTop = margin;
  if (rect.right > vw - margin) newLeft = vw - margin - newW;
  if (rect.bottom > vh - margin) newTop = vh - margin - newH;

  Object.assign(win.style, {
    width: `${newW}px`,
    height: `${newH}px`,
    left: `${newLeft}px`,
    top: `${newTop}px`
  });

  // Create taskbar icon
  createTaskbarIcon(id);
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
// 4) BOOT SEQUENCE
function runBootSequence() {
  return new Promise(resolve => {
    const bootScreen = document.getElementById("bootScreen");
    const logEl = document.getElementById("boot-log");
    const progress = document.getElementById("progress-bar");
    
    // Add boot messages
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
    const delay = 200; // Adjust delay as needed

    // Add messages with delay
    const typer = setInterval(() => {
      if (idx < msgs.length) {
        logEl.textContent += msgs[idx] + "\n";
        logEl.scrollTop = logEl.scrollHeight;
        progress.style.width = `${((idx + 1) / total) * 100}%`;
        idx++;
      } else {
        clearInterval(typer);
        
        // Add a small delay before hiding
        setTimeout(() => {
          bootScreen.style.transition = "opacity 0.8s";
          bootScreen.style.opacity = "0";
          
          // Wait for transition
          setTimeout(() => {
            bootScreen.style.display = "none";
            resolve();
          }, 800);
        }, 1000); // Add a small delay before hiding
      }
    }, delay);
  });
}

// 5) DESKTOP ICONS
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    // Double-click to open
    icon.addEventListener("dblclick", () => openWindow(icon.dataset.window));

    // Drag-group start
    icon.addEventListener("mousedown", e => {
      e.preventDefault();
      const parentRect = icon.parentElement.getBoundingClientRect();
      const clickRect = icon.getBoundingClientRect();

      // Build your drag-group: if this icon was already selected, drag ALL selected;
      // otherwise clear selection & only drag this one.
      let group;
      if (icon.classList.contains("selected")) {
        group = Array.from(document.querySelectorAll(".desktop-icon.selected"));
      } else {
        document.querySelectorAll(".desktop-icon.selected")
          .forEach(ic => ic.classList.remove("selected"));
        icon.classList.add("selected");
        group = [icon];
        // 6) MUSIC PLAYER
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
        <source src="[https://your-music-file.mp3](https://your-music-file.mp3)" type="audio/mpeg">
      </audio>
      <div id="music-tracks">
        <div class="track" data-src="[https://your-music-file.mp3](https://your-music-file.mp3)">Track 1</div>
        <div class="track" data-src="[https://your-music-file.mp3](https://your-music-file.mp3)">Track 2</div>
        <div class="track" data-src="[https://your-music-file.mp3](https://your-music-file.mp3)">Track 3</div>
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

// 7) WEATHER WIDGET
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

// 8) SCREENSAVER
let screensaverTimeout;
let isScreensaverActive = false;

function startScreensaver() {
  if (isScreensaverActive) return;
  
  const screensaver = document.createElement('div');
  screensaver.className = 'screensaver active';
  screensaver.innerHTML = `
    <div class="screensaver-content">
      <div class="screensaver-artwork">
        <img src="[https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/whodat.gif"](https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/whodat.gif") alt="Artwork">
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

// 9) CLIPBOARD MANAGER
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
    const content = document.getElementById('clipboard-content');
    if (content) {
      content.value += `\n${new Date().toLocaleString()}: ${text}`;
    }
  });
}

// 10) FILE EXPLORER
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

// 11) TERMINAL
function initTerminal() {
  const terminal = document.createElement('div');
  terminal.className = 'terminal popup-window';
  terminal.innerHTML = `
    <div class="window-header">
      <span>TERMINAL.EXE</span>
      <button class="minimize">_</button>
      <button class="maximize">▭</button>
      <button class="close">X</button>
    </div>
    <div class="window-content">
      <div class="terminal-output" id="terminal-output"></div>
      <div class="terminal-prompt">
        <span class="user">benjamin@cyberdeck</span>
        <span class="path">~</span>
        <span class="prompt">$</span>
        <input type="text" id="terminal-input" autocomplete="off">
      </div>
    </div>
  `;
  
  document.body.appendChild(terminal);
  
  const commands = {
    'help': 'Available commands: help, about, projects, contact, exit',
    'about': 'Benjamin Filler - Media Creator & Narrative Designer',
    'projects': 'View projects in PROJECTS.EXE',
    'contact': 'Contact info in CONTACT.EXE',
    'exit': 'Closing terminal...'
  };
  
  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');
  
  input.addEventListener('keypress', (e) => {
    // 12) WINDOW CONTROLS
function initWindowControls() {
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
        windowSnapping.snapWindow(win);
      }
    });
    document.addEventListener("mouseup", () => { isDragging = false; });
  });
}

// 13) SELECTION BOX
function initSelectionBox() {
  let selStartX, selStartY, selDiv;

  function onSelectStart(e) {
    if (e.target.closest(".desktop-icon, .popup-window, #start-bar, #start-menu")) {
      return;
    }
    selStartX = e.clientX;
    selStartY = e.clientY;
    selDiv = document.createElement("div");
    selDiv.id = "selection-rect";
    selDiv.style.left = `${selStartX}px`;
    selDiv.style.top = `${selStartY}px`;
    selDiv.style.width = "0px";
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
    selDiv.style.left = `${x}px`;
    selDiv.style.top = `${y}px`;
    selDiv.style.width = `${w}px`;
    selDiv.style.height = `${h}px`;

    const box = selDiv.getBoundingClientRect();
    document.querySelectorAll(".desktop-icon").forEach(icon => {
      const r = icon.getBoundingClientRect();
      const inside = (
        r.left >= box.left &&
        r.right <= box.right &&
        r.top >= box.top &&
        r.bottom <= box.bottom
      );
      icon.classList.toggle("selected", inside);
    });
  }

  function onSelectEnd() {
    if (selDiv) selDiv.remove();
    selDiv = null;
  }

  document.addEventListener("mousedown", onSelectStart);
}

// 14) WINDOW STACK
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

// 15) DRAG AND DROP
function initDragAndDrop() {
  const draggables = document.querySelectorAll('.draggable');
  
  draggables.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.id);
      item.classList.add('dragging');
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
  });
  
  const dropzones = document.querySelectorAll('.dropzone');
  
  dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('hover');
    });
    
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('hover');
    });
    
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('hover');
      const id = e.dataTransfer.getData('text/plain');
      const draggable = document.getElementById(id);
      if (draggable) {
        zone.appendChild(draggable);
        createNotification('File moved successfully', 'info');
      }
    });
  });
}

// 16) STARFIELD BACKGROUND
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
      const k = 128.0 / s.z;
      const px = (s.x - canvas.width/2) * k + canvas.width/2;
      const py = (s.y - canvas.height/2) * k + canvas.height/2;
      const sz = Math.max(0, (1 - s.z / canvas.width) * 3);

      ctx.globalAlpha = s.o;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(px, py, sz, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(animate);
  })();
}

// 17) GALLERY INITIALIZATION
const natureImages = [
  '[https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Galloway%20Geese%20at%20Sunset.png',](https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Galloway%20Geese%20at%20Sunset.png',)
  '[https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/A%20Sedge%20of%20Sandhill%20on%20the%20Green.png',](https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/A%20Sedge%20of%20Sandhill%20on%20the%20Green.png',)
  '[https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/GoldenHourGeese.png',](https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/GoldenHourGeese.png',)
  '[https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/bombilate%20vicissitude.png',](https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/bombilate%20vicissitude.png',)
  '[https://cdn.glitch.me/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/SB1012.png',](https://cdn.glitch.me/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/SB1012.png',)
  '[https://cdn.glitch.me/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Calm%20Reeds.png',](https://cdn.glitch.me/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Calm%20Reeds.png',)
                                                                                   // 17) GALLERY INITIALIZATION (continued)
const natureImages = [
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/LeafTrail.png',
  'https://cdn.glitch.me/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/HawkTrail.png',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/TrailMix108.png',
  'https://cdn.glitch.me/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/ToadInTheHole.png'
];

const artworkImages = [
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/whodat.gif',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/octavia.jpg',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/MilesSwings2025.jpg',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Leetridoid.jpg',
  'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/decay%20psych.png'
];

function initNatureGallery() {
  let index = 0;
  const img = document.getElementById('nature-img');
  
  function showImage(i) {
    index = (i + natureImages.length) % natureImages.length;
    img.src = natureImages[index];
  }
  
  document.getElementById('prevNature').addEventListener('click', () => showImage(index - 1));
  document.getElementById('nextNature').addEventListener('click', () => showImage(index + 1));
}

function initArtworkGallery() {
  let index = 0;
  const img = document.getElementById('artwork-img');
  
  function showImage(i) {
    index = (i + artworkImages.length) % artworkImages.length;
    img.src = artworkImages[index];
  }
  
  document.querySelector('#artwork .gallery-controls button:first-child')
    .addEventListener('click', () => showImage(index - 1));
  document.querySelector('#artwork .gallery-controls button:last-child')
    .addEventListener('click', () => showImage(index + 1));
}

// 18) SYSTEM NOTIFICATIONS
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

// 19) KEYBOARD SHORTCUTS
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
  
  // Ctrl + N to open new window
  if (e.ctrlKey && e.key === 'n') {
    openWindow('about'); // Default to About window
  }
  
  // Ctrl + Shift + T to open terminal
  if (e.ctrlKey && e.shiftKey && e.key === 't') {
    openWindow('terminal');
  }
  
  // Ctrl + Shift + E to open explorer
  if (e.ctrlKey && e.shiftKey && e.key === 'e') {
    openWindow('explorer');
  }
  
  // Ctrl + Shift + M to open music player
  if (e.ctrlKey && e.shiftKey && e.key === 'm') {
    openWindow('music');
  }
  
  // Ctrl + Shift + C to open clipboard manager
  if (e.ctrlKey && e.shiftKey && e.key === 'c') {
    openWindow('clipboard');
  }
});

// 20) FINAL INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  // Run boot sequence first
  runBootSequence().then(() => {
    // Initialize everything else after boot
    initDesktopIcons();
    initStarfield();
    initNatureGallery();
    initArtworkGallery();
    initMusicPlayer();
    initWeatherWidget();
    initScreensaver();
    initClipboardManager();
    initFileExplorer();
    initTerminal();
    initWindowControls();
    initSelectionBox();
    initWindowStack();
    initDragAndDrop();
    
    // Add notification after boot
    createNotification('Cyber Deck Initialized', 'info');
  });
});

// 21) CLEANUP AND STATE MANAGEMENT
window.addEventListener('beforeunload', () => {
  // Save window positions
  const windows = document.querySelectorAll('.popup-window');
  windows.forEach(win => {
    const id = win.id;
    const bounds = {
      top: win.style.top,
      left: win.style.left,
      width: win.style.width,
      height: win.style.height
    };
    windowStates[id] = bounds;
  });
  
  // Save clipboard content
  const clipboard = document.getElementById('clipboard-content');
  if (clipboard) {
    localStorage.setItem('clipboardContent', clipboard.value);
  }
});

window.addEventListener('load', () => {
  // Restore window positions
  Object.entries(windowStates).forEach(([id, bounds]) => {
    const win = document.getElementById(id);
    if (win) {
      Object.assign(win.style, bounds);
    }
  });
  
  // Restore clipboard content
  const savedClipboard = localStorage.getItem('clipboardContent');
  if (savedClipboard) {
    const clipboard = document.getElementById('clipboard-content');
    if (clipboard) {
      clipboard.value = savedClipboard;
    }
  }
});