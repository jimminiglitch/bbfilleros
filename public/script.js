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
function startup() {
  initWindowControls()
  runBootSequence().then(() => {
    initDesktopIcons()
    initStarfield()
    initAudioVisualizer()
    initDOSLoader()
    initGlitchEffects()
  })
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startup)
} else {
  startup()
}

//────────────────────────────────────────────────────────────────────────────
// 1) WINDOW CONTROLS
//────────────────────────────────────────────────────────────────────────────
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
      if (e.target.tagName === "BUTTON") return
      isDragging = true
      offsetX = e.clientX - win.offsetLeft
      offsetY = e.clientY - win.offsetTop
      win.style.zIndex = getNextZIndex()
      win.classList.add("dragging")
    })

    document.addEventListener(
      "mousemove",
      (e) => {
        if (isDragging && !win.classList.contains("maximized")) {
          win.style.left = `${e.clientX - offsetX}px`
          win.style.top = `${e.clientY - offsetY}px`
        }
      },
      { passive: true }
    )

    document.addEventListener(
      "mouseup",
      () => {
        isDragging = false
        win.classList.remove("dragging")
      },
      { passive: true }
    )

    header.addEventListener("dblclick", (e) => {
      if (e.target.tagName !== "BUTTON") toggleMaximizeWindow(id)
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
        const startWidth = parseInt(getComputedStyle(win).width, 10)
        const startHeight = parseInt(getComputedStyle(win).height, 10)
        const startTop = win.offsetTop
        const startLeft = win.offsetLeft

        function doDrag(e) {
          if (!isResizing) return
          let newWidth = startWidth, newHeight = startHeight, newTop = startTop, newLeft = startLeft
          if (dir.includes("right")) newWidth = Math.max(300, startWidth + e.clientX - startX)
          if (dir.includes("bottom")) newHeight = Math.max(200, startHeight + e.clientY - startY)
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
          Object.assign(win.style, {
            width: `${newWidth}px`,
            height: `${newHeight}px`,
            top: `${newTop}px`,
            left: `${newLeft}px`
          })
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

//────────────────────────────────────────────────────────────────────────────
// 2) WINDOW OPERATIONS & TASKBAR
//────────────────────────────────────────────────────────────────────────────
let currentZIndex = 10
const windowStates = {}
function getNextZIndex() { return ++currentZIndex }

function openWindow(id) {
  const win = document.getElementById(id)
  if (!win) return
  document.getElementById("start-menu").style.display = "none"
  document.querySelectorAll(".popup-window").forEach(w => w.classList.remove("active"))

  win.querySelectorAll("iframe[data-src]").forEach(iframe => {
    if (!iframe.src) iframe.src = iframe.dataset.src
  })
  win.querySelectorAll("video[data-src]").forEach(v => {
    if (!v.src) {
      v.src = v.dataset.src
      v.load()
      if (!isMobile()) v.play().catch(() => {})
    }
  })

  win.classList.remove("hidden")
  win.classList.add("active")
  win.style.display = "flex"
  win.style.zIndex = getNextZIndex()
  win.classList.add("window-opening")
  setTimeout(() => win.classList.remove("window-opening"), 500)

  const isMobileView = isMobile()
  if (isMobileView) {
    Object.assign(win.style, {
      top: "0", left: "0",
      width: "100vw",
      height: "calc(100vh - 36px)",
      transform: "none"
    })
  } else {
    const stored = windowStates[id]
    if (stored) Object.assign(win.style, stored)
    // clamp to viewport...
    const rect = win.getBoundingClientRect(), margin = 20
    const vw = innerWidth, vh = innerHeight
    let [w, h, l, t] = [rect.width, rect.height, rect.left, rect.top]
    if (w > vw - margin*2) w = vw - margin*2
    if (h > vh - margin*2) h = vh - margin*2
    if (l < margin) l = margin
    if (t < margin) t = margin
    if (rect.right > vw - margin) l = vw - margin - w
    if (rect.bottom > vh - margin) t = vh - margin - h
    Object.assign(win.style, { width:`${w}px`, height:`${h}px`, left:`${l}px`, top:`${t}px` })
  }

  if (id === "snake") initSnakeGame()
  if (id === "tetris") initTetrisGame()
  if (id === "music") initMusicPlayer()
}

function minimizeWindow(id) {
  const win = document.getElementById(id)
  if (!win) return
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
    win.classList.add("window-closing")
    setTimeout(() => {
      const vid = win.querySelector("video")
      if (vid) { vid.pause(); vid.currentTime = 0 }
      win.classList.remove("window-closing")
      win.classList.add("hidden")
      win.style.display = "none"
    }, 300)
  }
  const icon = document.getElementById(`taskbar-icon-${id}`)
  if (icon) icon.remove()
}

function createTaskbarIcon(id) {
  if (document.getElementById(`taskbar-icon-${id}`)) return
  const win = document.getElementById(id)
  const title = win ? win.querySelector(".window-header span").textContent.replace(".EXE","") : id
  const btn = document.createElement("button")
  btn.id = `taskbar-icon-${id}`
  btn.className = "taskbar-icon"
  btn.innerHTML = `<span>${title}</span>`
  btn.addEventListener("click", () => { openWindow(id); btn.remove() })
  document.getElementById("taskbar-icons").appendChild(btn)
}

function toggleMaximizeWindow(id) {
  const win = document.getElementById(id)
  if (!win) return
  const isMax = !win.classList.contains("maximized")
  if (isMax) {
    windowStates[id] = {
      parent: win.parentNode,
      next: win.nextSibling,
      position: win.style.position,
      top: win.style.top,
      left: win.style.left,
      width: win.style.width,
      height: win.style.height,
      transform: win.style.transform
    }
    win.classList.add("window-maximizing")
    setTimeout(() => {
      document.body.appendChild(win)
      win.classList.add("maximized")
      win.classList.remove("window-maximizing")
      Object.assign(win.style, {
        position:"fixed", top:"0", left:"0", right:"0", bottom:"36px",
        width:"auto", height:"auto", transform:"none", zIndex:getNextZIndex()
      })
    }, 300)
  } else {
    win.classList.add("window-restoring")
    win.classList.remove("maximized")
    setTimeout(() => {
      const prev = windowStates[id] || {}
      Object.assign(win.style, {
        position: prev.position||"absolute",
        top: prev.top||"", left: prev.left||"",
        width: prev.width||"", height: prev.height||"",
        transform: prev.transform||"", zIndex:getNextZIndex()
      })
      if (prev.parent) prev.parent.insertBefore(win, prev.next)
      win.classList.remove("window-restoring")
    },300)
  }
}

function isMobile() {
  return window.innerWidth < 768
}

//────────────────────────────────────────────────────────────────────────────
// 3) CLOCK & START MENU
//────────────────────────────────────────────────────────────────────────────
function updateClock() {
  const clk = document.getElementById("clock")
  if (!clk) return
  const now = new Date()
  const h = String(now.getHours()).padStart(2,'0')
  const m = String(now.getMinutes()).padStart(2,'0')
  const s = String(now.getSeconds()).padStart(2,'0')
  clk.textContent = `${h}:${m}:${s}`
  clk.classList.add("clock-pulse")
  setTimeout(() => clk.classList.remove("clock-pulse"), 500)
}
setInterval(updateClock,1000)
updateClock()

document.getElementById("start-button").addEventListener("click", () => {
  const m = document.getElementById("start-menu")
  if (m.style.display === "flex") {
    m.classList.add("menu-hiding")
    setTimeout(() => { m.style.display="none"; m.classList.remove("menu-hiding") },300)
  } else {
    m.style.display="flex"
    m.classList.add("menu-showing")
    setTimeout(() => m.classList.remove("menu-showing"),300)
  }
})

//────────────────────────────────────────────────────────────────────────────
// 4) BOOT SEQUENCE
//────────────────────────────────────────────────────────────────────────────
function runBootSequence() {
  return new Promise((resolve) => {
    const bootScreen = document.getElementById("bootScreen")
    const logEl = document.getElementById("boot-log")
    const progress = document.getElementById("progress-bar")
    if (!bootScreen || !logEl || !progress) {
      console.warn("Missing bootScreen elements, skipping boot.")
      resolve()
      return
    }

    const msgs = [
      "[ OK ] Initializing hardware...",
      "[ OK ] Loading kernel modules...",
      "[ OK ] Mounting filesystems...",
      "[ OK ] Starting system services...",
      "[ OK ] Loading neural interface...",
      "[ OK ] Connecting to cyberspace...",
      "[ OK ] CyberDeck v2.0 ready.",
      "[ DONE ] Boot complete."
    ]
    let idx = 0, total = msgs.length, delay = 400

    const typer = setInterval(() => {
      logEl.textContent += msgs[idx] + "\n"
      logEl.scrollTop = logEl.scrollHeight
      progress.style.width = `${((idx+1)/total)*100}%`
      playSound("type")

      idx++
      if (idx === total) {
        clearInterval(typer)
        setTimeout(() => {
          bootScreen.style.transition = "opacity 0.8s"
          bootScreen.style.opacity = "0"
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

//────────────────────────────────────────────────────────────────────────────
// 5) DESKTOP ICONS & MULTI-SELECT
//────────────────────────────────────────────────────────────────────────────
function initDesktopIcons() {
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    icon.addEventListener("dblclick", () => openWindow(icon.dataset.window))
    icon.addEventListener("mouseenter", () => icon.classList.add("icon-hover"))
    icon.addEventListener("mouseleave", () => icon.classList.remove("icon-hover"))

    icon.addEventListener("mousedown", e => {
      e.preventDefault()
      const parentRect = icon.parentElement.getBoundingClientRect()
      const clickRect = icon.getBoundingClientRect()
      let group = icon.classList.contains("selected")
        ? Array.from(document.querySelectorAll(".desktop-icon.selected"))
        : (document.querySelectorAll(".desktop-icon.selected").forEach(ic=>ic.classList.remove("selected")), [icon].concat(icon.classList.add("selected")))

      const shiftX = e.clientX - clickRect.left
      const shiftY = e.clientY - clickRect.top

      const groupData = group.map(ic => {
        const r = ic.getBoundingClientRect()
        ic.style.left = `${r.left - parentRect.left}px`
        ic.style.top = `${r.top - parentRect.top}px`
        ic.style.zIndex = getNextZIndex()
        return { icon: ic, startLeft: r.left - parentRect.left, startTop: r.top - parentRect.top }
      })

      function onMouseMove(e) {
        const dx = e.clientX - shiftX - parentRect.left - groupData[0].startLeft
        const dy = e.clientY - shiftY - parentRect.top - groupData[0].startTop
        groupData.forEach(({icon, startLeft, startTop}) => {
          icon.style.left = `${startLeft + dx}px`
          icon.style.top = `${startTop + dy}px`
        })
      }

      document.addEventListener("mousemove", onMouseMove, {passive:true})
      document.addEventListener("mouseup", () => document.removeEventListener("mousemove", onMouseMove), {once:true, passive:true})
    })

    icon.ondragstart = () => false
  })
}

let selStartX, selStartY, selDiv
function onSelectStart(e) {
  if (e.target.closest(".desktop-icon, .popup-window, #start-bar, #start-menu")) return
  selStartX = e.clientX; selStartY = e.clientY
  selDiv = document.createElement("div"); selDiv.id = "selection-rect"
  selDiv.style.left = `${selStartX}px`; selDiv.style.top = `${selStartY}px`
  document.body.appendChild(selDiv)
  document.addEventListener("mousemove", onSelectMove, {passive:true})
  document.addEventListener("mouseup", onSelectEnd, {once:true, passive:true})
  e.preventDefault()
}
function onSelectMove(e) {
  if (!selDiv) return
  const x = Math.min(e.clientX, selStartX),
        y = Math.min(e.clientY, selStartY),
        w = Math.abs(e.clientX - selStartX),
        h = Math.abs(e.clientY - selStartY)
  Object.assign(selDiv.style, { left:`${x}px`, top:`${y}px`, width:`${w}px`, height:`${h}px` })
  const box = selDiv.getBoundingClientRect()
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    const r = icon.getBoundingClientRect()
    icon.classList.toggle("selected", r.left>=box.left && r.right<=box.right && r.top>=box.top && r.bottom<=box.bottom)
  })
}
function onSelectEnd() {
  if (selDiv) selDiv.remove()
  selDiv = null
}
window.addEventListener("mousedown", onSelectStart)

//────────────────────────────────────────────────────────────────────────────
// 6) STARFIELD BACKGROUND
//────────────────────────────────────────────────────────────────────────────
function initStarfield() {
  const canvas = document.getElementById("background-canvas"),
        ctx = canvas.getContext("2d")
  const handleResize = debounce(() => {
    canvas.width = innerWidth; canvas.height = innerHeight; initStars()
  }, 250)
  window.addEventListener("resize", handleResize)
  canvas.width = innerWidth; canvas.height = innerHeight

  const numStars = 300
  const stars = Array.from({length:numStars}, () => ({
    x:Math.random()*canvas.width,
    y:Math.random()*canvas.height,
    z:Math.random()*canvas.width,
    o:Math.random(),
    color:getRandomStarColor()
  }))

  let lastTime = 0
  const fps=120, frameInterval=1000/fps

  function animate(timestamp) {
    if (!lastTime) lastTime=timestamp
    const elapsed = timestamp - lastTime
    if (elapsed>frameInterval) {
      lastTime = timestamp - (elapsed%frameInterval)
      ctx.fillStyle="rgba(0,0,0,0.4)"; ctx.fillRect(0,0,canvas.width,canvas.height)
      const batchSize = Math.min(100, stars.length)
      for (let i=0; i<batchSize; i++){
        const s=stars[i]
        s.z-=2
        if (s.z<=0){
          s.z=canvas.width
          s.x=Math.random()*canvas.width
          s.y=Math.random()*canvas.height
          s.o=Math.random()
          s.color=getRandomStarColor()
        }
        const k=128.0/s.z
        const px=(s.x-canvas.width/2)*k+canvas.width/2
        const py=(s.y-canvas.height/2)*k+canvas.width/2
        const sz=Math.max(0,(1-s.z/canvas.width)*3)
        ctx.globalAlpha=s.o
        ctx.fillStyle=s.color
        ctx.beginPath()
        ctx.arc(px,py,sz,0,Math.PI*2)
        ctx.fill()
      }
      stars.push(...stars.splice(0,batchSize))
    }
    ctx.globalAlpha=1
    requestAnimationFrame(animate)
  }

  function initStars(){
    for(let i=0;i<stars.length;i++){
      stars[i]={x:Math.random()*canvas.width,y:Math.random()*canvas.height,z:Math.random()*canvas.width,o:Math.random(),color:getRandomStarColor()}
    }
  }

  function getRandomStarColor() {
    const colors=["#ffffff","#a9a1ff","#f3a1ff","#00f0ff","#fffc00","#00ff66"]
    return colors[Math.floor(Math.random()*colors.length)]
  }

  requestAnimationFrame(animate)
}
