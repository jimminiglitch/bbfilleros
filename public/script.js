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

// script.js

// 1) helper: add an icon/button to the taskbar when you minimize
function createTaskbarIcon(id) {
  // avoid duplicating
  if (document.getElementById(`taskbar-icon-${id}`)) return;

  const btn = document.createElement('button');
  btn.id = `taskbar-icon-${id}`;
  btn.className = 'taskbar-icon';
  btn.textContent = id.toUpperCase();  // or any label you prefer
  btn.addEventListener('click', () => {
    // restore the window
    const win = document.getElementById(id);
    win.classList.remove('hidden');
    win.style.display = 'block';
    win.style.zIndex = getNextZIndex();

    // remove this icon
    btn.remove();
  });

  document.getElementById('taskbar-icons').appendChild(btn);
}

// 2) minimize: hide window _and_ add a taskbar icon
function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add('hidden');
  win.style.display = 'none';

  createTaskbarIcon(id);
}

// 3) close: hide window _and_ remove its taskbar icon (if any)
function closeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    win.classList.add('hidden');
    win.style.display = 'none';
  }
  const icon = document.getElementById(`taskbar-icon-${id}`);
  if (icon) icon.remove();
}

// 4) maximize/restore: ensure any taskbar icon is removed if window is maximized back
function toggleMaximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  if (!win.classList.contains('maximized')) {
    // store state...
    windowStates[id] = { top: win.style.top, left: win.style.left, width: win.style.width, height: win.style.height };
    win.classList.add('maximized');
    win.style.top = '0';
    win.style.left = '0';
    win.style.width = '100%';
    win.style.height = '100%';
    // if it was minimized & had an icon, remove it
    const icon = document.getElementById(`taskbar-icon-${id}`);
    if (icon) icon.remove();
  } else {
    // restore position/size
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


// Get next z-index
let currentZIndex = 10;
function getNextZIndex() {
  return ++currentZIndex;
}

// Store window states
const windowStates = {};

// Update clock
function updateClock() {
  const clock = document.getElementById("clock");
  if (clock) {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString();
  }
}
setInterval(updateClock, 1000);
updateClock();

// Start menu toggle
const startButton = document.getElementById("start-button");
const startMenu = document.getElementById("start-menu");
startButton.addEventListener("click", () => {
  startMenu.style.display = startMenu.style.display === "flex" ? "none" : "flex";
});

// Boot screen
window.addEventListener("load", () => {
  const bootScreen = document.getElementById("bootScreen");
  if (bootScreen) {
    setTimeout(() => {
      bootScreen.style.display = "none";
    }, 3000);
  }
});

// Project splash
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
  if (splash) {
    splash.classList.add("hidden");
  }
}

// Window header buttons
document.querySelectorAll(".popup-window").forEach((win) => {
  const id = win.id;
  const header = win.querySelector(".window-header");
  const minimizeBtn = header.querySelector(".minimize");
  const maximizeBtn = header.querySelector(".maximize");
  const closeBtn = header.querySelector(".close");

  if (minimizeBtn) {
    minimizeBtn.addEventListener("click", () => minimizeWindow(id));
  }
  if (maximizeBtn) {
    maximizeBtn.addEventListener("click", () => toggleMaximizeWindow(id));
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () => closeWindow(id));
  }

  // Drag functionality
  let isDragging = false;
  let offsetX, offsetY;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    win.style.zIndex = getNextZIndex();
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      win.style.left = `${e.clientX - offsetX}px`;
      win.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
});
document.querySelectorAll('.typewriter').forEach(el => {
  const text = el.getAttribute('data-text');
  el.textContent = '';
  let i = 0;
  const type = () => {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      setTimeout(type, 30);
    }
  };
  type();
});
// initialize desktop icons
function initDesktopIcons() {
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    // double-click to open
    icon.addEventListener('dblclick', () => {
      const winId = icon.dataset.window;
      openWindow(winId);
      playBlip();
    });

    // drag logic
    icon.addEventListener('mousedown', e => {
  // 1) Grab its current screen position
  const rect = icon.getBoundingClientRect();

  // 2) Lock that into inline styles so we have a numeric left/top to work from
  icon.style.left = rect.left + 'px';
  icon.style.top  = rect.top  + 'px';

  // 3) Compute shift relative to cursor
  const shiftX = e.clientX - rect.left;
  const shiftY = e.clientY - rect.top;

  // 4) Bring it to front
  icon.style.zIndex = getNextZIndex();

  // 5) Now track mousemove
  function onMouseMove(e) {
    icon.style.left = e.pageX - shiftX + 'px';
    icon.style.top  = e.pageY - shiftY + 'px';
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', function onUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onUp);
  }, { once: true });

  e.preventDefault();
});

// call it once on load
window.addEventListener('load', initDesktopIcons);
// ─── DESKTOP ICON INIT ───
function initDesktopIcons() {
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    // 1) double-click → open window + blip
    icon.addEventListener('dblclick', () => {
      const winId = icon.dataset.window;
      openWindow(winId);
      playBlip();
    });

    // 2) make draggable
    icon.addEventListener('mousedown', e => {
      const rect = icon.getBoundingClientRect();
      const shiftX = e.clientX - rect.left;
      const shiftY = e.clientY - rect.top;
      icon.style.zIndex = getNextZIndex();

      function onMouseMove(e) {
        icon.style.left = e.pageX - shiftX + 'px';
        icon.style.top  = e.pageY - shiftY + 'px';
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', function onUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onUp);
      }, { once: true });

      e.preventDefault();
    });

    // disable default drag ghost
    icon.ondragstart = () => false;
  });
}

// call on load (after boot screen hides, or immediately if you prefer)
window.addEventListener('load', initDesktopIcons);

