
// Utility functions
function debounce(func, wait) {
  let timeout
  return function () {
    const args = arguments
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

const toadHoverAudio = new Audio('https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/hover.mp3?v=1746577634973');
toadHoverAudio.volume = 1;


// DOM ready handler with performance improvements
document.addEventListener("DOMContentLoaded", () => {
  // Initialize all windows once
  initWindowControls()

  // Start boot sequence
  runBootSequence().then(() => {
    initDesktopIcons()
    initStarfield()
    initGlitchEffects()
  })
})

// 1) WINDOW CONTROLS - Consolidated for better performance
function initWindowControls() {
  const windows = document.querySelectorAll(".popup-window")

  windows.forEach((win) => {
    const id = win.id
    const header = win.querySelector(".window-header")
    const btnMin = header.querySelector(".minimize")
    const btnMax = header.querySelector(".maximize")
    const btnCls = header.querySelector(".close")

    if (btnMin) btnMin.addEventListener("click", () => minimizeWindow(id))
    if (btnMax) btnMax.addEventListener("click", () => toggleMaximizeWindow(id))
    if (btnCls) btnCls.addEventListener("click", () => closeWindow(id))

    // Dragging logic
    let isDragging = false,
      offsetX = 0,
      offsetY = 0
    header.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return // Don't drag if clicking buttons
      isDragging = true
      offsetX = e.clientX - win.offsetLeft
      offsetY = e.clientY - win.offsetTop
      win.style.zIndex = getNextZIndex()

      // Add active class to show it's being dragged
      win.classList.add("dragging")
    })

    // Use passive event listeners for better performance
    document.addEventListener(
      "mousemove",
      (e) => {
        if (isDragging) {
          // Don't drag if maximized
          if (win.classList.contains("maximized")) return

          win.style.left = `${e.clientX - offsetX}px`
          win.style.top = `${e.clientY - offsetY}px`
        }
      },
      { passive: true },
    )

    document.addEventListener(
      "mouseup",
      () => {
        isDragging = false
        win.classList.remove("dragging")
      },
      { passive: true },
    )

    // Double-click to maximize
    header.addEventListener("dblclick", (e) => {
      if (e.target.tagName !== "BUTTON") {
        toggleMaximizeWindow(id)
      }
      
    })

    // Resizing logic
    const directions = ["top", "right", "bottom", "left", "top-left", "top-right", "bottom-left", "bottom-right"]

    directions.forEach((dir) => {
      const resizer = document.createElement("div")
      resizer.classList.add("resizer", `resizer-${dir}`)
      win.appendChild(resizer)

      let isResizing = false

      resizer.addEventListener("mousedown", (e) => {
        if (win.classList.contains("maximized")) return

        e.preventDefault()
        e.stopPropagation()
        isResizing = true
        win.classList.add("resizing")
        const startX = e.clientX
        const startY = e.clientY
        const startWidth = Number.parseInt(getComputedStyle(win).width, 10)
        const startHeight = Number.parseInt(getComputedStyle(win).height, 10)
        const startTop = win.offsetTop
        const startLeft = win.offsetLeft

        function doDrag(e) {
          if (!isResizing) return
          let newWidth = startWidth
          let newHeight = startHeight
          let newTop = startTop
          let newLeft = startLeft

          if (dir.includes("right")) {
            newWidth = Math.max(300, startWidth + e.clientX - startX)
          }
          if (dir.includes("bottom")) {
            newHeight = Math.max(200, startHeight + e.clientY - startY)
          }
          if (dir.includes("left")) {
            const dx = e.clientX - startX
            newWidth = Math.max(300, startWidth - dx)
            newLeft = startLeft + dx
          }
          if (dir.includes("top")) {
            const dy = e.clientY - startY
            newHeight = Math.max(200, startHeight - dy)
            newTop = startTop + dy
          }

          win.style.width = `${newWidth}px`
          win.style.height = `${newHeight}px`
          win.style.top = `${newTop}px`
          win.style.left = `${newLeft}px`
        }

        function stopDrag() {
          isResizing = false
          win.classList.remove("resizing")
          window.removeEventListener("mousemove", doDrag)
          window.removeEventListener("mouseup", stopDrag)
        }

        window.addEventListener("mousemove", doDrag, { passive: true })
        window.addEventListener("mouseup", stopDrag, { passive: true })
      })
    })
  })
}

