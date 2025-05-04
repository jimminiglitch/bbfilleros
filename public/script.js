function playBlip() {
  const blip = document.getElementById("blip");
  if (blip) {
    blip.currentTime = 0;
    blip.play();
  }
}

function saveWindowState(id, state) {
  localStorage.setItem(`window-${id}`, JSON.stringify(state));
}

function loadWindowState(id) {
  const data = localStorage.getItem(`window-${id}`);
  return data ? JSON.parse(data) : null;
}

function getWindowState(win) {
  return {
    width: win.style.width || "400px",
    height: win.style.height || "auto",
    top: win.style.top || "100px",
    left: win.style.left || "50%",
    maximized: win.classList.contains("maximized"),
    minimized: win.classList.contains("minimized")
  };
}

// Restore state or default placement
function openWindow(id) {
  const win = document.getElementById(id);
  const saved = loadWindowState(id);

  if (saved) {
    win.style.width = saved.width;
    win.style.height = saved.height;
    win.style.top = saved.top;
    win.style.left = saved.left;
    win.classList.toggle("maximized", saved.maximized);
    win.classList.toggle("minimized", saved.minimized);
  }

  if (win.classList.contains("minimized")) {
    win.classList.remove("minimized");
    updateTaskbarIcon(id, false);
  }

  win.classList.remove("hidden");
  win.style.zIndex = 10;
}

// Minimize to taskbar
function minimizeWindow(id) {
  const win = document.getElementById(id);
  win.classList.add("minimized");
  saveWindowState(id, getWindowState(win));
  updateTaskbarIcon(id, true);
  win.classList.add("hidden");
}

// Close (fully hide) window
function closeWindow(id) {
  const win = document.getElementById(id);
  win.classList.add("hidden");
  win.classList.remove("minimized", "maximized");
  updateTaskbarIcon(id, false);
  saveWindowState(id, getWindowState(win));
}

// Taskbar icon logic
function updateTaskbarIcon(id, show) {
  let icon = document.querySelector(`[data-task="${id}"]`);
  const taskbar = document.getElementById("taskbar-icons");

  if (show && !icon) {
    icon = document.createElement("button");
    icon.textContent = id.toUpperCase();
    icon.dataset.task = id;
    icon.className = "taskbar-icon active";
    icon.title = `Restore ${id}`;

    icon.onclick = () => {
      const win = document.getElementById(id);
      if (win.classList.contains("hidden")) {
        win.classList.remove("hidden");
        icon.classList.add("active");
      } else {
        win.classList.add("hidden");
        icon.classList.remove("active");
      }
    };

    taskbar.appendChild(icon);
  }

  if (!show && icon) {
    icon.remove();
  }
}

// Initialize windows
document.querySelectorAll(".popup-window").forEach((win) => {
  const id = win.id;
  const header = win.querySelector(".window-header");
  const content = win.querySelector(".window-content");

  let isDragging = false,
    offsetX = 0,
    offsetY = 0;

  // Create control buttons
  const minBtn = document.createElement("button");
  const maxBtn = document.createElement("button");
  const closeBtn = document.createElement("button");

  minBtn.textContent = "_";
  minBtn.title = "Minimize";

  maxBtn.textContent = "▭";
  maxBtn.title = "Maximize";

  closeBtn.textContent = "X";
  closeBtn.title = "Close";

  // Rebuild header
  const title = document.createElement("span");
  title.textContent = `${id.toUpperCase()}.EXE`;

  header.innerHTML = "";
  header.appendChild(title);
  header.appendChild(minBtn);
  header.appendChild(maxBtn);
  header.appendChild(closeBtn);

  // Button actions
  minBtn.onclick = () => minimizeWindow(id);
  maxBtn.onclick = () => {
    win.classList.toggle("maximized");
    saveWindowState(id, getWindowState(win));
  };
  closeBtn.onclick = () => closeWindow(id);

  // Dragging
  header.addEventListener("mousedown", (e) => {
    if (win.classList.contains("maximized")) return;
    isDragging = true;
    const rect = win.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      win.style.left = `${e.clientX - offsetX}px`;
      win.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      saveWindowState(id, getWindowState(win));
      isDragging = false;
    }
  });

  // Load saved state
  const saved = loadWindowState(id);
  if (saved) {
    win.style.width = saved.width;
    win.style.height = saved.height;
    win.style.top = saved.top;
    win.style.left = saved.left;
    if (saved.maximized) win.classList.add("maximized");
    if (saved.minimized) {
      win.classList.add("hidden");
      updateTaskbarIcon(id, true);
    }
  }
});

// Boot animation
let dots = document.querySelector(".dots");
let count = 0;
let interval = setInterval(() => {
  dots.textContent += ".";
  count++;
  if (count > 3) {
    dots.textContent = "";
    count = 0;
  }
}, 500);

window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("bootScreen").style.display = "none";
    clearInterval(interval);
  }, 3000);
});

// Starfield
const canvas = document.getElementById("background-canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let stars = Array(250)
  .fill()
  .map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.5
  }));

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  stars.forEach((s) => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function twinkle() {
  stars.forEach((s) => (s.r = Math.random() * 1.2 + 0.5));
}

setInterval(() => {
  twinkle();
  drawStars();
}, 100);

// Clock
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  document.getElementById("clock").textContent = `${hours}:${minutes}`;
}
setInterval(updateClock, 1000);
updateClock();

// Start Menu
const startBtn = document.getElementById("start-button");
const startMenu = document.getElementById("start-menu");

startBtn.addEventListener("click", () => {
  startMenu.style.display = startMenu.style.display === "block" ? "none" : "block";
});
window.addEventListener("click", (e) => {
  if (!startBtn.contains(e.target) && !startMenu.contains(e.target)) {
    startMenu.style.display = "none";
  }
});
startMenu.addEventListener("click", (e) => {
  e.stopPropagation();
});
