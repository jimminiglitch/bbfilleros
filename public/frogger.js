(function() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const startScreen = document.getElementById('start-screen');
  const scoreElement = document.querySelector('.score');
  const livesElement = document.querySelector('.lives');
  const backgroundMusic = document.getElementById('background-music');
  const jumpSound = document.getElementById('jump-sound');
  const hitSound = document.getElementById('hit-sound');

  const GRID = 40;
  const LANE_HEIGHT = GRID * 2;
  const NUM_LANES = 8;
  const NUM_LOGS = 5;
  const NUM_CARS = 5;
  const NUM_HOMES = 5;

  let frog, cars, logs, homes;
  let score = 0;
  let lives = 3;
  let gameStarted = false;
  let gamePaused = false;
  let particles = [];
  let powerUps = [];

  // Power-up types
  const POWER_UPS = {
    SPEED: { color: 'cyan', effect: 'speed', duration: 5000, value: 2 },
    INVINCIBLE: { color: 'yellow', effect: 'invincible', duration: 5000, value: 1 }
  };

  class Frog {
    constructor() {
      this.x = canvas.width / 2;
      this.y = canvas.height - GRID;
      this.width = GRID;
      this.height = GRID;
      this.speed = GRID;
      this.invincible = false;
      this.invincibleTime = 0;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x + this.width/2, this.y + this.height/2);
      ctx.rotate(this.angle);
      ctx.translate(-(this.x + this.width/2), -(this.y + this.height/2));

      // Draw frog with pulsing effect
      const pulse = Math.sin(Date.now() / 500) * 10 + 100;
      ctx.fillStyle = `hsl(${pulse}, 100%, 50%)`;
      ctx.beginPath();
      ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    move(dx, dy) {
      if (this.y + dy < 0 || this.y + dy > canvas.height - this.height) return;
      this.x += dx;
      this.y += dy;
      jumpSound.play();
    }
  }

  class Car {
    constructor(x, y, speed) {
      this.x = x;
      this.y = y;
      this.width = GRID * 2;
      this.height = GRID;
      this.speed = speed;
      this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    }

    update() {
      this.x += this.speed;
      if (this.x < -this.width || this.x > canvas.width) {
        this.x = this.speed > 0 ? -this.width : canvas.width;
      }
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  class Log {
    constructor(x, y, speed) {
      this.x = x;
      this.y = y;
      this.width = GRID * 3;
      this.height = GRID;
      this.speed = speed;
      this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    }

    update() {
      this.x += this.speed;
      if (this.x < -this.width || this.x > canvas.width) {
        this.x = this.speed > 0 ? -this.width : canvas.width;
      }
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  class Home {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = GRID;
            this.width = GRID;
      this.height = GRID;
      this.occupied = false;
      this.color = 'rgba(0, 255, 0, 0.5)';
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  function initializeGame() {
    frog = new Frog();
    cars = [];
    logs = [];
    homes = [];
    particles = [];
    powerUps = [];
    score = 0;
    lives = 3;
    scoreElement.textContent = `Score: ${score}`;
    livesElement.textContent = `Lives: ${lives}`;
    startScreen.style.display = 'none';

    // Create lanes
    for (let i = 0; i < NUM_LANES; i++) {
      const y = i * LANE_HEIGHT;
      if (i < NUM_LANES / 2) {
        // Create cars
        for (let j = 0; j < NUM_CARS; j++) {
          const x = Math.random() * canvas.width;
          const speed = (i % 2 === 0 ? 1 : -1) * (i + 1) * 2;
          cars.push(new Car(x, y, speed));
        }
      } else {
        // Create logs
        for (let j = 0; j < NUM_LOGS; j++) {
          const x = Math.random() * canvas.width;
          const speed = (i % 2 === 0 ? 1 : -1) * (i + 1) * 2;
          logs.push(new Log(x, y, speed));
        }
      }
    }

    // Create homes
    for (let i = 0; i < NUM_HOMES; i++) {
      const x = i * (canvas.width / NUM_HOMES);
      const y = 0;
      homes.push(new Home(x, y));
    }
  }

  function update() {
    if (gamePaused) return;

    // Update cars and logs
    cars.forEach(car => car.update());
    logs.forEach(log => log.update());

    // Update power-ups
    powerUps.forEach((powerUp, i) => {
      if (Date.now() - powerUp.startTime > powerUp.duration) {
        powerUps.splice(i, 1);
      }
    });

    // Check for power-up collisions
    powerUps.forEach((powerUp, i) => {
      if (frog.x < powerUp.x + GRID && 
          frog.x + GRID > powerUp.x &&
          frog.y < powerUp.y + GRID &&
          frog.y + GRID > powerUp.y) {
        applyPowerUp(powerUp);
        powerUps.splice(i, 1);
      }
    });

    // Check for car collisions
    cars.forEach(car => {
      if (frog.x < car.x + car.width && 
          frog.x + frog.width > car.x &&
          frog.y < car.y + car.height &&
          frog.y + frog.height > car.y) {
        if (!frog.invincible) {
          hitSound.play();
          lives--;
          livesElement.textContent = `Lives: ${lives}`;
          if (lives <= 0) {
            gameOver();
          } else {
            resetFrog();
          }
        }
      }
    });

    // Check for log collisions and movement
    let onLog = false;
    logs.forEach(log => {
      if (frog.x < log.x + log.width && 
          frog.x + frog.width > log.x &&
          frog.y < log.y + log.height &&
          frog.y + frog.height > log.y) {
        onLog = true;
        frog.x += log.speed;
      }
    });

    // If not on log, check for water collision
    if (!onLog && frog.y < canvas.height / 2) {
      if (!frog.invincible) {
        hitSound.play();
        lives--;
        livesElement.textContent = `Lives: ${lives}`;
        if (lives <= 0) {
          gameOver();
        } else {
          resetFrog();
        }
      }
    }

    // Check for home collisions
    homes.forEach(home => {
      if (!home.occupied && 
          frog.x < home.x + home.width && 
          frog.x + frog.width > home.x &&
          frog.y < home.y + home.height &&
          frog.y + frog.height > home.y) {
        score += 100;
        scoreElement.textContent = `Score: ${score}`;
        home.occupied = true;
        createParticle(frog.x, frog.y, 'green');
        resetFrog();
      }
    });
  }

  function draw() {
    // Clear canvas with gradient
    ctx.save();
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0,0,0,0.9)');
    gradient.addColorStop(0.5, 'rgba(255,0,255,0.1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw lanes
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < NUM_LANES; i++) {
      const y = i * LANE_HEIGHT;
      ctx.fillRect(0, y, canvas.width, 2);
    }

    // Draw cars
    cars.forEach(car => car.draw());

    // Draw logs
    logs.forEach(log => log.draw());

    // Draw homes
    homes.forEach(home => home.draw());

    // Draw power-ups
    powerUps.forEach(powerUp => {
      ctx.fillStyle = powerUp.color;
      ctx.fillRect(powerUp.x, powerUp.y, GRID, GRID);
      ctx.font = '10px Press Start 2P';
      ctx.fillStyle = 'black';
      ctx.fillText(powerUp.type[0], powerUp.x + 2, powerUp.y + 15);
    });

    // Draw frog
    frog.draw();

    // Draw particles
    particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
      ctx.fill();
    });

    // Draw game over screen if needed
    if (lives <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'var(--neon-cyan)';
      ctx.font = '30px Press Start 2P';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
      ctx.font = '15px Press Start 2P';
      ctx.fillText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 40);
    }
  }

  function createParticle(x, y, color) {
    const particle = {
      x: x + GRID/2,
      y: y + GRID/2,
      size: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      color: color,
      alpha: 1
    };
    particles.push(particle);
  }

  function applyPowerUp(powerUp) {
    const effect = POWER_UPS[powerUp.type];
    switch(effect.effect) {
      case 'speed':
        frog.speed += effect.value;
        createParticle(frog.x, frog.y, 'cyan');
        break;
      case 'invincible':
        frog.invincible = true;
              case 'invincible':
        frog.invincible = true;
        frog.invincibleTime = Date.now();
        createParticle(frog.x, frog.y, 'yellow');
        break;
    }
  }

  function resetFrog() {
    frog.x = canvas.width / 2;
    frog.y = canvas.height - GRID;
    frog.speed = GRID;
    frog.invincible = false;
    frog.invincibleTime = 0;
  }

  function gameOver() {
    gamePaused = true;
    backgroundMusic.muted = true;
    createParticle(frog.x, frog.y, 'red');
  }

  function resetGame() {
    gameStarted = false;
    gamePaused = false;
    backgroundMusic.currentTime = 0;
    backgroundMusic.muted = false;
    backgroundMusic.play().catch(() => {});
    initializeGame();
    startScreen.style.display = 'block';
  }

  function startGame() {
    if (!gameStarted) {
      gameStarted = true;
      startScreen.style.display = 'none';
      backgroundMusic.play().catch(() => {});
      window.requestAnimationFrame(gameLoop);
    }
  }

  function gameLoop() {
    if (!gameStarted) return;
    update();
    draw();
    window.requestAnimationFrame(gameLoop);
  }

  // Event Listeners
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !gameStarted) {
      startGame();
    } else if (e.key === ' ' && lives <= 0) {
      resetGame();
    } else if (gameStarted && !gamePaused) {
      switch(e.key) {
        case 'ArrowUp':
          frog.move(0, -GRID);
          break;
        case 'ArrowDown':
          frog.move(0, GRID);
          break;
        case 'ArrowLeft':
          frog.move(-GRID, 0);
          break;
        case 'ArrowRight':
          frog.move(GRID, 0);
          break;
      }
    }
  });

  // Touch controls
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });

  canvas.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        frog.move(GRID, 0);
      } else {
        frog.move(-GRID, 0);
      }
    } else {
      if (diffY > 0) {
        frog.move(0, GRID);
      } else {
        frog.move(0, -GRID);
      }
    }
  });

  // Initialize game
  canvas.width = 800;
  canvas.height = 600;
  initializeGame();
})();