// accessibility.js - Accessibility enhancements
export function initAccessibility() {
  // Add keyboard navigation for all interactive elements
  initWindowKeyboardNav()
  initGlobalKeyboardShortcuts()
  ensureSkipLink()
  ensureScreenReaderClasses()
}

// Initialize keyboard navigation for window controls
function initWindowKeyboardNav() {
  document.querySelectorAll(".popup-window").forEach((win) => {
    const header = win.querySelector(".window-header")
    const buttons = header.querySelectorAll("button")

    buttons.forEach((btn) => {
      btn.setAttribute("tabindex", "0")

      // Add aria labels
      if (btn.classList.contains("minimize")) {
        btn.setAttribute("aria-label", "Minimize window")
      } else if (btn.classList.contains("maximize")) {
        btn.setAttribute("aria-label", "Maximize window")
      } else if (btn.classList.contains("close")) {
        btn.setAttribute("aria-label", "Close window")
      }
    })
  })

  // Start menu accessibility
  const startButton = document.getElementById("start-button")
  if (startButton) {
    startButton.setAttribute("aria-expanded", "false")
    startButton.setAttribute("aria-controls", "start-menu")

    startButton.addEventListener("click", () => {
      const expanded = startButton.getAttribute("aria-expanded") === "true"
      startButton.setAttribute("aria-expanded", !expanded)
    })
  }
}

// Global keyboard shortcuts
function initGlobalKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Escape key to close active window
    if (e.key === "Escape") {
      const activeWindow = document.querySelector(".popup-window.active")
      if (activeWindow) {
        const closeBtn = activeWindow.querySelector(".close")
        if (closeBtn) closeBtn.click()
      }
    }

    // Alt+Tab to cycle through open windows
    if (e.key === "Tab" && e.altKey) {
      e.preventDefault()
      cycleWindows(e.shiftKey)
    }

    // F1 to open About
    if (e.key === "F1") {
      e.preventDefault()
      const aboutIcon = document.getElementById("icon-about")
      if (aboutIcon) {
        const event = new MouseEvent("dblclick", {
          bubbles: true,
          cancelable: true,
          view: window,
        })
        aboutIcon.dispatchEvent(event)
      }
    }
  })
}

// Cycle through open windows
function cycleWindows(reverse = false) {
  const windows = Array.from(document.querySelectorAll(".popup-window:not(.hidden)"))
  if (windows.length === 0) return

  // Find the active window
  const activeIndex = windows.findIndex((win) => win.classList.contains("active"))
  let nextIndex

  if (activeIndex === -1) {
    nextIndex = 0
  } else {
    if (reverse) {
      nextIndex = (activeIndex - 1 + windows.length) % windows.length
    } else {
      nextIndex = (activeIndex + 1) % windows.length
    }
  }

  // Activate the next window
  windows.forEach((win, i) => {
    win.classList.toggle("active", i === nextIndex)
    win.style.zIndex = i === nextIndex ? 9999 : win.style.zIndex
  })

  // Announce to screen readers
  const title = windows[nextIndex].querySelector(".window-header span").textContent
  const liveRegion = document.createElement("div")
  liveRegion.setAttribute("aria-live", "polite")
  liveRegion.className = "sr-only"
  liveRegion.textContent = `${title} window activated`
  document.body.appendChild(liveRegion)

  setTimeout(() => {
    document.body.removeChild(liveRegion)
  }, 1000)
}

// Ensure skip link exists
function ensureSkipLink() {
  if (!document.querySelector(".skip-link")) {
    const skipLink = document.createElement("a")
    skipLink.href = "#desktop-icons"
    skipLink.className = "skip-link"
    skipLink.textContent = "Skip to content"
    document.body.insertBefore(skipLink, document.body.firstChild)
  }
}

// Ensure screen reader only class exists
function ensureScreenReaderClasses() {
  if (!document.querySelector(".sr-only")) {
    const style = document.createElement("style")
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `
    document.head.appendChild(style)
  }
}
