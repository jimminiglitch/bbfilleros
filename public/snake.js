window.addEventListener("load", () => {
  const canvas = document.getElementById("snake-canvas")
  const ctx = canvas.getContext("2d")
  const scoreEl = document.getElementById("snake-score")
  const levelEl = document.getElementById("snake-level")
  const bestEl = document.getElementById("snake-best")
  const statusEl = document.getElementById("snake-status")
  const startOvl = document.getElementById("start-overlay")
  const gameOverOvl = document.getElementById("game-over-overlay")
  const btnPlay = document.getElementById("snake-play-button")
  const btnSubmit = document.getElementById("submit-score")
  const inpName = document.getElementById("name-input")
  const elFinalScore = document.getElementById("final-score")
  const lstHighScores = document.getElementById("high-scores-list")
  const btnAgain = document.getElementById("play-again-button")
  const music = document.getElementById("snake-music")
  const btnMute = document.getElementById("mute-button")
  const joystickBase = document.getElementById("joystick-base")
  const joystickStick = document.getElementById("joystick-stick")
  const powerUpIndicators = document.getElementById("power-up-indicators")
  const livesIndicator = document.getElementById("lives-indicator")
  const livesIcons = document.getElementById("lives-icons")

  // ─── Touch controls variables ───────────────────────────────────────────────
  let touchStartX = 0
  let touchStartY = 0
  let touchEndX = 0
  let touchEndY = 0
  let joystickActive = false
  let joystickAngle = 0

  // ─── Game state variables ───────────────────────────────────────────────────
  let keyHoldTime = 0
  let lastKeyDirection = null
  let maxTrailLength = 50
  let trailIntensity = 0.2
  let lives = 0
  const MAX_LIVES = 5

  // ─── WebAudio for SFX ───────────────────────────────────────────────────────
  let audioCtx
  let eatBuf, powerBuf, shieldBuf, deathBuf

  // Sound URLs provided by the user
  const eatURL =
    "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/power-up-type-1-230548.mp3?v=1746542171704"
  const powerURL = "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/coin-upaif-14631.mp3?v=1746542174524"
  const deathURL =
    "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/cartoon-slide-whistle-down-2-176648.mp3?v=1746647880281"
  // Using the power-up sound for shield as well
  const shieldURL =
    "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/coin-upaif-14631.mp3?v=1746542174524"

  // Initialize audio context on user interaction to avoid autoplay restrictions
  function initAudio() {
    if (audioCtx) return

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()

      async function loadSound(url) {
        try {
          const res = await fetch(url)
          const arr = await res.arrayBuffer()
          return audioCtx.decodeAudioData(arr)
        } catch (err) {
          console.error("Error loading sound:", err)
          return null
        }
      }

      Promise.all([loadSound(eatURL), loadSound(powerURL), loadSound(shieldURL), loadSound(deathURL)])
        .then(([e, p, s, d]) => {
          eatBuf = e
          powerBuf = p
          shieldBuf = s
          deathBuf = d
          console.log("All sounds loaded successfully")
        })
        .catch((err) => console.error("Error loading sounds:", err))
    } catch (err) {
      console.error("WebAudio not supported:", err)
    }
  }

  function playSFX(buf) {
    if (!audioCtx || !buf) return
    try {
      const src = audioCtx.createBufferSource()
      src.buffer = buf
      src.connect(audioCtx.destination)
      src.start()
    } catch (err) {
      console.error("Error playing sound:", err)
    }
  }

  // ─── Lives Indicator ───────────────────────────────────────────────────────
  function updateLivesIndicator() {
    if (!livesIcons) return

    // Clear existing icons
    livesIcons.innerHTML = ""

    // Create icons for lives
    for (let i = 0; i < lives; i++) {
      const icon = document.createElement("div")
      icon.className = "life-icon"
      livesIcons.appendChild(icon)
    }

    // Show/hide the indicator based on lives
    if (livesIndicator) {
      livesIndicator.style.display = lives > 0 ? "flex" : "none"
    }
  }

  // ─── Power-up Indicators ───────────────────────────────────────────────────
  function updatePowerUpIndicators() {
    if (!powerUpIndicators) return

    // Clear existing indicators
    powerUpIndicators.innerHTML = ""

    // Create indicator for level
    const indicator = document.createElement("div")
    indicator.className = "power-up-indicator power-level"

    const icon = document.createElement("div")
    icon.className = "power-up-icon"
    icon.textContent = "L"
    icon.style.background = "var(--neon-cyan)"
    icon.style.color = "black"

    const name = document.createElement("span")
    name.textContent = `LEVEL ${level} (x${level} POINTS)`

    indicator.appendChild(icon)
    indicator.appendChild(name)
    powerUpIndicators.appendChild(indicator)
  }

  // Listen for messages from the parent window
  window.addEventListener("message", (event) => {
    if (event.data === "pause" && !paused && started) {
      // Pause the game
      paused = true
      if (statusEl) statusEl.textContent = "Paused"
      if (music) music.pause()
    }
  })

  // ─── Pause music when tab hidden ───────────────────────────────────────────
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (music) music.pause()
      // Don't pause the game automatically when in an iframe
      // as it might be due to the window being minimized
    } else if (started && !paused && !gameOver) {
      if (music) music.play().catch(() => {})
    }
  })

  // ─── Touch Controls ─────────────────────────────────────────────────────────
  function initTouchControls() {
    // Show joystick on mobile devices
    if (isMobileDevice()) {
      if (joystickBase && joystickBase.parentElement) {
        joystickBase.parentElement.style.display = "block"
      }
    }

    // Swipe detection
    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: true })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })

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
  }

  function handleTouchMove(e) {
    if (!started || gameOver || paused || joystickActive) return
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
    }
  }

  // ─── Starfield ──────────────────────────────────────────────────────────────
  let stars = []
  const STAR_COUNT = 175
  function initStars() {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * canvas.width,
      o: Math.random(),
    }))
  }
  function drawStars() {
    // slight motion-blur
    ctx.fillStyle = "rgba(0,0,0,1)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (const s of stars) {
      // twinkle
      s.o += (Math.random() - 0.5) * 0.02
      s.o = Math.max(0.1, Math.min(1, s.o))

      s.z -= 2
      if (s.z <= 0) {
        s.z = canvas.width
        s.x = Math.random() * canvas.width
        s.y = Math.random() * canvas.height
        s.o = Math.random()
      }
      const k = 128.0 / s.z
      const px = (s.x - canvas.width / 2) * k + canvas.width / 2
      const py = (s.y - canvas.height / 2) * k + canvas.height / 2
      const sz = Math.max(0.5, (1 - s.z / canvas.width) * 2) // HALF as big as before

      ctx.globalAlpha = s.o
      ctx.fillStyle = "#fff"
      ctx.beginPath()
      ctx.arc(px, py, sz, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // ─── Game state ─────────────────────────────────────────────────────────────
  const GRID = 20
  let cols, rows
  let snake, dx, dy, apple
  let baseSpeed, speed, score, level, best
  let paused = false,
    gameOver = false,
    started = false,
    hueOffset = 0
  let powerUps = [],
    particles = [],
    trail = []
  let frameAcc = 0,
    lastTime = 0
  let animationFrameId = null

  const HS_KEY = "snakeHighScores"
  const MAX_HS = 7
  const POWER_DEF = {
    GROW: { color: "var(--neon-green)", effect: "grow", value: 3, pts: 33 },
    LEVEL: { color: "var(--neon-cyan)", effect: "level", value: 1.1, pts: 30 }, // Changed from SPEED to LEVEL
    SHIELD: { color: "var(--neon-yellow)", effect: "shield", value: 1, pts: 25 },
  }
  const MAX_TRAIL = 100 // Increased for longer trails

  // ─── High-score helpers ────────────────────────────────────────────────────
  function loadHS() {
    try {
      const j = localStorage.getItem(HS_KEY)
      return j ? JSON.parse(j) : []
    } catch (err) {
      console.error("Error loading high scores:", err)
      return []
    }
  }
  function saveHS(list) {
    try {
      localStorage.setItem(HS_KEY, JSON.stringify(list))
    } catch (err) {
      console.error("Error saving high scores:", err)
    }
  }
  function drawHS() {
    if (!lstHighScores) return
    lstHighScores.innerHTML = loadHS()
      .map((h) => `<li>${h.name}: ${h.score}</li>`)
      .join("")
  }
  function addHS(name, val) {
    const l = loadHS()
    l.push({ name, score: val })
    l.sort((a, b) => b.score - a.score)
    saveHS(l.slice(0, MAX_HS))
  }

  // ─── Game helpers ──────────────────────────────────────────────────────────
  function placeApple() {
    if (!cols || !rows) return

    do {
      apple = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      }
    } while (
      snake.some((s) => s.x === apple.x && s.y === apple.y) ||
      powerUps.some((p) => p.x === apple.x && p.y === apple.y)
    )
  }
  function createPU() {
    if (!cols || !rows) return

    // Determine which power-ups are available
    const availableTypes = []

    // Always allow GROW
    availableTypes.push("GROW")

    // Always allow LEVEL (renamed from SPEED)
    availableTypes.push("LEVEL")

    // Only allow SHIELD if not at max lives
    if (lives < MAX_LIVES) {
      availableTypes.push("SHIELD")
    }

    // If no power-ups are available, don't create one
    if (availableTypes.length === 0) return

    const t = availableTypes[Math.floor(Math.random() * availableTypes.length)]
    const d = POWER_DEF[t]

    // Find a valid position
    let x, y
    let validPosition = false
    let attempts = 0

    while (!validPosition && attempts < 50) {
      x = Math.floor(Math.random() * cols)
      y = Math.floor(Math.random() * rows)

      validPosition =
        !snake.some((s) => s.x === x && s.y === y) &&
        !powerUps.some((p) => p.x === x && p.y === y) &&
        !(apple && apple.x === x && apple.y === y)

      attempts++
    }

    if (validPosition) {
      powerUps.push({
        x,
        y,
        type: t,
        color: d.color,
        angle: Math.random() * Math.PI * 2, // Random starting angle for rotation
      })
    }
  }
  function createParticle(x, y, color) {
    particles.push({
      x: x * GRID + GRID / 2,
      y: y * GRID + GRID / 2,
      size: Math.random() * 3 + 1, // smaller
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      color,
      alpha: 1,
    })
  }
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.alpha -= 0.02
      if (p.alpha <= 0) particles.splice(i, 1)
    }
  }
  function applyPU(pu) {
    const d = POWER_DEF[pu.type]

    // Award points with level multiplier
    const pointsAwarded = d.pts * level
    score += pointsAwarded

    if (scoreEl) scoreEl.textContent = `Score: ${score}`
    if (score > best) {
      best = score
      if (bestEl) bestEl.textContent = `Best: ${best}`
    }

    switch (d.effect) {
      case "level":
        // Level up - slightly increase speed
        level++
        baseSpeed *= d.value // Small speed increase (10%)
        speed = baseSpeed
        if (levelEl) levelEl.textContent = `Level: ${level}`
        createParticle(snake[0].x, snake[0].y, d.color)
        playSFX(powerBuf)
        break
      case "grow":
        for (let i = 0; i < d.value; i++) {
          const tail = snake[snake.length - 1]
          snake.push({ x: tail.x, y: tail.y })
        }
        createParticle(snake[0].x, snake[0].y, d.color)
        playSFX(eatBuf)
        break
      case "shield":
        if (lives < MAX_LIVES) {
          lives++
          updateLivesIndicator()
          createParticle(snake[0].x, snake[0].y, d.color)
          playSFX(shieldBuf)
        }
        break
    }

    // Update the indicators
    updatePowerUpIndicators()
  }

  // ─── Update & draw ─────────────────────────────────────────────────────────
  function update(dt) {
    if (!started || paused || gameOver) return
    frameAcc += dt
    if (frameAcc < 1000 / speed) return
    frameAcc = 0

    // Handle key holding speed boost - reduced to a gentler boost
    if (
      lastKeyDirection &&
      ((lastKeyDirection === "ArrowUp" && dy === -1) ||
        (lastKeyDirection === "ArrowDown" && dy === 1) ||
        (lastKeyDirection === "ArrowLeft" && dx === -1) ||
        (lastKeyDirection === "ArrowRight" && dx === 1))
    ) {
      keyHoldTime += dt
      // Gentler speed boost - max 20% increase after 1 second
      const holdBoost = Math.min(1.2, 1 + (keyHoldTime / 1000) * 0.2)
      speed = baseSpeed * holdBoost
    } else {
      keyHoldTime = 0
      speed = baseSpeed
    }

    // Update power-up indicators
    updatePowerUpIndicators()

    // Random chance to spawn a power-up
    if (Math.random() < 0.005) createPU()

    const head = { x: snake[0].x + dx, y: snake[0].y + dy }
    snake.unshift(head)

    trail.unshift({ x: head.x, y: head.y, t: Date.now() })
    // Keep more trail points when moving faster
    const currentTrailLength = Math.min(MAX_TRAIL, 50 + (speed - baseSpeed) * 20)
    while (trail.length > currentTrailLength) trail.pop()

    // Check for power-up collisions
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (head.x === powerUps[i].x && head.y === powerUps[i].y) {
        applyPU(powerUps[i])
        powerUps.splice(i, 1)
      }
    }

    // Check for apple collision
    if (head.x === apple.x && head.y === apple.y) {
      playSFX(eatBuf)
      // Apply level multiplier to apple points
      const applePoints = 10 * level
      score += applePoints
      if (scoreEl) scoreEl.textContent = `Score: ${score}`
      if (score > best) {
        best = score
        if (bestEl) bestEl.textContent = `Best: ${best}`
      }
      for (let i = 0; i < 8; i++) createParticle(apple.x, apple.y, "magenta")
      if (score % 50 === 0) {
        // Level up on score milestones too
        level++
        baseSpeed *= 1.05 // Small speed increase (5%)
        if (levelEl) levelEl.textContent = `Level: ${level}`
        updatePowerUpIndicators()
        for (let i = 0; i < 8; i++) createParticle(head.x, head.y, "cyan")
      }
      placeApple()
    } else {
      snake.pop()
    }

    // Check for collisions
    const hitWall = head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows
    const hitSelf = snake.slice(1).some((s) => s.x === head.x && s.y === head.y)

    if (hitWall || hitSelf) {
      if (lives > 0) {
        // Use a shield/life
        lives--
        updateLivesIndicator()
        playSFX(shieldBuf)

        // Create shield particles
        for (let i = 0; i < 10; i++) {
          createParticle(head.x, head.y, "var(--neon-yellow)")
        }

        // Temporarily pause to show the shield effect
        paused = true
        setTimeout(() => {
          paused = false
        }, 500)
      } else {
        // Game over
        gameOver = true
        if (statusEl) statusEl.textContent = "Game Over"
        if (elFinalScore) elFinalScore.textContent = `Your score: ${score}`
        if (gameOverOvl) gameOverOvl.classList.remove("hidden")
        if (music) {
          music.pause()
          music.currentTime = 0
        }
        playSFX(deathBuf)
        for (let i = 0; i < 20; i++) createParticle(head.x, head.y, "red")
      }
    }
  }

  function draw() {
    if (!started || !ctx) return
    drawStars()

    // trails (more vibrant)
    const S = GRID - 2,
      O = 1
    trail.forEach((pt, idx) => {
      const age = Date.now() - pt.t
      const a = Math.max(0, 1 - age / 1000) * trailIntensity * 2 // Double the intensity
      ctx.fillStyle = `hsla(${(hueOffset + idx * 20) % 360},100%,50%,${a})`
      ctx.fillRect(pt.x * GRID + O, pt.y * GRID + O, S, S)
    })

    // power-ups (as spheres)
    powerUps.forEach((pu) => {
      try {
        // Update rotation angle
        pu.angle = (pu.angle + 0.05) % (Math.PI * 2)

        // Draw power-up as a sphere
        const x = pu.x * GRID + GRID / 2
        const y = pu.y * GRID + GRID / 2
        const radius = GRID / 2 - 2

        // Create gradient for 3D effect
        const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 10, x, y, radius)

        // Get base color
        const baseColor = pu.color

        // Add gradient stops for 3D effect
        gradient.addColorStop(0, "white")
        gradient.addColorStop(0.3, baseColor)
        gradient.addColorStop(1, "rgba(0,0,0,0.5)")

        // Draw the sphere
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()

        // Add highlight
        ctx.fillStyle = "rgba(255,255,255,0.7)"
        ctx.beginPath()
        ctx.arc(x - radius / 3, y - radius / 3, radius / 4, 0, Math.PI * 2)
        ctx.fill()

        // Add letter indicator
        ctx.fillStyle = "black"
        ctx.font = "bold 10px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        let icon = "?"
        switch (pu.type) {
          case "LEVEL":
            icon = "L"
            break
          case "GROW":
            icon = "G"
            break
          case "SHIELD":
            icon = "S"
            break
        }

        ctx.fillText(icon, x, y)
      } catch (err) {
        console.error("Error drawing power-up:", err)
      }
    })

    // apple (as a sphere)
    if (apple) {
      try {
        const pulse = Math.sin(Date.now() / 300) * 6
        const x = apple.x * GRID + GRID / 2
        const y = apple.y * GRID + GRID / 2
        const radius = GRID / 2 - 2

        // Create gradient for 3D effect
        const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 10, x, y, radius)

        // Add gradient stops for 3D effect with pulsing
        gradient.addColorStop(0, "white")
        gradient.addColorStop(0.3, `hsl(300,100%,${50 + pulse}%)`)
        gradient.addColorStop(1, "rgba(0,0,0,0.5)")

        // Draw the sphere
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()

        // Add highlight
        ctx.fillStyle = "rgba(255,255,255,0.7)"
        ctx.beginPath()
        ctx.arc(x - radius / 3, y - radius / 3, radius / 4, 0, Math.PI * 2)
        ctx.fill()
      } catch (err) {
        console.error("Error drawing apple:", err)
      }
    }

    // snake (smaller)
    snake.forEach((seg, i) => {
      const hue = (hueOffset + i * 10 + level * 20) % 360
      ctx.fillStyle = `hsl(${hue},100%,50%)`
      ctx.fillRect(seg.x * GRID + 3, seg.y * GRID + 3, GRID - 6, GRID - 6)
    })

    // particles
    particles.forEach((p) => {
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI)
      ctx.fill()
    })
    ctx.globalAlpha = 1

    hueOffset = (hueOffset + 1 + level) % 360
  }

  function loop(ts) {
    if (!lastTime) lastTime = ts
    const dt = ts - lastTime
    lastTime = ts
    update(dt)
    draw()
    updateParticles()
    animationFrameId = requestAnimationFrame(loop)
  }

  // ─── Controls/UI ───────────────────────────────────────────────────────────
  function resetGame() {
    if (music) {
      music.pause()
      music.currentTime = 0
    }

    // Cancel any existing animation frame
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    // Reset canvas dimensions
    if (canvas) {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }

    cols = (canvas && Math.floor(canvas.width / GRID)) || 0
    rows = (canvas && Math.floor(canvas.height / GRID)) || 0

    snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }]
    dx = 1
    dy = 0
    baseSpeed = 5
    speed = baseSpeed
    score = 0
    level = 1
    paused = false
    gameOver = false
    started = false
    hueOffset = 0
    powerUps = []
    particles = []
    trail = []
    keyHoldTime = 0
    lastKeyDirection = null
    maxTrailLength = 50
    trailIntensity = 0.2
    lives = 0

    if (scoreEl) scoreEl.textContent = "Score: 0"
    if (levelEl) levelEl.textContent = "Level: 1"

    best = (loadHS()[0] || { score: 0 }).score
    if (bestEl) bestEl.textContent = `Best: ${best}`
    if (statusEl) statusEl.textContent = "Running"

    if (startOvl) startOvl.classList.remove("hidden")
    if (gameOverOvl) gameOverOvl.classList.add("hidden")

    // Clear power-up indicators
    if (powerUpIndicators) powerUpIndicators.innerHTML = ""

    // Update lives indicator
    updateLivesIndicator()

    drawHS()
    placeApple()
    initStars()
  }

  // Handle window resize
  function handleResize() {
    if (!canvas) return

    // Store current game state
    const wasStarted = started
    const wasPaused = paused
    const oldCols = cols
    const oldRows = rows

    // Pause game during resize
    const tempPaused = paused
    paused = true

    // Resize canvas
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    // Recalculate grid
    cols = Math.floor(canvas.width / GRID)
    rows = Math.floor(canvas.height / GRID)

    // Reinitialize stars
    initStars()

    // Ensure apple is within bounds
    if (apple && (apple.x >= cols || apple.y >= rows)) {
      placeApple()
    }

    // Ensure snake is within bounds
    snake = snake.map((segment) => ({
      x: Math.min(segment.x, cols - 1),
      y: Math.min(segment.y, rows - 1),
    }))

    // Resume game if it was running
    if (wasStarted) {
      paused = tempPaused
    }
  }

  // Add resize event listener
  window.addEventListener("resize", handleResize)

  // Event listeners
  if (btnPlay) {
    btnPlay.addEventListener("click", () => {
      initAudio()
      initTouchControls() // Initialize touch controls
      started = true
      if (startOvl) startOvl.classList.add("hidden")

      // Fix for music not playing
      if (music) {
        // Make sure the music is loaded
        if (music.readyState < 2) {
          music.load()
        }

        // Try to play with a user gesture
        const playPromise = music.play()

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Music autoplay prevented:", error)
            // Show a message to the user that they need to interact with the page
            if (statusEl) statusEl.textContent = "Click for music"

            // Add a one-time click handler to start music
            const startMusic = () => {
              music.play().catch((e) => console.log("Still can't play music:", e))
              document.removeEventListener("click", startMusic)
              if (statusEl) statusEl.textContent = "Running"
            }
            document.addEventListener("click", startMusic)
          })
        }
      }

      animationFrameId = requestAnimationFrame(loop)
    })
  }

  if (btnSubmit) {
    btnSubmit.addEventListener("click", () => {
      const n = (inpName && inpName.value.trim()) || "ANON"
      addHS(n, score)
      drawHS()
      if (btnSubmit) btnSubmit.disabled = true
      if (inpName) inpName.disabled = true
    })
  }

  if (btnAgain) {
    btnAgain.addEventListener("click", () => {
      resetGame()
      if (btnSubmit) btnSubmit.disabled = false
      if (inpName) {
        inpName.disabled = false
        inpName.value = ""
      }
      if (music) {
        music.pause()
        music.currentTime = 0
      }
      if (btnPlay) btnPlay.click()
    })
  }

  // keyboard
  window.addEventListener("keydown", (e) => {
    if (!started) return
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault()
    if (e.key === " ") {
      paused = !paused
      if (statusEl) statusEl.textContent = paused ? "Paused" : "Running"
      if (music) {
        paused ? music.pause() : music.play().catch(() => {})
      }
      return
    }
    if (paused || gameOver) return
    switch (e.key) {
      case "ArrowUp":
        if (dy === 0) {
          dx = 0
          dy = -1
        }
        break
      case "ArrowDown":
        if (dy === 0) {
          dx = 0
          dy = 1
        }
        break
      case "ArrowLeft":
        if (dx === 0) {
          dx = -1
          dy = 0
        }
        break
      case "ArrowRight":
        if (dx === 0) {
          dx = 1
          dy = 0
        }
        break
    }

    // Track the last key direction for speed boost
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      lastKeyDirection = e.key
    }
  })

  // Tap to pause
  canvas.addEventListener("click", (e) => {
    if (!started || gameOver) return

    // Only toggle pause if it's a simple tap (not a swipe)
    if (Math.abs(touchEndX - touchStartX) < 10 && Math.abs(touchEndY - touchStartY) < 10) {
      paused = !paused
      if (statusEl) statusEl.textContent = paused ? "Paused" : "Running"
      if (music) {
        paused ? music.pause() : music.play().catch(() => {})
      }
    }
  })

  // mute
  if (btnMute) {
    btnMute.addEventListener("click", () => {
      if (!music) return
      music.muted = !music.muted
      btnMute.textContent = music.muted ? "🔇" : "🔊"
    })
  }

  // Cleanup function to prevent memory leaks
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

  // Handle iframe unload
  window.addEventListener("beforeunload", cleanup)

  // Initialize the game
  if (canvas) {
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
  }
  resetGame()
})