// 2) OPEN / MINIMIZE / CLOSE / MAXIMIZE & TASKBAR ICONS
let currentZIndex = 10
const windowStates = {}

function getNextZIndex() {
  return ++currentZIndex
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // 1) Hide start menu & deactivate other windows
  document.getElementById("start-menu").style.display = "none";
  document.querySelectorAll(".popup-window").forEach((w) => w.classList.remove("active"));

  // 2) Lazy-load <iframe data-src>
  win.querySelectorAll("iframe[data-src]").forEach((iframe) => {
    if (!iframe.src) {
      iframe.src = iframe.dataset.src;
    }
  });

  // 3) Lazy-load <video data-src>
  win.querySelectorAll("video[data-src]").forEach((v) => {
    if (!v.src) {
      v.src = v.dataset.src;
      v.load();
      if (!isMobile()) {
        v.play().catch(() => {});
      }
    }
  });

  // 4) Show & focus
  win.classList.remove("hidden");
  win.classList.add("active");
  win.style.display = "flex";
  win.style.zIndex = getNextZIndex();
  win.classList.add("window-opening");
  setTimeout(() => {
    win.classList.remove("window-opening");
  }, 500);

  // ─── Play the toad hover sound when the Toader window opens ───
  if (id === "toader") {
    toadHoverAudio.currentTime = 0;
    toadHoverAudio.play().catch(() => {});
  }

  // 5) Restore previous bounds or clamp to viewport
  const isMobileView = isMobile();
  if (isMobileView) {
    Object.assign(win.style, {
      top: "0",
      left: "0",
      width: "100vw",
      height: "calc(100vh - 36px)",
      transform: "none",
    });
  } else {
    const stored = windowStates[id];
    if (stored) Object.assign(win.style, stored);

    const rect = win.getBoundingClientRect();
    const margin = 20;
    const vw = 1920;
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
      width:  `${newW}px`,
      height: `${newH}px`,
      left:   `${newLeft}px`,
      top:    `${newTop}px`,
    });
  }
}
// Helper function to detect mobile devices
function isMobile() {
  return true
}

function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return

  const win = document.getElementById(id)
  const title = win ? win.querySelector(".window-header span").textContent.replace(".EXE", "") : id.toUpperCase()

  const btn = document.createElement("button")
  btn.id = `taskbar-icon-${id}`
  btn.className = "taskbar-icon"

  const iconText = document.createElement("span")
  iconText.textContent = title
  btn.appendChild(iconText)

  btn.addEventListener("click", () => {
    openWindow(id)
    btn.remove()
  })

  document.getElementById("taskbar-icons").appendChild(btn)
}

function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Add minimizing animation
  win.classList.add("window-minimizing");

  setTimeout(() => {
    win.classList.remove("window-minimizing");
    win.classList.add("hidden");
    win.style.display = "none";

    // Create taskbar icon
    createTaskbarIcon(id);

    // Stop toad hover SFX if it’s the toader window
    if (id === "toader") {
      toadHoverAudio.pause();
      toadHoverAudio.currentTime = 0;
    }
  }, 300);
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    // Add closing animation
    win.classList.add("window-closing");

    setTimeout(() => {
      // Pause/reset any video inside
      const vid = win.querySelector("video");
      if (vid) {
        vid.pause();
        vid.currentTime = 0;
      }

      // Hide window
      win.classList.remove("window-closing");
      win.classList.add("hidden");
      win.style.display = "none";

      // Stop toad hover SFX if it’s the toader window
      if (id === "toader") {
        toadHoverAudio.pause();
        toadHoverAudio.currentTime = 0;
      }
    }, 300);
  }

  // Remove taskbar icon
  const icon = document.getElementById(`taskbar-icon-${id}`);
  if (icon) icon.remove();
}


