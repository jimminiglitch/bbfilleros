// nature-gallery.js - Nature gallery functionality
import { loadGallery } from "./content-loader.js"

export async function initNatureGallery() {
  const natureWindow = document.getElementById("nature")
  if (!natureWindow) return

  const content = natureWindow.querySelector(".window-content")
  if (!content) return

  // Load images from content.json
  const images = await loadGallery()
  if (!images || images.length === 0) {
    content.innerHTML = "<p>No gallery images available</p>"
    return
  }

  let currentImage = 0

  // Clear existing content
  content.innerHTML = ""

  // Create gallery container with proper ARIA roles
  const galleryContainer = document.createElement("div")
  galleryContainer.className = "gallery-container"
  galleryContainer.setAttribute("role", "region")
  galleryContainer.setAttribute("aria-label", "Image gallery")
  content.appendChild(galleryContainer)

  // Create image element with loading optimization
  const img = document.createElement("img")
  img.className = "gallery-image"
  img.alt = images[currentImage].alt
  img.setAttribute("loading", "eager") // Load first image eagerly
  galleryContainer.appendChild(img)

  // Add caption element
  const caption = document.createElement("div")
  caption.className = "gallery-caption"
  caption.textContent = images[currentImage].caption
  galleryContainer.appendChild(caption)

  // Create controls with improved accessibility
  const controls = document.createElement("div")
  controls.className = "gallery-controls"
  controls.setAttribute("role", "group")
  controls.setAttribute("aria-label", "Gallery navigation")

  const prevBtn = document.createElement("button")
  prevBtn.textContent = "◀ Previous"
  prevBtn.setAttribute("aria-label", "Previous image")
  prevBtn.addEventListener("click", showPreviousImage)

  const nextBtn = document.createElement("button")
  nextBtn.textContent = "Next ▶"
  nextBtn.setAttribute("aria-label", "Next image")
  nextBtn.addEventListener("click", showNextImage)

  controls.appendChild(prevBtn)
  controls.appendChild(nextBtn)
  galleryContainer.appendChild(controls)

  // Add counter for accessibility
  const counter = document.createElement("div")
  counter.className = "gallery-counter"
  counter.setAttribute("aria-live", "polite")
  counter.textContent = `Image 1 of ${images.length}`
  galleryContainer.appendChild(counter)

  // Show image with optimized transitions
  function showImage(index) {
    // Fade out current image
    img.style.opacity = 0

    // Update image after fade out
    setTimeout(() => {
      // Preload next image
      const nextIndex = (index + 1) % images.length
      const preloadImg = new Image()
      preloadImg.src = images[nextIndex].src

      // Update current image
      img.src = images[index].src
      img.alt = images[index].alt
      caption.textContent = images[index].caption
      counter.textContent = `Image ${index + 1} of ${images.length}`

      // Fade in new image
      img.style.opacity = 1

      // Announce to screen readers
      const liveRegion = document.createElement("div")
      liveRegion.setAttribute("aria-live", "polite")
      liveRegion.className = "sr-only"
      liveRegion.textContent = `Image ${index + 1} of ${images.length}: ${images[index].caption}`
      document.body.appendChild(liveRegion)

      setTimeout(() => {
        document.body.removeChild(liveRegion)
      }, 1000)
    }, 300)
  }

  // Navigation functions
  function showPreviousImage() {
    currentImage = (currentImage - 1 + images.length) % images.length
    showImage(currentImage)
  }

  function showNextImage() {
    currentImage = (currentImage + 1) % images.length
    showImage(currentImage)
  }

  // Add keyboard navigation
  natureWindow.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      showPreviousImage()
    } else if (e.key === "ArrowRight") {
      showNextImage()
    }
  })

  // Add touch swipe support
  let touchStartX = 0
  let touchEndX = 0

  galleryContainer.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX
    },
    { passive: true },
  )

  galleryContainer.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX
      handleSwipe()
    },
    { passive: true },
  )

  function handleSwipe() {
    // Detect swipe direction (minimum 50px movement)
    if (touchEndX < touchStartX - 50) {
      // Swipe left, show next
      showNextImage()
    } else if (touchEndX > touchStartX + 50) {
      // Swipe right, show previous
      showPreviousImage()
    }
  }

  // Load first image
  img.src = images[currentImage].src
}

// Listen for custom event to initialize nature gallery
window.addEventListener("initNatureGallery", () => {
  initNatureGallery()
})
