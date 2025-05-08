// core.js - Core utilities and shared functions

// Utility functions
export function debounce(func, wait) {
  let timeout
  return function () {
    const args = arguments
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

// Helper function to detect mobile devices
export function isMobile() {
  return window.innerWidth < 768 || "ontouchstart" in window
}

// Z-index management
let currentZIndex = 10
export function getNextZIndex() {
  return ++currentZIndex
}

// Preload critical assets
export function preloadAssets() {
  return new Promise((resolve) => {
    // List of critical images to preload
    const criticalImages = [
      "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Benny.png?v=1746392528967",
      "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/whodat.gif?v=1746365769069",
      "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/octavia.jpg?v=1746412752104",
      "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/MilesSwings2025.jpg?v=1746410914289",
    ]

    let loadedCount = 0
    const totalAssets = criticalImages.length

    // If no assets to preload, resolve immediately
    if (totalAssets === 0) {
      resolve()
      return
    }

    // Preload each image
    criticalImages.forEach((src) => {
      const img = new Image()
      img.onload = img.onerror = () => {
        loadedCount++
        if (loadedCount === totalAssets) {
          resolve()
        }
      }
      img.src = src
    })

    // Fallback in case some assets fail to load
    setTimeout(resolve, 5000)
  })
}

// Boot sequence
export function runBootSequence() {
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
      idx++
      if (idx === total) {
        clearInterval(typer)
        setTimeout(() => {
          bootScreen.style.transition = "opacity 0.8s"
          bootScreen.style.opacity = "0"
          setTimeout(() => {
            bootScreen.style.display = "none"
            resolve()
          }, 800)
        }, 500)
      }
    }, delay)
  })
}

// Theme management
export function initThemeToggle() {
  // Get theme toggle button
  const themeToggle = document.getElementById("theme-toggle")
  if (!themeToggle) return

  // Check for saved theme preference
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme === "light") {
    document.body.classList.add("light-mode")
    themeToggle.innerHTML = "☀️"
  }

  // Toggle theme on click
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode")
    const isLight = document.body.classList.contains("light-mode")

    // Save preference
    localStorage.setItem("theme", isLight ? "light" : "dark")

    // Update icon
    themeToggle.innerHTML = isLight ? "☀️" : "🌙"

    // Add transition effect
    document.body.classList.add("theme-transition")
    setTimeout(() => {
      document.body.classList.remove("theme-transition")
    }, 1000)

    // Dispatch storage event to notify iframes
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "theme",
        newValue: isLight ? "light" : "dark",
      }),
    )
  })
}

// Clock functionality
export function initClock() {
  function updateClock() {
    const clk = document.getElementById("clock")
    if (clk) {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, "0")
      const minutes = now.getMinutes().toString().padStart(2, "0")
      const seconds = now.getSeconds().toString().padStart(2, "0")
      clk.textContent = `${hours}:${minutes}:${seconds}`
      clk.classList.add("clock-pulse")
      setTimeout(() => {
        clk.classList.remove("clock-pulse")
      }, 500)
    }
  }

  setInterval(updateClock, 1000)
  updateClock()
}

// Start menu functionality
export function initStartMenu() {
  const startButton = document.getElementById("start-button")
  if (!startButton) return

  startButton.addEventListener("click", () => {
    const m = document.getElementById("start-menu")
    const isVisible = m.style.display === "flex"
    if (isVisible) {
      m.classList.add("menu-hiding")
      setTimeout(() => {
        m.style.display = "none"
        m.classList.remove("menu-hiding")
      }, 300)
    } else {
      m.style.display = "flex"
      m.classList.add("menu-showing")
      setTimeout(() => {
        m.classList.remove("menu-showing")
      }, 300)
    }

    // Update ARIA expanded state
    startButton.setAttribute("aria-expanded", !isVisible)
  })
}

// Visual effects
export function initGlitchEffects() {
  setInterval(() => {
    document.querySelectorAll(".glitch-me").forEach((el) => {
      if (Math.random() > 0.95) {
        el.classList.add("glitching")
        setTimeout(() => el.classList.remove("glitching"), 200 + Math.random() * 400)
      }
    })
  }, 2000)

  setInterval(() => {
    if (Math.random() > 0.98) {
      const glitch = document.createElement("div")
      glitch.className = "screen-glitch"
      document.body.appendChild(glitch)
      setTimeout(() => glitch.remove(), 150 + Math.random() * 250)
    }
  }, 10000)
}
