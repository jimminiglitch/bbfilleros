/**
 * RetroMusicPlayer - A Winamp-inspired music player
 * For retro desktop-style portfolio sites
 */

class RetroMusicPlayer {
  constructor(options = {}) {
    this.container = options.container || document.body
    this.playlist = options.playlist || []
    this.theme = options.theme || "cyan" // cyan, magenta, green, yellow

    this.playerWindow = null
    this.audioElement = null
    this.currentTrack = 0
    this.isPlaying = false
    this.visualizer = null
    this.analyser = null
    this.audioContext = null
    this.source = null

    this.init()
  }

  init() {
    // Create audio element
    this.audioElement = document.createElement("audio")
    this.audioElement.addEventListener("ended", () => this.playNext())

    // Create player window using RetroWindow
    if (window.RetroWindow) {
      this.createPlayerWindow()
    } else {
      console.error("RetroWindow is required for RetroMusicPlayer")
      return
    }

    // Initialize Web Audio API for visualizer
    this.initAudio()

    // Load first track
    if (this.playlist.length > 0) {
      this.loadTrack(0)
    }
  }

  createPlayerWindow() {
    const playerContent = `
      <div class="retro-player">
        <div class="retro-player-info">
          <div class="retro-player-title">Now Playing:</div>
          <div class="retro-player-track-title">Select a track</div>
        </div>
        
        <div class="retro-player-visualizer">
          <canvas id="retro-player-canvas" width="250" height="60"></canvas>
        </div>
        
        <div class="retro-player-controls">
          <button class="retro-player-prev" title="Previous Track">⏮</button>
          <button class="retro-player-play" title="Play/Pause">▶</button>
          <button class="retro-player-stop" title="Stop">⏹</button>
          <button class="retro-player-next" title="Next Track">⏭</button>
        </div>
        
        <div class="retro-player-progress-container">
          <div class="retro-player-progress"></div>
          <div class="retro-player-time">00:00 / 00:00</div>
        </div>
        
        <div class="retro-player-playlist-container">
          <div class="retro-player-playlist-title">Playlist</div>
          <ul class="retro-player-playlist"></ul>
        </div>
      </div>
    `

    this.playerWindow = window.retroWindows.createWindow({
      title: "Retro Music Player",
      content: playerContent,
      width: 300,
      height: 400,
      theme: this.theme,
      resizable: true,
      onClose: () => {
        // Stop audio when window is closed
        this.stop()
      },
    })

    // Setup event listeners after window is created
    setTimeout(() => {
      this.setupEventListeners()
      this.updatePlaylist()
      this.setupVisualizer()
    }, 100)
  }

