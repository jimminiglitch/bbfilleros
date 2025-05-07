//────────────────────────────────────────────────────────────────────────────
//   Main Script (public/script.js) - OPTIMIZED VERSION
//────────────────────────────────────────────────────────────────────────────

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// DOM ready handler with performance improvements
document.addEventListener("DOMContentLoaded", () => {
  // Initialize all windows once
  initWindowControls();
  
  // Start boot sequence
  runBootSequence().then(() => {
    initDesktopIcons();
    initStarfield();
  });
});

// 1) WINDOW CONTROLS - Consolidated for better performance
function initWindowControls() {
  const windows = document.querySelectorAll(".popup-window");

  windows.forEach((win) => {
    const id = win.id;
    const header = win.querySelector(".window-header");
    const btnMin = header.querySelector(".minimize");
    const btnMax = header.querySelector(".maximize");
    const btnCls = header.querySelector(".close");

    if (btnMin) btnMin.addEventListener("click", () => minimizeWindow(id));
    if (btnMax) btnMax.addEventListener("click", () => toggleMaximizeWindow(id));
    if (btnCls) btnCls.addEventListener("click", () => closeWindow(id));

    function toggleMaximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  const isMax = !win.classList.contains("maximized");
  if (isMax) {
    // save old styles
    windowStates[id] = {
      parent: win.parentNode,
      next:   win.nextSibling,
      ...["position","top","left","right","bottom","transform"]
        .reduce((o,k)=> (o[k]=win.style[k],o), {})
    };
    // force full-screen
    document.body.appendChild(win);
    win.classList.add("maximized");
    Object.assign(win.style, {
      position: "fixed",
      top:      "0",
      left:     "0",
      right:    "0",
      bottom:   "36px",   // leave room for your taskbar
      transform:"none",
      zIndex:   getNextZIndex(),
    });
  } else {
    // restore
    const prev = windowStates[id] || {};
    win.classList.remove("maximized");
    Object.assign(win.style, {
      position: prev.position  || "absolute",
      top:      prev.top       || "",
      left:     prev.left      || "",
      right:    prev.right     || "",
      bottom:   prev.bottom    || "",
      transform:prev.transform || "",
      zIndex:   getNextZIndex(),
    });
    // put it back where it was
    if (prev.parent) prev.parent.insertBefore(win, prev.next);
  }
}

    
    // Dragging logic
    let isDragging = false,
      offsetX = 0,
      offsetY = 0;
    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      win.style.zIndex = getNextZIndex();
    });
    
    // Use passive event listeners for better performance
    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        win.style.left = `${e.clientX - offsetX}px`;
        win.style.top = `${e.clientY - offsetY}px`;
      }
    }, { passive: true });
    
    document.addEventListener("mouseup", () => {
      isDragging = false;
    }, { passive: true });

    // Resizing logic
    const directions = [
      "top", "right", "bottom", "left",
      "top-left", "top-right", "bottom-left", "bottom-right",
    ];

    directions.forEach((dir) => {
      const resizer = document.createElement("div");
      resizer.classList.add("resizer", `resizer-${dir}`);
      win.appendChild(resizer);

      let isResizing = false;

      resizer.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = parseInt(getComputedStyle(win).width, 10);
        const startHeight = parseInt(getComputedStyle(win).height, 10);
        const startTop = win.offsetTop;
        const startLeft = win.offsetLeft;

        function doDrag(e) {
          if (!isResizing) return;
          let newWidth = startWidth;
          let newHeight = startHeight;
          let newTop = startTop;
          let newLeft = startLeft;

          if (dir.includes("right")) {
            newWidth = Math.max(300, startWidth + e.clientX - startX);
          }
          if (dir.includes("bottom")) {
            newHeight = Math.max(200, startHeight + e.clientY - startY);
          }
          if (dir.includes("left")) {
            const dx = e.clientX - startX;
            newWidth = Math.max(300, startWidth - dx);
            newLeft = startLeft + dx;
          }
          if (dir.includes("top")) {
            const dy = e.clientY - startY;
            newHeight = Math.max(200, startHeight - dy);
            newTop = startTop + dy;
          }

          win.style.width = `${newWidth}px`;
          win.style.height = `${newHeight}px`;
          win.style.top = `${newTop}px`;
          win.style.left = `${newLeft}px`;
        }

        function stopDrag() {
          isResizing = false;
          window.removeEventListener("mousemove", doDrag);
          window.removeEventListener("mouseup", stopDrag);
        }

        window.addEventListener("mousemove", doDrag, { passive: true });
        window.addEventListener("mouseup", stopDrag, { passive: true });
      });
    });
  });
}

// 2) OPEN / MINIMIZE / CLOSE / MAXIMIZE & TASKBAR ICONS
let currentZIndex = 10;
const windowStates = {};

