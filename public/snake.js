// snake.js
(function() {
  const canvas = document.getElementById('snake-canvas');
  const ctx    = canvas.getContext('2d');
  const ui     = {
    score:  document.getElementById('snake-score'),
    level:  document.getElementById('snake-level'),
    best:   document.getElementById('snake-best'),
    status: document.getElementById('snake-status'),
  };
  const music          = document.getElementById('snake-music');
  const playButton     = document.getElementById('snake-play-button');

  const GRID = 20;
  let cols, rows, snake, dx, dy, apple, hueOffset;
  let lastTime = 0, speed = 5, frameAcc = 0;
  let score = 0, level = 1, best = 0;
  let paused = false, gameOver = false;
  let started = false;

  // load best score
  best = Number(localStorage.getItem('snakeBest') || 0);
  ui.best.textContent = `Best: ${best}`;

  function placeApple() {
    do {
      apple = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
      };
    } while (snake.some(s => s.x === apple.x && s.y === apple.y));
  }

  function reset() {
    cols = Math.floor(canvas.width / GRID);
    rows = Math.floor(canvas.height / GRID);
    snake = [{ x: ~~(cols/2), y: ~~(rows/2) }];
    dx = 1; dy = 0;
    placeApple();
    score = 0; level = 1; speed = 5; hueOffset = 0;
    ui.score.textContent = `Score: ${score}`;
    ui.level.textContent = `Level: ${level}`;
    ui.status.textContent = paused ? 'Paused' : 'Running';
    gameOver = false;
    music.currentTime = 0;
  }

  function startGame() {
    if (started) return;
    started = true;
    playButton.style.display = 'none';
    // unmute & play
    music.muted = false;
    music.play().catch(()=>{});
    window.requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', e => {
    if (!started) return;
    if (e.key === ' ') {
      paused = !paused;
      ui.status.textContent = paused ? 'Paused' : 'Running';
    }
    if (paused || gameOver) return;

    if (e.key === 'ArrowUp'    && dy === 0) { dx =  0; dy = -1; }
    if (e.key === 'ArrowDown'  && dy === 0) { dx =  0; dy =  1; }
    if (e.key === 'ArrowLeft'  && dx === 0) { dx = -1; dy =  0; }
    if (e.key === 'ArrowRight' && dx === 0) { dx =  1; dy =  0; }
  });

  playButton.addEventListener('click', startGame, { once: true });

  function update(delta) {
    if (!started || paused || gameOver) return;
    frameAcc += delta;
    const interval = 1000 / (speed + level * 0.5);
    if (frameAcc < interval) return;
    frameAcc = 0;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // eating
    if (head.x === apple.x && head.y === apple.y) {
      score += 10;
      ui.score.textContent = `Score: ${score}`;
      if (score > best) {
        best = score;
        localStorage.setItem('snakeBest', best);
        ui.best.textContent = `Best: ${best}`;
      }
      if (score % 50 === 0) {
        level++;
        ui.level.textContent = `Level: ${level}`;
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
    }
  }

  function draw() {
    if (!started) return;
    // fade for trail
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // apple
    ctx.fillStyle = 'magenta';
    ctx.fillRect(apple.x * GRID, apple.y * GRID, GRID - 2, GRID - 2);

    // snake
    snake.forEach((seg, i) => {
      const hue = (hueOffset + i*10 + level*20) % 360;
      ctx.fillStyle = `hsl(${hue},100%,50%)`;
      ctx.fillRect(seg.x * GRID, seg.y * GRID, GRID - 2, GRID - 2);
    });

    hueOffset = (hueOffset + 1 + level) % 360;
  }

  function loop(ts) {
    if (!started) return;
    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    lastTime = ts;

    update(delta);
    draw();
    requestAnimationFrame(loop);
  }

  function resize() {
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  reset();
})();
