// script.js

// Play blip sound
function playBlip() {
  const blip = document.getElementById("blip");
  if (blip) {
    blip.currentTime = 0;
    blip.play();
  }
}

// Open window
function openWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    win.classList.remove("hidden");
    win.style.zIndex = getNextZIndex();
    win.style.display = "block";
    // Restore previous position and size if stored
    const stored = windowStates[id];
    if (stored) {
      win.style.top = stored.top;
      win.style.left = stored.left;
      win.style.width = stored.width;
      win.style.height = stored.height;
    }
  }
}

// ─── TASKBAR ICONS ───
// Helper: add a button to the taskbar when minimizing
function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return;
  const btn = document.createElement('button');
  btn.id = `taskbar-icon-${id}`;
  btn.className = 'taskbar-icon';
  btn.textContent = id.toUpperCase();
  btn.addEventListener('click', () => {
    const win = document.getElementById(id);
    win.classList.remove('hidden');
    win.style.display = 'block';
    win.style.zIndex = getNextZIndex();
    btn.remove();
  });
  document.getElementById('taskbar-icons').appendChild(btn);
}

// Minimize window & add taskbar icon
function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add('hidden');
  win.style.display = 'none';
  createTaskbarIcon(id);
}

// Close window & remove any taskbar icon
function closeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    win.classList.add('hidden');
    win.style.display = 'none';
  }
  const icon = document.getElementById(`taskbar-icon-${id}`);
  if (icon) icon.remove();
}

// Maximize / restore & clean up icon if needed
function toggleMaximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  if (!win.classList.contains('maximized')) {
    windowStates[id] = {
      top: win.style.top,
      left: win.style.left,
      width: win.style.width,
      height: win.style.height
    };
    win.classList.add('maximized');
    win.style.top = '0';
    win.style.left = '0';
    win.style.width = '100%';
    win.style.height = '100%';
    const icon = document.getElementById(`taskbar-icon-${id}`);
    if (icon) icon.remove();
  } else {
    const stored = windowStates[id];
    if (stored) {
      win.style.top = stored.top;
      win.style.left = stored.left;
      win.style.width = stored.width;
      win.style.height = stored.height;
    }
    win.classList.remove('maximized');
  }
}

// Z-index helper
let currentZIndex = 10;
function getNextZIndex() {
  return ++currentZIndex;
}

// Store window positions/sizes
const windowStates = {};

// Update clock every second
function updateClock() {
  const clock = document.getElementById("clock");
  if (clock) clock.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Start menu toggle
const startButton = document.getElementById("start-button");
const startMenu   = document.getElementById("start-menu");
startButton.addEventListener("click", () => {
  startMenu.style.display = startMenu.style.display === "flex" ? "none" : "flex";
});

window.addEventListener('load', () => {
  const bootScreen = document.getElementById('bootScreen');
  const logEl      = document.getElementById('boot-log');
  const progress   = document.getElementById('progress-bar');

  // Lines to “type” in the console
  const messages = [
    '[ OK ] Initializing hardware...',
    '[ OK ] Loading kernel modules...',
    '[ OK ] Mounting filesystems...',
    '[ OK ] Starting system services...',
    '[ OK ] CyberDeck ready.',
    '[ DONE ] Boot complete.'
  ];

  let idx = 0;
  const total = messages.length;
  const interval = 400; // ms between lines

  const typer = setInterval(() => {
    // append next line
    logEl.textContent += messages[idx] + '\n';

    // scroll if overflow
    logEl.scrollTop = logEl.scrollHeight;

    // advance progress proportionally
    const pct = ((idx + 1) / total) * 100;
    progress.style.width = pct + '%';

    idx++;
    if (idx === total) {
      clearInterval(typer);
      // small pause, then fade out
      setTimeout(() => {
        bootScreen.style.transition = 'opacity 0.8s';
        bootScreen.style.opacity = '0';
        setTimeout(() => { bootScreen.style.display = 'none'; }, 800);
      }, 500);
    }
  }, interval);
});


// Project splash functions
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

// WINDOW HEADER DRAG & BUTTONS
document.querySelectorAll(".popup-window").forEach(win => {
  const id          = win.id;
  const header      = win.querySelector(".window-header");
  const btnMinimize = header.querySelector(".minimize");
  const btnMaximize = header.querySelector(".maximize");
  const btnClose    = header.querySelector(".close");

  if (btnMinimize) btnMinimize.addEventListener("click", () => minimizeWindow(id));
  if (btnMaximize) btnMaximize.addEventListener("click", () => toggleMaximizeWindow(id));
  if (btnClose)    btnClose.addEventListener   ("click", () => closeWindow(id));

  // dragging logic
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

// TYPEWRITER (if used)
document.querySelectorAll('.typewriter').forEach(el => {
  const text = el.getAttribute('data-text');
  el.textContent = '';
  let i = 0;
  (function type() {
    if (i < text.length) {
      el.textContent += text.charAt(i++);
      setTimeout(type, 30);
    }
  })();
});

// ─── DESKTOP ICON INIT ───
function initDesktopIcons() {
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    // double-click to open
    icon.addEventListener('dblclick', () => {
      openWindow(icon.dataset.window);
      playBlip();
    });

    // smooth drag: lock in current position, then follow cursor
    icon.addEventListener('mousedown', e => {
  e.preventDefault();

  // 1) Get icon and its parent container rects (viewport coords)
  const rect       = icon.getBoundingClientRect();
  const parentRect = icon.parentElement.getBoundingClientRect();

  // 2) Lock in inline styles **relative to the parent**
  icon.style.left = (rect.left - parentRect.left) + 'px';
  icon.style.top  = (rect.top  - parentRect.top)  + 'px';

  // 3) Compute cursor offset within the icon
  const shiftX = e.clientX - rect.left;
  const shiftY = e.clientY - rect.top;
  icon.style.zIndex = getNextZIndex();

  // 4) On mousemove, position relative to parent
  function onMouseMove(e) {
    icon.style.left = (e.clientX - shiftX - parentRect.left) + 'px';
    icon.style.top  = (e.clientY - shiftY - parentRect.top)  + 'px';
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', function onUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onUp);
  }, { once: true });
});


    // prevent default image-drag ghost
    icon.ondragstart = () => false;
  });
}
window.addEventListener('load', initDesktopIcons);

