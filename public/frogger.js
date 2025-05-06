(function() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.querySelector('.score');
    const livesElement = document.querySelector('.lives');
    
    // 16-bit style color palette
    const COLORS = {
        BACKGROUND: '#000000',
        ROAD: '#777777',
        WATER: '#002244',
        GRASS: '#008800',
        TOADER: '#00FF00',
        CAR: '#FF0000',
        LOG: '#8B4513',
        HOME: '#00FF00',
        POWER_UP: '#FF00FF',
        TEXT: '#00FF00',
        GLOW: '#00FF00'
    };

    // Custom sprites
    const SPRITES = {
        TOADER: {
            width: 20,
            height: 20,
            frames: [
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000',
                '00000000000000000000'
            ]
        }
    };

    // 16-bit style music
    const MUSIC = {
        background: `
            E3 E3 E3 E3 E3 E3 E3 E3
            E3 E3 E3 E3 E3 E3 E3 E3
            E3 E3 E3 E3 E3 E3 E3 E3
            E3 E3 E3 E3 E3 E3 E3 E3
        `
    };

    // Game constants
    const GRID = 40;
    const LANE_HEIGHT = GRID * 2;
    const NUM_LANES = 8;
    const NUM_LOGS = 5;
    const NUM_CARS = 5;
    const NUM_HOMES = 5;

    // Game state
    let toader, cars, logs, homes;
    let score = 0;
    let lives = 3;
    let gameStarted = false;
    let gamePaused = false;
    let particles = [];
    let powerUps = [];
    let lastTime = 0;

    // Power-up types
    const POWER_UPS = {
        SPEED: { color: COLORS.POWER_UP, effect: 'speed', duration: 5000, value: 2 },
        INVINCIBLE: { color: COLORS.POWER_UP, effect: 'invincible', duration: 5000, value: 1 }
    };

    // Initialize game
    function initializeGame() {
        toader = new Toader();
        cars = [];
        logs = [];
        homes = [];
        particles = [];
        powerUps = [];
        score = 0;
        lives = 3;
        scoreElement.textContent = `Score: ${score}`;
        livesElement.textContent = `Lives: ${lives}`;

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

    // Toader class
    class Toader {
        constructor() {
            this.x = canvas.width / 2;
            this.y = canvas.height - GRID;
            this.width = GRID;
            this.height = GRID;
            this.speed = GRID;
            this.invincible = false;
            this.invincibleTime = 0;
            this.frame = 0;
        }

        draw() {
            // Draw toader with 16-bit style
            ctx.fillStyle = COLORS.TOADER;
                  draw() {
            // Draw toader with 16-bit style
            ctx.fillStyle = COLORS.TOADER;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 - 2, 0, Math.PI * 2);
            ctx.fill();

            // Draw eyes
            ctx.fillStyle = COLORS.GLOW;
            ctx.beginPath();
            ctx.arc(this.x + this.width/4, this.y + this.height/3, 2, 0, Math.PI * 2);
            ctx.arc(this.x + this.width*3/4, this.y + this.height/3, 2, 0, Math.PI * 2);
            ctx.fill();

            // Draw tongue when jumping
            if (this.speed > GRID) {
                ctx.fillStyle = COLORS.GLOW;
                ctx.beginPath();
                ctx.moveTo(this.x + this.width/2, this.y + this.height/2);
                ctx.lineTo(this.x + this.width/2, this.y + this.height/2 + 10);
                ctx.stroke();
            }
        }

        move(dx, dy) {
            if (this.y + dy < 0 || this.y + dy > canvas.height - this.height) return;
            this.x += dx;
            this.y += dy;
            
            // Play jump sound
            const jumpSound = document.getElementById('jump-sound');
            if (jumpSound) {
                jumpSound.currentTime = 0;
                jumpSound.play();
            }
        }
    }

    // Car class
    class Car {
        constructor(x, y, speed) {
            this.x = x;
            this.y = y;
            this.width = GRID * 2;
            this.height = GRID;
            this.speed = speed;
            this.color = COLORS.CAR;
            this.frame = 0;
        }

        update() {
            this.x += this.speed;
            if (this.x < -this.width || this.x > canvas.width) {
                this.x = this.speed > 0 ? -this.width : canvas.width;
            }
        }

        draw() {
            // Draw car with 16-bit style
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Draw wheels
            ctx.fillStyle = COLORS.GLOW;
            ctx.beginPath();
            ctx.arc(this.x + GRID/2, this.y + this.height, 4, 0, Math.PI * 2);
            ctx.arc(this.x + GRID*3/2, this.y + this.height, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Log class
    class Log {
        constructor(x, y, speed) {
            this.x = x;
            this.y = y;
            this.width = GRID * 3;
            this.height = GRID;
            this.speed = speed;
            this.color = COLORS.LOG;
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

            // Draw wood texture
            ctx.fillStyle = COLORS.GLOW;
            for (let i = 0; i < this.width; i += 10) {
                ctx.fillRect(this.x + i, this.y + this.height/2, 2, 2);
            }
        }
    }

    // Home class
    class Home {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = GRID;
            this.height = GRID;
            this.occupied = false;
            this.color = COLORS.HOME;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Draw roof
            ctx.fillStyle = COLORS.GLOW;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width/2, this.y - this.height/2);
            ctx.fill();
        }
    }

    // Game loop
    function gameLoop() {
        if (!gameStarted) return;
        const now = Date.now();
        const delta = now - lastTime;
        lastTime = now;

        update(delta);
        draw();
        window.requestAnimationFrame(gameLoop);
    }

    function update(delta) {
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
            if (toader.x < powerUp.x + GRID && 
                toader.x + GRID > powerUp.x &&
                toader.y < powerUp.y + GRID &&
                toader.y + GRID > powerUp.y) {
                applyPowerUp(powerUp);
                powerUps.splice(i, 1);
            }
        });

        // Check for car collisions
        cars.forEach(car => {
            if (toader.x < car.x + car.width && 
                toader.x + toader.width > car.x &&
                toader.y < car.y + car.height &&
                toader.y + toader.height > car.y) {
                if (!toader.invincible) {
                    const hitSound = document.getElementById('hit-sound');
                    if (hitSound) {
                        hitSound.currentTime = 0;
                        hitSound.play();
                    }
                    lives--;
                    livesElement.textContent = `Lives: ${lives}`;
                    if (lives <= 0) {
                        gameOver();
                    } else {
                        resetToader();
                    }
                }
            }
        });

        // Check for log collisions and movement
        let onLog = false;
        logs.forEach(log => {
            if (toader.x < log.x + log.width && 
                toader.x + toader.width > log.x &&
                toader.y < log.y + log.height &&
                toader.y + toader.height > log.y) {
                onLog = true;
                toader.x += log.speed;
            }
        });

        // If not on log, check for water collision
        if (!onLog && toader.y < canvas.height / 2) {
            if (!toader.invincible) {
                const hitSound = document.getElementById('hit-sound');
                if (hitSound) {
                    hitSound.currentTime = 0;
                    hitSound.play();
                }
                lives--;
                livesElement.textContent = `Lives: ${lives}`;
                if (lives <= 0) {
                    gameOver();
                } else {
                    resetToader();
                }
            }
        }

        // Check for home collisions
        homes.forEach(home => {
            if (!home.occupied && 
                toader.x < home.x + home.width && 
                toader.x + toader.width > home.x &&
                toader.y < home.y + home.height &&
                // Initialize audio
const backgroundMusic = document.getElementById('background-music');
if (backgroundMusic) {
    // Create 16-bit style chiptune music
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    
    // Add pulsing effect
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create pulse wave
    const pulse = audioContext.createOscillator();
    pulse.type = 'square';
    pulse.frequency.setValueAtTime(1, audioContext.currentTime);
    pulse.connect(gainNode.gain);
    pulse.start();
}

// Initialize game
canvas.width = 800;
canvas.height = 600;
initializeGame();

// Add power-up spawning
function spawnPowerUp() {
    if (Math.random() < 0.01) {
        const type = Object.keys(POWER_UPS)[Math.floor(Math.random() * Object.keys(POWER_UPS).length)];
        const powerUp = {
            x: Math.floor(Math.random() * (canvas.width / GRID)) * GRID,
            y: Math.floor(Math.random() * (canvas.height / GRID)) * GRID,
            type: type,
            startTime: Date.now(),
            color: COLORS.POWER_UP
        };
        powerUps.push(powerUp);
    }
}

// Add particle effects
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

// Add screen shake effect
function shakeScreen() {
    const shakeAmount = 5;
    const shakeDuration = 100;
    const startTime = Date.now();
    
    function shake() {
        const elapsed = Date.now() - startTime;
        if (elapsed < shakeDuration) {
            const shakeX = Math.random() * shakeAmount - shakeAmount/2;
            const shakeY = Math.random() * shakeAmount - shakeAmount/2;
            ctx.translate(shakeX, shakeY);
            requestAnimationFrame(shake);
        } else {
            ctx.translate(0, 0);
        }
    }
    shake();
}

// Add 16-bit style effects
function drawEffects() {
    // Scanlines
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    for (let i = 0; i < canvas.height; i += 2) {
        ctx.fillRect(0, i, canvas.width, 1);
    }
    
    // Glitch effect
    if (Math.random() < 0.01) {
        const glitchX = Math.random() * canvas.width;
        const glitchY = Math.random() * canvas.height;
        ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.fillRect(glitchX, glitchY, 10, 10);
    }
}

// Update game loop
function gameLoop() {
    if (!gameStarted) return;
    const now = Date.now();
    const delta = now - lastTime;
    lastTime = now;

    update(delta);
    draw();
    spawnPowerUp();
    updateParticles();
    drawEffects();
    requestAnimationFrame(gameLoop);
}

// Add touch controls with better responsiveness
canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Create particle effect on touch
    createParticle(x, y, COLORS.GLOW);
});

// Add game over screen with 16-bit style
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw game over text with scanlines
    ctx.fillStyle = COLORS.GLOW;
    ctx.font = '40px Press Start 2P';
    ctx.textAlign = 'center';
    for (let i = 0; i < 10; i++) {
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 + (i - 5));
    }
    
    // Draw score
    ctx.font = '20px Press Start 2P';
    ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 + 50);
}

