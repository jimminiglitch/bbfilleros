/**
 * Media Manager
 * Handles dynamic loading and management of media content
 */

class MediaManager {
  constructor() {
    this.videos = []
    this.music = []
    this.images = []

    // Load media data
    this.loadMediaData()

    // Bind methods
    this.createVideoWindow = this.createVideoWindow.bind(this)
    this.createMusicPlayer = this.createMusicPlayer.bind(this)
    this.createImageGallery = this.createImageGallery.bind(this)
  }

  loadMediaData() {
    // Try to load from localStorage first (for user-added content)
    try {
      const savedVideos = JSON.parse(localStorage.getItem("cyberpunk_videos") || "[]")
      const savedMusic = JSON.parse(localStorage.getItem("cyberpunk_music") || "[]")
      const savedImages = JSON.parse(localStorage.getItem("cyberpunk_images") || "[]")

      this.videos = savedVideos
      this.music = savedMusic
      this.images = savedImages
    } catch (e) {
      console.error("Failed to load media data from localStorage:", e)
    }

    // If no saved data, load defaults
    if (this.videos.length === 0) {
      this.videos = [
        {
          id: "video1",
          title: "Cyberpunk City",
          url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/cyberpunk-city.mp4",
          thumbnail: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/cyberpunk-city-thumb.jpg",
          description: "A tour of a futuristic cyberpunk city.",
        },
        {
          id: "video2",
          title: "Neon Lights",
          url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/neon-lights.mp4",
          thumbnail: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/neon-lights-thumb.jpg",
          description: "Stunning neon light displays in the night.",
        },
        {
          id: "video3",
          title: "Digital Dreams",
          url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/digital-dreams.mp4",
          thumbnail: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/digital-dreams-thumb.jpg",
          description: "A journey through a digital dreamscape.",
        },
      ]
    }

    if (this.music.length === 0) {
      this.music = [
        {
          id: "music1",
          title: "Synthwave Nights",
          artist: "CyberDJ",
          url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/synthwave-nights.mp3",
          cover: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/synthwave-nights-cover.jpg",
        },
        {
          id: "music2",
          title: "Neon Drive",
          artist: "RetroWave",
          url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/neon-drive.mp3",
          cover: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/neon-drive-cover.jpg",
        },
        {
          id: "music3",
          title: "Digital Sunset",
          artist: "VaporGrid",
          url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/digital-sunset.mp3",
          cover: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/digital-sunset-cover.jpg",
        },
      ]
    }

    if (this.images.length === 0) {
      this.images = [
        {
          id: "image1",
          title: "Cyberpunk Cityscape",
          url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/cyberpunk-cityscape.jpg",
          description: "A sprawling cyberpunk cityscape at night.",
        },
        {
          id: "image2",
          title: "Neon Portrait",
          url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/neon-portrait.jpg",
          description: "Portrait illuminated by neon lights.",
        },
        {
          id: "image3",
          title: "Digital Landscape",
          url: "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/digital-landscape.jpg",
          description: "Abstract digital landscape with glowing elements.",
        },
      ]
    }

    // Save to localStorage
    this.saveMediaData()
  }

  saveMediaData() {
    try {
      localStorage.setItem("cyberpunk_videos", JSON.stringify(this.videos))
      localStorage.setItem("cyberpunk_music", JSON.stringify(this.music))
      localStorage.setItem("cyberpunk_images", JSON.stringify(this.images))
    } catch (e) {
      console.error("Failed to save media data to localStorage:", e)
    }
  }

  addVideo(video) {
    // Generate ID if not provided
    if (!video.id) {
      video.id = `video${Date.now()}`
    }

    this.videos.push(video)
    this.saveMediaData()

    return video
  }

  addMusic(music) {
    // Generate ID if not provided
    if (!music.id) {
      music.id = `music${Date.now()}`
    }

    this.music.push(music)
    this.saveMediaData()

    return music
  }

  addImage(image) {
    // Generate ID if not provided
    if (!image.id) {
      image.id = `image${Date.now()}`
    }

    this.images.push(image)
    this.saveMediaData()

    return image
  }

  removeVideo(id) {
    this.videos = this.videos.filter((video) => video.id !== id)
    this.saveMediaData()
  }

  removeMusic(id) {
    this.music = this.music.filter((music) => music.id !== id)
    this.saveMediaData()
  }

