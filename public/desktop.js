/**
 * Desktop Manager
 * Manages desktop icons and background
 */

class DesktopManager {
  constructor(options = {}) {
    this.container = options.container || document.body
    this.icons = options.icons || []
    this.background = options.background || "#000"
    this.natureGalleryImages = options.natureGalleryImages || []

    this.init()
  }

  init() {
    // Set background
    this.setBackground()

    // Create desktop icons
    this.createDesktopIcons()

    // Add resize listener
    window.addEventListener("resize", () => this.arrangeIcons())
  }

  setBackground() {
    const backgroundEl = document.getElementById("background") || document.createElement("div")
    backgroundEl.id = "background"
    backgroundEl.style.position = "fixed"
    backgroundEl.style.top = "0"
    backgroundEl.style.left = "0"
    backgroundEl.style.width = "100%"
    backgroundEl.style.height = "100%"
    backgroundEl.style.zIndex = "-1"

    if (typeof this.background === "string") {
      // Color or image URL
      if (this.background.startsWith("#") || this.background.startsWith("rgb")) {
        backgroundEl.style.backgroundColor = this.background
      } else {
        backgroundEl.style.backgroundImage = `url(${this.background})`
        backgroundEl.style.backgroundSize = "cover"
        backgroundEl.style.backgroundPosition = "center"
      }
    } else if (typeof this.background === "function") {
      // Custom background function
      this.background(backgroundEl)
    }

    if (!backgroundEl.parentNode) {
      document.body.appendChild(backgroundEl)
    }
  }

  createDesktopIcons() {
    // Create desktop container if it doesn't exist
    let desktopIcons = document.querySelector(".desktop-icons")
    if (!desktopIcons) {
      desktopIcons = document.createElement("div")
      desktopIcons.className = "desktop-icons"
      desktopIcons.style.position = "fixed"
      desktopIcons.style.top = "20px"
      desktopIcons.style.left = "20px"
      desktopIcons.style.display = "grid"
      desktopIcons.style.gridTemplateColumns = "repeat(1, 80px)"
      desktopIcons.style.gridGap = "20px"
      desktopIcons.style.zIndex = "10"
      this.container.appendChild(desktopIcons)
    }

    // Add icons
    this.icons.forEach((icon) => {
      // Skip if icon already exists
      if (document.getElementById(`desktop-icon-${icon.id}`)) return

      const iconEl = document.createElement("div")
      iconEl.id = `desktop-icon-${icon.id}`
      iconEl.className = "desktop-icon"
      iconEl.style.width = "80px"
      iconEl.style.height = "90px"
      iconEl.style.display = "flex"
      iconEl.style.flexDirection = "column"
      iconEl.style.alignItems = "center"
      iconEl.style.justifyContent = "center"
      iconEl.style.cursor = "pointer"
      iconEl.style.transition = "all 0.2s ease"

      iconEl.innerHTML = `
        <img src="${icon.icon}" alt="" class="desktop-icon-img" style="width: 48px; height: 48px; margin-bottom: 5px; filter: drop-shadow(0 0 5px ${icon.color || "#0ff"});">
        <div class="desktop-icon-label" style="font-family: 'VT323', monospace; font-size: 14px; color: #fff; text-align: center; text-shadow: 0 0 5px #000; background-color: rgba(0, 0, 0, 0.5); padding: 2px 5px; border-radius: 3px; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${icon.label}</div>
      `

      iconEl.addEventListener("click", icon.onClick)
      iconEl.addEventListener("mouseover", () => {
        iconEl.style.transform = "scale(1.05)"
      })
      iconEl.addEventListener("mouseout", () => {
        iconEl.style.transform = "scale(1)"
      })

      desktopIcons.appendChild(iconEl)
    })

    // Arrange icons
    this.arrangeIcons()
  }

  arrangeIcons() {
    const desktopIcons = document.querySelector(".desktop-icons")
    if (!desktopIcons) return

    // Adjust grid based on screen size
    if (window.innerWidth < 768) {
      desktopIcons.style.gridTemplateColumns = "repeat(2, 80px)"
    } else {
      desktopIcons.style.gridTemplateColumns = "repeat(1, 80px)"
    }
  }

  addIcon(icon) {
    this.icons.push(icon)
    this.createDesktopIcons()
  }

  removeIcon(id) {
    this.icons = this.icons.filter((icon) => icon.id !== id)
    const iconEl = document.getElementById(`desktop-icon-${id}`)
    if (iconEl) {
      iconEl.parentNode.removeChild(iconEl)
    }
  }

