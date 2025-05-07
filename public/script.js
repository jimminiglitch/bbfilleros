// public/script.js — comprehensive desktop script with all original features, video handling, nature gallery, art windows, and toader logic

// 1) BLIP sound effect
function playBlip() {
  const blip = document.getElementById("blip");
  if (blip) {
    blip.currentTime = 0;
    blip.play();
  }
}

// 2) Window management and z-indexing
let currentZIndex = 10;
const windowStates = {};
function getNextZIndex() {
  return ++currentZIndex;
}

// Open/focus window
function openWindow(id) {
  playBlip();
  const win = document.getElementById(id);
  if (!win) return;

  // Hide start menu and deactivate others
  document.getElementById('start-menu').style.display = 'none';
  document.querySelectorAll('.popup-window').forEach(w => w.classList.remove('active'));

  // Lazy-load iframes
  win.querySelectorAll('iframe[data-src]').forEach(iframe => {
    if (!iframe.src) iframe.src = iframe.dataset.src;
  });

  // Lazy-load videos (data-src)
  win.querySelectorAll('video[data-src]').forEach(video => {
    if (!video.src) {
      video.src = video.dataset.src;
      video.load();
    }
  });

  // Autoplay all <video> elements now in view
  win.querySelectorAll('video').forEach(video => {
    video.play().catch(() => {});
  });

  // Play hover audio for Toader
  if (id === 'toader') {
    const audio = document.getElementById('toader-audio');
    if (audio && audio.paused) {
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }
  }

  // Show & focus
  win.classList.remove('hidden');
  win.classList.add('active');
  win.style.display = 'flex';
  win.style.zIndex = getNextZIndex();

  // Restore saved bounds
  const stored = windowStates[id];
  if (stored) Object.assign(win.style, stored);

  // Clamp to viewport
  const rect = win.getBoundingClientRect();
  const margin = 20;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let w = rect.width, h = rect.height, left = rect.left, top = rect.top;
  if (w > vw - 2 * margin) w = vw - 2 * margin;
  if (h > vh - 2 * margin) h = vh - 2 * margin;
  if (left < margin) left = margin;
  if (top < margin) top = margin;
  if (rect.right > vw - margin) left = vw - margin - w;
  if (rect.bottom > vh - margin) top = vh - margin - h;
  Object.assign(win.style, { width: `${w}px`, height: `${h}px`, left: `${left}px`, top: `${top}px` });
}

// Close window
function closeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add('hidden');
  win.style.display = 'none';

  // Remove taskbar icon
  const tb = document.getElementById(`taskbar-icon-${id}`);
  if (tb) tb.remove();

  // Pause Toader audio
  if (id === 'toader') {
    const audio = document.getElementById('toader-audio');
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  // Pause any videos
  win.querySelectorAll('video').forEach(v => {
    v.pause();
    v.currentTime = 0;
  });
}

// Minimize window (move to taskbar)
function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add('hidden');
  win.style.display = 'none';
  createTaskbarIcon(id);
}

// Toggle maximize/restore
function toggleMaximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  if (!win.classList.contains('maximized')) {
    // Save bounds
    windowStates[id] = { top: win.style.top, left: win.style.left, width: win.style.width, height: win.style.height };
    win.classList.add('maximized');
    Object.assign(win.style, { top: '0', left: '0', width: '100%', height: '100%' });
    const tb = document.getElementById(`taskbar-icon-${id}`);
    if (tb) tb.remove();
  } else {
    // Restore
    const s = windowStates[id];
    if (s) Object.assign(win.style, s);
    win.classList.remove('maximized');
  }
}

// Create taskbar icon
function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return;
  const btn = document.createElement('button');
  btn.id = `taskbar-icon-${id}`;
  btn.className = 'taskbar-icon';
  btn.textContent = id.toUpperCase();
  btn.addEventListener('click', () => { openWindow(id); btn.remove(); });
  document.getElementById('taskbar-icons').appendChild(btn);
}

// 3) Clock & Start menu toggle
function updateClock() {
  const clk = document.getElementById('clock');
  if (clk) clk.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000); updateClock();

document.getElementById('start-button').addEventListener('click', () => {
  const m = document.getElementById('start-menu');
  m.style.display = (m.style.display === 'flex' ? 'none' : 'flex');
});

// 4) Boot sequence
function runBootSequence() {
  return new Promise(resolve => {
    const bs = document.getElementById('bootScreen');
    const log = document.getElementById('boot-log');
    const prog = document.getElementById('progress-bar');
    const msgs = [
      '[ OK ] Initializing hardware...',
      '[ OK ] Loading modules...',
      '[ OK ] Mounting filesystems...',
      '[ OK ] Starting system services...',
      '[ OK ] CyberDeck ready.',
      '[ DONE ] Boot complete.'
    ];
    let i = 0;
    const iv = setInterval(() => {
      log.textContent += msgs[i] + '\n';
      log.scrollTop = log.scrollHeight;
      prog.style.width = `${((i+1)/msgs.length)*100}%`;
      i++;
      if (i === msgs.length) {
        clearInterval(iv);
        setTimeout(() => { bs.style.opacity = '0'; setTimeout(() => { bs.style.display = 'none'; resolve(); }, 800); }, 500);
      }
    }, 400);
  });
}

