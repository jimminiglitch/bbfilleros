// snake.js – full logic for SPACEWORM.EXE (updated sizing & subtle trails)

window.addEventListener('load', () => {
  // ─── Element refs ─────────────────────────────────────────────────────────
  const startOvl      = document.getElementById('start-overlay');
  const gameOverOvl   = document.getElementById('game-over-overlay');
  const btnPlay       = document.getElementById('snake-play-button');
  const btnSubmit     = document.getElementById('submit-score');
  const inpName       = document.getElementById('name-input');
  const elFinalScore  = document.getElementById('final-score');
  const lstHighScores = document.getElementById('high-scores-list');
  const btnAgain      = document.getElementById('play-again-button');

  const canvas        = document.getElementById('snake-canvas');
  const ctx           = canvas.getContext('2d');
  const ui            = {
    score:  document.getElementById('snake-score'),
    level:  document.getElementById('snake-level'),
    best:   document.getElementById('snake-best'),
    status: document.getElementById('snake-status'),
  };
  const music         = document.getElementById('snake-music');
  const btnMute       = document.getElementById('mute-button');
  const joystickBase  = document.getElementById('joystick-base');
  const joystickStick = document.getElementById('joystick-stick');

  // ─── WebAudio for SFX ───────────────────────────────────────────────────────
  let audioCtx;
  let eatBuf, powerBuf;
  const eatURL   = 'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/power-up-type-1-230548.mp3?v=1746542171704';
  const powerURL = 'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/coin-upaif-14631.mp3?v=1746542174524';

  // Initialize audio context on user interaction to avoid autoplay restrictions
  function initAudio() {
    if (audioCtx) return;
    
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      async function loadSound(url) {
        try {
          const res = await fetch(url);
          const arr = await res.arrayBuffer();
          return audioCtx.decodeAudioData(arr);
        } catch (err) {
          console.error("Error loading sound:", err);
          return null;
        }
      }
      
      Promise.all([loadSound(eatURL), loadSound(powerURL)])
        .then(([e, p]) => { 
          eatBuf = e; 
          powerBuf = p; 
        })
        .catch(err => console.error("Error loading sounds:", err));
    } catch (err) {
      console.error("WebAudio not supported:", err);
    }
  }

  function playSFX(buf) {
    if (!audioCtx || !buf) return;
    try {
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(audioCtx.destination);
      src.start();
    } catch (err) {
      console.error("Error playing sound:", err);
    }
  }

  // ─── Pause music when tab hidden ───────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      music.pause();
    } else if (started && !paused && !gameOver) {
      music.play().catch(() => {});
    }
  });

  // ─── Starfield ──────────────────────────────────────────────────────────────
  let stars = [];
  const STAR_COUNT = 175;
  function initStars() {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      z: Math.random()*canvas.width,
      o: Math.random()
    }));
  }
  function drawStars() {
    // slight motion-blur
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    for (let s of stars) {
      // twinkle
      s.o += (Math.random()-0.5)*0.02;
      s.o = Math.max(0.1, Math.min(1, s.o));

      s.z -= 2;
      if (s.z <= 0) {
        s.z = canvas.width;
        s.x = Math.random()*canvas.width;
        s.y = Math.random()*canvas.height;
        s.o = Math.random();
      }
      const k  = 128.0/s.z;
      const px = (s.x - canvas.width/2)*k + canvas.width/2;
      const py = (s.y - canvas.height/2)*k + canvas.height/2;
      const sz = Math.max(0.5, (1 - s.z/canvas.width)*2);  // HALF as big as before

      ctx.globalAlpha = s.o;
      ctx.fillStyle   = '#fff';
      ctx.beginPath();
      ctx.arc(px,py,sz,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ─── Game state ─────────────────────────────────────────────────────────────
  const GRID = 17.5;
  let cols, rows;
  let snake, dx, dy, apple;
  let baseSpeed, speed, score, level, best;
  let paused = false, gameOver = false, started = false, hueOffset = 0;
  let powerUps = [], particles = [], trail = [];
  let frameAcc = 0, lastTime = 0;
  let animationFrameId = null;

  const HS_KEY = 'snakeHighScores';
  const MAX_HS = 7;
  const POWER_DEF = {
    SPEED:      { color:'cyan',    effect:'speed',      duration:5000, value:2,  pts:5  },
    GROW:       { color:'magenta', effect:'grow',       duration:3000, value:3,  pts:8  },
    INVINCIBLE: { color:'yellow',  effect:'invincible', duration:5000, value:0,  pts:10 }
  };
  const MAX_TRAIL = 50;  // Increased from 0.5 to 50 to fix trail length

  // ─── High-score helpers ────────────────────────────────────────────────────
  function loadHS() {
    try {
      const j = localStorage.getItem(HS_KEY);
      return j ? JSON.parse(j) : [];
    } catch (err) {
      console.error("Error loading high scores:", err);
      return [];
    }
  }
  function saveHS(list) {
    try {
      localStorage.setItem(HS_KEY, JSON.stringify(list));
    } catch (err) {
      console.error("Error saving high scores:", err);
    }
  }
  function drawHS() {
    if (!lstHighScores) return;
    lstHighScores.innerHTML = loadHS()
      .map(h => `<li>${h.name}: ${h.score}</li>`)
      .join('');
  }
  function addHS(name,val) {
    const l = loadHS();
    l.push({ name, score: val });
    l.sort((a,b)=>b.score-a.score);
    saveHS(l.slice(0,MAX_HS));
  }

  // ─── Game helpers ──────────────────────────────────────────────────────────
  function placeApple(){
    if (!cols || !rows) return;
    
    do {
      apple = {
        x: Math.floor(Math.random()*cols),
        y: Math.floor(Math.random()*rows)
      };
    } while (
      snake.some(s=>s.x===apple.x&&s.y===apple.y) ||
      powerUps.some(p=>p.x===apple.x&&p.y===apple.y)
    );
  }
  function createPU(){
    if (!cols || !rows) return;
    
    const types = Object.keys(POWER_DEF);
    const t     = types[Math.floor(Math.random()*types.length)];
    const d     = POWER_DEF[t];
    powerUps.push({
      x: Math.floor(Math.random()*cols),
      y: Math.floor(Math.random()*rows),
      type: t,
      color: d.color,
      duration: d.duration,
      start: Date.now()
    });
  }
  function createParticle(x,y,color){
    particles.push({
      x: x*GRID + GRID/2,
      y: y*GRID + GRID/2,
      size: Math.random()*3 + 1,  // smaller
      vx: (Math.random()-0.5)*2,
      vy: (Math.random()-0.5)*2,
      color,
      alpha: 1
    });
  }
  function updateParticles(){
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x+=p.vx; p.y+=p.vy; p.alpha-=0.02;
      if(p.alpha<=0) particles.splice(i,1);
    }
  }
  function applyPU(pu){
    const d = POWER_DEF[pu.type];
    // award points
    score += d.pts;
    if (ui.score) ui.score.textContent = `Score: ${score}`;
    if(score > best){
      best = score;
      if (ui.best) ui.best.textContent = `Best: ${best}`;
    }
    switch(d.effect){
      case 'speed':
        speed = baseSpeed*1.5;
        createParticle(snake[0].x, snake[0].y, d.color);
        break;
      case 'grow':
        for(let i=0;i<d.value;i++){
          const tail = snake[snake.length-1];
          snake.push({ x: tail.x, y: tail.y });
        }
        createParticle(snake[0].x, snake[0].y, d.color);
        break;
      case 'invincible':
        snake.invincible = true;
        setTimeout(()=>snake.invincible = false, d.duration);
        createParticle(snake[0].x, snake[0].y, d.color);
        break;
    }
  }

  // ─── Update & draw ─────────────────────────────────────────────────────────
  function update(dt){
    if(!started||paused||gameOver) return;
    frameAcc += dt;
    if(frameAcc < 1000/speed) return;
    frameAcc = 0;

    powerUps = powerUps.filter(pu => Date.now() - pu.start < pu.duration);
    if(Math.random() < 0.01) createPU();

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    trail.unshift({ x: head.x, y: head.y, t: Date.now() });
    if(trail.length > MAX_TRAIL) trail.pop();

    powerUps.forEach((pu,i)=>{
      if(head.x===pu.x&&head.y===pu.y){
        playSFX(powerBuf);
        applyPU(pu);
        powerUps.splice(i,1);
      }
    });

    if(head.x===apple.x&&head.y===apple.y){
      playSFX(eatBuf);
      score += 10;
      if (ui.score) ui.score.textContent = `Score: ${score}`;
      if(score > best){
        best = score;
        if (ui.best) ui.best.textContent = `Best: ${best}`;
      }
      for(let i=0;i<8;i++) createParticle(apple.x, apple.y, 'magenta');
      if(score % 50 === 0){
        level++;
        if (ui.level) ui.level.textContent = `Level: ${level}`;
        for(let i=0;i<8;i++) createParticle(head.x, head.y, 'cyan');
      }
      placeApple();
    } else {
      snake.pop();
    }

    if(!snake.invincible){
      if(head.x<0||head.y<0||head.x>=cols||head.y>=rows||
         snake.slice(1).some(s=>s.x===head.x&&s.y===head.y)){
        gameOver = true;
        if (ui.status) ui.status.textContent = 'Game Over';
        if (elFinalScore) elFinalScore.textContent = `Your score: ${score}`;
        if (gameOverOvl) gameOverOvl.classList.remove('hidden');
        if (music) { music.pause(); music.currentTime=0; }
        for(let i=0;i<20;i++) createParticle(head.x, head.y, 'red');
      }
    }
  }

  function draw(){
    if(!started || !ctx) return;
    drawStars();

    // trails (more subtle)
    const S = GRID-2, O = 1;
    trail.forEach((pt, idx)=>{
      const age = Date.now() - pt.t;
      const a   = Math.max(0,1 - age/1000)*0.2;  // half the intensity
      ctx.fillStyle = `hsla(${(hueOffset+idx*20)%360},100%,50%,${a})`;
      ctx.fillRect(pt.x*GRID+O, pt.y*GRID+O, S, S);
    });

    // power-ups
    powerUps.forEach(pu=>{
      ctx.fillStyle = pu.color;
      ctx.fillRect(pu.x*GRID+1, pu.y*GRID+1, GRID-2, GRID-2);
      ctx.fillStyle = 'black';
      ctx.font = '10px Press Start 2P';
      ctx.fillText(pu.type[0], pu.x*GRID+3, pu.y*GRID+14);
    });

    // apple (smaller)
    if (apple) {
      const pulse = Math.sin(Date.now()/300)*6;
      ctx.fillStyle = `hsl(300,100%,${50+pulse}%)`;
      ctx.fillRect(apple.x*GRID+3, apple.y*GRID+3, GRID-6, GRID-6);
    }

    // snake (smaller)
    snake.forEach((seg,i)=>{
      const hue = (hueOffset + i*10 + level*20)%360;
      ctx.fillStyle = `hsl(${hue},100%,50%)`;
      ctx.fillRect(seg.x*GRID+3, seg.y*GRID+3, GRID-6, GRID-6);
    });

    // particles
    particles.forEach(p=>{
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.size,0,2*Math.PI);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    hueOffset = (hueOffset + 1 + level)%360;
  }

  function loop(ts){
    if(!lastTime) lastTime = ts;
    const dt = ts - lastTime;
    lastTime = ts;
    update(dt);
    draw();
    updateParticles();
    animationFrameId = requestAnimationFrame(loop);
  }

  // ─── Controls/UI ───────────────────────────────────────────────────────────
  function resetGame(){
    if (music) { music.pause(); music.currentTime=0; }
    
    // Cancel any existing animation frame
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    // Reset canvas dimensions
    if (canvas) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
    
    cols = canvas && Math.floor(canvas.width/GRID) || 0;
    rows = canvas && Math.floor(canvas.height/GRID) || 0;
    
    snake = [{ x: Math.floor(cols/2), y: Math.floor(rows/2) }];
    dx=1; dy=0;
    baseSpeed=5; speed=baseSpeed;
    score=0; level=1;
    paused=false; gameOver=false; started=false;
    hueOffset=0;
    powerUps=[]; particles=[]; trail=[];
    
    if (ui.score) ui.score.textContent='Score: 0';
    if (ui.level) ui.level.textContent='Level: 1';
    
    best = (loadHS()[0]||{score:0}).score;
    if (ui.best) ui.best.textContent=`Best: ${best}`;
    if (ui.status) ui.status.textContent='Running';
    
    if (startOvl) startOvl.classList.remove('hidden');
    if (gameOverOvl) gameOverOvl.classList.add('hidden');
    
    drawHS();
    placeApple();
    initStars();
  }

  // Handle window resize
  function handleResize() {
    if (!canvas) return;
    
    // Store current game state
    const wasStarted = started;
    const wasPaused = paused;
    
    // Pause game during resize
    paused = true;
    
    // Resize canvas
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Recalculate grid
    cols = Math.floor(canvas.width/GRID);
    rows = Math.floor(canvas.height/GRID);
    
    // Reinitialize stars
    initStars();
    
    // Ensure apple is within bounds
    if (apple && (apple.x >= cols || apple.y >= rows)) {
      placeApple();
    }
    
    // Ensure snake is within bounds
    snake = snake.map(segment => ({
      x: Math.min(segment.x, cols-1),
      y: Math.min(segment.y, rows-1)
    }));
    
    // Resume game if it was running
    if (wasStarted && !wasPaused) {
      paused = false;
    }
  }

  // Add resize event listener
  window.addEventListener('resize', handleResize);

  // Event listeners
  if (btnPlay) {
    btnPlay.addEventListener('click', ()=>{
      initAudio();
      started=true;
      if (startOvl) startOvl.classList.add('hidden');
      if (music) music.play().catch(()=>{});
      animationFrameId = requestAnimationFrame(loop);
    });
  }

  if (btnSubmit) {
    btnSubmit.addEventListener('click', ()=>{
      const n = inpName && inpName.value.trim() || 'ANON';
      addHS(n,score); 
      drawHS();
      if (btnSubmit) btnSubmit.disabled=true; 
      if (inpName) inpName.disabled=true;
    });
  }

  if (btnAgain) {
    btnAgain.addEventListener('click', ()=>{
      resetGame();
      if (btnSubmit) btnSubmit.disabled=false; 
      if (inpName) { inpName.disabled=false; inpName.value=''; }
      if (music) { music.pause(); music.currentTime=0; }
      if (btnPlay) btnPlay.click();
    });
  }

  // keyboard
  window.addEventListener('keydown', e=>{
    if(!started) return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    if(e.key===' '){
      paused = !paused;
      if (ui.status) ui.status.textContent = paused?'Paused':'Running';
      if (music) {
        paused ? music.pause() : music.play().catch(()=>{});
      }
      return;
    }
    if(paused||gameOver) return;
    switch(e.key){
      case 'ArrowUp':    if(dy===0){dx=0;dy=-1;} break;
      case 'ArrowDown':  if(dy===0){dx=0;dy=1;}  break;
      case 'ArrowLeft':  if(dx===0){dx=-1;dy=0;} break;
      case 'ArrowRight': if(dx===0){dx=1;dy=0;}  break;
    }
    if(e.key.startsWith('Arrow')) speed = baseSpeed*2;
  });
  
  window.addEventListener('keyup', e=>{
    if(e.key.startsWith('Arrow')) speed = baseSpeed;
  });

  // mute
  if (btnMute) {
    btnMute.addEventListener('click', ()=>{
      if (!music) return;
      music.muted = !music.muted;
      btnMute.textContent = music.muted?'🔇':'🔊';
    });
  }

  // Cleanup function to prevent memory leaks
  function cleanup() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    window.removeEventListener('resize', handleResize);
    if (music) {
      music.pause();
      music.src = '';
    }
  }

  // Handle iframe unload
  window.addEventListener('beforeunload', cleanup);

  // Initialize the game
  if (canvas) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    initStars();
    resetGame();
  }
});