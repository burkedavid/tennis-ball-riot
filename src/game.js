/**
 * Main Game Class
 * Orchestrates all game systems, state management, and game loop
 */

import * as PIXI from 'pixi.js';
import { PhysicsWorld } from './physics.js';
import { Ball } from './entities/Ball.js';
import { Singer } from './entities/Singer.js';
import { Glass } from './entities/Glass.js';
import { Drummer } from './entities/Drummer.js';
import { BandMember } from './entities/BandMember.js';
import { ParticleSystem } from './particles.js';
import { UIManager } from './ui.js';
import * as Animations from './animations.js';
import { getLevelConfig, getTotalLevels } from './config/levelData.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GAME_STATES,
  ENTITIES,
  COLORS,
  SCORING,
  GAME_BALANCE,
} from './config/constants.js';
import { randomRange } from './utils.js';

export class Game {
  constructor() {
    // PIXI Application
    this.app = null;
    this.stage = null;
    this.gameContainer = null;

    // Systems
    this.physics = new PhysicsWorld();
    this.particles = null;
    this.ui = new UIManager();

    // Game State
    this.state = GAME_STATES.MENU;
    this.currentLevel = 1;
    this.score = 0;
    this.ballsRemaining = GAME_BALANCE.startingBalls;
    this.shotsMade = 0;
    this.goalShots = 1;
    this.comboCount = 0;

    // Entities
    this.activeBall = null;
    this.singer = null;
    this.glass = null;
    this.drummer = null;
    this.guitarist = null;
    this.bassist = null;
    this.stage = null;
    this.crowd = [];

    // Game state flags
    this.ballInFlight = false;
    this.canThrow = true;

    // Crowd bump system
    this.nextCrowdBumpTime = 0;
    this.crowdBumpFrequency = GAME_BALANCE.crowdBumpInterval;

    // Timing
    this.lastTime = 0;
    this.deltaTime = 0;

    // Initialize
    this.init();
  }

  /**
   * Initialize the game
   */
  init() {
    // Create PIXI application (PixiJS v7 uses constructor options)
    this.app = new PIXI.Application({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: COLORS.background,
      antialias: true,
    });

    // Add to DOM
    document.getElementById('game-container').appendChild(this.app.view);

    // Create main containers
    this.gameContainer = new PIXI.Container();
    this.app.stage.addChild(this.gameContainer);

    // Initialize particle system
    this.particles = new ParticleSystem(this.gameContainer);

    // Setup UI callbacks
    this.setupUICallbacks();

    // Show UI
    this.ui.showUI(true);

    // Hide loading screen
    this.hideLoadingScreen();

    // Setup game loop
    this.app.ticker.add((time) => this.gameLoop(time));
  }

  /**
   * Setup UI button callbacks
   */
  setupUICallbacks() {
    this.ui.bindCallbacks({
      onStart: () => this.startGame(),
      onThrow: () => this.throwBall(),
      onPause: () => this.pauseGame(),
      onResume: () => this.resumeGame(),
      onNextLevel: () => this.nextLevel(),
      onRestart: () => this.restartLevel(),
      onMenu: () => this.returnToMenu(),
    });
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }

  /**
   * Start the game
   */
  startGame() {
    this.currentLevel = 1;
    this.score = 0;
    this.loadLevel(this.currentLevel);
    this.setState(GAME_STATES.PLAYING);
    this.ui.hideAllModals();
  }

