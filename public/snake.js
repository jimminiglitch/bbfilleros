// SPACEWORM.EXE - A cyberpunk snake game with optimized performance
document.addEventListener("DOMContentLoaded", () => {
  // Game canvas setup with proper scaling
  const canvas = document.getElementById("snake-canvas")
  const ctx = canvas.getContext("2d")

  // Game state
  let snake = []
  let food = {}
  let powerUps = []
  let direction = "right"
  let nextDirection = "right"
  let score = 0
  let level = 1
  const gameSpeed = 150
  let animationFrameId
  let lastUpdateTime = 0
  let updateInterval = 150 // ms
  let isPaused = false
  let isMuted = false
  let highScores = JSON.parse(localStorage.getItem("snakeHighScores")) || []
  let bestScore = highScores.length > 0 ? Math.max(...highScores.map((s) => s.score)) : 0

  // Game elements size
  const gridSize = 20
  let gridWidth, gridHeight

  // DOM elements
  const startOverlay = document.getElementById("start-overlay")
  const gameOverOverlay = document.getElementById("game-over-overlay")
  const playButton = document.getElementById("snake-play-button")
  const playAgainButton = document.getElementById("play-again-button")
  const scoreDisplay = document.getElementById("snake-score")
  const levelDisplay = document.getElementById("snake-level")
  const bestDisplay = document.getElementById("snake-best")
  const statusDisplay = document.getElementById("snake-status")
  const finalScoreDisplay = document.getElementById("final-score")
  const nameInput = document.getElementById("name-input")
  const submitScoreButton = document.getElementById("submit-score")
  const highScoresList = document.getElementById("high-scores-list")
  const muteButton = document.getElementById("mute-button")
  const music = document.getElementById("snake-music")

  // Mobile joystick elements
  const joystickBase = document.getElementById("joystick-base")
  const joystickStick = document.getElementById("joystick-stick")

  // Sound effects with preloading
  const eatSound = new Audio("https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/hover.mp3?v=1746577634973")
  const gameOverSound = new Audio("https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/tiger-roar.mp3")

  // Set volume
  eatSound.volume = 0.3
  gameOverSound.volume = 0.3
  music.volume = 0.2

  // Power-up types
  const powerUpTypes = [
    {
      type: "speed",
      color: "#fffc00", // Yellow
      duration: 5000,
      effect: () => {
        updateInterval = Math.max(50, updateInterval - 30)
        setTimeout(() => {
          updateInterval = 150 - (level - 1) * 10
        }, 5000)
      },
    },
    {
      type: "grow",
      color: "#00ff66", // Green
      duration: 0,
      effect: () => {
        // Add 3 segments to snake
        for (let i = 0; i < 3; i++) {
          snake.push({ ...snake[snake.length - 1] })
        }
      },
    },
    {
      type: "points",
      color: "#f3a1ff", // Pink
      duration: 0,
      effect: () => {
        score += 25
        updateDisplays()
      },
    },
  ]

  // Initialize game
  function initGame() {
    // Set canvas size to match container with proper scaling
    resizeCanvas()

    // Initialize snake
    snake = [
      { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) },
      { x: Math.floor(gridWidth / 2) - 1, y: Math.floor(gridHeight / 2) },
      { x: Math.floor(gridWidth / 2) - 2, y: Math.floor(gridHeight / 2) },
    ]

    // Generate first food
    generateFood()

    // Clear power-ups
    powerUps = []

    // Reset game state
    direction = "right"
    nextDirection = "right"
    score = 0
    level = 1
    updateInterval = 150
    isPaused = false

    // Update displays
    updateDisplays()

    // Start game loop with requestAnimationFrame for smoother animation
    cancelAnimationFrame(animationFrameId)
    lastUpdateTime = performance.now()
    gameLoop(lastUpdateTime)

    // Play music if not muted
    if (!isMuted) {
      music.play().catch((e) => console.log("Audio play prevented:", e))
    }

    // Announce game start to screen readers
    announceToScreenReader("Game started. Level 1.")
  }

  // Resize canvas to fit container with proper scaling
  function resizeCanvas() {
    const gameField = document.getElementById("game-field")
    const width = gameField.clientWidth
    const height = gameField.clientHeight

    // Set canvas dimensions with device pixel ratio for sharper rendering
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr

    // Set display size
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    // Scale context to match device pixel ratio
    ctx.scale(dpr, dpr)

    // Calculate grid dimensions
    gridWidth = Math.floor(width / gridSize)
    gridHeight = Math.floor(height / gridSize)
  }

  // Generate food at random position
  function generateFood() {
    let validPosition = false
    let newFood

    while (!validPosition) {
      newFood = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
      }

      // Check if food is not on snake or power-ups
      validPosition = true

      // Check snake
      for (const segment of snake) {
        if (segment.x === newFood.x && segment.y === newFood.y) {
          validPosition = false
          break
        }
      }

      // Check power-ups
      if (validPosition) {
        for (const powerUp of powerUps) {
          if (powerUp.x === newFood.x && powerUp.y === newFood.y) {
            validPosition = false
            break
          }
        }
      }
    }

    food = newFood
  }

  // Generate power-up at random position
  function generatePowerUp() {
    // Limit number of power-ups on screen
    if (powerUps.length >= 3) return

    // Random chance to generate power-up (10%)
    if (Math.random() > 0.1) return

    let validPosition = false
    let newPowerUp

    while (!validPosition) {
      newPowerUp = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
        type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
      }

      // Check if power-up is not on snake, food, or other power-ups
      validPosition = true

      // Check snake
      for (const segment of snake) {
        if (segment.x === newPowerUp.x && segment.y === newPowerUp.y) {
          validPosition = false
          break
        }
      }

      // Check food
      if (food.x === newPowerUp.x && food.y === newPowerUp.y) {
        validPosition = false
      }

      // Check other power-ups
      if (validPosition) {
        for (const powerUp of powerUps) {
          if (powerUp.x === newPowerUp.x && powerUp.y === newPowerUp.y) {
            validPosition = false
            break
          }
        }
      }
    }

    // Add expiration time for power-ups
    newPowerUp.expires = performance.now() + 10000 // 10 seconds

    powerUps.push(newPowerUp)
  }

  // Game loop with requestAnimationFrame for smoother animation
  function gameLoop(timestamp) {
    // Calculate time delta
    const elapsed = timestamp - lastUpdateTime

    // Update game state at fixed intervals
    if (elapsed > updateInterval) {
      lastUpdateTime = timestamp
      gameStep()
    }

    // Draw game every frame for smooth animation
    drawGame()

    // Continue loop
    animationFrameId = requestAnimationFrame(gameLoop)
  }

  // Game step - move snake and check collisions
  function gameStep() {
    if (isPaused) return

    // Move snake
    const head = { ...snake[0] }

    // Update direction
    direction = nextDirection

    // Move head based on direction
    switch (direction) {
      case "up":
        head.y--
        break
      case "down":
        head.y++
        break
      case "left":
        head.x--
        break
      case "right":
        head.x++
        break
    }

    // Check wall collision (wrap around)
    if (head.x < 0) head.x = gridWidth - 1
    if (head.x >= gridWidth) head.x = 0
    if (head.y < 0) head.y = gridHeight - 1
    if (head.y >= gridHeight) head.y = 0

    // Check self collision
    for (const segment of snake) {
      if (head.x === segment.x && head.y === segment.y) {
        gameOver()
        return
      }
    }

    // Add new head
    snake.unshift(head)

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
      // Eat food
      score += 10

      // Play eat sound
      if (!isMuted) {
        eatSound.currentTime = 0
        eatSound.play().catch((e) => console.log("Audio play prevented:", e))
      }

      // Generate new food
      generateFood()

      // Chance to generate power-up
      generatePowerUp()

      // Level up every 50 points
      if (score % 50 === 0) {
        level++
        updateInterval = Math.max(50, 150 - (level - 1) * 10)

        // Announce level up to screen readers
        announceToScreenReader(`Level up! Level ${level}.`)
      }

      // Update displays
      updateDisplays()
    } else {
      // Remove tail if not eating
      snake.pop()
    }

    // Check power-up collisions
    checkPowerUpCollisions(head)

    // Clean up expired power-ups
    cleanupPowerUps()
  }

  // Check for power-up collisions
  function checkPowerUpCollisions(head) {
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const powerUp = powerUps[i]
      if (head.x === powerUp.x && head.y === powerUp.y) {
        // Apply power-up effect
        powerUp.type.effect()

        // Play power-up sound
        if (!isMuted) {
          eatSound.currentTime = 0
          eatSound.play().catch((e) => console.log("Audio play prevented:", e))
        }

        // Remove power-up
        powerUps.splice(i, 1)

        // Announce power-up to screen readers
        announceToScreenReader(`Power up! ${powerUp.type.type}.`)
      }
    }
  }

  // Clean up expired power-ups
  function cleanupPowerUps() {
    const now = performance.now()
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (powerUps[i].expires < now) {
        powerUps.splice(i, 1)
      }
    }
  }

  // Draw game elements with optimized rendering
  function drawGame() {
    // Clear canvas
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid (faint lines)
    ctx.strokeStyle = "rgba(0, 240, 255, 0.1)"
    ctx.lineWidth = 0.5

    // Optimize grid drawing by reducing number of lines
    for (let x = 0; x < gridWidth; x += 2) {
      ctx.beginPath()
      ctx.moveTo(x * gridSize, 0)
      ctx.lineTo(x * gridSize, canvas.height)
      ctx.stroke()
    }

    for (let y = 0; y < gridHeight; y += 2) {
      ctx.beginPath()
      ctx.moveTo(0, y * gridSize)
      ctx.lineTo(canvas.width, canvas.height)
      ctx.stroke()
    }

    // Draw food with gradient for better appearance
    const gradient = ctx.createRadialGradient(
      food.x * gridSize + gridSize / 2,
      food.y * gridSize + gridSize / 2,
      0,
      food.x * gridSize + gridSize / 2,
      food.y * gridSize + gridSize / 2,
      gridSize / 2,
    )
    gradient.addColorStop(0, "#f3a1ff") // Neon pink
    gradient.addColorStop(1, "#a9a1ff") // Neon purple

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize / 2, 0, Math.PI * 2)
    ctx.fill()

    // Draw power-ups
    powerUps.forEach((powerUp) => {
      // Pulsating effect
      const pulseScale = 0.8 + 0.2 * Math.sin(performance.now() / 200)
      const size = (gridSize / 2) * pulseScale

      ctx.fillStyle = powerUp.type.color
      ctx.beginPath()
      ctx.moveTo(powerUp.x * gridSize + gridSize / 2, powerUp.y * gridSize + gridSize / 2 - size)

      // Draw star shape
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
        const nextAngle = (Math.PI * 2 * (i + 0.5)) / 5 - Math.PI / 2

        const outerX = powerUp.x * gridSize + gridSize / 2 + Math.cos(angle) * size
        const outerY = powerUp.y * gridSize + gridSize / 2 + Math.sin(angle) * size

        const innerX = powerUp.x * gridSize + gridSize / 2 + Math.cos(nextAngle) * (size / 2)
        const innerY = powerUp.y * gridSize + gridSize / 2 + Math.sin(nextAngle) * (size / 2)

        ctx.lineTo(outerX, outerY)
        ctx.lineTo(innerX, innerY)
      }

      ctx.closePath()
      ctx.fill()

      // Add glow effect
      ctx.shadowColor = powerUp.type.color
      ctx.shadowBlur = 10
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Draw snake with optimized rendering
    // Use a single path for the snake body for better performance
    ctx.beginPath()
    snake.forEach((segment, index) => {
      // Head is cyan, body is gradient from cyan to green
      const progress = index / snake.length
      const color =
        index === 0
          ? "#00f0ff" // Cyan for head
          : `rgb(${Math.floor(0 + progress * 0)}, ${Math.floor(240 - progress * 140)}, ${Math.floor(255 - progress * 153)})`

      ctx.fillStyle = color
      ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize)

      // Add glow effect only to head for better performance
      if (index === 0) {
        ctx.shadowColor = color
        ctx.shadowBlur = 10
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize)
        ctx.shadowBlur = 0
      }

      // Add eyes to head
      if (index === 0) {
        ctx.fillStyle = "black"

        // Position eyes based on direction
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY

        switch (direction) {
          case "up":
            leftEyeX = segment.x * gridSize + gridSize * 0.25
            leftEyeY = segment.y * gridSize + gridSize * 0.25
            rightEyeX = segment.x * gridSize + gridSize * 0.75
            rightEyeY = segment.y * gridSize + gridSize * 0.25
            break
          case "down":
            leftEyeX = segment.x * gridSize + gridSize * 0.25
            leftEyeY = segment.y * gridSize + gridSize * 0.75
            rightEyeX = segment.x * gridSize + gridSize * 0.75
            rightEyeY = segment.y * gridSize + gridSize * 0.75
            break
          case "left":
            leftEyeX = segment.x * gridSize + gridSize * 0.25
            leftEyeY = segment.y * gridSize + gridSize * 0.25
            rightEyeX = segment.x * gridSize + gridSize * 0.25
            rightEyeY = segment.y * gridSize + gridSize * 0.75
            break
          case "right":
            leftEyeX = segment.x * gridSize + gridSize * 0.75
            leftEyeY = segment.y * gridSize + gridSize * 0.25
            rightEyeX = segment.x * gridSize + gridSize * 0.75
            rightEyeY = segment.y * gridSize + gridSize * 0.75
            break
        }

        ctx.beginPath()
        ctx.arc(leftEyeX, leftEyeY, gridSize * 0.1, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(rightEyeX, rightEyeY, gridSize * 0.1, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }

  // Update score and level displays
  function updateDisplays() {
    scoreDisplay.textContent = `Score: ${score}`
    levelDisplay.textContent = `Level: ${level}`
    bestDisplay.textContent = `Best: ${Math.max(bestScore, score)}`
    statusDisplay.textContent = isPaused ? "Paused" : "Running"
  }

  // Game over
  function gameOver() {
    cancelAnimationFrame(animationFrameId)

    // Play game over sound
    if (!isMuted) {
      music.pause()
      gameOverSound.play().catch((e) => console.log("Audio play prevented:", e))
    }

    // Update best score
    if (score > bestScore) {
      bestScore = score
    }

    // Show game over overlay
    finalScoreDisplay.textContent = `Your score: ${score}`
    gameOverOverlay.classList.remove("hidden")

    // Focus name input
    nameInput.focus()

    // Update high scores list
    updateHighScoresList()

    // Announce game over to screen readers
    announceToScreenReader(`Game over. Your score: ${score}.`)
  }

  // Update high scores list
  function updateHighScoresList() {
    highScoresList.innerHTML = ""

    // Sort high scores by score (descending)
    highScores.sort((a, b) => b.score - a.score)

    // Show top 5 scores
    const topScores = highScores.slice(0, 5)

    topScores.forEach((entry, index) => {
      const li = document.createElement("li")
      li.textContent = `${index + 1}. ${entry.name}: ${entry.score}`
      highScoresList.appendChild(li)
    })
  }

  // Submit high score
  function submitHighScore() {
    const name = nameInput.value.trim() || "ANON"

    // Add score to high scores
    highScores.push({ name, score })

    // Sort and limit to top 10
    highScores.sort((a, b) => b.score - a.score)
    highScores = highScores.slice(0, 10)

    // Save to localStorage
    localStorage.setItem("snakeHighScores", JSON.stringify(highScores))

    // Update display
    updateHighScoresList()

    // Disable submit button
    submitScoreButton.disabled = true

    // Announce to screen readers
    announceToScreenReader(`Score submitted. ${name}: ${score}.`)
  }

  // Toggle mute
  function toggleMute() {
    isMuted = !isMuted

    if (isMuted) {
      music.pause()
      muteButton.textContent = "🔇"
      muteButton.setAttribute("aria-label", "Unmute sound")
    } else {
      music.play().catch((e) => console.log("Audio play prevented:", e))
      muteButton.textContent = "🔊"
      muteButton.setAttribute("aria-label", "Mute sound")
    }
  }

  // Handle keyboard input with improved responsiveness
  function handleKeydown(e) {
    // Prevent default

    // Prevent default for arrow keys to avoid scrolling
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault()
    }

    // Change direction
    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        if (direction !== "down") nextDirection = "up"
        break
      case "ArrowDown":
      case "KeyS":
        if (direction !== "up") nextDirection = "down"
        break
      case "ArrowLeft":
      case "KeyA":
        if (direction !== "right") nextDirection = "left"
        break
      case "ArrowRight":
      case "KeyD":
        if (direction !== "left") nextDirection = "right"
        break
      case "Space":
        // Toggle pause
        isPaused = !isPaused
        updateDisplays()
        break
      case "KeyM":
        // Toggle mute
        toggleMute()
        break
    }
  }

  // Mobile joystick handling
  function setupJoystick() {
    let isDragging = false
    const baseRect = joystickBase.getBoundingClientRect()
    const baseX = baseRect.left + baseRect.width / 2
    const baseY = baseRect.top + baseRect.height / 2
    const maxDistance = baseRect.width / 2 - 15

    // Touch start
    joystickBase.addEventListener("touchstart", (e) => {
      e.preventDefault()
      isDragging = true
      updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY)
    })

    // Touch move
    document.addEventListener("touchmove", (e) => {
      if (!isDragging) return
      e.preventDefault()
      updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY)
    })

    // Touch end
    document.addEventListener("touchend", () => {
      isDragging = false
      joystickStick.style.left = "25px"
      joystickStick.style.top = "25px"
    })

    function updateJoystickPosition(touchX, touchY) {
      // Calculate distance from center
      const dx = touchX - baseX
      const dy = touchY - baseY

      // Calculate angle
      const angle = Math.atan2(dy, dx)

      // Calculate distance
      const distance = Math.min(maxDistance, Math.sqrt(dx * dx + dy * dy))

      // Calculate new position
      const newX = distance * Math.cos(angle)
      const newY = distance * Math.sin(angle)

      // Update joystick position
      joystickStick.style.left = `${25 + newX}px`
      joystickStick.style.top = `${25 + newY}px`

      // Update direction based on angle
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal movement
        if (dx > 10 && direction !== "left") nextDirection = "right"
        else if (dx < -10 && direction !== "right") nextDirection = "left"
      } else {
        // Vertical movement
        if (dy > 10 && direction !== "up") nextDirection = "down"
        else if (dy < -10 && direction !== "down") nextDirection = "up"
      }
    }
  }

  // Announce message to screen readers
  function announceToScreenReader(message) {
    const announcementElement = document.createElement("div")
    announcementElement.setAttribute("aria-live", "assertive")
    announcementElement.classList.add("sr-only") // Use a CSS class to hide the element
    announcementElement.textContent = message
    document.body.appendChild(announcementElement)

    // Remove the element after a short delay
    setTimeout(() => {
      document.body.removeChild(announcementElement)
    }, 1000)
  }

  // Event listeners
  window.addEventListener("resize", resizeCanvas)
  document.addEventListener("keydown", handleKeydown)
  playButton.addEventListener("click", () => {
    startOverlay.classList.add("hidden")
    initGame()
  })
  playAgainButton.addEventListener("click", () => {
    gameOverOverlay.classList.add("hidden")
    initGame()
  })
  submitScoreButton.addEventListener("click", submitHighScore)
  muteButton.addEventListener("click", toggleMute)

  // Setup mobile joystick
  setupJoystick()

  // Load high scores
  updateHighScoresList()

  // Initial draw
  drawGame()

  // Accessibility - make game playable with keyboard
  playButton.setAttribute("tabindex", "0")
  playAgainButton.setAttribute("tabindex", "0")
  submitScoreButton.setAttribute("tabindex", "0")
  muteButton.setAttribute("tabindex", "0")

  // Add keyboard event for buttons
  playButton.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      playButton.click()
    }
  })

  playAgainButton.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      playAgainButton.click()
    }
  })

  submitScoreButton.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      submitScoreButton.click()
    }
  })

  muteButton.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      muteButton.click()
    }
  })
})
