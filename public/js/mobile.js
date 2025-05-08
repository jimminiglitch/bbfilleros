// mobile.js - Mobile-specific enhancements
import { isMobile } from "./core.js"

export function setupMobileSupport() {
  if (!isMobile()) return

  addMobileCloseButton()
  improveTouchHandling()
  optimizeForSmallScreens()
  addPinchZoomSupport()
}

// Add a floating close button for easier window management on mobile
function addMobileCloseButton() {
  // Remove existing button if any
  const existingButton = document.querySelector(".mobile-close")
  if (existingButton) existingButton.remove()

  const mobileClose = document.createElement("button")
  mobileClose.className = "mobile-close"
  mobileClose.textContent = "✕"
  mobileClose.setAttribute("aria-label", "Close active window")

  mobileClose.addEventListener("click", () => {
    const activeWindow = document.querySelector(".popup-window.active")
    if (activeWindow) {
      const closeBtn = activeWindow.querySelector(".close")
      if (closeBtn) closeBtn.click()
    }
  })

  document.body.appendChild(mobileClose)
}

// Improve touch handling for all interactive elements
function improveTouchHandling() {
  // Increase touch target sizes
  const style = document.createElement("style")
  style.textContent = `
    @media (max-width: 768px) {
      button, .window-header button, .taskbar-icon {
        min-width: 44px;
        min-height: 44px;
      }
      
      .desktop-icon {
        margin: 15px;
      }
      
      .resizer {
        width: 15px;
        height: 15px;
      }
    }
  `
  document.head.appendChild(style)

  // Add momentum scrolling for content
  document.querySelectorAll(".window-content").forEach((content) => {
    content.style.webkitOverflowScrolling = "touch"
  })

  // Improve double-tap detection
  document.querySelectorAll(".popup-window .window-header").forEach((header) => {
    let lastTap = 0
    header.addEventListener("touchend", (e) => {
      const currentTime = new Date().getTime()
      const tapLength = currentTime - lastTap
      if (tapLength < 500 && tapLength > 0) {
        const win = header.closest(".popup-window")
        if (win) {
          const maxBtn = win.querySelector(".maximize")
          if (maxBtn) maxBtn.click()
        }
        e.preventDefault()
      }
      lastTap = currentTime
    })
  })
}

// Optimize layout for small screens
function optimizeForSmallScreens() {
  // Adjust window default sizes
  document.querySelectorAll(".popup-window").forEach((win) => {
    // Make windows full width on mobile by default
    win.addEventListener("window-opening", () => {
      if (window.innerWidth < 768 && !win.style.width) {
        win.style.width = "95vw"
        win.style.height = "80vh"
        win.style.left = "2.5vw"
        win.style.top = "10vh"
      }
    })
  })

  // Optimize taskbar
  const taskbar = document.getElementById("start-bar")
  if (taskbar) {
    // Make taskbar icons scrollable horizontally
    const taskbarIcons = document.getElementById("taskbar-icons")
    if (taskbarIcons) {
      taskbarIcons.style.overflowX = "auto"
      taskbarIcons.style.webkitOverflowScrolling = "touch"
      taskbarIcons.style.display = "flex"
      taskbarIcons.style.flexWrap = "nowrap"
    }
  }
}

// Add pinch zoom support for images and content
function addPinchZoomSupport() {
  // Add pinch zoom for images in nature gallery
  document.querySelectorAll(".gallery-image").forEach((img) => {
    let currentScale = 1
    let startDistance = 0

    img.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        startDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY)
      }
    })

    img.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()

        const currentDistance = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY,
        )

        const scale = currentScale * (currentDistance / startDistance)

        // Limit scale between 0.5 and 3
        const limitedScale = Math.min(Math.max(0.5, scale), 3)

        img.style.transform = `scale(${limitedScale})`
      }
    })

    img.addEventListener("touchend", () => {
      // Update current scale for next pinch
      const transform = img.style.transform
      if (transform) {
        const match = transform.match(/scale$$([0-9.]+)$$/)
        if (match) {
          currentScale = Number.parseFloat(match[1])
        }
      }
    })
  })
}
