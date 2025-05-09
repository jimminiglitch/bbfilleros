document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".gallery-item");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  let currentIndex = 0;

  function showSlide(index) {
    items.forEach((item, i) => {
      item.classList.toggle("active", i === index);
    });
  }

  prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    showSlide(currentIndex);
  });

  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % items.length;
    showSlide(currentIndex);
  });

  showSlide(currentIndex);

  // Ensure window is scrollable
  document.body.style.overflowY = "auto";
});
