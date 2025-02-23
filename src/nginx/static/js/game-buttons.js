export function toggle3dButton()
{
    const threeDButton = document.getElementById('3d');
    const twoDButton = document.getElementById('2d');
    const canvas2d = document.getElementById('game-canvas');
    const canvas3d = document.getElementById('three-canvas');

    threeDButton.addEventListener('click', async () => {
      // Set active state on the UI
      threeDButton.classList.add('active');
      twoDButton.classList.remove('active');
      
      // Hide the 2D canvas and show the 3D canvas
      canvas2d.style.display = 'none';
      canvas3d.style.display = 'block';
      
      // Set the 3D canvas size to match the 2D canvas
      canvas3d.width = canvas2d.width;
      canvas3d.height = canvas2d.height;
      
      // Dynamically import and initialize the 3D game module
      const game3dModule = await import('./game_3d.js');
      
      // Clean up any existing 3D resources before initializing
      game3dModule.cleanup();
      
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      gameSettings.contextType = '3d';  // Update the context type
      
      // Initialize the 3D game with explicit canvas size
      game3dModule.initGame3D(canvas3d);
      game3dModule.resizeRenderer(canvas3d.clientWidth, canvas3d.clientHeight);
      game3dModule.animate();
    });

    twoDButton.addEventListener('click', async () => {
      twoDButton.classList.add('active');
      threeDButton.classList.remove('active');
      canvas3d.style.display = 'none';
      canvas2d.style.display = 'block';
      gameSettings.contextType = '2d';
      
      // Clean up 3D resources
      const game3dModule = await import('./game_3d.js');
      game3dModule.cleanup();
    });

    // Fix the resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
      // Debounce resize events
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(async () => {
        if (gameSettings.contextType === '3d') {
          const game3dModule = await import('./game_3d.js');
          game3dModule.resizeRenderer(canvas3d.clientWidth, canvas3d.clientHeight);
        }
      }, 100);
    });
}