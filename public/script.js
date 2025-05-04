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

    // Restore size/position
    const stored = windowStates[id];
    if (stored) {
      win.style.top = stored.top;
      win.style.left = stored.left;
      win.style.width = stored.width;
      win.style.height = stored.height;
    }

    // Add or activate taskbar button
    addToTaskbar(id);
  }
}

// Close window
function closeWindow(id) {
  const win = document.getElementById(id);
  const btn = document.querySelector(`.taskbar-btn[data-id="${id}"]`);
  if (win) {
    win.classList.add("hidden");
    win.style.display = "none";
  }
  if (btn) btn.remove();
}


// Minimize window
function minimizeWindow(id) {
  const win = document.getElementById(id);
  const btn = document.querySelector(`.taskbar-btn[data-id="${id}"]`);
  if (win && btn) {
    win.classList.add("hidden");
    win.style.display = "none";
    btn.classList.remove("active");
  }
}


// Maximize/Restore window
function toggleMaximizeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    if (!win.classList.contains("maximized")) {
      // Store current position and size
      windowStates[id] = {
        top: win.style.top,
        left: win.style.left,
        width: win.style.width,
        height: win.style.height,
      };
      win.classList.add("maximized");
      win.style.top = "0";
      win.style.left = "0";
      win.style.width = "100%";
      win.style.height = "100%";
    } else {
      // Restore previous position and size
      const stored = windowStates[id];
      if (stored) {
        win.style.top = stored.top;
        win.style.left = stored.left;
        win.style.width = stored.width;
        win.style.height = stored.height;
      }
      win.classList.remove("maximized");
    }
  }
}
function addToTaskbar(id) {
  const taskbar = document.getElementById("taskbar");
  let existing = document.querySelector(`.taskbar-btn[data-id="${id}"]`);

  if (!existing) {
    const btn = document.createElement("button");
    btn.classList.add("taskbar-btn");
    btn.setAttribute("data-id", id);
    btn.innerText = id.toUpperCase();
    btn.addEventListener("click", () => toggleWindow(id));
    taskbar.appendChild(btn);
  } else {
    existing.classList.add("active");
  }
}

function toggleWindow(id) {
  const win = document.getElementById(id);
  const btn = document.querySelector(`.taskbar-btn[data-id="${id}"]`);
  if (win.classList.contains("hidden")) {
    win.classList.remove("hidden");
    win.style.display = "block";
    win.style.zIndex = getNextZIndex();
    btn.classList.add("active");
  } else {
    win.classList.add("hidden");
    win.style.display = "none";
    btn.classList.remove("active");
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
      bootScreen.classList.add("hidden"); // Ensures it doesn't block interaction
    }, 3000); // You can adjust the duration here
  }

  // Also ensure the shutdown overlay is hidden just in case
  const shutdownOverlay = document.getElementById("shutdown-overlay");
  if (shutdownOverlay) {
    shutdownOverlay.classList.add("hidden");
    shutdownOverlay.style.display = "none";
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

const hoverSound = new Audio('/blip.mp3');
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    hoverSound.currentTime = 0;
    hoverSound.play();
  });
});

function openProjectPreview(projectId) {
  const id = `preview-${projectId}`;
  openWindow(id);
}

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
let focusedWindowId = null;

document.querySelectorAll('.popup-window').forEach(win => {
  win.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    focusedWindowId = win.id;

    const menu = document.getElementById('context-menu');
    menu.style.top = `${e.clientY}px`;
    menu.style.left = `${e.clientX}px`;
    menu.classList.remove('hidden');
  });
});

// Hide menu on click elsewhere
document.addEventListener('click', () => {
  document.getElementById('context-menu').classList.add('hidden');
});

// Menu actions
function closeFocusedWindow() {
  if (focusedWindowId) closeWindow(focusedWindowId);
}

function toggleFocusedMaximize() {
  if (focusedWindowId) toggleMaximizeWindow(focusedWindowId);
}

function minimizeFocusedWindow() {
  if (focusedWindowId) minimizeWindow(focusedWindowId);
}
document.querySelectorAll('.popup-window').forEach(win => {
  const resizeHandle = document.createElement('div');
  resizeHandle.classList.add('resize-handle');
  resizeHandle.style.position = 'absolute';
  resizeHandle.style.right = '0';
  resizeHandle.style.bottom = '0';
  resizeHandle.style.width = '15px';
  resizeHandle.style.height = '15px';
  resizeHandle.style.cursor = 'nwse-resize';
  resizeHandle.style.zIndex = '10';
  win.appendChild(resizeHandle);

  let isResizing = false;

  resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    isResizing = true;
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (isResizing) {
      const rect = win.getBoundingClientRect();
      win.style.width = `${e.clientX - rect.left}px`;
      win.style.height = `${e.clientY - rect.top}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.userSelect = 'auto';
  });
});


document.querySelectorAll('.popup-window').forEach(win => {
  win.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    focusedWindowId = win.id;
    const menu = document.getElementById('context-menu');
    menu.style.top = `${e.clientY}px`;
    menu.style.left = `${e.clientX}px`;
    menu.classList.remove('hidden');
  });

  // Add drag-to-resize handles
  const resizeHandle = document.createElement('div');
  resizeHandle.style.position = 'absolute';
  resizeHandle.style.right = '0';
  resizeHandle.style.bottom = '0';
  resizeHandle.style.width = '15px';
  resizeHandle.style.height = '15px';
  resizeHandle.style.cursor = 'nwse-resize';
  resizeHandle.style.zIndex = '10';
  win.appendChild(resizeHandle);

  let isResizing = false;

  resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    isResizing = true;
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (isResizing) {
      const rect = win.getBoundingClientRect();
      win.style.width = `${e.clientX - rect.left}px`;
      win.style.height = `${e.clientY - rect.top}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.userSelect = 'auto';
  });
});

document.addEventListener('click', () => {
  document.getElementById('context-menu').classList.add('hidden');
});

window.addEventListener("load", () => {
  const bootScreen = document.getElementById("bootScreen");
  const shutdownOverlay = document.getElementById("shutdown-overlay");

  // Ensure both overlays are hidden after load
  if (shutdownOverlay) {
    shutdownOverlay.classList.add("hidden");
    shutdownOverlay.style.display = "none";
  }

  if (bootScreen) {
    setTimeout(() => {
      bootScreen.classList.add("hidden");
      bootScreen.style.display = "none";
    }, 3000); // Delay in milliseconds
  }
});
