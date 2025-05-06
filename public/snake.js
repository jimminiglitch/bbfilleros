// snake.js – SPACEWORM.EXE core logic

window.addEventListener('load', () => {
  // ─── Element refs ─────────────────────────────────────────────────────────
  const startOvl     = document.getElementById('start-overlay');
  const gameOverOvl  = document.getElementById('game-over-overlay');
  const btnPlay      = document.getElementById('snake-play-button');
  const btnSubmit    = document.getElementById('submit-score');
  const inpName      = document.getElementById('name-input');
  const elFinalScore = document.getElementById('final-score');
  const lstHighScores = document.getElementById('high-scores-list');
  const btnAgain     = document.getElementById('play-again-button');

  const canvas       = document.getElementById('snake-canvas');
  const ctx          = canvas.getContext('2d');
  const ui           = {
    score:  document.getElementById('snake-score'),
    level:  document.getElementById('snake-level'),
    best:   document.getElementById('snake-best'),
    status: document.getElementById('snake-status'),
  };
  const music        = document.getElementById('snake-music');
  const btnMute      = document.getElementById('mute-button');
  const touchCtrls   = document.getElementById('touch-controls');

  // ─── WebAudio for SFX ───────────────────────────────────────────────────────
  const audioCtx   = new (window.AudioContext||window.webkitAudioContext)();
  let eatBuf, powerBuf;
  const eatURL   = 'https://cdn.glitch.global/.../power-up-type-1-230548.mp3';
  const powerURL = 'https://cdn.glitch.global/.../coin-upaif-14631.mp3';

  async function loadSound(url) {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    return audioCtx.decodeAudioData(arr);
  }
  Promise.all([loadSound(eatURL), loadSound(powerURL)])
    .then(([e,p])=>{ eatBuf=e; powerBuf=p; });

  function playSFX(buf) {
    if (!buf) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start();
  }

  // ─── Pause music when hidden/closed ────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      music.pause();
      music.currentTime = 0;
    }
  });

  // ─── Starfield ─────────────────────────────────────────────────────────────
  let stars = [];
  const STAR_COUNT = 200;
  function initStars() {
    stars = Array.from({length:STAR_COUNT}, () => ({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      z: Math.random()*canvas.width,
      o: Math.random()
    }));
  }
  function drawStars() {
    // subtle motion blur
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    for (let s of stars) {
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
      const sz = Math.max(1, (1 - s.z/canvas.width)*4);

      ctx.globalAlpha = s.o;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(px,py,sz,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ─── Game state ─────────────────────────────────────────────────────────────
  const GRID = 20;
  let cols, rows;
  let snake, dx, dy, apple;
  let baseSpeed, speed, score, level, best;
  let paused, gameOver, started, hueOffset;
  let powerUps, particles, trail;
  let frameAcc=0, lastTime=0;

  const HS_KEY = 'snakeHighScores';
  const MAX_HS = 7;
  const POWER_DEF = {
    SPEED:      {color:'cyan',    effect:'speed',      duration:5000, value:2,  pts:5},
    GROW:       {color:'magenta', effect:'grow',       duration:3000, value:3,  pts:8},
    INVINCIBLE: {color:'yellow',  effect:'invincible', duration:5000, value:0,  pts:10}
  };
  const MAX_TRAIL = 30;

  // ─── High-score helpers ────────────────────────────────────────────────────
  function loadHS() {
    const j = localStorage.getItem(HS_KEY);
    return j? JSON.parse(j) : [];
  }
  function saveHS(list) {
    localStorage.setItem(HS_KEY, JSON.stringify(list));
  }
  function drawHS() {
    lstHighScores.innerHTML = loadHS()
      .map(h=>`<li>${h.name}: ${h.score}</li>`).join('');
  }
  function addHS(name,val){
    const lst = loadHS();
    lst.push({name,score:val});
    lst.sort((a,b)=>b.score-a.score);
    saveHS(lst.slice(0,MAX_HS));
  }

  // ─── Game helpers ──────────────────────────────────────────────────────────
  function placeApple() {
    do {
      apple = { x:Math.floor(Math.random()*cols), y:Math.floor(Math.random()*rows) };
    } while (
      snake.some(s=>s.x===apple.x&&s.y===apple.y) ||
      powerUps.some(p=>p.x===apple.x&&p.y===apple.y)
    );
  }
  function createPowerUp() {
    const types = Object.keys(POWER_DEF);
    const t     = types[Math.floor(Math.random()*types.length)];
    const d     = POWER_DEF[t];
    powerUps.push({
      x:Math.floor(Math.random()*cols),
      y:Math.floor(Math.random()*rows),
      type:t, color:d.color,
      duration:d.duration,
      start:Date.now()
    });
  }
  function createParticle(x,y,color){
    particles.push({
      x:x*GRID+GRID/2, y:y*GRID+GRID/2,
      size:Math.random()*4+2,
      vx:(Math.random()-0.5)*2, vy:(Math.random()-0.5)*2,
      color, alpha:1
    });
  }
  function updateParticles() {
    for (let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x+=p.vx; p.y+=p.vy; p.alpha-=0.02;
      if (p.alpha<=0) particles.splice(i,1);
    }
  }
  function applyPU(pu) {
    const d = POWER_DEF[pu.type];
    // award points
    score += d.pts;
    ui.score.textContent = `Score: ${score}`;
    if (score>best) {
      best=score;
      ui.best.textContent = `Best: ${best}`;
    }
    switch(d.effect){
      case 'speed':
        speed = baseSpeed*2;
        createParticle(snake[0].x, snake[0].y, d.color);
        break;
      case 'grow':
        for(let i=0;i<d.value;i++){
          const tail = snake[snake.length-1];
          snake.push({x:tail.x,y:tail.y});
        }
        createParticle(snake[0].x, snake[0].y, d.color);
        break;
      case 'invincible':
        snake.invincible=true;
        setTimeout(()=>snake.invincible=false,d.duration);
        createParticle(snake[0].x, snake[0].y, d.color);
        break;
    }
  }

  // ─── Update & draw ─────────────────────────────────────────────────────────
  function update(dt){
    if(!started||paused||gameOver) return;
    frameAcc+=dt;
    const iv = 1000/speed;
    if(frameAcc<iv) return;
    frameAcc=0;

    powerUps = powerUps.filter(pu=>Date.now()-pu.start<pu.duration);
    if(Math.random()<0.01) createPowerUp();

    const head={x:snake[0].x+dx,y:snake[0].y+dy};
    snake.unshift(head);

    trail.unshift({x:head.x,y:head.y,t:Date.now()});
    if(trail.length>MAX_TRAIL) trail.pop();

    powerUps.forEach((pu,i)=>{
      if(head.x===pu.x&&head.y===pu.y){
        playSFX(powerBuf);
        applyPU(pu);
        powerUps.splice(i,1);
      }
    });

    if(head.x===apple.x&&head.y===apple.y){
      playSFX(eatBuf);
      score+=10;
      ui.score.textContent = `Score: ${score}`;
      if(score>best){
        best=score;
        ui.best.textContent=`Best: ${best}`;
      }
      for(let i=0;i<12;i++) createParticle(apple.x,apple.y,'magenta');
      if(score%50===0){
        level++;
        ui.level.textContent=`Level: ${level}`;
        for(let i=0;i<12;i++) createParticle(head.x,head.y,'cyan');
      }
      placeApple();
    } else {
      snake.pop();
    }

    if(!snake.invincible){
      if(head.x<0||head.y<0||head.x>=cols||head.y>=rows||
         snake.slice(1).some(s=>s.x===head.x&&s.y===head.y)){
        gameOver=true;
        ui.status.textContent='Game Over';
        elFinalScore.textContent=`Your score: ${score}`;
        gameOverOvl.classList.remove('hidden');
        music.pause(); music.currentTime=0;
        for(let i=0;i<20;i++) createParticle(head.x,head.y,'red');
      }
    }
  }

  function draw(){
    if(!started) return;
    // 1) starfield
    drawStars();

    // 2) trails
    const S = GRID-4, O=2;
    trail.forEach((pt,idx)=>{
      const age = Date.now()-pt.t;
      const a = Math.max(0,1-age/1000)*0.4;
      ctx.fillStyle = `hsla(${(hueOffset+idx*20)%360},100%,50%,${a})`;
      ctx.fillRect(pt.x*GRID+O, pt.y*GRID+O, S, S);
    });

    // 3) power-ups
    powerUps.forEach(pu=>{
      ctx.fillStyle=pu.color;
      ctx.fillRect(pu.x*GRID+1,pu.y*GRID+1,GRID-2,GRID-2);
      ctx.fillStyle='black';
      ctx.font='10px Press Start 2P';
      ctx.fillText(pu.type[0],pu.x*GRID+3,pu.y*GRID+14);
    });

    // 4) apple
    const pulse = Math.sin(Date.now()/300)*10;
    ctx.fillStyle = `hsl(300,100%,${50+pulse}%)`;
    ctx.fillRect(apple.x*GRID+1, apple.y*GRID+1, GRID-2, GRID-2);

    // 5) snake
    snake.forEach((seg,i)=>{
      const hue = (hueOffset+i*10+level*20)%360;
      ctx.fillStyle = `hsl(${hue},100%,50%)`;
      ctx.fillRect(seg.x*GRID+1, seg.y*GRID+1, GRID-2, GRID-2);
    });

    // 6) particles
    particles.forEach(p=>{
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.size,0,2*Math.PI);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // wrap up
    hueOffset = (hueOffset+1+level)%360;
  }

  function loop(ts){
    if(!lastTime) lastTime=ts;
    const dt = ts-lastTime;
    lastTime=ts;
    update(dt);
    draw();
    updateParticles();
    requestAnimationFrame(loop);
  }

  // ─── Controls/UI ───────────────────────────────────────────────────────────
  function resetGame(){
    music.pause(); music.currentTime=0;
    cols = Math.floor(canvas.width/GRID);
    rows = Math.floor(canvas.height/GRID);
    snake = [{x:Math.floor(cols/2), y:Math.floor(rows/2)}];
    dx=1; dy=0;
    baseSpeed=5; speed=baseSpeed;
    score=0; level=1;
    paused=false; gameOver=false; started=false;
    hueOffset=0;
    powerUps=[]; particles=[]; trail=[];
    ui.score.textContent='Score: 0';
    ui.level.textContent='Level: 1';
    best = (loadHS()[0]||{score:0}).score;
    ui.best.textContent=`Best: ${best}`;
    ui.status.textContent='Running';
    startOvl.classList.remove('hidden');
    gameOverOvl.classList.add('hidden');
    drawHS();
    placeApple();
  }

  btnPlay.addEventListener('click', ()=>{
    audioCtx.resume();
    started=true;
    startOvl.classList.add('hidden');
    music.play().catch(()=>{});
    requestAnimationFrame(loop);
  });

  btnSubmit.addEventListener('click', ()=>{
    const n = inpName.value.trim()||'ANON';
    addHS(n,score);
    drawHS();
    btnSubmit.disabled=true;
    inpName.disabled=true;
  });

  btnAgain.addEventListener('click', ()=>{
    resetGame();
    btnSubmit.disabled=false;
    inpName.disabled=false;
    inpName.value='';
    music.currentTime=0;
    music.pause();
    btnPlay.click();
  });

  window.addEventListener('keydown', e=>{
    if(!started) return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)){
      e.preventDefault();
    }
    if(e.key===' '){
      paused = !paused;
      ui.status.textContent = paused?'Paused':'Running';
      paused ? music.pause() : music.play().catch(()=>{});
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

  touchCtrls.querySelectorAll('button').forEach(b=>{
    b.addEventListener('touchstart', ()=>{
      const d=b.dataset.dir;
      if(d==='up'&&dy===0)   {dx=0;dy=-1;}
      if(d==='down'&&dy===0) {dx=0;dy=1;}
      if(d==='left'&&dx===0) {dx=-1;dy=0;}
      if(d==='right'&&dx===0){dx=1;dy=0;}
      speed = baseSpeed*2;
    });
    b.addEventListener('touchend', ()=>{ speed = baseSpeed; });
  });

  btnMute.addEventListener('click', ()=>{
    music.muted = !music.muted;
    btnMute.textContent = music.muted?'🔇':'🔊';
  });

  // ─── Initialization ────────────────────────────────────────────────────────
  canvas.width  = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  initStars();
  resetGame();
});
