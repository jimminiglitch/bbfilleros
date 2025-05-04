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

function openWindow(id) {
  const win = document.getElementById(id);
  win.classList.remove("hidden");
  win.style.zIndex = 10;

  const saved = loadWindowState(id);
  if (saved) {
    win.style.width = saved.width;
    win.style.height = saved.height;
    win.style.top = saved.top;
    win.style.left = saved.left;
    if (saved.maximized) win.classList.add("maximized");
  } else {
    win.style.left = Math.floor(Math.random() * (window.innerWidth - 500)) + "px";
    win.style.top = Math.floor(Math.random() * (window.innerHeight - 300)) + "px";
  }
}

function closeWindow(id) {
  document.getElementById(id).classList.add("hidden");
}

document.querySelectorAll(".popup-window").forEach((win) => {
  const id = win.id;
  const header = win.querySelector(".window-header");
  const content = win.querySelector(".window-content");

  let isDragging = false,
    offsetX = 0,
    offsetY = 0;

  // Create buttons
  const minBtn = document.createElement("button");
  minBtn.textContent = "_";
  minBtn.title = "Minimize";

  const maxBtn = document.createElement("button");
  maxBtn.textContent = "▭";
  maxBtn.title = "Maximize";

  const closeBtn = header.querySelector("button");

  // Clear and rebuild header layout
  const title = document.createElement("span");
  title.textContent = `${id.toUpperCase()}.EXE`;
  header.innerHTML = "";
  header.append(minBtn, maxBtn, title, closeBtn);

  // Minimize toggle
  minBtn.onclick = () => {
    content.style.display = content.style.display === "none" ? "block" : "none";
    saveWindowState(id, getWindowState(win));
  };

  // Maximize toggle
  maxBtn.onclick = () => {
    win.classList.toggle("maximized");
    saveWindowState(id, getWindowState(win));
  };

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

  // Restore saved state
  const saved = loadWindowState(id);
  if (saved) {
    win.style.width = saved.width;
    win.style.height = saved.height;
    win.style.top = saved.top;
    win.style.left = saved.left;
    if (saved.maximized) win.classList.add("maximized");
  }
});

function getWindowState(win) {
  return {
    width: win.style.width || "400px",
    height: win.style.height || "auto",
    top: win.style.top || "100px",
    left: win.style.left || "50%",
    maximized: win.classList.contains("maximized")
  };
}

// Boot screen logic
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
