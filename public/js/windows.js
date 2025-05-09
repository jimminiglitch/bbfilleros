/**
 * Enhanced Window Management System
 * Improves dragging, minimizing, maximizing, and z-index handling
 */

class WindowManager {
  constructor() {
    this.windows = []
    this.activeWindow = null
    this.highestZIndex = 100
    this.isMobile = window.innerWidth < 768

    // Track window state
    this.minimizedWindows = new Set()

    // Bind methods
    this.handleResize = this.handleResize.bind(this)

    // Set up event listeners
    window.addEventListener("resize", this.handleResize)

    // Initialize
    this.init()
  }

  init() {
    // Find all existing windows
    const windowElements = document.querySelectorAll(".window")
    windowElements.forEach((windowEl) => this.registerWindow(windowEl))

    // Add touch support
    this.addTouchSupport()
  }

  registerWindow(windowEl) {
    // Skip if already registered
    if (windowEl.dataset.registered === "true") return

    // Set initial z-index if not set
    if (!windowEl.style.zIndex) {
      windowEl.style.zIndex = this.highestZIndex++
    }

    // Add to windows array
    this.windows.push(windowEl)

    // Mark as registered
    windowEl.dataset.registered = "true"

    // Set up event listeners
    this.setupWindowEvents(windowEl)

    return windowEl
  }