// Add power-up effects
function applyPowerUp(powerUp) {
    const effect = POWER_UPS[powerUp.type];
    switch(effect.effect) {
        case 'speed':
            toader.speed += effect.value;
            createParticle(toader.x, toader.y, COLORS.GLOW);
            shakeScreen();
            break;
        case 'invincible':
            toader.invincible = true;
            toader.invincibleTime = Date.now();
            createParticle(toader.x, toader.y, COLORS.GLOW);
            shakeScreen();
            break;
    }
}

// Add particle system
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

// Add score multiplier system
let scoreMultiplier = 1;
function updateScore(points) {
    score += points * scoreMultiplier;
    scoreElement.textContent = `Score: ${score}`;
    
    // Increase multiplier for consecutive points
    scoreMultiplier = Math.min(5, scoreMultiplier + 1);
    
    // Create score multiplier particle
    createParticle(toader.x, toader.y, COLORS.GLOW);
}

// Add level system
let level = 1;
function updateLevel() {
    if (score >= level * 1000) {
        level++;
        levelElement.textContent = `Level: ${level}`;
        
        // Increase difficulty
        cars.forEach(car => car.speed *= 1.1);
        logs.forEach(log => log.speed *= 1.1);
        
        // Create level up particle effect
        shakeScreen();
        createParticle(canvas.width/2, canvas.height/2, COLORS.GLOW);
    }
}

