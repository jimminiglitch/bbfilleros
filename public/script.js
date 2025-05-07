//────────────────────────────────────────────────────────────────────────────
//   Main Script (public/script.js) - ULTIMATE CYBERPUNK UPGRADE
//────────────────────────────────────────────────────────────────────────────

// Utility functions
function debounce(func, wait) {
  let timeout
  return function () {
    const args = arguments
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

// DOM ready handler with performance improvements
document.addEventListener("DOMContentLoaded", () => {
  // Initialize all windows once
  initWindowControls()

  // Start boot sequence
  runBootSequence().then(() => {
    initDesktopIcons()
    initStarfield()
    initAudioVisualizer()
    initDOSLoader()
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
        // Don't resize if maximized
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
  const win = document.getElementById(id)
  if (!win) return

  // 1) Hide start menu & deactivate other windows
  document.getElementById("start-menu").style.display = "none"
  document.querySelectorAll(".popup-window").forEach((w) => w.classList.remove("active"))

  // 2) Lazy-load any <iframe data-src> in this window
  win.querySelectorAll("iframe[data-src]").forEach((iframe) => {
    if (!iframe.src) {
      iframe.src = iframe.dataset.src
    }
  })

  // 3) If this is the Toader window, play hover audio
  if (id === "toader") {
    const audio = document.getElementById("toader-audio")
    if (audio && audio.paused) {
      audio.volume = 0.6
      audio.play().catch(() => {})
    }
  }

  if (id === "TIGERRR") {
    const audio = document.getElementById("TIGERRR-audio")
    if (audio && audio.paused) {
      audio.volume = 0.6
      audio.play().catch(() => {})
    }
  }

  // 4) Lazy-load any <video data-src> in this window
  win.querySelectorAll("video[data-src]").forEach((v) => {
    if (!v.src) {
      v.src = v.dataset.src
      v.load()
      // Only play if not on mobile (to avoid autoplay restrictions)
      if (!isMobile()) {
        v.play().catch(() => {
          /* may require user gesture */
        })
      }
    }
  })

  // 5) Show & focus
  win.classList.remove("hidden")
  win.classList.add("active")
  win.style.display = "flex"
  win.style.zIndex = getNextZIndex()

  // Add opening animation
  win.classList.add("window-opening")
  setTimeout(() => {
    win.classList.remove("window-opening")
  }, 500)

  // 6) Restore previous bounds or adapt to screen size
  const isMobileView = isMobile()

  if (isMobileView) {
    // On mobile, position window to fill the screen
    Object.assign(win.style, {
      top: "0",
      left: "0",
      width: "100vw",
      height: `calc(100vh - 36px)`,
      transform: "none",
    })
  } else {
    // On desktop, restore previous bounds
    const stored = windowStates[id]
    if (stored) Object.assign(win.style, stored)

    // 7) Clamp window to viewport
    const rect = win.getBoundingClientRect()
    const margin = 20
    const vw = window.innerWidth
    const vh = window.innerHeight
    let newW = rect.width,
      newH = rect.height,
      newLeft = rect.left,
      newTop = rect.top

    if (rect.width > vw - margin * 2) newW = vw - margin * 2
    if (rect.height > vh - margin * 2) newH = vh - margin * 2
    if (rect.left < margin) newLeft = margin
    if (rect.top < margin) newTop = margin
    if (rect.right > vw - margin) newLeft = vw - margin - newW
    if (rect.bottom > vh - margin) newTop = vh - margin - newH

    Object.assign(win.style, {
      width: `${newW}px`,
      height: `${newH}px`,
      left: `${newLeft}px`,
      top: `${newTop}px`,
    })
  }

  // 8) Special handling for games
  if (id === "snake") {
    initSnakeGame()
  } else if (id === "tetris") {
    initTetrisGame()
  } else if (id === "music") {
    initMusicPlayer()
  }
}

// Helper function to detect mobile devices
function isMobile() {
  return window.innerWidth < 768
}

function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return

  // Get window title
  const win = document.getElementById(id)
  const title = win ? win.querySelector(".window-header span").textContent.replace(".EXE", "") : id.toUpperCase()

  const btn = document.createElement("button")
  btn.id = `taskbar-icon-${id}`
  btn.className = "taskbar-icon"

  // Create icon with glow effect
  const iconText = document.createElement("span")
  iconText.textContent = title
  btn.appendChild(iconText)

  btn.addEventListener("click", () => {
    openWindow(id)
    btn.remove()
  })

  // Add hover effect
  btn.addEventListener("mouseenter", () => {
    playSound("hover")
  })

  document.getElementById("taskbar-icons").appendChild(btn)
}

function minimizeWindow(id) {
  const win = document.getElementById(id)
  if (!win) return

  // Add minimizing animation
  win.classList.add("window-minimizing")

  setTimeout(() => {
    win.classList.remove("window-minimizing")
    win.classList.add("hidden")
    win.style.display = "none"
    createTaskbarIcon(id)
  }, 300)
}

function closeWindow(id) {
  const win = document.getElementById(id)
  if (win) {
    // Add closing animation
    win.classList.add("window-closing")

    setTimeout(() => {
      // pause any <video> inside
      const vid = win.querySelector("video")
      if (vid) {
        vid.pause()
        vid.currentTime = 0
      }
      win.classList.remove("window-closing")
      win.classList.add("hidden")
      win.style.display = "none"

      if (id === "toader") {
        const audio = document.getElementById("toader-audio")
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
      }

      // Stop any games
      if (id === "snake" || id === "tetris") {
        // Stop game loops if needed
      }
    }, 300)
  }

  const icon = document.getElementById(`taskbar-icon-${id}`)
  if (icon) icon.remove()

}

function toggleMaximizeWindow(id) {
  const win = document.getElementById(id)
  if (!win) return

  const isMax = !win.classList.contains("maximized")


  if (isMax) {
    // save its old parent & styles
    const prev = (windowStates[id] = {
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
    })

    // Add maximizing animation
    win.classList.add("window-maximizing")

    setTimeout(() => {
      // move it into body so it's never clipped
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

      // restore its styles
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

      // and put it back where it came from
      if (prev.parent) {
        prev.parent.insertBefore(win, prev.next)
      }

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

    // Add pulsing effect on seconds change
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
    // Hide with animation
    m.classList.add("menu-hiding")
    setTimeout(() => {
      m.style.display = "none"
      m.classList.remove("menu-hiding")
    }, 300)
  } else {
    // Show with animation
    m.style.display = "flex"
    m.classList.add("menu-showing")
    setTimeout(() => {
      m.classList.remove("menu-showing")
    }, 300)
  }

})

// 4) BOOT SEQUENCE (run on DOMContentLoaded)
function runBootSequence() {
  return new Promise(resolve => {
    const bootScreen = document.getElementById("bootScreen")
    const logEl      = document.getElementById("boot-log")
    const progress   = document.getElementById("progress-bar")
    if (!bootScreen || !logEl || !progress) {
      console.warn("Missing bootScreen elements, skipping boot.")
      resolve()
      return
    }

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

      // Play typing sound
      playSound("type")

      idx++
      if (idx === total) {
        clearInterval(typer)
        setTimeout(() => {
          bootScreen.style.transition = "opacity 0.8s"
          bootScreen.style.opacity = "0"

          // Play boot complete sound
          playSound("bootComplete")

          setTimeout(() => {
            bootScreen.style.display = "none"
            resolve()
          }, 800)
        }, 500)
      }
    }, delay)
  })
}

// 5) DESKTOP ICONS (single-click to open + drag-group)
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach((icon) => {
    // open on double click
    icon.addEventListener("dbl-click", () => {
      openWindow(icon.dataset.window)
    })

    // Add hover effect
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

// 7) STARFIELD BACKGROUND - Optimized with requestAnimationFrame
function initStarfield() {
  const canvas = document.getElementById("background-canvas")
  const ctx = canvas.getContext("2d")

  // Resize handler with debounce
  const handleResize = debounce(() => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    // Regenerate stars when canvas size changes
    initStars()
  }, 250)

  window.addEventListener("resize", handleResize)

  // Initial setup
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const numStars = 300
  const stars = Array.from({ length: numStars }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * canvas.width,
    o: Math.random(),
    color: getRandomStarColor(),
  }))

  let lastTime = 0
  const fps = 120 // Lower FPS for better performance
  const frameInterval = 1000 / fps

  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp
    const elapsed = timestamp - lastTime

    if (elapsed > frameInterval) {
      lastTime = timestamp - (elapsed % frameInterval)

      ctx.fillStyle = "rgba(0,0,0,0.4)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Process stars in batches for better performance
      const batchSize = Math.min(100, stars.length)
      for (let i = 0; i < batchSize; i++) {
        const s = stars[i]
        s.z -= 2
        if (s.z <= 0) {
          s.z = canvas.width
          s.x = Math.random() * canvas.width
          s.y = Math.random() * canvas.height
          s.o = Math.random()
          s.color = getRandomStarColor()
        }
        const k = 128.0 / s.z
        const px = (s.x - canvas.width / 2) * k + canvas.width / 2
        const py = (s.y - canvas.height / 2) * k + canvas.width / 2
        const sz = Math.max(0, (1 - s.z / canvas.width) * 3)
        ctx.globalAlpha = s.o
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(px, py, sz, 0, Math.PI * 2)
        ctx.fill()
      }

      // Move processed stars to the end of the array
      stars.push(...stars.splice(0, batchSize))
    }

    ctx.globalAlpha = 1
    requestAnimationFrame(animate)
  }

  // Initialize stars
  function initStars() {
    for (let i = 0; i < stars.length; i++) {
      stars[i] = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * canvas.width,
        o: Math.random(),
        color: getRandomStarColor(),
      }
    }
  }

  function getRandomStarColor() {
    const colors = [
      "#ffffff", // white
      "#a9a1ff", // purple
      "#f3a1ff", // pink
      "#00f0ff", // cyan
      "#fffc00", // yellow
      "#00ff66", // green
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Start animation
  requestAnimationFrame(animate)
}

// 8) AUDIO VISUALIZER
function initAudioVisualizer() {
  const canvas = document.createElement("canvas")
  canvas.id = "audio-visualizer"
  canvas.width = window.innerWidth
  canvas.height = 100
  document.body.appendChild(canvas)

  const ctx = canvas.getContext("2d")

  // Create audio context and analyzer
  let audioContext, analyzer, dataArray

  function setupAudio() {
    if (audioContext) return

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      analyzer = audioContext.createAnalyser()
      analyzer.fftSize = 256

      // Connect to all audio elements
      document.querySelectorAll("audio").forEach((audio) => {
        if (!audio.visualizerSource) {
          const source = audioContext.createMediaElementSource(audio)
          source.connect(analyzer)
          analyzer.connect(audioContext.destination)
          audio.visualizerSource = source
        }
      })

      dataArray = new Uint8Array(analyzer.frequencyBinCount)
    } catch (e) {
      console.error("Web Audio API not supported:", e)
    }
  }

  // Resize handler
  window.addEventListener(
    "resize",
    debounce(() => {
      canvas.width = window.innerWidth
    }, 250),
  )

  // Animation loop
  function drawVisualizer() {
    if (!audioContext || !analyzer) {
      requestAnimationFrame(drawVisualizer)
      return
    }

    analyzer.getByteFrequencyData(dataArray)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const barWidth = canvas.width / analyzer.frequencyBinCount
    let x = 0

    for (let i = 0; i < analyzer.frequencyBinCount; i++) {
      const barHeight = dataArray[i] / 2

      // Create gradient based on frequency
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight)
      gradient.addColorStop(0, "#00f0ff")
      gradient.addColorStop(0.5, "#f3a1ff")
      gradient.addColorStop(1, "#fffc00")

      ctx.fillStyle = gradient
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)

      x += barWidth
    }

    requestAnimationFrame(drawVisualizer)
  }

  // Start visualizer when audio plays
  document.addEventListener(
    "play",
    (e) => {
      if (e.target.tagName === "AUDIO") {
        setupAudio()
        audioContext.resume()
      }
    },
    true,
  )

  // Start animation loop
  requestAnimationFrame(drawVisualizer)
}