  // Nature Gallery specific methods
  createNatureGallery() {
    if (!window.windowManager) {
      console.error("Window Manager not initialized")
      return null
    }

    const container = document.createElement("div")
    container.className = "nature-gallery-container"
    container.style.padding = "15px"
    container.style.height = "100%"
    container.style.overflowY = "auto"

    // Create gallery grid
    const grid = document.createElement("div")
    grid.className = "nature-gallery-grid"
    grid.style.display = "grid"
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(200px, 1fr))"
    grid.style.gap = "15px"

    // Add images
    this.natureGalleryImages.forEach((image, index) => {
      const item = document.createElement("div")
      item.className = "nature-gallery-item"
      item.dataset.index = index
      item.style.position = "relative"
      item.style.overflow = "hidden"
      item.style.border = "2px solid #0f0"
      item.style.cursor = "pointer"
      item.style.transition = "all 0.3s ease"

      item.innerHTML = `
        <img src="${image.url}" alt="${image.title || "Nature image"}" style="width: 100%; height: 200px; object-fit: cover; display: block; transition: transform 0.3s ease;">
        <div class="nature-gallery-caption" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0, 0, 0, 0.7); padding: 10px; transform: translateY(100%); transition: transform 0.3s ease;">
          <h3 style="font-family: 'Press Start 2P', cursive; font-size: 14px; color: #0f0; margin-bottom: 5px;">${image.title || "Nature image"}</h3>
          <p style="font-family: 'VT323', monospace; font-size: 14px; color: #fff;">${image.description || ""}</p>
        </div>
      `

      // Hover effect
      item.addEventListener("mouseover", () => {
        item.style.transform = "scale(1.03)"
        item.style.boxShadow = "0 0 15px rgba(0, 255, 0, 0.5)"
        item.querySelector("img").style.transform = "scale(1.1)"
        item.querySelector(".nature-gallery-caption").style.transform = "translateY(0)"
      })

      item.addEventListener("mouseout", () => {
        item.style.transform = "scale(1)"
        item.style.boxShadow = "none"
        item.querySelector("img").style.transform = "scale(1)"
        item.querySelector(".nature-gallery-caption").style.transform = "translateY(100%)"
      })

      // Click to open lightbox
      item.addEventListener("click", () => {
        this.openLightbox(index)
      })

      grid.appendChild(item)
    })

    container.appendChild(grid)

    // Create window
    const galleryWindow = window.windowManager.createWindow({
      id: "nature-gallery-window",
      title: "Nature Gallery",
      content: container,
      width: "800px",
      height: "600px",
    })

    return galleryWindow
  }

  openLightbox(index) {
    // Create lightbox if it doesn't exist
    let lightbox = document.querySelector(".nature-lightbox")

    if (!lightbox) {
      lightbox = document.createElement("div")
      lightbox.className = "nature-lightbox"
      lightbox.style.position = "fixed"
      lightbox.style.top = "0"
      lightbox.style.left = "0"
      lightbox.style.right = "0"
      lightbox.style.bottom = "0"
      lightbox.style.backgroundColor = "rgba(0, 0, 0, 0.9)"
      lightbox.style.display = "none"
      lightbox.style.alignItems = "center"
      lightbox.style.justifyContent = "center"
      lightbox.style.zIndex = "9999"

      lightbox.innerHTML = `
        <div class="nature-lightbox-content" style="position: relative; max-width: 90%; max-height: 90%;">
          <img src="/placeholder.svg" alt="" class="nature-lightbox-image" style="max-width: 100%; max-height: 80vh; border: 2px solid #0f0; box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);">
          <div class="nature-lightbox-caption" style="position: absolute; bottom: -40px; left: 0; right: 0; background-color: rgba(0, 0, 0, 0.7); padding: 10px; text-align: center;"></div>
          <button class="nature-lightbox-close" style="position: absolute; top: 10px; right: 10px; background-color: rgba(0, 0, 0, 0.7); border: 1px solid #0f0; color: #0f0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px;">×</button>
          <button class="nature-lightbox-prev" style="position: absolute; top: 50%; left: 10px; transform: translateY(-50%); background-color: rgba(0, 0, 0, 0.7); border: 1px solid #0f0; color: #0f0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px;">❮</button>
          <button class="nature-lightbox-next" style="position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background-color: rgba(0, 0, 0, 0.7); border: 1px solid #0f0; color: #0f0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px;">❯</button>
        </div>
      `

      document.body.appendChild(lightbox)

      // Add event listeners
      const closeBtn = lightbox.querySelector(".nature-lightbox-close")
      const prevBtn = lightbox.querySelector(".nature-lightbox-prev")
      const nextBtn = lightbox.querySelector(".nature-lightbox-next")

      closeBtn.addEventListener("click", () => {
        lightbox.style.display = "none"
      })

      prevBtn.addEventListener("click", () => {
        const currentIndex = Number.parseInt(lightbox.dataset.index)
        const newIndex = (currentIndex - 1 + this.natureGalleryImages.length) % this.natureGalleryImages.length
        this.updateLightbox(newIndex)
      })

      nextBtn.addEventListener("click", () => {
        const currentIndex = Number.parseInt(lightbox.dataset.index)
        const newIndex = (currentIndex + 1) % this.natureGalleryImages.length
        this.updateLightbox(newIndex)
      })

      // Close on background click
      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
          lightbox.style.display = "none"
        }
      })
    }

    // Update lightbox content
    this.updateLightbox(index)

    // Show lightbox
    lightbox.style.display = "flex"
  }

  updateLightbox(index) {
    const lightbox = document.querySelector(".nature-lightbox")
    const image = this.natureGalleryImages[index]

    lightbox.dataset.index = index

    const imgEl = lightbox.querySelector(".nature-lightbox-image")
    const captionEl = lightbox.querySelector(".nature-lightbox-caption")

    imgEl.src = image.url
    imgEl.alt = image.title || "Nature image"

    captionEl.innerHTML = `
      <h3 style="font-family: 'Press Start 2P', cursive; font-size: 14px; color: #0f0; margin-bottom: 5px;">${image.title || "Nature image"}</h3>
      <p style="font-family: 'VT323', monospace; font-size: 14px; color: #fff;">${image.description || ""}</p>
    `
  }
}