const tracks = [
  {
    title: "Paper Doll (LIVE)",
    src: "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Paper%20Doll%20(LIVE).mp3?v=1746750692768"
  },
  {
    title: "Manameisdrnk",
    src: "https://cdn.glitch.me/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/mynameisdrunk.wav?v=1746751634863"
  }
];

const player = document.getElementById("music-player");
const nowPlaying = document.getElementById("now-playing");
const playlistEl = document.getElementById("playlist");

let currentTrackIndex = 0;

function loadTrack(index) {
  const track = tracks[index];
  if (!track) return;

  player.src = track.src;
  nowPlaying.textContent = `▶ Now Playing: ${track.title}`;
  player.play();
  highlightCurrentTrack();
}

function highlightCurrentTrack() {
  const items = playlistEl.querySelectorAll("li");
  items.forEach((li, i) => {
    li.classList.toggle("playing", i === currentTrackIndex);
  });
}

// Event handlers
document.getElementById("togglePlay").addEventListener("click", () => {
  if (player.paused) {
    player.play();
  } else {
    player.pause();
  }
});

document.getElementById("nextTrack").addEventListener("click", () => {
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  loadTrack(currentTrackIndex);
});

document.getElementById("prevTrack").addEventListener("click", () => {
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentTrackIndex);
});

// Populate playlist
tracks.forEach((track, index) => {
  const li = document.createElement("li");
  li.textContent = track.title;
  li.addEventListener("click", () => {
    currentTrackIndex = index;
    loadTrack(currentTrackIndex);
  });
  playlistEl.appendChild(li);
});

// Auto-load first track on window open
document.getElementById("music").addEventListener("click", () => {
  if (!player.src) loadTrack(currentTrackIndex);
});


function toggleMaximizeWindow(id) {
  const win = document.getElementById(id)
  if (!win) return

  const isMax = !win.classList.contains("maximized")

  if (isMax) {
    // save old bounds
    windowStates[id] = {
      parent: win.parentNode,
      next: win.nextSibling,
      position: win.style.position,
      top: win.style.top,
      left: win.style.left,
      right: win.style.right,
      bottom: win.style.bottom,
      width: win.style.width,
      height: win.style.height,
      transform: win.style.transform,
    }

    win.classList.add("window-maximizing")
    setTimeout(() => {
      document.body.appendChild(win)
      win.classList.add("maximized")
      win.classList.remove("window-maximizing")
      Object.assign(win.style, {
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        bottom: "36px",
        width: "auto",
        height: "auto",
        transform: "none",
        zIndex: getNextZIndex(),
      })
    }, 300)
  } else {
    win.classList.add("window-restoring")
    win.classList.remove("maximized")
    setTimeout(() => {
      const prev = windowStates[id] || {}
      Object.assign(win.style, {
        position: prev.position || "absolute",
        top: prev.top || "",
        left: prev.left || "",
        right: prev.right || "",
        bottom: prev.bottom || "",
        width: prev.width || "",
        height: prev.height || "",
        transform: prev.transform || "",
        zIndex: getNextZIndex(),
      })
      if (prev.parent) prev.parent.insertBefore(win, prev.next)
      win.classList.remove("window-restoring")
    }, 300)
  }
}

// 3) CLOCK & START MENU TOGGLE
function updateClock() {
  const clk = document.getElementById("clock")
  if (clk) {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")
    const seconds = now.getSeconds().toString().padStart(2, "0")
    clk.textContent = `${hours}:${minutes}:${seconds}`
    clk.classList.add("clock-pulse")
    setTimeout(() => {
      clk.classList.remove("clock-pulse")
    }, 500)
  }
}
setInterval(updateClock, 1000)
updateClock()

document.getElementById("start-button").addEventListener("click", () => {
  const m = document.getElementById("start-menu")
  const isVisible = m.style.display === "flex"
  if (isVisible) {
    m.classList.add("menu-hiding")
    setTimeout(() => {
      m.style.display = "none"
      m.classList.remove("menu-hiding")
    }, 300)
  } else {
    m.style.display = "flex"
    m.classList.add("menu-showing")
    setTimeout(() => {
      m.classList.remove("menu-showing")
    }, 300)
  }
})

