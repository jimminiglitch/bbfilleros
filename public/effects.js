// Particle System
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.className = 'particle-canvas';
    document.body.appendChild(this.canvas);
    this.resizeCanvas();
    
    window.addEventListener('resize', () => this.resizeCanvas());
    requestAnimationFrame(() => this.update());
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createParticle(x, y, color = 'var(--neon-cyan)') {
    const particle = {
      x,
      y,
      size: Math.random() * 5 + 2,
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      opacity: 1,
      color
    };
    this.particles.push(particle);
  }
  
  update() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles = this.particles.filter(p => {
      p.opacity -= 0.05;
      p.x += p.speedX;
      p.y += p.speedY;
      
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
      this.ctx.fill();
      
      return p.opacity > 0;
    });
    
    requestAnimationFrame(() => this.update());
  }
}

// Screen Ripple Effect
class RippleEffect {
  constructor() {
    this.ripples = [];
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.className = 'ripple-canvas';
    document.body.appendChild(this.canvas);
    this.resizeCanvas();
    
    window.addEventListener('resize', () => this.resizeCanvas());
    requestAnimationFrame(() => this.update());
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createRipple(x, y) {
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: Math.min(window.innerWidth, window.innerHeight) * 0.1,
      opacity: 0.5
    });
  }
  
  update() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ripples = this.ripples.filter(ripple => {
      ripple.radius += ripple.maxRadius * 0.02;
      ripple.opacity -= 0.02;
      
      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(169, 161, 255, ${ripple.opacity})`;
      this.ctx.fill();
      
      return ripple.opacity > 0;
    });
    
    requestAnimationFrame(() => this.update());
  }
}

// Window Animation System
class WindowAnimations {
  constructor() {
    this.windows = new Set();
  }
  
  addWindow(windowElement) {
    this.windows.add(windowElement);
    windowElement.addEventListener('click', () => this.animateWindow(windowElement));
  }
  
  animateWindow(windowElement) {
    const rect = windowElement.getBoundingClientRect();
    const particles = new ParticleSystem();
    
    // Create particles around window edges
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const distance = Math.random() * 50 + 20;
      particles.createParticle(
        rect.left + rect.width /2 + Math.cos(angle) * distance,
        rect.top + rect.height/2 + Math.sin(angle) * distance
      );
    }
  }
}

// Screen Effects
class ScreenEffects {
  constructor() {
    this.scanlines = document.querySelector('.scanlines');
    this.scanlineCanvas = document.createElement('canvas');
    this.scanlineCtx = this.scanlineCanvas.getContext('2d');
    this.resizeCanvas();
    
    window.addEventListener('resize', () => this.resizeCanvas());
    requestAnimationFrame(() => this.update());
  }
  
  resizeCanvas() {
    this.scanlineCanvas.width = window.innerWidth;
    this.scanlineCanvas.height = window.innerHeight;
    this.scanlineCanvas.style.position = 'fixed';
    this.scanlineCanvas.style.top = '0';
    this.scanlineCanvas.style.left = '0';
    this.scanlineCanvas.style.zIndex = '-1';
    this.scanlineCanvas.style.pointerEvents = 'none';
    document.body.appendChild(this.scanlineCanvas);
  }
  
  update() {
    this.scanlineCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.scanlineCtx.fillRect(0, 0, this.scanlineCanvas.width, this.scanlineCanvas.height);
    
    // Draw scanlines
    for (let y = 0; y < this.scanlineCanvas.height; y += 3) {
      const opacity = Math.sin(y * 0.05 + Date.now() * 0.001) * 0.1 + 0.1;
      this.scanlineCtx.fillStyle = `rgba(169, 161, 255, ${opacity})`;
      this.scanlineCtx.fillRect(0, y, this.scanlineCanvas.width, 1);
    }
    
    requestAnimationFrame(() => this.update());
  }
}

// Window Snapping System
class WindowSnapping {
  constructor() {
    this.snapDistance = 20;
    this.snapAreas = [
      { type: 'top', y: 0 },
      { type: 'bottom', y: window.innerHeight - 100 },
      { type: 'left', x: 0 },
      { type: 'right', x: window.innerWidth - 100 }
    ];
  }
  
  snapWindow(windowElement) {
    const rect = windowElement.getBoundingClientRect();
    const snapped = {};
    
    // Check horizontal snapping
    if (Math.abs(rect.left) < this.snapDistance) {
      snapped.x = 0;
    } else if (Math.abs(rect.right - window.innerWidth) < this.snapDistance) {
      snapped.x = window.innerWidth - rect.width;
    }
    
    // Check vertical snapping
    if (Math.abs(rect.top) < this.snapDistance) {
      snapped.y = 0;
    } else if (Math.abs(rect.bottom - window.innerHeight) < this.snapDistance) {
      snapped.y = window.innerHeight - rect.height;
    }
    
    if (Object.keys(snapped).length > 0) {
      windowElement.style.left = snapped.x ? `${snapped.x}px` : rect.left + 'px';
      windowElement.style.top = snapped.y ? `${snapped.y}px` : rect.top + 'px';
      return true;
    }
    
    return false;