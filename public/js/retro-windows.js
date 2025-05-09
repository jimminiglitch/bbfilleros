/**
 * RetroWindows - A modular popup window system with neon styling
 * For retro desktop-style portfolio sites
 */

class RetroWindow {
  constructor(options = {}) {
    this.id = options.id || `window-${Math.floor(Math.random() * 10000)}`
    this.title = options.title || "New Window"
    this.content = options.content || ""
    this.width = options.width || 500
    this.height = options.height || 400
    this.x = options.x || Math.floor(Math.random() * (window.innerWidth - this.width - 50))
    this.y = options.y || Math.floor(Math.random() * (window.innerHeight - this.height - 100))
    this.resizable = options.resizable !== undefined ? options.resizable : true
    this.theme = options.theme || "cyan" // cyan, magenta, green, yellow
    this.onClose = options.onClose || null
    this.zIndex = 100

    this.element = null
    this.isDragging = false
    this.isResizing = false
    this.dragOffset = { x: 0, y: 0 }
    this.resizeStartSize = { width: 0, height: 0 }
    this.resizeStartPos = { x: 0, y: 0 }

    this.create()
    this.setupEventListeners()
  }

  create() {
    // Create window container
    this.element = document.createElement("div")
    this.element.id = this.id
    this.element.className = `retro-window retro-window-${this.theme}`
    this.element.style.width = `${this.width}px`
    this.element.style.height = `${this.height}px`
    this.element.style.left = `${this.x}px`
    this.element.style.top = `${this.y}px`
    this.element.style.zIndex = this.zIndex

    // Create window structure
    this.element.innerHTML = `
      <div class="retro-window-titlebar">
        <div class="retro-window-title">${this.title}</div>
        <div class="retro-window-controls">
          <button class="retro-window-minimize" title="Minimize">_</button>
          ${this.resizable ? '<button class="retro-window-maximize" title="Maximize">□</button>' : ""}
          <button class="retro-window-close" title="Close">×</button>
        </div>
      </div>
      <div class="retro-window-content">${this.content}</div>
      ${this.resizable ? '<div class="retro-window-resize-handle"></div>' : ""}
    `

    // Add to DOM
    document.body.appendChild(this.element)

    // Bring to front when created
    this.bringToFront()
  }