// 5) Desktop icons init & drag-group select
function initDesktopIcons() {
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    // single-click open
    icon.addEventListener('click', () => openWindow(icon.dataset.window));
    icon.ondragstart = () => false;

    // drag to move group select
    icon.addEventListener('mousedown', e => {
      playBlip(); e.preventDefault();
      const parentRect = icon.parentElement.getBoundingClientRect();
      const clickRect = icon.getBoundingClientRect();
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
      const data = group.map(ic => {
        const r = ic.getBoundingClientRect();
        const sl = r.left - parentRect.left;
        const st = r.top - parentRect.top;
        ic.style.left = `${sl}px`;
        ic.style.top = `${st}px`;
        ic.style.zIndex = getNextZIndex();
        return { ic, sl, st };
      });
      function onMove(ev) {
        const dx = (ev.clientX - shiftX - parentRect.left) - data[0].sl;
        const dy = (ev.clientY - shiftY - parentRect.top) - data[0].st;
        data.forEach(({ ic, sl, st }) => {
          ic.style.left = `${sl + dx}px`;
          ic.style.top = `${st + dy}px`;
        });
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', () => document.removeEventListener('mousemove', onMove), { once: true });
    });
  });
}
let selStartX, selStartY, selDiv;
function onSelectStart(e) {
  if (e.target.closest('.desktop-icon, .popup-window, #start-bar, #start-menu')) return;
  selStartX = e.clientX; selStartY = e.clientY;
  selDiv = document.createElement('div'); selDiv.id = 'selection-rect';
  document.body.appendChild(selDiv);
  document.addEventListener('mousemove', onSelectMove);
  document.addEventListener('mouseup', onSelectEnd, { once: true });
  e.preventDefault();
}
function onSelectMove(e) {
  if (!selDiv) return;
  const x = Math.min(e.clientX, selStartX);
  const y = Math.min(e.clientY, selStartY);
  const w = Math.abs(e.clientX - selStartX);
  const h = Math.abs(e.clientY - selStartY);
  Object.assign(selDiv.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  const box = selDiv.getBoundingClientRect();
  document.querySelectorAll('.desktop-icon').forEach(ic => {
    const r = ic.getBoundingClientRect();
    const inside = r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom;
    ic.classList.toggle('selected', inside);
  });
}
function onSelectEnd() { if (selDiv) selDiv.remove(); selDiv = null; }

// 6) Starfield background
function initStarfield() {
  const canvas = document.getElementById('background-canvas');
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();
  const stars = Array.from({ length: 300 }, () => ({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, z: Math.random()*canvas.width, o: Math.random() }));
  (function animate() {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    stars.forEach(s => {
      s.z -= 2;
      if (s.z <= 0) { s.z = canvas.width; s.x = Math.random()*canvas.width; s.y = Math.random()*canvas.height; s.o = Math.random(); }
      const k = 128.0 / s.z;
      const px = (s.x - canvas.width/2)*k + canvas.width/2;
      const py = (s.y - canvas.height/2)*k + canvas.height/2;
      const sz = Math.max(0, (1 - s.z/canvas.width)*3);
      ctx.globalAlpha = s.o;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px,py,sz,0,2*Math.PI); ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  })();
}

// 7) Nature gallery
const natureImages = ['URL1','URL2','URL3','URL4','URL5','URL6','URL7','URL8','URL9','URL10'];
let natureIndex = 0;
function showNature(idx) {
  const img = document.getElementById('nature-img');
  img.style.transition = 'opacity 0.5s';
  img.style.opacity = 0;
  setTimeout(() => { img.src = natureImages[idx]; img.style.opacity = 1; }, 500);
}
document.getElementById('prevNature')?.addEventListener('click', () => {
  natureIndex = (natureIndex - 1 + natureImages.length) % natureImages.length;
  showNature(natureIndex);
});
document.getElementById('nextNature')?.addEventListener('click', () => {
  natureIndex = (natureIndex + 1) % natureImages.length;
  showNature(natureIndex);
});

// 8) Window header controls
function initWindowControls() {
  document.querySelectorAll('.popup-window').forEach(win => {
    const id = win.id;
    const header = win.querySelector('.window-header');
    const btnMin = header.querySelector('.minimize');
    const btnMax = header.querySelector('.maximize');
    const btnCls = header.querySelector('.close');
    if (btnMin) btnMin.addEventListener('click', () => minimizeWindow(id));
    if (btnMax) btnMax.addEventListener('click', () => toggleMaximizeWindow(id));
    if (btnCls) btnCls.addEventListener('click', () => closeWindow(id));
    let dragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener('mousedown', e => {
      dragging = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      win.style.zIndex = getNextZIndex();
    });
    document.addEventListener('mousemove', e => {
      if (dragging) {
        win.style.left = `${e.clientX - offsetX}px`;
        win.style.top = `${e.clientY - offsetY}px`;
      }
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  });
}

// Initialization
window.addEventListener('DOMContentLoaded', () => {
  runBootSequence().then(() => {
    initDesktopIcons();
    initStarfield();
    showNature(natureIndex);
  });
});
window.addEventListener('load', initWindowControls);
window.addEventListener('mousedown', onSelectStart);