// Initialize desktop manager
window.desktopManager = new DesktopManager({
  background: "/images/cyberpunk-background.jpg",
  icons: [
    {
      id: "about",
      label: "About Me",
      icon: "/images/about-icon.png",
      color: "#0ff",
      onClick: () => {
        if (window.windowManager) {
          window.windowManager.createWindow({
            id: "about-window",
            title: "About Me",
            content: `
              <div style="padding: 20px;">
                <h2 style="color: #0ff; font-family: 'Press Start 2P', cursive; margin-bottom: 20px;">About Me</h2>
                <p>Welcome to my cyberpunk portfolio! I'm a creative developer with a passion for building immersive digital experiences.</p>
                <p>My skills include:</p>
                <ul>
                  <li>Front-end: HTML, CSS, JavaScript</li>
                  <li>Back-end: Node.js, Express</li>
                  <li>Design: UI/UX, Digital Art</li>
                </ul>
              </div>
            `,
            width: "500px",
            height: "400px",
          })
        }
      },
    },
    {
      id: "projects",
      label: "Projects",
      icon: "/images/projects-icon.png",
      color: "#f0f",
      onClick: () => {
        if (window.windowManager) {
          window.windowManager.createWindow({
            id: "projects-window",
            title: "My Projects",
            content: `
              <div style="padding: 20px;">
                <h2 style="color: #f0f; font-family: 'Press Start 2P', cursive; margin-bottom: 20px;">My Projects</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
                  <div style="border: 1px solid #f0f; padding: 15px;">
                    <h3 style="color: #f0f;">Project 1</h3>
                    <p>Description of project 1</p>
                  </div>
                  <div style="border: 1px solid #f0f; padding: 15px;">
                    <h3 style="color: #f0f;">Project 2</h3>
                    <p>Description of project 2</p>
                  </div>
                  <div style="border: 1px solid #f0f; padding: 15px;">
                    <h3 style="color: #f0f;">Project 3</h3>
                    <p>Description of project 3</p>
                  </div>
                </div>
              </div>
            `,
            width: "700px",
            height: "500px",
          })
        }
      },
    },
    {
      id: "snake",
      label: "Snake Game",
      icon: "/images/snake-icon.png",
      color: "#0f0",
      onClick: () => {
        if (window.windowManager) {
          const gameWindow = window.windowManager.createWindow({
            id: "snake-game-window",
            title: "Snake Game",
            content: `
              <div style="padding: 10px; display: flex; flex-direction: column; align-items: center;">
                <canvas id="snake-canvas" width="400" height="400" style="border: 2px solid #0f0; box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);"></canvas>
                <div style="margin-top: 10px; font-family: 'VT323', monospace; color: #0f0; text-align: center;">
                  <p>Use arrow keys or WASD to move the snake.</p>
                  <p>Press P to pause/resume the game.</p>
                </div>
              </div>
            `,
            width: "450px",
            height: "500px",
          })

          // Initialize snake game
          setTimeout(() => {
            if (window.initSnakeGame) {
              const game = window.initSnakeGame("snake-canvas", {
                gridSize: 20,
                speed: 100,
                backgroundColor: "#000",
                snakeColor: "#0f0",
                foodColor: "#f00",
                powerUpColor: "#ff0",
                borderColor: "#0ff",
                scoreColor: "#0f0",
              })

              // Clean up game when window is closed
              gameWindow.addEventListener("window-closed", () => {
                if (game && game.destroy) {
                  game.destroy()
                }
              })
            }
          }, 100)
        }
      },
    },
    {
      id: "nature",
      label: "Nature Gallery",
      icon: "/images/nature-icon.png",
      color: "#0f0",
      onClick: () => {
        if (window.desktopManager) {
          window.desktopManager.createNatureGallery()
        }
      },
    },
    {
      id: "contact",
      label: "Contact",
      icon: "/images/contact-icon.png",
      color: "#ff0",
      onClick: () => {
        if (window.windowManager) {
          const contactWindow = window.windowManager.createWindow({
            id: "contact-window",
            title: "Contact Me",
            content: `
              <div style="padding: 20px;">
                <h2 style="color: #ff0; font-family: 'Press Start 2P', cursive; margin-bottom: 20px;">Contact Me</h2>
                <form id="contact-form">
                  <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #ff0;">Name:</label>
                    <input type="text" name="name" style="width: 100%; padding: 8px; background: #111; border: 1px solid #ff0; color: #fff;" required>
                  </div>
                  <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #ff0;">Email:</label>
                    <input type="email" name="email" style="width: 100%; padding: 8px; background: #111; border: 1px solid #ff0; color: #fff;" required>
                  </div>
                  <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #ff0;">Message:</label>
                    <textarea name="message" rows="5" style="width: 100%; padding: 8px; background: #111; border: 1px solid #ff0; color: #fff;" required></textarea>
                  </div>
                  <button type="submit" style="background: #000; color: #ff0; border: 1px solid #ff0; padding: 8px 15px; cursor: pointer;">Send Message</button>
                </form>
                <div id="contact-result" style="margin-top: 15px;"></div>
              </div>
            `,
            width: "500px",
            height: "500px",
          })

          // Set up form submission
          setTimeout(() => {
            const form = contactWindow.querySelector("#contact-form")
            const result = contactWindow.querySelector("#contact-result")

            if (form) {
              form.addEventListener("submit", async (e) => {
                e.preventDefault()

                const formData = new FormData(form)
                const data = {
                  name: formData.get("name"),
                  email: formData.get("email"),
                  message: formData.get("message"),
                }

                result.textContent = "Sending message..."
                result.style.color = "#ff0"

                try {
                  const response = await fetch("/contact", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                  })

                  const responseData = await response.json()

                  if (responseData.success) {
                    result.textContent = "Message sent successfully!"
                    result.style.color = "#0f0"
                    form.reset()
                  } else {
                    result.textContent = "Failed to send message. Please try again."
                    result.style.color = "#f00"
                  }
                } catch (error) {
                  result.textContent = "An error occurred. Please try again."
                  result.style.color = "#f00"
                  console.error("Error sending message:", error)
                }
              })
            }
          }, 100)
        }
      },
    },
  ],
  natureGalleryImages: [
    {
      url: "/images/nature1.jpg",
      title: "Forest Path",
      description: "A serene path through a dense forest.",
    },
    {
      url: "/images/nature2.jpg",
      title: "Mountain Vista",
      description: "Breathtaking view of mountains at sunset.",
    },
    {
      url: "/images/nature3.jpg",
      title: "Ocean Waves",
      description: "Powerful waves crashing against the shore.",
    },
    {
      url: "/images/nature4.jpg",
      title: "Desert Landscape",
      description: "Vast desert dunes under a clear blue sky.",
    },
    {
      url: "/images/nature5.jpg",
      title: "Autumn Colors",
      description: "Vibrant fall foliage in a peaceful forest.",
    },
    {
      url: "/images/nature6.jpg",
      title: "Tropical Paradise",
      description: "Crystal clear waters and palm trees on a tropical beach.",
    },
  ],
})
