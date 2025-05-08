// windows.js - Window management system
import { getNextZIndex, isMobile } from "./core.js"

// Store window states for restore operations
const windowStates = {}

// Audio for window interactions
const toadHoverAudio = new Audio(
  "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/hover.mp3?v=1746577634973",
)
toadHoverAudio.volume = 0.5

// Initialize window controls
export function initWindowControls() {
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

    // Improved dragging logic with better performance
    setupWindowDragging(win, header)

    // Improved resizing with better touch support
    setupWindowResizing(win)

    // Double-click to maximize
    header.addEventListener("dblclick", (e) => {
      if (e.target.tagName !== "BUTTON") {
        toggleMaximizeWindow(id)
      }
    })
  })
}

// Setup window dragging with improved performance
function setupWindowDragging(win, header) {
  let isDragging = false
  let startX, startY, startLeft, startTop

  // Use pointer events for better cross-device support
  header.addEventListener("pointerdown", (e) => {
    if (e.target.tagName === "BUTTON") return
    if (win.classList.contains("maximized")) return

    isDragging = true
    startX = e.clientX
    startY = e.clientY
    startLeft = win.offsetLeft
    startTop = win.offsetTop

    win.style.zIndex = getNextZIndex()
    win.classList.add("dragging")

    // Capture pointer to improve dragging
    header.setPointerCapture(e.pointerId)

    // Prevent text selection during drag
    e.preventDefault()
  })

  header.addEventListener("pointermove", (e) => {
    if (!isDragging) return

    // Calculate new position with bounds checking
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    const newLeft = Math.max(0, Math.min(window.innerWidth - win.offsetWidth, startLeft + dx))
    const newTop = Math.max(0, Math.min(window.innerHeight - win.offsetHeight, startTop + dy))

    win.style.left = `${newLeft}px`
    win.style.top = `${newTop}px`
  })

  header.addEventListener("pointerup", (e) => {
    if (isDragging) {
      isDragging = false
      win.classList.remove("dragging")
      header.releasePointerCapture(e.pointerId)
    }
  })

  header.addEventListener("pointercancel", (e) => {
    if (isDragging) {
      isDragging = false
      win.classList.remove("dragging")
      header.releasePointerCapture(e.pointerId)
    }
  })
}

// Setup window resizing with improved touch support
function setupWindowResizing(win) {
  const directions = ["top", "right", "bottom", "left", "top-left", "top-right", "bottom-left", "bottom-right"]

  directions.forEach((dir) => {
    const resizer = document.createElement("div")
    resizer.classList.add("resizer", `resizer-${dir}`)
    resizer.setAttribute("role", "presentation")
    resizer.setAttribute("aria-hidden", "true")
    win.appendChild(resizer)

    let isResizing = false
    let startX, startY, startWidth, startHeight, startTop, startLeft

    // Use pointer events for better cross-device support
    resizer.addEventListener("pointerdown", (e) => {
      if (win.classList.contains("maximized")) return

      e.preventDefault()
      e.stopPropagation()

      isResizing = true
      win.classList.add("resizing")

      startX = e.clientX
      startY = e.clientY
      startWidth = win.offsetWidth
      startHeight = win.offsetHeight
      startTop = win.offsetTop
      startLeft = win.offsetLeft

      // Capture pointer to improve resizing
      resizer.setPointerCapture(e.pointerId)

      // Bring window to front when resizing
      win.style.zIndex = getNextZIndex()
    })

    resizer.addEventListener("pointermove", (e) => {
      if (!isResizing) return

      // Calculate new dimensions with minimum size constraints
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

      // Apply new dimensions with bounds checking
      newLeft = Math.max(0, Math.min(window.innerWidth - newWidth, newLeft))
      newTop = Math.max(0, Math.min(window.innerHeight - newHeight, newTop))

      win.style.width = `${newWidth}px`
      win.style.height = `${newHeight}px`
      win.style.top = `${newTop}px`
      win.style.left = `${newLeft}px`
    })

    resizer.addEventListener("pointerup", (e) => {
      if (isResizing) {
        isResizing = false
        win.classList.remove("resizing")
        resizer.releasePointerCapture(e.pointerId)
      }
    })

    resizer.addEventListener("pointercancel", (e) => {
      if (isResizing) {
        isResizing = false
        win.classList.remove("resizing")
        resizer.releasePointerCapture(e.pointerId)
      }
    })
  })
}