  setupEventListeners() {
    const titlebar = this.element.querySelector(".retro-window-titlebar")
    const closeBtn = this.element.querySelector(".retro-window-close")
    const minimizeBtn = this.element.querySelector(".retro-window-minimize")
    const maximizeBtn = this.element.querySelector(".retro-window-maximize")
    const resizeHandle = this.element.querySelector(".retro-window-resize-handle")

    // Click on window brings it to front
    this.element.addEventListener("mousedown", () => this.bringToFront())

    // Titlebar drag
    titlebar.addEventListener("mousedown", (e) => {
      if (e.target === titlebar || e.target.classList.contains("retro-window-title")) {
        this.startDrag(e)
      }
    })

    // Close button
    closeBtn.addEventListener("click", () => this.close())

    // Minimize button
    if (minimizeBtn) {
      minimizeBtn.addEventListener("click", () => this.minimize())
    }

    // Maximize button
    if (maximizeBtn) {
      maximizeBtn.addEventListener("click", () => this.maximize())
    }

    // Resize handle
    if (resizeHandle) {
      resizeHandle.addEventListener("mousedown", (e) => {
        this.startResize(e)
      })
    }

    // Global mouse events for drag and resize
    document.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        this.drag(e)
      }
      if (this.isResizing) {
        this.resize(e)
      }
    })

    document.addEventListener("mouseup", () => {
      this.isDragging = false
      this.isResizing = false
      document.body.style.userSelect = ""
    })
  }

  startDrag(e) {
    this.isDragging = true
    const rect = this.element.getBoundingClientRect()
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    document.body.style.userSelect = "none"
    e.preventDefault()
  }

  drag(e) {
    if (!this.isDragging) return

    let newX = e.clientX - this.dragOffset.x
    let newY = e.clientY - this.dragOffset.y

    // Keep window within viewport
    newX = Math.max(0, Math.min(newX, window.innerWidth - this.element.offsetWidth))
    newY = Math.max(0, Math.min(newY, window.innerHeight - this.element.offsetHeight))

    this.element.style.left = `${newX}px`
    this.element.style.top = `${newY}px`
  }

  startResize(e) {
    this.isResizing = true
    this.resizeStartSize = {
      width: this.element.offsetWidth,
      height: this.element.offsetHeight,
    }
    this.resizeStartPos = {
      x: e.clientX,
      y: e.clientY,
    }
    document.body.style.userSelect = "none"
    e.preventDefault()
  }

  resize(e) {
    if (!this.isResizing) return

    const deltaX = e.clientX - this.resizeStartPos.x
    const deltaY = e.clientY - this.resizeStartPos.y

    const newWidth = Math.max(200, this.resizeStartSize.width + deltaX)
    const newHeight = Math.max(150, this.resizeStartSize.height + deltaY)

    this.element.style.width = `${newWidth}px`
    this.element.style.height = `${newHeight}px`
  }

  bringToFront() {
    // Get highest z-index
    const windows = document.querySelectorAll(".retro-window")
    let maxZ = this.zIndex

    windows.forEach((win) => {
      const winZ = Number.parseInt(win.style.zIndex || 0)
      if (winZ > maxZ) maxZ = winZ
    })

    // Set this window's z-index higher
    this.element.style.zIndex = maxZ + 1
    this.zIndex = maxZ + 1
  }

  close() {
    // Stop any media content
    this.stopAllMedia()

    // Run onClose callback if provided
    if (typeof this.onClose === "function") {
      this.onClose()
    }

    // Remove from DOM
    this.element.classList.add("retro-window-closing")
    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element)
      }
    }, 300) // Match animation duration
  }

  minimize() {
    this.element.classList.toggle("retro-window-minimized")
  }

  maximize() {
    this.element.classList.toggle("retro-window-maximized")

    if (this.element.classList.contains("retro-window-maximized")) {
      // Save original size and position for restore
      this.element.dataset.originalWidth = this.element.style.width
      this.element.dataset.originalHeight = this.element.style.height
      this.element.dataset.originalLeft = this.element.style.left
      this.element.dataset.originalTop = this.element.style.top

      // Maximize
      this.element.style.width = "100%"
      this.element.style.height = "calc(100% - 40px)"
      this.element.style.left = "0"
      this.element.style.top = "0"
    } else {
      // Restore
      this.element.style.width = this.element.dataset.originalWidth
      this.element.style.height = this.element.dataset.originalHeight
      this.element.style.left = this.element.dataset.originalLeft
      this.element.style.top = this.element.dataset.originalTop
    }
  }

  stopAllMedia() {
    // Stop videos
    const videos = this.element.querySelectorAll("video")
    videos.forEach((video) => {
      video.pause()
      video.currentTime = 0
    })

    // Stop audio
    const audios = this.element.querySelectorAll("audio")
    audios.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })

    // Reset iframes (reload them)
    const iframes = this.element.querySelectorAll("iframe")
    iframes.forEach((iframe) => {
      const src = iframe.src
      iframe.src = ""
      setTimeout(() => {
        iframe.src = src
      }, 10)
    })
  }

  setContent(content) {
    const contentEl = this.element.querySelector(".retro-window-content")
    if (contentEl) {
      contentEl.innerHTML = content
    }
  }
}

// Window Manager to handle multiple windows
class RetroWindowManager {
  constructor() {
    this.windows = {}
    this.activeWindow = null
    this.init()
  }

  init() {
    // Add global styles if not already added
    if (!document.getElementById("retro-windows-styles")) {
      const styleEl = document.createElement("style")
      styleEl.id = "retro-windows-styles"
      styleEl.textContent = this.getStyles()
      document.head.appendChild(styleEl)
    }

    // Add Google Fonts if not already loaded
    if (!document.getElementById("retro-windows-fonts")) {
      const fontLink = document.createElement("link")
      fontLink.id = "retro-windows-fonts"
      fontLink.rel = "stylesheet"
      fontLink.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
      document.head.appendChild(fontLink)
    }
  }

  createWindow(options) {
    const win = new RetroWindow(options)
    this.windows[win.id] = win
    this.activeWindow = win
    return win
  }

