// Demo script to show how to use the RetroMusicPlayer

document.addEventListener("DOMContentLoaded", () => {
  // Create a button to open the music player
  const createMusicPlayerButton = () => {
    const button = document.createElement("button")
    button.className = "retro-button"
    button.textContent = "Open Music Player"
    button.style.position = "fixed"
    button.style.bottom = "100px"
    button.style.right = "20px"
    button.style.zIndex = "1000"
    button.style.padding = "10px 15px"
    button.style.backgroundColor = "#000"
    button.style.color = "#f0f"
    button.style.border = "2px solid #f0f"
    button.style.boxShadow = "0 0 10px rgba(255, 0, 255, 0.5)"
    button.style.fontFamily = '"Press Start 2P", cursive'
    button.style.fontSize = "12px"
    button.style.cursor = "pointer"

    button.addEventListener("mouseover", () => {
      button.style.backgroundColor = "#f0f"
      button.style.color = "#000"
    })

    button.addEventListener("mouseout", () => {
      button.style.backgroundColor = "#000"
      button.style.color = "#f0f"
    })

    button.addEventListener("click", openMusicPlayer)

    document.body.appendChild(button)
  }

  // Open the music player
  const openMusicPlayer = () => {
    // Sample playlist with creative commons music
    const playlist = [
      {
        title: "Synthwave 80s",
        url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/synthwave.mp3",
      },
      {
        title: "Cyberpunk Nights",
        url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/cyberpunk.mp3",
      },
      {
        title: "Retro Gaming",
        url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/retrogaming.mp3",
      },
      {
        title: "Vaporwave Dreams",
        url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/vaporwave.mp3",
      },
    ]

    // Assuming RetroMusicPlayer is defined elsewhere or imported
    // If it's a global variable, ensure it's defined before this script runs.
    // If it's a module, you'll need to import it:
    // import RetroMusicPlayer from './retro-music-player.js'; // Adjust the path as needed

    // For demo purposes, let's assume RetroMusicPlayer is a global object
    // In a real project, you would import or define it properly

    // Placeholder implementation
    const RetroMusicPlayer = (options) => {
      console.log("RetroMusicPlayer initialized with:", options)
      // Placeholder implementation
    }

    new RetroMusicPlayer({
      playlist: playlist,
      theme: "magenta",
    })
  }

  // Initialize demo
  createMusicPlayerButton()
})