  removeImage(id) {
    this.images = this.images.filter((image) => image.id !== id)
    this.saveMediaData()
  }

  getVideo(id) {
    return this.videos.find((video) => video.id === id)
  }

  getMusic(id) {
    return this.music.find((music) => music.id === id)
  }

  getImage(id) {
    return this.images.find((image) => image.id === id)
  }

  createVideoWindow(videoId) {
    const video = this.getVideo(videoId)
    if (!video) return null

    // Create window content
    const content = `
      <div class="video-player">
        <video controls width="100%" poster="${video.thumbnail || ""}">
          <source src="${video.url}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <div class="video-info">
          <h3>${video.title}</h3>
          <p>${video.description || ""}</p>
        </div>
      </div>
    `

    // Create window
    return window.windowManager.createWindow({
      id: `video-window-${video.id}`,
      title: video.title,
      content: content,
      width: "640px",
      height: "480px",
    })
  }

  createMusicPlayer() {
    // Create playlist HTML
    let playlistHTML = ""
    this.music.forEach((track) => {
      playlistHTML += `
        <div class="music-track" data-id="${track.id}">
          <img src="${track.cover || "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/default-cover.jpg"}" alt="${track.title}" class="track-cover">
          <div class="track-info">
            <div class="track-title">${track.title}</div>
            <div class="track-artist">${track.artist}</div>
          </div>
        </div>
      `
    })

    // Create window content
    const content = `
      <div class="music-player">
        <div class="player-top">
          <div class="now-playing">
            <img id="current-cover" src="https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/default-cover.jpg" alt="Album cover">
            <div class="track-details">
              <div id="current-title" class="neon-text">Select a track</div>
              <div id="current-artist">-</div>
            </div>
          </div>
          <div class="visualizer-container">
            <canvas id="music-visualizer" width="300" height="60"></canvas>
          </div>
        </div>
        <div class="player-controls">
          <button id="prev-button" class="player-button" title="Previous"><span>⏮</span></button>
          <button id="play-button" class="player-button" title="Play/Pause"><span>▶</span></button>
          <button id="stop-button" class="player-button" title="Stop"><span>⏹</span></button>
          <button id="next-button" class="player-button" title="Next"><span>⏭</span></button>
          <div class="progress-container">
            <div id="progress-bar" class="progress-bar">
              <div id="progress-current" class="progress-current"></div>
            </div>
            <div id="time-display" class="time-display">00:00 / 00:00</div>
          </div>
        </div>
        <div class="player-playlist">
          <div class="playlist-header">Playlist</div>
          <div class="playlist-tracks">
            ${playlistHTML}
          </div>
        </div>
        <audio id="audio-player"></audio>
      </div>
    `

    // Create window
    const musicWindow = window.windowManager.createWindow({
      id: "music-player-window",
      title: "Cyberpunk Music Player",
      content: content,
      width: "400px",
      height: "500px",
    })

    // Initialize music player functionality
    setTimeout(() => {
      this.initMusicPlayer(musicWindow)
    }, 100)

    return musicWindow
  }

  initMusicPlayer(musicWindow) {
    const audioEl = musicWindow.querySelector("#audio-player")
    const playBtn = musicWindow.querySelector("#play-button")
    const stopBtn = musicWindow.querySelector("#stop-button")
    const prevBtn = musicWindow.querySelector("#prev-button")
    const nextBtn = musicWindow.querySelector("#next-button")
    const progressBar = musicWindow.querySelector("#progress-bar")
    const progressCurrent = musicWindow.querySelector("#progress-current")
    const timeDisplay = musicWindow.querySelector("#time-display")
    const currentCover = musicWindow.querySelector("#current-cover")
    const currentTitle = musicWindow.querySelector("#current-title")
    const currentArtist = musicWindow.querySelector("#current-artist")
    const tracks = musicWindow.querySelectorAll(".music-track")
    const visualizer = musicWindow.querySelector("#music-visualizer")

    let currentTrackIndex = -1
    let isPlaying = false
    let audioContext = null
    let analyser = null
    let source = null
    let animationId = null

    // Initialize audio context for visualizer
    const initAudioContext = () => {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 256

        source = audioContext.createMediaElementSource(audioEl)
        source.connect(analyser)
        analyser.connect(audioContext.destination)
      }
    }