// 4) BOOT SEQUENCE (run on DOMContentLoaded)
function runBootSequence() {
  return new Promise((resolve) => {
    const bootScreen = document.getElementById("bootScreen")
    const logEl = document.getElementById("boot-log")
    const progress = document.getElementById("progress-bar")
    const msgs = [
      "[ OK ] Initializing hardware...",
      "[ OK ] Loading kernel modules...",
      "[ OK ] Mounting filesystems...",
      "[ OK ] Starting system services...",
      "[ OK ] Loading neural interface...",
      "[ OK ] Connecting to cyberspace...",
      "[ OK ] CyberDeck v2.0 ready.",
      "[ DONE ] Boot complete.",
    ]
    let idx = 0
    const total = msgs.length
    const delay = 400

    const typer = setInterval(() => {
      logEl.textContent += msgs[idx] + "\n"
      logEl.scrollTop = logEl.scrollHeight
      progress.style.width = `${((idx + 1) / total) * 100}%`
      idx++
      if (idx === total) {
        clearInterval(typer)
        setTimeout(() => {
          bootScreen.style.transition = "opacity 0.8s"
          bootScreen.style.opacity = "0"
          setTimeout(() => {
            bootScreen.style.display = "none"
            resolve()
          }, 800)
        }, 500)
      }
    }, delay)
  })
}

// 5) DESKTOP ICONS (double-click to open + drag-group)
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach((icon) => {
    // open on double-click
    icon.addEventListener("dblclick", () => {
      openWindow(icon.dataset.window)
    })

    // hover effect only
    icon.addEventListener("mouseenter", () => {
      icon.classList.add("icon-hover")
    })
    icon.addEventListener("mouseleave", () => {
      icon.classList.remove("icon-hover")
    })

    // drag-group start
    icon.addEventListener("mousedown", (e) => {
      e.preventDefault()
      const parentRect = icon.parentElement.getBoundingClientRect()
      const clickRect = icon.getBoundingClientRect()
      let group
      if (icon.classList.contains("selected")) {
        group = Array.from(document.querySelectorAll(".desktop-icon.selected"))
      } else {
        document.querySelectorAll(".desktop-icon.selected").forEach((ic) => ic.classList.remove("selected"))
        icon.classList.add("selected")
        group = [icon]
      }
      const shiftX = e.clientX - clickRect.left
      const shiftY = e.clientY - clickRect.top
      const groupData = group.map((ic) => {
        const r = ic.getBoundingClientRect()
        const startLeft = r.left - parentRect.left
        const startTop = r.top - parentRect.top
        ic.style.left = `${startLeft}px`
        ic.style.top = `${startTop}px`
        ic.style.zIndex = getNextZIndex()
        return { icon: ic, startLeft, startTop }
      })
      function onMouseMove(e) {
        const dx = e.clientX - shiftX - parentRect.left - groupData[0].startLeft
        const dy = e.clientY - shiftY - parentRect.top - groupData[0].startTop
        groupData.forEach(({ icon, startLeft, startTop }) => {
          icon.style.left = `${startLeft + dx}px`
          icon.style.top = `${startTop + dy}px`
        })
      }
      document.addEventListener("mousemove", onMouseMove, { passive: true })
      document.addEventListener(
        "mouseup",
        () => {
          document.removeEventListener("mousemove", onMouseMove)
        },
        { once: true, passive: true },
      )
    })
    icon.ondragstart = () => false
  })
}

// 6) CLICK-AND-DRAG MULTI-SELECT (rainbow selector box)
let selStartX, selStartY, selDiv
function onSelectStart(e) {
  if (e.target.closest(".desktop-icon, .popup-window, #start-bar, #start-menu")) return
  selStartX = e.clientX
  selStartY = e.clientY
  selDiv = document.createElement("div")
  selDiv.id = "selection-rect"
  selDiv.style.left = `${selStartX}px`
  selDiv.style.top = `${selStartY}px`
  selDiv.style.width = "0px"
  selDiv.style.height = "0px"
  document.body.appendChild(selDiv)
  document.addEventListener("mousemove", onSelectMove, { passive: true })
  document.addEventListener("mouseup", onSelectEnd, { once: true, passive: true })
  e.preventDefault()
}