// Open window with improved loading and positioning
export function openWindow(id) {
  const win = document.getElementById(id)
  if (!win) return

  // Close start menu if open
  document.getElementById("start-menu").style.display = "none"

  // Remove active class from all windows
  document.querySelectorAll(".popup-window").forEach((w) => w.classList.remove("active"))

  // Center window if it doesn't have position yet
  if (!win.style.top || !win.style.left) {
    const winWidth = Math.min(800, window.innerWidth * 0.8)
    const winHeight = Math.min(600, window.innerHeight * 0.8)
    win.style.width = `${winWidth}px`
    win.style.height = `${winHeight}px`
    win.style.top = `${(window.innerHeight - winHeight) / 2}px`
    win.style.left = `${(window.innerWidth - winWidth) / 2}px`
  }

  // Lazy load content using IntersectionObserver pattern
  lazyLoadWindowContent(win)

  // Show window with animation
  win.classList.remove("hidden")
  win.classList.add("active")
  win.style.display = "flex"
  win.style.zIndex = getNextZIndex()
  win.classList.add("window-opening")

  // Remove animation class after completion
  setTimeout(() => win.classList.remove("window-opening"), 500)

  // Special handling for specific windows
  handleSpecialWindows(id)

  // Announce to screen readers
  announceWindowOpen(id)
}

// Lazy load window content
function lazyLoadWindowContent(win) {
  // Load iframes
  win.querySelectorAll("iframe[data-src]").forEach((iframe) => {
    if (!iframe.src) iframe.src = iframe.dataset.src
  })

  // Load and play videos
  win.querySelectorAll("video[data-src]").forEach((v) => {
    if (!v.src) {
      v.src = v.dataset.src
      v.load()
      if (!isMobile()) v.play().catch(() => {})
    }
  })
}

// Handle special windows that need initialization
function handleSpecialWindows(id) {
  if (id === "toader") {
    toadHoverAudio.currentTime = 0
    toadHoverAudio.play().catch(() => {})
  } else if (id === "music") {
    // Music player will be initialized by its own module
    const event = new CustomEvent("initMusicPlayer")
    window.dispatchEvent(event)
  } else if (id === "nature") {
    // Nature gallery will be initialized by its own module
    const event = new CustomEvent("initNatureGallery")
    window.dispatchEvent(event)
  }
}

// Announce window opening to screen readers
function announceWindowOpen(id) {
  const win = document.getElementById(id)
  if (!win) return

  const title = win.querySelector(".window-header span").textContent

  // Create temporary live region for announcement
  const liveRegion = document.createElement("div")
  liveRegion.setAttribute("aria-live", "polite")
  liveRegion.className = "sr-only"
  liveRegion.textContent = `${title} window opened`
  document.body.appendChild(liveRegion)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(liveRegion)
  }, 1000)
}

// Minimize window with improved animation and taskbar integration
export function minimizeWindow(id) {
  const win = document.getElementById(id)
  if (!win) return

  // Add minimizing animation
  win.classList.add("window-minimizing")

  setTimeout(() => {
    win.classList.remove("window-minimizing")
    win.classList.add("hidden")
    win.style.display = "none"

    // Create taskbar icon
    createTaskbarIcon(id)

    // Stop audio if it's the toader window
    if (id === "toader") {
      toadHoverAudio.pause()
      toadHoverAudio.currentTime = 0
    }
  }, 300)

  // Announce to screen readers
  const title = win.querySelector(".window-header span").textContent
  announceAction(`${title} minimized`)
}

// Create taskbar icon for minimized window
function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return

  const win = document.getElementById(id)
  const title = win ? win.querySelector(".window-header span").textContent.replace(".EXE", "") : id.toUpperCase()

  const btn = document.createElement("button")
  btn.id = `taskbar-icon-${id}`
  btn.className = "taskbar-icon"
  btn.setAttribute("aria-label", `Restore ${title} window`)

  const iconText = document.createElement("span")
  iconText.textContent = title
  btn.appendChild(iconText)

  btn.addEventListener("click", () => {
    openWindow(id)
    btn.remove()
  })

  document.getElementById("taskbar-icons").appendChild(btn)
}

