// toader.js - Fully working simplified Frogger/Toader game

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.querySelector('.score');
const livesElement = document.querySelector('.lives');

canvas.width = 800;
canvas.height = 600;

const GRID = 40;
let score = 0;
let lives = 3;

class Toader {
  constructor() {
    this.x = canvas.width / 2 - GRID / 2;
    this.y = canvas.height - GRID;
    this.width = GRID;
    this.height = GRID;
    this.color = '#00FF00';
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  move(dx, dy) {
    this.x = Math.min(canvas.width - GRID, Math.max(0, this.x + dx));
    this.y = Math.min(canvas.height - GRID, Math.max(0, this.y + dy));
    document.getElementById('jump-sound').play();
  }
}

class Car {
  constructor(y, speed) {
    this.x = Math.random() * canvas.width;
    this.y = y;
    this.width = GRID * 2;
    this.height = GRID;
    this.speed = speed;
    this.color = '#FF0000';
  }

  update() {
    this.x += this.speed;
    if (this.speed > 0 && this.x > canvas.width) this.x = -this.width;
    if (this.speed < 0 && this.x < -this.width) this.x = canvas.width;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

const toader = new Toader();
const cars = [];

// Create rows of cars
for (let i = 1; i <= 5; i++) {
  let y = canvas.height - GRID * (i + 1);
  let speed = (i % 2 === 0 ? 2 : -2);
  for (let j = 0; j < 3; j++) {
    cars.push(new Car(y, speed));
  }
}

function resetToader() {
  toader.x = canvas.width / 2 - GRID / 2;
  toader.y = canvas.height - GRID;
}

function updateGame() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw safe zones
  ctx.fillStyle = '#444';
  ctx.fillRect(0, 0, canvas.width, GRID); // top
  ctx.fillRect(0, canvas.height - GRID, canvas.width, GRID); // bottom

  cars.forEach(car => {
    car.update();
    car.draw();

    if (toader.x < car.x + car.width && toader.x + toader.width > car.x &&
        toader.y < car.y + car.height && toader.y + toader.height > car.y) {
      lives--;
      livesElement.textContent = `Lives: ${lives}`;
      document.getElementById('hit-sound').play();
      resetToader();
      if (lives <= 0) {
        alert('Game Over!');
        location.reload();
      }
    }
  });

  toader.draw();

  // Winning logic
  if (toader.y <= GRID) {
    score += 10;
    scoreElement.textContent = `Score: ${score}`;
    resetToader();
  }

  requestAnimationFrame(updateGame);
}

// Control setup
window.addEventListener('keydown', e => {
  switch (e.key) {
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
});

// Start background music on first user interaction
let musicStarted = false;
window.addEventListener('keydown', () => {
  if (!musicStarted) {
    document.getElementById('background-music').volume = 0.5;
    document.getElementById('background-music').play().catch(e => console.log(e));
    musicStarted = true;
  }
}, { once: true });

// Start game loop
updateGame();
