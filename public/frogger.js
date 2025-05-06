// frogger.js
window.onload = function() {
  // ─── Element refs ─────────────────────────────────────────────────────────
  const canvas        = document.getElementById('game-canvas');
  const ctx           = canvas.getContext('2d');
  const startScreen   = document.getElementById('start-screen');   // may be null if missing
  const scoreElement  = document.querySelector('.score');
  const livesElement  = document.querySelector('.lives');

  const backgroundMusic = document.getElementById('background-music');
  const jumpSound       = document.getElementById('jump-sound');
  const hitSound        = document.getElementById('hit-sound');

  // ─── Game Constants ────────────────────────────────────────────────────────
  const GRID        = 40;
  const LANE_HEIGHT = GRID * 2;
  const NUM_LANES   = 8;
  const NUM_LOGS    = 5;
  const NUM_CARS    = 5;
  const NUM_HOMES   = 5;

  // ─── Power-up Definitions ───────────────────────────────────────────────────
  const POWER_UPS = {
    SPEED:      { color:'cyan',    effect:'speed',      duration:5000, value:2 },
    INVINCIBLE: { color:'yellow',  effect:'invincible', duration:5000, value:1 }
  };

  // ─── State ─────────────────────────────────────────────────────────────────
  let frog, cars, logs, homes;
  let score = 0, lives = 3;
  let gameStarted = false, gamePaused = false;
  let particles = [], powerUps = [];

  // ─── Frog Class ────────────────────────────────────────────────────────────
  class Frog {
    constructor() {
      this.width  = GRID;
      this.height = GRID;
      this.reset();
    }
    reset() {
      this.x = canvas.width/2 - this.width/2;
      this.y = canvas.height - this.height;
      this.speed = GRID;
      this.invincible = false;
    }
    draw() {
      const pulse = Math.sin(Date.now()/500)*10 + 100;
      ctx.fillStyle = `hsl(${pulse},100%,50%)`;
      ctx.beginPath();
      ctx.arc(this.x+this.width/2, this.y+this.height/2, this.width/2, 0, Math.PI*2);
      ctx.fill();
    }
    move(dx, dy) {
      const nx = this.x + dx, ny = this.y + dy;
      if (nx < 0 || nx+this.width > canvas.width ||
          ny < 0 || ny+this.height > canvas.height) return;
      this.x = nx; this.y = ny;
      jumpSound.currentTime = 0;
      jumpSound.play();
    }
  }

  // ─── Car, Log & Home Classes ───────────────────────────────────────────────
  class Car {
    constructor(x,y,speed){
      this.x = x; this.y = y;
      this.width = GRID*2; this.height = GRID;
      this.speed = speed;
      this.color = `hsl(${Math.random()*360},100%,50%)`;
    }
    update(){
      this.x += this.speed;
      if (this.x < -this.width) this.x = canvas.width;
      if (this.x > canvas.width) this.x = -this.width;
    }
    draw(){
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x,this.y,this.width,this.height);
    }
  }
  class Log {
    constructor(x,y,speed){
      this.x = x; this.y = y;
      this.width = GRID*3; this.height = GRID;
      this.speed = speed;
      this.color = `hsl(${Math.random()*360},100%,50%)`;
    }
    update(){
      this.x += this.speed;
      if (this.x < -this.width) this.x = canvas.width;
      if (this.x > canvas.width) this.x = -this.width;
    }
    draw(){
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x,this.y,this.width,this.height);
    }
  }
  class Home {
    constructor(x,y){
      this.x = x; this.y = y;
      this.width = GRID; this.height = GRID;
      this.occupied = false;
      this.color = 'rgba(0,255,0,0.5)';
    }
    draw(){
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x,this.y,this.width,this.height);
    }
  }

  // ─── Initialize / Reset ────────────────────────────────────────────────────
  function initializeGame(){
    frog = new Frog();
    cars = []; logs = []; homes = [];
    particles = []; powerUps = [];
    score = 0; lives = 3;
    scoreElement.textContent = `Score: ${score}`;
    livesElement.textContent = `Lives: ${lives}`;
    if (startScreen) startScreen.style.display = 'none';

    // cars on lanes 0–3
    for(let i=0;i<NUM_LANES/2;i++){
      const y = i*LANE_HEIGHT;
      for(let j=0;j<NUM_CARS;j++){
        const x = Math.random()*canvas.width;
        const s = ((i%2?1:-1)*(i+1))*2;
        cars.push(new Car(x,y,s));
      }
    }
    // logs on lanes 4–7
    for(let i=NUM_LANES/2;i<NUM_LANES;i++){
      const y = i*LANE_HEIGHT;
      for(let j=0;j<NUM_LOGS;j++){
        const x = Math.random()*canvas.width;
        const s = ((i%2?1:-1)*(i+1))*2;
        logs.push(new Log(x,y,s));
      }
    }
    // homes across the top
    for(let i=0;i<NUM_HOMES;i++){
      const x = i*(canvas.width/NUM_HOMES);
      homes.push(new Home(x,0));
    }
  }

  function resetGame(){
    gameStarted = false;
    gamePaused = false;
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(()=>{});
    if (startScreen) startScreen.style.display = 'block';
  }

  // ─── Game Loop ────────────────────────────────────────────────────────────
  function update(){
    if(!gameStarted || gamePaused || lives<=0) return;

    cars.forEach(c => c.update());
    logs.forEach(l => l.update());

    // check log carrying
    let onLog = false;
    logs.forEach(l => {
      if (frog.x < l.x+l.width &&
          frog.x+frog.width > l.x &&
          frog.y < l.y+l.height &&
          frog.y+frog.height>l.y) {
        onLog = true;
        frog.x += l.speed;
      }
    });
    // water death
    if (frog.y < (NUM_LANES/2)*LANE_HEIGHT && !onLog && !frog.invincible) {
      lives--;
      frog.reset();
      livesElement.textContent = `Lives: ${lives}`;
      hitSound.currentTime = 0;
      hitSound.play();
      if (lives<=0) gamePaused = true;
    }

    // car collision
    cars.forEach(c => {
      if (frog.x < c.x+c.width &&
          frog.x+frog.width>c.x &&
          frog.y < c.y+c.height &&
          frog.y+frog.height>c.y) {
        if (!frog.invincible) {
          lives--;
          frog.reset();
          livesElement.textContent = `Lives: ${lives}`;
          hitSound.currentTime = 0;
          hitSound.play();
          if (lives<=0) gamePaused = true;
        }
      }
    });

    // home collision
    homes.forEach(h => {
      if (!h.occupied &&
          frog.x < h.x+h.width &&
          frog.x+frog.width>h.x &&
          frog.y < h.y+h.height &&
          frog.y+frog.height>h.y) {
        h.occupied = true;
        score += 100;
        scoreElement.textContent = `Score: ${score}`;
        frog.reset();
      }
    });
  }

  function draw(){
    // background
    const g = ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,'rgba(0,0,0,0.9)');
    g.addColorStop(0.5,'rgba(255,0,255,0.1)');
    g.addColorStop(1,'rgba(0,0,0,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // lane lines
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for(let i=0;i<NUM_LANES;i++){
      ctx.fillRect(0, i*LANE_HEIGHT, canvas.width, 2);
    }

    cars.forEach(c=>c.draw());
    logs.forEach(l=>l.draw());
    homes.forEach(h=>h.draw());
    frog.draw();

    if (lives<=0) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#00f0ff';
      ctx.font = '30px Press Start 2P';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER',canvas.width/2,canvas.height/2);
      ctx.font = '15px Press Start 2P';
      ctx.fillText('Press SPACE to Restart',canvas.width/2,canvas.height/2+40);
    }
  }

  function loop() {
    update();
    draw();
    if (gameStarted && !gamePaused && lives>0) {
      requestAnimationFrame(loop);
    }
  }

  // ─── Controls ─────────────────────────────────────────────────────────────
  window.addEventListener('keydown', e => {
    if (e.key === ' ') {
      if (!gameStarted) {
        initializeGame();
        gameStarted = true;
        if (startScreen) startScreen.style.display = 'none';
        backgroundMusic.play().catch(()=>{});
        requestAnimationFrame(loop);
      } else if (lives<=0) {
        resetGame();
      } else {
        gamePaused = !gamePaused;
        gamePaused ? backgroundMusic.pause() : backgroundMusic.play();
      }
      return;
    }
    if (!gameStarted || gamePaused || lives<=0) return;
    switch(e.key) {
      case 'ArrowUp':    frog.move(0,-GRID); break;
      case 'ArrowDown':  frog.move(0, GRID); break;
      case 'ArrowLeft':  frog.move(-GRID,0); break;
      case 'ArrowRight': frog.move(GRID,0);  break;
    }
  });

  // ─── Touch (swipe) ────────────────────────────────────────────────────────
  let tSX=0, tSY=0;
  canvas.addEventListener('touchstart', e => {
    tSX = e.touches[0].clientX;
    tSY = e.touches[0].clientY;
  });
  canvas.addEventListener('touchend', e => {
    const ex = e.changedTouches[0].clientX - tSX;
    const ey = e.changedTouches[0].clientY - tSY;
    if (!gameStarted || gamePaused || lives<=0) return;
    if (Math.abs(ex)>Math.abs(ey)) {
      frog.move(ex>0?GRID:-GRID, 0);
    } else {
      frog.move(0, ey>0?GRID:-GRID);
    }
  });

  // ─── Canvas sizing & initial state ────────────────────────────────────────
  canvas.width  = 800;
  canvas.height = 600;
  // startScreen remains visible until SPACE
};
