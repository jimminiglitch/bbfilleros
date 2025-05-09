// Legacy-compatible window system with retro behaviors
export function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.remove("hidden");
  win.style.display = "flex";
  win.style.zIndex = 1000;
}
