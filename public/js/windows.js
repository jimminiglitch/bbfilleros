// Refactored windows.js with improved mobile/touch support, z-index handling, and minimized toggle
import { getNextZIndex, isMobile } from "./core.js"

const windowStates = {}
const toadHoverAudio = new Audio(
  "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/hover.mp3?v=1746577634973",
)
toadHoverAudio.volume = 0.5

export function initWindowControls() {
  const windows = document.querySelectorAll(".popup-window")
  windows.forEach((win) => {
    const id = win.id
    const header = win.querySelector(".window-header")
    const btnMin = header.querySelector(".minimize")
    const btnMax = header.querySelector(".maximize")
    const btnCls = header.querySelector(".close")

    if (btnMin) btnMin.addEventListener("click", () => toggleMinimizeWindow(id))
    if (btnMax) btnMax.addEventListener("click", () => toggleMaximizeWindow(id))
    if (btnCls) btnCls.addEventListener("click", () => closeWindow(id))

    setupWindowDragging(win, header)
    setupWindowResizing(win)

    header.addEventListener("dblclick", (e) => {
      if (e.target.tagName !== "BUTTON") toggleMaximizeWindow(id)
    })
  })
}

function setupWindowDragging(win, header) {
  let isDragging = false
  let offsetX = 0, offsetY = 0

  function pointerDown(e) {
    if (e.target.tagName === "BUTTON") return
    isDragging = true
    const rect = win.getBoundingClientRect()
    offsetX = e.clientX - rect.left
    offsetY = e.clientY - rect.top
    win.style.zIndex = getNextZIndex()
    win.setPointerCapture(e.pointerId)
  }

  function pointerMove(e) {
    if (!isDragging || win.classList.contains("maximized")) return
    win.style.left = `${e.clientX - offsetX}px`
    win.style.top = `${e.clientY - offsetY}px`
  }

  function pointerUp() {
    isDragging = false
    win.releasePointerCapture
  }

  header.addEventListener("pointerdown", pointerDown)
  header.addEventListener("pointermove", pointerMove)
  header.addEventListener("pointerup", pointerUp)
}

function setupWindowResizing(win) {
  // Placeholder for improved resizer logic
}

function toggleMinimizeWindow(id) {
  const win = document.getElementById(id)
  const icon = document.getElementById(`taskbar-icon-${id}`)
  if (win.classList.contains("hidden")) {
    win.classList.remove("hidden")
    win.style.display = "flex"
    if (icon) icon.remove()
  } else {
    win.classList.add("hidden")
    win.style.display = "none"
    createTaskbarIcon(id)
  }
}

function toggleMaximizeWindow(id) {
  const win = document.getElementById(id)
  const isMax = !win.classList.contains("maximized")
  if (isMax) {
    windowStates[id] = {
      top: win.style.top,
      left: win.style.left,
      width: win.style.width,
      height: win.style.height,
    }
    win.classList.add("maximized")
    Object.assign(win.style, {
      top: "0",
      left: "0",
      width: "100vw",
      height: "calc(100vh - 36px)",
    })
  } else {
    const s = windowStates[id] || {}
    Object.assign(win.style, s)
    win.classList.remove("maximized")
  }
}

function closeWindow(id) {
  const win = document.getElementById(id)
  if (win) {
    win.classList.add("hidden")
    win.style.display = "none"
  }
  const icon = document.getElementById(`taskbar-icon-${id}`)
  if (icon) icon.remove()
}

function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return
  const btn = document.createElement("button")
  btn.id = `taskbar-icon-${id}`
  btn.className = "taskbar-icon"
  btn.textContent = id.toUpperCase()
  btn.addEventListener("click", () => toggleMinimizeWindow(id))
  document.getElementById("taskbar-icons").appendChild(btn)
}

export { openWindow };