// 9) GLITCH EFFECTS
function initGlitchEffects() {
  // Random glitch effect on elements with .glitch-me class
  setInterval(() => {
    document.querySelectorAll(".glitch-me").forEach((el) => {
      if (Math.random() > 0.95) {
        el.classList.add("glitching")
        setTimeout(
          () => {
            el.classList.remove("glitching")
          },
          200 + Math.random() * 400,
        )
      }
    })
  }, 2000)

  // Occasional screen glitch
  setInterval(() => {
    if (Math.random() > 0.98) {
      const glitch = document.createElement("div")
      glitch.className = "screen-glitch"
      document.body.appendChild(glitch)

      setTimeout(
        () => {
          glitch.remove()
        },
        150 + Math.random() * 250,
      )
    }
  }, 10000)
}

// 12) TETRIS GAME
function initTetrisGame() {
  const tetrisWindow = document.getElementById("tetris")
  if (!tetrisWindow) return

  const canvas = tetrisWindow.querySelector("canvas")
  if (!canvas) return

  const ctx = canvas.getContext("2d")

  // Set canvas size to fit window
  function resizeCanvas() {
    const content = tetrisWindow.querySelector(".window-content")
    canvas.width = content.clientWidth
    canvas.height = content.clientHeight
  }

  resizeCanvas()

  // Game variables
  const COLS = 10
  const ROWS = 20
  const BLOCK_SIZE = Math.min(Math.floor(canvas.width / COLS), Math.floor(canvas.height / ROWS))
  const BOARD_WIDTH = COLS * BLOCK_SIZE
  const BOARD_HEIGHT = ROWS * BLOCK_SIZE
  const BOARD_X = (canvas.width - BOARD_WIDTH) / 2
  const BOARD_Y = (canvas.height - BOARD_HEIGHT) / 2

  let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  let currentPiece = null
  let score = 0
  let level = 1
  let lines = 0
  let gameOver = false
  let gameStarted = false
  let paused = false
  let dropCounter = 0
  let dropInterval = 1000

  // Tetromino shapes and colors
  const SHAPES = [
    // I
    {
      shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      color: "#00f0ff",
    },
    // J
    {
      shape: [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0],
      ],
      color: "#0000ff",
    },
    // L
    {
      shape: [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0],
      ],
      color: "#ff7700",
    },
    // O
    {
      shape: [
        [4, 4],
        [4, 4],
      ],
      color: "#fffc00",
    },
    // S
    {
      shape: [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0],
      ],
      color: "#00ff66",
    },
    // T
    {
      shape: [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0],
      ],
      color: "#f3a1ff",
    },
    // Z
    {
      shape: [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
      ],
      color: "#ff0000",
    },
  ]

  // Get random tetromino
  function getRandomPiece() {
    const piece = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    return {
      shape: piece.shape,
      color: piece.color,
      x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2),
      y: 0,
    }
  }

  // Draw functions
  function drawGame() {
    if (paused) return

    // Clear canvas
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw board background
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)"
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT)

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath()
      ctx.moveTo(BOARD_X + x * BLOCK_SIZE, BOARD_Y)
      ctx.lineTo(BOARD_X + x * BLOCK_SIZE, BOARD_Y + BOARD_HEIGHT)
      ctx.stroke()
    }

    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath()
      ctx.moveTo(BOARD_X, BOARD_Y + y * BLOCK_SIZE)
      ctx.lineTo(BOARD_X + BOARD_WIDTH, BOARD_Y + y * BLOCK_SIZE)
      ctx.stroke()
    }

    // Draw board
    drawBoard()

    // Draw current piece
    if (currentPiece) {
      drawPiece(currentPiece)
    }

    // Draw score and level
    drawStats()

    // Draw game over or start screen
    if (gameOver) {
      drawGameOver()
    } else if (!gameStarted) {
      drawStartScreen()
    }
  }

  function drawBoard() {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]) {
          const colorIndex = board[y][x] - 1
          drawBlock(x, y, SHAPES[colorIndex].color)
        }
      }
    }
  }

  function drawPiece(piece) {
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          drawBlock(piece.x + x, piece.y + y, piece.color)
        }
      })
    })
  }

  function drawBlock(x, y, color) {
    const blockX = BOARD_X + x * BLOCK_SIZE
    const blockY = BOARD_Y + y * BLOCK_SIZE

    // Glow effect
    ctx.shadowBlur = 10
    ctx.shadowColor = color

    // Draw block
    ctx.fillStyle = color
    roundRect(ctx, blockX + 1, blockY + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2, 4, true)

    // Draw highlight
    ctx.shadowBlur = 0
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
    ctx.fillRect(blockX + 3, blockY + 3, BLOCK_SIZE - 6, 2)
    ctx.fillRect(blockX + 3, blockY + 3, 2, BLOCK_SIZE - 6)

    // Draw outline
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
    ctx.lineWidth = 1
    roundRect(ctx, blockX + 1, blockY + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2, 4, false, true)
  }

  function drawStats() {
    ctx.fillStyle = "#fff"
    ctx.font = '16px "Press Start 2P"'
    ctx.textAlign = "left"
    ctx.fillText(`Score: ${score}`, 20, 30)
    ctx.fillText(`Level: ${level}`, 20, 60)
    ctx.fillText(`Lines: ${lines}`, 20, 90)
  }

  function drawGameOver() {
    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Game over text
    ctx.fillStyle = "#f3a1ff"
    ctx.font = '30px "Press Start 2P"'
    ctx.textAlign = "center"
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40)

    // Score
    ctx.fillStyle = "#00f0ff"
    ctx.font = '20px "Press Start 2P"'
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2)

    // Restart instructions
    ctx.fillStyle = "#fffc00"
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText("Press SPACE to restart", canvas.width / 2, canvas.height / 2 + 40)
  }

  function drawStartScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Title
    ctx.fillStyle = "#00f0ff"
    ctx.font = '30px "Press Start 2P"'
    ctx.textAlign = "center"
    ctx.fillText("CYBER TETRIS", canvas.width / 2, canvas.height / 2 - 60)

    // Instructions
    ctx.fillStyle = "#f3a1ff"
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText("← → : Move", canvas.width / 2, canvas.height / 2 - 20)
    ctx.fillText("↑ : Rotate", canvas.width / 2, canvas.height / 2 + 10)
    ctx.fillText("↓ : Soft Drop", canvas.width / 2, canvas.height / 2 + 40)

    // Start instructions
    ctx.fillStyle = "#fffc00"
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText("Press SPACE to start", canvas.width / 2, canvas.height / 2 + 80)
  }

  // Helper function for rounded rectangles
  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    if (fill) {
      ctx.fill()
    }
    if (stroke) {
      ctx.stroke()
    }
  }

  // Game logic
  function updateGame(deltaTime) {
    if (gameOver || !gameStarted || paused) return

    dropCounter += deltaTime
    if (dropCounter > dropInterval) {
      moveDown()
      dropCounter = 0
    }
  }

  function moveDown() {
    currentPiece.y++
    if (checkCollision()) {
      currentPiece.y--
      mergePiece()
      clearLines()
      currentPiece = getRandomPiece()

      // Check if game over
      if (checkCollision()) {
        gameOver = true
        playSound("error", 0.5)
      }
    }
  }

  function moveLeft() {
    currentPiece.x--
    if (checkCollision()) {
      currentPiece.x++
    } else {
      playSound("click", 0.2)
    }
  }

  function moveRight() {
    currentPiece.x++
    if (checkCollision()) {
      currentPiece.x--
    } else {
      playSound("click", 0.2)
    }
  }

  function rotate() {
    const originalShape = currentPiece.shape

    // Create new rotated shape
    const newShape = []
    for (let y = 0; y < originalShape[0].length; y++) {
      newShape.push([])
      for (let x = 0; x < originalShape.length; x++) {
        newShape[y].push(originalShape[originalShape.length - 1 - x][y])
      }
    }

    // Try rotation
    currentPiece.shape = newShape

    // If collision, revert
    if (checkCollision()) {
      currentPiece.shape = originalShape
    } else {
      playSound("click", 0.3)
    }
  }

  function checkCollision() {
    return currentPiece.shape.some((row, dy) => {
      return row.some((value, dx) => {
        if (!value) return false

        const newX = currentPiece.x + dx
        const newY = currentPiece.y + dy

        return newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])
      })
    })
  }

  function mergePiece() {
    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const boardY = currentPiece.y + y
          const boardX = currentPiece.x + x

          if (boardY >= 0) {
            // Store the index of the shape + 1 (0 means empty)
            const shapeIndex = SHAPES.findIndex((s) => s.color === currentPiece.color) + 1
            board[boardY][boardX] = shapeIndex
          }
        }
      })
    })

    playSound("success", 0.3)
  }

  function clearLines() {
    let linesCleared = 0

    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every((value) => value !== 0)) {
        // Line is full
        linesCleared++

        // Remove line
        board.splice(y, 1)

        // Add empty line at top
        board.unshift(Array(COLS).fill(0))

        // Check same line again (since we moved everything down)
        y++
      }
    }

    if (linesCleared > 0) {
      // Update score
      const points = [0, 100, 300, 500, 800]
      score += points[linesCleared] * level

      // Update lines and level
      lines += linesCleared
      level = Math.floor(lines / 10) + 1

      // Update drop speed
      dropInterval = Math.max(100, 1000 - (level - 1) * 100)

      // Play sound
      playSound("success", 0.5)
    }
  }

  function resetGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0))
    currentPiece = getRandomPiece()
    score = 0
    level = 1
    lines = 0
    gameOver = false
    dropCounter = 0
    dropInterval = 1000
  }

  // Input handling
  function handleKeyDown(e) {
    if (e.key === " " || e.code === "Space") {
      if (gameOver) {
        resetGame()
        gameStarted = true
        playSound("click")
      } else if (!gameStarted) {
        gameStarted = true
        currentPiece = getRandomPiece()
        playSound("click")
      } else {
        paused = !paused
        playSound("click")
      }
      e.preventDefault()
    }

    if (!gameStarted || gameOver || paused) return

    switch (e.key) {
      case "ArrowUp":
        rotate()
        e.preventDefault()
        break
      case "ArrowDown":
        moveDown()
        e.preventDefault()
        break
      case "ArrowLeft":
        moveLeft()
        e.preventDefault()
        break
      case "ArrowRight":
        moveRight()
        e.preventDefault()
        break
    }
  }

  // Touch controls for mobile
  let touchStartX = 0
  let touchStartY = 0

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
    e.preventDefault()
  }

  function handleTouchMove(e) {
    if (!touchStartX || !touchStartY) return

    const touchEndX = e.touches[0].clientX
    const touchEndY = e.touches[0].clientY

    const dx = touchEndX - touchStartX
    const dy = touchEndY - touchStartY

    // Determine swipe direction
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0) {
        moveRight()
      } else {
        moveLeft()
      }
      touchStartX = touchEndX
      touchStartY = touchEndY
    } else if (Math.abs(dy) > 30 && Math.abs(dy) > Math.abs(dx)) {
      // Vertical swipe
      if (dy > 0) {
        moveDown()
      } else {
        rotate()
      }
      touchStartX = touchEndX
      touchStartY = touchEndY
    }

    e.preventDefault()
  }

  // Add event listeners
  window.addEventListener("keydown", handleKeyDown)
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false })

  // Add tap to start/restart
  canvas.addEventListener("click", () => {
    if (gameOver) {
      resetGame()
      gameStarted = true
      playSound("click")
    } else if (!gameStarted) {
      gameStarted = true
      currentPiece = getRandomPiece()
      playSound("click")
    }
  })

  // Game loop
  let lastTime = 0

  function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime
    lastTime = timestamp

    drawGame()
    updateGame(deltaTime)

    requestAnimationFrame(gameLoop)
  }

  // Start game loop
  requestAnimationFrame(gameLoop)

  // Handle window resize
  window.addEventListener(
    "resize",
    debounce(() => {
      resizeCanvas()
    }, 250),
  )
}


