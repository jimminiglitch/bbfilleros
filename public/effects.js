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
    
    // Window Manager
class WindowManager {
  constructor() {
    this.windows = new Set();
    this.currentZIndex = 10;
    this.windowStack = [];
  }
  
  addWindow(windowElement) {
    this.windows.add(windowElement);
    windowElement.addEventListener('click', () => this.bringToFront(windowElement));
    windowElement.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-header')) {
        this.startDragging(windowElement);
      }
    });
  }
  
  bringToFront(windowElement) {
    windowElement.style.zIndex = ++this.currentZIndex;
    this.windowStack = this.windowStack.filter(win => win !== windowElement);
    this.windowStack.push(windowElement);
  }
  
  startDragging(windowElement) {
    let isDragging = false;
    let startX, startY;
    let startLeft, startTop;
    
    const onMouseDown = (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(windowElement.style.left) || 0;
      startTop = parseInt(windowElement.style.top) || 0;
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    
    const onMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      windowElement.style.left = `${startLeft + deltaX}px`;
      windowElement.style.top = `${startTop + deltaY}px`;
      
      // Check for snapping
      const rect = windowElement.getBoundingClientRect();
      const snapDistance = 20;
      
      // Snap to edges
      if (Math.abs(rect.left) < snapDistance) {
        windowElement.style.left = '0px';
      } else if (Math.abs(rect.right - window.innerWidth) < snapDistance) {
        windowElement.style.left = `${window.innerWidth - rect.width}px`;
      }
      
      if (Math.abs(rect.top) < snapDistance) {
        windowElement.style.top = '0px';
      } else if (Math.abs(rect.bottom - window.innerHeight) < snapDistance) {
        windowElement.style.top = `${window.innerHeight - rect.height}px`;
      }
      
      // Snap to other windows
      this.windows.forEach(other => {
        if (other === windowElement) return;
        
        const otherRect = other.getBoundingClientRect();
        
        // Snap to left edge of other window
        if (Math.abs(rect.right - otherRect.left) < snapDistance) {
          windowElement.style.left = `${otherRect.left - rect.width}px`;
        }
        
        // Snap to right edge of other window
        if (Math.abs(rect.left - otherRect.right) < snapDistance) {
          windowElement.style.left = `${otherRect.right}px`;
        }
        
        // Snap to top edge of other window
        if (Math.abs(rect.bottom - otherRect.top) < snapDistance) {
          windowElement.style.top = `${otherRect.top - rect.height}px`;
        }
        
        // Snap to bottom edge of other window
        if (Math.abs(rect.top - otherRect.bottom) < snapDistance) {
          windowElement.style.top = `${otherRect.bottom}px`;
        }
      });
    };
    
    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    windowElement.addEventListener('mousedown', onMouseDown);
  }
  
  maximizeWindow(windowElement) {
    const rect = windowElement.getBoundingClientRect();
    const margin = 20;
    
    windowElement.style.width = `${window.innerWidth - margin * 2}px`;
    windowElement.style.height = `${window.innerHeight - margin * 2}px`;
    windowElement.style.left = `${margin}px`;
    windowElement.style.top = `${margin}px`;
  }
  
  minimizeWindow(windowElement) {
    const rect = windowElement.getBoundingClientRect();
    windowElement.style.width = '200px';
    windowElement.style.height = '100px';
    windowElement.style.left = `${rect.left}px`;
    windowElement.style.top = `${rect.top}px`;
  }
  
  closeWindow(windowElement) {
    windowElement.style.display = 'none';
    this.windows.delete(windowElement);
    this.windowStack = this.windowStack.filter(win => win !== windowElement);
  }
}