  setupWindowEvents(windowEl) {
    const titleBar = windowEl.querySelector(".window-titlebar") || windowEl.querySelector(".titlebar")
    const closeBtn = windowEl.querySelector(".close-button") || windowEl.querySelector(".close")
    const minimizeBtn = windowEl.querySelector(".minimize-button") || windowEl.querySelector(".minimize")
    const maximizeBtn = windowEl.querySelector(".maximize-button") || windowEl.querySelector(".maximize")

    // Make window draggable via titlebar
    if (titleBar) {
      this.makeDraggable(windowEl, titleBar)
    }

    // Window controls
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeWindow(windowEl))
    }

    if (minimizeBtn) {
      minimizeBtn.addEventListener("click", () => this.minimizeWindow(windowEl))
    }

    if (maximizeBtn) {
      maximizeBtn.addEventListener("click", () => this.toggleMaximize(windowEl))
    }

    // Activate window on click
    windowEl.addEventListener("mousedown", () => this.activateWindow(windowEl))
    windowEl.addEventListener("touchstart", () => this.activateWindow(windowEl))
  }

  makeDraggable(windowEl, handle) {
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0

    const dragMouseDown = (e) => {
      e.preventDefault()

      // Get the mouse cursor position at startup
      pos3 = e.clientX
      pos4 = e.clientY

      // Activate this window
      this.activateWindow(windowEl)

      // Add event listeners for drag and end
      document.addEventListener("mousemove", elementDrag)
      document.addEventListener("mouseup", closeDragElement)

      // Add class for styling during drag
      windowEl.classList.add("dragging")
    }

    const elementDrag = (e) => {
      e.preventDefault()

      // Calculate the new cursor position
      pos1 = pos3 - e.clientX
      pos2 = pos4 - e.clientY
      pos3 = e.clientX
      pos4 = e.clientY

      // Debounce the actual movement for better performance
      if (!windowEl.dragTimeout) {
        windowEl.dragTimeout = setTimeout(() => {
          // Set the element's new position
          const newTop = windowEl.offsetTop - pos2
          const newLeft = windowEl.offsetLeft - pos1

          // Keep window within viewport bounds
          const maxTop = window.innerHeight - 50 // At least titlebar visible
          const maxLeft = window.innerWidth - 50 // At least part of window visible

          windowEl.style.top = `${Math.min(Math.max(0, newTop), maxTop)}px`
          windowEl.style.left = `${Math.min(Math.max(0, newLeft), maxLeft)}px`

          windowEl.dragTimeout = null
        }, 10)
      }
    }

    const closeDragElement = () => {
      // Stop moving when mouse button is released
      document.removeEventListener("mousemove", elementDrag)
      document.removeEventListener("mouseup", closeDragElement)

      // Remove dragging class
      windowEl.classList.remove("dragging")

      // Store window position in localStorage for persistence
      this.saveWindowState(windowEl)
    }

    // Set up mouse events
    handle.addEventListener("mousedown", dragMouseDown)

    // Set up touch events
    handle.addEventListener(
      "touchstart",
      (e) => {
        const touch = e.touches[0]
        pos3 = touch.clientX
        pos4 = touch.clientY

        // Activate this window
        this.activateWindow(windowEl)

        // Add class for styling during drag
        windowEl.classList.add("dragging")

        const touchMove = (e) => {
          const touch = e.touches[0]

          // Calculate the new cursor position
          pos1 = pos3 - touch.clientX
          pos2 = pos4 - touch.clientY
          pos3 = touch.clientX
          pos4 = touch.clientY

          // Debounce the actual movement for better performance
          if (!windowEl.dragTimeout) {
            windowEl.dragTimeout = setTimeout(() => {
              // Set the element's new position
              const newTop = windowEl.offsetTop - pos2
              const newLeft = windowEl.offsetLeft - pos1

              // Keep window within viewport bounds
              const maxTop = window.innerHeight - 50
              const maxLeft = window.innerWidth - 50

              windowEl.style.top = `${Math.min(Math.max(0, newTop), maxTop)}px`
              windowEl.style.left = `${Math.min(Math.max(0, newLeft), maxLeft)}px`

              windowEl.dragTimeout = null
            }, 10)
          }
        }

        const touchEnd = () => {
          document.removeEventListener("touchmove", touchMove)
          document.removeEventListener("touchend", touchEnd)

          // Remove dragging class
          windowEl.classList.remove("dragging")

          // Store window position
          this.saveWindowState(windowEl)
        }

        document.addEventListener("touchmove", touchMove, { passive: false })
        document.addEventListener("touchend", touchEnd)
      },
      { passive: false },
    )
  }

  activateWindow(windowEl) {
    // Skip if already active
    if (this.activeWindow === windowEl) return

    // Update active window
    this.activeWindow = windowEl

    // Bring to front
    this.highestZIndex++
    windowEl.style.zIndex = this.highestZIndex

    // Add active class
    this.windows.forEach((win) => {
      win.classList.remove("active-window")
    })
    windowEl.classList.add("active-window")

    // Dispatch custom event
    const event = new CustomEvent("window-activated", { detail: { window: windowEl } })
    document.dispatchEvent(event)
  }

  closeWindow(windowEl) {
    // Stop any media content
    this.stopAllMedia(windowEl)

    // Hide window
    windowEl.style.display = "none"

    // Remove from minimized set if it was minimized
    this.minimizedWindows.delete(windowEl)

    // Update taskbar
    this.updateTaskbar()

    // Dispatch custom event
    const event = new CustomEvent("window-closed", { detail: { window: windowEl } })
    document.dispatchEvent(event)
  }

  minimizeWindow(windowEl) {
    // Add to minimized set
    this.minimizedWindows.add(windowEl)

    // Hide window
    windowEl.style.display = "none"

    // Update taskbar
    this.updateTaskbar()

    // Dispatch custom event
    const event = new CustomEvent("window-minimized", { detail: { window: windowEl } })
    document.dispatchEvent(event)
  }

  restoreWindow(windowEl) {
    // Remove from minimized set
    this.minimizedWindows.delete(windowEl)

    // Show window
    windowEl.style.display = "block"

    // Activate window
    this.activateWindow(windowEl)

    // Update taskbar
    this.updateTaskbar()

    // Dispatch custom event
    const event = new CustomEvent("window-restored", { detail: { window: windowEl } })
    document.dispatchEvent(event)
  }

  toggleMaximize(windowEl) {
    if (windowEl.classList.contains("maximized")) {
      // Restore window
      windowEl.classList.remove("maximized")

      // Restore previous position and size
      if (windowEl.dataset.prevWidth) windowEl.style.width = windowEl.dataset.prevWidth
      if (windowEl.dataset.prevHeight) windowEl.style.height = windowEl.dataset.prevHeight
      if (windowEl.dataset.prevTop) windowEl.style.top = windowEl.dataset.prevTop
      if (windowEl.dataset.prevLeft) windowEl.style.left = windowEl.dataset.prevLeft
    } else {
      // Save current position and size
      windowEl.dataset.prevWidth = windowEl.style.width
      windowEl.dataset.prevHeight = windowEl.style.height
      windowEl.dataset.prevTop = windowEl.style.top
      windowEl.dataset.prevLeft = windowEl.style.left

      // Maximize window
      windowEl.classList.add("maximized")
      windowEl.style.width = "100%"
      windowEl.style.height = "calc(100% - 40px)" // Leave space for taskbar
      windowEl.style.top = "0"
      windowEl.style.left = "0"
    }

    // Save window state
    this.saveWindowState(windowEl)

    // Dispatch custom event
    const event = new CustomEvent("window-maximized", {
      detail: { window: windowEl, maximized: windowEl.classList.contains("maximized") },
    })
    document.dispatchEvent(event)
  }

  updateTaskbar() {
    // Find taskbar
    const taskbar = document.querySelector(".taskbar")
    if (!taskbar) return

    // Clear taskbar items
    const taskbarItems = taskbar.querySelector(".taskbar-items") || taskbar

    // Update taskbar items
    this.windows.forEach((windowEl) => {
      const id = windowEl.id
      const title = windowEl.dataset.title || windowEl.querySelector(".window-title")?.textContent || "Window"
      const isMinimized = this.minimizedWindows.has(windowEl)
      const isVisible = windowEl.style.display !== "none"

      // Skip if window is closed (not just minimized)
      if (!isVisible && !isMinimized) return

      // Find existing taskbar item or create new one
      let taskbarItem = taskbar.querySelector(`[data-window-id="${id}"]`)

      if (!taskbarItem) {
        taskbarItem = document.createElement("div")
        taskbarItem.className = "taskbar-item"
        taskbarItem.dataset.windowId = id
        taskbarItem.textContent = title

        // Add click handler
        taskbarItem.addEventListener("click", () => {
          if (isMinimized) {
            this.restoreWindow(windowEl)
          } else if (this.activeWindow === windowEl) {
            this.minimizeWindow(windowEl)
          } else {
            this.activateWindow(windowEl)
          }
        })

        taskbarItems.appendChild(taskbarItem)
      }

      // Update active state
      if (this.activeWindow === windowEl && !isMinimized) {
        taskbarItem.classList.add("active")
      } else {
        taskbarItem.classList.remove("active")
      }
    })
  }

  stopAllMedia(windowEl) {
    // Stop videos
    const videos = windowEl.querySelectorAll("video")
    videos.forEach((video) => {
      video.pause()
      video.currentTime = 0
    })

    // Stop audio
    const audios = windowEl.querySelectorAll("audio")
    audios.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })

    // Reset iframes
    const iframes = windowEl.querySelectorAll("iframe")
    iframes.forEach((iframe) => {
      const src = iframe.src
      iframe.src = ""
      setTimeout(() => {
        iframe.src = src
      }, 10)
    })
  }

  saveWindowState(windowEl) {
    // Skip if no ID
    if (!windowEl.id) return

    // Get window state
    const state = {
      id: windowEl.id,
      top: windowEl.style.top,
      left: windowEl.style.left,
      width: windowEl.style.width,
      height: windowEl.style.height,
      zIndex: windowEl.style.zIndex,
      maximized: windowEl.classList.contains("maximized"),
      minimized: this.minimizedWindows.has(windowEl),
    }

    // Save to localStorage
    try {
      const windowStates = JSON.parse(localStorage.getItem("windowStates") || "{}")
      windowStates[windowEl.id] = state
      localStorage.setItem("windowStates", JSON.stringify(windowStates))
    } catch (e) {
      console.error("Failed to save window state:", e)
    }
  }

  restoreWindowStates() {
    try {
      const windowStates = JSON.parse(localStorage.getItem("windowStates") || "{}")

      Object.values(windowStates).forEach((state) => {
        const windowEl = document.getElementById(state.id)
        if (!windowEl) return

        // Restore position and size
        if (state.top) windowEl.style.top = state.top
        if (state.left) windowEl.style.left = state.left
        if (state.width) windowEl.style.width = state.width
        if (state.height) windowEl.style.height = state.height
        if (state.zIndex) windowEl.style.zIndex = state.zIndex

        // Restore maximized state
        if (state.maximized) {
          windowEl.classList.add("maximized")
        } else {
          windowEl.classList.remove("maximized")
        }

        // Restore minimized state
        if (state.minimized) {
          this.minimizedWindows.add(windowEl)
          windowEl.style.display = "none"
        }
      })

      // Update taskbar
      this.updateTaskbar()
    } catch (e) {
      console.error("Failed to restore window states:", e)
    }
  }

  handleResize() {
    this.isMobile = window.innerWidth < 768

    // Adjust windows that are outside viewport
    this.windows.forEach((windowEl) => {
      // Skip minimized windows
      if (this.minimizedWindows.has(windowEl)) return

      // Skip maximized windows
      if (windowEl.classList.contains("maximized")) return

      // Get window position
      const rect = windowEl.getBoundingClientRect()

      // Check if window is outside viewport
      if (rect.right > window.innerWidth) {
        windowEl.style.left = `${window.innerWidth - rect.width}px`
      }

      if (rect.bottom > window.innerHeight) {
        windowEl.style.top = `${window.innerHeight - rect.height}px`
      }
    })
  }

  addTouchSupport() {
    // Add touch-specific styles
    const style = document.createElement("style")
    style.textContent = `
      @media (max-width: 768px) {
        .window {
          min-width: 280px !important;
          width: 90% !important;
        }
        
        .window-titlebar, .titlebar {
          height: 40px !important;
        }
        
        .window-content {
          max-height: 70vh !important;
        }
        
        .window-controls button, .window-control {
          width: 40px !important;
          height: 40px !important;
          font-size: 20px !important;
        }
      }
    `
    document.head.appendChild(style)
  }

  createWindow(options) {
    const { id, title, content, width, height, x, y, theme } = options

    // Create window element
    const windowEl = document.createElement("div")
    windowEl.id = id || `window-${Date.now()}`
    windowEl.className = `window ${theme || ""}`
    windowEl.style.width = width || "400px"
    windowEl.style.height = height || "300px"
    windowEl.style.top = y || `${Math.floor(Math.random() * (window.innerHeight - 300))}px`
    windowEl.style.left = x || `${Math.floor(Math.random() * (window.innerWidth - 400))}px`

    // Create window structure
    windowEl.innerHTML = `
      <div class="window-titlebar">
        <div class="window-title">${title || "Window"}</div>
        <div class="window-controls">
          <button class="window-control minimize-button" title="Minimize">_</button>
          <button class="window-control maximize-button" title="Maximize">□</button>
          <button class="window-control close-button" title="Close">×</button>
        </div>
      </div>
      <div class="window-content">${content || ""}</div>
    `

    // Add to DOM
    document.body.appendChild(windowEl)

    // Register window
    this.registerWindow(windowEl)

    // Activate window
    this.activateWindow(windowEl)

    // Update taskbar
    this.updateTaskbar()

    return windowEl
  }
}

// Initialize window manager
window.windowManager = new WindowManager()

// Restore window states on page load
document.addEventListener("DOMContentLoaded", () => {
  window.windowManager.restoreWindowStates()
})
