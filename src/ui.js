/**
 * UI Manager
 * Handles all UI updates and interactions
 */

import { formatNumber } from './utils.js';

export class UIManager {
  constructor() {
    // Get DOM elements
    this.elements = {
      // HUD
      levelName: document.getElementById('level-name'),
      score: document.getElementById('score'),
      ballsRemaining: document.getElementById('balls-remaining'),
      goal: document.getElementById('goal'),

      // Controls
      controls: document.getElementById('controls'),
      angleSlider: document.getElementById('angle-slider'),
      angleFill: document.getElementById('angle-fill'),
      angleValue: document.getElementById('angle-value'),
      powerSlider: document.getElementById('power-slider'),
      powerFill: document.getElementById('power-fill'),
      powerValue: document.getElementById('power-value'),
      btnThrow: document.getElementById('btn-throw'),
      btnPause: document.getElementById('btn-pause'),

      // Modals
      uiOverlay: document.getElementById('ui-overlay'),
      menuModal: document.getElementById('menu-modal'),
      levelCompleteModal: document.getElementById('level-complete-modal'),
      levelCompleteContent: document.getElementById('level-complete-content'),
      gameOverModal: document.getElementById('game-over-modal'),
      gameOverContent: document.getElementById('game-over-content'),
      pauseModal: document.getElementById('pause-modal'),

      // Buttons
      btnStart: document.getElementById('btn-start'),
      btnNextLevel: document.getElementById('btn-next-level'),
      btnMenu: document.getElementById('btn-menu'),
      btnRestart: document.getElementById('btn-restart'),
      btnMenuGameover: document.getElementById('btn-menu-gameover'),
      btnResume: document.getElementById('btn-resume'),
      btnRestartPaused: document.getElementById('btn-restart-paused'),
      btnMenuPaused: document.getElementById('btn-menu-paused'),
    };

    // Slider values
    this.angle = 45;
    this.power = 50;

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup UI event listeners
   */
  setupEventListeners() {
    // Angle slider
    this.elements.angleSlider.addEventListener('click', (e) => {
      this.updateSlider(e, 'angle', 5, 85);
    });

    this.elements.angleSlider.addEventListener('mousemove', (e) => {
      if (e.buttons === 1) { // Left mouse button held
        this.updateSlider(e, 'angle', 5, 85);
      }
    });

    // Power slider
    this.elements.powerSlider.addEventListener('click', (e) => {
      this.updateSlider(e, 'power', 10, 100);
    });

    this.elements.powerSlider.addEventListener('mousemove', (e) => {
      if (e.buttons === 1) {
        this.updateSlider(e, 'power', 10, 100);
      }
    });
  }

  /**
   * Enable drag-to-throw mode (hide sliders, show instructions)
   */
  enableDragMode() {
    // Hide the entire controls div
    this.elements.controls.style.display = 'none';

    // Create drag instructions if not exists
    if (!document.getElementById('drag-instructions')) {
      const instructionsDiv = document.createElement('div');
      instructionsDiv.id = 'drag-instructions';
      instructionsDiv.className = 'drag-instructions';
      instructionsDiv.innerHTML = `
        <div class="instruction-title">🎾 Drag to Throw</div>
        <div class="instruction-text">
          <p>👆 <strong>Tap/Click</strong> on the screen</p>
          <p>↔️ <strong>Drag</strong> in the direction you want to throw</p>
          <p>🚀 <strong>Release</strong> to launch!</p>
          <p style="margin-top: 10px; font-size: 0.85rem; color: #aaa;">
            Longer drag = More power
          </p>
        </div>
      `;

      // Insert after hud or at the bottom
      this.elements.uiOverlay.appendChild(instructionsDiv);
    }

    // Store reference to instructions
    this.dragInstructions = document.getElementById('drag-instructions');
  }

  /**
   * Hide drag instructions temporarily (when ball is in flight)
   */
  hideDragInstructions() {
    if (this.dragInstructions) {
      this.dragInstructions.style.opacity = '0';
      this.dragInstructions.style.pointerEvents = 'none';
    }
  }

  /**
   * Show drag instructions
   */
  showDragInstructions() {
    if (this.dragInstructions) {
      this.dragInstructions.style.opacity = '1';
      this.dragInstructions.style.pointerEvents = 'auto';
    }
  }

  /**
   * Update slider value based on click position
   * @param {MouseEvent} e
   * @param {string} type - 'angle' or 'power'
   * @param {number} min
   * @param {number} max
   */
  updateSlider(e, type, min, max) {
    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const value = Math.round(min + (max - min) * percentage);

    if (type === 'angle') {
      this.angle = value;
      this.elements.angleFill.style.width = `${percentage * 100}%`;
      this.elements.angleValue.textContent = `${value}°`;
    } else if (type === 'power') {
      this.power = value;
      this.elements.powerFill.style.width = `${percentage * 100}%`;
      this.elements.powerValue.textContent = `${value}%`;
    }
  }

  /**
   * Get current angle value
   * @returns {number}
   */
  getAngle() {
    return this.angle;
  }

  /**
   * Get current power value
   * @returns {number}
   */
  getPower() {
    return this.power;
  }

  /**
   * Update HUD values
   * @param {Object} data
   */
  updateHUD(data) {
    if (data.levelName !== undefined) {
      this.elements.levelName.textContent = data.levelName;
    }
    if (data.score !== undefined) {
      this.elements.score.textContent = formatNumber(data.score);
    }
    if (data.ballsRemaining !== undefined) {
      this.elements.ballsRemaining.textContent = data.ballsRemaining;
    }
    if (data.goal !== undefined) {
      this.elements.goal.textContent = data.goal;
    }
  }

  /**
   * Enable/disable throw button
   * @param {boolean} enabled
   */
  setThrowButtonEnabled(enabled) {
    this.elements.btnThrow.disabled = !enabled;
  }

  /**
   * Show/hide UI overlay
   * @param {boolean} show
   */
  showUI(show) {
    this.elements.uiOverlay.style.display = show ? 'block' : 'none';
  }

  /**
   * Show modal
   * @param {string} modalName - 'menu', 'levelComplete', 'gameOver', 'pause'
   */
  showModal(modalName) {
    // Hide all modals first
    this.hideAllModals();

    // Show requested modal
    switch (modalName) {
      case 'menu':
        this.elements.menuModal.classList.add('active');
        break;
      case 'levelComplete':
        this.elements.levelCompleteModal.classList.add('active');
        break;
      case 'gameOver':
        this.elements.gameOverModal.classList.add('active');
        break;
      case 'pause':
        this.elements.pauseModal.classList.add('active');
        break;
    }
  }

  /**
   * Hide all modals
   */
  hideAllModals() {
    this.elements.menuModal.classList.remove('active');
    this.elements.levelCompleteModal.classList.remove('active');
    this.elements.gameOverModal.classList.remove('active');
    this.elements.pauseModal.classList.remove('active');
  }

  /**
   * Set level complete content
   * @param {Object} data
   */
  setLevelCompleteContent(data) {
    const html = `
      <p>Shots Made: ${data.shotsMade}/${data.goalShots}</p>
      <p>Balls Used: ${data.ballsUsed}/${data.totalBalls}</p>
      ${data.bonus > 0 ? `<p>Bonus: +${data.bonus}</p>` : ''}
      <p><strong>Total Score: ${formatNumber(data.totalScore)}</strong></p>
    `;
    this.elements.levelCompleteContent.innerHTML = html;
  }

  /**
   * Set game over content
   * @param {Object} data
   */
  setGameOverContent(data) {
    const html = `
      <p>Shots Made: ${data.shotsMade}/${data.goalShots}</p>
      <p>Final Score: ${formatNumber(data.score)}</p>
      <p style="margin-top: 15px; color: #888;">You ran out of balls!</p>
    `;
    this.elements.gameOverContent.innerHTML = html;
  }

  /**
   * Show floating text at position
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {string} color
   */
  showFloatingText(text, x, y, color = '#00ffff') {
    const textElement = document.createElement('div');
    textElement.textContent = text;
    textElement.style.position = 'absolute';
    textElement.style.left = `${x}px`;
    textElement.style.top = `${y}px`;
    textElement.style.color = color;
    textElement.style.fontSize = '24px';
    textElement.style.fontWeight = 'bold';
    textElement.style.textShadow = `0 0 10px ${color}`;
    textElement.style.pointerEvents = 'none';
    textElement.style.zIndex = '1000';
    textElement.style.transform = 'translate(-50%, -50%)';
    textElement.style.transition = 'all 1s ease-out';

    this.elements.uiOverlay.appendChild(textElement);

    // Animate
    setTimeout(() => {
      textElement.style.top = `${y - 50}px`;
      textElement.style.opacity = '0';
    }, 50);

    // Remove after animation
    setTimeout(() => {
      textElement.remove();
    }, 1100);
  }

  /**
   * Bind button callbacks
   * @param {Object} callbacks
   */
  bindCallbacks(callbacks) {
    if (callbacks.onStart) {
      this.elements.btnStart.onclick = callbacks.onStart;
    }
    if (callbacks.onThrow) {
      this.elements.btnThrow.onclick = callbacks.onThrow;
    }
    if (callbacks.onPause) {
      this.elements.btnPause.onclick = callbacks.onPause;
    }
    if (callbacks.onResume) {
      this.elements.btnResume.onclick = callbacks.onResume;
    }
    if (callbacks.onNextLevel) {
      this.elements.btnNextLevel.onclick = callbacks.onNextLevel;
    }
    if (callbacks.onRestart) {
      this.elements.btnRestart.onclick = callbacks.onRestart;
      this.elements.btnRestartPaused.onclick = callbacks.onRestart;
    }
    if (callbacks.onMenu) {
      this.elements.btnMenu.onclick = callbacks.onMenu;
      this.elements.btnMenuGameover.onclick = callbacks.onMenu;
      this.elements.btnMenuPaused.onclick = callbacks.onMenu;
    }
  }

  /**
   * Apply crowd bump effect to UI
   * @param {number} intensity
   */
  applyCrowdBump(intensity = 0.3) {
    // Shake the controls
    const controls = this.elements.controls;
    const originalTransform = controls.style.transform;

    const shakeAmount = 10 * intensity;
    const shakes = 5;
    let currentShake = 0;

    const shakeInterval = setInterval(() => {
      if (currentShake >= shakes) {
        controls.style.transform = originalTransform;
        clearInterval(shakeInterval);
        return;
      }

      const offsetX = (Math.random() - 0.5) * shakeAmount;
      const offsetY = (Math.random() - 0.5) * shakeAmount;
      controls.style.transform = `translate(calc(-50% + ${offsetX}px), ${offsetY}px)`;

      currentShake++;
    }, 50);
  }
}

export default UIManager;