// Close window with improved animation and cleanup
export function closeWindow(id) {
  const win = document.getElementById(id)
  if (!win) return

  // Add closing animation
  win.classList.add("window-closing")

  setTimeout(() => {
    // Pause/reset any media inside
    pauseWindowMedia(win)

    // Hide window
    win.classList.remove("window-closing")
    win.classList.add("hidden")
    win.style.display = "none"

    // Stop audio if it's the toader window
    if (id === "toader") {
      toadHoverAudio.pause()
      toadHoverAudio.currentTime = 0
    }
  }, 300)

  // Remove taskbar icon
  const icon = document.getElementById(`taskbar-icon-${id}`)
  if (icon) icon.remove()

  // Announce to screen readers
  const title = win.querySelector(".window-header span").textContent
  announceAction(`${title} closed`)
}

// Pause all media in a window
function pauseWindowMedia(win) {
  // Pause videos
  win.querySelectorAll("video").forEach((vid) => {
    vid.pause()
    vid.currentTime = 0
  })

  // Pause audio
  win.querySelectorAll("audio").forEach((audio) => {
    audio.pause()
    audio.currentTime = 0
  })
}

// Toggle maximize/restore window with improved animation
export function toggleMaximizeWindow(id) {
  const win = document.getElementById(id)
  if (!win) return

  const isMax = !win.classList.contains("maximized")

  if (isMax) {
    // Save current state for later restoration
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

    // Maximize with animation
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
        bottom: "36px", // Leave room for taskbar
        width: "auto",
        height: "auto",
        transform: "none",
        zIndex: getNextZIndex(),
      })
    }, 300)

    // Update ARIA attributes
    const maxButton = win.querySelector(".maximize")
    if (maxButton) {
      maxButton.setAttribute("aria-label", "Restore window")
    }

    // Announce to screen readers
    const title = win.querySelector(".window-header span").textContent
    announceAction(`${title} maximized`)
  } else {
    // Restore with animation
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

    // Update ARIA attributes
    const maxButton = win.querySelector(".maximize")
    if (maxButton) {
      maxButton.setAttribute("aria-label", "Maximize window")
    }

    // Announce to screen readers
    const title = win.querySelector(".window-header span").textContent
    announceAction(`${title} restored`)
  }
}

// Announce actions to screen readers
function announceAction(message) {
  const liveRegion = document.createElement("div")
  liveRegion.setAttribute("aria-live", "polite")
  liveRegion.className = "sr-only"
  liveRegion.textContent = message
  document.body.appendChild(liveRegion)

  setTimeout(() => {
    document.body.removeChild(liveRegion)
  }, 1000)
}

// Setup mobile-specific window enhancements
export function setupMobileWindowSupport() {
  if (!isMobile()) return

  // Add mobile close button for easier window management
  const mobileClose = document.createElement("button")
  mobileClose.className = "mobile-close"
  mobileClose.textContent = "✕"
  mobileClose.setAttribute("aria-label", "Close active window")
  mobileClose.addEventListener("click", () => {
    const activeWindow = document.querySelector(".popup-window.active")
    if (activeWindow) {
      closeWindow(activeWindow.id)
    }
  })
  document.body.appendChild(mobileClose)

  // Improve touch handling for windows
  document.querySelectorAll(".popup-window").forEach((win) => {
    const header = win.querySelector(".window-header")

    // Single tap to bring window to front
    win.addEventListener("touchstart", () => {
      win.style.zIndex = getNextZIndex()
    })

    // Double tap header to maximize
    let lastTap = 0
    header.addEventListener("touchend", (e) => {
      const currentTime = new Date().getTime()
      const tapLength = currentTime - lastTap
      if (tapLength < 500 && tapLength > 0) {
        toggleMaximizeWindow(win.id)
        e.preventDefault()
      }
      lastTap = currentTime
    })
  })
}
