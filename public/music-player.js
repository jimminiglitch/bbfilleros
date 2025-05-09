// Music player setup with the exact URLs provided
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

// Initialize music player when window is opened
document.addEventListener("DOMContentLoaded", () => {
  const musicWindow = document.getElementById("music")
  const player = document.getElementById("music-player")
  const nowPlaying = document.getElementById("now-playing")
  const playlistEl = document.getElementById("playlist")
  const togglePlayBtn = document.getElementById("togglePlay")
  const nextTrackBtn = document.getElementById("nextTrack")
  const prevTrackBtn = document.getElementById("prevTrack")
  const visualizerCanvas = document.getElementById("visualizer")

  if (!player || !nowPlaying || !playlistEl) {
    console.error("Music player elements not found")
    return
  }

  let currentTrackIndex = 0
  let audioContext = null
  let analyser = null
  let source = null

  // Initialize audio context on user interaction
  function initAudioContext() {
    if (audioContext) return

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      analyser = audioContext.createAnalyser()
      source = audioContext.createMediaElementSource(player)
      source.connect(analyser)
      analyser.connect(audioContext.destination)
      analyser.fftSize = 256

      console.log("Audio context initialized successfully")

      if (visualizerCanvas) {
        initVisualizer()
      }
    } catch (e) {
      console.error("Failed to initialize audio context:", e)
    }
  }

  // Load and play a track
  function loadTrack(index) {
    if (index < 0 || index >= tracks.length) {
      console.error("Invalid track index:", index)
      return
    }

    const track = tracks[index]
    console.log("Loading track:", track.title, track.src)

    // Update UI first
    nowPlaying.textContent = `▶ Loading: ${track.title}`

    // Set the source
    player.src = track.src

    // Load the audio
    player.load()

    // Play the track and handle any errors
    const playPromise = player.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Playback started successfully")
          nowPlaying.textContent = `▶ Now Playing: ${track.title}`
          togglePlayBtn.textContent = "⏸ Pause"
        })
        .catch((error) => {
          console.error("Playback failed:", error)
          // Show play button to allow user interaction
          togglePlayBtn.textContent = "▶ Play"
          nowPlaying.textContent = `⚠️ Click Play to start: ${track.title}`
        })
    }

    highlightCurrentTrack()
  }

  // Highlight the current track in the playlist
  function highlightCurrentTrack() {
    const items = playlistEl.querySelectorAll("li")
    items.forEach((li, i) => {
      li.classList.toggle("playing", i === currentTrackIndex)
    })
  }

  // Initialize visualizer
  function initVisualizer() {
    if (!visualizerCanvas || !analyser) return

    const ctx = visualizerCanvas.getContext("2d")
    if (!ctx) {
      console.error("Could not get canvas context")
      return
    }

    // Set canvas dimensions
    function resizeCanvas() {
      visualizerCanvas.width = visualizerCanvas.offsetWidth
      visualizerCanvas.height = visualizerCanvas.offsetHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Create data array for frequency data
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    // Draw visualizer function
    function drawVisualizer() {
      requestAnimationFrame(drawVisualizer)

      analyser.getByteFrequencyData(dataArray)

      const width = visualizerCanvas.width
      const height = visualizerCanvas.height
      const barWidth = width / bufferLength

      ctx.clearRect(0, 0, width, height)

      let x = 0
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] * 1.5

        // Create gradient color based on frequency
        const hue = (i * 2 + barHeight) % 360
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`

        ctx.fillRect(x, height - barHeight, barWidth, barHeight)
        x += barWidth
      }
    }

    drawVisualizer()
    console.log("Visualizer initialized")
  }

  // Event Listeners

  // Toggle play/pause
  if (togglePlayBtn) {
    togglePlayBtn.addEventListener("click", () => {
      if (!audioContext) {
        initAudioContext()
      }

      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume()
      }

      if (player.paused) {
        console.log("Playing audio")
        player
          .play()
          .then(() => {
            togglePlayBtn.textContent = "⏸ Pause"
          })
          .catch((e) => {
            console.error("Play failed:", e)
            togglePlayBtn.textContent = "▶ Play"
          })
      } else {
        console.log("Pausing audio")
        player.pause()
        togglePlayBtn.textContent = "▶ Play"
      }
    })
  }

  // Next track button
  if (nextTrackBtn) {
    nextTrackBtn.addEventListener("click", () => {
      if (!audioContext) {
        initAudioContext()
      }

      currentTrackIndex = (currentTrackIndex + 1) % tracks.length
      loadTrack(currentTrackIndex)
    })
  }

  // Previous track button
  if (prevTrackBtn) {
    prevTrackBtn.addEventListener("click", () => {
      if (!audioContext) {
        initAudioContext()
      }

      currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length
      loadTrack(currentTrackIndex)
    })
  }

  // Player state change events
  player.addEventListener("play", () => {
    console.log("Audio playing")
    togglePlayBtn.textContent = "⏸ Pause"

    // Initialize audio context if not already done
    if (!audioContext) {
      initAudioContext()
    } else if (audioContext.state === "suspended") {
      audioContext.resume()
    }
  })

  player.addEventListener("pause", () => {
    console.log("Audio paused")
    togglePlayBtn.textContent = "▶ Play"
  })

  player.addEventListener("ended", () => {
    console.log("Track ended, playing next")
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length
    loadTrack(currentTrackIndex)
  })

  // Error handling
  player.addEventListener("error", (e) => {
    console.error("Audio error:", e)
    nowPlaying.textContent = "⚠️ Error playing track"

    // Try to provide more specific error information
    const errorDetails = player.error ? player.error.message || player.error.code : "unknown error"
    console.error(`Audio error details: ${errorDetails}`)

    // Try the next track after a short delay
    setTimeout(() => {
      currentTrackIndex = (currentTrackIndex + 1) % tracks.length
      loadTrack(currentTrackIndex)
    }, 3000)
  })

  // Add canplaythrough event to know when audio is buffered enough to play
  player.addEventListener("canplaythrough", () => {
    console.log("Audio can play through without buffering")

    // Update the now playing text if it was in loading state
    if (nowPlaying.textContent.includes("Loading")) {
      const track = tracks[currentTrackIndex]
      nowPlaying.textContent = `▶ Now Playing: ${track.title}`
    }
  })

  // Populate playlist
  playlistEl.innerHTML = "" // Clear existing items
  tracks.forEach((track, index) => {
    const li = document.createElement("li")
    li.textContent = track.title
    li.addEventListener("click", () => {
      if (!audioContext) {
        initAudioContext()
      }

      currentTrackIndex = index
      loadTrack(currentTrackIndex)
    })
    playlistEl.appendChild(li)
  })

  // Initialize music player when window is opened
  if (musicWindow) {
    const openHandler = () => {
      console.log("Music window opened")

      // Only initialize on first open
      if (!player.src && tracks.length > 0) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          if (!audioContext) {
            initAudioContext()
          }
          loadTrack(currentTrackIndex)
        }, 100)
      }

      // Remove listener after first execution
      musicWindow.removeEventListener("click", openHandler)
    }

    musicWindow.addEventListener("click", openHandler)
  }

  // Handle window close/minimize to pause audio
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !player.paused) {
      player.pause()
      console.log("Audio paused due to window visibility change")
    }
  })

  // Add a special handler for the music window close button
  const musicCloseBtn = document.querySelector("#music .close")
  if (musicCloseBtn) {
    musicCloseBtn.addEventListener("click", () => {
      if (!player.paused) {
        player.pause()
        console.log("Audio paused due to music window close")
      }
    })
  }

  console.log("Music player initialized with tracks:", tracks.map((t) => t.title).join(", "))
})
