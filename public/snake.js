(() => {
  const canvas   = document.getElementById('snake-canvas');
  const ctx      = canvas.getContext('2d');
  const ui       = {
    score:  document.getElementById('snake-score'),
    level:  document.getElementById('snake-level'),
    best:   document.getElementById('snake-best'),
    status: document.getElementById('snake-status'),
  };
  const music        = document.getElementById('snake-music');
  const eatSound     = document.getElementById('eat-sound');
  const powerUpSound = document.getElementById('power-up-sound');
  const playButton   = document.getElementById('snake-play-button');

  const GRID = 20;
  let cols, rows, snake, dx, dy, apple, hueOffset;
  let lastTime = 0, speed = 5, frameAcc = 0;
  let score = 0, level = 1, best = 0;
  let paused = false, gameOver = false, started = false;
  let powerUps = [], particles = [], screenShake = 0;

  const POWER_UPS = {
    SPEED:     { color: 'cyan',   effect: 'speed',      duration: 5000, value: 2  },
    GROW:      { color: 'magenta',effect: 'grow',       duration: 3000, value: 3  },
    INVINCIBLE:{ color: 'yellow', effect: 'invincible', duration: 5000, value: 1  }
  };

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
    const key   = types[Math.floor(Math.random() * types.length)];
    const pu    = POWER_UPS[key];
    powerUps.push({
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
      type: key,
      color: pu.color,
      duration: pu.duration,
      startTime: Date.now()
    });
  }

  function createParticle(x, y, color) {
    particles.push({
      x: x * GRID + GRID/2,
      y: y * GRID + GRID/2,
      size: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      color,
      alpha: 1
    });
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x     += p.vx;
      p.y     += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

  function applyPowerUp(pu) {
    const e = POWER_UPS[pu.type];
    switch (e.effect) {
      case 'speed':
        speed += e.value;
        createParticle(snake[0].x, snake[0].y, 'cyan');
        break;
      case 'grow':
        for (let i = 0; i < e.value; i++) {
          const tail = snake[snake.length - 1];
          snake.push({ x: tail.x, y: tail.y });
        }
        createParticle(snake[0].x, snake[0].y, 'magenta');
        break;
      case 'invincible':
        snake.invincible = true;
        setTimeout(() => snake.invincible = false, e.duration);
        createParticle(snake[0].x, snake[0].y, 'yellow');
        break;
    }
  }

  function update(delta) {
    if (!started || paused || gameOver) return;

    frameAcc += delta;
    const interval = 1000 / (speed + level * 0.5);
    if (frameAcc < interval) return;
    frameAcc = 0;

    // Expire old power-ups
    powerUps = powerUps.filter(pu => Date.now() - pu.startTime < pu.duration);

    // Occasionally spawn new power-up
    if (Math.random() < 0.01) createPowerUp();

    // Move snake
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // Power-up collision
    powerUps.forEach((pu, i) => {
      if (head.x === pu.x && head.y === pu.y) {
        powerUpSound.play();
        applyPowerUp(pu);
        powerUps.splice(i, 1);
      }
    });

    // Apple collision
    if (head.x === apple.x && head.y === apple.y) {
      eatSound.play();
      score += 10;
      ui.score.textContent = `Score: ${score}`;
      if (score > best) {
        best = score;
        localStorage.setItem('snakeBest', best);
        ui.best.textContent = `Best: ${best}`;
      }
      // Particles on eat
      for (let i = 0; i < 10; i++) createParticle(apple.x, apple.y, 'magenta');

      if (score % 50 === 0) {
        level++;
        ui.level.textContent = `Level: ${level}`;
        for (let i = 0; i < 10; i++) createParticle(head.x, head.y, 'cyan');
      }
      placeApple();
    } else {
      snake.pop();
    }

    // Collision detection (walls & self), skip if invincible
    if (!snake.invincible) {
      if (
        head.x < 0 || head.y < 0 ||
        head.x >= cols || head.y >= rows ||
        snake.slice(1).some(s => s.x === head.x && s.y === head.y)
      ) {
        gameOver = true;
        ui.status.textContent = 'Game Over';
        for (let i = 0; i < 20; i++) createParticle(head.x, head.y, 'red');
      }
    }
  }

  function draw() {
    if (!started) return;

    // Screen shake
    ctx.save();
    ctx.translate(screenShake, screenShake);

    // Background gradient
    const grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    grad.addColorStop(0, 'rgba(0,0,0,0.9)');
    grad.addColorStop(0.5, 'rgba(255,0,255,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Particles
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 2*Math.PI);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Power-ups
    powerUps.forEach(pu => {
      ctx.fillStyle = pu.color;
      ctx.fillRect(pu.x*GRID, pu.y*GRID, GRID-2, GRID-2);
      ctx.fillStyle = 'black';
      ctx.font = '10px Press Start 2P';
      ctx.fillText(pu.type[0], pu.x*GRID+2, pu.y*GRID+14);
    });

    // Apple (pulsing)
    const pulse = Math.sin(Date.now()/300) * 10;
    ctx.fillStyle = `hsl(300,100%,${50+pulse}%)`;
    ctx.fillRect(apple.x*GRID, apple.y*GRID, GRID-2, GRID-2);

    // Snake (rainbow)
    snake.forEach((seg,i) => {
      const hue = (hueOffset + i*10 + level*20) % 360;
      ctx.fillStyle = `hsl(${hue},100%,50%)`;
      ctx.fillRect(seg.x*GRID, seg.y*GRID, GRID-2, GRID-2);
    });

    ctx.restore();
    screenShake = 0;
    hueOffset = (hueOffset + 1 + level) % 360;
  }

  function reset() {
    cols = Math.floor(canvas.width/GRID);
    rows = Math.floor(canvas.height/GRID);
    snake = [{ x: Math.floor(cols/2), y: Math.floor(rows/2) }];
    dx = 1; dy = 0;
    powerUps = [];
    particles = [];
    score = 0; level = 1; speed = 5;
    gameOver = false; paused = false; started = false;
    hueOffset = 0;
    ui.score.textContent = `Score: ${score}`;
    ui.level.textContent = `Level: ${level}`;
    best = Number(localStorage.getItem('snakeBest') || 0);
    ui.best.textContent = `Best: ${best}`;
    ui.status.textContent = 'Running';
    playButton.style.display = 'block';
    music.pause(); music.currentTime = 0;
    placeApple();
  }

  function startGame() {
    if (started) return;
    started = true;
    playButton.style.display = 'none';
    music.muted = false;
    music.play().catch(()=>{});
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', e => {
    if (!started) return;
    if (e.key === ' ') {
      paused = !paused;
      ui.status.textContent = paused ? 'Paused' : 'Running';
      return;
    }
    if (paused || gameOver) return;

    // Arrow keys (no 180° turns)
    if      (e.key === 'ArrowUp'    && dy === 0) { dx = 0; dy = -1; }
    else if (e.key === 'ArrowDown'  && dy === 0) { dx = 0; dy =  1; }
    else if (e.key === 'ArrowLeft'  && dx === 0) { dx = -1;dy =  0; }
    else if (e.key === 'ArrowRight' && dx === 0) { dx =  1;dy =  0; }
  });

  playButton.addEventListener('click', startGame, { once: true });

  function loop(ts) {
    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    lastTime = ts;
    update(delta);
    draw();
    updateParticles();
    requestAnimationFrame(loop);
  }

  function resize() {
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Touch controls
  let tSX=0, tSY=0;
  canvas.addEventListener('touchstart', e => {
    tSX=e.touches[0].clientX;
    tSY=e.touches[0].clientY;
  });
  canvas.addEventListener('touchend', e => {
    const ex=e.changedTouches[0].clientX - tSX;
    const ey=e.changedTouches[0].clientY - tSY;
    if (Math.abs(ex)>Math.abs(ey)) {
      if (ex>0 && dx===0) dx=1,dy=0;
      if (ex<0 && dx===0) dx=-1,dy=0;
    } else {
      if (ey>0 && dy===0) dx=0,dy=1;
      if (ey<0 && dy===0) dx=0,dy=-1;
    }
  });

  // Initialize
  document.addEventListener('DOMContentLoaded', () => reset());
})();
