/**
 * RetroBoot - A boot screen simulator with terminal output and loading bar
 * For retro desktop-style portfolio sites
 */

class RetroBoot {
  constructor(options = {}) {
    this.container = options.container || document.body
    this.onComplete = options.onComplete || null
    this.bootMessages = options.bootMessages || this.getDefaultBootMessages()
    this.bootLogo = options.bootLogo || "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/tiger.gif"
    this.bootSpeed = options.bootSpeed || 1 // Speed multiplier
    this.typingSpeed = options.typingSpeed || 10 // ms per character

    this.bootScreen = null
    this.terminal = null
    this.progressBar = null
    this.progressValue = null

    this.messageIndex = 0
    this.charIndex = 0
    this.currentMessage = ""
    this.isTyping = false
    this.progress = 0

    this.init()
  }

  init() {
    // Create boot screen
    this.bootScreen = document.createElement("div")
    this.bootScreen.className = "retro-boot-screen"

    // Create logo container
    const logoContainer = document.createElement("div")
    logoContainer.className = "retro-boot-logo"
    logoContainer.innerHTML = `<img src="${this.bootLogo}" alt="Boot Logo">`

    // Create terminal
    this.terminal = document.createElement("div")
    this.terminal.className = "retro-boot-terminal"

    // Create progress bar
    const progressContainer = document.createElement("div")
    progressContainer.className = "retro-boot-progress-container"

    this.progressBar = document.createElement("div")
    this.progressBar.className = "retro-boot-progress-bar"

    this.progressValue = document.createElement("div")
    this.progressValue.className = "retro-boot-progress-value"
    this.progressValue.textContent = "0%"

    progressContainer.appendChild(this.progressBar)
    progressContainer.appendChild(this.progressValue)

    // Add elements to boot screen
    this.bootScreen.appendChild(logoContainer)
    this.bootScreen.appendChild(this.terminal)
    this.bootScreen.appendChild(progressContainer)

    // Add boot screen to container
    this.container.appendChild(this.bootScreen)

    // Add styles
    this.addStyles()

    // Start boot sequence
    setTimeout(() => this.startBoot(), 500)
  }

  startBoot() {
    this.typeNextMessage()
    this.updateProgress()
  }

  typeNextMessage() {
    if (this.messageIndex >= this.bootMessages.length) {
      // All messages typed
      setTimeout(() => this.completeBootSequence(), 1000)
      return
    }

    this.currentMessage = this.bootMessages[this.messageIndex]
    this.charIndex = 0
    this.isTyping = true

    this.typeCharacter()
  }

  typeCharacter() {
    if (this.charIndex < this.currentMessage.length) {
      const char = this.currentMessage.charAt(this.charIndex)

      // Create a new span for this character
      const charSpan = document.createElement("span")
      charSpan.textContent = char

      // Add special class for command prompts
      if (this.charIndex === 0 && (char === ">" || char === "$" || char === "#")) {
        charSpan.className = "retro-boot-prompt"
      }

      this.terminal.appendChild(charSpan)

      // Auto-scroll terminal
      this.terminal.scrollTop = this.terminal.scrollHeight

      this.charIndex++

      // Random typing speed variation
      const randomDelay = this.typingSpeed * (0.5 + Math.random())
      setTimeout(() => this.typeCharacter(), randomDelay / this.bootSpeed)
    } else {
      // Line complete
      this.terminal.appendChild(document.createElement("br"))
      this.isTyping = false
      this.messageIndex++

      // Random delay between messages
      const messageDelay = 100 + Math.random() * 300
      setTimeout(() => this.typeNextMessage(), messageDelay / this.bootSpeed)
    }
  }

  updateProgress() {
    const totalMessages = this.bootMessages.length
    const targetProgress = (this.messageIndex / totalMessages) * 100

    // Smoothly animate progress towards target
    const animate = () => {
      if (this.progress < targetProgress) {
        this.progress += 0.5
        this.progressBar.style.width = `${this.progress}%`
        this.progressValue.textContent = `${Math.floor(this.progress)}%`

        requestAnimationFrame(animate)
      } else if (this.messageIndex < totalMessages) {
        // Schedule next progress update
        setTimeout(() => this.updateProgress(), 100)
      }
    }

    animate()
  }

