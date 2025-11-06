/**
 * Game Constants and Configuration
 * Central location for all game constants, physics settings, and configuration values
 */

// Canvas and Rendering - PORTRAIT MODE for mobile-first design
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 1200;
export const TARGET_FPS = 60;

// Physics Configuration
export const PHYSICS_CONFIG = {
  gravity: { x: 0, y: 0.25 },        // VERY LOW gravity - balls fly high! (was 0.3)
  ballRestitution: 0.6,              // Ball bounciness
  glassRestitution: 0.3,             // Glass absorbs energy
  stageRestitution: 0.2,             // Stage very forgiving - barely bounces (was 0.3)
  airResistance: 0.004,              // MINIMAL air resistance (was 0.006)
  spinFactor: 0.05,                  // Ball spin affects trajectory
  windStrength: 0.15,                // Wind force (when active)
  throwForceMultiplier: 0.07,        // Balanced for visible arc and reachable target
};

// Game Balance
export const GAME_BALANCE = {
  startingBalls: 10,
  maxAngle: 85,                      // Maximum throw angle (degrees)
  minAngle: 5,                       // Minimum throw angle (degrees)
  maxPower: 100,                     // Maximum throw power
  minPower: 10,                      // Minimum throw power
  crowdBumpInterval: 5000,           // Base time between crowd bumps (ms)
  crowdBumpVariance: 2000,           // Random variance in bump timing (ms)
  crowdBumpStrength: 0.3,            // How much crowd bumps affect aim
};

// Scoring
export const SCORING = {
  successfulShot: 100,
  firstTryBonus: 50,
  efficientBonus: 100,               // Under 5 balls used on level
  noBounceBonus: 50,                 // Direct hit
  bankShotBonus: 25,                 // 1 bounce
  trickShotBonus: 100,               // 2+ bounces
  crowdBumpBonus: 75,                // Hit during crowd bump
  comboMultipliers: [1.0, 1.5, 2.0, 3.0],  // Consecutive shots
};

// Entity Sizes and Positions
// PORTRAIT VIEW - Stage at TOP, YOU at BOTTOM
// Throw upward from bottom to hit glass at top!
// Stage: 0-300, Crowd: 700-1200, YOU: 1000 with pull-down space to 1200
export const ENTITIES = {
  ball: {
    radius: 22,                      // BIGGER for better visibility (was 15)
    color: 0x9FCD2A, // Tennis ball green
    startX: CANVAS_WIDTH / 2,        // Center horizontally (400)
    startY: 1000,                    // Near bottom - LOTS of room to pull down to 1200!
  },
  glass: {
    width: 90,                       // BIGGER glass
    height: 120,                     // TALLER glass
    x: 600,                          // Right side of stage (on drum kit)
    y: 360,                          // MOVED LOWER - stage lights below HUD (was 300)
    color: 0x88ccff,
    targetZoneRadius: 70,            // BIGGER target zone
  },
  drummer: {
    width: 100,
    height: 140,
    x: 600,                          // Right side of stage
    y: 410,                          // MOVED LOWER (was 350)
    color: 0x9933FF,                 // Purple
  },
  singer: {
    width: 80,
    height: 140,
    minX: 150,                       // Moves LEFT-RIGHT across stage
    maxX: 650,
    y: 410,                          // MOVED LOWER (was 350)
    color: 0xff9933,
    baseSpeed: 3,                    // Horizontal movement
  },
  guitarist: {
    x: 150,                          // Far left of stage
    y: 410,                          // MOVED LOWER (was 350)
    color: 0x6633FF,
  },
  bassist: {
    x: 400,                          // Center of stage
    y: 410,                          // MOVED LOWER (was 350)
    color: 0xFF3366,
  },
  stage: {
    y: 480,                          // MOVED LOWER - stage floor (was 420)
    height: 5,                       // Thin floor line
    color: 0x444444,
    backdropY: 180,                  // MOVED LOWER - backdrop well below HUD (was 120)
    backdropHeight: 300,             // Backdrop area (180-480)
    backdropColor: 0x1a0a2e,         // Dark purple stage backdrop
  },
  audience: {
    startY: 700,                     // Crowd in bottom area
    height: 500,                     // Bottom half of screen
    color: 0x000000,
    headRows: 6,                     // Rows of crowd
    headCols: 16,                    // Fewer columns (narrower width)
  }
};

// Colors
export const COLORS = {
  background: 0x1a1a1a,
  stage: 0x2a2a2a,
  spotlight: 0xffff00,
  neonPink: 0xff00ff,
  neonCyan: 0x00ffff,
  success: 0x00ff00,
  warning: 0xffff00,
  danger: 0xff0000,
};

// Game States
export const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over',
};

// Animation Durations (seconds)
export const ANIMATION_DURATIONS = {
  ballFlight: 2,
  screenShake: 0.3,
  scorePopup: 1,
  levelTransition: 1.5,
  crowdBump: 0.5,
};

// Particle Configuration
export const PARTICLES = {
  splash: {
    count: 80,                       // HUGE SPLASH (was 20)
    colors: [0x88ccff, 0x66aaff, 0xaaddff, 0xFFFFFF, 0x00FFFF],
    lifetime: 1.5,                   // Longer lasting (was 1)
  },
  confetti: {
    count: 50,
    colors: [0xff00ff, 0x00ffff, 0xffff00, 0xff0000, 0x00ff00],
    lifetime: 2,
  },
  spark: {
    count: 15,
    colors: [0xffff00, 0xff9900, 0xff6600],
    lifetime: 0.5,
  }
};

// UI Configuration
export const UI_CONFIG = {
  hudHeight: 100,
  controlHeight: 150,
  fontSize: {
    small: 14,
    medium: 18,
    large: 24,
    huge: 36,
  }
};

export default {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHYSICS_CONFIG,
  GAME_BALANCE,
  SCORING,
  ENTITIES,
  COLORS,
  GAME_STATES,
  ANIMATION_DURATIONS,
  PARTICLES,
  UI_CONFIG,
};
