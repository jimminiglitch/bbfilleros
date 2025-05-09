window.addEventListener("load", () => {
  const canvas = document.getElementById("snake-canvas")
  const ctx = canvas.getContext("2d")
  const scoreEl = document.getElementById("score")
  const highScoreEl = document.getElementById("highScore")
  const startOvl = document.getElementById("startOvl")
  const btnPlay = document.getElementById("btnPlay")
  const ui = {
    status: document.getElementById("status"),
  }
  const joystickBase = document.getElementById("joystickBase")
  const joystickStick = document.getElementById("joystickStick")

  // Touch controls
  let touchStartX = 0
  let touchStartY = 0
  let touchEndX = 0
  let touchEndY = 0
  let joystickActive = false
  let joystickAngle = 0

  let animationFrameId
  let lastRenderTime = 0
  let gameOver = false
  let paused = false
  let started = false

  let snake = [{ x: 10, y: 10 }]
  let food = { x: 5, y: 5 }
  let score = 0
  const highScore = localStorage.getItem("highScore") || 0
  highScoreEl.textContent = `High Score: ${highScore}`

  let dx = 1
  let dy = 0
  let gridSize = 20
  const baseSpeed = 150
  let speed = baseSpeed

  let music
  let eatSound
  let dieSound

  function initAudio() {
    music = document.getElementById("music")
    eatSound = document.getElementById("eat")
    dieSound = document.getElementById("die")
  }

  // ─── Touch Controls ─────────────────────────────────────────────────────────
  function initTouchControls() {
    // Show joystick on mobile devices
    if (isMobileDevice()) {
      if (joystickBase) joystickBase.parentElement.style.display = "block"
    }

    // Swipe detection
    document.addEventListener("touchstart", handleTouchStart, { passive: false })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd, { passive: false })

    // Joystick controls
    if (joystickBase && joystickStick) {
      joystickBase.addEventListener("touchstart", handleJoystickStart, { passive: false })
      joystickBase.addEventListener("touchmove", handleJoystickMove, { passive: false })
      joystickBase.addEventListener("touchend", handleJoystickEnd, { passive: false })
    }
  }

  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  function handleTouchStart(e) {
    if (!started || gameOver) return

    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY

    // Prevent default only if we're in the game area
    if (e.target.id === "snake-canvas") {
      e.preventDefault()
    }
  }

  function handleTouchMove(e) {
    if (!started || gameOver || paused || joystickActive) return

    // Only prevent default if we're in the game area
    if (e.target.id === "snake-canvas") {
      e.preventDefault()
    }
  }

  function handleTouchEnd(e) {
    if (!started || gameOver || paused || joystickActive) return

    touchEndX = e.changedTouches[0].clientX
    touchEndY = e.changedTouches[0].clientY

    // Calculate swipe direction
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY

    // Only register as a swipe if the movement is significant
    const minSwipeDistance = 30

    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
      // Determine if horizontal or vertical swipe based on which delta is larger
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && dx !== -1) {
          // Right swipe
          dx = 1
          dy = 0
        } else if (deltaX < 0 && dx !== 1) {
          // Left swipe
          dx = -1
          dy = 0
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && dy !== -1) {
          // Down swipe
          dx = 0
          dy = 1
        } else if (deltaY < 0 && dy !== 1) {
          // Up swipe
          dx = 0
          dy = -1
        }
      }

      // Temporarily increase speed on swipe, like with keyboard
      speed = baseSpeed * 2
      setTimeout(() => {
        speed = baseSpeed
      }, 300)
    }
  }

  function handleJoystickStart(e) {
    if (!started || gameOver || paused) return

    e.preventDefault()
    joystickActive = true
    updateJoystickPosition(e.touches[0])
  }

  function handleJoystickMove(e) {
    if (!joystickActive) return

    e.preventDefault()
    updateJoystickPosition(e.touches[0])
  }

  function handleJoystickEnd(e) {
    joystickActive = false

    // Reset joystick position
    if (joystickStick) {
      joystickStick.style.transform = "translate(-50%, -50%)"
    }

    // Reset speed
    speed = baseSpeed
  }

  function updateJoystickPosition(touch) {
    if (!joystickBase || !joystickStick) return

    const rect = joystickBase.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Calculate distance from center
    const deltaX = touch.clientX - centerX
    const deltaY = touch.clientY - centerY

    // Calculate distance and angle
    const distance = Math.min(rect.width / 2, Math.sqrt(deltaX * deltaX + deltaY * deltaY))
    const angle = Math.atan2(deltaY, deltaX)

    // Update joystick position
    const stickX = distance * Math.cos(angle)
    const stickY = distance * Math.sin(angle)
    joystickStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`

    // Only update direction if the joystick is moved significantly
    if (distance > rect.width / 4) {
      joystickAngle = angle

      // Convert angle to direction
      // Right: -π/4 to π/4
      // Down: π/4 to 3π/4
      // Left: 3π/4 to -3π/4
      // Up: -3π/4 to -π/4

      const pi = Math.PI

      if (angle > -pi / 4 && angle < pi / 4 && dx !== -1) {
        // Right
        dx = 1
        dy = 0
      } else if (angle >= pi / 4 && angle < (3 * pi) / 4 && dy !== -1) {
        // Down
        dx = 0
        dy = 1
      } else if ((angle >= (3 * pi) / 4 || angle < (-3 * pi) / 4) && dx !== 1) {
        // Left
        dx = -1
        dy = 0
      } else if (angle >= (-3 * pi) / 4 && angle < -pi / 4 && dy !== 1) {
        // Up
        dx = 0
        dy = -1
      }

      // Increase speed while joystick is active
      speed = baseSpeed * 1.5
    }
  }

  function update() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy }
    snake.unshift(head)

    const ateFood = snake[0].x === food.x && snake[0].y === food.y
    if (ateFood) {
      score += 10
      scoreEl.textContent = `Score: ${score}`
      repositionFood()
      if (eatSound) eatSound.play().catch(() => {})
    } else {
      snake.pop()
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw food
    ctx.fillStyle = "red"
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize)

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "green" : "lime"
      ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize)
      ctx.strokeStyle = "black"
      ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize)
    })
  }

  function checkCollision() {
    const head = snake[0]

    // Check if snake hit the wall
    if (head.x < 0 || head.x >= canvas.width / gridSize || head.y < 0 || head.y >= canvas.height / gridSize) {
      return true
    }

    // Check if snake hit itself
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true
      }
    }

    return false
  }

  function reset() {
    snake = [{ x: 10, y: 10 }]
    dx = 1
    dy = 0
    score = 0
    scoreEl.textContent = `Score: ${score}`
    speed = baseSpeed
    repositionFood()
  }

  function repositionFood() {
    food = {
      x: Math.floor(Math.random() * (canvas.width / gridSize)),
      y: Math.floor(Math.random() * (canvas.height / gridSize)),
    }

    // Prevent food from spawning inside the snake
    while (snake.some((segment) => segment.x === food.x && segment.y === food.y)) {
      food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize)),
      }
    }
  }

  function gameLoop(currentTime) {
    if (gameOver) {
      if (dieSound) dieSound.play().catch(() => {})
      alert(`Game over! Your score was ${score}`)
      const currentHighScore = localStorage.getItem("highScore") || 0
      if (score > currentHighScore) {
        localStorage.setItem("highScore", score)
        highScoreEl.textContent = `High Score: ${score}`
      }
      reset()
      gameOver = false
      started = false
      if (startOvl) startOvl.classList.remove("hidden")
      return
    }

    if (paused) {
      animationFrameId = requestAnimationFrame(gameLoop)
      return
    }

    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000
    if (secondsSinceLastRender < 1 / (speed / 50)) {
      animationFrameId = requestAnimationFrame(gameLoop)
      return
    }

    lastRenderTime = currentTime

    update()
    if (checkCollision()) {
      gameOver = true
    }
    draw()

    animationFrameId = requestAnimationFrame(gameLoop)
  }

  function loop(currentTime) {
    gameLoop(currentTime)
  }

  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowUp":
        if (dy !== 1) {
          dx = 0
          dy = -1
        }
        break
      case "ArrowDown":
        if (dy !== -1) {
          dx = 0
          dy = 1
        }
        break
      case "ArrowLeft":
        if (dx !== 1) {
          dx = -1
          dy = 0
        }
        break
      case "ArrowRight":
        if (dx !== -1) {
          dx = 1
          dy = 0
        }
        break
      case " ": // Spacebar to increase speed
        speed = baseSpeed * 2
        setTimeout(() => {
          speed = baseSpeed
        }, 300)
        break
      case "p": // Pause
        paused = !paused
        if (ui.status) ui.status.textContent = paused ? "Paused" : "Running"
        if (music) {
          paused ? music.pause() : music.play().catch(() => {})
        }
        break
    }
  })

  // Tap to pause (for mobile)
  canvas.addEventListener("click", (e) => {
    if (!started || gameOver) return

    // Only toggle pause if it's a simple tap (not a swipe)
    if (Math.abs(touchEndX - touchStartX) < 10 && Math.abs(touchEndY - touchStartY) < 10) {
      paused = !paused
      if (ui.status) ui.status.textContent = paused ? "Paused" : "Running"
      if (music) {
        paused ? music.pause() : music.play().catch(() => {})
      }
    }
  })

  if (btnPlay) {
    btnPlay.addEventListener("click", () => {
      initAudio()
      initTouchControls()
      started = true
      if (startOvl) startOvl.classList.add("hidden")
      if (music) music.play().catch(() => {})
      animationFrameId = requestAnimationFrame(loop)
    })
  }

  function handleResize() {
    canvas.width = window.innerWidth - 20
    canvas.height = window.innerHeight - 100
    gridSize = Math.min(Math.floor(canvas.width / 30), Math.floor(canvas.height / 20))
    reset()
  }

  window.addEventListener("resize", handleResize)
  handleResize()

  function cleanup() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    window.removeEventListener("resize", handleResize)

    // Remove touch event listeners
    document.removeEventListener("touchstart", handleTouchStart)
    document.removeEventListener("touchmove", handleTouchMove)
    document.removeEventListener("touchend", handleTouchEnd)

    if (joystickBase) {
      joystickBase.removeEventListener("touchstart", handleJoystickStart)
      joystickBase.removeEventListener("touchmove", handleJoystickMove)
      joystickBase.removeEventListener("touchend", handleJoystickEnd)
    }

    if (music) {
      music.pause()
      music.src = ""
    }
  }

  window.addEventListener("beforeunload", cleanup)
})