function getNextZIndex() {
  return ++currentZIndex;
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // 1) Hide start menu & deactivate other windows
  document.getElementById("start-menu").style.display = "none";
  document
    .querySelectorAll(".popup-window")
    .forEach((w) => w.classList.remove("active"));

  // 2) Lazy-load any <iframe data-src> in this window
  win.querySelectorAll("iframe[data-src]").forEach((iframe) => {
    if (!iframe.src) {
      iframe.src = iframe.dataset.src;
      
      
    }
  });

  // 3) If this is the Toader window, play hover audio
  if (id === "toader") {
    const audio = document.getElementById("toader-audio");
    if (audio && audio.paused) {
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }
  }

  if (id === "TIGERRR") {
    const audio = document.getElementById("TIGERRR-audio");
    if (audio && audio.paused) {
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }
  }
  
  // 4) Lazy-load any <video data-src> in this window
  win.querySelectorAll("video[data-src]").forEach((v) => {
    if (!v.src) {
      v.src = v.dataset.src;
      v.load();
      // Only play if not on mobile (to avoid autoplay restrictions)
      if (!isMobile()) {
        v.play().catch(() => {
          /* may require user gesture */
        });
      }
    }
  });

  // 5) Show & focus
  win.classList.remove("hidden");
  win.classList.add("active");
  win.style.display = "flex";
  win.style.zIndex = getNextZIndex();

  // 6) Restore previous bounds or adapt to screen size
  const isMobileView = isMobile();
  
  if (isMobileView) {
    // On mobile, position window to fill the screen
    Object.assign(win.style, {
      top: "0",
      left: "0",
      width: "100vw",
      height: `calc(100vh - 36px)`,
      transform: "none"
    });
  } else {
    // On desktop, restore previous bounds
    const stored = windowStates[id];
    if (stored) Object.assign(win.style, stored);

    // 7) Clamp window to viewport
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
      top: `${newTop}px`,
    });
  }
}

// Helper function to detect mobile devices
function isMobile() {
  return window.innerWidth < 768;
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
    if (vid) {
      vid.pause();
      vid.currentTime = 0;
    }
    win.classList.add("hidden");
    win.style.display = "none";
    if (id === "toader") {
      const audio = document.getElementById("toader-audio");
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }
  const icon = document.getElementById(`taskbar-icon-${id}`);
  if (icon) icon.remove();
}

function toggleMaximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  const isMax = !win.classList.contains("maximized");
  if (isMax) {
    // save its old parent & styles
    const prev = windowStates[id] = {
      parent:    win.parentNode,
      next:      win.nextSibling,
      position:  win.style.position,
      top:       win.style.top,
      left:      win.style.left,
      right:     win.style.right,
      bottom:    win.style.bottom,
      transform: win.style.transform,
    };

    // move it into body so it's never clipped
    document.body.appendChild(win);
    win.classList.add("maximized");
    Object.assign(win.style, {
      position: "fixed",
      top:      "0",
      left:     "0",
      right:    "0",
      bottom:   "36px",
      transform:"none",
      zIndex:   getNextZIndex(),
    });

  } else {
    win.classList.remove("maximized");
    const prev = windowStates[id] || {};

    // restore its styles
    Object.assign(win.style, {
      position: prev.position || "absolute",
      top:      prev.top      || "",
      left:     prev.left     || "",
      right:    prev.right    || "",
      bottom:   prev.bottom   || "",
      transform:prev.transform||"",
      zIndex:   getNextZIndex(),
    });

    // and put it back where it came from
    if (prev.parent) {
      prev.parent.insertBefore(win, prev.next);
    }
  }
}

