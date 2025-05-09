/**
 * RetroTaskbar - A Windows 98-inspired taskbar with start menu
 * For retro desktop-style portfolio sites
 */

class RetroTaskbar {
  constructor(options = {}) {
    this.container = options.container || document.body
    this.menuItems = options.menuItems || []
    this.theme = options.theme || "cyan" // cyan, magenta, green, yellow
    this.clock = options.clock !== false
    this.logo = options.logo || "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/retro-logo.png"

    this.taskbar = null
    this.startButton = null
    this.startMenu = null
    this.taskList = null
    this.clockElement = null
    this.isMenuOpen = false
    this.options = options // Declare options here

    this.init()
  }

  init() {
    // Create taskbar
    this.taskbar = document.createElement("div")
    this.taskbar.className = `retro-taskbar retro-taskbar-${this.theme}`

    // Create start button
    this.startButton = document.createElement("button")
    this.startButton.className = "retro-taskbar-start"
    this.startButton.innerHTML = `
      <img src="${this.logo}" alt="Start" class="retro-taskbar-logo">
      <span>Start</span>
    `

    // Create task list
    this.taskList = document.createElement("div")
    this.taskList.className = "retro-taskbar-tasks"

    // Create clock
    if (this.clock) {
      this.clockElement = document.createElement("div")
      this.clockElement.className = "retro-taskbar-clock"
      this.updateClock()
      setInterval(() => this.updateClock(), 1000)
    }

    // Add elements to taskbar
    this.taskbar.appendChild(this.startButton)
    this.taskbar.appendChild(this.taskList)
    if (this.clock) {
      this.taskbar.appendChild(this.clockElement)
    }

    // Create start menu
    this.createStartMenu()

    // Add taskbar to container
    this.container.appendChild(this.taskbar)

    // Add styles
    this.addStyles()

    // Setup event listeners
    this.setupEventListeners()
  }

  createStartMenu() {
    this.startMenu = document.createElement("div")
    this.startMenu.className = `retro-start-menu retro-start-menu-${this.theme}`
    this.startMenu.style.display = "none"

    // Add header
    const header = document.createElement("div")
    header.className = "retro-start-menu-header"
    header.innerHTML = `
      <div class="retro-start-menu-title">Retro OS</div>
      <div class="retro-start-menu-subtitle">v1.0</div>
    `

    // Add menu items
    const menuList = document.createElement("ul")
    menuList.className = "retro-start-menu-items"

    this.menuItems.forEach((item) => {
      const menuItem = document.createElement("li")
      menuItem.className = "retro-start-menu-item"

      if (item.separator) {
        menuItem.className += " retro-start-menu-separator"
      } else {
        menuItem.innerHTML = `
          <div class="retro-start-menu-item-icon">${item.icon || "📁"}</div>
          <div class="retro-start-menu-item-text">${item.label}</div>
          ${item.submenu ? '<div class="retro-start-menu-item-arrow">▶</div>' : ""}
        `

        if (item.onClick) {
          menuItem.addEventListener("click", () => {
            this.toggleStartMenu()
            item.onClick()
          })
        }

        if (item.submenu) {
          const submenu = document.createElement("ul")
          submenu.className = "retro-start-submenu"

          item.submenu.forEach((subitem) => {
            const submenuItem = document.createElement("li")
            submenuItem.className = "retro-start-submenu-item"

            if (subitem.separator) {
              submenuItem.className += " retro-start-menu-separator"
            } else {
              submenuItem.innerHTML = `
                <div class="retro-start-menu-item-icon">${subitem.icon || "📄"}</div>
                <div class="retro-start-menu-item-text">${subitem.label}</div>
              `

              if (subitem.onClick) {
                submenuItem.addEventListener("click", () => {
                  this.toggleStartMenu()
                  subitem.onClick()
                })
              }
            }

            submenu.appendChild(submenuItem)
          })

          menuItem.appendChild(submenu)

          // Show submenu on hover
          menuItem.addEventListener("mouseenter", () => {
            submenu.style.display = "block"
          })

          menuItem.addEventListener("mouseleave", () => {
            submenu.style.display = "none"
          })
        }
      }

      menuList.appendChild(menuItem)
    })

    // Add footer
    const footer = document.createElement("div")
    footer.className = "retro-start-menu-footer"
    footer.innerHTML = `
      <div class="retro-start-menu-shutdown">
        <div class="retro-start-menu-item-icon">⏻</div>
        <div class="retro-start-menu-item-text">Shut Down</div>
      </div>
    `

    // Add shutdown functionality
    const shutdown = footer.querySelector(".retro-start-menu-shutdown")
    if (shutdown) {
      shutdown.addEventListener("click", () => {
        this.toggleStartMenu()
        if (typeof this.options.onShutdown === "function") {
          this.options.onShutdown()
        } else {
          alert("System shutdown")
        }
      })
    }

    // Add elements to start menu
    this.startMenu.appendChild(header)
    this.startMenu.appendChild(menuList)
    this.startMenu.appendChild(footer)

    // Add start menu to container
    document.body.appendChild(this.startMenu)
  }

