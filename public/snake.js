//─────────────────────────────────────────────────────────────────────────────
// spaceworm.js
//─────────────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  // ─── Elements ─────────────────────────────────────────────────────────────
  const startOverlay    = document.getElementById('start-overlay');
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const playButton      = document.getElementById('snake-play-button');
  const submitButton    = document.getElementById('submit-score');
  const nameInput       = document.getElementById('name-input');
  const finalScoreEl    = document.getElementById('final-score');
  const highScoresList  = document.getElementById('high-scores-list');
  const playAgainBtn    = document.getElementById('play-again-button');

  const canvas          = document.getElementById('snake-canvas');
  const ctx             = canvas.getContext('2d');
  const ui              = {
    score:  document.getElementById('snake-score'),
    level:  document.getElementById('snake-level'),
    best:   document.getElementById('snake-best'),
    status: document.getElementById('snake-status'),
  };
  const music           = document.getElementById('snake-music');
  const muteButton      = document.getElementById('mute-button');
  const touchControls   = document.getElementById('touch-controls');

  // ─── Web Audio for Effects ─────────────────────────────────────────────────
  const audioCtx   = new (window.AudioContext||window.webkitAudioContext)();
  let eatBuffer, powerBuffer;
  const eatURL     = 'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/power-up-type-1-230548.mp3?v=1746542171704';
  const powerURL   = 'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/coin-upaif-14631.mp3?v=1746542174524';

  async function loadSound(url) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return audioCtx.decodeAudioData(buf);
  }
  Promise.all([ loadSound(eatURL), loadSound(powerURL) ])
         .then(([e,p])=>{ eatBuffer=e; powerBuffer=p; });

  function playEffect(buffer) {
    if (!buffer) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(audioCtx.destination);
    src.start();
  }

  // ─── Starfield Setup ───────────────────────────────────────────────────────
  const starsCount = 200;
  let stars = [];
  function initStars() {
    stars = Array.from({length:starsCount}, ()=>({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      z: Math.random()*canvas.width,
      o: Math.random()
    }));
  }

  function drawStars() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    for (let s of stars) {
      s.z -= 4;
      if (s.z <= 0) {
        s.z = canvas.width;
        s.x = Math.random()*canvas.width;
        s.y = Math.random()*canvas.height;
      }
      const k = 128.0/s.z;
      const px = (s.x - canvas.width/2)*k + canvas.width/2;
      const py = (s.y - canvas.height/2)*k + canvas.height/2;
      const sz = Math.max(0, (1 - s.z/canvas.width)*3);
      ctx.globalAlpha = s.o;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(px,py,sz,0,2*Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ─── State ─────────────────────────────────────────────────────────────────
  const GRID = 20;
  let cols, rows;
  let snake, dx, dy, apple;
  let baseSpeed, speed, score, level, best;
  let paused, gameOver, started, hueOffset, screenShake;
  let powerUps, particles;
  let frameAcc=0, lastTime=0;

  const HIGH_SCORES_KEY = 'snakeHighScores';
  const MAX_HIGH_SCORES = 7;
  const POWER_UPS = {
    SPEED:      { color:'cyan',    effect:'speed',      duration:5000, value:2 },
    GROW:       { color:'magenta', effect:'grow',       duration:3000, value:3 },
    INVINCIBLE: { color:'yellow',  effect:'invincible', duration:5000, value:0 }
  };

  // ─── Resize & Init ─────────────────────────────────────────────────────────
  function resize() {
    const field = document.getElementById('game-field');
    canvas.width  = field.clientWidth;
    canvas.height = field.clientHeight;
    initStars();
  }
  window.addEventListener('resize', resize);
  resize();

  // ─── High-score helpers ────────────────────────────────────────────────────
  function loadHighScores(){const j=localStorage.getItem(HIGH_SCORES_KEY);return j?JSON.parse(j):[];}
  function saveHighScores(l){localStorage.setItem(HIGH_SCORES_KEY,JSON.stringify(l));}
  function displayHighScores(){
    highScoresList.innerHTML=loadHighScores()
      .map(h=>`<li>${h.name}: ${h.score}</li>`).join('');
  }
  function addHighScore(n,s){
    const l=loadHighScores();l.push({name:n,score:s});l.sort((a,b)=>b.score-a.score);
    saveHighScores(l.slice(0,MAX_HIGH_SCORES));
  }

  // ─── Game helpers ──────────────────────────────────────────────────────────
  function placeApple(){
    do {
      apple={x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*rows)};
    } while (
      snake.some(s=>s.x===apple.x&&s.y===apple.y) ||
      powerUps.some(p=>p.x===apple.x&&p.y===apple.y)
    );
  }

  function createPowerUp(){
    const t=Object.keys(POWER_UPS);
    const k=t[Math.floor(Math.random()*t.length)];
    const d=POWER_UPS[k];
    powerUps.push({x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*rows),
                   type:k,color:d.color,duration:d.duration,start:Date.now()});
  }

  function createParticle(x,y,c){
    particles.push({x:x*GRID+GRID/2,y:y*GRID+GRID/2,
                    size:Math.random()*4+2,
                    vx:(Math.random()-0.5)*2,vy:(Math.random()-0.5)*2,
                    color:c,alpha:1});
  }

  function updateParticles(){
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.x+=p.vx;p.y+=p.vy;p.alpha-=0.02;
      if(p.alpha<=0)particles.splice(i,1);
    }
  }

  function applyPowerUp(pu){
    const d=POWER_UPS[pu.type];
    switch(d.effect){
      case 'speed':
        speed=baseSpeed*2;createParticle(snake[0].x,snake[0].y,d.color);break;
      case 'grow':
        for(let i=0;i<d.value;i++){
          const t=snake[snake.length-1];snake.push({x:t.x,y:t.y});
        }
        createParticle(snake[0].x,snake[0].y,d.color);break;
      case 'invincible':
        snake.invincible=true;setTimeout(()=>snake.invincible=false,d.duration);
        createParticle(snake[0].x,snake[0].y,d.color);break;
    }
  }

  // ─── Update & Draw ─────────────────────────────────────────────────────────
  function update(delta){
    if(!started||paused||gameOver)return;
    frameAcc+=delta;const interval=1000/speed;
    if(frameAcc<interval)return;frameAcc=0;

    powerUps=powerUps.filter(pu=>Date.now()-pu.start<pu.duration);
    if(Math.random()<0.01)createPowerUp();

    const head={x:snake[0].x+dx,y:snake[0].y+dy};snake.unshift(head);

    powerUps.forEach((pu,i)=>{
      if(head.x===pu.x&&head.y===pu.y){
        playEffect(powerBuffer);applyPowerUp(pu);powerUps.splice(i,1);
      }
    });

    if(head.x===apple.x&&head.y===apple.y){
      playEffect(eatBuffer);score+=10;ui.score.textContent=`Score: ${score}`;
      if(score>best){best=score;localStorage.setItem('snakeBest',best);
        ui.best.textContent=`Best: ${best}`;}
      for(let i=0;i<12;i++)createParticle(apple.x,apple.y,'magenta');
      if(score%50===0){
        level++;ui.level.textContent=`Level: ${level}`;
        for(let i=0;i<12;i++)createParticle(head.x,head.y,'cyan');
      }
      placeApple();
    } else snake.pop();

    if(!snake.invincible){
      if(head.x<0||head.y<0||head.x>=cols||head.y>=rows||
         snake.slice(1).some(s=>s.x===head.x&&s.y===head.y)){
        gameOver=true;ui.status.textContent='Game Over';
        finalScoreEl.textContent=`Your score: ${score}`;showGameOver();
        music.pause();music.currentTime=0;
        for(let i=0;i<20;i++)createParticle(head.x,head.y,'red');
      }
    }
  }

  function draw(){
    if(!started)return;
    ctx.save();
    ctx.translate(screenShake,screenShake);

    // 1) draw starfield
    drawStars();

    // 2) translucent overlay
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // 3) particles
    particles.forEach(p=>{
      ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;
      ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,2*Math.PI);ctx.fill();
    });
    ctx.globalAlpha=1;

    // 4) power-ups
    powerUps.forEach(pu=>{
      ctx.fillStyle=pu.color;
      ctx.fillRect(pu.x*GRID,pu.y*GRID,GRID-2,GRID-2);
      ctx.fillStyle='black';ctx.font='10px Press Start 2P';
      ctx.fillText(pu.type[0],pu.x*GRID+2,pu.y*GRID+14);
    });

    // 5) apple pulse
    const pulse=Math.sin(Date.now()/300)*10;
    ctx.fillStyle=`hsl(300,100%,${50+pulse}%)`;
    ctx.fillRect(apple.x*GRID,apple.y*GRID,GRID-2,GRID-2);

    // 6) snake
    snake.forEach((seg,i)=>{
      const hue=(hueOffset+i*10+level*20)%360;
      ctx.fillStyle=`hsl(${hue},100%,50%)`;
      ctx.fillRect(seg.x*GRID,seg.y*GRID,GRID-2,GRID-2);
    });

    ctx.restore();
    screenShake=0;
    hueOffset=(hueOffset+1+level)%360;
  }

  function loop(ts){if(!lastTime)lastTime=ts;
    const delta=ts-lastTime;lastTime=ts;
    update(delta);draw();updateParticles();
    requestAnimationFrame(loop);
  }

  // ─── Controls & UI ─────────────────────────────────────────────────────────
  function resetGame(){
    music.pause();music.currentTime=0;
    cols=Math.floor(canvas.width/GRID);
    rows=Math.floor(canvas.height/GRID);
    snake=[{x:Math.floor(cols/2),y:Math.floor(rows/2)}];
    dx=1;dy=0;
    baseSpeed=5;speed=baseSpeed;
    score=0;level=1;paused=false;gameOver=false;started=false;
    hueOffset=0;screenShake=0;powerUps=[];particles=[];
    ui.score.textContent='Score: 0';
    ui.level.textContent='Level: 1';
    best=Number(localStorage.getItem('snakeBest')||'0');
    ui.best.textContent=`Best: ${best}`;
    ui.status.textContent='Running';
    startOverlay.classList.remove('hidden');
    gameOverOverlay.classList.add('hidden');
    displayHighScores();placeApple();
  }

  function startGame(){
    audioCtx.resume();
    started=true;startOverlay.classList.add('hidden');
    music.play().catch(()=>{});
    requestAnimationFrame(loop);
  }

  function showGameOver(){gameOverOverlay.classList.remove('hidden');}

  // bind
  playButton.addEventListener('click',startGame);
  submitButton.addEventListener('click',()=>{
    const n=nameInput.value.trim()||'ANON';
    addHighScore(n,score);displayHighScores();
    submitButton.disabled=true;nameInput.disabled=true;
  });
  playAgainBtn.addEventListener('click',()=>{resetGame();startGame();});

  window.addEventListener('keydown',e=>{
    if(!started)return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
    if(e.key===' '){
      paused=!paused;ui.status.textContent=paused?'Paused':'Running';
      paused?music.pause():music.play().catch(()=>{});
      return;
    }
    if(paused||gameOver)return;
    switch(e.key){
      case 'ArrowUp':    if(dy===0){dx=0;dy=-1;} break;
      case 'ArrowDown':  if(dy===0){dx=0;dy=1;}  break;
      case 'ArrowLeft':  if(dx===0){dx=-1;dy=0;} break;
      case 'ArrowRight': if(dx===0){dx=1;dy=0;}  break;
    }
    // speed up when arrow held
    if(e.key.startsWith('Arrow')) speed = baseSpeed * 2;
  });

  window.addEventListener('keyup', e => {
    if (e.key.startsWith('Arrow')) speed = baseSpeed;
  });

  touchControls.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('touchstart',()=>{
      const d=btn.dataset.dir;
      if(d==='up'   && dy===0){dx=0;dy=-1;}
      if(d==='down' && dy===0){dx=0;dy=1;}
      if(d==='left' && dx===0){dx=-1;dy=0;}
      if(d==='right'&& dx===0){dx=1;dy=0;}
      speed = baseSpeed * 2;
    });
    btn.addEventListener('touchend',()=>{ speed = baseSpeed; });
  });

  muteButton.addEventListener('click',()=>{
    music.muted = !music.muted;
    muteButton.textContent = music.muted?'🔇':'🔊';
  });

  // initialize
  best = Number(localStorage.getItem('snakeBest')||'0');
  displayHighScores();
  resetGame();
});