// 3) CLOCK & START MENU TOGGLE
function updateClock() {
  const clk = document.getElementById("clock");
  if (clk) clk.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

document.getElementById("start-button").addEventListener("click", () => {
  const m = document.getElementById("start-menu");
  m.style.display = m.style.display === "flex" ? "none" : "flex";
});

// 4) BOOT SEQUENCE (run on DOMContentLoaded)
function runBootSequence() {
  return new Promise((resolve) => {
    const bootScreen = document.getElementById("bootScreen");
    const logEl = document.getElementById("boot-log");
    const progress = document.getElementById("progress-bar");
    const msgs = [
      "[ OK ] Initializing hardware...",
      "[ OK ] Loading kernel modules...",
      "[ OK ] Mounting filesystems...",
      "[ OK ] Starting system services...",
      "[ OK ] CyberDeck ready.",
      "[ DONE ] Boot complete.",
    ];
    let idx = 0;
    const total = msgs.length;
    const delay = 400;

    const typer = setInterval(() => {
      logEl.textContent += msgs[idx] + "\n";
      logEl.scrollTop = logEl.scrollHeight;
      progress.style.width = `${((idx + 1) / total) * 100}%`;
      idx++;
      if (idx === total) {
        clearInterval(typer);
        setTimeout(() => {
          bootScreen.style.transition = "opacity 0.8s";
          bootScreen.style.opacity = "0";
          setTimeout(() => {
            bootScreen.style.display = "none";
            resolve();
          }, 800);
        }, 500);
      }
    }, delay);
  });
}

// 5) DESKTOP ICONS (single-click to open + drag-group)
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach((icon) => {
    // open on single click
    icon.addEventListener("click", () => openWindow(icon.dataset.window));

    // drag-group start
    icon.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const parentRect = icon.parentElement.getBoundingClientRect();
      const clickRect = icon.getBoundingClientRect();

      let group;
      if (icon.classList.contains("selected")) {
        group = Array.from(document.querySelectorAll(".desktop-icon.selected"));
      } else {
        document
          .querySelectorAll(".desktop-icon.selected")
          .forEach((ic) => ic.classList.remove("selected"));
        icon.classList.add("selected");
        group = [icon];
      }

      const shiftX = e.clientX - clickRect.left;
      const shiftY = e.clientY - clickRect.top;

      const groupData = group.map((ic) => {
        const r = ic.getBoundingClientRect();
        const startLeft = r.left - parentRect.left;
        const startTop = r.top - parentRect.top;
        ic.style.left = `${startLeft}px`;
        ic.style.top = `${startTop}px`;
        ic.style.zIndex = getNextZIndex();
        return { icon: ic, startLeft, startTop };
      });

      function onMouseMove(e) {
        const dx =
          e.clientX - shiftX - parentRect.left - groupData[0].startLeft;
        const dy = e.clientY - shiftY - parentRect.top - groupData[0].startTop;
        groupData.forEach(({ icon, startLeft, startTop }) => {
          icon.style.left = `${startLeft + dx}px`;
          icon.style.top = `${startTop + dy}px`;
        });
      }

      document.addEventListener("mousemove", onMouseMove, { passive: true });
      document.addEventListener(
        "mouseup",
        () => {
          document.removeEventListener("mousemove", onMouseMove);
        },
        { once: true, passive: true }
      );
    });

    icon.ondragstart = () => false;
  });
}

// 6) CLICK-AND-DRAG MULTI-SELECT (rainbow selector box)
let selStartX, selStartY, selDiv;
function onSelectStart(e) {
  if (e.target.closest(".desktop-icon, .popup-window, #start-bar, #start-menu"))
    return;
  selStartX = e.clientX;
  selStartY = e.clientY;
  selDiv = document.createElement("div");
  selDiv.id = "selection-rect";
  selDiv.style.left = `${selStartX}px`;
  selDiv.style.top = `${selStartY}px`;
  selDiv.style.width = "0px";
  selDiv.style.height = "0px";
  document.body.appendChild(selDiv);
  document.addEventListener("mousemove", onSelectMove, { passive: true });
  document.addEventListener("mouseup", onSelectEnd, { once: true, passive: true });
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
  document.querySelectorAll(".desktop-icon").forEach((icon) => {
    const r = icon.getBoundingClientRect();
    const inside =
      r.left >= box.left &&
      r.right <= box.right &&
      r.top >= box.top &&
      r.bottom <= box.bottom;
    icon.classList.toggle("selected", inside);
  });
}

function onSelectEnd() {
  if (selDiv) selDiv.remove();
  selDiv = null;
}

// 7) STARFIELD BACKGROUND - Optimized with requestAnimationFrame
function initStarfield() {
  const canvas = document.getElementById("background-canvas");
  const ctx = canvas.getContext("2d");
  
  // Resize handler with debounce
  const handleResize = debounce(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Regenerate stars when canvas size changes
    initStars();
  }, 250);
  
  window.addEventListener("resize", handleResize);
  
  // Initial setup
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const numStars = 300;
  const stars = Array.from({ length: numStars }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * canvas.width,
    o: Math.random(),
  }));
  
  let lastTime = 0;
  const fps = 1; // Lower FPS for better performance
  const frameInterval = 1 / fps;
  
  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;
    
    if (elapsed > frameInterval) {
      lastTime = timestamp - (elapsed % frameInterval);
      
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Process stars in batches for better performance
      const batchSize = Math.min(100, stars.length);
      for (let i = 0; i < batchSize; i++) {
        const s = stars[i];
        s.z -= 2;
        if (s.z <= 0) {
          s.z = canvas.width;
          s.x = Math.random() * canvas.width;
          s.y = Math.random() * canvas.height;
          s.o = Math.random();
        }
        const k = 128.0 / s.z;
        const px = (s.x - canvas.width / 2) * k + canvas.width / 2;
        const py = (s.y - canvas.height / 2) * k + canvas.height / 2;
        const sz = Math.max(0, (1 - s.z / canvas.width) * 3);
        ctx.globalAlpha = s.o;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Move processed stars to the end of the array
      stars.push(...stars.splice(0, batchSize));
    }
    
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  
  // Initialize stars
  function initStars() {
    for (let i = 0; i < stars.length; i++) {
      stars[i] = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * canvas.width,
        o: Math.random()
      };
    }
  }
  
  // Start animation
  requestAnimationFrame(animate);
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart);