  setupEventListeners() {
    // Toggle start menu on start button click
    this.startButton.addEventListener("click", () => {
      this.toggleStartMenu()
    })

    // Close start menu when clicking outside
    document.addEventListener("click", (e) => {
      if (this.isMenuOpen && !this.startMenu.contains(e.target) && !this.startButton.contains(e.target)) {
        this.toggleStartMenu(false)
      }
    })

    // Listen for window creation to add to taskbar
    document.addEventListener("retro-window-created", (e) => {
      this.addTaskbarItem(e.detail)
    })

    // Listen for window close to remove from taskbar
    document.addEventListener("retro-window-closed", (e) => {
      this.removeTaskbarItem(e.detail.id)
    })
  }

  toggleStartMenu(force) {
    const shouldOpen = force !== undefined ? force : !this.isMenuOpen

    if (shouldOpen) {
      this.startMenu.style.display = "block"
      this.startButton.classList.add("active")

      // Position the menu
      const taskbarRect = this.taskbar.getBoundingClientRect()
      this.startMenu.style.bottom = `${taskbarRect.height}px`
      this.startMenu.style.left = "0"
    } else {
      this.startMenu.style.display = "none"
      this.startButton.classList.remove("active")
    }

    this.isMenuOpen = shouldOpen
  }

  updateClock() {
    if (!this.clockElement) return

    const now = new Date()
    const hours = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")

    this.clockElement.textContent = `${hours}:${minutes}`
  }

  addTaskbarItem(window) {
    const taskItem = document.createElement("button")
    taskItem.className = "retro-taskbar-item"
    taskItem.dataset.windowId = window.id
    taskItem.textContent = window.title

    taskItem.addEventListener("click", () => {
      // Toggle window minimize or bring to front
      if (window.element.classList.contains("retro-window-minimized")) {
        window.minimize() // Un-minimize
        window.bringToFront()
      } else {
        window.minimize()
      }
    })

    this.taskList.appendChild(taskItem)
  }

  removeTaskbarItem(windowId) {
    const taskItem = this.taskList.querySelector(`[data-window-id="${windowId}"]`)
    if (taskItem) {
      this.taskList.removeChild(taskItem)
    }
  }

