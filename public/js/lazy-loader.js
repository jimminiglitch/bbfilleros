// Lazy loading for videos and iframes
document.addEventListener('DOMContentLoaded', () => {
  // Lazy load videos
  const lazyVideos = document.querySelectorAll('video[data-src]');
  
  // Create intersection observer for videos
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        if (video.dataset.src && !video.src) {
          console.log(`Loading video: ${video.dataset.src}`);
          video.src = video.dataset.src;
          videoObserver.unobserve(video);
        }
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.1
  });
  
  // Observe all videos with data-src
  lazyVideos.forEach(video => videoObserver.observe(video));
  
  // Lazy load iframes
  const lazyIframes = document.querySelectorAll('iframe[data-src]');
  
  // Create intersection observer for iframes
  const iframeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const iframe = entry.target;
        if (iframe.dataset.src && !iframe.src) {
          console.log(`Loading iframe: ${iframe.dataset.src}`);
          iframe.src = iframe.dataset.src;
          iframeObserver.unobserve(iframe);
        }
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.1
  });
  
  // Observe all iframes with data-src
  lazyIframes.forEach(iframe => iframeObserver.observe(iframe));
  
  // Load content when window is opened
  const windows = document.querySelectorAll('.popup-window');
  windows.forEach(window => {
    const windowId = window.id;
    const icon = document.querySelector(`[data-window="${windowId}"]`);
    
    if (icon) {
      icon.addEventListener('click', () => {
        // Find videos and iframes in this window
        const videos = window.querySelectorAll('video[data-src]');
        const iframes = window.querySelectorAll('iframe[data-src]');
        
        // Load videos when window is opened
        videos.forEach(video => {
          if (video.dataset.src && !video.src) {
            setTimeout(() => {
              video.src = video.dataset.src;
            }, 500); // Small delay to ensure window is visible first
          }
        });
        
        // Load iframes when window is opened
        iframes.forEach(iframe => {
          if (iframe.dataset.src && !iframe.src) {
            setTimeout(() => {
              iframe.src = iframe.dataset.src;
            }, 500);
          }
        });
      });
    }
  });
});
