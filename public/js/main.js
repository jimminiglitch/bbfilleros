/**
 * Main Integration Script
 * Initializes and connects all components
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize components
  initializeComponents()

  // Set up desktop icons
  setupDesktopIcons()

  // Add scanlines effect
  addScanlinesEffect()

  // Add CRT flicker effect
  addCRTFlickerEffect()

  // Add keyboard navigation support
  addKeyboardNavigation()

  // Add accessibility improvements
  addAccessibilityImprovements()

  // Initialize snake game if canvas exists
  if (document.getElementById("snake-canvas")) {
    window.snakeGame = window.initSnakeGame("snake-canvas", {
      gridSize: 20,
      speed: 100,
      backgroundColor: "#000",
      snakeColor: "#0f0",
      foodColor: "#f00",
      powerUpColor: "#ff0",
      borderColor: "#0ff",
      scoreColor: "#0ff",
    })
  }
})

function initializeComponents() {
  // Check if components are already initialized
  if (!window.windowManager) {
    console.error("Window Manager not initialized. Make sure windows.js is loaded before main.js.")
  }

  if (!window.mediaManager) {
    console.error("Media Manager not initialized. Make sure media-manager.js is loaded before main.js.")
  }

  // Add event listeners for taskbar buttons
  const startButton = document.querySelector(".taskbar-start")
  if (startButton) {
    const startMenu = document.querySelector(".start-menu")

    startButton.addEventListener("click", () => {
      startMenu.classList.toggle("active")
    })

    // Close start menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!startButton.contains(e.target) && !startMenu.contains(e.target)) {
        startMenu.classList.remove("active")
      }
    })
  }
}

function setupDesktopIcons() {
  // Create desktop icons container if it doesn't exist
  let desktopIcons = document.querySelector(".desktop-icons")
  if (!desktopIcons) {
    desktopIcons = document.createElement("div")
    desktopIcons.className = "desktop-icons"
    document.body.appendChild(desktopIcons)
  }

  // Define desktop icons
  const icons = [
    {
      id: "about",
      label: "About Me",
      icon: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/about-icon.png",
      onClick: () => createAboutWindow(),
    },
    {
      id: "resume",
      label: "Resume",
      icon: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/resume-icon.png",
      onClick: () => createResumeWindow(),
    },
    {
      id: "snake",
      label: "Snake Game",
      icon: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/game-icon.png",
      onClick: () => createSnakeGameWindow(),
    },
    {
      id: "music",
      label: "Music Player",
      icon: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/music-icon.png",
      onClick: () => window.mediaManager.createMusicPlayer(),
    },
    {
      id: "gallery",
      label: "Gallery",
      icon: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/gallery-icon.png",
      onClick: () => window.mediaManager.createImageGallery(),
    },
    {
      id: "videos",
      label: "Videos",
      icon: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/video-icon.png",
      onClick: () => createVideosWindow(),
    },
    {
      id: "contact",
      label: "Contact",
      icon: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/contact-icon.png",
      onClick: () => createContactWindow(),
    },
    {
      id: "add-media",
      label: "Add Media",
      icon: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/add-icon.png",
      onClick: () => window.mediaManager.createMediaUploader(),
    },
  ]

  // Create desktop icons
  icons.forEach((icon) => {
    // Skip if icon already exists
    if (document.getElementById(`desktop-icon-${icon.id}`)) return

    const iconEl = document.createElement("div")
    iconEl.id = `desktop-icon-${icon.id}`
    iconEl.className = "desktop-icon"
    iconEl.setAttribute("role", "button")
    iconEl.setAttribute("tabindex", "0")
    iconEl.setAttribute("aria-label", icon.label)

    iconEl.innerHTML = `
      <img src="${icon.icon}" alt="" class="desktop-icon-img">
      <div class="desktop-icon-label">${icon.label}</div>
    `

    iconEl.addEventListener("click", icon.onClick)
    iconEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        icon.onClick()
      }
    })

    desktopIcons.appendChild(iconEl)
  })
}

function addScanlinesEffect() {
  // Add scanlines effect if it doesn't exist
  if (!document.querySelector(".scanlines")) {
    const scanlines = document.createElement("div")
    scanlines.className = "scanlines"
    document.body.appendChild(scanlines)
  }
}

function addCRTFlickerEffect() {
  // Add CRT flicker effect to windows
  document.querySelectorAll(".window").forEach((windowEl) => {
    windowEl.classList.add("crt-flicker")
  })
}

function addKeyboardNavigation() {
  // Add keyboard navigation support
  document.addEventListener("keydown", (e) => {
    // Alt+Tab to cycle through windows
    if (e.altKey && e.key === "Tab") {
      e.preventDefault()

      const windows = Array.from(document.querySelectorAll(".window")).filter((win) => win.style.display !== "none")

      if (windows.length === 0) return

      // Find current active window
      const activeWindowIndex = windows.findIndex((win) => win.classList.contains("active-window"))

      // Calculate next window index
      const nextIndex = (activeWindowIndex + 1) % windows.length

      // Activate next window
      window.windowManager.activateWindow(windows[nextIndex])
    }

    // Escape to close active window
    if (e.key === "Escape" && !e.altKey && !e.ctrlKey && !e.shiftKey) {
      const activeWindow = document.querySelector(".window.active-window")
      if (activeWindow) {
        const closeBtn = activeWindow.querySelector(".close-button") || activeWindow.querySelector(".close")
        if (closeBtn) {
          closeBtn.click()
        }
      }
    }
  })
}

function addAccessibilityImprovements() {
  // Add ARIA roles to elements
  document.querySelectorAll(".window").forEach((windowEl) => {
    windowEl.setAttribute("role", "dialog")
    windowEl.setAttribute("aria-labelledby", `${windowEl.id}-title`)

    const titleEl = windowEl.querySelector(".window-title") || windowEl.querySelector(".title")
    if (titleEl) {
      titleEl.id = `${windowEl.id}-title`
    }
  })

  document.querySelectorAll(".taskbar-item").forEach((item) => {
    item.setAttribute("role", "button")
    item.setAttribute("tabindex", "0")
    item.setAttribute("aria-label", item.textContent.trim())
  })
}

// Window creation functions
function createAboutWindow() {
  return window.windowManager.createWindow({
    id: "about-window",
    title: "About Me",
    content: `
      <div class="about-content">
        <div class="about-header">
          <img src="https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/profile.jpg" alt="Profile Picture" class="about-avatar">
          <div class="about-title">
            <h2 class="neon-text">Cyberpunk Developer</h2>
            <p>Full-stack Developer & Digital Artist</p>
          </div>
        </div>
        <div class="about-bio">
          <p>Welcome to my cyberpunk-themed portfolio! I'm a creative developer with a passion for building immersive digital experiences.</p>
          <p>My skills include:</p>
          <ul>
            <li>Front-end: HTML, CSS, JavaScript, React</li>
            <li>Back-end: Node.js, Express, MongoDB</li>
            <li>Design: UI/UX, Digital Art, Animation</li>
            <li>Other: WebGL, Three.js, Game Development</li>
          </ul>
          <p>When I'm not coding, I enjoy creating digital art, playing video games, and exploring new technologies.</p>
        </div>
      </div>
    `,
    width: "600px",
    height: "400px",
  })
}

function createResumeWindow() {
  return window.windowManager.createWindow({
    id: "resume-window",
    title: "Resume",
    content: `
      <div class="resume-content">
        <h2 class="neon-text">Professional Experience</h2>
        <div class="resume-section">
          <h3>Senior Developer - Cybernetic Solutions</h3>
          <p class="resume-date">2020 - Present</p>
          <ul>
            <li>Lead development of immersive web experiences</li>
            <li>Architected scalable front-end solutions</li>
            <li>Mentored junior developers</li>
          </ul>
        </div>
        
        <div class="resume-section">
          <h3>Web Developer - Digital Frontiers</h3>
          <p class="resume-date">2018 - 2020</p>
          <ul>
            <li>Built responsive web applications</li>
            <li>Implemented interactive UI components</li>
            <li>Optimized site performance</li>
          </ul>
        </div>
        
        <h2 class="neon-text">Education</h2>
        <div class="resume-section">
          <h3>B.S. Computer Science</h3>
          <p>Tech University, 2018</p>
        </div>
        
        <h2 class="neon-text">Skills</h2>
        <div class="resume-skills">
          <span class="skill-tag">JavaScript</span>
          <span class="skill-tag">React</span>
          <span class="skill-tag">Node.js</span>
          <span class="skill-tag">HTML5/CSS3</span>
          <span class="skill-tag">WebGL</span>
          <span class="skill-tag">Three.js</span>
          <span class="skill-tag">UI/UX Design</span>
          <span class="skill-tag">Responsive Design</span>
        </div>
      </div>
    `,
    width: "700px",
    height: "500px",
  })
}

function createSnakeGameWindow() {
  const windowObj = window.windowManager.createWindow({
    id: "snake-game-window",
    title: "Snake Game",
    content: `
      <div class="game-container">
        <canvas id="snake-canvas" width="400" height="400"></canvas>
        <div class="game-instructions">
          <p>Use arrow keys or WASD to move the snake.</p>
          <p>Press P to pause/resume the game.</p>
          <p>Collect food to grow and earn points.</p>
          <p>Yellow power-ups give you a temporary speed boost!</p>
        </div>
      </div>
    `,
    width: "450px",
    height: "500px",
  })

  // Initialize snake game after window is created
  setTimeout(() => {
    window.snakeGame = window.initSnakeGame("snake-canvas", {
      gridSize: 20,
      speed: 100,
      backgroundColor: "#000",
      snakeColor: "#0f0",
      foodColor: "#f00",
      powerUpColor: "#ff0",
      borderColor: "#0ff",
      scoreColor: "#0ff",
    })

    // Clean up game when window is closed
    windowObj.addEventListener("window-closed", () => {
      if (window.snakeGame) {
        window.snakeGame.destroy()
      }
    })
  }, 100)

  return windowObj
}

function createVideosWindow() {
  // Create video list HTML
  let videosHTML = ""
  window.mediaManager.videos.forEach((video) => {
    videosHTML += `
      <div class="video-item" data-id="${video.id}">
        <div class="video-thumbnail">
          <img src="${video.thumbnail || "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/default-thumbnail.jpg"}" alt="${video.title}">
          <div class="video-play-button">▶</div>
        </div>
        <div class="video-info">
          <div class="video-title">${video.title}</div>
          <div class="video-description">${video.description || ""}</div>
        </div>
      </div>
    `
  })

  const windowObj = window.windowManager.createWindow({
    id: "videos-window",
    title: "Videos",
    content: `
      <div class="videos-container">
        <div class="videos-list">
          ${videosHTML}
        </div>
      </div>
    `,
    width: "700px",
    height: "500px",
  })

  // Add click handlers for videos
  setTimeout(() => {
    const videoItems = windowObj.querySelectorAll(".video-item")
    videoItems.forEach((item) => {
      item.addEventListener("click", () => {
        const videoId = item.dataset.id
        window.mediaManager.createVideoWindow(videoId)
      })
    })
  }, 100)

  return windowObj
}

function createContactWindow() {
  const windowObj = window.windowManager.createWindow({
    id: "contact-window",
    title: "Contact Me",
    content: `
      <div class="contact-container">
        <div class="contact-info">
          <h2 class="neon-text">Get In Touch</h2>
          <p>Feel free to reach out for collaborations, questions, or just to say hello!</p>
          
          <div class="contact-methods">
            <div class="contact-method">
              <div class="contact-icon">✉️</div>
              <div class="contact-detail">
                <h3>Email</h3>
                <p><a href="mailto:contact@example.com">contact@example.com</a></p>
              </div>
            </div>
            
            <div class="contact-method">
              <div class="contact-icon">🔗</div>
              <div class="contact-detail">
                <h3>LinkedIn</h3>
                <p><a href="https://linkedin.com/in/example" target="_blank">linkedin.com/in/example</a></p>
              </div>
            </div>
            
            <div class="contact-method">
              <div class="contact-icon">💻</div>
              <div class="contact-detail">
                <h3>GitHub</h3>
                <p><a href="https://github.com/example" target="_blank">github.com/example</a></p>
              </div>
            </div>
          </div>
        
        </div>
        
        <div class="contact-form">
          <h3>Send a Message</h3>
          <form id="contact-form">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" required>
            </div>
            
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
              <label for="message">Message</label>
              <textarea id="message" name="message" rows="5" required></textarea>
            </div>
            
            <button type="submit" class="submit-button">Send Message</button>
          </form>
        </div>
      </div>
    `,
    width: "600px",
    height: "500px",
  })

  // Add form submission handler
  setTimeout(() => {
    const form = windowObj.querySelector("#contact-form")
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault()

        // Get form data
        const name = form.querySelector("#name").value
        const email = form.querySelector("#email").value
        const message = form.querySelector("#message").value

        // Send form data to server
        fetch("/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, message }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              alert("Message sent successfully!")
              form.reset()
            } else {
              alert("Failed to send message. Please try again later.")
            }
          })
          .catch((error) => {
            console.error("Error sending message:", error)
            alert("An error occurred. Please try again later.")
          })
      })
    }
  }, 100)

  return windowObj
}
