// starfield.js - Animated starfield background
import { debounce } from "./core.js"

export function initStarfield() {
  const canvas = document.getElementById("background-canvas")
  if (!canvas) return

  const ctx = canvas.getContext("2d")

  let stars = []
  const STAR_COUNT = 500
  let animationFrameId
  let isLightMode = document.body.classList.contains("light-mode")

  // Initialize stars
  function initStars() {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * canvas.width,
      o: Math.random(),
      // Add color variation in light mode
      color: isLightMode ? getRandomLightColor() : "#fff",
    }))
  }

  // Get random color for light mode stars
  function getRandomLightColor() {
    const colors = ["#6a5acd", "#9370db", "#8a2be2", "#4b0082", "#483d8b"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Draw stars with optimized rendering
  function drawStars() {
    // Clear canvas with appropriate background
    ctx.fillStyle = isLightMode ? "rgba(240,240,240,1)" : "rgba(0,0,0,1)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Use batch rendering for better performance
    for (const s of stars) {
      // Twinkle effect
      s.o += (Math.random() - 0.5) * 0.02
      s.o = Math.max(0.1, Math.min(1, s.o))

      // Move forward with depth-based speed
      s.z -= 2 * (1 - (s.z / canvas.width) * 0.5) // Faster stars are closer

      // Reset stars that move out of view
      if (s.z <= 0) {
        s.z = canvas.width
        s.x = Math.random() * canvas.width
        s.y = Math.random() * canvas.height
        s.o = Math.random()
        if (isLightMode) s.color = getRandomLightColor()
      }

      // Calculate perspective projection
      const k = 128.0 / s.z
      const px = (s.x - canvas.width / 2) * k + canvas.width / 2
      const py = (s.y - canvas.height / 2) * k + canvas.height / 2

      // Size based on depth (z-coordinate)
      const sz = Math.max(0.5, (1 - s.z / canvas.width) * 2)

      // Only draw stars that are within the canvas
      if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
        ctx.globalAlpha = s.o
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(px, py, sz, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.globalAlpha = 1
  }

  // Handle window resize with debounce
  window.addEventListener(
    "resize",
    debounce(() => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }, 250),
  )

  // Handle theme changes
  function handleThemeChange() {
    isLightMode = document.body.classList.contains("light-mode")
    // Update star colors on theme change
    stars.forEach((star) => {
      star.color = isLightMode ? getRandomLightColor() : "#fff"
    })
  }

  // Listen for theme toggle events
  window.addEventListener("storage", (event) => {
    if (event.key === "theme") {
      handleThemeChange()
    }
  })

  // Also check for direct class changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "class") {
        handleThemeChange()
      }
    })
  })

  observer.observe(document.body, { attributes: true })

  // Initial setup
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  initStars()

  // Animation loop with requestAnimationFrame
  function animate() {
    drawStars()
    animationFrameId = requestAnimationFrame(animate)
  }

  // Start animation
  animate()

  // Cleanup function to cancel animation when needed
  return function cleanup() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    observer.disconnect()
  }
}
