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
  if (!win) return;

  // Hide start menu & deactivate others
  document.getElementById('start-menu').style.display = 'none';
  document.querySelectorAll('.popup-window').forEach(w => w.classList.remove('active'));

  // Show & focus this window
  win.classList.remove('hidden');
  win.classList.add('active');
  win.style.display = 'block';
  win.style.zIndex = getNextZIndex();

  // Restore stored position/size
  const stored = windowStates[id];
  if (stored) {
    Object.assign(win.style, stored);
  }

  // Clamp to viewport
  const rect = win.getBoundingClientRect();
  const margin = 20;
  const vw = window.innerWidth, vh = window.innerHeight;
  let newLeft = rect.left, newTop = rect.top, newW = rect.width, newH = rect.height;
  if (rect.width > vw - margin*2) newW = vw - margin*2;
  if (rect.height > vh - margin*2) newH = vh - margin*2;
  if (rect.left < margin) newLeft = margin;
  if (rect.top < margin) newTop = margin;
  if (rect.right > vw - margin) newLeft = vw - margin - newW;
  if (rect.bottom > vh - margin) newTop = vh - margin - newH;
  win.style.left = `${newLeft}px`;
  win.style.top = `${newTop}px`;
  win.style.width = `${newW}px`;
  win.style.height = `${newH}px`;
}

// Ambient synth fade-in
window.addEventListener('load', () => {
  const amb = document.getElementById("ambience");
  if (amb) {
    amb.volume = 0;
    let v = 0;
    const step = () => {
      if (v < 0.1) {
        v += 0.01;
        amb.volume = v;
        requestAnimationFrame(step);
      }
    };
    step();
  }
});

// Simulate loading splash for projects
function launchProject(element, name) {
  const splash = document.getElementById("project-splash");
  const splashName = document.getElementById("splash-name");
  if (splash && splashName) {
    splashName.textContent = name;
    splash.classList.remove("hidden");
    setTimeout(closeSplash, 3000);
  }
}
function closeSplash() {
  const splash = document.getElementById("project-splash");
  if (splash) splash.classList.add("hidden");
}

// Minimize window & add to taskbar
function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add('hidden');
  win.style.display = 'none';
  createTaskbarIcon(id);
}

// Close window with shutdown animation
function closeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  const blackout = document.createElement('div');
  blackout.style.position = 'fixed';
  blackout.style.inset = 0;
  blackout.style.background = 'black';
  blackout.style.zIndex = 9999;
  blackout.style.display = 'flex';
  blackout.style.alignItems = 'center';
  blackout.style.justifyContent = 'center';
  blackout.innerHTML = '<img src="/static-shutdown.gif" style="width: 120px; image-rendering: pixelated;" />';
  document.body.appendChild(blackout);

  setTimeout(() => {
    win.classList.add('hidden');
    win.style.display = 'none';
    const icon = document.getElementById(`taskbar-icon-${id}`);
    if (icon) icon.remove();
    blackout.remove();
  }, 1200);
}

// Maximize / restore
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
    if (stored) Object.assign(win.style, stored);
    win.classList.remove('maximized');
  }
}

// Z-index helper
let currentZIndex = 10;
function getNextZIndex() {
  return ++currentZIndex;
}

// Store window states
const windowStates = {};

// Clock
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

// Boot screen typing effect
window.addEventListener('load', () => {
  const bootScreen = document.getElementById('bootScreen');
  const logEl      = document.getElementById('boot-log');
  const progress   = document.getElementById('progress-bar');
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
  const typer = setInterval(() => {
    logEl.textContent += messages[idx] + '\n';
    logEl.scrollTop = logEl.scrollHeight;
    const pct = ((idx + 1) / total) * 100;
    progress.style.width = pct + '%';
    idx++;
    if (idx === total) {
      clearInterval(typer);
      setTimeout(() => {
        bootScreen.style.transition = 'opacity 0.8s';
        bootScreen.style.opacity = '0';
        setTimeout(() => { bootScreen.style.display = 'none'; }, 800);
      }, 500);
    }
  }, 400);
});

// Taskbar icon creation
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

