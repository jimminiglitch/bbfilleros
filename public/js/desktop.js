// desktop.js - Desktop icons and selection functionality
import { getNextZIndex } from "./core.js"
import { openWindow } from "./windows.js"

// Initialize desktop icons
export function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach((icon) => {
    // Open on double-click
    icon.addEventListener("dblclick", () => {
      openWindow(icon.dataset.window)
    })

    // Single tap for mobile
    let lastTap = 0
    icon.addEventListener("touchend", (e) => {
      const currentTime = new Date().getTime()
      const tapLength = currentTime - lastTap
      if (tapLength < 500 && tapLength > 0) {
        openWindow(icon.dataset.window)
        e.preventDefault()
      }
      lastTap = currentTime
    })

    // Hover effect
    icon.addEventListener("mouseenter", () => {
      icon.classList.add("icon-hover")
    })

    icon.addEventListener("mouseleave", () => {
      icon.classList.remove("icon-hover")
    })

    // Improved drag functionality
    setupIconDragging(icon)
  })

  // Initialize multi-select
  initMultiSelect()
}

// Setup improved icon dragging
function setupIconDragging(icon) {
  icon.addEventListener("mousedown", (e) => {
    // Only handle left mouse button
    if (e.button !== 0) return

    e.preventDefault()
    const parentRect = icon.parentElement.getBoundingClientRect()
    const clickRect = icon.getBoundingClientRect()

    // Determine if we're dragging a group or single icon
    let group
    if (icon.classList.contains("selected")) {
      group = Array.from(document.querySelectorAll(".desktop-icon.selected"))
    } else {
      document.querySelectorAll(".desktop-icon.selected").forEach((ic) => ic.classList.remove("selected"))
      icon.classList.add("selected")
      group = [icon]
    }

    // Calculate drag offsets
    const shiftX = e.clientX - clickRect.left
    const shiftY = e.clientY - clickRect.top

    // Store initial positions
    const groupData = group.map((ic) => {
      const r = ic.getBoundingClientRect()
      const startLeft = r.left - parentRect.left
      const startTop = r.top - parentRect.top

      // Set initial position and z-index
      ic.style.left = `${startLeft}px`
      ic.style.top = `${startTop}px`
      ic.style.zIndex = getNextZIndex()

      return { icon: ic, startLeft, startTop }
    })

    // Mouse move handler with bounds checking
    function onMouseMove(e) {
      const dx = e.clientX - shiftX - parentRect.left - groupData[0].startLeft
      const dy = e.clientY - shiftY - parentRect.top - groupData[0].startTop

      groupData.forEach(({ icon, startLeft, startTop }) => {
        // Calculate new position with bounds checking
        const newLeft = Math.max(0, Math.min(parentRect.width - icon.offsetWidth, startLeft + dx))
        const newTop = Math.max(0, Math.min(parentRect.height - icon.offsetHeight, startTop + dy))

        icon.style.left = `${newLeft}px`
        icon.style.top = `${newTop}px`
      })
    }

    // Add move and up listeners
    document.addEventListener("mousemove", onMouseMove, { passive: true })
    document.addEventListener(
      "mouseup",
      () => {
        document.removeEventListener("mousemove", onMouseMove)
      },
      { once: true, passive: true },
    )
  })

  // Prevent default drag behavior
  icon.ondragstart = () => false
}

