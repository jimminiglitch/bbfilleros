/**
 * Optimized Snake Game
 * Improved performance, canvas scaling, and collision detection
 */

class SnakeGame {
  constructor(canvasId, options = {}) {
    // Get canvas and context
    this.canvas = document.getElementById(canvasId)
    if (!this.canvas) {
      console.error(`Canvas with ID "${canvasId}" not found.`)
      return
    }

    this.ctx = this.canvas.getContext("2d")

    // Game settings
    this.options = Object.assign(
      {
        gridSize: 20,
        speed: 100,
        initialLength: 3,
        backgroundColor: "#000",
        snakeColor: "#0f0",
        foodColor: "#f00",
        powerUpColor: "#ff0",
        borderColor: "#0ff",
        scoreColor: "#0ff",
        textFont: '"VT323", monospace',
        powerUpDuration: 5000,
        powerUpFrequency: 0.05, // 5% chance per food
        soundEnabled: true,
      },
      options,
    )

    // Game state
    this.snake = []
    this.food = null
    this.powerUp = null
    this.direction = "right"
    this.nextDirection = "right"
    this.score = 0
    this.highScore = this.getHighScore()
    this.gameOver = false
    this.paused = false
    this.powerUpActive = false
    this.powerUpTimer = null
    this.lastRenderTime = 0
    this.animationFrameId = null

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.resize = this.resize.bind(this)
    this.gameLoop = this.gameLoop.bind(this)

    // Initialize game
    this.init()
  }

  init() {
    // Set up canvas
    this.resize()

    // Create snake
    this.resetGame()

    // Set up event listeners
    window.addEventListener("keydown", this.handleKeyDown)
    this.canvas.addEventListener("touchstart", this.handleTouchStart)
    this.canvas.addEventListener("touchmove", this.handleTouchMove)
    window.addEventListener("resize", this.resize)

    // Load sounds
    this.loadSounds()

    // Start game loop
    this.lastRenderTime = performance.now()
    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }

  resize() {
    // Get parent element dimensions
    const parent = this.canvas.parentElement
    const parentWidth = parent.clientWidth
    const parentHeight = parent.clientHeight

    // Calculate grid dimensions
    const gridWidth = Math.floor(parentWidth / this.options.gridSize)
    const gridHeight = Math.floor(parentHeight / this.options.gridSize)

    // Set canvas dimensions
    this.canvas.width = gridWidth * this.options.gridSize
    this.canvas.height = gridHeight * this.options.gridSize

    // Update grid dimensions
    this.gridWidth = gridWidth
    this.gridHeight = gridHeight

    // Redraw game
    this.draw()
  }

  resetGame() {
    // Reset game state
    this.snake = []
    this.direction = "right"
    this.nextDirection = "right"
    this.score = 0
    this.gameOver = false
    this.paused = false
    this.powerUpActive = false

    // Clear power-up timer
    if (this.powerUpTimer) {
      clearTimeout(this.powerUpTimer)
      this.powerUpTimer = null
    }

    // Create initial snake
    const centerX = Math.floor(this.gridWidth / 2)
    const centerY = Math.floor(this.gridHeight / 2)

    for (let i = 0; i < this.options.initialLength; i++) {
      this.snake.push({ x: centerX - i, y: centerY })
    }

    // Create initial food
    this.createFood()

    // Clear power-up
    this.powerUp = null
  }

  createFood() {
    // Find empty cell
    let x, y
    let validPosition = false

    while (!validPosition) {
      x = Math.floor(Math.random() * this.gridWidth)
      y = Math.floor(Math.random() * this.gridHeight)

      validPosition = true

      // Check if cell is occupied by snake
      for (const segment of this.snake) {
        if (segment.x === x && segment.y === y) {
          validPosition = false
          break
        }
      }

      // Check if cell is occupied by power-up
      if (this.powerUp && this.powerUp.x === x && this.powerUp.y === y) {
        validPosition = false
      }
    }

    this.food = { x, y }

    // Chance to spawn power-up
    if (!this.powerUp && Math.random() < this.options.powerUpFrequency) {
      this.createPowerUp()
    }
  }

  createPowerUp() {
    // Find empty cell
    let x, y
    let validPosition = false

    while (!validPosition) {
      x = Math.floor(Math.random() * this.gridWidth)
      y = Math.floor(Math.random() * this.gridHeight)

      validPosition = true

      // Check if cell is occupied by snake
      for (const segment of this.snake) {
        if (segment.x === x && segment.y === y) {
          validPosition = false
          break
        }
      }

      // Check if cell is occupied by food
      if (this.food && this.food.x === x && this.food.y === y) {
        validPosition = false
      }
    }

    this.powerUp = { x, y, type: "speed" } // For now, only speed power-up
  }

