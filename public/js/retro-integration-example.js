/**
 * Retro Integration Examples - How to integrate retro components with existing pages
 * For retro desktop-style portfolio sites
 */

document.addEventListener("DOMContentLoaded", () => {
  // ===== EXAMPLE 1: Add window launcher buttons to existing content =====

  // Find all elements with the class 'project-card' (or whatever class your project cards use)
  const projectCards = document.querySelectorAll(".project-card, .portfolio-item, .work-example")

  projectCards.forEach((card) => {
    // Get project info from the card
    const title = card.querySelector("h2, h3, .title")?.textContent || "Project"
    const description = card.querySelector("p, .description")?.textContent || ""
    const imageUrl = card.querySelector("img")?.src || ""

    // Create a "View in Window" button
    const windowButton = document.createElement("button")
    windowButton.className = "retro-button retro-window-launcher"
    windowButton.textContent = "Open in Window"
    windowButton.style.marginTop = "10px"

    // Add click handler to open project in a window
    windowButton.addEventListener("click", () => {
      if (window.retroWindows) {
        const content = `
          <div style="padding: 15px; text-align: center;">
            ${imageUrl ? `<img src="${imageUrl}" alt="${title}" style="max-width: 100%; margin-bottom: 15px;">` : ""}
            <h2 style="color: #0ff; font-family: 'Press Start 2P', cursive; margin-bottom: 15px;">${title}</h2>
            <p style="margin-bottom: 20px;">${description}</p>
            <div style="display: flex; justify-content: center; gap: 10px;">
              <button class="retro-button" onclick="window.open('${card.querySelector("a")?.href || "#"}', '_blank')">Visit Project</button>
              <button class="retro-button" onclick="this.closest('.retro-window').querySelector('.retro-window-close').click()">Close</button>
            </div>
          </div>
        `

        window.retroWindows.createWindow({
          title: title,
          content: content,
          width: 500,
          height: 400,
          theme: "cyan",
        })
      } else {
        console.error("RetroWindows not loaded")
      }
    })

    // Add the button to the card
    card.appendChild(windowButton)
  })

  // ===== EXAMPLE 2: Convert existing navigation to start menu items =====

  // This function creates a start menu from your existing navigation
  const createStartMenuFromNav = () => {
    // Find your main navigation
    const mainNav = document.querySelector("nav, .main-nav, .site-navigation")
    if (!mainNav) return []

    // Get all navigation links
    const navLinks = mainNav.querySelectorAll("a")

    // Convert to menu items
    const menuItems = Array.from(navLinks).map((link) => {
      return {
        label: link.textContent,
        icon: "🔗",
        onClick: () => (window.location.href = link.href),
      }
    })

    // Add separator and additional items
    menuItems.push({ separator: true })
    menuItems.push({
      label: "Contact Me",
      icon: "✉️",
      onClick: () => {
        if (window.retroWindows) {
          const contactForm = `
            <div style="padding: 20px;">
              <h2 style="color: #0ff; font-family: 'Press Start 2P', cursive; margin-bottom: 20px;">Contact Me</h2>
              <form id="retro-contact-form" style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                  <label style="display: block; margin-bottom: 5px; color: #0ff;">Name:</label>
                  <input type="text" name="name" style="width: 100%; padding: 8px; background: #111; border: 2px solid #0ff; color: #fff;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 5px; color: #0ff;">Email:</label>
                  <input type="email" name="email" style="width: 100%; padding: 8px; background: #111; border: 2px solid #0ff; color: #fff;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 5px; color: #0ff;">Message:</label>
                  <textarea name="message" rows="5" style="width: 100%; padding: 8px; background: #111; border: 2px solid #0ff; color: #fff;"></textarea>
                </div>
                <button type="submit" class="retro-button" style="align-self: flex-start;">Send Message</button>
              </form>
            </div>
          `

          const win = window.retroWindows.createWindow({
            title: "Contact Me",
            content: contactForm,
            width: 400,
            height: 500,
            theme: "cyan",
          })

          // Handle form submission
          setTimeout(() => {
            const form = document.getElementById("retro-contact-form")
            if (form) {
              form.addEventListener("submit", (e) => {
                e.preventDefault()
                // Here you would normally send the form data to your server
                alert("Message sent! (This is a demo)")
                win.close()
              })
            }
          }, 100)
        }
      },
    })

    return menuItems
  }

  // ===== EXAMPLE 3: Add a floating desktop icon grid =====

  const createDesktopIcons = () => {
    // Create desktop container
    const desktop = document.createElement("div")
    desktop.className = "retro-desktop-icons"
    desktop.style.position = "fixed"
    desktop.style.top = "20px"
    desktop.style.left = "20px"
    desktop.style.display = "grid"
    desktop.style.gridTemplateColumns = "repeat(1, 80px)"
    desktop.style.gridGap = "20px"
    desktop.style.zIndex = "8000"

    // Define desktop icons
    const icons = [
      {
        name: "About Me",
        icon: "👤",
        onClick: () => {
          if (window.retroWindows) {
            // Get your about content from the page if it exists
            const aboutContent =
              document.querySelector("#about, .about, .about-me")?.innerHTML ||
              "<h2>About Me</h2><p>This is where your about content would go.</p>"

            window.retroWindows.createWindow({
              title: "About Me",
              content: `<div style="padding: 20px;">${aboutContent}</div>`,
              width: 500,
              height: 400,
              theme: "magenta",
            })
          }
        },
      },
      {
        name: "Projects",
        icon: "📁",
        onClick: () => {
          if (window.retroWindows) {
            // Get your projects content from the page if it exists
            const projectsContent =
              document.querySelector("#projects, .projects, .portfolio")?.innerHTML ||
              "<h2>My Projects</h2><p>This is where your projects would be listed.</p>"

            window.retroWindows.createWindow({
              title: "My Projects",
              content: `<div style="padding: 20px;">${projectsContent}</div>`,
              width: 600,
              height: 500,
              theme: "green",
            })
          }
        },
      },
      {
        name: "Music",
        icon: "🎵",
        onClick: () => {
          if (window.RetroMusicPlayer) {
            new RetroMusicPlayer({
              playlist: [
                {
                  title: "Synthwave 80s",
                  url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/synthwave.mp3",
                },
                {
                  title: "Cyberpunk Nights",
                  url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/cyberpunk.mp3",
                },
              ],
              theme: "yellow",
            })
          }
        },
      },
      {
        name: "Terminal",
        icon: "💻",
        onClick: () => {
          if (window.retroWindows) {
            const terminalContent = `
              <div class="retro-terminal-content" style="height: 100%; background: #000; padding: 10px; font-family: 'VT323', monospace; color: #0f0;">
                <div id="terminal-output" style="height: calc(100% - 30px); overflow-y: auto;"></div>
                <div style="display: flex; margin-top: 10px;">
                  <span style="color: #0f0; margin-right: 5px;">$</span>
                  <input type="text" id="terminal-input" style="flex: 1; background: #000; border: none; outline: none; color: #0f0; font-family: 'VT323', monospace; font-size: 16px;">
                </div>
              </div>
            `

            const win = window.retroWindows.createWindow({
              title: "Terminal",
              content: terminalContent,
              width: 600,
              height: 400,
              theme: "green",
            })

            // Set up terminal functionality
            setTimeout(() => {
              const output = document.getElementById("terminal-output")
              const input = document.getElementById("terminal-input")

              if (output && input) {
                // Add welcome message
                output.innerHTML += "Welcome to RetroOS Terminal v1.0<br>"
                output.innerHTML += 'Type "help" for available commands<br><br>'

                // Handle input
                input.addEventListener("keydown", (e) => {
                  if (e.key === "Enter") {
                    const cmd = input.value.trim()
                    output.innerHTML += `$ ${cmd}<br>`

                    // Process command
                    if (cmd === "help") {
                      output.innerHTML += "Available commands:<br>"
                      output.innerHTML += "- help: Show this help<br>"
                      output.innerHTML += "- clear: Clear terminal<br>"
                      output.innerHTML += "- date: Show current date<br>"
                      output.innerHTML += "- echo [text]: Echo text<br>"
                      output.innerHTML += "- exit: Close terminal<br><br>"
                    } else if (cmd === "clear") {
                      output.innerHTML = ""
                    } else if (cmd === "date") {
                      output.innerHTML += `${new Date().toString()}<br><br>`
                    } else if (cmd.startsWith("echo ")) {
                      output.innerHTML += `${cmd.substring(5)}<br><br>`
                    } else if (cmd === "exit") {
                      win.close()
                    } else if (cmd) {
                      output.innerHTML += `Command not found: ${cmd}<br><br>`
                    }

                    input.value = ""
                    output.scrollTop = output.scrollHeight
                  }
                })

                // Focus input
                input.focus()
              }
            }, 100)
          }
        },
      },
    ]

    // Create icons
    icons.forEach((icon) => {
      const iconEl = document.createElement("div")
      iconEl.className = "retro-desktop-icon"
      iconEl.style.width = "80px"
      iconEl.style.textAlign = "center"
      iconEl.style.cursor = "pointer"

      iconEl.innerHTML = `
        <div style="font-size: 32px; margin-bottom: 5px;">${icon.icon}</div>
        <div style="font-family: 'VT323', monospace; color: #fff; text-shadow: 0 0 5px #0ff; font-size: 14px;">${icon.name}</div>
      `

      iconEl.addEventListener("click", icon.onClick)
      desktop.appendChild(iconEl)
    })

    document.body.appendChild(desktop)
  }

  // ===== EXAMPLE 4: Add a boot sequence that loads your existing content =====

  const addBootSequence = () => {
    // Create a button to trigger the boot sequence
    const bootButton = document.createElement("button")
    bootButton.className = "retro-button"
    bootButton.textContent = "Boot RetroOS"
    bootButton.style.position = "fixed"
    bootButton.style.bottom = "140px"
    bootButton.style.right = "20px"
    bootButton.style.zIndex = "1000"
    bootButton.style.padding = "10px 15px"
    bootButton.style.backgroundColor = "#000"
    bootButton.style.color = "#0f0"
    bootButton.style.border = "2px solid #0f0"
    bootButton.style.boxShadow = "0 0 10px rgba(0, 255, 0, 0.5)"
    bootButton.style.fontFamily = '"Press Start 2P", cursive'
    bootButton.style.fontSize = "12px"
    bootButton.style.cursor = "pointer"

    bootButton.addEventListener("mouseover", () => {
      bootButton.style.backgroundColor = "#0f0"
      bootButton.style.color = "#000"
    })

    bootButton.addEventListener("mouseout", () => {
      bootButton.style.backgroundColor = "#000"
      bootButton.style.color = "#0f0"
    })

    bootButton.addEventListener("click", () => {
      // Hide the existing content temporarily
      const mainContent = document.querySelector("main, #content, .content, .main-content")
      if (mainContent) {
        mainContent.style.opacity = "0"
        mainContent.style.transition = "opacity 0.5s ease"
      }

      // Start boot sequence
      if (window.RetroBoot) {
        new RetroBoot({
          bootSpeed: 2,
          onComplete: () => {
            // Show content again
            if (mainContent) {
              mainContent.style.opacity = "1"
            }

            // Initialize desktop components
            if (window.RetroTaskbar) {
              new RetroTaskbar({
                menuItems: createStartMenuFromNav(),
                theme: "cyan",
              })
            }

            // Add desktop icons
            createDesktopIcons()

            // Remove the boot button
            if (bootButton.parentNode) {
              bootButton.parentNode.removeChild(bootButton)
            }
          },
        })
      }
    })

    document.body.appendChild(bootButton)
  }

  // ===== EXAMPLE 5: Add a floating action button to launch retro mode =====

  const addRetroModeToggle = () => {
    const toggleButton = document.createElement("button")
    toggleButton.className = "retro-mode-toggle"
    toggleButton.innerHTML = "🕹️"
    toggleButton.style.position = "fixed"
    toggleButton.style.bottom = "20px"
    toggleButton.style.right = "20px"
    toggleButton.style.width = "60px"
    toggleButton.style.height = "60px"
    toggleButton.style.borderRadius = "50%"
    toggleButton.style.backgroundColor = "#000"
    toggleButton.style.color = "#fff"
    toggleButton.style.border = "3px solid #0ff"
    toggleButton.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.7)"
    toggleButton.style.fontSize = "24px"
    toggleButton.style.cursor = "pointer"
    toggleButton.style.zIndex = "9999"
    toggleButton.style.display = "flex"
    toggleButton.style.alignItems = "center"
    toggleButton.style.justifyContent = "center"

    toggleButton.addEventListener("click", () => {
      // Check if retro mode is already active
      const isRetroActive = document.body.classList.contains("retro-mode-active")

      if (isRetroActive) {
        // Disable retro mode
        document.body.classList.remove("retro-mode-active")

        // Remove taskbar if it exists
        const taskbar = document.querySelector(".retro-taskbar")
        if (taskbar) taskbar.parentNode.removeChild(taskbar)

        // Remove desktop icons
        const desktopIcons = document.querySelector(".retro-desktop-icons")
        if (desktopIcons) desktopIcons.parentNode.removeChild(desktopIcons)

        // Close all windows
        if (window.retroWindows) {
          window.retroWindows.closeAll()
        }

        toggleButton.style.border = "3px solid #0ff"
        toggleButton.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.7)"
      } else {
        // Enable retro mode
        document.body.classList.add("retro-mode-active")

        // Initialize taskbar
        if (window.RetroTaskbar) {
          new RetroTaskbar({
            menuItems: createStartMenuFromNav(),
            theme: "cyan",
          })
        }

        // Add desktop icons
        createDesktopIcons()

        toggleButton.style.border = "3px solid #f0f"
        toggleButton.style.boxShadow = "0 0 15px rgba(255, 0, 255, 0.7)"
      }
    })

    document.body.appendChild(toggleButton)

    // Add retro mode styles
    const styleEl = document.createElement("style")
    styleEl.textContent = `
      .retro-mode-active {
        /* Add a subtle scanline effect to the whole page */
        position: relative;
      }
      
      .retro-mode-active::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          rgba(18, 16, 16, 0) 50%, 
          rgba(0, 0, 0, 0.25) 50%
        );
        background-size: 100% 4px;
        pointer-events: none;
        z-index: 9998;
        opacity: 0.3;
      }
      
      /* Add a glow effect to headings */
      .retro-mode-active h1, 
      .retro-mode-active h2, 
      .retro-mode-active h3 {
        text-shadow: 0 0 5px #0ff;
      }
      
      /* Style buttons */
      .retro-mode-active button:not(.retro-button):not(.retro-mode-toggle):not(.retro-window-close):not(.retro-window-minimize):not(.retro-window-maximize):not(.retro-taskbar-start):not(.retro-taskbar-item) {
        background-color: #000 !important;
        color: #0ff !important;
        border: 2px solid #0ff !important;
        box-shadow: 0 0 5px rgba(0, 255, 255, 0.5) !important;
        transition: all 0.2s ease !important;
      }
      
      .retro-mode-active button:not(.retro-button):not(.retro-mode-toggle):not(.retro-window-close):not(.retro-window-minimize):not(.retro-window-maximize):not(.retro-taskbar-start):not(.retro-taskbar-item):hover {
        background-color: #0ff !important;
        color: #000 !important;
      }
    `

    document.head.appendChild(styleEl)
  }

  // Declare variables for external libraries
  const RetroMusicPlayer = window.RetroMusicPlayer
  const RetroBoot = window.RetroBoot
  const RetroTaskbar = window.RetroTaskbar

  // Initialize the integration examples
  setTimeout(() => {
    // Add the retro mode toggle button (this is the main entry point)
    addRetroModeToggle()

    // Add boot sequence button
    addBootSequence()
  }, 500)
})
