/**
 * RetroDesktop - Integration script for all retro desktop components
 * For retro desktop-style portfolio sites
 */

document.addEventListener("DOMContentLoaded", () => {
  // Check if required scripts are loaded
  const requiredScripts = [
    { name: "RetroWindowManager", global: "retroWindows" },
    { name: "RetroBoot", global: "RetroBoot" },
    { name: "RetroMusicPlayer", global: "RetroMusicPlayer" },
    { name: "RetroTaskbar", global: "RetroTaskbar" },
  ]

  const missingScripts = requiredScripts.filter((script) => {
    return (
      typeof window[script.name] === "undefined" &&
      (script.global ? typeof window[script.global] === "undefined" : true)
    )
  })

  if (missingScripts.length > 0) {
    console.warn("Some RetroDesktop components are missing:", missingScripts.map((s) => s.name).join(", "))
  }

  // Create integration button
  const createIntegrationButton = () => {
    const button = document.createElement("button")
    button.className = "retro-button"
    button.textContent = "Launch RetroDesktop"
    button.style.position = "fixed"
    button.style.bottom = "180px"
    button.style.right = "20px"
    button.style.zIndex = "1000"
    button.style.padding = "10px 15px"
    button.style.backgroundColor = "#000"
    button.style.color = "#ff0"
    button.style.border = "2px solid #ff0"
    button.style.boxShadow = "0 0 10px rgba(255, 255, 0, 0.5)"
    button.style.fontFamily = '"Press Start 2P", cursive'
    button.style.fontSize = "12px"
    button.style.cursor = "pointer"

    button.addEventListener("mouseover", () => {
      button.style.backgroundColor = "#ff0"
      button.style.color = "#000"
    })

    button.addEventListener("mouseout", () => {
      button.style.backgroundColor = "#000"
      button.style.color = "#ff0"
    })

    button.addEventListener("click", launchRetroDesktop)

    document.body.appendChild(button)
  }

  // Launch the full retro desktop experience
  const launchRetroDesktop = () => {
    // Remove the launch button
    const button = document.querySelector("button.retro-button")
    if (button) {
      button.parentNode.removeChild(button)
    }

    // Start with boot sequence
    if (window.RetroBoot) {
      const retroBootInstance = new RetroBoot({
        bootSpeed: 3, // Faster for demo
        onComplete: () => {
          // After boot, initialize taskbar and desktop
          initializeDesktop()
        },
      })
    } else {
      // If boot sequence not available, just initialize desktop
      initializeDesktop()
    }
  }

  // Initialize desktop components
  const initializeDesktop = () => {
    // Add your desktop initialization logic here
    // For example:
    if (window.retroWindows) {
      // Initialize window manager
      window.retroWindows.init()
    }

    if (window.RetroTaskbar) {
      // Initialize taskbar
      window.RetroTaskbar.init()
    }

    if (window.RetroMusicPlayer) {
      // Initialize music player (example)
      window.RetroMusicPlayer.init()
    }

    console.log("RetroDesktop initialized!")
  }

  createIntegrationButton()
})