// Selection Box
class SelectionBox {
  constructor() {
    this.selectionRect = document.createElement('div');
    this.selectionRect.id = 'selection-rect';
    document.body.appendChild(this.selectionRect);
    
    this.startX = 0;
    this.startY = 0;
    this.isSelecting = false;
    
    document.addEventListener('mousedown', (e) => this.startSelection(e));
    document.addEventListener('mousemove', (e) => this.updateSelection(e));
    document.addEventListener('mouseup', () => this.endSelection());
  }
  
  startSelection(e) {
    if (e.target.closest('.window-header, .minimize, .maximize, .close')) return;
    
    this.isSelecting = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.selectionRect.style.display = 'block';
    this.selectionRect.style.left = `${this.startX}px`;
    this.selectionRect.style.top = `${this.startY}px`;
    this.selectionRect.style.width = '0px';
    this.selectionRect.style.height = '0px';
  }
  
  updateSelection(e) {
    if (!this.isSelecting) return;
    
    const x = Math.min(e.clientX, this.startX);
    const y = Math.min(e.clientY, this.startY);
    const width = Math.abs(e.clientX - this.startX);
    const height = Math.abs(e.clientY - this.startY);
    
    this.selectionRect.style.left = `${x}px`;
    this.selectionRect.style.top = `${y}px`;
    this.selectionRect.style.width = `${width}px`;
    this.selectionRect.style.height = `${height}px`;
    
    // Highlight selected windows
    const rect = this.selectionRect.getBoundingClientRect();
    document.querySelectorAll('.popup-window').forEach(window => {
      const windowRect = window.getBoundingClientRect();
      const isInside = 
        windowRect.left >= rect.left &&
        windowRect.right <= rect.right &&
        windowRect.top >= rect.top &&
        windowRect.bottom <= rect.bottom;
      
      window.classList.toggle('selected', isInside);
    });
  }
  
  endSelection() {
    this.isSelecting = false;
    this.selectionRect.style.display = 'none';
    
    // Handle selected windows
    const selectedWindows = document.querySelectorAll('.popup-window.selected');
    if (selectedWindows.length > 0) {
      // Implement your selection handling logic here
      console.log('Selected windows:', selectedWindows);
    }
  }
}