function onSelectMove(e) {
  if (!selDiv) return
  const x = Math.min(e.clientX, selStartX),
    y = Math.min(e.clientY, selStartY),
    w = Math.abs(e.clientX - selStartX),
    h = Math.abs(e.clientY - selStartY)
  selDiv.style.left = `${x}px`
  selDiv.style.top = `${y}px`
  selDiv.style.width = `${w}px`
  selDiv.style.height = `${h}px`
  const box = selDiv.getBoundingClientRect()
  document.querySelectorAll(".desktop-icon").forEach((icon) => {
    const r = icon.getBoundingClientRect()
    const inside = r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom
    icon.classList.toggle("selected", inside)
  })
}

function onSelectEnd() {
  if (selDiv) selDiv.remove()
  selDiv = null
}

// 7) STARFIELD BACKGROUND - pure white stars
// ─── STARFIELD (revised) ───────────────────────────────────────────────────
function initStarfield() {
  const canvas = document.getElementById("background-canvas")
  const ctx    = canvas.getContext("2d")

  let stars = []
  const STAR_COUNT = 500
  function initStars() {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * canvas.width,
      o: Math.random()
    }))
  }

  function drawStars() {
    // full‐opacity background to create motion-blur effect
    ctx.fillStyle = 'rgba(0,0,0,1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let s of stars) {
      // twinkle
      s.o += (Math.random() - 0.5) * 0.02
      s.o = Math.max(0.1, Math.min(1, s.o))

      // move forward
      s.z -= 2
      if (s.z <= 0) {
        s.z = canvas.width
        s.x = Math.random() * canvas.width
        s.y = Math.random() * canvas.height
        s.o = Math.random()
      }

      const k  = 128.0 / s.z
      const px = (s.x - canvas.width / 2) * k + canvas.width  / 2
      const py = (s.y - canvas.height / 2) * k + canvas.height / 2
      const sz = Math.max(0.5, (1 - s.z / canvas.width) * 2)  // half as big

      ctx.globalAlpha = s.o
      ctx.fillStyle   = '#fff'
      ctx.beginPath()
      ctx.arc(px, py, sz, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
  }

  // on resize, recalc canvas + reinit stars
  window.addEventListener('resize', debounce(() => {
    canvas.width  = 1920
    canvas.height = window.innerHeight
    initStars()
  }, 250))

  // initial sizing & stars
  canvas.width  = 1920
  canvas.height = window.innerHeight
  initStars()

  // loop
  function animate() {
    drawStars()
    requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
}

// 8) AUDIO VISUALIZER removed entirely

// 9) GLITCH EFFECTS
function initGlitchEffects() {
  setInterval(() => {
    document.querySelectorAll(".glitch-me").forEach((el) => {
      if (Math.random() > 0.95) {
        el.classList.add("glitching")
        setTimeout(() => el.classList.remove("glitching"), 200 + Math.random() * 400)
      }
    })
  }, 2000)

  setInterval(() => {
    if (Math.random() > 0.98) {
      const glitch = document.createElement("div")
      glitch.className = "screen-glitch"
      document.body.appendChild(glitch)
      setTimeout(() => glitch.remove(), 150 + Math.random() * 250)
    }
  }, 10000)
}

window.addEventListener("mousedown", onSelectStart)
initGlitchEffects()

// Reload video iframes on modal reopen

document.querySelectorAll('iframe').forEach(iframe => {
  const originalSrc = iframe.src;
  const parent = iframe.closest('.modal, .video-container, .popup');
  if (!parent) return;

  const observer = new MutationObserver(() => {
    if (parent.style.display !== 'none' && iframe.src !== originalSrc) {
      iframe.src = originalSrc;  // Reset src to reload the iframe
    }
  });

  observer.observe(parent, { attributes: true, attributeFilter: ['style'] });
});
