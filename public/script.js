// script.js

// Audio elements
const blipSound = document.getElementById("blip");
const bootSound = document.getElementById("bootSound");
const hoverSound = document.getElementById("hoverSound");

// Play sound functions
function playBlip() {
  if (blipSound) {
    blipSound.currentTime = 0;
    blipSound.volume = 0.2;
    blipSound.play();
  }
}

function playHover() {
  if (hoverSound) {
    hoverSound.volume = 0.1;
    hoverSound.currentTime = 0;
    hoverSound.play();
  }
}

// Window management
let windows = {};
let activeWindow = null;
let zIndex = 100;

// Initialize windows
function initWindows() {
  // Get all windows
  const windowElements = document.querySelectorAll('.popup-window');

  windowElements.forEach(win => {
    const id = win.id;
    windows[id] = {
      element: win,
      minimized: false,
      maximized: false,
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 }
    };
    
    // Set initial position
    const randomX = Math.random() * (window.innerWidth - 500);
    const randomY = Math.random() * (window.innerHeight - 400);
    win.style.left = `${randomX}px`;
    win.style.top = `${randomY}px`;
    
    // Make window draggable
    const header = win.querySelector('.window-header');
    makeDraggable(win, header);
    
    // Add event listeners for window buttons
    const closeBtn = win.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeWindow(id));
    }
    
    const maxBtn = win.querySelector('.maximize');
    if (maxBtn) {
      maxBtn.addEventListener('click', () => toggleMaximize(id));
    }
    
    const minBtn = win.querySelector('.minimize');
    if (minBtn) {
      minBtn.addEventListener('click', () => minimizeWindow(id));
    }
    
    // Add context menu
    win.addEventListener('contextmenu', showContextMenu);
  });

  // Start button
  const startButton = document.getElementById('start-button');
  const startMenu = document.getElementById('start-menu');

  startButton.addEventListener('click', () => {
    startMenu.style.display = startMenu.style.display === 'block' ? 'none' : 'block';
    playBlip();
  });

  // Close start menu when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (!startButton.contains(e.target) && !startMenu.contains(e.target)) {
      startMenu.style.display = 'none';
    }
  });

  // Close context menu when clicking elsewhere
  document.addEventListener('click', (e) => {
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu && !contextMenu.contains(e.target)) {
      contextMenu.classList.add('hidden');
    }
  });
  
  // Make desktop icons draggable
  const desktopIcons = document.querySelectorAll('.desktop-icon');
  desktopIcons.forEach(icon => {
    makeDraggable(icon, icon);
  });
}

function openWindow(id) {
  if (!windows[id]) return;

  const win = windows[id];
  win.element.classList.remove('hidden');

  if (win.minimized) {
    win.minimized = false;
    updateTaskbar();
  }

  focusWindow(id);
  playBlip();

  // Add to taskbar if not already there
  updateTaskbar();
  

  
  // Special handling for glitchlab
  if (id === 'app_glitchlab') {
    initGlitchLab();
  }
}

function closeWindow(id) {
  if (!windows[id]) return;

  windows[id].element.classList.add('hidden');
  updateTaskbar();
  playBlip();
}

function minimizeWindow(id) {
  if (!windows[id]) return;

  windows[id].minimized = true;
  windows[id].element.classList.add('hidden');
  updateTaskbar();
  playBlip();
}

function toggleMaximize(id) {
  if (!windows[id]) return;

  const win = windows[id];

  if (!win.maximized) {
    // Save current position and size
    win.position.x = win.element.offsetLeft;
    win.position.y = win.element.offsetTop;
    win.size.width = win.element.offsetWidth;
    win.size.height = win.element.offsetHeight;
    
    // Maximize
    win.element.classList.add('maximized');
  } else {
    // Restore
    win.element.classList.remove('maximized');
    win.element.style.left = `${win.position.x}px`;
    win.element.style.top = `${win.position.y}px`;
    win.element.style.width = `${win.size.width}px`;
    win.element.style.height = `${win.size.height}px`;
  }

  win.maximized = !win.maximized;
  playBlip();
}

function focusWindow(id) {
  if (!windows[id]) return;

  // Set active window
  if (activeWindow) {
    windows[activeWindow].element.style.zIndex = 100;
  }

  activeWindow = id;
  windows[id].element.style.zIndex = ++zIndex;

  // Update taskbar
  updateTaskbar();
}

function updateTaskbar() {
  const taskbar = document.getElementById('taskbar');
  taskbar.innerHTML = '';

  // Add buttons for open windows
  for (const id in windows) {
    if (!windows[id].element.classList.contains('hidden')) {
      const button = document.createElement('button');
      button.className = 'taskbar-btn';
      if (activeWindow === id) {
        button.classList.add('active');
      }
      
      const title = windows[id].element.querySelector('.window-header span').textContent;
      button.textContent = title;
      
      button.addEventListener('click', () => {
        if (windows[id].minimized) {
          windows[id].minimized = false;
          windows[id].element.classList.remove('hidden');
        } else if (activeWindow === id) {
          minimizeWindow(id);
        }
        focusWindow(id);
      });
      
      taskbar.appendChild(button);
    }
  }
}

