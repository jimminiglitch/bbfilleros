// Enhanced Boot Sequence with Psychedelic Effects
document.addEventListener('DOMContentLoaded', () => {
  const bootScreen = document.getElementById('bootScreen');
  const bootLog = document.getElementById('boot-log');
  const progressBar = document.getElementById('progress-bar');
  
  // Array of profile images to randomly select from
  const profileImages = [
    'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Benny.png?v=1746392528967',
    'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/whodat.gif?v=1746365769069',
    'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/octavia.jpg?v=1746412752104',
    'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/MilesSwings2025.jpg?v=1746410914289',
    'https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/psychtoadglow.gif?v=1746572262753'
  ];
  
  // Hacker-style boot messages
  const bootMessages = [
    'Initializing system...',
    'Loading kernel modules...',
    'Mounting virtual filesystems...',
    'Establishing secure connection...',
    'Bypassing security protocols...',
    'Injecting custom firmware...',
    'Decrypting neural pathways...',
    'Accessing mainframe...',
    'Overriding system defaults...',
    'Patching memory allocations...',
    'Synthesizing reality matrix...',
    'Calibrating visual cortex...',
    'Enabling psychedelic subroutines...',
    'Activating consciousness expansion modules...',
    'Unlocking dimensional gateways...',
    'Establishing quantum entanglement...',
    'Initiating mind-machine interface...',
    'Loading Benjamin Filler OS v3.14159...',
    'Preparing digital consciousness transfer...',
    'Reality distortion field activated...',
    'Cybernetic augmentation complete...',
    'System ready. Welcome to the digital lair.'
  ];
  
  // Create psychedelic background for boot screen
  const createPsychedelicBackground = () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'boot-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-1';
    
    bootScreen.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let time = 0;
    
    function drawPsychedelicBackground() {
      time += 0.01;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw trippy background
      for (let i = 0; i < 10; i++) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2 + Math.sin(time + i) * 100,
          canvas.height / 2 + Math.cos(time + i) * 100,
          0,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width / 2
        );
        
        gradient.addColorStop(0, `hsl(${(time * 50 + i * 30) % 360}, 100%, 50%)`);
        gradient.addColorStop(1, `hsl(${(time * 50 + i * 30 + 180) % 360}, 100%, 5%)`);
        
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2 + Math.sin(time * 0.5 + i) * 100,
          canvas.height / 2 + Math.cos(time * 0.7 + i) * 100,
          (Math.sin(time + i) + 1) * canvas.width * 0.25,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      
      // Add scanlines
      ctx.globalAlpha = 0.2;
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, y, canvas.width, 2);
      }
      
      // Add glitch effect occasionally
      if (Math.random() < 0.05) {
        ctx.globalAlpha = 0.1;
        ctx.drawImage(
          canvas,
          Math.random() * 10 - 5,
          Math.random() * 10 - 5,
          canvas.width + Math.random() * 10 - 5,
          canvas.height + Math.random() * 10 - 5
        );
      }
      
      if (bootScreen.style.display !== 'none') {
        requestAnimationFrame(drawPsychedelicBackground);
      }
    }
    
    drawPsychedelicBackground();
  };
  
  // Display random profile image
  const displayRandomProfileImage = () => {
    // Select random image
    const randomImage = profileImages[Math.floor(Math.random() * profileImages.length)];
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.style.position = 'absolute';
    imageContainer.style.top = '50%';
    imageContainer.style.left = '50%';
    imageContainer.style.transform = 'translate(-50%, -50%)';
    imageContainer.style.zIndex = '10';
    imageContainer.style.border = '3px solid #00ffff';
    imageContainer.style.boxShadow = '0 0 20px #ff00ff, 0 0 40px rgba(0, 255, 255, 0.5)';
    imageContainer.style.borderRadius = '5px';
    imageContainer.style.overflow = 'hidden';
    imageContainer.style.maxWidth = '200px';
    imageContainer.style.maxHeight = '200px';
    imageContainer.style.opacity = '0';
    imageContainer.style.transition = 'opacity 1s ease-in-out';
    
    // Create image element
    const img = document.createElement('img');
    img.src = randomImage;
    img.alt = 'Profile Image';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    // Add glitch effect to image
    const glitchImage = () => {
      if (Math.random() < 0.3) {
        img.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
        img.style.filter = `hue-rotate(${Math.random() * 360}deg) saturate(${Math.random() * 5 + 1}) contrast(${Math.random() + 1})`;
      } else {
        img.style.transform = 'translate(0, 0)';
        img.style.filter = 'none';
      }
      
      if (bootScreen.style.display !== 'none') {
        setTimeout(glitchImage, Math.random() * 500 + 100);
      }
    };
    
    // Append image to container
    imageContainer.appendChild(img);
    
    // Append container to boot screen
    bootScreen.appendChild(imageContainer);
    
    // Fade in image after a delay
    setTimeout(() => {
      imageContainer.style.opacity = '1';
      glitchImage();
    }, 2000);
    
    // Add text below image
    const imageText = document.createElement('div');
    imageText.textContent = 'IDENTITY CONFIRMED';
    imageText.style.position = 'absolute';
    imageText.style.bottom = '20%';
    imageText.style.left = '50%';
    imageText.style.transform = 'translateX(-50%)';
    imageText.style.color = '#00ffff';
    imageText.style.fontFamily = '"VT323", monospace';
    imageText.style.fontSize = '24px';
    imageText.style.textShadow = '0 0 10px #00ffff';
    imageText.style.opacity = '0';
    imageText.style.transition = 'opacity 1s ease-in-out';
    
    bootScreen.appendChild(imageText);
    
    // Fade in text after image
    setTimeout(() => {
      imageText.style.opacity = '1';
    }, 3000);
  };
  
  // Run boot sequence
  const runBootSequence = () => {
    let messageIndex = 0;
    let progress = 0;
    
    // Create psychedelic background
    createPsychedelicBackground();
    
    // Display random profile image
    displayRandomProfileImage();
    
    // Function to add a message to the boot log
    const addMessage = () => {
      if (messageIndex < bootMessages.length) {
        // Add message with typing effect
        const message = bootMessages[messageIndex];
        let charIndex = 0;
        
        const typeMessage = () => {
          if (charIndex < message.length) {
            bootLog.textContent += message.charAt(charIndex);
            charIndex++;
            setTimeout(typeMessage, Math.random() * 50 + 10);
          } else {
            bootLog.textContent += '\n';
            messageIndex++;
            
            // Update progress
            progress = (messageIndex / bootMessages.length) * 100;
            progressBar.style.width = `${progress}%`;
            
            // Add color to progress bar based on progress
            const hue = (progress * 3) % 360;
            progressBar.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
            progressBar.style.boxShadow = `0 0 10px hsl(${hue}, 100%, 50%)`;
            
            // Add next message after a delay
            setTimeout(addMessage, Math.random() * 300 + 100);
          }
        };
        
        typeMessage();
      } else {
        // Boot sequence complete
        setTimeout(() => {
          bootScreen.style.opacity = '0';
          setTimeout(() => {
            bootScreen.style.display = 'none';
          }, 1000);
        }, 1500);
      }
    };
    
    // Start adding messages
    setTimeout(addMessage, 500);
  };
  
  // Start boot sequence
  runBootSequence();
});
