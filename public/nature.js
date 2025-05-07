document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelectorAll(".gallery-item img");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeBtn = document.querySelector(".close-lightbox");

  gallery.forEach(img => {
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightboxCaption.textContent = img.nextElementSibling.textContent;
      lightbox.classList.remove("hidden");
    });
  });

  closeBtn.addEventListener("click", () => {
    lightbox.classList.add("hidden");
    lightboxImg.src = "";
    lightboxCaption.textContent = "";
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeBtn.click();
    }
  });
});