// 15) MUSIC PLAYER
function initMusicPlayer() {
  const musicWindow = document.getElementById("music")
  if (!musicWindow) return

  const content = musicWindow.querySelector(".window-content")
  if (!content) return

  // Music tracks
  const tracks = [
    {
      title: "Synthwave Dreams",
      artist: "NeonRider",
      duration: "3:45",
      url: "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/synthwave-dreams.mp3",
    },
    {
      title: "Cyber City Nights",
      artist: "DigitalPulse",
      duration: "4:12",
      url: "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/cyber-city-nights.mp3",
    },
    {
      title: "Neon Horizon",
      artist: "RetroWave",
      duration: "3:30",
      url: "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/neon-horizon.mp3",
    },
    {
      title: "Digital Sunset",
      artist: "VaporGrid",
      duration: "5:10",
      url: "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/digital-sunset.mp3",
    },
    {
      title: "Arcade Dreams",
      artist: "PixelPulse",
      duration: "4:05",
      url: "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/arcade-dreams.mp3",
    },
  ]

  // Create music player interface
  const playerInterface = document.createElement("div")
  playerInterface.className = "music-player-interface"
  content.appendChild(playerInterface)

  // Create visualizer
  const visualizer = document.createElement("canvas")
  visualizer.className = "music-visualizer"
  visualizer.width = 500
  visualizer.height = 150
  playerInterface.appendChild(visualizer)

  // Create now playing
  const nowPlaying = document.createElement("div")
  nowPlaying.className = "now-playing"
  playerInterface.appendChild(nowPlaying)

  // Create controls
  const controls = document.createElement("div")
  controls.className = "player-controls"
  playerInterface.appendChild(controls)

  // Create progress bar
  const progressContainer = document.createElement("div")
  progressContainer.className = "progress-container"
  playerInterface.appendChild(progressContainer)

  const progressBar = document.createElement("div")
  progressBar.className = "progress-bar"
  progressContainer.appendChild(progressBar)

  // Create playlist
  const playlist = document.createElement("div")
  playlist.className = "playlist"
  playerInterface.appendChild(playlist)

  // Add tracks to playlist
  tracks.forEach((track, index) => {
    const trackItem = document.createElement("div")
    trackItem.className = "track-item"
    trackItem.innerHTML = `
      <div class="track-number">${index + 1}</div>
      <div class="track-info">
        <div class="track-title">${track.title}</div>
        <div class="track-artist">${track.artist}</div>
      </div>
      <div class="track-duration">${track.duration}</div>
    `
    playlist.appendChild(trackItem)

    // Play track on click
    trackItem.addEventListener("click", () => {
      currentTrack = index
      loadTrack(currentTrack)
      playTrack()
    })
  })

  // Create audio element
  const audio = document.createElement("audio")
  audio.id = "audio-player"

  // Player variables
  let currentTrack = 0
  let isPlaying = false

  // Create control buttons
  const prevButton = document.createElement("button")
  prevButton.className = "player-button prev-button"
  prevButton.innerHTML = '<i class="prev-icon">⏮</i>'
  controls.appendChild(prevButton)

  const playButton = document.createElement("button")
  playButton.className = "player-button play-button"
  playButton.innerHTML = '<i class="play-icon">▶</i>'
  controls.appendChild(playButton)

  const nextButton = document.createElement("button")
  nextButton.className = "player-button next-button"
  nextButton.innerHTML = '<i class="next-icon">⏭</i>'
  controls.appendChild(nextButton)

  // Event listeners
  prevButton.addEventListener("click", () => {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length
    loadTrack(currentTrack)
    playTrack()
  })

  playButton.addEventListener("click", () => {
    if (isPlaying) {
      pauseTrack()
    } else {
      playTrack()
    }
  })

  nextButton.addEventListener("click", () => {
    currentTrack = (currentTrack + 1) % tracks.length
    loadTrack(currentTrack)
    playTrack()
  })

  // Progress bar update
  audio.addEventListener("timeupdate", () => {
    const progress = (audio.currentTime / audio.duration) * 100
    progressBar.style.width = `${progress}%`
  })

  // Click on progress bar
  progressContainer.addEventListener("click", (e) => {
    const width = progressContainer.clientWidth
    const clickX = e.offsetX
    const duration = audio.duration

    audio.currentTime = (clickX / width) * duration
  })

  // Track ended
  audio.addEventListener("ended", () => {
    currentTrack = (currentTrack + 1) % tracks.length
    loadTrack(currentTrack)
    playTrack()
  })

  // Load track
  function loadTrack(index) {
    audio.src = tracks[index].url
    audio.load()

    // Update now playing
    nowPlaying.innerHTML = `
      <div class="now-playing-title">${tracks[index].title}</div>
      <div class="now-playing-artist">${tracks[index].artist}</div>
    `

    // Highlight current track
    document.querySelectorAll(".track-item").forEach((item, i) => {
      if (i === index) {
        item.classList.add("active")
      } else {
        item.classList.remove("active")
      }
    })
  }

  // Play track
  function playTrack() {
    audio.play()
    isPlaying = true
    playButton.innerHTML = '<i class="pause-icon">⏸</i>'

    // Start visualizer
    startVisualizer()
  }

  // Pause track
  function pauseTrack() {
    audio.pause()
    isPlaying = false
    playButton.innerHTML = '<i class="play-icon">▶</i>'
  }

  // Visualizer
  let audioContext, analyser, dataArray

  function startVisualizer() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 256

      const source = audioContext.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(audioContext.destination)

      dataArray = new Uint8Array(analyser.frequencyBinCount)
    }

    audioContext.resume()
    drawVisualizer()
  }

  function drawVisualizer() {
    if (!audioContext || !isPlaying) return

    requestAnimationFrame(drawVisualizer)

    const ctx = visualizer.getContext("2d")
    const width = visualizer.width
    const height = visualizer.height

    analyser.getByteFrequencyData(dataArray)

    ctx.clearRect(0, 0, width, height)

    const barWidth = width / analyser.frequencyBinCount
    let x = 0

    for (let i = 0; i < analyser.frequencyBinCount; i++) {
      const barHeight = dataArray[i] / 2

      // Create gradient
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
      gradient.addColorStop(0, "#00f0ff")
      gradient.addColorStop(0.5, "#f3a1ff")
      gradient.addColorStop(1, "#fffc00")

      ctx.fillStyle = gradient
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)

      x += barWidth
    }
  }

  // Initialize player
  loadTrack(currentTrack)
}



// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll(".glitch").forEach((el) => {
    el.classList.add("glitch-me")
  })

  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll(".glitch-me")
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add("glitching")
      setTimeout(() => {
        randomElement.classList.remove("glitching")
      }, 200)
    }
  }, 3000)
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll(".glitch").forEach((el) => {
    el.classList.add("glitch-me")
  })

  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll(".glitch-me")
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add("glitching")
      setTimeout(() => {
        randomElement.classList.remove("glitching")
      }, 200)
    }
  }, 3000)
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll(".glitch").forEach((el) => {
    el.classList.add("glitch-me")
  })

  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll(".glitch-me")
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add("glitching")
      setTimeout(() => {
        randomElement.classList.remove("glitching")
      }, 200)
    }
  }, 3000)
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll(".glitch").forEach((el) => {
    el.classList.add("glitch-me")
  })

  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll(".glitch-me")
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add("glitching")
      setTimeout(() => {
        randomElement.classList.remove("glitching")
      }, 200)
    }
  }, 3000)
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll(".glitch").forEach((el) => {
    el.classList.add("glitch-me")
  })

  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll(".glitch-me")
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add("glitching")
      setTimeout(() => {
        randomElement.classList.remove("glitching")
      }, 200)
    }
  }, 3000)
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll(".glitch").forEach((el) => {
    el.classList.add("glitch-me")
  })

  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll(".glitch-me")
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add("glitching")
      setTimeout(() => {
        randomElement.classList.remove("glitching")
      }, 200)
    }
  }, 3000)
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll(".glitch").forEach((el) => {
    el.classList.add("glitch-me")
  })

  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll(".glitch-me")
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add("glitching")
      setTimeout(() => {
        randomElement.classList.remove("glitching")
      }, 200)
    }
  }, 3000)
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll(".glitch").forEach((el) => {
    el.classList.add("glitch-me")
  })

  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll(".glitch-me")
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add("glitching")
      setTimeout(() => {
        randomElement.classList.remove("glitching")
      }, 200)
    }
  }, 3000)
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll(".glitch").forEach((el) => {
    el.classList.add("glitch-me")
  })

  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll(".glitch-me")
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add("glitching")
      setTimeout(() => {
        randomElement.classList.remove("glitching")
      }, 200)
    }
  }, 3000)
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll(".glitch").forEach((el) => {
    el.classList.add("glitch-me")
  })

  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll(".glitch-me")
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add("glitching")
      setTimeout(() => {
        randomElement.classList.remove("glitching")
      }, 200)
    }
  }, 3000)
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll(".glitch").forEach((el) => {
    el.classList.add("glitch-me")
  })

  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll(".glitch-me")
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add("glitching")
      setTimeout(() => {
        randomElement.classList.remove("glitching")
      }, 200)
    }
  }, 3000)
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll(".glitch").forEach((el) => {
    el.classList.add("glitch-me")
  })

  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll(".glitch-me")
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add("glitching")
      setTimeout(() => {
        randomElement.classList.remove("glitching")
      }, 200)
    }
  }, 3000)
}

// Initialize event listeners
window.addEventListener("mousedown", onSelectStart)

// Initialize glitch effects
function initGlitchEffects() {
  // Add glitch class to elements
  document.querySelectorAll('.glitch').forEach(el => {
    el.classList.add('glitch-me')
  })
  
  // Random glitch effect
  setInterval(() => {
    const elements = document.querySelectorAll('.glitch-me')
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)]
      randomElement.classList.add('glitching')
      setTimeout(() => {
        randomElement.classList.remove('glitching')
      }, 200)
    }
  }, 3000)
