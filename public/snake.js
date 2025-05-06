//─────────────────────────────────────────────────────────────────────────────
// snake.js
//─────────────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // Element refs
  // ──────────────────────────────────────────────────────────────────────────
  const startOverlay      = document.getElementById('start-overlay');
  const gameOverOverlay   = document.getElementById('game-over-overlay');
  const playButton        = document.getElementById('snake-play-button');
  const retryButton       = document.getElementById('retry-button');
  const finalScoreDisplay = document.getElementById('final-score');
  const difficultyMenu    = document.getElementById('difficulty-menu');
  const themeMenu         = document.getElementById('theme-menu');
  const muteButton        = document.getElementById('mute-button');
  const touchControls     = document.getElementById('touch-controls');
  const canvas            = document.getElementById('snake-canvas');
  const ctx               = canvas.getContext('2d');
  const ui = {
    score:  document.getElementById('snake-score'),
    level:  document.getElementById('snake-level'),
    best:   document.getElementById('snake-best'),
    status: document.getElementById('snake-status'),
  };
  const music        = document.getElementById('snake-music');
  const eatSound     = document.getElementById('eat-sound');
  const powerUpSound = document.getElementById('power-up-sound');

  // ──────────────────────────────────────────────────────────────────────────
  // State variables
  // ──────────────────────────────────────────────────────────────────────────
  const GRID = 20;
  let cols, rows;
  let snake, dx, dy, apple;
  let speed, score, level, best;
  let paused, gameOver, started, hueOffset, screenShake;
  let powerUps, particles;
  let frameAcc = 0, lastTime = 0;
  let selectedSpeed = 5, selectedTheme = 'cyberpunk';

  const POWER_UPS = {
    SPEED:      { color: 'cyan',    effect: 'speed',      duration: 5000, value: 2 },
    GROW:       { color: 'magenta', effect: 'grow',       duration: 3000, value: 3 },
    INVINCIBLE: { color: 'yellow',  effect: 'invincible', duration: 5000, value: 0 }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────────
  function placeApple() {
    do {
      apple = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
      };
    } while (
      snake.some(s => s.x === apple.x && s.y === apple.y) ||
      powerUps.some(p => p.x === apple.x && p.y === apple.y)
    );
  }

  function createPowerUp() {
    const types = Object.keys(POWER_UPS);
    const type  = types[Math.floor(Math.random() * types.length)];
    const def   = POWER_UPS[type];
    powerUps.push({
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
      type,
      color: def.color,
      duration: def.duration,
      start: Date.now()
    });
  }

  function createParticle(x, y, color) {
    particles.push({
      x: x*GRID + GRID/2,
      y: y*GRID + GRID/2,
      size: Math.random()*4 + 2,
      vx: (Math.random()-0.5)*2,
      vy: (Math.random()-0.5)*2,
      color,
      alpha: 1
    });
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

  function applyPowerUp(pu) {
    const def = POWER_UPS[pu.type];
    switch (def.effect) {
      case 'speed':
        speed += def.value;
        createParticle(snake[0].x, snake[0].y, def.color);
        break;
      case 'grow':
        for (let i=0; i<def.value; i++) {
          const tail = snake[snake.length - 1];
          snake.push({ x: tail.x, y: tail.y });
        }
        createParticle(snake[0].x, snake[0].y, def.color);
        break;
      case 'invincible':
        snake.invincible = true;
        setTimeout(() => snake.invincible = false, def.duration);
        createParticle(snake[0].x, snake[0].y, def.color);
        break;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Update & Draw
  // ──────────────────────────────────────────────────────────────────────────
  function update(delta) {
    if (!started || paused || gameOver) return;
    frameAcc += delta;
    const interval = 1000 / (speed + level * 0.5);
    if (frameAcc < interval) return;
    frameAcc = 0;

    // expire power-ups
    powerUps = powerUps.filter(pu => Date.now() - pu.start < pu.duration);
    if (Math.random() < 0.01) createPowerUp();

    // move head
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // power-up collision
    powerUps.forEach((pu, i) => {
      if (head.x === pu.x && head.y === pu.y) {
        powerUpSound.play();
        applyPowerUp(pu);
        powerUps.splice(i, 1);
      }
    });

    // apple collision
    if (head.x === apple.x && head.y === apple.y) {
      eatSound.play();
      score += 10;
      ui.score.textContent = `Score: ${score}`;
      if (score > best) {
        best = score;
        localStorage.setItem('snakeBest', best);
        ui.best.textContent = `Best: ${best}`;
      }
      for (let i=0; i<12; i++) createParticle(apple.x, apple.y, 'magenta');
      if (score % 50 === 0) {
        level++;
        ui.level.textContent = `Level: ${level}`;
        for (let i=0; i<12; i++) createParticle(head.x, head.y, 'cyan');
      }
      placeApple();
    } else {
      snake.pop();
    }

    // collision
    if (!snake.invincible) {
      if (
        head.x < 0 || head.y < 0 ||
        head.x >= cols || head.y >= rows ||
        snake.slice(1).some(s => s.x === head.x && s.y === head.y)
      ) {
        gameOver = true;
        ui.status.textContent = 'Game Over';
        finalScoreDisplay.textContent = `Your score: ${score}`;
        showGameOver();
        for (let i=0; i<20; i++) createParticle(head.x, head.y, 'red');
      }
    }
  }

  function draw() {
    if (!started) return;
    ctx.save();
    ctx.translate(screenShake, screenShake);

    // background
    const grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    grad.addColorStop(0,'rgba(0,0,0,0.9)');
    grad.addColorStop(0.5,'rgba(255,0,255,0.1)');
    grad.addColorStop(1,'rgba(0,0,0,0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // particles
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.size,0,2*Math.PI);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // power-ups
    powerUps.forEach(pu => {
      ctx.fillStyle = pu.color;
      ctx.fillRect(pu.x*GRID,pu.y*GRID,GRID-2,GRID-2);
      ctx.fillStyle = 'black';
      ctx.font = '10px Press Start 2P';
      ctx.fillText(pu.type[0],pu.x*GRID+2,pu.y*GRID+14);
    });

    // apple pulse
    const pulse = Math.sin(Date.now()/300)*10;
    ctx.fillStyle = `hsl(300,100%,${50+pulse}%)`;
    ctx.fillRect(apple.x*GRID,apple.y*GRID,GRID-2,GRID-2);

    // snake
    snake.forEach((seg,i) => {
      const hue = (hueOffset + i*10 + level*20) % 360;
      ctx.fillStyle = `hsl(${hue},100%,50%)`;
      ctx.fillRect(seg.x*GRID,seg.y*GRID,GRID-2,GRID-2);
    });

    ctx.restore();
    screenShake = 0;
    hueOffset = (hueOffset + 1 + level) % 360;
  }

  function loop(ts) {
    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    lastTime = ts;
    update(delta);
    draw();
    updateParticles();
    requestAnimationFrame(loop);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Game control & UI
  // ──────────────────────────────────────────────────────────────────────────
  function resetGame() {
    cols = Math.floor(canvas.width/GRID);
    rows = Math.floor(canvas.height/GRID);
    snake = [{ x: Math.floor(cols/2), y: Math.floor(rows/2) }];
    dx = 1; dy = 0;
    speed = selectedSpeed;
    score = 0; level = 1;
    paused = false; gameOver = false; started = false;
    hueOffset = 0; screenShake = 0;
    powerUps = []; particles = [];
    ui.score.textContent  = `Score: 0`;
    ui.level.textContent  = `Level: 1`;
    ui.best.textContent   = `Best: ${best}`;
    ui.status.textContent = 'Running';
    startOverlay.classList.remove('hidden');
    gameOverOverlay.classList.add('hidden');
    placeApple();
  }

  function startGame() {
    // pause parent audio
    if (window.parent && window.parent.document) {
      window.parent.document.querySelectorAll('audio').forEach(a => {
        if (a.id !== 'snake-music') a.pause();
      });
    }
    started = true;
    startOverlay.classList.add('hidden');
    music.muted = false;
    music.play().catch(()=>{});
    requestAnimationFrame(loop);
  }

  function showGameOver() {
    gameOverOverlay.classList.remove('hidden');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Event bindings
  // ──────────────────────────────────────────────────────────────────────────
  // Resize canvas
  function resize() {
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Difficulty selector
  difficultyMenu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      difficultyMenu.querySelector('.selected').classList.remove('selected');
      btn.classList.add('selected');
      selectedSpeed = +btn.dataset.speed;
    });
  });

  // Theme selector
  themeMenu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      themeMenu.querySelector('.selected').classList.remove('selected');
      btn.classList.add('selected');
      document.body.className = `theme-${btn.dataset.theme}`;
    });
  });

  // Mute toggle
  muteButton.addEventListener('click', () => {
    music.muted = !music.muted;
    muteButton.textContent = music.muted ? '🔇' : '🔊';
  });

  // Play button
  playButton.addEventListener('click', startGame);

  // Retry button & R key
  retryButton.addEventListener('click', () => {
    resetGame();
    startGame();
  });
  window.addEventListener('keydown', e => {
    if (gameOver && (e.key === 'r' || e.key === 'R')) {
      resetGame();
      startGame();
    }
  });

  // Touch controls
  touchControls.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('touchstart', () => {
      const dir = btn.dataset.dir;
      if (dir === 'up'    && dy === 0) { dx=0; dy=-1; }
      if (dir === 'down'  && dy === 0) { dx=0; dy=1; }
      if (dir === 'left'  && dx === 0) { dx=-1;dy=0; }
      if (dir === 'right' && dx === 0) { dx=1; dy=0; }
    });
  });

  // Keyboard controls
  window.addEventListener('keydown', e => {
    if (!started) return;
    if (e.key === ' ') {
      paused = !paused;
      ui.status.textContent = paused ? 'Paused' : 'Running';
      return;
    }
    if (paused || gameOver) return;
    if      (e.key === 'ArrowUp'    && dy === 0) { dx=0;  dy=-1; }
    else if (e.key === 'ArrowDown'  && dy === 0) { dx=0;  dy=1;  }
    else if (e.key === 'ArrowLeft'  && dx === 0) { dx=-1; dy=0;  }
    else if (e.key === 'ArrowRight' && dx === 0) { dx=1;  dy=0;  }
  });

  // Initialize best score
  best = Number(localStorage.getItem('snakeBest') || '0');

  // Kick off
  resetGame();
});
