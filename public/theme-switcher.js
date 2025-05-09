// Theme Switcher
document.addEventListener('DOMContentLoaded', () => {
  // Define themes
  const themes = {
    cyberpunk: {
      name: 'Cyberpunk',
      primary: '#00ffff',
      background: '#000000',
      text: '#ffffff',
      accent: '#ff00ff',
      window: '#1a1a2e',
      header: '#0f3460',
      scanlines: true,
      glitch: true
    },
    vaporwave: {
      name: 'Vaporwave',
      primary: '#ff71ce',
      background: '#2d00f7',
      text: '#ffffff',
      accent: '#01cdfe',
      window: '#29274c',
      header: '#6e44ff',
      scanlines: true,
      glitch: false
    },
    matrix: {
      name: 'Matrix',
      primary: '#00ff00',
      background: '#000000',
      text: '#00ff00',
      accent: '#003300',
      window: '#001100',
      header: '#002200',
      scanlines: true,
      glitch: false
    },
    dos: {
      name: 'DOS',
      primary: '#ffffff',
      background: '#000080',
      text: '#ffffff',
      accent: '#aaaaaa',
      window: '#000080',
      header: '#0000aa',
      scanlines: false,
      glitch: false
    }
  };
  
  // Create theme switcher UI
  const createThemeSwitcher = () => {
    // Create theme icon
    const themeIcon = document.createElement('div');
    themeIcon.className = 'desktop-icon';
    themeIcon.id = 'icon-themes';
    themeIcon.setAttribute('data-window', 'themes');
    themeIcon.setAttribute('role', 'button');
    themeIcon.setAttribute('aria-label', 'Change Theme');
    themeIcon.setAttribute('tabindex', '0');
    
    // Create icon image
    const iconImg = document.createElement('img');
    iconImg.src = 'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/VaporTree.png?v=1746411815542';
    iconImg.alt = 'Themes';
    iconImg.loading = 'lazy';
    
    // Create icon text
    const iconText = document.createElement('span');
    iconText.textContent = 'Themes';
    
    // Append elements
    themeIcon.appendChild(iconImg);
    themeIcon.appendChild(iconText);
    
    // Add to desktop
    const desktopIcons = document.getElementById('desktop-icons');
    desktopIcons.appendChild(themeIcon);
    
    // Create theme window
    const themeWindow = document.createElement('div');
    themeWindow.id = 'themes';
    themeWindow.className = 'popup-window hidden';
    
    // Create window header
    const windowHeader = document.createElement('div');
    windowHeader.className = 'window-header';
    
    const headerTitle = document.createElement('span');
    headerTitle.textContent = 'THEMES.EXE';
    
    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'minimize';
    minimizeBtn.textContent = '_';
    
    const maximizeBtn = document.createElement('button');
    maximizeBtn.className = 'maximize';
    maximizeBtn.textContent = '▭';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close';
    closeBtn.textContent = 'X';
    
    windowHeader.appendChild(headerTitle);
    windowHeader.appendChild(minimizeBtn);
    windowHeader.appendChild(maximizeBtn);
    windowHeader.appendChild(closeBtn);
    
    // Create window content
    const windowContent = document.createElement('div');
    windowContent.className = 'window-content';
    
    const themeTitle = document.createElement('h2');
    themeTitle.textContent = 'Select a Theme';
    windowContent.appendChild(themeTitle);
    
    // Create theme options
    const themeGrid = document.createElement('div');
    themeGrid.className = 'theme-grid';
    themeGrid.style.display = 'grid';
    themeGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    themeGrid.style.gap = '15px';
    themeGrid.style.padding = '15px';
    
    // Add theme options
    Object.keys(themes).forEach(themeKey => {
      const theme = themes[themeKey];
      
      const themeOption = document.createElement('div');
      themeOption.className = 'theme-option';
      themeOption.setAttribute('data-theme', themeKey);
      themeOption.style.backgroundColor = theme.window;
      themeOption.style.color = theme.text;
      themeOption.style.border = `2px solid ${theme.primary}`;
      themeOption.style.padding = '10px';
      themeOption.style.borderRadius = '4px';
      themeOption.style.cursor = 'pointer';
      themeOption.style.textAlign = 'center';
      
      const themeName = document.createElement('h3');
      themeName.textContent = theme.name;
      themeName.style.color = theme.primary;
      themeName.style.margin = '0 0 10px 0';
      
      const themePreview = document.createElement('div');
      themePreview.style.height = '60px';
      themePreview.style.backgroundColor = theme.background;
      themePreview.style.border = `1px solid ${theme.accent}`;
      themePreview.style.marginBottom = '10px';
      themePreview.style.position = 'relative';
      themePreview.style.overflow = 'hidden';
      
      // Add mini window to preview
      const miniWindow = document.createElement('div');
      miniWindow.style.position = 'absolute';
      miniWindow.style.width = '70%';
      miniWindow.style.height = '70%';
      miniWindow.style.top = '15%';
      miniWindow.style.left = '15%';
      miniWindow.style.backgroundColor = theme.window;
      miniWindow.style.border = `1px solid ${theme.primary}`;
      
      const miniHeader = document.createElement('div');
      miniHeader.style.backgroundColor = theme.header;
      miniHeader.style.height = '20%';
      miniHeader.style.width = '100%';
      
      miniWindow.appendChild(miniHeader);
      themePreview.appendChild(miniWindow);
      
      // Add scanlines if theme has them
      if (theme.scanlines) {
        const miniScanlines = document.createElement('div');
        miniScanlines.style.position = 'absolute';
        miniScanlines.style.top = '0';
        miniScanlines.style.left = '0';
        miniScanlines.style.right = '0';
        miniScanlines.style.bottom = '0';
        miniScanlines.style.backgroundImage = 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.5) 50%)';
        miniScanlines.style.backgroundSize = '100% 4px';
        miniScanlines.style.pointerEvents = 'none';
        miniScanlines.style.opacity = '0.3';
        themePreview.appendChild(miniScanlines);
      }
      
      const applyButton = document.createElement('button');
      applyButton.textContent = 'Apply Theme';
      applyButton.style.backgroundColor = theme.accent;
      applyButton.style.color = theme.text;
      applyButton.style.border = 'none';
      applyButton.style.padding = '5px 10px';
      applyButton.style.cursor = 'pointer';
      applyButton.style.width = '100%';
      
      themeOption.appendChild(themeName);
      themeOption.appendChild(themePreview);
      themeOption.appendChild(applyButton);
      
      // Add click event
      themeOption.addEventListener('click', () => {
        applyTheme(themeKey);
      });
      
      themeGrid.appendChild(themeOption);
    });
    
    windowContent.appendChild(themeGrid);
    
    // Append elements to theme window
    themeWindow.appendChild(windowHeader);
    themeWindow.appendChild(windowContent);
    
    // Add to container
    const container = document.querySelector('.container');
    container.appendChild(themeWindow);
    
    // Add window functionality
    themeIcon.addEventListener('click', () => {
      openWindow('themes');
    });
    
    closeBtn.addEventListener('click', () => {
      closeWindow('themes');
    });
    
    minimizeBtn.addEventListener('click', () => {
      minimizeWindow('themes');
    });
    
    maximizeBtn.addEventListener('click', () => {
      maximizeWindow('themes');
    });
  };
  
  // Apply theme function
  const applyTheme = (themeName) => {
    const theme = themes[themeName];
    if (!theme) return;
    
    // Create or update CSS variables
    const root = document.documentElement;
    
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--background-color', theme.background);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--window-bg', theme.window);
    root.style.setProperty('--window-header', theme.header);
    
    // Toggle scanlines
    const scanlines = document.querySelector('.scanlines');
    if (scanlines) {
      scanlines.style.display = theme.scanlines ? 'block' : 'none';
    }
    
    // Toggle glitch effect
    const glitchText = document.querySelector('.glitch');
    if (glitchText) {
      if (theme.glitch) {
        glitchText.classList.add('glitch-active');
        glitchText.setAttribute('data-text', glitchText.textContent);
      } else {
        glitchText.classList.remove('glitch-active');
      }
    }
    
    // Save theme preference
    localStorage.setItem('preferred-theme', themeName);
    
    // Notify user
    console.log(`Theme changed to ${theme.name}`);
  };
  
  // Initialize theme switcher
  const initThemes = () => {
    createThemeSwitcher();
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme && themes[savedTheme]) {
      applyTheme(savedTheme);
    }
  };
  
  // Initialize when DOM is loaded
  initThemes();
});