  completeBootSequence() {
    // Ensure progress is 100%
    this.progress = 100
    this.progressBar.style.width = "100%"
    this.progressValue.textContent = "100%"

    // Add completion message
    const completionMsg = document.createElement("div")
    completionMsg.className = "retro-boot-completion"
    completionMsg.textContent = "BOOT SEQUENCE COMPLETE"
    this.bootScreen.appendChild(completionMsg)

    // Fade out boot screen
    setTimeout(() => {
      this.bootScreen.classList.add("retro-boot-complete")

      // Remove boot screen after animation
      setTimeout(() => {
        if (this.bootScreen.parentNode) {
          this.bootScreen.parentNode.removeChild(this.bootScreen)
        }

        // Call completion callback
        if (typeof this.onComplete === "function") {
          this.onComplete()
        }
      }, 1000)
    }, 1000)
  }

  getDefaultBootMessages() {
    return [
      "> Initializing system...",
      "> Loading kernel modules...",
      "> Checking hardware configuration...",
      "> CPU: AMD Ryzen 9000X @ 5.2GHz",
      "> RAM: 64GB DDR5-6400",
      "> GPU: RTX 5090 ULTRA with 32GB VRAM",
      "> Storage: 4TB NVMe SSD",
      "> Initializing network interfaces...",
      "> eth0: Connected (1000 Mbps)",
      "> wlan0: Connected (867 Mbps)",
      "> Loading system services...",
      "> Starting X server...",
      "> Loading window manager...",
      "> Mounting file systems...",
      "> /dev/sda1: mounted",
      "> /dev/sda2: mounted",
      "> Checking for updates...",
      "> System up to date",
      "> Loading user profile...",
      "> Welcome back, user",
      "> Starting desktop environment...",
    ]
  }

  addStyles() {
    if (!document.getElementById("retro-boot-styles")) {
      const styleEl = document.createElement("style")
      styleEl.id = "retro-boot-styles"
      styleEl.textContent = `
        .retro-boot-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #000;
          color: #0f0;
          font-family: 'VT323', monospace;
          font-size: 18px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          padding: 20px;
          box-sizing: border-box;
          overflow: hidden;
        }
        
        .retro-boot-logo {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .retro-boot-logo img {
          max-width: 300px;
          max-height: 200px;
        }
        
        .retro-boot-terminal {
          flex: 1;
          background-color: rgba(0, 20, 0, 0.5);
          border: 1px solid #0f0;
          padding: 10px;
          overflow-y: auto;
          margin-bottom: 20px;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
          white-space: pre-wrap;
          line-height: 1.2;
        }
        
        .retro-boot-prompt {
          color: #0ff;
          font-weight: bold;
        }
        
        .retro-boot-progress-container {
          height: 30px;
          background-color: #000;
          border: 1px solid #0f0;
          position: relative;
          margin-bottom: 20px;
        }
        
        .retro-boot-progress-bar {
          height: 100%;
          width: 0%;
          background: linear-gradient(
            to right,
            #0f0,
            #0ff
          );
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.7);
        }
        
        .retro-boot-progress-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-weight: bold;
          text-shadow: 0 0 5px #000;
        }
        
        .retro-boot-completion {
          text-align: center;
          font-family: 'Press Start 2P', cursive;
          font-size: 24px;
          color: #0ff;
          margin-top: 20px;
          text-shadow: 0 0 10px #0ff;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .retro-boot-complete {
          opacity: 0;
          transition: opacity 1s ease;
        }
        
        /* Scanlines effect */
        .retro-boot-screen::after {
          content: '';
          position: absolute;
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
          z-index: 1;
        }
      `
      document.head.appendChild(styleEl)
    }
  }
}

// Export to global scope
window.RetroBoot = RetroBoot