function makeDraggable(element, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  handle.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    
    // Get mouse position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Bring window to front
    const id = element.id;
    if (windows[id]) {
      focusWindow(id);
    }
    
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    
    // Calculate new position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Check if window is maximized
    const id = element.id;
    if (windows[id] && windows[id].maximized) {
      return;
    }
    
    // Set element's new position
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Context menu
function showContextMenu(e) {
  e.preventDefault();

  const contextMenu = document.getElementById('context-menu');
  contextMenu.style.left = `${e.clientX}px`;
  contextMenu.style.top = `${e.clientY}px`;
  contextMenu.classList.remove('hidden');

  // Set focused window for context menu actions
  const windowElement = e.currentTarget;
  const id = windowElement.id;
  if (windows[id]) {
    focusWindow(id);
  }
}

function closeFocusedWindow() {
  if (activeWindow) {
    closeWindow(activeWindow);
  }

  const contextMenu = document.getElementById('context-menu');
  contextMenu.classList.add('hidden');
}

function minimizeFocusedWindow() {
  if (activeWindow) {
    minimizeWindow(activeWindow);
  }

  const contextMenu = document.getElementById('context-menu');
  contextMenu.classList.add('hidden');
}

function toggleFocusedMaximize() {
  if (activeWindow) {
    toggleMaximize(activeWindow);
  }

  const contextMenu = document.getElementById('context-menu');
  contextMenu.classList.add('hidden');
}

// Project preview
function openProjectPreview(projectId) {
  const splash = document.getElementById('project-splash');
  const splashName = document.getElementById('splash-name');

  // Set project name
  switch(projectId) {
    case 'fedora':
      splashName.textContent = 'FEDORA_DIARIES.EXE';
      break;
    case 'r3d3ch0':
      splashName.textContent = 'R3D3CH0.EXE';
      break;
    case 'clydecup':
      splashName.textContent = 'CLYDE_CUP.EXE';
      break;
    case 'brian':
      splashName.textContent = 'BIRDING_WITH_BRIAN.EXE';
      break;
    default:
      splashName.textContent = 'PROJECT.EXE';
  }

  splash.classList.remove('hidden');
  playBlip();
}

function closeSplash() {
  const splash = document.getElementById('project-splash');
  splash.classList.add('hidden');
  playBlip();
}

// Clock
function initClock() {
  const clockElement = document.getElementById('clock');

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    clockElement.textContent = `${hours}:${minutes} ${ampm}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

// Shutdown
function toggleShutdown() {
  const shutdownOverlay = document.getElementById('shutdown-overlay');
  shutdownOverlay.classList.remove('hidden');
  shutdownOverlay.style.display = 'flex';

  setTimeout(() => {
    window.location.reload();
  }, 3000);
}

// Starfield background
function initStarfield() {
  const canvas = document.getElementById('background-canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Create stars
  const stars = [];
  const numStars = 200;
  const colors = ['#ffffff', '#00ffcc', '#ff77aa', '#3377ff'];

  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 0.5 + 0.1
    });
  }

  // Animate stars
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.fill();
      
      // Move star
      star.y += star.speed;
      
      // Reset star if it goes off screen
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });
    
    requestAnimationFrame(animate);
  }

  animate();
}

// Typewriter effect
function initTypewriter() {
  const elements = document.querySelectorAll('.typewriter');
  elements.forEach(el => {
    const text = el.getAttribute('data-text');
    if (text) {
      el.textContent = '';
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          el.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 50);
    }
  });
}

// GlitchLab
function initGlitchLab() {
  const canvas = document.getElementById('glitchlab-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let particles = [];
  let glitchEffect = true;
  
  // Create particles
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 5 + 1,
      speedX: Math.random() * 3 - 1.5,
      speedY: Math.random() * 3 - 1.5,
      color: `hsl(${Math.random() * 60 + 280}, 100%, 50%)`
    });
  }
  
  function animate() {
    // Clear canvas with semi-transparent black for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      
      // Bounce off edges
      if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
      if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      
      // Draw connecting lines
      particles.forEach(p2 => {
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) {
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.5;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
    });
    
    // Apply glitch effect
    if (glitchEffect && Math.random() > 0.95) {
      const sliceY = Math.random() * canvas.height;
      const sliceHeight = Math.random() * 20 + 5;
      const imageData = ctx.getImageData(0, sliceY, canvas.width, sliceHeight);
      const offsetX = Math.random() * 20 - 10;
      ctx.putImageData(imageData, offsetX, sliceY);
    }
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  // Toggle glitch effect
  window.toggleGlitchEffect = function() {
    glitchEffect = !glitchEffect;
    playBlip();
  };
  
  // Intensity slider
  const intensitySlider = document.getElementById('glitch-intensity');
  if (intensitySlider) {
    intensitySlider.addEventListener('input', function() {
      const value = this.value;
      particles.forEach(p => {
        p.size = Math.random() * (value / 10) + 1;
        p.speedX = Math.random() * (value / 25) - (value / 50);
        p.speedY = Math.random() * (value / 25) - (value / 50);
      });
    });
  }
}

// Form submission
function submitForm() {
  alert('Message submitted! (This is just a mockup for now.)');
  playBlip();
}

// Initialize everything on load
window.addEventListener('DOMContentLoaded', function() {
  // Boot sequence
  setTimeout(() => {
    document.getElementById('bootScreen').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('bootScreen').style.display = 'none';
      initStarfield();
      initWindows();
      initClock();
      initTypewriter();
    }, 500);
  }, 3000);

  // Initialize audio
  if (bootSound) {
    bootSound.volume = 0.3;
    bootSound.play();
  }
  
  // Add hover sound to buttons
  const buttons = document.querySelectorAll('button, .nav-button, .desktop-icon, .file, .menu-item');
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', playHover);
  });
});