  /**
   * Load a level
   * @param {number} levelNum
   */
  loadLevel(levelNum) {
    // Clear existing entities
    this.clearLevel();

    // Get level config
    const levelConfig = getLevelConfig(levelNum);
    this.currentLevel = levelNum;
    this.goalShots = levelConfig.goalShots;
    this.ballsRemaining = levelConfig.startingBalls;
    this.shotsMade = 0;
    this.comboCount = 0;

    // Create stage floor
    this.createStage();

    // Create entities
    this.glass = new Glass(this.physics, levelConfig.glassSize);
    this.glass.getGraphics().forEach(g => this.gameContainer.addChild(g));

    this.drummer = new Drummer();
    this.gameContainer.addChild(this.drummer.getGraphics());

    this.singer = new Singer(this.physics);
    this.singer.setAvailablePatterns(levelConfig.singerPatterns);
    this.singer.setSpeedMultiplier(levelConfig.singerSpeed);
    this.gameContainer.addChild(this.singer.getGraphics());

    // Create full band
    this.guitarist = new BandMember(
      ENTITIES.guitarist.x,
      ENTITIES.guitarist.y,
      'guitar',
      ENTITIES.guitarist.color
    );
    this.gameContainer.addChild(this.guitarist.getGraphics());

    this.bassist = new BandMember(
      ENTITIES.bassist.x,
      ENTITIES.bassist.y,
      'bass',
      ENTITIES.bassist.color
    );
    this.gameContainer.addChild(this.bassist.getGraphics());

    // Create audience area (visual only)
    this.createAudience();

    // Setup crowd bumps
    this.crowdBumpFrequency =
      GAME_BALANCE.crowdBumpInterval * levelConfig.crowdBumpFrequency;
    this.scheduleNextCrowdBump();

    // Update UI
    this.updateUI();

    // Reset flags
    this.canThrow = true;
    this.ballInFlight = false;

    // Start physics
    this.physics.start();
  }

  /**
   * Create stage with backdrop and lights (SIDE VIEW)
   */
  createStage() {
    const graphics = new PIXI.Graphics();

    // Stage backdrop (dark purple gradient - concert venue wall)
    const gradient = graphics.beginFill(ENTITIES.stage.backdropColor);
    graphics.drawRect(0, ENTITIES.stage.backdropY, CANVAS_WIDTH, ENTITIES.stage.backdropHeight);
    graphics.endFill();

    // Add lighter section for stage area
    graphics.beginFill(0x2a1a4e, 0.6);
    graphics.drawRect(0, 300, CANVAS_WIDTH, 100);
    graphics.endFill();

    // Stage floor line (horizontal)
    graphics.lineStyle(ENTITIES.stage.height, ENTITIES.stage.color);
    graphics.moveTo(0, ENTITIES.stage.y);
    graphics.lineTo(CANVAS_WIDTH, ENTITIES.stage.y);

    // Colorful stage lights (spots on backdrop)
    const lightColors = [0xFF00FF, 0x00FFFF, 0xFF0080, 0xFFFF00, 0x00FF00];
    for (let i = 0; i < 8; i++) {
      const x = (i + 1) * (CANVAS_WIDTH / 9);
      const y = 50;
      const color = lightColors[i % lightColors.length];

      // Light source
      graphics.beginFill(color, 0.8);
      graphics.drawCircle(x, y, 12);
      graphics.endFill();

      // Light beam (cone shape)
      graphics.beginFill(color, 0.15);
      graphics.moveTo(x, y);
      graphics.lineTo(x - 100, ENTITIES.stage.y);
      graphics.lineTo(x + 100, ENTITIES.stage.y);
      graphics.closePath();
      graphics.endFill();
    }

    // Stage equipment (amps, speakers, cables)
    // Left side amp stack
    graphics.beginFill(0x1a1a1a);
    graphics.drawRect(50, 320, 60, 80);
    graphics.drawRect(120, 320, 60, 80);
    graphics.endFill();
    graphics.lineStyle(3, 0x444444);
    graphics.drawRect(50, 320, 60, 80);
    graphics.drawRect(120, 320, 60, 80);

    // Amp grilles (speaker mesh)
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 4; i++) {
      graphics.drawCircle(80, 345 + i * 15, 8);
      graphics.drawCircle(150, 345 + i * 15, 8);
    }