  setupEventListeners() {
    const playBtn = this.playerWindow.element.querySelector(".retro-player-play")
    const stopBtn = this.playerWindow.element.querySelector(".retro-player-stop")
    const prevBtn = this.playerWindow.element.querySelector(".retro-player-prev")
    const nextBtn = this.playerWindow.element.querySelector(".retro-player-next")
    const progressContainer = this.playerWindow.element.querySelector(".retro-player-progress-container")

    if (playBtn) {
      playBtn.addEventListener("click", () => this.togglePlay())
    }

    if (stopBtn) {
      stopBtn.addEventListener("click", () => this.stop())
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => this.playPrev())
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.playNext())
    }

    if (progressContainer) {
      progressContainer.addEventListener("click", (e) => {
        const rect = progressContainer.getBoundingClientRect()
        const pos = (e.clientX - rect.left) / rect.width
        this.seekTo(pos)
      })
    }

    // Update progress and time
    this.audioElement.addEventListener("timeupdate", () => this.updateProgress())
  }

  updatePlaylist() {
    const playlistEl = this.playerWindow.element.querySelector(".retro-player-playlist")
    if (!playlistEl) return

    playlistEl.innerHTML = ""

    this.playlist.forEach((track, index) => {
      const li = document.createElement("li")
      li.className = index === this.currentTrack ? "active" : ""
      li.textContent = track.title
      li.addEventListener("click", () => {
        this.loadTrack(index)
        this.play()
      })
      playlistEl.appendChild(li)
    })
  }

  loadTrack(index) {
    if (index < 0 || index >= this.playlist.length) return

    this.currentTrack = index
    const track = this.playlist[index]

    this.audioElement.src = track.url
    this.audioElement.load()

    // Update track title
    const titleEl = this.playerWindow.element.querySelector(".retro-player-track-title")
    if (titleEl) {
      titleEl.textContent = track.title
    }

    // Update active track in playlist
    this.updatePlaylist()
  }

  play() {
    this.audioElement.play()
    this.isPlaying = true

    // Update play button
    const playBtn = this.playerWindow.element.querySelector(".retro-player-play")
    if (playBtn) {
      playBtn.textContent = "⏸"
      playBtn.title = "Pause"
    }

    // Connect audio to visualizer if not already connected
    this.connectAudio()
  }

  pause() {
    this.audioElement.pause()
    this.isPlaying = false

    // Update play button
    const playBtn = this.playerWindow.element.querySelector(".retro-player-play")
    if (playBtn) {
      playBtn.textContent = "▶"
      playBtn.title = "Play"
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  stop() {
    this.audioElement.pause()
    this.audioElement.currentTime = 0
    this.isPlaying = false

    // Update play button
    const playBtn = this.playerWindow.element.querySelector(".retro-player-play")
    if (playBtn) {
      playBtn.textContent = "▶"
      playBtn.title = "Play"
    }

    // Disconnect audio from visualizer
    this.disconnectAudio()
  }

  playNext() {
    let nextTrack = this.currentTrack + 1
    if (nextTrack >= this.playlist.length) {
      nextTrack = 0 // Loop back to first track
    }

    this.loadTrack(nextTrack)
    this.play()
  }

  playPrev() {
    let prevTrack = this.currentTrack - 1
    if (prevTrack < 0) {
      prevTrack = this.playlist.length - 1 // Loop to last track
    }

    this.loadTrack(prevTrack)
    this.play()
  }

  seekTo(position) {
    if (this.audioElement.duration) {
      this.audioElement.currentTime = position * this.audioElement.duration
    }
  }

  updateProgress() {
    const progressEl = this.playerWindow.element.querySelector(".retro-player-progress")
    const timeEl = this.playerWindow.element.querySelector(".retro-player-time")

    if (progressEl && this.audioElement.duration) {
      const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100
      progressEl.style.width = `${progress}%`
    }

    if (timeEl) {
      const currentTime = this.formatTime(this.audioElement.currentTime)
      const duration = this.formatTime(this.audioElement.duration || 0)
      timeEl.textContent = `${currentTime} / ${duration}`
    }
  }

  formatTime(seconds) {
    seconds = Math.floor(seconds)
    const minutes = Math.floor(seconds / 60)
    seconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
    } catch (e) {
      console.error("Web Audio API is not supported in this browser")
    }
  }

  connectAudio() {
    if (!this.audioContext || !this.analyser) return

    // Disconnect existing source if any
    this.disconnectAudio()

    // Create new source and connect
    this.source = this.audioContext.createMediaElementSource(this.audioElement)
    this.source.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)
  }

  disconnectAudio() {
    if (this.source) {
      try {
        this.source.disconnect()
      } catch (e) {
        // Already disconnected
      }
      this.source = null
    }
  }

  setupVisualizer() {
    const canvas = this.playerWindow.element.querySelector("#retro-player-canvas")
    if (!canvas || !this.analyser) return

    const ctx = canvas.getContext("2d")
    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      this.visualizer = requestAnimationFrame(draw)

      this.analyser.getByteFrequencyData(dataArray)

      ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2

        // Use theme color for bars
        let gradient
        switch (this.theme) {
          case "cyan":
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, "#0ff")
            gradient.addColorStop(1, "#066")
            break
          case "magenta":
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, "#f0f")
            gradient.addColorStop(1, "#606")
            break
          case "green":
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, "#0f0")
            gradient.addColorStop(1, "#060")
            break
          case "yellow":
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, "#ff0")
            gradient.addColorStop(1, "#660")
            break
          default:
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, "#0ff")
            gradient.addColorStop(1, "#066")
        }

        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()
  }

  addTrack(track) {
    this.playlist.push(track)
    this.updatePlaylist()
  }

  removeTrack(index) {
    if (index < 0 || index >= this.playlist.length) return

    this.playlist.splice(index, 1)

    // If removing current track, load next available track
    if (index === this.currentTrack) {
      if (this.playlist.length > 0) {
        const newIndex = Math.min(index, this.playlist.length - 1)
        this.loadTrack(newIndex)
      } else {
        this.stop()
        const titleEl = this.playerWindow.element.querySelector(".retro-player-track-title")
        if (titleEl) {
          titleEl.textContent = "No tracks available"
        }
      }
    } else if (index < this.currentTrack) {
      // Adjust current track index if removing a track before it
      this.currentTrack--
    }

    this.updatePlaylist()
  }
}

// Export to global scope
window.RetroMusicPlayer = RetroMusicPlayer
