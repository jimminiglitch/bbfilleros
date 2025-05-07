// pong.js

// (Optional) Debounce helper
function debounce(fn, ms) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn.apply(this, args), ms)
  }
}

// All your “cool shit” verbatim:
function initPongGame() {
  const pongWindow = document.getElementById("pong")
  if (!pongWindow) return

  const canvas = document.getElementById("pong-canvas")
  if (!canvas) return

  const ctx = canvas.getContext("2d")

// 13) PONG GAME
function initPongGame() {
  const pongWindow = document.getElementById("pong")
  if (!pongWindow) return

  const canvas = pongWindow.querySelector("canvas")
  if (!canvas) return

  const ctx = canvas.getContext("2d")

  // Set canvas size to fit window
  function resizeCanvas() {
    const content = pongWindow.querySelector(".window-content")
    canvas.width = content.clientWidth
    canvas.height = content.clientHeight
  }

  resizeCanvas()

  // Game variables
  const paddleWidth = 15
  const paddleHeight = 100
  const ballSize = 15
  let ballX = canvas.width / 2
  let ballY = canvas.height / 2
  let ballSpeedX = 5
  let ballSpeedY = 5
  let player1Y = (canvas.height - paddleHeight) / 2
  let player2Y = (canvas.height - paddleHeight) / 2
  let player1Score = 0
  let player2Score = 0
  let gameStarted = false
  let gameOver = false
  let paused = false
  const aiDifficulty = 0.08 // Higher = harder

  // Colors
  const colors = {
    background: "#000",
    ball: "#00f0ff",
    player1: "#f3a1ff",
    player2: "#fffc00",
    text: "#fff",
    centerLine: "rgba(255, 255, 255, 0.2)",
  }

  // Particles
  let particles = []

  // Draw functions
  function drawGame() {
    if (paused) return

    // Clear canvas
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw center line
    ctx.strokeStyle = colors.centerLine
    ctx.setLineDash([10, 15])
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw paddles
    drawPaddle(20, player1Y, colors.player1) // Player 1
    drawPaddle(canvas.width - 20 - paddleWidth, player2Y, colors.player2) // Player 2 or AI

    // Draw ball
    drawBall()

    // Draw particles
    updateParticles()

    // Draw score
    drawScore()

    // Draw game over or start screen
    if (gameOver) {
      drawGameOver()
    } else if (!gameStarted) {
      drawStartScreen()
    }
  }

  function drawPaddle(x, y, color) {
    // Glow effect
    ctx.shadowBlur = 15
    ctx.shadowColor = color

    // Draw paddle
    ctx.fillStyle = color
    roundRect(ctx, x, y, paddleWidth, paddleHeight, 5, true)

    // Reset shadow
    ctx.shadowBlur = 0
  }

  function drawBall() {
    // Glow effect
    ctx.shadowBlur = 20
    ctx.shadowColor = colors.ball

    // Draw ball
    ctx.fillStyle = colors.ball
    ctx.beginPath()
    ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2)
    ctx.fill()

    // Reset shadow
    ctx.shadowBlur = 0
  }

  function drawScore() {
    ctx.fillStyle = colors.text
    ctx.font = '40px "Press Start 2P"'
    ctx.textAlign = "center"

    // Player 1 score
    ctx.fillStyle = colors.player1
    ctx.fillText(player1Score.toString(), canvas.width / 4, 60)

    // Player 2 score
    ctx.fillStyle = colors.player2
    ctx.fillText(player2Score.toString(), (canvas.width / 4) * 3, 60)
  }

  function drawGameOver() {
    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Game over text
    ctx.fillStyle = "#f3a1ff"
    ctx.font = '30px "Press Start 2P"'
    ctx.textAlign = "center"
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40)

    // Winner
    const winner = player1Score > player2Score ? "PLAYER 1" : "PLAYER 2"
    ctx.fillStyle = player1Score > player2Score ? colors.player1 : colors.player2
    ctx.fillText(`${winner} WINS!`, canvas.width / 2, canvas.height / 2)

    // Restart instructions
    ctx.fillStyle = "#fffc00"
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText("Press SPACE to restart", canvas.width / 2, canvas.height / 2 + 40)
  }

  function drawStartScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Title
    ctx.fillStyle = "#00f0ff"
    ctx.font = '30px "Press Start 2P"'
    ctx.textAlign = "center"
    ctx.fillText("CYBER PONG", canvas.width / 2, canvas.height / 2 - 60)

    // Instructions
    ctx.fillStyle = "#f3a1ff"
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText("Mouse or Touch to move", canvas.width / 2, canvas.height / 2 - 20)
    ctx.fillText("First to 5 points wins", canvas.width / 2, canvas.height / 2 + 10)

    // Start instructions
    ctx.fillStyle = "#fffc00"
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText("Press SPACE to start", canvas.width / 2, canvas.height / 2 + 40)
  }

  // Helper function for rounded rectangles
  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    if (fill) {
      ctx.fill()
    }
    if (stroke) {
      ctx.stroke()
    }
  }

  // Particle effects
  function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        size: Math.random() * 5 + 2,
        color: color,
        speedX: (Math.random() - 0.5) * 8,
        speedY: (Math.random() - 0.5) * 8,
        life: 30 + Math.random() * 20,
      })
    }
  }

  function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]

      p.x += p.speedX
      p.y += p.speedY
      p.life--

      // Draw particle
      ctx.globalAlpha = p.life / 50
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()

      // Remove dead particles
      if (p.life <= 0) {
        particles.splice(i, 1)
        i--
      }
    }

    ctx.globalAlpha = 1
  }

  // Game logic
  function updateGame() {
    if (gameOver || !gameStarted || paused) return

    // Move ball
    ballX += ballSpeedX
    ballY += ballSpeedY

    // Ball collision with top and bottom
    if (ballY - ballSize < 0 || ballY + ballSize > canvas.height) {
      ballSpeedY = -ballSpeedY
      createParticles(ballX, ballY, colors.ball, 5)
      playSound("click", 0.2)
    }

    // Ball collision with paddles
    // Player 1 paddle
    if (ballX - ballSize < 20 + paddleWidth && ballY > player1Y && ballY < player1Y + paddleHeight) {
      // Calculate angle based on where ball hits paddle
      const hitPos = (ballY - player1Y) / paddleHeight
      const angle = ((hitPos - 0.5) * Math.PI) / 2

      ballSpeedX = Math.abs(ballSpeedX) * 1.05 // Speed up slightly
      ballSpeedY = Math.sin(angle) * 7

      createParticles(ballX, ballY, colors.player1, 10)
      playSound("success", 0.3)
    }

    // Player 2 / AI paddle
    if (ballX + ballSize > canvas.width - 20 - paddleWidth && ballY > player2Y && ballY < player2Y + paddleHeight) {
      // Calculate angle based on where ball hits paddle
      const hitPos = (ballY - player2Y) / paddleHeight
      const angle = ((hitPos - 0.5) * Math.PI) / 2

      ballSpeedX = -Math.abs(ballSpeedX) * 1.05 // Speed up slightly
      ballSpeedY = Math.sin(angle) * 7

      createParticles(ballX, ballY, colors.player2, 10)
      playSound("success", 0.3)
    }

    // Ball out of bounds
    if (ballX < 0) {
      // Player 2 scores
      player2Score++
      createParticles(ballX, ballY, colors.player2, 20)
      resetBall()
      playSound("error", 0.4)

      if (player2Score >= 5) {
        gameOver = true
      }
    } else if (ballX > canvas.width) {
      // Player 1 scores
      player1Score++
      createParticles(ballX, ballY, colors.player1, 20)
      resetBall()
      playSound("error", 0.4)

      if (player1Score >= 5) {
        gameOver = true
      }
    }

    // AI movement
    if (ballSpeedX > 0) {
      // Ball moving towards AI
      // Add some prediction and difficulty
      const targetY = ballY - paddleHeight / 2
      player2Y += (targetY - player2Y) * aiDifficulty
    }

    // Keep paddles within bounds
    player1Y = Math.max(0, Math.min(canvas.height - paddleHeight, player1Y))
    player2Y = Math.max(0, Math.min(canvas.height - paddleHeight, player2Y))
  }

  function resetBall() {
    ballX = canvas.width / 2
    ballY = canvas.height / 2

    // Random direction
    ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 5
    ballSpeedY = (Math.random() * 2 - 1) * 5
  }

  function resetGame() {
    player1Score = 0
    player2Score = 0
    player1Y = (canvas.height - paddleHeight) / 2
    player2Y = (canvas.height - paddleHeight) / 2
    particles = []
    gameOver = false
    resetBall()
  }

  // Input handling
  function handleMouseMove(e) {
    if (!gameStarted || gameOver || paused) return

    const rect = canvas.getBoundingClientRect()
    const mouseY = e.clientY - rect.top

    // Move paddle to mouse position (centered)
    player1Y = mouseY - paddleHeight / 2
  }

  function handleTouchMove(e) {
    if (!gameStarted || gameOver || paused) return

    const rect = canvas.getBoundingClientRect()
    const touchY = e.touches[0].clientY - rect.top

    // Move paddle to touch position (centered)
    player1Y = touchY - paddleHeight / 2

    e.preventDefault()
  }

  function handleKeyDown(e) {
    if (e.key === " " || e.code === "Space") {
      if (gameOver) {
        resetGame()
        gameStarted = true
        playSound("click")
      } else if (!gameStarted) {
        gameStarted = true
        playSound("click")
      } else {
        paused = !paused
        playSound("click")
      }
      e.preventDefault()
    }
  }

  // Add event listeners
  canvas.addEventListener("mousemove", handleMouseMove)
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
  window.addEventListener("keydown", handleKeyDown)

  // Add tap to start/restart
  canvas.addEventListener("click", () => {
    if (gameOver) {
      resetGame()
      gameStarted = true
      playSound("click")
    } else if (!gameStarted) {
      gameStarted = true
      playSound("click")
    }
  })

  // Game loop
  function gameLoop() {
    drawGame()
    updateGame()

    requestAnimationFrame(gameLoop)
  }

  // Start game loop
  requestAnimationFrame(gameLoop)

  // Handle window resize
  window.addEventListener(
    "resize",
    debounce(() => {
      resizeCanvas()
      resetBall()
    }, 250),
  )
}

}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initPongGame()
})

// Re-init whenever you reopen the window
window.addEventListener("pongOpened", () => {
  initPongGame()
})
