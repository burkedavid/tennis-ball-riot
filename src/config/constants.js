/**
 * Game Constants and Configuration
 * Central location for all game constants, physics settings, and configuration values
 */

// Canvas and Rendering
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
export const TARGET_FPS = 60;

// Physics Configuration
export const PHYSICS_CONFIG = {
  gravity: { x: 0, y: 0.4 },         // SLOWER gravity (was 0.8) - easier to track
  ballRestitution: 0.6,              // Ball bounciness
  glassRestitution: 0.3,             // Glass absorbs energy
  stageRestitution: 0.5,             // Stage has medium bounce
  airResistance: 0.008,              // MORE drag to slow ball (was 0.005)
  spinFactor: 0.05,                  // Ball spin affects trajectory
  windStrength: 0.15,                // Wind force (when active)
  throwForceMultiplier: 0.06,        // REDUCED for slower, more visible arc (was 0.08)
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
// SIDE VIEW PERSPECTIVE - Like watching a concert from Row 10
// Stage backdrop at top (0-400), stage floor at y=400
// Crowd heads in middle (450-650), you at bottom (750)
export const ENTITIES = {
  ball: {
    radius: 15,
    color: 0x9FCD2A, // Tennis ball green
    startX: CANVAS_WIDTH / 2,        // Center bottom (where YOU stand)
    startY: CANVAS_HEIGHT - 50,      // Bottom of screen (you throwing)
  },
  glass: {
    width: 90,                       // BIGGER glass (was 60)
    height: 120,                     // TALLER glass (was 80)
    x: 1000,                         // Right side of stage (on drum kit)
    y: 310,                          // On stage, above drums
    color: 0x88ccff,
    targetZoneRadius: 70,            // BIGGER target zone (was 50)
  },
  drummer: {
    width: 100,
    height: 140,
    x: 1000,                         // Right side of stage
    y: 360,                          // Standing on stage floor
    color: 0x9933FF,                 // Purple (was pink 0xff6699)
  },
  singer: {
    width: 80,
    height: 140,
    minX: 300,                       // Moves LEFT-RIGHT across stage
    maxX: 850,
    y: 360,                          // Standing on stage floor
    color: 0xff9933,
    baseSpeed: 3,                    // Faster horizontal movement
  },
  guitarist: {
    x: 250,                          // Far left of stage
    y: 360,
    color: 0x6633FF,
  },
  bassist: {
    x: 500,                          // Left-center of stage
    y: 360,
    color: 0xFF3366,
  },
  stage: {
    y: 400,                          // Horizontal stage floor line
    height: 5,                       // Thin floor line
    color: 0x444444,
    backdropY: 0,                    // Stage backdrop top
    backdropHeight: 400,             // Backdrop area (0-400)
    backdropColor: 0x1a0a2e,         // Dark purple stage backdrop
  },
  audience: {
    startY: 450,                     // Crowd silhouettes (foreground)
    height: 250,
    color: 0x000000,
    headRows: 3,                     // Rows of crowd heads
    headCols: 25,                    // Columns across
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
