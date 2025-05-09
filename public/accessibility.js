// Accessibility Enhancements
document.addEventListener('DOMContentLoaded', () => {
  // Add ARIA attributes to desktop icons
  const desktopIcons = document.querySelectorAll('.desktop-icon');
  desktopIcons.forEach(icon => {
    // Add role and tabindex
    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    
    // Add aria-label based on the icon text
    const iconText = icon.querySelector('span');
    if (iconText) {
      icon.setAttribute('aria-label', `Open ${iconText.textContent}`);
    }
    
    // Add keyboard support
    icon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const windowId = icon.dataset.window;
        if (windowId) {
          openWindow(windowId);
        }
      }
    });
  });
  
  // Add ARIA attributes to window controls
  const windowControls = document.querySelectorAll('.window-header button');
  windowControls.forEach(button => {
    if (button.classList.contains('close')) {
      button.setAttribute('aria-label', 'Close window');
    } else if (button.classList.contains('minimize')) {
      button.setAttribute('aria-label', 'Minimize window');
    } else if (button.classList.contains('maximize')) {
      button.setAttribute('aria-label', 'Maximize window');
    }
  });
  
  // Add ARIA attributes to windows
  const windows = document.querySelectorAll('.popup-window');
  windows.forEach(window => {
    window.setAttribute('role', 'dialog');
    window.setAttribute('aria-modal', 'true');
    
    const header = window.querySelector('.window-header span');
    if (header) {
      window.setAttribute('aria-labelledby', header.id || `${window.id}-title`);
      if (!header.id) {
        header.id = `${window.id}-title`;
      }
    }
  });
  
  // Add skip to content link for keyboard users
  const skipLink = document.createElement('a');
  skipLink.href = '#desktop-icons';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to content';
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Add focus styles
  const style = document.createElement('style');
  style.textContent = `
    .desktop-icon:focus-visible {
      outline: 2px solid #00ffff;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
    }
    
    .window-header button:focus-visible {
      outline: 2px solid #00ffff;
    }
    
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #00ffff;
      color: #000;
      padding: 8px;
      z-index: 10000;
      transition: top 0.3s;
    }
    
    .skip-link:focus {
      top: 0;
    }
    
    /* High contrast mode support */
    @media (forced-colors: active) {
      .desktop-icon:focus-visible,
      .window-header button:focus-visible {
        outline: 3px solid CanvasText;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Add screen reader announcements for important actions
  const announcer = document.createElement('div');
  announcer.className = 'sr-only';
  announcer.setAttribute('aria-live', 'polite');
  announcer.id = 'announcer';
  document.body.appendChild(announcer);
  
  // Function to announce messages to screen readers
  window.announce = (message) => {
    const announcer = document.getElementById('announcer');
    if (announcer) {
      announcer.textContent = message;
      
      // Clear after a delay
      setTimeout(() => {
        announcer.textContent = '';
      }, 3000);
    }
  };
  
  // Enhance window open/close functions with announcements
  const originalOpenWindow = window.openWindow;
  window.openWindow = function(id) {
    originalOpenWindow(id);
    announce(`${id} window opened`);
  };
  
  const originalCloseWindow = window.closeWindow;
  window.closeWindow = function(id) {
    originalCloseWindow(id);
    announce(`${id} window closed`);
  };
});