  addStyles() {
    if (!document.getElementById("retro-taskbar-styles")) {
      const styleEl = document.createElement("style")
      styleEl.id = "retro-taskbar-styles"
      styleEl.textContent = `
        .retro-taskbar {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 40px;
          background-color: #000;
          display: flex;
          align-items: center;
          padding: 0 10px;
          box-sizing: border-box;
          z-index: 9000;
          border-top: 2px solid;
        }
        
        .retro-taskbar-cyan {
          border-color: #0ff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
        }
        
        .retro-taskbar-magenta {
          border-color: #f0f;
          box-shadow: 0 0 15px rgba(255, 0, 255, 0.5);
        }
        
        .retro-taskbar-green {
          border-color: #0f0;
          box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
        }
        
        .retro-taskbar-yellow {
          border-color: #ff0;
          box-shadow: 0 0 15px rgba(255, 255, 0, 0.5);
        }
        
        .retro-taskbar-start {
          display: flex;
          align-items: center;
          background-color: #000;
          border: 2px solid;
          padding: 5px 10px;
          margin-right: 10px;
          cursor: pointer;
          font-family: 'VT323', monospace;
          font-size: 16px;
        }
        
        .retro-taskbar-cyan .retro-taskbar-start {
          border-color: #0ff;
          color: #0ff;
        }
        
        .retro-taskbar-magenta .retro-taskbar-start {
          border-color: #f0f;
          color: #f0f;
        }
        
        .retro-taskbar-green .retro-taskbar-start {
          border-color: #0f0;
          color: #0f0;
        }
        
        .retro-taskbar-yellow .retro-taskbar-start {
          border-color: #ff0;
          color: #ff0;
        }
        
        .retro-taskbar-start.active {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .retro-taskbar-logo {
          width: 20px;
          height: 20px;
          margin-right: 5px;
        }
        
        .retro-taskbar-tasks {
          flex: 1;
          display: flex;
          gap: 5px;
          overflow-x: auto;
          max-width: calc(100% - 200px);
        }
        
        .retro-taskbar-item {
          background-color: #000;
          border: 2px solid;
          padding: 5px 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
          cursor: pointer;
          font-family: 'VT323', monospace;
          font-size: 14px;
        }
        
        .retro-taskbar-cyan .retro-taskbar-item {
          border-color: #0ff;
          color: #0ff;
        }
        
        .retro-taskbar-magenta .retro-taskbar-item {
          border-color: #f0f;
          color: #f0f;
        }
        
        .retro-taskbar-green .retro-taskbar-item {
          border-color: #0f0;
          color: #0f0;
        }
        
        .retro-taskbar-yellow .retro-taskbar-item {
          border-color: #ff0;
          color: #ff0;
        }
        
        .retro-taskbar-clock {
          padding: 5px 10px;
          font-family: 'VT323', monospace;
          font-size: 16px;
          border: 2px solid;
          margin-left: 10px;
        }
        
        .retro-taskbar-cyan .retro-taskbar-clock {
          border-color: #0ff;
          color: #0ff;
        }
        
        .retro-taskbar-magenta .retro-taskbar-clock {
          border-color: #f0f;
          color: #f0f;
        }
        
        .retro-taskbar-green .retro-taskbar-clock {
          border-color: #0f0;
          color: #0f0;
        }
        
        .retro-taskbar-yellow .retro-taskbar-clock {
          border-color: #ff0;
          color: #ff0;
        }
        
        .retro-start-menu {
          position: fixed;
          bottom: 40px;
          left: 0;
          width: 250px;
          background-color: #000;
          border: 2px solid;
          display: flex;
          flex-direction: column;
          z-index: 9001;
        }
        
        .retro-start-menu-cyan {
          border-color: #0ff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
        }
        
        .retro-start-menu-magenta {
          border-color: #f0f;
          box-shadow: 0 0 15px rgba(255, 0, 255, 0.5);
        }
        
        .retro-start-menu-green {
          border-color: #0f0;
          box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
        }
        
        .retro-start-menu-yellow {
          border-color: #ff0;
          box-shadow: 0 0 15px rgba(255, 255, 0, 0.5);
        }
        
        .retro-start-menu-header {
          padding: 10px;
          border-bottom: 2px solid;
        }
        
        .retro-start-menu-cyan .retro-start-menu-header {
          border-color: #0ff;
        }
        
        .retro-start-menu-magenta .retro-start-menu-header {
          border-color: #f0f;
        }
        
        .retro-start-menu-green .retro-start-menu-header {
          border-color: #0f0;
        }
        
        .retro-start-menu-yellow .retro-start-menu-header {
          border-color: #ff0;
        }
        
        .retro-start-menu-title {
          font-family: 'Press Start 2P', cursive;
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .retro-start-menu-cyan .retro-start-menu-title {
          color: #0ff;
        }
        
        .retro-start-menu-magenta .retro-start-menu-title {
          color: #f0f;
        }
        
        .retro-start-menu-green .retro-start-menu-title {
          color: #0f0;
        }
        
        .retro-start-menu-yellow .retro-start-menu-title {
          color: #ff0;
        }
        
        .retro-start-menu-subtitle {
          font-family: 'VT323', monospace;
          font-size: 14px;
          opacity: 0.7;
        }
        
        .retro-start-menu-cyan .retro-start-menu-subtitle {
          color: #0ff;
        }
        
        .retro-start-menu-magenta .retro-start-menu-subtitle {
          color: #f0f;
        }
        
        .retro-start-menu-green .retro-start-menu-subtitle {
          color: #0f0;
        }
        
        .retro-start-menu-yellow .retro-start-menu-subtitle {
          color: #ff0;
        }
        
        .retro-start-menu-items {
          list-style: none;
          margin: 0;
          padding: 0;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .retro-start-menu-item {
          display: flex;
          align-items: center;
          padding: 8px 15px;
          cursor: pointer;
          position: relative;
        }
        
        .retro-start-menu-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .retro-start-menu-item-icon {
          margin-right: 10px;
          font-size: 18px;
        }
        
        .retro-start-menu-item-text {
          font-family: 'VT323', monospace;
          font-size: 16px;
          flex: 1;
        }
        
        .retro-start-menu-cyan .retro-start-menu-item-text {
          color: #0ff;
        }
        
        .retro-start-menu-magenta .retro-start-menu-item-text {
          color: #f0f;
        }
        
        .retro-start-menu-green .retro-start-menu-item-text {
          color: #0f0;
        }
        
        .retro-start-menu-yellow .retro-start-menu-item-text {
          color: #ff0;
        }
        
        .retro-start-menu-item-arrow {
          font-size: 12px;
        }
        
        .retro-start-menu-separator {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.3);
          margin: 5px 0;
          padding: 0;
        }
        
        .retro-start-submenu {
          position: absolute;
          left: 100%;
          top: 0;
          background-color: #000;
          border: 2px solid;
          list-style: none;
          margin: 0;
          padding: 5px 0;
          min-width: 150px;
          display: none;
          z-index: 9002;
        }
        
        .retro-start-menu-cyan .retro-start-submenu {
          border-color: #0ff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
        }
        
        .retro-start-menu-magenta .retro-start-submenu {
          border-color: #f0f;
          box-shadow: 0 0 15px rgba(255, 0, 255, 0.5);
        }
        
        .retro-start-menu-green .retro-start-submenu {
          border-color: #0f0;
          box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
        }
        
        .retro-start-menu-yellow .retro-start-submenu {
          border-color: #ff0;
          box-shadow: 0 0 15px rgba(255, 255, 0, 0.5);
        }
        
        .retro-start-submenu-item {
          display: flex;
          align-items: center;
          padding: 8px 15px;
          cursor: pointer;
        }
        
        .retro-start-submenu-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .retro-start-menu-footer {
          padding: 10px;
          border-top: 2px solid;
        }
        
        .retro-start-menu-cyan .retro-start-menu-footer {
          border-color: #0ff;
        }
        
        .retro-start-menu-magenta .retro-start-menu-footer {
          border-color: #f0f;
        }
        
        .retro-start-menu-green .retro-start-menu-footer {
          border-color: #0f0;
        }
        
        .retro-start-menu-yellow .retro-start-menu-footer {
          border-color: #ff0;
        }
        
        .retro-start-menu-shutdown {
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        
        .retro-start-menu-shutdown:hover {
          opacity: 0.8;
        }
      `
      document.head.appendChild(styleEl)
    }
  }
}

// Export to global scope
window.RetroTaskbar = RetroTaskbar
