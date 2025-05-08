// main.js - Main entry point
import { preloadAssets, runBootSequence, initThemeToggle, initClock, initStartMenu, initGlitchEffects } from "./core.js"
import { initWindowControls, setupMobileWindowSupport } from "./windows.js"
import { initDesktopIcons, initDesktopKeyboardNav } from "./desktop.js"
import { initStarfield } from "./starfield.js"
import { initAccessibility } from "./accessibility.js"
import { setupMobileSupport } from "./mobile.js"
import { loadVideos } from "./content-loader.js"

// Main initialization function
async function initApp() {
  // Initialize window controls immediately for better perceived performance
  initWindowControls()

  // Load content data
  await loadVideos()

  // Preload assets and then start boot sequence
  await preloadAssets()

  // Hide preloader
  const preloader = document.getElementById("preloader")
  if (preloader) {
    preloader.style.opacity = "0"
    preloader.style.visibility = "hidden"
  }

  // Continue with boot sequence
  await runBootSequence()

  // Initialize all modules
  initDesktopIcons()
  initStarfield()
  initGlitchEffects()
  initClock()
  initStartMenu()
  initThemeToggle()
  initDesktopKeyboardNav()
  initAccessibility()

  // Mobile-specific enhancements
  setupMobileSupport()
  setupMobileWindowSupport()

  // Register service worker for better performance and offline support
  registerServiceWorker()

  // Initialize content loaders
  initContentLoaders()
}

// Register service worker
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("ServiceWorker registration successful with scope: ", registration.scope)
        })
        .catch((error) => {
          console.log("ServiceWorker registration failed: ", error)
        })
    })
  }
}

// Initialize content loaders
function initContentLoaders() {
  // Use IntersectionObserver to lazy load content
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target

          // Handle different types of content
          if (element.classList.contains("desktop-icon")) {
            const img = element.querySelector("img")
            if (img && img.dataset.src) {
              img.src = img.dataset.src
              img.removeAttribute("data-src")
            }
          }

          observer.unobserve(element)
        }
      })
    },
    {
      rootMargin: "100px",
      threshold: 0.1,
    },
  )

  // Observe desktop icons for lazy loading
  document.querySelectorAll(".desktop-icon").forEach((icon) => {
    observer.observe(icon)
  })
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initApp)

// Export public API
window.openWindow = (id) => {
  import("./windows.js").then((module) => {
    module.openWindow(id)
  })
}
