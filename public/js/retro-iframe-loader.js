/**
 * RetroIframeLoader - A utility for loading iframes in retro windows
 * For retro desktop-style portfolio sites
 */

class RetroIframeLoader {
  constructor() {
    this.iframes = new Map() // Store iframe references
  }

  /**
   * Load a URL in a retro window with iframe
   * @param {Object} options - Configuration options
   * @param {string} options.url - URL to load in iframe
   * @param {string} options.title - Window title
   * @param {number} options.width - Window width
   * @param {number} options.height - Window height
   * @param {string} options.theme - Window theme (cyan, magenta, green, yellow)
   * @param {boolean} options.allowFullscreen - Allow iframe fullscreen
   * @param {string} options.sandbox - Iframe sandbox options
   * @param {Function} options.onLoad - Callback when iframe loads
   * @param {Function} options.onClose - Callback when window closes
   * @returns {Object} Window reference
   */
  loadUrl(options = {}) {
    if (!window.retroWindows) {
      console.error("RetroWindows not loaded")
      return null
    }

    const {
      url = "",
      title = "Web Content",
      width = 800,
      height = 600,
      theme = "cyan",
      allowFullscreen = true,
      sandbox = "allow-same-origin allow-scripts allow-popups allow-forms",
      onLoad = null,
      onClose = null,
    } = options

    // Create loading content
    const loadingContent = `
      <div class="retro-iframe-container" style="height: 100%; display: flex; flex-direction: column;">
        <div class="retro-iframe-loading" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background-color: #000;
          color: #0ff;
          font-family: 'VT323', monospace;
        ">
          <div class="loading-spinner" style="
            width: 50px;
            height: 50px;
            border: 5px solid #0ff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          "></div>
          <div class="loading-text">Loading content...</div>
        </div>
        <iframe 
          class="retro-iframe" 
          src="${url}" 
          style="
            border: none;
            width: 100%;
            height: 100%;
            display: none;
          "
          ${allowFullscreen ? "allowfullscreen" : ""}
          ${sandbox ? `sandbox="${sandbox}"` : ""}
        ></iframe>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    `

    // Create window
    const win = window.retroWindows.createWindow({
      title: title,
      content: loadingContent,
      width: width,
      height: height,
      theme: theme,
      onClose: () => {
        // Stop iframe content when window is closed
        const iframeData = this.iframes.get(win.id)
        if (iframeData) {
          iframeData.iframe.src = "about:blank"
          this.iframes.delete(win.id)
        }

        if (typeof onClose === "function") {
          onClose()
        }
      },
    })

    // Setup iframe after window is created
    setTimeout(() => {
      const container = win.element.querySelector(".retro-iframe-container")
      const loading = win.element.querySelector(".retro-iframe-loading")
      const iframe = win.element.querySelector(".retro-iframe")

      if (container && loading && iframe) {
        // Store iframe reference
        this.iframes.set(win.id, { iframe, window: win })

        // Handle iframe load event
        iframe.addEventListener("load", () => {
          // Hide loading, show iframe
          loading.style.display = "none"
          iframe.style.display = "block"

          if (typeof onLoad === "function") {
            onLoad(iframe)
          }
        })
      }
    }, 100)

    return win
  }

  /**
   * Load a YouTube video in a retro window
   * @param {Object} options - Configuration options
   * @param {string} options.videoId - YouTube video ID
   * @param {string} options.title - Window title
   * @param {number} options.width - Window width
   * @param {number} options.height - Window height
   * @param {string} options.theme - Window theme
   * @param {boolean} options.autoplay - Autoplay video
   * @returns {Object} Window reference
   */
  loadYouTube(options = {}) {
    const {
      videoId = "",
      title = "YouTube Video",
      width = 640,
      height = 480,
      theme = "red",
      autoplay = false,
    } = options

    const youtubeUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${autoplay ? "&autoplay=1" : ""}`

    return this.loadUrl({
      url: youtubeUrl,
      title: title,
      width: width,
      height: height,
      theme: theme,
      allowFullscreen: true,
      sandbox: "allow-same-origin allow-scripts allow-popups allow-presentation",
    })
  }

  /**
   * Load a DOSBox game in a retro window
   * @param {Object} options - Configuration options
   * @param {string} options.gameUrl - URL to the game files
   * @param {string} options.title - Window title
   * @param {number} options.width - Window width
   * @param {number} options.height - Window height
   * @param {string} options.theme - Window theme
   * @returns {Object} Window reference
   */
  loadDOSBox(options = {}) {
    const { gameUrl = "", title = "DOSBox Game", width = 640, height = 480, theme = "yellow" } = options

    // Use js-dos or another DOSBox emulator
    const dosboxUrl = `https://js-dos.com/games/?url=${encodeURIComponent(gameUrl)}`

    return this.loadUrl({
      url: dosboxUrl,
      title: title,
      width: width,
      height: height,
      theme: theme,
      allowFullscreen: true,
      sandbox: "allow-same-origin allow-scripts allow-popups allow-forms",
    })
  }

  /**
   * Load a custom HTML content in a retro window
   * @param {Object} options - Configuration options
   * @param {string} options.html - HTML content
   * @param {string} options.title - Window title
   * @param {number} options.width - Window width
   * @param {number} options.height - Window height
   * @param {string} options.theme - Window theme
   * @returns {Object} Window reference
   */
  loadHTML(options = {}) {
    if (!window.retroWindows) {
      console.error("RetroWindows not loaded")
      return null
    }

    const { html = "", title = "HTML Content", width = 600, height = 400, theme = "cyan" } = options

    // Create iframe content
    const content = `
      <iframe 
        class="retro-iframe" 
        style="
          border: none;
          width: 100%;
          height: 100%;
        "
        srcdoc="${html.replace(/"/g, "&quot;")}"
      ></iframe>
    `

    // Create window
    const win = window.retroWindows.createWindow({
      title: title,
      content: content,
      width: width,
      height: height,
      theme: theme,
      onClose: () => {
        // Clean up
        this.iframes.delete(win.id)
      },
    })

    // Setup iframe after window is created
    setTimeout(() => {
      const iframe = win.element.querySelector(".retro-iframe")
      if (iframe) {
        this.iframes.set(win.id, { iframe, window: win })
      }
    }, 100)

    return win
  }
}

// Export to global scope
window.RetroIframeLoader = new RetroIframeLoader()
