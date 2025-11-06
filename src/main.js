/**
 * Main Entry Point
 * Initializes the game and handles application lifecycle
 */

import { Game } from './game.js';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/**
 * Initialize the application
 */
async function init() {
  console.log('🎸 Iggy Pop Tennis Ball Riot 🎸');
  console.log('Initializing game...');

  // Show loading progress
  updateLoadingProgress(30);

  try {
    // Create game instance
    const game = new Game();

    updateLoadingProgress(100);

    // Store globally for debugging
    window.game = game;

    console.log('✅ Game initialized successfully!');
    console.log('Available debug commands:');
    console.log('  window.game - Access game instance');
    console.log('  window.game.score - View current score');
    console.log('  window.game.currentLevel - View current level');
  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
    showError('Failed to load game. Please refresh the page.');
  }
}

/**
 * Update loading progress bar
 * @param {number} percent - Progress percentage (0-100)
 */
function updateLoadingProgress(percent) {
  const progressBar = document.getElementById('loading-progress');
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }
}

/**
 * Show error message
 * @param {string} message
 */
function showError(message) {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.innerHTML = `
      <div style="color: #ff0000; text-align: center; padding: 40px;">
        <h2>Error</h2>
        <p>${message}</p>
        <button onclick="location.reload()" style="
          margin-top: 20px;
          padding: 10px 20px;
          font-size: 16px;
          background: #ff0000;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        ">Reload Page</button>
      </div>
    `;
  }
}

// Handle window resize (optional - for responsive design)
window.addEventListener('resize', () => {
  // Could add responsive handling here if needed
  console.log('Window resized');
});

// Prevent context menu on canvas (optional - better UX)
document.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'CANVAS') {
    e.preventDefault();
  }
});

export { init };
