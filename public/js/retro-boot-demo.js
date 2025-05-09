// Demo script to show how to use the RetroBoot system

document.addEventListener("DOMContentLoaded", () => {
  // Create a button to start the boot sequence
  const createBootButton = () => {
    const button = document.createElement("button")
    button.className = "retro-button"
    button.textContent = "Start Boot Sequence"
    button.style.position = "fixed"
    button.style.bottom = "60px"
    button.style.right = "20px"
    button.style.zIndex = "1000"
    button.style.padding = "10px 15px"
    button.style.backgroundColor = "#000"
    button.style.color = "#0f0"
    button.style.border = "2px solid #0f0"
    button.style.boxShadow = "0 0 10px rgba(0, 255, 0, 0.5)"
    button.style.fontFamily = '"Press Start 2P", cursive'
    button.style.fontSize = "12px"
    button.style.cursor = "pointer"

    button.addEventListener("mouseover", () => {
      button.style.backgroundColor = "#0f0"
      button.style.color = "#000"
    })

    button.addEventListener("mouseout", () => {
      button.style.backgroundColor = "#000"
      button.style.color = "#0f0"
    })

    button.addEventListener("click", startBootSequence)

    document.body.appendChild(button)
  }

  // Start the boot sequence
  const startBootSequence = () => {
    const RetroBoot = window.RetroBoot // Assuming RetroBoot is available globally
    new RetroBoot({
      bootLogo: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/tiger.gif",
      bootSpeed: 2, // Faster for demo purposes
      onComplete: () => {
        console.log("Boot sequence complete!")
        // You could launch your desktop environment here
      },
    })
  }

  // Initialize demo
  createBootButton()
})
