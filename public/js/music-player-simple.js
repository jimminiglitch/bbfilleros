// Ultra-simple music player without Web Audio API
// This avoids CORS issues completely

// Check if we've already initialized to prevent redeclaration
if (!window.musicPlayerInitialized) {
  window.musicPlayerInitialized = true

  // Music tracks
  const tracks = [
    {
      title: "Paper Doll (LIVE)",
      src: "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Paper%20Doll%20(LIVE).mp3?v=1746751595622",
    },
    {
      title: "Manameisdrnk",
      src: "https://cdn.glitch.me/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/mynameisdrunk.wav?v=1746751634863",
    },
  ]

  // Initialize when DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Simple music player initializing...")

    // Get DOM elements
    const player = document.getElementById("music-player")
    const nowPlaying = document.getElementById("now-playing")
    const playlistEl = document.getElementById("playlist")
    const togglePlayBtn = document.getElementById("togglePlay")
    const prevTrackBtn = document.getElementById("prevTrack")
    const nextTrackBtn = document.getElementById("nextTrack")
    const visualizerCanvas = document.getElementById("visualizer")

    // Exit if elements don't exist
    if (!player || !nowPlaying || !playlistEl) {
      console.error("Required music player elements not found")
      return
    }

    let currentTrackIndex = 0

    // Simple visualizer that doesn't use Web Audio API
    if (visualizerCanvas) {
      const ctx = visualizerCanvas.getContext("2d")

      // Set canvas dimensions
      visualizerCanvas.width = visualizerCanvas.offsetWidth
      visualizerCanvas.height = visualizerCanvas.offsetHeight

      // Handle resize
      window.addEventListener("resize", () => {
        visualizerCanvas.width = visualizerCanvas.offsetWidth
        visualizerCanvas.height = visualizerCanvas.offsetHeight
      })

      // Animation function
      function drawVisualizer() {
        if (!ctx) return

        // Clear canvas
        ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height)

        if (player.paused) {
          // Show message when paused
          ctx.fillStyle = "#00ffff"
          ctx.font = "16px 'VT323', monospace"
          ctx.textAlign = "center"
          ctx.fillText("Play music to see visualizer", visualizerCanvas.width / 2, visualizerCanvas.height / 2)
        } else {
          // Simple time-based visualization (no audio data needed)
          const time = Date.now() / 1000
          const width = visualizerCanvas.width
          const height = visualizerCanvas.height

          for (let i = 0; i < width; i += 5) {
            // Create a wave pattern
            const t = time + i * 0.01
            const amplitude = Math.sin(t) * Math.sin(t * 0.8)
            const barHeight = ((amplitude + 1) / 2) * height * 0.8

            // Color based on position
            const hue = (i + time * 50) % 360
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`

            // Draw bar
            ctx.fillRect(i, height - barHeight, 4, barHeight)
          }
        }

        requestAnimationFrame(drawVisualizer)
      }

      // Start visualizer
      drawVisualizer()
    }

    // Load and play a track
    function loadTrack(index) {
      if (index < 0 || index >= tracks.length) {
        console.error("Invalid track index:", index)
        return
      }

      const track = tracks[index]
      console.log("Loading track:", track.title)

      // Update UI
      nowPlaying.textContent = `▶ Loading: ${track.title}`

      // Set source and load
      player.src = track.src
      player.load()

      // Try to play
      const playPromise = player.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Playback started")
            nowPlaying.textContent = `▶ Now Playing: ${track.title}`
            if (togglePlayBtn) togglePlayBtn.textContent = "⏸ Pause"
          })
          .catch((err) => {
            console.log("Playback failed, need user interaction:", err)
            nowPlaying.textContent = `Click Play to start: ${track.title}`
            if (togglePlayBtn) togglePlayBtn.textContent = "▶ Play"
          })
      }

      // Update playlist highlight
      const items = playlistEl.querySelectorAll("li")
      items.forEach((li, i) => {
        li.classList.toggle("playing", i === index)
      })
    }

    // Populate playlist
    playlistEl.innerHTML = "" // Clear existing items
    tracks.forEach((track, index) => {
      const li = document.createElement("li")
      li.textContent = track.title
      li.addEventListener("click", () => {
        currentTrackIndex = index
        loadTrack(index)
      })
      playlistEl.appendChild(li)
    })

    // Button event listeners
    if (togglePlayBtn) {
      togglePlayBtn.addEventListener("click", () => {
        if (player.paused) {
          player
            .play()
            .then(() => {
              togglePlayBtn.textContent = "⏸ Pause"
            })
            .catch((err) => {
              console.error("Play failed:", err)
            })
        } else {
          player.pause()
          togglePlayBtn.textContent = "▶ Play"
        }
      })
    }

    if (prevTrackBtn) {
      prevTrackBtn.addEventListener("click", () => {
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length
        loadTrack(currentTrackIndex)
      })
    }

    if (nextTrackBtn) {
      nextTrackBtn.addEventListener("click", () => {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length
        loadTrack(currentTrackIndex)
      })
    }

    // Player events
    player.addEventListener("play", () => {
      if (togglePlayBtn) togglePlayBtn.textContent = "⏸ Pause"
    })

    player.addEventListener("pause", () => {
      if (togglePlayBtn) togglePlayBtn.textContent = "▶ Play"
    })

    player.addEventListener("ended", () => {
      console.log("Track ended, playing next")
      currentTrackIndex = (currentTrackIndex + 1) % tracks.length
      loadTrack(currentTrackIndex)
    })

    player.addEventListener("canplaythrough", () => {
      // Update the now playing text if it was in loading state
      if (nowPlaying.textContent.includes("Loading")) {
        const track = tracks[currentTrackIndex]
        nowPlaying.textContent = `▶ Now Playing: ${track.title}`
      }
    })

    // Initialize with first track when music window is opened
    const musicWindow = document.getElementById("music")
    if (musicWindow) {
      const initPlayer = () => {
        console.log("Music window clicked, initializing player")
        if (!player.src && tracks.length > 0) {
          // Small delay to ensure DOM is ready
          setTimeout(() => loadTrack(0), 100)
        }
        musicWindow.removeEventListener("click", initPlayer)
      }

      musicWindow.addEventListener("click", initPlayer)
    }

    console.log("Simple music player initialized with tracks:", tracks.map((t) => t.title).join(", "))
  })
}