    // Right side amp stack
    graphics.lineStyle(0);
    graphics.beginFill(0x1a1a1a);
    graphics.drawRect(1020, 320, 60, 80);
    graphics.drawRect(1090, 320, 60, 80);
    graphics.endFill();
    graphics.lineStyle(3, 0x444444);
    graphics.drawRect(1020, 320, 60, 80);
    graphics.drawRect(1090, 320, 60, 80);

    // Right amp grilles
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 4; i++) {
      graphics.drawCircle(1050, 345 + i * 15, 8);
      graphics.drawCircle(1120, 345 + i * 15, 8);
    }

    // Cables on stage floor (black snaking cables)
    graphics.lineStyle(5, 0x111111);
    graphics.moveTo(200, ENTITIES.stage.y);
    graphics.quadraticCurveTo(400, ENTITIES.stage.y - 10, 600, ENTITIES.stage.y);
    graphics.moveTo(700, ENTITIES.stage.y);
    graphics.quadraticCurveTo(850, ENTITIES.stage.y - 15, 1000, ENTITIES.stage.y);

    // Mic stands (center stage)
    graphics.lineStyle(3, 0x333333);
    graphics.moveTo(400, ENTITIES.stage.y);
    graphics.lineTo(400, ENTITIES.stage.y - 120);
    graphics.moveTo(700, ENTITIES.stage.y);
    graphics.lineTo(700, ENTITIES.stage.y - 120);

    // Fog effect (layered semi-transparent white)
    graphics.beginFill(0xCCCCCC, 0.15);
    graphics.drawRect(0, ENTITIES.stage.y - 50, CANVAS_WIDTH, 50);
    graphics.endFill();
    graphics.beginFill(0xAAAAAA, 0.10);
    graphics.drawRect(0, ENTITIES.stage.y - 100, CANVAS_WIDTH, 50);
    graphics.endFill();

    this.gameContainer.addChild(graphics);
    this.stage = graphics;

    // Create physics body for stage floor (invisible collision)
    this.physics.createStaticRect(
      CANVAS_WIDTH / 2,
      ENTITIES.stage.y,
      CANVAS_WIDTH,
      10,
      'stage'
    );

    // Create walls
    this.physics.createStaticRect(-25, CANVAS_HEIGHT / 2, 50, CANVAS_HEIGHT, 'leftWall');
    this.physics.createStaticRect(
      CANVAS_WIDTH + 25,
      CANVAS_HEIGHT / 2,
      50,
      CANVAS_HEIGHT,
      'rightWall'
    );
  }

  /**
   * Create audience silhouettes (FOREGROUND - between you and stage)
   */
  createAudience() {
    const graphics = new PIXI.Graphics();

    // Darker background fill (crowd area) - very dark
    graphics.beginFill(0x050505);
    graphics.drawRect(
      0,
      ENTITIES.audience.startY,
      CANVAS_WIDTH,
      ENTITIES.audience.height
    );
    graphics.endFill();

    // Crowd silhouettes (large heads in foreground) - VISIBLE!
    const rows = ENTITIES.audience.headRows;
    const cols = ENTITIES.audience.headCols;
    const spacing = CANVAS_WIDTH / cols;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing + spacing / 2 + randomRange(-15, 15);
        const baseY = ENTITIES.audience.startY + 20;
        const y = baseY + (row * 70) + randomRange(-10, 10);

        // Size increases as they get closer (bottom rows = closer = bigger)
        const sizeMult = 1 + (row * 0.4);
        const headSize = 25 * sizeMult;

        // DARKER silhouette (head + shoulders) - pure black against dark gray
        graphics.beginFill(0x000000, 0.95);

        // Head
        graphics.drawCircle(x, y, headSize);

        // Shoulders (wider than head)
        graphics.drawEllipse(x, y + headSize * 1.2, headSize * 1.5, headSize * 0.8);

        graphics.endFill();

        // Edge highlight to make silhouettes POP
        graphics.lineStyle(1, 0x222222, 0.5);
        graphics.drawCircle(x - 2, y - 2, headSize);
        graphics.lineStyle(0);

        // Occasionally add raised arm silhouette
        if (Math.random() < 0.3) {
          graphics.beginFill(0x000000, 0.9);
          const armX = x + (Math.random() < 0.5 ? -headSize : headSize);
          const armY = y - headSize * 1.5;
          // Raised arm (triangle/cone shape)
          graphics.moveTo(x + headSize * 0.7, y);
          graphics.lineTo(armX, armY);
          graphics.lineTo(armX - 10, armY + 20);
          graphics.closePath();
          graphics.endFill();
        }

        // Add wild hair to some (spiky concert hair)
        if (Math.random() < 0.5) {
          graphics.beginFill(0x000000, 0.95);
          // Multiple spikes
          for (let s = -1; s <= 1; s++) {
            graphics.drawCircle(
              x + s * headSize * 0.4,
              y - headSize * 0.9,
              headSize * 0.4
            );
          }
          graphics.endFill();
        }

        // Phone lights (some people recording) - use own position
        if (Math.random() < 0.15) {
          const phoneX = x + headSize;
          const phoneY = y - headSize;
          graphics.beginFill(0xFFFFFF, 0.8);
          graphics.drawRect(phoneX, phoneY, 8, 12);
          graphics.endFill();
          // Phone glow
          graphics.beginFill(0x88CCFF, 0.3);
          graphics.drawCircle(phoneX + 4, phoneY + 6, 15);
          graphics.endFill();
        }
      }
    }

    this.gameContainer.addChild(graphics);
  }

  /**
   * Clear level entities
   */
  clearLevel() {
    // Remove all children from game container
    while (this.gameContainer.children.length > 0) {
      const child = this.gameContainer.children[0];
      this.gameContainer.removeChild(child);
      if (child.destroy) {
        child.destroy();
      }
    }

    // Clean up entities
    if (this.activeBall) {
      this.activeBall.destroy();
      this.activeBall = null;
    }
    if (this.singer) {
      this.singer.destroy();
      this.singer = null;
    }
    if (this.glass) {
      this.glass.destroy();
      this.glass = null;
    }
    if (this.drummer) {
      this.drummer.destroy();
      this.drummer = null;
    }
    if (this.guitarist) {
      this.guitarist.destroy();
      this.guitarist = null;
    }
    if (this.bassist) {
      this.bassist.destroy();
      this.bassist = null;
    }

    // Clear particles
    this.particles.clear();

    // Reset physics
    this.physics.clearDynamicBodies();
  }

  /**
   * Throw the ball
   */
  throwBall() {
    if (!this.canThrow || this.ballInFlight || this.state !== GAME_STATES.PLAYING) {
      return;
    }

    if (this.ballsRemaining <= 0) {
      return;
    }

    // Get throw parameters from UI
    const angle = this.ui.getAngle();
    const power = this.ui.getPower();

    // Create ball
    this.activeBall = new Ball(
      this.physics,
      ENTITIES.ball.startX,
      ENTITIES.ball.startY
    );
    this.gameContainer.addChild(this.activeBall.getGraphics());

    // Throw ball
    this.activeBall.throw(angle, power);

    // Update state
    this.ballsRemaining--;
    this.ballInFlight = true;
    this.canThrow = false;

    // Update UI
    this.updateUI();

    // Monitor ball
    this.monitorBall();
  }

  /**
   * Monitor ball flight
   */
  monitorBall() {
    const checkInterval = setInterval(() => {
      if (!this.activeBall || this.state !== GAME_STATES.PLAYING) {
        clearInterval(checkInterval);
        return;
      }

      // Check if ball in glass
      const pos = this.activeBall.getPosition();
      if (this.glass.checkBallInGlass(pos.x, pos.y)) {
        clearInterval(checkInterval);
        this.handleSuccessfulShot();
        return;
      }

      // Check if ball stopped or out of bounds
      if (this.activeBall.isStopped() || this.activeBall.isOutOfBounds()) {
        clearInterval(checkInterval);
        this.handleMissedShot();
        return;
      }
    }, 100);
  }

  /**
   * Handle successful shot
   */
  handleSuccessfulShot() {
    this.shotsMade++;
    this.comboCount++;

    // Calculate score
    let points = SCORING.successfulShot;

    // Combo multiplier
    const comboMultiplier =
      SCORING.comboMultipliers[
        Math.min(this.comboCount - 1, SCORING.comboMultipliers.length - 1)
      ] || 1;
    points *= comboMultiplier;

    // Bounce bonus
    if (this.activeBall.bounceCount === 0) {
      points += SCORING.noBounceBonus;
    } else if (this.activeBall.bounceCount === 1) {
      points += SCORING.bankShotBonus;
    } else if (this.activeBall.bounceCount >= 2) {
      points += SCORING.trickShotBonus;
    }

    this.score += points;

    // Visual effects
    this.glass.splash();
    this.glass.setGlow(1);
    this.particles.createSplash(
      this.glass.getTargetPosition().x,
      this.glass.getTargetPosition().y
    );
    this.particles.createConfetti(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    Animations.screenShake(this.gameContainer, 5);

    // Drummer celebrates
    this.drummer.celebrate();

    // Show floating text
    const messages = ['NICE!', 'RADICAL!', 'SICK SHOT!', 'AWESOME!'];
    const message = messages[Math.floor(Math.random() * messages.length)];
    this.ui.showFloatingText(
      `${message} +${points}`,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 3,
      '#00ff00'
    );

    // Clean up ball
    setTimeout(() => {
      if (this.activeBall) {
        this.activeBall.destroy();
        this.activeBall = null;
      }
      this.ballInFlight = false;
      this.canThrow = true;

      // Check level complete
      if (this.shotsMade >= this.goalShots) {
        this.levelComplete();
      } else {
        this.updateUI();
      }
    }, 1000);
  }

  /**
   * Handle missed shot
   */
  handleMissedShot() {
    this.comboCount = 0; // Reset combo

    // Show message
    const messages = ['OOF!', 'SO CLOSE!', 'TRY AGAIN!'];
    const message = messages[Math.floor(Math.random() * messages.length)];
    this.ui.showFloatingText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3, '#ff6666');

    // Clean up ball
    if (this.activeBall) {
      this.activeBall.destroy();
      this.activeBall = null;
    }
    this.ballInFlight = false;
    this.canThrow = true;

    // Check game over
    if (this.ballsRemaining <= 0 && this.shotsMade < this.goalShots) {
      setTimeout(() => this.gameOver(), 500);
    } else {
      this.updateUI();
    }
  }

  /**
   * Schedule next crowd bump
   */
  scheduleNextCrowdBump() {
    const variance = randomRange(
      -GAME_BALANCE.crowdBumpVariance,
      GAME_BALANCE.crowdBumpVariance
    );
    this.nextCrowdBumpTime = Date.now() + this.crowdBumpFrequency + variance;
  }

  /**
   * Trigger crowd bump
   */
  triggerCrowdBump() {
    if (this.state !== GAME_STATES.PLAYING) return;

    // Visual effect
    Animations.screenShake(this.gameContainer, 8);

    // UI effect
    this.ui.applyCrowdBump(GAME_BALANCE.crowdBumpStrength);

    // Show message
    this.ui.showFloatingText('CROWD BUMP!', CANVAS_WIDTH / 2, 100, '#ffff00');

    // Schedule next bump
    this.scheduleNextCrowdBump();
  }

  /**
   * Level complete
   */
  levelComplete() {
    this.setState(GAME_STATES.LEVEL_COMPLETE);

    // Calculate bonus
    let bonus = 0;
    const ballsUsed = getLevelConfig(this.currentLevel).startingBalls - this.ballsRemaining;
    if (ballsUsed < 5) {
      bonus += SCORING.efficientBonus;
    }

    const totalScore = this.score + bonus;

    // Show modal
    this.ui.setLevelCompleteContent({
      shotsMade: this.shotsMade,
      goalShots: this.goalShots,
      ballsUsed: ballsUsed,
      totalBalls: getLevelConfig(this.currentLevel).startingBalls,
      bonus: bonus,
      totalScore: totalScore,
    });

    this.ui.showModal('levelComplete');

    // Update score with bonus
    this.score = totalScore;
  }

  /**
   * Game over
   */
  gameOver() {
    this.setState(GAME_STATES.GAME_OVER);

    this.ui.setGameOverContent({
      shotsMade: this.shotsMade,
      goalShots: this.goalShots,
      score: this.score,
    });

    this.ui.showModal('gameOver');
  }

  /**
   * Next level
   */
  nextLevel() {
    if (this.currentLevel < getTotalLevels()) {
      this.currentLevel++;
      this.loadLevel(this.currentLevel);
      this.setState(GAME_STATES.PLAYING);
      this.ui.hideAllModals();
    } else {
      // Game complete!
      alert(`Congratulations! You completed all levels! Final Score: ${this.score}`);
      this.returnToMenu();
    }
  }

  /**
   * Restart level
   */
  restartLevel() {
    this.loadLevel(this.currentLevel);
    this.setState(GAME_STATES.PLAYING);
    this.ui.hideAllModals();
  }

  /**
   * Return to menu
   */
  returnToMenu() {
    this.clearLevel();
    this.setState(GAME_STATES.MENU);
    this.ui.showModal('menu');
  }

  /**
   * Pause game
   */
  pauseGame() {
    if (this.state === GAME_STATES.PLAYING) {
      this.setState(GAME_STATES.PAUSED);
      this.ui.showModal('pause');
      this.physics.stop();
    }
  }

  /**
   * Resume game
   */
  resumeGame() {
    if (this.state === GAME_STATES.PAUSED) {
      this.setState(GAME_STATES.PLAYING);
      this.ui.hideAllModals();
      this.physics.start();
    }
  }

  /**
   * Set game state
   * @param {string} newState
   */
  setState(newState) {
    this.state = newState;
  }

  /**
   * Update UI
   */
  updateUI() {
    const levelConfig = getLevelConfig(this.currentLevel);

    this.ui.updateHUD({
      levelName: levelConfig.name,
      score: this.score,
      ballsRemaining: this.ballsRemaining,
      goal: `${this.shotsMade}/${this.goalShots}`,
    });

    this.ui.setThrowButtonEnabled(this.canThrow && this.ballsRemaining > 0);
  }

  /**
   * Main game loop
   * @param {PIXI.Ticker} ticker
   */
  gameLoop(ticker) {
    const currentTime = Date.now();
    this.deltaTime = currentTime - (this.lastTime || currentTime);
    this.lastTime = currentTime;

    // Only update if playing
    if (this.state === GAME_STATES.PLAYING) {
      // Update physics
      this.physics.update(this.deltaTime);

      // Update entities
      if (this.singer) {
        this.singer.update(this.deltaTime);
      }
      if (this.drummer) {
        this.drummer.update(this.deltaTime);
      }
      if (this.guitarist) {
        this.guitarist.update(this.deltaTime);
      }
      if (this.bassist) {
        this.bassist.update(this.deltaTime);
      }
      if (this.glass) {
        this.glass.update(this.deltaTime);
      }
      if (this.activeBall) {
        this.activeBall.update();
      }

      // Update particles
      this.particles.update(this.deltaTime);

      // Check crowd bump
      if (currentTime >= this.nextCrowdBumpTime) {
        this.triggerCrowdBump();
      }
    }
  }
}

export default Game;