// Initialize all effects
document.addEventListener('DOMContentLoaded', () => {
  // Initialize particle system
  // Initialize all effects
document.addEventListener('DOMContentLoaded', () => {
  // Initialize particle system
  const particleSystem = new ParticleSystem();
  
  // Initialize ripple effect
  const rippleEffect = new RippleEffect();
  
  // Initialize window animations
  const windowAnimations = new WindowAnimations();
  
  // Initialize screen effects
  const screenEffects = new ScreenEffects();
  
  // Initialize window snapping
  const windowSnapping = new WindowSnapping();
  
  // Initialize window manager
  const windowManager = new WindowManager();
  
  // Initialize selection box
  const selectionBox = new SelectionBox();
  
  // Add click handlers for window controls
  document.querySelectorAll('.popup-window').forEach(window => {
    const header = window.querySelector('.window-header');
    const minimizeBtn = header.querySelector('.minimize');
    const maximizeBtn = header.querySelector('.maximize');
    const closeBtn = header.querySelector('.close');
    
    windowManager.addWindow(window);
    
    minimizeBtn.addEventListener('click', () => windowManager.minimizeWindow(window));
    maximizeBtn.addEventListener('click', () => windowManager.maximizeWindow(window));
    closeBtn.addEventListener('click', () => windowManager.closeWindow(window));
    
    // Add window to animation system
    windowAnimations.addWindow(window);
  });
  
  // Add ripple effect to clickable elements
  document.querySelectorAll('.clickable').forEach(element => {
    element.addEventListener('click', (e) => {
      rippleEffect.createRipple(e.clientX, e.clientY);
    });
  });
  
  // Add particle effects to window interactions
  document.querySelectorAll('.popup-window').forEach(window => {
    window.addEventListener('click', () => {
      const rect = window.getBoundingClientRect();
      particleSystem.createParticle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
    });
  });
  
  // Add window snapping to all windows
  document.querySelectorAll('.popup-window').forEach(window => {
    windowSnapping.snapWindow(window);
  });
  
  // Add selection box functionality
  document.addEventListener('mousedown', (e) => {
    if (e.target.closest('.window-header')) {
      selectionBox.startSelection(e);
    }
  });
});

// Add window resize handler
window.addEventListener('resize', () => {
  // Update all canvas sizes
  const canvases = document.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  
  // Re-snap all windows
  document.querySelectorAll('.popup-window').forEach(window => {
    windowSnapping.snapWindow(window);
  });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Alt + Tab for window switching
  if (e.altKey && e.key === 'Tab') {
    const windows = Array.from(document.querySelectorAll('.popup-window:not(.hidden)'));
    const currentIndex = windows.findIndex(win => win.classList.contains('active'));
    const nextIndex = (currentIndex + 1) % windows.length;
    
    if (currentIndex !== -1) {
      windows[currentIndex].classList.remove('active');
    }
    windows[nextIndex].classList.add('active');
  }
  
  // Ctrl + W to close window
  if (e.ctrlKey && e.key === 'w') {
    const activeWin = document.querySelector('.popup-window.active:not(.hidden)');
    if (activeWin) {
      windowManager.closeWindow(activeWin);
    }
  }
  
  // Ctrl + N to open new window
  if (e.ctrlKey && e.key === 'n') {
    openWindow('about'); // Default to About window
  }
  
  // Ctrl + Shift + T to open terminal
  if (e.ctrlKey && e.shiftKey && e.key === 't') {
    openWindow('terminal');
  }
  
  // Ctrl + Shift + E to open explorer
  if (e.ctrlKey && e.shiftKey && e.key === 'e') {
    openWindow('explorer');
  }
  
  // Ctrl + Shift + M to open music player
  if (e.ctrlKey && e.shiftKey && e.key === 'm') {
    openWindow('music');
  }
  
  // Ctrl + Shift + C to open clipboard manager
  if (e.ctrlKey && e.shiftKey && e.key === 'c') {
    openWindow('clipboard');
  }
});

// Add screensaver functionality
let screensaverTimeout;
let isScreensaverActive = false;

function startScreensaver() {
  if (isScreensaverActive) return;
  
  const screensaver = document.createElement('div');
  screensaver.className = 'screensaver';
  screensaver.innerHTML = `
    <div class="screensaver-content">
      <div class="screensaver-artwork">
        <img src="[https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/whodat.gif"](https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/whodat.gif") alt="Artwork">
      </div>
      <div class="screensaver-text">
        <h2>Benjamin Filler</h2>
        <p>Cyber Deck Active</p>
      </div>
    </div>
  `;
  document.body.appendChild(screensaver);
  
  isScreensaverActive = true;
}

function stopScreensaver() {
  const screensaver = document.querySelector('.screensaver');
  if (screensaver) {
    screensaver.remove();
    isScreensaverActive = false;
  }
}

// Listen for activity
document.addEventListener('mousemove', () => {
  clearTimeout(screensaverTimeout);
  stopScreensaver();
  screensaverTimeout = setTimeout(startScreensaver, 300000); // 5 minutes
});

document.addEventListener('keypress', () => {
  clearTimeout(screensaverTimeout);
  stopScreensaver();
  screensaverTimeout = setTimeout(startScreensaver, 300000);
});

// Add window stack functionality
function updateWindowStack() {
  const stack = document.querySelector('.window-stack');
  stack.innerHTML = '';
  
  const windows = Array.from(document.querySelectorAll('.popup-window:not(.hidden)'));
  windows.forEach(window => {
    const item = document.createElement('div');
    item.className = 'window-stack-item';
    item.textContent = window.querySelector('.window-header span').textContent;
    item.addEventListener('click', () => {
      window.classList.add('active');
      window.classList.remove('hidden');
      window.style.display = 'flex';
    });
    stack.appendChild(item);
  });
}

// Update window stack when windows change
document.addEventListener('click', (e) => {
  if (e.target.closest('.minimize, .maximize, .close')) {
    setTimeout(updateWindowStack, 100);
  }
});

// Add notification system
function createNotification(message, type = 'info') {
  // Add notification system
function createNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${type === 'info' ? 'ℹ️' : '⚠️'}</span>
    <span class="notification-message">${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add drag and drop functionality
document.addEventListener('DOMContentLoaded', () => {
  const draggables = document.querySelectorAll('.draggable');
  
  draggables.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.id);
      item.classList.add('dragging');
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
  });
  
  const dropzones = document.querySelectorAll('.dropzone');
  
  dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('hover');
    });
    
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('hover');
    });
    
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('hover');
      const id = e.dataTransfer.getData('text/plain');
      const draggable = document.getElementById(id);
      if (draggable) {
        zone.appendChild(draggable);
        createNotification('File moved successfully', 'info');
      }
    });
  });
});