    // Draw visualizer
    const drawVisualizer = () => {
      if (!analyser) return

      const ctx = visualizer.getContext("2d")
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, visualizer.width, visualizer.height)
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
      ctx.fillRect(0, 0, visualizer.width, visualizer.height)

      const barWidth = (visualizer.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2

        const gradient = ctx.createLinearGradient(0, 0, 0, visualizer.height)
        gradient.addColorStop(0, "#0ff")
        gradient.addColorStop(1, "#066")

        ctx.fillStyle = gradient
        ctx.fillRect(x, visualizer.height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }

      animationId = requestAnimationFrame(drawVisualizer)
    }

    // Load track
    const loadTrack = (index) => {
      if (index < 0 || index >= this.music.length) return

      currentTrackIndex = index
      const track = this.music[index]

      audioEl.src = track.url
      audioEl.load()

      currentCover.src =
        track.cover || "https://cdn.glitch.global/3e633c21-7e0e-4e0f-9299-2b28f47f9ae1/default-cover.jpg"
      currentTitle.textContent = track.title
      currentArtist.textContent = track.artist

      // Update active track in playlist
      tracks.forEach((trackEl, i) => {
        if (i === index) {
          trackEl.classList.add("active")
        } else {
          trackEl.classList.remove("active")
        }
      })

      // Auto-play
      if (isPlaying) {
        audioEl.play().catch((e) => console.error("Failed to auto-play:", e))
      }
    }

    // Play/pause
    const togglePlay = () => {
      if (currentTrackIndex === -1 && this.music.length > 0) {
        loadTrack(0)
      }

      if (audioEl.paused) {
        audioEl
          .play()
          .then(() => {
            isPlaying = true
            playBtn.innerHTML = "<span>⏸</span>"

            // Initialize audio context and start visualizer
            initAudioContext()
            if (!animationId) {
              drawVisualizer()
            }
          })
          .catch((e) => console.error("Failed to play:", e))
      } else {
        audioEl.pause()
        isPlaying = false
        playBtn.innerHTML = "<span>▶</span>"
      }
    }

    // Stop
    const stopPlayback = () => {
      audioEl.pause()
      audioEl.currentTime = 0
      isPlaying = false
      playBtn.innerHTML = "<span>▶</span>"

      // Stop visualizer
      if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
    }

    // Previous track
    const playPrev = () => {
      let prevIndex = currentTrackIndex - 1
      if (prevIndex < 0) {
        prevIndex = this.music.length - 1
      }

      loadTrack(prevIndex)
    }

    // Next track
    const playNext = () => {
      let nextIndex = currentTrackIndex + 1
      if (nextIndex >= this.music.length) {
        nextIndex = 0
      }

      loadTrack(nextIndex)
    }

    // Update progress
    const updateProgress = () => {
      if (audioEl.duration) {
        const progress = (audioEl.currentTime / audioEl.duration) * 100
        progressCurrent.style.width = `${progress}%`

        const currentTime = formatTime(audioEl.currentTime)
        const duration = formatTime(audioEl.duration)
        timeDisplay.textContent = `${currentTime} / ${duration}`
      }
    }

    // Format time
    const formatTime = (seconds) => {
      seconds = Math.floor(seconds)
      const minutes = Math.floor(seconds / 60)
      seconds = seconds % 60
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    // Seek
    const seek = (e) => {
      const rect = progressBar.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width

      if (audioEl.duration) {
        audioEl.currentTime = pos * audioEl.duration
      }
    }

    // Set up event listeners
    playBtn.addEventListener("click", togglePlay)
    stopBtn.addEventListener("click", stopPlayback)
    prevBtn.addEventListener("click", playPrev)
    nextBtn.addEventListener("click", playNext)
    progressBar.addEventListener("click", seek)

    // Track ended
    audioEl.addEventListener("ended", playNext)

    // Update progress
    audioEl.addEventListener("timeupdate", updateProgress)

    // Track click
    tracks.forEach((trackEl, index) => {
      trackEl.addEventListener("click", () => {
        loadTrack(index)
        togglePlay()
      })
    })

    // Clean up on window close
    musicWindow.addEventListener("window-closed", () => {
      stopPlayback()

      // Clean up audio context
      if (source) {
        source.disconnect()
      }

      if (analyser) {
        analyser.disconnect()
      }

      if (audioContext && audioContext.state !== "closed") {
        audioContext.close()
      }
    })
  }

