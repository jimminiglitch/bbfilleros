// music-player.js - Music player functionality
import { loadMusic } from "./content-loader.js"

export async function initMusicPlayer() {
  const musicPlayer = document.getElementById("music-player")
  const nowPlaying = document.getElementById("now-playing")
  const playlist = document.getElementById("playlist")
  const prevBtn = document.getElementById("prevTrack")
  const playBtn = document.getElementById("togglePlay")
  const nextBtn = document.getElementById("nextTrack")

  if (!musicPlayer || !playlist) return

  // Load tracks from content.json
  const tracks = await loadMusic()
  if (!tracks || tracks.length === 0) {
    nowPlaying.textContent = "No tracks available"
    return
  }

  let currentTrack = 0

  // Build playlist with improved accessibility
  function buildPlaylist() {
    playlist.innerHTML = ""
    tracks.forEach((track, index) => {
      const li = document.createElement("li")
      li.textContent = `${track.title} - ${track.artist}`
      li.dataset.index = index
      li.setAttribute("role", "button")
      li.setAttribute("tabindex", "0")
      li.setAttribute("aria-label", `Play ${track.title} by ${track.artist}`)

      // Add click and keyboard handlers
      li.addEventListener("click", () => {
        currentTrack = index
        loadTrack()
        playTrack()
      })

      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          currentTrack = index
          loadTrack()
          playTrack()
        }
      })

      playlist.appendChild(li)
    })
  }

  // Load track with error handling
  function loadTrack() {
    try {
      musicPlayer.src = tracks[currentTrack].url
      musicPlayer.load()
      updateNowPlaying()

      // Update active class and ARIA attributes
      document.querySelectorAll("#playlist li").forEach((li, idx) => {
        const isActive = idx === currentTrack
        li.classList.toggle("active", isActive)
        li.setAttribute("aria-current", isActive ? "true" : "false")
      })
    } catch (err) {
      console.error("Error loading track:", err)
      nowPlaying.textContent = "Error loading track"
    }
  }

  // Play track with error handling
  function playTrack() {
    musicPlayer
      .play()
      .then(() => {
        playBtn.textContent = "Pause"
        playBtn.setAttribute("aria-label", "Pause")
        updateNowPlaying()
      })
      .catch((err) => {
        console.error("Playback prevented:", err)
        nowPlaying.textContent = "Playback prevented - click to try again"
      })
  }

  // Pause track
  function pauseTrack() {
    musicPlayer.pause()
    playBtn.textContent = "Play"
    playBtn.setAttribute("aria-label", "Play")
  }

  // Update now playing display
  function updateNowPlaying() {
    const track = tracks[currentTrack]
    nowPlaying.textContent = `▶ ${track.title} - ${track.artist}`

    // Announce to screen readers
    const liveRegion = document.createElement("div")
    liveRegion.setAttribute("aria-live", "polite")
    liveRegion.className = "sr-only"
    liveRegion.textContent = `Now playing: ${track.title} by ${track.artist}`
    document.body.appendChild(liveRegion)

    setTimeout(() => {
      document.body.removeChild(liveRegion)
    }, 1000)
  }

  // Event listeners with improved accessibility
  prevBtn.addEventListener("click", () => {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length
    loadTrack()
    if (!musicPlayer.paused) playTrack()
  })

  nextBtn.addEventListener("click", () => {
    currentTrack = (currentTrack + 1) % tracks.length
    loadTrack()
    if (!musicPlayer.paused) playTrack()
  })

  playBtn.addEventListener("click", () => {
    if (musicPlayer.paused) {
      playTrack()
    } else {
      pauseTrack()
    }
  })

  // Auto-advance to next track when current one ends
  musicPlayer.addEventListener("ended", () => {
    currentTrack = (currentTrack + 1) % tracks.length
    loadTrack()
    playTrack()
  })

  // Add keyboard navigation
  document.addEventListener("keydown", (e) => {
    // Only handle events when music player is visible
    const musicWindow = document.getElementById("music")
    if (!musicWindow || musicWindow.classList.contains("hidden")) return

    if (e.key === "MediaTrackPrevious") {
      prevBtn.click()
    } else if (e.key === "MediaTrackNext") {
      nextBtn.click()
    } else if (e.key === "MediaPlayPause") {
      playBtn.click()
    }
  })

  // Initialize
  buildPlaylist()
  loadTrack()

  // Add event listener for window focus to handle autoplay restrictions
  window.addEventListener("focus", () => {
    if (!musicPlayer.paused && musicPlayer.currentTime === 0) {
      // Browser may have blocked autoplay, try again on focus
      playTrack()
    }
  })

  // Export API for external control
  return {
    play: playTrack,
    pause: pauseTrack,
    next: () => nextBtn.click(),
    prev: () => prevBtn.click(),
  }
}

// Listen for custom event to initialize music player
window.addEventListener("initMusicPlayer", () => {
  initMusicPlayer()
})