// Add clipboard functionality
document.addEventListener('DOMContentLoaded', () => {
  // Load saved clipboard content
  const savedContent = localStorage.getItem('clipboardContent');
  if (savedContent) {
    document.getElementById('clipboard-content').value = savedContent;
  }
  
  // Listen for copy/paste
  document.addEventListener('copy', (e) => {
    const text = e.clipboardData.getData('text');
    const content = document.getElementById('clipboard-content');
    if (content) {
      content.value += `\n${new Date().toLocaleString()}: ${text}`;
      localStorage.setItem('clipboardContent', content.value);
      createNotification('Copied to clipboard', 'info');
    }
  });
});

// Add terminal functionality
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');
  
  const commands = {
    'help': 'Available commands: help, about, projects, contact, exit',
    'about': 'Benjamin Filler - Media Creator & Narrative Designer',
    'projects': 'View projects in PROJECTS.EXE',
    'contact': 'Contact info in CONTACT.EXE',
    'exit': 'Closing terminal...'
  };
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const command = input.value.trim().toLowerCase();
      const response = commands[command] || 'Command not found';
      
      output.innerHTML += `
        <div class="terminal-command">${input.value}</div>
        <div class="terminal-output">${response}</div>
      `;
      
      input.value = '';
      input.scrollIntoView();
      
      // Add particle effect
      const rect = input.getBoundingClientRect();
      particleSystem.createParticle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        'var(--neon-blue)'
      );
    }
  });
});

// Add music player functionality
document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('music-audio');
  const tracks = document.querySelectorAll('.track');
  
  tracks.forEach(track => {
    track.addEventListener('click', () => {
      audio.src = track.dataset.src;
      audio.play();
      
      // Add ripple effect
      const rect = track.getBoundingClientRect();
      rippleEffect.createRipple(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
      
      // Add particle effect
      particleSystem.createParticle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        'var(--neon-pink)'
      );
    });
  });
});

// Add weather widget functionality
document.addEventListener('DOMContentLoaded', () => {
  const weatherWidget = document.getElementById('weather-widget');
  
  async function updateWeather() {
    try {
      const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Birmingham&appid=YOUR_API_KEY&units=imperial');
      const data = await response.json();
      
      weatherWidget.innerHTML = `
        <div class="weather-temp">${Math.round(data.main.temp)}°F</div>
        <div class="weather-condition">${data.weather[0].description}</div>
        <div class="weather-location">Birmingham, MI</div>
      `;
      
      // Add particle effect
      const rect = weatherWidget.getBoundingClientRect();
      particleSystem.createParticle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        'var(--neon-blue)'
      );
    } catch (error) {
      console.error('Error fetching weather:', error);
      createNotification('Failed to fetch weather data', 'error');
    }
  }
  
  // Update weather every hour
  updateWeather();
  setInterval(updateWeather, 3600000);
});