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
import { Obstacle } from './entities/Obstacle.js';
import { ParticleSystem } from './particles.js';
import { UIManager } from './ui.js';
import { ThrowController } from './throwController.js';
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
    this.throwController = null;

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
    this.obstacles = [];
    this.ballTrail = [];

    // Game state flags
    this.ballInFlight = false;
    this.canThrow = true;

    // Crowd bump system
    this.nextCrowdBumpTime = 0;
    this.crowdBumpFrequency = GAME_BALANCE.crowdBumpInterval;
    this.isBumpActive = false;
    this.bumpOffsetX = 0;
    this.bumpOffsetY = 0;

    // Timing
    this.lastTime = 0;
    this.deltaTime = 0;

    // Initialize
    this.init();
  }

  /**
   * Calculate responsive canvas size based on screen dimensions
   * @returns {{width: number, height: number}}
   */
  calculateResponsiveSize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Portrait aspect ratio (800x1200 = 2:3 = 0.667)
    const targetAspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

    // Check if portrait (height > width) - PRIMARY MODE
    const isPortrait = screenHeight > screenWidth;

    let canvasWidth, canvasHeight;

    // PORTRAIT MODE (primary design) - Fill screen height
    if (isPortrait) {
      console.log('📱 PORTRAIT MODE - Filling screen height');
      canvasHeight = screenHeight;
      canvasWidth = screenHeight * targetAspectRatio;

      // If width exceeds screen, scale to fit width instead
      if (canvasWidth > screenWidth) {
        canvasWidth = screenWidth;
        canvasHeight = screenWidth / targetAspectRatio;
      }
    } else {
      // LANDSCAPE MODE - Fill screen width
      console.log('↔️ LANDSCAPE MODE - Filling screen width');
      canvasWidth = screenWidth;
      canvasHeight = screenWidth / targetAspectRatio;

      // If height exceeds screen, scale to fit height instead
      if (canvasHeight > screenHeight) {
        canvasHeight = screenHeight;
        canvasWidth = screenHeight * targetAspectRatio;
      }
    }

    console.log(`${isPortrait ? '🔄 PORTRAIT' : '↔️ LANDSCAPE'} - Canvas: ${Math.round(canvasWidth)}x${Math.round(canvasHeight)}, Screen: ${screenWidth}x${screenHeight}, Ratio: ${targetAspectRatio.toFixed(3)}`);

    return {
      width: Math.round(canvasWidth),
      height: Math.round(canvasHeight),
    };
  }

  /**
   * Initialize the game
   */
  init() {
    // Calculate responsive canvas size
    const canvasSize = this.calculateResponsiveSize();

    // Create PIXI application (PixiJS v7 uses constructor options)
    this.app = new PIXI.Application({
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: COLORS.background,
      antialias: true,
      autoDensity: true,          // Auto-adjust for high DPI screens
      resolution: window.devicePixelRatio || 1,  // Support retina displays
    });

    // Store scale factor for coordinate adjustments
    this.scaleX = canvasSize.width / CANVAS_WIDTH;
    this.scaleY = canvasSize.height / CANVAS_HEIGHT;

    // Add to DOM
    document.getElementById('game-container').appendChild(this.app.view);

    // Canvas styling is handled by CSS in index.html
    this.app.view.style.display = 'block';

    // Create main containers
    this.gameContainer = new PIXI.Container();

    // Scale game container to match canvas size
    this.gameContainer.scale.set(this.scaleX, this.scaleY);

    this.app.stage.addChild(this.gameContainer);

    // Initialize particle system
    this.particles = new ParticleSystem(this.gameContainer);

    // Initialize throw controller
    this.throwController = new ThrowController(
      ENTITIES.ball.startX,
      ENTITIES.ball.startY
    );
    this.throwController.initVisuals(this.gameContainer);
    this.throwController.setupEventListeners(this.app.view);
    this.throwController.setScaleFactors(this.scaleX, this.scaleY); // Set initial scale
    this.throwController.setOnThrowCallback((velocity, force) => {
      this.throwBallWithVelocity(velocity, force);
    });

    // Setup UI callbacks
    this.setupUICallbacks();

    // Show UI
    this.ui.showUI(true);

    // Hide loading screen
    this.hideLoadingScreen();

    // Setup game loop
    this.app.ticker.add((time) => this.gameLoop(time));

    // Setup window resize handler
    this.setupResizeHandler();
  }

  /**
   * Setup window resize handler for responsive canvas
   */
  setupResizeHandler() {
    let resizeTimeout;

    const handleResize = () => {
      // Debounce resize events
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newSize = this.calculateResponsiveSize();

        // Resize renderer
        this.app.renderer.resize(newSize.width, newSize.height);

        // Update scale factors
        this.scaleX = newSize.width / CANVAS_WIDTH;
        this.scaleY = newSize.height / CANVAS_HEIGHT;

        // Scale game container to match new size
        if (this.gameContainer) {
          this.gameContainer.scale.set(this.scaleX, this.scaleY);
        }

        // Update throw controller scale factors for input
        if (this.throwController) {
          this.throwController.setScaleFactors(this.scaleX, this.scaleY);
        }

        console.log('🔄 Canvas resized to:', newSize);
      }, 250);
    };

    // Handle window resize
    window.addEventListener('resize', handleResize);

    // Handle orientation change (mobile)
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100); // Small delay for orientation change
    });
  }

  /**
   * Setup UI button callbacks
   */
  setupUICallbacks() {
    this.ui.bindCallbacks({
      onStart: () => this.startGame(),
      onThrow: () => this.throwBall(),
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

    // Create entities (ORDER MATTERS - later items draw on top!)
    // Drummer FIRST (background)
    this.drummer = new Drummer();
    this.gameContainer.addChild(this.drummer.getGraphics());

    // Singer
    this.singer = new Singer(this.physics);
    this.singer.setAvailablePatterns(levelConfig.singerPatterns);
    this.singer.setSpeedMultiplier(levelConfig.singerSpeed);
    this.gameContainer.addChild(this.singer.getGraphics());

    // Glass LAST so it's on top and VISIBLE!
    this.glass = new Glass(this.physics, levelConfig.glassSize);
    this.glass.getGraphics().forEach(g => this.gameContainer.addChild(g));

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

    // Create obstacles for this level
    this.createObstacles(levelConfig.obstacles);

    // Create audience area (visual only)
    this.createAudience();

    // Create ready ball indicator (visual only, shows where to throw from)
    this.createReadyBallIndicator();

    // Setup crowd bumps
    this.crowdBumpFrequency =
      GAME_BALANCE.crowdBumpInterval * levelConfig.crowdBumpFrequency;
    this.scheduleNextCrowdBump();

    // Update UI
    this.updateUI();

    // Enable drag mode (hide sliders, show drag instructions)
    this.ui.enableDragMode();

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
   * Create ready ball indicator (shows where to drag from)
   */
  createReadyBallIndicator() {
    // Create a visual ball at the throw position
    this.readyBallGraphics = new PIXI.Graphics();

    const radius = ENTITIES.ball.radius;
    const x = ENTITIES.ball.startX;
    const y = ENTITIES.ball.startY;

    // Ball outer circle - BRIGHT GREEN tennis ball
    this.readyBallGraphics.beginFill(0x9FCD2A); // Tennis ball green
    this.readyBallGraphics.drawCircle(x, y, radius);
    this.readyBallGraphics.endFill();

    // Tennis ball seam lines (white curves)
    this.readyBallGraphics.lineStyle(3, 0xFFFFFF, 0.8);

    // Left curve
    this.readyBallGraphics.arc(x, y, radius * 0.6, -Math.PI / 3, Math.PI / 3);

    // Right curve
    this.readyBallGraphics.arc(x, y, radius * 0.6, Math.PI * 2 / 3, Math.PI * 4 / 3);

    // Highlight for 3D effect
    this.readyBallGraphics.beginFill(0xFFFFFF, 0.4);
    this.readyBallGraphics.drawCircle(x - radius * 0.3, y - radius * 0.3, radius * 0.25);
    this.readyBallGraphics.endFill();

    // NO ANIMATION - Keep ball stationary to avoid confusion for beginners
    // (Animation removed to make it easier to learn slingshot controls)

    this.gameContainer.addChild(this.readyBallGraphics);
  }

  /**
   * Create obstacles for the level
   * @param {Array} obstacleConfigs - Array of obstacle configurations from level data
   */
  createObstacles(obstacleConfigs) {
    if (!obstacleConfigs || obstacleConfigs.length === 0) {
      return; // No obstacles for this level
    }

    // Clear existing obstacles
    this.obstacles.forEach(obstacle => obstacle.destroy());
    this.obstacles = [];

    // Create each obstacle
    obstacleConfigs.forEach((config) => {
      const obstacle = new Obstacle(
        this.physics,
        config.type,
        config.x,
        config.y,
        config.config || {}
      );

      this.obstacles.push(obstacle);
      this.gameContainer.addChild(obstacle.getGraphics());
    });

    console.log(`✅ Created ${this.obstacles.length} obstacles for level ${this.currentLevel}`);
  }

  /**
   * Create audience silhouettes (FOREGROUND - between you and stage)
   */
  createAudience() {
    const graphics = new PIXI.Graphics();

    // Crowd area background - LIGHTER for visibility!
    graphics.beginFill(0x1a1a1a);  // Lighter gray instead of black
    graphics.drawRect(
      0,
      ENTITIES.audience.startY,
      CANVAS_WIDTH,
      ENTITIES.audience.height
    );
    graphics.endFill();

    // Crowd silhouettes (large heads in foreground) - MUCH MORE VISIBLE!
    const rows = ENTITIES.audience.headRows;
    const cols = ENTITIES.audience.headCols;
    const spacing = CANVAS_WIDTH / cols;

    // Player position - skip crowd here so there's space for YOU
    const playerX = ENTITIES.ball.startX;
    const playerY = ENTITIES.ball.startY;
    const clearRadius = 60; // Clear space around player

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing + spacing / 2 + randomRange(-15, 15);
        const baseY = ENTITIES.audience.startY + 20;
        const y = baseY + (row * 70) + randomRange(-10, 10);

        // Skip crowd members too close to player position
        const distToPlayer = Math.sqrt(
          Math.pow(x - playerX, 2) + Math.pow(y - playerY, 2)
        );
        if (distToPlayer < clearRadius) {
          continue; // Skip this crowd member - it's where YOU are!
        }

        // Size increases as they get closer (bottom rows = closer = bigger)
        const sizeMult = 1 + (row * 0.4);
        const headSize = 25 * sizeMult;

        // Depth-based shading: farther back = darker, closer = lighter
        // Back rows (0-1) are darkest, front rows (4-5) are lighter
        const depthShade = 0x1a1a1a + (row * 0x0a0a0a); // Gradual lightening

        // Concert crowd silhouette
        graphics.beginFill(depthShade, 0.95);

        // Head (circular)
        graphics.drawCircle(x, y, headSize);

        // Neck
        graphics.drawRect(x - headSize * 0.3, y + headSize * 0.7, headSize * 0.6, headSize * 0.5);

        // Shoulders/upper body (trapezoid shape)
        graphics.beginFill(depthShade, 0.95);
        graphics.moveTo(x - headSize * 0.4, y + headSize * 1.1);
        graphics.lineTo(x + headSize * 0.4, y + headSize * 1.1);
        graphics.lineTo(x + headSize * 0.9, y + headSize * 2.2);
        graphics.lineTo(x - headSize * 0.9, y + headSize * 2.2);
        graphics.closePath();
        graphics.endFill();

        // Subtle rim light on one side (concert lighting)
        graphics.lineStyle(1, 0x4a4a5a, 0.4);
        graphics.arc(x - headSize * 0.6, y, headSize, -Math.PI / 2, Math.PI / 2);
        graphics.lineStyle(0);

        // Randomly add concert-goer details
        const pose = Math.random();

        if (pose < 0.3) {
          // Raised fist in the air (rock on!)
          const fistSide = Math.random() < 0.5 ? -1 : 1;
          graphics.beginFill(depthShade, 0.95);
          // Arm
          graphics.drawRect(
            x + fistSide * headSize * 0.5,
            y - headSize * 0.5,
            headSize * 0.3,
            headSize * 1.8
          );
          // Fist
          graphics.drawCircle(
            x + fistSide * headSize * 0.65,
            y - headSize * 0.7,
            headSize * 0.35
          );
          graphics.endFill();
        } else if (pose < 0.45) {
          // Both arms raised (going wild!)
          graphics.beginFill(depthShade, 0.95);
          // Left arm
          graphics.drawRect(x - headSize * 0.6, y - headSize * 0.3, headSize * 0.25, headSize * 1.5);
          graphics.drawCircle(x - headSize * 0.5, y - headSize * 0.5, headSize * 0.3);
          // Right arm
          graphics.drawRect(x + headSize * 0.35, y - headSize * 0.3, headSize * 0.25, headSize * 1.5);
          graphics.drawCircle(x + headSize * 0.5, y - headSize * 0.5, headSize * 0.3);
          graphics.endFill();
        } else if (pose < 0.6) {
          // Holding phone up (recording)
          const phoneSide = Math.random() < 0.5 ? -1 : 1;
          // Arm holding phone
          graphics.beginFill(depthShade, 0.95);
          graphics.drawRect(
            x + phoneSide * headSize * 0.4,
            y - headSize * 0.2,
            headSize * 0.25,
            headSize * 1.3
          );
          graphics.endFill();

          // Phone with bright screen
          const phoneX = x + phoneSide * headSize * 0.5;
          const phoneY = y - headSize * 0.4;
          graphics.beginFill(0xFFFFFF, 0.9);
          graphics.drawRoundedRect(phoneX - 4, phoneY - 6, 8, 14, 2);
          graphics.endFill();
          // Phone glow
          graphics.beginFill(0x66AAFF, 0.25);
          graphics.drawCircle(phoneX, phoneY, 18);
          graphics.endFill();
        }

        // Add hair variety (spiky, long, or short)
        const hairStyle = Math.random();
        graphics.beginFill(depthShade - 0x0a0a0a, 0.95); // Slightly darker for hair

        if (hairStyle < 0.4) {
          // Spiky punk hair
          for (let spike = 0; spike < 5; spike++) {
            const spikeAngle = -Math.PI / 2 + (spike - 2) * 0.4;
            const spikeX = x + Math.cos(spikeAngle) * headSize * 0.6;
            const spikeY = y - headSize + Math.sin(spikeAngle) * headSize * 0.6;
            graphics.drawCircle(spikeX, spikeY, headSize * 0.25);
          }
        } else if (hairStyle < 0.7) {
          // Long flowing hair
          graphics.drawEllipse(x, y - headSize * 0.2, headSize * 0.95, headSize * 1.3);
        } else {
          // Short/buzzed hair (just add to head)
          graphics.drawCircle(x, y - headSize * 0.1, headSize * 0.85);
        }
        graphics.endFill();
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
    if (this.readyBallGraphics) {
      this.readyBallGraphics = null;
    }

    // Clear obstacles
    this.obstacles.forEach(obstacle => {
      obstacle.destroy();
    });
    this.obstacles = [];

    // Clear particles
    this.particles.clear();

    // Reset physics
    this.physics.clearDynamicBodies();
  }

  /**
   * Throw the ball with velocity from drag controller
   */
  throwBallWithVelocity(velocity, force) {
    if (!this.canThrow || this.ballInFlight || this.state !== GAME_STATES.PLAYING) {
      return;
    }

    if (this.ballsRemaining <= 0) {
      return;
    }

    // Hide ready ball indicator
    if (this.readyBallGraphics) {
      this.readyBallGraphics.visible = false;
    }

    // Create ball
    this.activeBall = new Ball(
      this.physics,
      ENTITIES.ball.startX,
      ENTITIES.ball.startY
    );
    this.gameContainer.addChild(this.activeBall.getGraphics());

    // Apply crowd bump offset if active
    let finalVelocity = {
      x: velocity.x + this.bumpOffsetX,
      y: velocity.y + this.bumpOffsetY
    };

    console.log('🎾 Throwing ball with velocity:', finalVelocity);
    console.log('🎾 Ball start position:', ENTITIES.ball.startX, ENTITIES.ball.startY);

    // Throw ball with velocity vector (with bump offset if applicable)
    this.activeBall.throwWithVelocity(finalVelocity.x, finalVelocity.y);

    // Clear previous trail
    this.clearBallTrail();

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
   * Throw the ball (legacy method using sliders)
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

      // Clear trail
      this.clearBallTrail();

      this.ballInFlight = false;
      this.canThrow = true;

      // Show ready ball indicator again
      if (this.readyBallGraphics) {
        this.readyBallGraphics.visible = true;
      }

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

    // Clear trail
    this.clearBallTrail();

    this.ballInFlight = false;
    this.canThrow = true;

    // Show ready ball indicator again
    if (this.readyBallGraphics) {
      this.readyBallGraphics.visible = true;
    }

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

    // Set bump active flag
    this.isBumpActive = true;

    // Random aim offset (affects throws during bump)
    this.bumpOffsetX = (Math.random() - 0.5) * 8 * GAME_BALANCE.crowdBumpStrength;
    this.bumpOffsetY = (Math.random() - 0.5) * 8 * GAME_BALANCE.crowdBumpStrength;

    // Visual effects
    Animations.screenShake(this.gameContainer, 8);

    // UI effect
    this.ui.applyCrowdBump(GAME_BALANCE.crowdBumpStrength);

    // Show message
    this.ui.showFloatingText('CROWD BUMP!', CANVAS_WIDTH / 2, 100, '#ffff00');

    // Clear bump after duration
    setTimeout(() => {
      this.isBumpActive = false;
      this.bumpOffsetX = 0;
      this.bumpOffsetY = 0;
    }, 500);

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

        // Update ball trail
        this.updateBallTrail();

        // Debug: log ball position every frame
        const pos = this.activeBall.getPosition();
        const vel = this.activeBall.getVelocity();
        if (Math.abs(vel.x) > 0.1 || Math.abs(vel.y) > 0.1) {
          console.log(`📍 Ball pos: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}), vel: (${vel.x.toFixed(2)}, ${vel.y.toFixed(2)})`);
        }
      }

      // Update obstacles (for animated ones like spinning lights)
      this.obstacles.forEach(obstacle => {
        obstacle.update();
      });

      // Update particles
      this.particles.update(this.deltaTime);

      // Check crowd bump
      if (currentTime >= this.nextCrowdBumpTime) {
        this.triggerCrowdBump();
      }
    }
  }

  /**
   * Update ball trail (adds trail dots behind the ball)
   */
  updateBallTrail() {
    if (!this.activeBall) return;

    const pos = this.activeBall.getPosition();

    // Add trail dot every few frames
    if (this.ballTrail.length === 0 ||
        Math.abs(pos.x - this.ballTrail[this.ballTrail.length - 1].x) > 10 ||
        Math.abs(pos.y - this.ballTrail[this.ballTrail.length - 1].y) > 10) {

      const dot = new PIXI.Graphics();
      dot.beginFill(0x9FCD2A, 0.5); // Green with transparency
      dot.drawCircle(pos.x, pos.y, 3);
      dot.endFill();

      this.gameContainer.addChild(dot);
      this.ballTrail.push({ graphics: dot, x: pos.x, y: pos.y });

      // Limit trail length
      if (this.ballTrail.length > 30) {
        const old = this.ballTrail.shift();
        old.graphics.destroy();
      }
    }
  }

  /**
   * Clear ball trail
   */
  clearBallTrail() {
    this.ballTrail.forEach(dot => {
      dot.graphics.destroy();
    });
    this.ballTrail = [];
  }
}

export default Game;