  handleKeyDown(e) {
    // Skip if game is over
    if (this.gameOver) {
      if (e.key === "Enter" || e.key === " ") {
        this.resetGame()
      }
      return
    }

    // Toggle pause
    if (e.key === "p" || e.key === "P") {
      this.paused = !this.paused
      return
    }

    // Skip if paused
    if (this.paused) return

    // Handle direction change
    switch (e.key) {
      case "ArrowUp":
      case "w":
      case "W":
        if (this.direction !== "down") {
          this.nextDirection = "up"
        }
        break
      case "ArrowDown":
      case "s":
      case "S":
        if (this.direction !== "up") {
          this.nextDirection = "down"
        }
        break
      case "ArrowLeft":
      case "a":
      case "A":
        if (this.direction !== "right") {
          this.nextDirection = "left"
        }
        break
      case "ArrowRight":
      case "d":
      case "D":
        if (this.direction !== "left") {
          this.nextDirection = "right"
        }
        break
    }
  }

  handleTouchStart(e) {
    e.preventDefault()
    this.touchStartX = e.touches[0].clientX
    this.touchStartY = e.touches[0].clientY
  }

  handleTouchMove(e) {
    // Skip if game is over or paused
    if (this.gameOver || this.paused) return

    e.preventDefault()

    if (!this.touchStartX || !this.touchStartY) return

    const touchEndX = e.touches[0].clientX
    const touchEndY = e.touches[0].clientY

    const dx = touchEndX - this.touchStartX
    const dy = touchEndY - this.touchStartY

    // Determine swipe direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0 && this.direction !== "left") {
        this.nextDirection = "right"
      } else if (dx < 0 && this.direction !== "right") {
        this.nextDirection = "left"
      }
    } else {
      // Vertical swipe
      if (dy > 0 && this.direction !== "up") {
        this.nextDirection = "down"
      } else if (dy < 0 && this.direction !== "down") {
        this.nextDirection = "up"
      }
    }

    // Reset touch start position
    this.touchStartX = touchEndX
    this.touchStartY = touchEndY
  }

  update() {
    // Skip if game is over or paused
    if (this.gameOver || this.paused) return

    // Update direction
    this.direction = this.nextDirection

    // Move snake
    const head = { ...this.snake[0] }

    switch (this.direction) {
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

    // Check for wall collision
    if (head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
      this.gameOver = true
      this.playSound("gameOver")
      return
    }

    // Check for self collision
    for (const segment of this.snake) {
      if (head.x === segment.x && head.y === segment.y) {
        this.gameOver = true
        this.playSound("gameOver")
        return
      }
    }

    // Add new head
    this.snake.unshift(head)

    // Check for food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      // Increase score
      this.score++

      // Update high score
      if (this.score > this.highScore) {
        this.highScore = this.score
        this.saveHighScore()
      }

      // Create new food
      this.createFood()

      // Play sound
      this.playSound("eat")
    } else {
      // Remove tail
      this.snake.pop()
    }

    // Check for power-up collision
    if (this.powerUp && head.x === this.powerUp.x && head.y === this.powerUp.y) {
      // Activate power-up
      this.activatePowerUp(this.powerUp.type)

      // Clear power-up
      this.powerUp = null

      // Play sound
      this.playSound("powerUp")
    }
  }

  activatePowerUp(type) {
    // Clear existing power-up timer
    if (this.powerUpTimer) {
      clearTimeout(this.powerUpTimer)
    }

    // Activate power-up
    this.powerUpActive = true

    // Apply power-up effect
    switch (type) {
      case "speed":
        // Speed boost
        this.options.speed = this.options.speed / 2
        break
    }

    // Set power-up timer
    this.powerUpTimer = setTimeout(() => {
      // Deactivate power-up
      this.powerUpActive = false

      // Remove power-up effect
      switch (type) {
        case "speed":
          // Reset speed
          this.options.speed = this.options.speed * 2
          break
      }

      this.powerUpTimer = null
    }, this.options.powerUpDuration)
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = this.options.backgroundColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw border
    this.ctx.strokeStyle = this.options.borderColor
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw snake
    for (let i = 0; i < this.snake.length; i++) {
      const segment = this.snake[i]

      // Use gradient for head
      if (i === 0) {
        const gradient = this.ctx.createRadialGradient(
          (segment.x + 0.5) * this.options.gridSize,
          (segment.y + 0.5) * this.options.gridSize,
          0,
          (segment.x + 0.5) * this.options.gridSize,
          (segment.y + 0.5) * this.options.gridSize,
          this.options.gridSize / 2,
        )

        gradient.addColorStop(0, "#fff")
        gradient.addColorStop(1, this.powerUpActive ? "#ff0" : this.options.snakeColor)

        this.ctx.fillStyle = gradient
      } else {
        // Use regular color for body
        this.ctx.fillStyle = this.powerUpActive
          ? i % 2 === 0
            ? this.options.snakeColor
            : "#ff0"
          : this.options.snakeColor
      }

      this.ctx.fillRect(
        segment.x * this.options.gridSize,
        segment.y * this.options.gridSize,
        this.options.gridSize,
        this.options.gridSize,
      )

      // Add eye details to head
      if (i === 0) {
        this.ctx.fillStyle = "#000"

        // Position eyes based on direction
        let eyeX1, eyeY1, eyeX2, eyeY2
        const eyeSize = this.options.gridSize / 5
        const eyeOffset = this.options.gridSize / 3

        switch (this.direction) {
          case "up":
            eyeX1 = segment.x * this.options.gridSize + eyeOffset
            eyeY1 = segment.y * this.options.gridSize + eyeOffset
            eyeX2 = segment.x * this.options.gridSize + this.options.gridSize - eyeOffset - eyeSize
            eyeY2 = segment.y * this.options.gridSize + eyeOffset
            break
          case "down":
            eyeX1 = segment.x * this.options.gridSize + eyeOffset
            eyeY1 = segment.y * this.options.gridSize + this.options.gridSize - eyeOffset - eyeSize
            eyeX2 = segment.x * this.options.gridSize + this.options.gridSize - eyeOffset - eyeSize
            eyeY2 = segment.y * this.options.gridSize + this.options.gridSize - eyeOffset - eyeSize
            break
          case "left":
            eyeX1 = segment.x * this.options.gridSize + eyeOffset
            eyeY1 = segment.y * this.options.gridSize + eyeOffset
            eyeX2 = segment.x * this.options.gridSize + eyeOffset
            eyeY2 = segment.y * this.options.gridSize + this.options.gridSize - eyeOffset - eyeSize
            break
          case "right":
            eyeX1 = segment.x * this.options.gridSize + this.options.gridSize - eyeOffset - eyeSize
            eyeY1 = segment.y * this.options.gridSize + eyeOffset
            eyeX2 = segment.x * this.options.gridSize + this.options.gridSize - eyeOffset - eyeSize
            eyeY2 = segment.y * this.options.gridSize + this.options.gridSize - eyeOffset - eyeSize
            break
        }

        this.ctx.fillRect(eyeX1, eyeY1, eyeSize, eyeSize)
        this.ctx.fillRect(eyeX2, eyeY2, eyeSize, eyeSize)
      }
    }

    // Draw food
    if (this.food) {
      const gradient = this.ctx.createRadialGradient(
        (this.food.x + 0.5) * this.options.gridSize,
        (this.food.y + 0.5) * this.options.gridSize,
        0,
        (this.food.x + 0.5) * this.options.gridSize,
        (this.food.y + 0.5) * this.options.gridSize,
        this.options.gridSize / 2,
      )

      gradient.addColorStop(0, "#fff")
      gradient.addColorStop(1, this.options.foodColor)

      this.ctx.fillStyle = gradient
      this.ctx.beginPath()
      this.ctx.arc(
        (this.food.x + 0.5) * this.options.gridSize,
        (this.food.y + 0.5) * this.options.gridSize,
        this.options.gridSize / 2,
        0,
        Math.PI * 2,
      )
      this.ctx.fill()
    }

    // Draw power-up
    if (this.powerUp) {
      // Use pulsating effect
      const pulseSize = 0.8 + 0.2 * Math.sin(Date.now() / 200)

      this.ctx.fillStyle = this.options.powerUpColor
      this.ctx.beginPath()
      this.ctx.arc(
        (this.powerUp.x + 0.5) * this.options.gridSize,
        (this.powerUp.y + 0.5) * this.options.gridSize,
        (this.options.gridSize / 2) * pulseSize,
        0,
        Math.PI * 2,
      )
      this.ctx.fill()

      // Add star shape
      this.ctx.strokeStyle = "#fff"
      this.ctx.lineWidth = 2
      this.ctx.beginPath()

      const centerX = (this.powerUp.x + 0.5) * this.options.gridSize
      const centerY = (this.powerUp.y + 0.5) * this.options.gridSize
      const spikes = 5
      const outerRadius = (this.options.gridSize / 3) * pulseSize
      const innerRadius = (this.options.gridSize / 6) * pulseSize

      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius
        const angle = (Math.PI * i) / spikes
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius

        if (i === 0) {
          this.ctx.moveTo(x, y)
        } else {
          this.ctx.lineTo(x, y)
        }
      }

      this.ctx.closePath()
      this.ctx.stroke()
    }

    // Draw score
    this.ctx.fillStyle = this.options.scoreColor
    this.ctx.font = `${this.options.gridSize}px ${this.options.textFont}`
    this.ctx.textAlign = "left"
    this.ctx.textBaseline = "top"
    this.ctx.fillText(`Score: ${this.score}`, 10, 10)

    // Draw high score
    this.ctx.textAlign = "right"
    this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width - 10, 10)

    // Draw power-up timer
    if (this.powerUpActive) {
      const timeLeft = Math.ceil((this.powerUpTimer._idleStart + this.powerUpTimer._idleTimeout - Date.now()) / 1000)

      this.ctx.textAlign = "center"
      this.ctx.fillStyle = this.options.powerUpColor
      this.ctx.fillText(`Speed Boost: ${timeLeft}s`, this.canvas.width / 2, 10)
    }

    // Draw game over message
    if (this.gameOver) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      this.ctx.fillStyle = this.options.scoreColor
      this.ctx.font = `${this.options.gridSize * 2}px ${this.options.textFont}`
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"
      this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2 - this.options.gridSize)

      this.ctx.font = `${this.options.gridSize}px ${this.options.textFont}`
      this.ctx.fillText(
        `Final Score: ${this.score}`,
        this.canvas.width / 2,
        this.canvas.height / 2 + this.options.gridSize,
      )
      this.ctx.fillText(
        "Press Enter or Space to restart",
        this.canvas.width / 2,
        this.canvas.height / 2 + this.options.gridSize * 3,
      )
    }

    // Draw pause message
    if (this.paused && !this.gameOver) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      this.ctx.fillStyle = this.options.scoreColor
      this.ctx.font = `${this.options.gridSize * 2}px ${this.options.textFont}`
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"
      this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2)

      this.ctx.font = `${this.options.gridSize}px ${this.options.textFont}`
      this.ctx.fillText("Press P to resume", this.canvas.width / 2, this.canvas.height / 2 + this.options.gridSize * 2)
    }
  }

  gameLoop(timestamp) {
    // Calculate time since last update
    const deltaTime = timestamp - this.lastRenderTime

    // Update game state if enough time has passed
    if (deltaTime >= this.options.speed) {
      this.update()
      this.lastRenderTime = timestamp
    }

    // Draw game
    this.draw()

    // Continue game loop
    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }

  getHighScore() {
    try {
      return Number.parseInt(localStorage.getItem("snakeHighScore") || "0")
    } catch (e) {
      return 0
    }
  }

  saveHighScore() {
    try {
      localStorage.setItem("snakeHighScore", this.highScore.toString())
    } catch (e) {
      console.error("Failed to save high score:", e)
    }
  }

  loadSounds() {
    this.sounds = {
      eat: new Audio("/sounds/eat.mp3"),
      gameOver: new Audio("/sounds/game-over.mp3"),
      powerUp: new Audio("/sounds/power-up.mp3"),
    }

    // Preload sounds
    Object.values(this.sounds).forEach((sound) => {
      sound.load()
    })
  }

  playSound(name) {
    if (!this.options.soundEnabled) return

    const sound = this.sounds[name]
    if (sound) {
      sound.currentTime = 0
      sound.play().catch((e) => {
        // Ignore errors (common in browsers that require user interaction)
      })
    }
  }

  destroy() {
    // Stop game loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    // Clear power-up timer
    if (this.powerUpTimer) {
      clearTimeout(this.powerUpTimer)
    }

    // Remove event listeners
    window.removeEventListener("keydown", this.handleKeyDown)
    this.canvas.removeEventListener("touchstart", this.handleTouchStart)
    this.canvas.removeEventListener("touchmove", this.handleTouchMove)
    window.removeEventListener("resize", this.resize)
  }
}

// Initialize snake game when window loads
window.initSnakeGame = (canvasId, options) => new SnakeGame(canvasId, options)