// Add game state management
function resetGame() {
    gameStarted = false;
    gamePaused = false;
    score = 0;
    lives = 3;
    level = 1;
    scoreMultiplier = 1;
    scoreElement.textContent = `Score: ${score}`;
    livesElement.textContent = `Lives: ${lives}`;
    levelElement.textContent = `Level: ${level}`;
      // Reset all game elements
    toader = new Toader();
    cars = [];
    logs = [];
    homes = [];
    particles = [];
    powerUps = [];
    
    // Reinitialize game elements
    for (let i = 0; i < NUM_LANES; i++) {
        const y = i * LANE_HEIGHT;
        if (i < NUM_LANES / 2) {
            for (let j = 0; j < NUM_CARS; j++) {
                const x = Math.random() * canvas.width;
                const speed = (i % 2 === 0 ? 1 : -1) * (i + 1) * 2;
                cars.push(new Car(x, y, speed));
            }
        } else {
            for (let j = 0; j < NUM_LOGS; j++) {
                const x = Math.random() * canvas.width;
                const speed = (i % 2 === 0 ? 1 : -1) * (i + 1) * 2;
                logs.push(new Log(x, y, speed));
            }
        }
    }
    
    // Reset homes
    for (let i = 0; i < NUM_HOMES; i++) {
        const x = i * (canvas.width / NUM_HOMES);
        const y = 0;
        homes.push(new Home(x, y));
    }
    
    // Reset power-ups
    powerUps = [];
    
    // Reset game state
    gameStarted = true;
    gamePaused = false;
    score = 0;
    lives = 3;
    level = 1;
    scoreMultiplier = 1;
    
    // Reset UI elements
    scoreElement.textContent = `Score: ${score}`;
    livesElement.textContent = `Lives: ${lives}`;
    levelElement.textContent = `Level: ${level}`;
    
    // Reset audio
    if (backgroundMusic) {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(() => {});
    }
}

