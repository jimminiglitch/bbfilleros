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

// Close window
function closeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    win.classList.add("hidden");
    win.style.display = "none";
  }
}

// Minimize window
function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    win.classList.add("hidden");
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