// ─── STARFIELD BACKGROUND ───
function initStarfield() {
  const canvas = document.getElementById('background-canvas');
  const ctx    = canvas.getContext('2d');

  // Resize canvas to fill viewport
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Create stars
  const numStars = 300;
  const stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      z:     Math.random() * canvas.width,   // depth for speed variation
      o:     Math.random()                   // initial opacity
    });
  }

  // Animate
  function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';  // slight trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let star of stars) {
      // move star toward viewer
      star.z -= 2;
      if (star.z <= 0) {
        star.z = canvas.width;
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
      }

      // project 3D into 2D
      const k = 128.0 / star.z;
      const px = (star.x - canvas.width  / 2) * k + canvas.width  / 2;
      const py = (star.y - canvas.height / 2) * k + canvas.height / 2;
      const size = Math.max(0, (1 - star.z / canvas.width) * 3);

      // draw
      ctx.beginPath();
      ctx.globalAlpha = star.o;
      ctx.fillStyle   = '#fff';
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

// Kick it off after everything else initializes
window.addEventListener('load', initStarfield);

// ─── CLICK-AND-DRAG MULTI-SELECT ───

let selStartX, selStartY, selDiv;

function onSelectStart(e) {
  // don’t start if clicking on an icon, window, or taskbar
  if (e.target.closest('.desktop-icon, .popup-window, #start-bar, #start-menu')) return;

  selStartX = e.clientX;
  selStartY = e.clientY;

  // make the selection DIV
  selDiv = document.createElement('div');
  selDiv.id = 'selection-rect';
  selDiv.style.left   = `${selStartX}px`;
  selDiv.style.top    = `${selStartY}px`;
  selDiv.style.width  = '0px';
  selDiv.style.height = '0px';
  document.body.appendChild(selDiv);

  document.addEventListener('mousemove', onSelectMove);
  document.addEventListener('mouseup', onSelectEnd, { once: true });
  e.preventDefault();
}

function onSelectMove(e) {
  const currentX = e.clientX;
  const currentY = e.clientY;

  // calculate box coords & size
  const x = Math.min(currentX, selStartX);
  const y = Math.min(currentY, selStartY);
  const w = Math.abs(currentX - selStartX);
  const h = Math.abs(currentY - selStartY);

  selDiv.style.left   = `${x}px`;
  selDiv.style.top    = `${y}px`;
  selDiv.style.width  = `${w}px`;
  selDiv.style.height = `${h}px`;

  // highlight icons completely inside the box
  const box = selDiv.getBoundingClientRect();
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    const r = icon.getBoundingClientRect();
    const inside =
      r.left   >= box.left &&
      r.right  <= box.right &&
      r.top    >= box.top &&
      r.bottom <= box.bottom;
    icon.classList.toggle('selected', inside);
  });
}

function onSelectEnd() {
  if (selDiv) selDiv.remove();
  selDiv = null;
  document.removeEventListener('mousemove', onSelectMove);
}

// hook it up
window.addEventListener('mousedown', onSelectStart);
