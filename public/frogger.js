(function() {
    // Constants and Setup
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
    let scoreMultiplier = 1;
    let level = 1;

    // Power-up types
    const POWER_UPS = {
        SPEED: { color: COLORS.POWER_UP, effect: 'speed', duration: 5000, value: 2 },
        INVINCIBLE: { color: COLORS.POWER_UP, effect: 'invincible', duration: 5000, value: 1 }
    };

    // Classes
    class Toader {
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
            ctx.fillStyle = COLORS.TOADER;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 - 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = COLORS.GLOW;
            ctx.beginPath();
            ctx.arc(this.x + this.width/4, this.y + this.height/3, 2, 0, Math.PI * 2);
            ctx.arc(this.x + this.width*3/4, this.y + this.height/3, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        move(dx, dy) {
            if (this.y + dy < 0 || this.y + dy > canvas.height - this.height) return;
            this.x += dx;
            this.y += dy;
        }
    }

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
        scoreMultiplier = 1;
        level = 1;

        // Initialize UI
        scoreElement.textContent = `Score: ${score}`;
        livesElement.textContent = `Lives: ${lives}`;

        // Create game elements
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

        for (let i = 0; i < NUM_HOMES; i++) {
            const x = i * (canvas.width / NUM_HOMES);
            const y = 0;
            homes.push(new Home(x, y));
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

    // Start game
    function startGame() {
        gameStarted = true;
        const backgroundMusic = document.getElementById('background-music');
        if (backgroundMusic) {
            backgroundMusic.play().catch(() => {});
        }
        gameLoop();
    }

    // Event listeners
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

    // Initialize
    canvas.width = 800;
    canvas.height = 600;
    initializeGame();
})();
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
            toader.y + toader.height > home.y) {
            score += 100;
            scoreElement.textContent = `Score: ${score}`;
            home.occupied = true;
            createParticle(toader.x, toader.y, COLORS.GLOW);
            resetToader();
        }
    });

    // Update score multiplier
    updateScore(0);
    updateLevel();
}

// Draw game
function draw() {
    // Clear canvas with 16-bit style
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lanes with 16-bit style
    for (let i = 0; i < NUM_LANES; i++) {
        const y = i * LANE_HEIGHT;
        if (i < NUM_LANES / 2) {
            // Draw road
            ctx.fillStyle = COLORS.ROAD;
            ctx.fillRect(0, y, canvas.width, LANE_HEIGHT);
        } else {
            // Draw water
            ctx.fillStyle = COLORS.WATER;
            ctx.fillRect(0, y, canvas.width, LANE_HEIGHT);
        }
    }

    // Draw grass at top and bottom
    ctx.fillStyle = COLORS.GRASS;
    ctx.fillRect(0, 0, canvas.width, GRID);
    ctx.fillRect(0, canvas.height - GRID, canvas.width, GRID);

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
    });

    // Draw toader
    toader.draw();

    // Draw particles
    particles.forEach(particle => {
        ctx.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw effects
    drawEffects();
}

// Apply power-ups
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

// Reset toader position
function resetToader() {
    toader.x = canvas.width / 2;
    toader.y = canvas.height - GRID;
    toader.speed = GRID;
    toader.invincible = false;
    toader.invincibleTime = 0;
}
// Game over handling
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
    
    // Draw game over screen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = COLORS.GLOW;
    ctx.font = '40px Press Start 2P';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
    
    ctx.font = '20px Press Start 2P';
    ctx.fillText('Press SPACE to Restart', canvas.width/2, canvas.height/2 + 40);
}

// Reset game state
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
    
    // Reset audio
    const backgroundMusic = document.getElementById('background-music');
    if (backgroundMusic) {
        backgroundMusic.currentTime = 0;
        backgroundMusic.muted = false;
        backgroundMusic.play().catch(() => {});
    }
}

// Add touch controls
canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Create particle effect on touch
    createParticle(x, y, COLORS.GLOW);
});

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