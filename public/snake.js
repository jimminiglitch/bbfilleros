(function() {
  const canvas = document.getElementById('snake-canvas');
  const ctx = canvas.getContext('2d');
  const ui = {
    score: document.getElementById('snake-score'),
    level: document.getElementById('snake-level'),
    best: document.getElementById('snake-best'),
    status: document.getElementById('snake-status'),
  };
  const music = document.getElementById('snake-music');
  const eatSound = document.getElementById('eat-sound');
  const powerUpSound = document.getElementById('power-up-sound');
  const playButton = document.getElementById('snake-play-button');

  const GRID = 20;
  let cols, rows, snake, dx, dy, apple, hueOffset;
  let lastTime = 0, speed = 5, frameAcc = 0;
  let score = 0, level = 1, best = 0;
  let paused = false, gameOver = false, started = false;
  let powerUps = [];
  let particles = [];
  let particleCount = 0;
  let screenShake = 0;

  // Power-up types
  const POWER_UPS = {
    SPEED: { color: 'cyan', effect: 'speed', duration: 5000, value: 2 },
    GROW: { color: 'magenta', effect: 'grow', duration: 3000, value: 3 },
    INVINCIBLE: { color: 'yellow', effect: 'invincible', duration: 5000, value: 1 }
  };

  function placeApple() {
    do {
      apple = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
      };
    } while (snake.some(s => s.x === apple.x && s.y === apple.y) || 
             powerUps.some(p => p.x === apple.x && p.y === apple.y));
  }

  function createPowerUp() {
    const type = Object.keys(POWER_UPS)[Math.floor(Math.random() * Object.keys(POWER_UPS).length)];
    const powerUp = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
      type: type,
      color: POWER_UPS[type].color,
      duration: POWER_UPS[type].duration,
      startTime: Date.now()
    };
    powerUps.push(powerUp);
  }

  function createParticle(x, y, color) {
    const particle = {
      x: x * GRID + GRID/2,
      y: y * GRID + GRID/2,
      size: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      color: color,
      alpha: 1
    };
    particles.push(particle);
    particleCount++;
  }

  function updateParticles() {
    particles.forEach((particle, i) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha -= 0.02;
      
      if (particle.alpha <= 0) {
        particles.splice(i, 1);
      }
    });
  }

  function update(delta) {
    if (!started || paused || gameOver) return;
    frameAcc += delta;
    const interval = 1000 / (speed + level * 0.5);
    
    if (frameAcc < interval) return;
    frameAcc = 0;

    // Update power-ups
    powerUps.forEach((powerUp, i) => {
      if (Date.now() - powerUp.startTime > powerUp.duration) {
        powerUps.splice(i, 1);
      }
    });

    // Create new power-up periodically
    if (Math.random() < 0.01) {
      createPowerUp();
    }

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // Check power-up collision
    powerUps.forEach((powerUp, i) => {
      if (head.x === powerUp.x && head.y === powerUp.y) {
        powerUpSound.play();
        applyPowerUp(powerUp);
        powerUps.splice(i, 1);
      }
    });

    // eating
    if (head.x === apple.x && head.y === apple.y) {
      eatSound.play();
      score += 10;
      ui.score.textContent = `Score: ${score}`;
      if (score > best) {
        best = score;
        localStorage.setItem('snakeBest', best);
        ui.best.textContent = `Best: ${best}`;
      }
      createParticle(apple.x, apple.y, 'magenta');
      if (score % 50 === 0) {
        level++;
        ui.level.textContent = `Level: ${level}`;
        createParticle(snake[0].x, snake[0].y, 'cyan');
      }
      placeApple();
    } else {
      snake.pop();
    }

    // collision
    if (
      head.x < 0 || head.y < 0 ||
      head.x >= cols || head.y >= rows ||
      snake.slice(1).some(s => s.x === head.x && s.y === head.y)
    ) {
      gameOver = true;
      ui.status.textContent = 'Game Over';
      createParticle(head.x, head.y, 'red');
    }
  }

  function applyPowerUp(powerUp) {
    const effect = POWER_UPS[powerUp.type];
    switch(effect.effect) {
      case 'speed':
        spee
      d += effect.value;
      