  createImageGallery() {
    // Create gallery HTML
    let galleryHTML = ""
    this.images.forEach((image) => {
      galleryHTML += `
        <div class="gallery-item" data-id="${image.id}">
          <img src="${image.url}" alt="${image.title}" loading="lazy">
          <div class="gallery-item-info">
            <div class="gallery-item-title">${image.title}</div>
            <div class="gallery-item-desc">${image.description || ""}</div>
          </div>
        </div>
      `
    })

    // Create window content
    const content = `
      <div class="image-gallery">
        <div class="gallery-grid">
          ${galleryHTML}
        </div>
      </div>
    `

    // Create window
    const galleryWindow = window.windowManager.createWindow({
      id: "image-gallery-window",
      title: "Cyberpunk Image Gallery",
      content: content,
      width: "800px",
      height: "600px",
    })

    // Initialize gallery functionality
    setTimeout(() => {
      this.initImageGallery(galleryWindow)
    }, 100)

    return galleryWindow
  }

  initImageGallery(galleryWindow) {
    const galleryItems = galleryWindow.querySelectorAll(".gallery-item")

    // Create lightbox elements
    const lightbox = document.createElement("div")
    lightbox.className = "gallery-lightbox"
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <img id="lightbox-img" src="/placeholder.svg" alt="">
        <div class="lightbox-caption"></div>
        <button class="lightbox-close">×</button>
        <button class="lightbox-prev">❮</button>
        <button class="lightbox-next">❯</button>
      </div>
    `

    galleryWindow.querySelector(".image-gallery").appendChild(lightbox)

    const lightboxImg = lightbox.querySelector("#lightbox-img")
    const lightboxCaption = lightbox.querySelector(".lightbox-caption")
    const lightboxClose = lightbox.querySelector(".lightbox-close")
    const lightboxPrev = lightbox.querySelector(".lightbox-prev")
    const lightboxNext = lightbox.querySelector(".lightbox-next")

    let currentIndex = 0

    // Open lightbox
    const openLightbox = (index) => {
      currentIndex = index
      const image = this.images[index]

      lightboxImg.src = image.url
      lightboxImg.alt = image.title
      lightboxCaption.innerHTML = `<div class="lightbox-title">${image.title}</div><div class="lightbox-desc">${image.description || ""}</div>`

      lightbox.style.display = "flex"
    }

    // Close lightbox
    const closeLightbox = () => {
      lightbox.style.display = "none"
    }

    // Navigate to previous image
    const prevImage = () => {
      currentIndex = (currentIndex - 1 + this.images.length) % this.images.length
      openLightbox(currentIndex)
    }

    // Navigate to next image
    const nextImage = () => {
      currentIndex = (currentIndex + 1) % this.images.length
      openLightbox(currentIndex)
    }

    // Set up event listeners
    galleryItems.forEach((item, index) => {
      item.addEventListener("click", () => {
        openLightbox(index)
      })
    })

    lightboxClose.addEventListener("click", closeLightbox)
    lightboxPrev.addEventListener("click", prevImage)
    lightboxNext.addEventListener("click", nextImage)

    // Keyboard navigation
    galleryWindow.addEventListener("keydown", (e) => {
      if (lightbox.style.display === "flex") {
        if (e.key === "Escape") {
          closeLightbox()
        } else if (e.key === "ArrowLeft") {
          prevImage()
        } else if (e.key === "ArrowRight") {
          nextImage()
        }
      }
    })

    // Close lightbox when clicking outside the image
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox()
      }
    })

    // Use IntersectionObserver for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target.querySelector("img")
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.removeAttribute("data-src")
            }
            observer.unobserve(entry.target)
          }
        })
      },
      { root: galleryWindow.querySelector(".gallery-grid"), threshold: 0.1 },
    )

    galleryItems.forEach((item) => {
      observer.observe(item)
    })
  }

  createMediaUploader() {
    // Create window content
    const content = `
      <div class="media-uploader">
        <div class="uploader-tabs">
          <button class="uploader-tab active" data-tab="video">Video</button>
          <button class="uploader-tab" data-tab="music">Music</button>
          <button class="uploader-tab" data-tab="image">Image</button>
        </div>
        
        <div class="uploader-content">
          <div class="uploader-tab-content active" data-tab="video">
            <h3>Add Video</h3>
            <form id="video-form">
              <div class="form-group">
                <label for="video-title">Title</label>
                <input type="text" id="video-title" required>
              </div>
              <div class="form-group">
                <label for="video-url">Video URL</label>
                <input type="url" id="video-url" required>
              </div>
              <div class="form-group">
                <label for="video-thumbnail">Thumbnail URL</label>
                <input type="url" id="video-thumbnail">
              </div>
              <div class="form-group">
                <label for="video-description">Description</label>
                <textarea id="video-description"></textarea>
              </div>
              <button type="submit" class="uploader-submit">Add Video</button>
            </form>
          </div>
          
          <div class="uploader-tab-content" data-tab="music">
            <h3>Add Music</h3>
            <form id="music-form">
              <div class="form-group">
                <label for="music-title">Title</label>
                <input type="text" id="music-title" required>
              </div>
              <div class="form-group">
                <label for="music-artist">Artist</label>
                <input type="text" id="music-artist" required>
              </div>
              <div class="form-group">
                <label for="music-url">Music URL</label>
                <input type="url" id="music-url" required>
              </div>
              <div class="form-group">
                <label for="music-cover">Cover URL</label>
                <input type="url" id="music-cover">
              </div>
              <button type="submit" class="uploader-submit">Add Music</button>
            </form>
          </div>
          
          <div class="uploader-tab-content" data-tab="image">
            <h3>Add Image</h3>
            <form id="image-form">
              <div class="form-group">
                <label for="image-title">Title</label>
                <input type="text" id="image-title" required>
              </div>
              <div class="form-group">
                <label for="image-url">Image URL</label>
                <input type="url" id="image-url" required>
              </div>
              <div class="form-group">
                <label for="image-description">Description</label>
                <textarea id="image-description"></textarea>
              </div>
              <button type="submit" class="uploader-submit">Add Image</button>
            </form>
          </div>
        </div>
      </div>
    `

    // Create window
    const uploaderWindow = window.windowManager.createWindow({
      id: "media-uploader-window",
      title: "Add Media",
      content: content,
      width: "500px",
      height: "400px",
    })

    // Initialize uploader functionality
    setTimeout(() => {
      this.initMediaUploader(uploaderWindow)
    }, 100)

    return uploaderWindow
  }

  initMediaUploader(uploaderWindow) {
    const tabs = uploaderWindow.querySelectorAll(".uploader-tab")
    const tabContents = uploaderWindow.querySelectorAll(".uploader-tab-content")
    const videoForm = uploaderWindow.querySelector("#video-form")
    const musicForm = uploaderWindow.querySelector("#music-form")
    const imageForm = uploaderWindow.querySelector("#image-form")

    // Tab switching
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabName = tab.dataset.tab

        // Update active tab
        tabs.forEach((t) => t.classList.remove("active"))
        tab.classList.add("active")

        // Update active content
        tabContents.forEach((content) => {
          if (content.dataset.tab === tabName) {
            content.classList.add("active")
          } else {
            content.classList.remove("active")
          }
        })
      })
    })

    // Video form submission
    videoForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const title = uploaderWindow.querySelector("#video-title").value
      const url = uploaderWindow.querySelector("#video-url").value
      const thumbnail = uploaderWindow.querySelector("#video-thumbnail").value
      const description = uploaderWindow.querySelector("#video-description").value

      this.addVideo({
        title,
        url,
        thumbnail,
        description,
      })

      // Reset form
      videoForm.reset()

      // Show success message
      alert("Video added successfully!")
    })

    // Music form submission
    musicForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const title = uploaderWindow.querySelector("#music-title").value
      const artist = uploaderWindow.querySelector("#music-artist").value
      const url = uploaderWindow.querySelector("#music-url").value
      const cover = uploaderWindow.querySelector("#music-cover").value

      this.addMusic({
        title,
        artist,
        url,
        cover,
      })

      // Reset form
      musicForm.reset()

      // Show success message
      alert("Music added successfully!")
    })

    // Image form submission
    imageForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const title = uploaderWindow.querySelector("#image-title").value
      const url = uploaderWindow.querySelector("#image-url").value
      const description = uploaderWindow.querySelector("#image-description").value

      this.addImage({
        title,
        url,
        description,
      })

      // Reset form
      imageForm.reset()

      // Show success message
      alert("Image added successfully!")
    })
  }
}

// Initialize media manager
window.mediaManager = new MediaManager()