// Add game over handling
function gameOver() {
    gamePaused = true;
    const backgroundMusic = document.getElementById('background-music');
    if (backgroundMusic) {
        backgroundMusic.muted = true;
    }
    
    // Create game over particle effect
    for (let i = 0; i < 50; i++) {
        createParticle(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            COLORS.TEXT
        );
    }
    
    // Shake screen
    shakeScreen();
}

// Add touch controls with improved responsiveness
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Calculate movement direction
    const dx = x - toader.x;
    const dy = y - toader.y;
    
    // Move toader
    if (Math.abs(dx) > Math.abs(dy)) {
        toader.move(dx > 0 ? GRID : -GRID, 0);
    } else {
        toader.move(0, dy > 0 ? GRID : -GRID);
    }
});

// Add keyboard controls with improved responsiveness
window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !gameStarted) {
        startGame();
    } else if (e.key === ' ' && lives <= 0) {
        resetGame();
    } else if (gameStarted && !gamePaused) {
        switch(e.key) {
            case 'ArrowUp':
                toader.move(0, -GRID);
                break;
            case 'ArrowDown':
                toader.move(0, GRID);
                break;
            case 'ArrowLeft':
                toader.move(-GRID, 0);
                break;
            case 'ArrowRight':
                toader.move(GRID, 0);
                break;
        }
    }
});

// Add mouse controls
canvas.addEventListener('mousemove', (e) => {
    if (!gameStarted || gamePaused) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate movement direction
    const dx = x - toader.x;
    const dy = y - toader.y;
    
    // Move toader
    if (Math.abs(dx) > Math.abs(dy)) {
        toader.move(dx > 0 ? GRID : -GRID, 0);
    } else {
        toader.move(0, dy > 0 ? GRID : -GRID);
    }
});

// Add game window resizing
window.addEventListener('resize', () => {
    canvas.width = 800;
    canvas.height = 600;
    initializeGame();
});

// Initialize game
initializeGame();