// content-loader.js - Load content from content.json
export async function loadContent() {
  try {
    const response = await fetch("/js/content.json")
    if (!response.ok) {
      throw new Error(`Failed to load content: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error loading content:", error)
    return {
      videos: [],
      music: [],
      gallery: [],
    }
  }
}

// Load videos into the DOM
export async function loadVideos() {
  const content = await loadContent()

  if (!content.videos || content.videos.length === 0) {
    console.warn("No videos found in content.json")
    return
  }

  content.videos.forEach((video) => {
    const videoWindow = document.getElementById(video.id)
    if (!videoWindow) return

    const videoPlayer = videoWindow.querySelector("video")
    if (!videoPlayer) return

    // Update video attributes
    videoPlayer.dataset.src = video.src
    videoPlayer.poster = video.poster

    // Add description if not present
    if (video.description) {
      const windowContent = videoWindow.querySelector(".window-content")
      if (windowContent && !windowContent.querySelector(".video-description")) {
        const description = document.createElement("p")
        description.className = "video-description"
        description.textContent = video.description
        windowContent.appendChild(description)
      }
    }
  })
}

// Load music into the player
export async function loadMusic() {
  const content = await loadContent()

  if (!content.music || content.music.length === 0) {
    console.warn("No music found in content.json")
    return content.music || []
  }

  return content.music
}

// Load gallery images
export async function loadGallery() {
  const content = await loadContent()

  if (!content.gallery || content.gallery.length === 0) {
    console.warn("No gallery images found in content.json")
    return content.gallery || []
  }

  return content.gallery
}
