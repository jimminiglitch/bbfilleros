// Play blip sound
function playBlip() {
  const blip = document.getElementById("blip");
  if (blip) {
    blip.currentTime = 0;
    blip.play();
  }
}

// Open/Close/Minimize/Maximize…
function openWindow(id) { /* … */ }
function closeWindow(id) { /* … */ }
function minimizeWindow(id) { /* … */ }
function toggleMaximizeWindow(id) { /* … */ }

// Drag code (with the template‐string fix)
let currentZIndex = 10, isDragging = false, offsetX, offsetY;
function getNextZIndex() { return ++currentZIndex; }

// …bind mousedown, mousemove, mouseup on your window headers…

// Clock
function updateClock() { /* … */ }
setInterval(updateClock, 1000);
updateClock();

// Start menu toggle
document.getElementById("start-button").addEventListener("click", () => {
  const m = document.getElementById("start-menu");
  m.style.display = m.style.display === "flex" ? "none" : "flex";
});

// Boot screen hide
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("bootScreen").style.display = "none";
  }, 3000);
});

// Project splash open/close
function launchProject(element, name) { /* … */ }
function closeSplash() { /* … */ }

// Hover sound on project cards
const hoverSound = new Audio('/blip.mp3');
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    hoverSound.currentTime = 0;
    hoverSound.play();
  });
});

// Corrected openProjectPreview
function openProjectPreview(projectId) {
  const id = `preview-${projectId}`;
  openWindow(id);
}

// Typewriter
document.querySelectorAll('.typewriter').forEach(el => {
  const text = el.getAttribute('data-text');
  el.textContent = '';
  let i = 0;
  (function type() {
    if (i < text.length) {
      el.textContent += text.charAt(i++);
      setTimeout(type, 30);
    }
  })();
});
