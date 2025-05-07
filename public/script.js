//────────────────────────────────────────
//   Window Control & Desktop Icons
//────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initBootSequence();
  initDesktopIcons();
  initStarfield();
  initClock();
});

window.addEventListener("load", initWindowControls);
window.addEventListener("mousedown", startMultiSelect);

const windowStates = {};
let currentZIndex = 10;

function getNextZIndex() {
  return ++currentZIndex;
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Hide other windows and start menu
  document.querySelectorAll(".popup-window").forEach(w => w.classList.remove("active"));
  document.getElementById("start-menu").style.display = "none";

  // Lazy-load iframe or video
  win.querySelectorAll("iframe[data-src], video[data-src]").forEach(el => {
    if (!el.src) {
      el.src = el.dataset.src;
      if (el.tagName === "VIDEO") {
        el.load();
        el.play().catch(() => {});
      }
    }
  });

  // Play audio (Toader, TIGERRR)
  if (id === "toader") {
    const audio = document.getElementById("toader-audio");
    if (audio && audio.paused) {
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }
  }

  // Apply previous style state
  const stored = windowStates[id];
  if (stored) Object.assign(win.style, stored);

  // Clamp to viewport
  const margin = 20;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = win.getBoundingClientRect();
  const clamped = {
    width: Math.min(rect.width, vw - margin * 2),
    height: Math.min(rect.height, vh - margin * 2),
    left: Math.max(margin, Math.min(rect.left, vw - rect.width - margin)),
    top: Math.max(margin, Math.min(rect.top, vh - rect.height - margin))
  };

  Object.assign(win.style, {
    display: "flex",
    zIndex: getNextZIndex(),
    ...clamped
  });

  win.classList.remove("hidden");
  win.classList.add("active");
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
  if (!win) return;

  const vid = win.querySelector("video");
  if (vid) {
    vid.pause();
    vid.currentTime = 0;
  }

  const audio = document.getElementById("toader-audio");
  if (id === "toader" && audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  win.classList.add("hidden");
  win.style.display = "none";

  const icon = document.getElementById(`taskbar-icon-${id}`);
  if (icon) icon.remove();
}

function toggleMaximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  const resizers = win.querySelectorAll(".resizer");

  if (!win.classList.contains("maximized")) {
    windowStates[id] = {
      top: win.style.top,
      left: win.style.left,
      width: win.style.width,
      height: win.style.height
    };
    Object.assign(win.style, {
      top: "0px",
      left: "0px",
      width: "100vw",
      height: "calc(100vh - 36px)"
    });
    win.classList.add("maximized");
    resizers.forEach(r => r.style.display = "none");
  } else {
    win.classList.remove("maximized");
    const prev = windowStates[id];
    if (prev) Object.assign(win.style, prev);
    resizers.forEach(r => r.style.display = "block");
  }

  win.style.zIndex = getNextZIndex();
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

    let isDragging = false;
    let offsetX = 0, offsetY = 0;
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
      }
    });
    document.addEventListener("mouseup", () => { isDragging = false; });
  });
}

function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    icon.addEventListener("click", () => openWindow(icon.dataset.window));
  });
}