// Initialize multi-select functionality
function initMultiSelect() {
  let selStartX, selStartY, selDiv

  function onSelectStart(e) {
    // Don't start selection if clicking on icons or UI elements
    if (e.target.closest(".desktop-icon, .popup-window, #start-bar, #start-menu")) return

    // Only handle left mouse button
    if (e.button !== 0) return

    selStartX = e.clientX
    selStartY = e.clientY

    // Create selection rectangle
    selDiv = document.createElement("div")
    selDiv.id = "selection-rect"
    selDiv.setAttribute("role", "presentation")
    selDiv.setAttribute("aria-hidden", "true")
    selDiv.style.left = `${selStartX}px`
    selDiv.style.top = `${selStartY}px`
    selDiv.style.width = "0px"
    selDiv.style.height = "0px"
    document.body.appendChild(selDiv)

    // Add event listeners
    document.addEventListener("mousemove", onSelectMove, { passive: true })
    document.addEventListener("mouseup", onSelectEnd, { once: true, passive: true })
    e.preventDefault()
  }

  function onSelectMove(e) {
    if (!selDiv) return

    // Calculate selection rectangle dimensions
    const x = Math.min(e.clientX, selStartX)
    const y = Math.min(e.clientY, selStartY)
    const w = Math.abs(e.clientX - selStartX)
    const h = Math.abs(e.clientY - selStartY)

    // Update selection rectangle
    selDiv.style.left = `${x}px`
    selDiv.style.top = `${y}px`
    selDiv.style.width = `${w}px`
    selDiv.style.height = `${h}px`

    // Check which icons are inside the selection
    const box = selDiv.getBoundingClientRect()
    document.querySelectorAll(".desktop-icon").forEach((icon) => {
      const r = icon.getBoundingClientRect()
      const inside = r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom
      icon.classList.toggle("selected", inside)
    })
  }

  function onSelectEnd() {
    if (selDiv) {
      selDiv.remove()

      // Announce selection to screen readers if icons are selected
      const selectedIcons = document.querySelectorAll(".desktop-icon.selected")
      if (selectedIcons.length > 0) {
        const liveRegion = document.createElement("div")
        liveRegion.setAttribute("aria-live", "polite")
        liveRegion.className = "sr-only"
        liveRegion.textContent = `${selectedIcons.length} icons selected`
        document.body.appendChild(liveRegion)

        setTimeout(() => {
          document.body.removeChild(liveRegion)
        }, 1000)
      }
    }
    selDiv = null
  }

  // Add mousedown listener to start selection
  window.addEventListener("mousedown", onSelectStart)
}

// Initialize keyboard accessibility for desktop icons
export function initDesktopKeyboardNav() {
  const icons = document.querySelectorAll(".desktop-icon")

  // Add tabindex to make icons focusable
  icons.forEach((icon, index) => {
    icon.setAttribute("tabindex", "0")

    // Enter key to open window
    icon.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        openWindow(icon.dataset.window)
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault()
        navigateIcons(icon, e.key)
      }
    })

    // Focus styling
    icon.addEventListener("focus", () => {
      icon.classList.add("icon-hover")
    })

    icon.addEventListener("blur", () => {
      icon.classList.remove("icon-hover")
    })
  })
}

// Navigate between icons using arrow keys
function navigateIcons(currentIcon, key) {
  const icons = Array.from(document.querySelectorAll(".desktop-icon"))
  const currentIndex = icons.indexOf(currentIcon)
  const iconPositions = icons.map((icon) => {
    const rect = icon.getBoundingClientRect()
    return {
      icon,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  })

  const current = iconPositions[currentIndex]
  let nextIcon = null
  let minDistance = Number.POSITIVE_INFINITY

  // Find the closest icon in the direction of the arrow key
  iconPositions.forEach((pos) => {
    if (pos.icon === currentIcon) return

    const dx = pos.x - current.x
    const dy = pos.y - current.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    let isInDirection = false

    switch (key) {
      case "ArrowUp":
        isInDirection = dy < -10 && Math.abs(dx) < Math.abs(dy)
        break
      case "ArrowDown":
        isInDirection = dy > 10 && Math.abs(dx) < Math.abs(dy)
        break
      case "ArrowLeft":
        isInDirection = dx < -10 && Math.abs(dy) < Math.abs(dx)
        break
      case "ArrowRight":
        isInDirection = dx > 10 && Math.abs(dy) < Math.abs(dx)
        break
    }

    if (isInDirection && distance < minDistance) {
      minDistance = distance
      nextIcon = pos.icon
    }
  })

  // Focus the next icon if found
  if (nextIcon) {
    nextIcon.focus()
  }
}
