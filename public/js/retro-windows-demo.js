// Demo script to show how to use the RetroWindows system

document.addEventListener("DOMContentLoaded", () => {
  // Create a button to open a demo window
  const createDemoButton = () => {
    const button = document.createElement("button")
    button.className = "retro-button"
    button.textContent = "Open Demo Window"
    button.style.position = "fixed"
    button.style.bottom = "20px"
    button.style.right = "20px"
    button.style.zIndex = "1000"
    button.style.padding = "10px 15px"
    button.style.backgroundColor = "#000"
    button.style.color = "#0ff"
    button.style.border = "2px solid #0ff"
    button.style.boxShadow = "0 0 10px rgba(0, 255, 255, 0.5)"
    button.style.fontFamily = '"Press Start 2P", cursive'
    button.style.fontSize = "12px"
    button.style.cursor = "pointer"

    button.addEventListener("mouseover", () => {
      button.style.backgroundColor = "#0ff"
      button.style.color = "#000"
    })

    button.addEventListener("mouseout", () => {
      button.style.backgroundColor = "#000"
      button.style.color = "#0ff"
    })

    button.addEventListener("click", openDemoWindow)

    document.body.appendChild(button)
  }

  // Open a demo window with various content examples
  const openDemoWindow = () => {
    const demoContent = `
      <div style="padding: 10px;">
        <h2 style="color: #0ff; font-family: 'Press Start 2P', cursive; margin-bottom: 20px;">RetroWindows Demo</h2>
        
        <p>This is a draggable, resizable window with neon styling.</p>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #0ff;">Video Example</h3>
          <p>Videos automatically stop when the window is closed:</p>
          <video width="100%" height="auto" controls>
            <source src="https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/sample-video.mp4?v=1618329772328" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #0ff;">Audio Example</h3>
          <p>Audio also stops when the window is closed:</p>
          <audio controls>
            <source src="https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/sample-audio.mp3?v=1618329772328" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #0ff;">Iframe Example</h3>
          <p>Iframes are reset when the window is closed:</p>
          <iframe width="100%" height="200" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
        
        <div style="margin: 20px 0;">
          <button id="open-cyan-window" style="background: #000; color: #0ff; border: 2px solid #0ff; padding: 5px 10px; margin-right: 10px; font-family: 'VT323', monospace;">Cyan Window</button>
          <button id="open-magenta-window" style="background: #000; color: #f0f; border: 2px solid #f0f; padding: 5px 10px; margin-right: 10px; font-family: 'VT323', monospace;">Magenta Window</button>
          <button id="open-green-window" style="background: #000; color: #0f0; border: 2px solid #0f0; padding: 5px 10px; margin-right: 10px; font-family: 'VT323', monospace;">Green Window</button>
          <button id="open-yellow-window" style="background: #000; color: #ff0; border: 2px solid #ff0; padding: 5px 10px; font-family: 'VT323', monospace;">Yellow Window</button>
        </div>
      </div>
    `

    const win = window.retroWindows.createWindow({
      title: "RetroWindows Demo",
      content: demoContent,
      width: 600,
      height: 500,
      theme: "cyan",
    })

    // Add event listeners to the color buttons after the window is created
    setTimeout(() => {
      const cyanBtn = document.getElementById("open-cyan-window")
      const magentaBtn = document.getElementById("open-magenta-window")
      const greenBtn = document.getElementById("open-green-window")
      const yellowBtn = document.getElementById("open-yellow-window")

      if (cyanBtn) {
        cyanBtn.addEventListener("click", () => {
          window.retroWindows.createWindow({
            title: "Cyan Window",
            content:
              '<div style="padding: 20px;"><h2 style="color: #0ff;">Cyan Theme</h2><p>This window uses the cyan theme.</p></div>',
            width: 400,
            height: 300,
            theme: "cyan",
          })
        })
      }

      if (magentaBtn) {
        magentaBtn.addEventListener("click", () => {
          window.retroWindows.createWindow({
            title: "Magenta Window",
            content:
              '<div style="padding: 20px;"><h2 style="color: #f0f;">Magenta Theme</h2><p>This window uses the magenta theme.</p></div>',
            width: 400,
            height: 300,
            theme: "magenta",
          })
        })
      }

      if (greenBtn) {
        greenBtn.addEventListener("click", () => {
          window.retroWindows.createWindow({
            title: "Green Window",
            content:
              '<div style="padding: 20px;"><h2 style="color: #0f0;">Green Theme</h2><p>This window uses the green theme.</p></div>',
            width: 400,
            height: 300,
            theme: "green",
          })
        })
      }

      if (yellowBtn) {
        yellowBtn.addEventListener("click", () => {
          window.retroWindows.createWindow({
            title: "Yellow Window",
            content:
              '<div style="padding: 20px;"><h2 style="color: #ff0;">Yellow Theme</h2><p>This window uses the yellow theme.</p></div>',
            width: 400,
            height: 300,
            theme: "yellow",
          })
        })
      }
    }, 100)
  }

  // Initialize demo
  createDemoButton()
})