  closeWindow(id) {
    if (this.windows[id]) {
      this.windows[id].close()
      delete this.windows[id]
    }
  }

  closeAll() {
    Object.keys(this.windows).forEach((id) => {
      this.closeWindow(id)
    })
  }

  getStyles() {
    return `
      .retro-window {
        position: fixed;
        background-color: #111;
        border: 3px solid;
        border-radius: 4px;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        transition: transform 0.3s, opacity 0.3s;
        font-family: 'VT323', monospace;
      }
      
      .retro-window-cyan {
        border-color: #0ff;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
      }
      
      .retro-window-magenta {
        border-color: #f0f;
        box-shadow: 0 0 15px rgba(255, 0, 255, 0.5);
      }
      
      .retro-window-green {
        border-color: #0f0;
        box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
      }
      
      .retro-window-yellow {
        border-color: #ff0;
        box-shadow: 0 0 15px rgba(255, 255, 0, 0.5);
      }
      
      .retro-window-titlebar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 10px;
        cursor: move;
        user-select: none;
        font-family: 'Press Start 2P', cursive;
        font-size: 12px;
      }
      
      .retro-window-cyan .retro-window-titlebar {
        background-color: #0ff;
        color: #000;
      }
      
      .retro-window-magenta .retro-window-titlebar {
        background-color: #f0f;
        color: #000;
      }
      
      .retro-window-green .retro-window-titlebar {
        background-color: #0f0;
        color: #000;
      }
      
      .retro-window-yellow .retro-window-titlebar {
        background-color: #ff0;
        color: #000;
      }
      
      .retro-window-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .retro-window-controls {
        display: flex;
        gap: 5px;
      }
      
      .retro-window-controls button {
        background: #000;
        color: inherit;
        border: 2px solid currentColor;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-family: monospace;
        font-weight: bold;
        font-size: 14px;
        padding: 0;
        line-height: 1;
      }
      
      .retro-window-controls button:hover {
        opacity: 0.8;
      }
      
      .retro-window-content {
        padding: 10px;
        overflow: auto;
        height: calc(100% - 30px);
        background-color: rgba(0, 0, 0, 0.8);
        color: #fff;
        font-size: 16px;
      }
      
      .retro-window-resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 15px;
        height: 15px;
        cursor: nwse-resize;
      }
      
      .retro-window-cyan .retro-window-resize-handle::before {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        border-style: solid;
        border-width: 0 0 15px 15px;
        border-color: transparent transparent #0ff transparent;
      }
      
      .retro-window-magenta .retro-window-resize-handle::before {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        border-style: solid;
        border-width: 0 0 15px 15px;
        border-color: transparent transparent #f0f transparent;
      }
      
      .retro-window-green .retro-window-resize-handle::before {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        border-style: solid;
        border-width: 0 0 15px 15px;
        border-color: transparent transparent #0f0 transparent;
      }
      
      .retro-window-yellow .retro-window-resize-handle::before {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        border-style: solid;
        border-width: 0 0 15px 15px;
        border-color: transparent transparent #ff0 transparent;
      }
      
      .retro-window-closing {
        transform: scale(0.9);
        opacity: 0;
      }
      
      .retro-window-minimized {
        transform: scale(0.9) translateY(80%);
        opacity: 0.5;
      }
      
      .retro-window-maximized {
        border-radius: 0;
      }
      
      /* Scanlines effect */
      .retro-window-content::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          rgba(18, 16, 16, 0) 50%, 
          rgba(0, 0, 0, 0.25) 50%
        );
        background-size: 100% 4px;
        pointer-events: none;
        z-index: 1;
      }
      
      /* Glow effect on text inside windows */
      .retro-window-cyan .retro-window-content {
        text-shadow: 0 0 5px #0ff;
      }
      
      .retro-window-magenta .retro-window-content {
        text-shadow: 0 0 5px #f0f;
      }
      
      .retro-window-green .retro-window-content {
        text-shadow: 0 0 5px #0f0;
      }
      
      .retro-window-yellow .retro-window-content {
        text-shadow: 0 0 5px #ff0;
      }
    `
  }
}

// Export to global scope
window.RetroWindowManager = RetroWindowManager
window.RetroWindow = RetroWindow

// Initialize the window manager
window.retroWindows = new RetroWindowManager()
