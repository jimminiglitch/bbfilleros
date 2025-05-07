// simple debounce if you don't already have one
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  }
}

// your entire initPongGame() here, unchanged…

// then kick it off on load:
document.addEventListener("DOMContentLoaded", initPongGame);