// Window header drag & buttons
document.querySelectorAll(".popup-window").forEach(win => {
  const id = win.id;
  const header      = win.querySelector(".window-header");
  const btnMinimize = header.querySelector(".minimize");
  const btnMaximize = header.querySelector(".maximize");
  const btnClose    = header.querySelector(".close");
  if (btnMinimize) btnMinimize.addEventListener("click", () => minimizeWindow(id));
  if (btnMaximize) btnMaximize.addEventListener("click", () => toggleMaximizeWindow(id));
  if (btnClose)    btnClose.addEventListener("click", () => closeWindow(id));

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

// Typewriter effect
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

// Desktop icons init with snap-to-grid
function initDesktopIcons() {
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    icon.addEventListener('dblclick', () => {
      openWindow(icon.dataset.window);
      playBlip();
    });
    icon.addEventListener('mousedown', e => {
      e.preventDefault();
      const parentRect = icon.parentElement.getBoundingClientRect();
      const clickRect  = icon.getBoundingClientRect();
      let group;
      if (icon.classList.contains('selected')) {
        group = Array.from(document.querySelectorAll('.desktop-icon.selected'));
      } else {
        document.querySelectorAll('.desktop-icon.selected').forEach(ic => ic.classList.remove('selected'));
        icon.classList.add('selected');
        group = [icon];
      }
      const shiftX = e.clientX - clickRect.left;
      const shiftY = e.clientY - clickRect.top;
      const groupData = group.map(ic => {
        const r = ic.getBoundingClientRect();
        const startLeft = r.left - parentRect.left;
        const startTop  = r.top  - parentRect.top;
        ic.style.left = startLeft + 'px';
        ic.style.top  = startTop + 'px';
        ic.style.zIndex = getNextZIndex();
        return { icon: ic, startLeft, startTop };
      });
      function onMouseMove(e) {
        const newLeft = e.clientX - shiftX - parentRect.left;
        const newTop  = e.clientY - shiftY - parentRect.top;
        const dx = newLeft - groupData[0].startLeft;
        const dy = newTop - groupData[0].startTop;
        groupData.forEach(({ icon, startLeft, startTop }) => {
          icon.style.left = startLeft + dx + 'px';
          icon.style.top  = startTop + dy + 'px';
        });
      }
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', function onUp() {
        document.removeEventListener('mousemove', onMouseMove);
        // Snap to 100×100 grid
        const grid = 100;
        groupData.forEach(({ icon }) => {
          const r = icon.getBoundingClientRect();
          const left = Math.round((r.left - parentRect.left) / grid) * grid;
          const top  = Math.round((r.top  - parentRect.top ) / grid) * grid;
          icon.style.left = `${left}px`;
          icon.style.top  = `${top}px`;
        });
        document.removeEventListener('mouseup', onUp);
      }, { once: true });
      icon.ondragstart = () => false;
    });
  });
}
window.addEventListener('load', initDesktopIcons);

// Starfield background
function initStarfield() {
  const canvas = document.getElementById('background-canvas');
  const ctx    = canvas.getContext('2d');
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();
  const numStars = 300;
  const stars = Array.from({ length: numStars }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * canvas.width,
    o: Math.random()
  }));
  function animate() {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let star of stars) {
      star.z -= 2;
      if (star.z <= 0) {
        star.z = canvas.width;
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
      }
      const k = 128.0 / star.z;
      const px = (star.x - canvas.width/2) * k + canvas.width/2;
      const py = (star.y - canvas.height/2) * k + canvas.height/2;
      const size = Math.max(0, (1 - star.z/canvas.width)*3);
      ctx.beginPath();
      ctx.globalAlpha = star.o;
      ctx.fillStyle   = '#fff';
      ctx.arc(px, py, size, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}
window.addEventListener('load', initStarfield);

// Fake error popup
function triggerFakeError() {
  const popup = document.createElement('div');
  popup.className = 'popup-window';
  popup.style.top = '150px';
  popup.style.left = '150px';
  popup.innerHTML = `
    <div class="window-header">
      <span>GLITCH.MSG</span>
      <button class="close" onclick="this.closest('.popup-window').remove()">X</button>
    </div>
    <div class="window-content">
      <h2>🔥 SYSTEM FAULT</h2>
      <p>Memory leak detected in dreamspace buffer. Reality may degrade shortly.</p>
      <button onclick="this.closest('.popup-window').remove()">Acknowledge</button>
    </div>`;
  document.body.appendChild(popup);
  popup.style.zIndex = getNextZIndex();
}
setTimeout(() => {
  if (Math.random() > 0.5) triggerFakeError();
}, 30000 + Math.random()*15000);
