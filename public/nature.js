document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".gallery-item")
  const prevBtn = document.getElementById("prevBtn")
  const nextBtn = document.getElementById("nextBtn")
  let currentIndex = 0
  let isAnimating = false

  // Add screen reader only element for announcements
  const srAnnounce = document.createElement("div")
  srAnnounce.setAttribute("aria-live", "polite")
  srAnnounce.className = "sr-only"
  document.body.appendChild(srAnnounce)

  // Preload images for smoother transitions
  function preloadImages() {
    const images = Array.from(items)
      .map((item) => {
        const img = item.querySelector("img")
        return img ? img.src : null
      })
      .filter(Boolean)

    images.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }

  function showSlide(index) {
    // Don't process if animation is in progress
    if (isAnimating) return
    isAnimating = true

    // Hide all slides
    items.forEach((item) => {
      item.classList.remove("active")
      item.setAttribute("aria-hidden", "true")
    })

    // Show current slide with animation
    const currentItem = items[index]
    currentItem.classList.add("active")
    currentItem.setAttribute("aria-hidden", "false")

    // Add fade-in animation
    currentItem.style.opacity = "0"
    setTimeout(() => {
      currentItem.style.opacity = "1"
      isAnimating = false
    }, 50)

    // Announce to screen readers
    const caption = currentItem.querySelector(".caption").textContent
    srAnnounce.textContent = `Image ${index + 1} of ${items.length}: ${caption}`
  }

  // Previous button click with debounce
  prevBtn.addEventListener("click", () => {
    if (isAnimating) return
    currentIndex = (currentIndex - 1 + items.length) % items.length
    showSlide(currentIndex)
  })

  // Next button click with debounce
  nextBtn.addEventListener("click", () => {
    if (isAnimating) return
    currentIndex = (currentIndex + 1) % items.length
    showSlide(currentIndex)
  })

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      prevBtn.click()
    } else if (e.key === "ArrowRight") {
      nextBtn.click()
    }
  })

  // Touch swipe support with improved performance
  let touchStartX = 0
  let touchEndX = 0
  let touchStartTime = 0

  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].screenX
    touchStartTime = new Date().getTime()
  }

  const handleTouchEnd = (e) => {
    touchEndX = e.changedTouches[0].screenX
    const touchEndTime = new Date().getTime()
    const touchDuration = touchEndTime - touchStartTime

    // Only handle quick swipes (less than 300ms)
    if (touchDuration < 300) {
      handleSwipe()
    }
  }

  const handleSwipe = () => {
    // Detect swipe direction (minimum 50px movement)
    if (touchEndX < touchStartX - 50) {
      // Swipe left, show next
      nextBtn.click()
    } else if (touchEndX > touchStartX + 50) {
      // Swipe right, show previous
      prevBtn.click()
    }
  }

  document.addEventListener("touchstart", handleTouchStart, { passive: true })
  document.addEventListener("touchend", handleTouchEnd, { passive: true })

  // Initialize first slide
  showSlide(currentIndex)

  // Preload images
  preloadImages()

  // Add screen reader only class if it doesn't exist
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

  // Check for theme changes
  window.addEventListener("storage", (event) => {
    if (event.key === "theme") {
      if (event.newValue === "light") {
        document.body.classList.add("light-mode")
      } else {
        document.body.classList.remove("light-mode")
      }
    }
  })

  // Auto-advance slides every 5 seconds if not interacted with
  let autoAdvanceTimer

  function startAutoAdvance() {
    autoAdvanceTimer = setInterval(() => {
      currentIndex = (currentIndex + 1) % items.length
      showSlide(currentIndex)
    }, 5000)
  }

  function stopAutoAdvance() {
    clearInterval(autoAdvanceTimer)
  }

  // Start auto-advance
  startAutoAdvance()

  // Stop auto-advance on user interaction
  ;[prevBtn, nextBtn].forEach((btn) => {
    btn.addEventListener("click", () => {
      stopAutoAdvance()
      // Restart after 10 seconds of inactivity
      setTimeout(startAutoAdvance, 10000)
    })
  })

  document.addEventListener("keydown", () => {
    stopAutoAdvance()
    // Restart after 10 seconds of inactivity
    setTimeout(startAutoAdvance, 10000)
  })

  document.addEventListener("touchstart", () => {
    stopAutoAdvance()
    // Restart after 10 seconds of inactivity
    setTimeout(startAutoAdvance, 10000)
  })
})
