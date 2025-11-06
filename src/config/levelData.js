/**
 * Level Configuration Data
 * Defines all level-specific settings, difficulty progression, and goals
 */

export const LEVELS = [
  {
    id: 1,
    name: "Sound Check",
    description: "Tutorial level - Get familiar with the controls",
    glassSize: 1.0,                  // Multiplier for glass size
    startingBalls: 10,
    goalShots: 1,                    // Number of successful shots needed
    singerSpeed: 0.8,                // Speed multiplier for singer
    singerPatterns: ['pacing'],      // Movement patterns available
    crowdBumpFrequency: 1.2,         // Multiplier for bump frequency (higher = less frequent)
    crowdBumpStrength: 0.7,          // Multiplier for bump strength
    obstacles: [],                   // No obstacles in tutorial
    effects: [],                     // Visual effects active
    tutorial: true,
  },
  {
    id: 2,
    name: "Opening Act",
    description: "Things are heating up",
    glassSize: 0.9,
    startingBalls: 10,
    goalShots: 2,
    singerSpeed: 1.0,
    singerPatterns: ['pacing', 'jumping'],
    crowdBumpFrequency: 1.0,
    crowdBumpStrength: 0.9,
    obstacles: [
      { type: 'stage_monitor', x: 500, y: 450 }  // MOVED LOWER (was 390)
    ],
    effects: [],
    tutorial: false,
  },
  {
    id: 3,
    name: "Main Set",
    description: "The crowd is going wild!",
    glassSize: 0.75,
    startingBalls: 10,
    goalShots: 3,
    singerSpeed: 1.2,
    singerPatterns: ['pacing', 'jumping', 'running'],
    crowdBumpFrequency: 0.9,
    crowdBumpStrength: 1.0,
    obstacles: [
      { type: 'stage_monitor', x: 500, y: 450 },  // MOVED LOWER (was 390)
      { type: 'amp_stack', x: 270, y: 430 }  // MOVED LOWER (was 370)
    ],
    effects: ['fog'],
    tutorial: false,
  },
  {
    id: 4,
    name: "Encore",
    description: "Pure chaos on stage!",
    glassSize: 0.65,
    startingBalls: 10,
    goalShots: 4,
    singerSpeed: 1.4,
    singerPatterns: ['pacing', 'jumping', 'running', 'stagedive'],
    crowdBumpFrequency: 0.8,
    crowdBumpStrength: 1.2,
    obstacles: [
      { type: 'stage_monitor', x: 500, y: 450 },  // MOVED LOWER (was 390)
      { type: 'amp_stack', x: 230, y: 430 },  // MOVED LOWER (was 370)
      { type: 'spinning_light', x: 130, y: 360, config: { color: 0xFF00FF, spinSpeed: 3 } }  // MOVED LOWER (was 300)
    ],
    effects: ['fog', 'lights'],
    tutorial: false,
  },
  {
    id: 5,
    name: "Legendary Show",
    description: "Only legends survive this!",
    glassSize: 0.55,
    startingBalls: 10,
    goalShots: 5,
    singerSpeed: 1.6,
    singerPatterns: ['pacing', 'jumping', 'running', 'stagedive', 'spin'],
    crowdBumpFrequency: 0.7,
    crowdBumpStrength: 1.4,
    obstacles: [
      { type: 'stage_monitor', x: 470, y: 450 },
      { type: 'stage_monitor', x: 570, y: 450 },
      { type: 'amp_stack', x: 230, y: 430 },
      { type: 'spinning_light', x: 130, y: 360, config: { color: 0xFF00FF, spinSpeed: 4 } },
      { type: 'spinning_light', x: 700, y: 360, config: { color: 0x00FFFF, spinSpeed: 3 } }
    ],
    effects: ['fog', 'lights', 'strobe'],
    tutorial: false,
    drummerDrinks: true,
  },
  {
    id: 6,
    name: "Raw Power",
    description: "The intensity rises!",
    glassSize: 0.5,
    startingBalls: 9,
    goalShots: 6,
    singerSpeed: 1.8,
    singerPatterns: ['pacing', 'jumping', 'running', 'stagedive', 'spin'],
    crowdBumpFrequency: 0.6,
    crowdBumpStrength: 1.5,
    obstacles: [
      { type: 'stage_monitor', x: 450, y: 450 },
      { type: 'stage_monitor', x: 550, y: 450 },
      { type: 'stage_monitor', x: 650, y: 450 },
      { type: 'amp_stack', x: 200, y: 430 },
      { type: 'spinning_light', x: 100, y: 360, config: { color: 0xFF00FF, spinSpeed: 5 } },
      { type: 'spinning_light', x: 700, y: 360, config: { color: 0x00FFFF, spinSpeed: 4 } }
    ],
    effects: ['fog', 'lights', 'strobe'],
    tutorial: false,
    drummerDrinks: true,
  },
  {
    id: 7,
    name: "Lust for Life",
    description: "Chaos unleashed!",
    glassSize: 0.45,
    startingBalls: 9,
    goalShots: 6,
    singerSpeed: 2.0,
    singerPatterns: ['pacing', 'jumping', 'running', 'stagedive', 'spin'],
    crowdBumpFrequency: 0.5,
    crowdBumpStrength: 1.6,
    obstacles: [
      { type: 'stage_monitor', x: 400, y: 450 },
      { type: 'stage_monitor', x: 500, y: 450 },
      { type: 'stage_monitor', x: 600, y: 450 },
      { type: 'amp_stack', x: 180, y: 430 },
      { type: 'amp_stack', x: 720, y: 430 },
      { type: 'spinning_light', x: 100, y: 360, config: { color: 0xFF00FF, spinSpeed: 6 } },
      { type: 'spinning_light', x: 400, y: 300, config: { color: 0xFFFF00, spinSpeed: 5 } },
      { type: 'spinning_light', x: 700, y: 360, config: { color: 0x00FFFF, spinSpeed: 6 } }
    ],
    effects: ['fog', 'lights', 'strobe'],
    tutorial: false,
    drummerDrinks: true,
  },
  {
    id: 8,
    name: "The Passenger",
    description: "Expert precision required!",
    glassSize: 0.42,
    startingBalls: 8,
    goalShots: 7,
    singerSpeed: 2.2,
    singerPatterns: ['pacing', 'jumping', 'running', 'stagedive', 'spin'],
    crowdBumpFrequency: 0.45,
    crowdBumpStrength: 1.7,
    obstacles: [
      { type: 'stage_monitor', x: 370, y: 450 },
      { type: 'stage_monitor', x: 470, y: 450 },
      { type: 'stage_monitor', x: 570, y: 450 },
      { type: 'stage_monitor', x: 670, y: 450 },
      { type: 'amp_stack', x: 150, y: 430 },
      { type: 'amp_stack', x: 250, y: 430 },
      { type: 'spinning_light', x: 80, y: 360, config: { color: 0xFF00FF, spinSpeed: 7 } },
      { type: 'spinning_light', x: 400, y: 300, config: { color: 0xFFFF00, spinSpeed: 6 } },
      { type: 'spinning_light', x: 720, y: 360, config: { color: 0x00FFFF, spinSpeed: 7 } }
    ],
    effects: ['fog', 'lights', 'strobe'],
    tutorial: false,
    drummerDrinks: true,
  },
  {
    id: 9,
    name: "Search and Destroy",
    description: "Nearly impossible!",
    glassSize: 0.38,
    startingBalls: 8,
    goalShots: 7,
    singerSpeed: 2.4,
    singerPatterns: ['pacing', 'jumping', 'running', 'stagedive', 'spin'],
    crowdBumpFrequency: 0.4,
    crowdBumpStrength: 1.8,
    obstacles: [
      { type: 'stage_monitor', x: 350, y: 450 },
      { type: 'stage_monitor', x: 450, y: 450 },
      { type: 'stage_monitor', x: 550, y: 450 },
      { type: 'stage_monitor', x: 650, y: 450 },
      { type: 'amp_stack', x: 120, y: 430 },
      { type: 'amp_stack', x: 230, y: 430 },
      { type: 'amp_stack', x: 680, y: 430 },
      { type: 'spinning_light', x: 80, y: 360, config: { color: 0xFF00FF, spinSpeed: 8 } },
      { type: 'spinning_light', x: 300, y: 300, config: { color: 0xFFFF00, spinSpeed: 7 } },
      { type: 'spinning_light', x: 500, y: 300, config: { color: 0xFF0000, spinSpeed: 7 } },
      { type: 'spinning_light', x: 720, y: 360, config: { color: 0x00FFFF, spinSpeed: 8 } }
    ],
    effects: ['fog', 'lights', 'strobe'],
    tutorial: false,
    drummerDrinks: true,
  },
  {
    id: 10,
    name: "Iggy's Ultimate Challenge",
    description: "THE FINAL SHOWDOWN!",
    glassSize: 0.35,
    startingBalls: 7,
    goalShots: 8,
    singerSpeed: 2.6,
    singerPatterns: ['pacing', 'jumping', 'running', 'stagedive', 'spin'],
    crowdBumpFrequency: 0.35,
    crowdBumpStrength: 2.0,
    obstacles: [
      { type: 'stage_monitor', x: 330, y: 450 },
      { type: 'stage_monitor', x: 420, y: 450 },
      { type: 'stage_monitor', x: 510, y: 450 },
      { type: 'stage_monitor', x: 600, y: 450 },
      { type: 'stage_monitor', x: 690, y: 450 },
      { type: 'amp_stack', x: 100, y: 430 },
      { type: 'amp_stack', x: 200, y: 430 },
      { type: 'amp_stack', x: 700, y: 430 },
      { type: 'spinning_light', x: 60, y: 360, config: { color: 0xFF00FF, spinSpeed: 9 } },
      { type: 'spinning_light', x: 250, y: 300, config: { color: 0xFFFF00, spinSpeed: 8 } },
      { type: 'spinning_light', x: 400, y: 280, config: { color: 0xFF0000, spinSpeed: 8 } },
      { type: 'spinning_light', x: 550, y: 300, config: { color: 0x00FF00, spinSpeed: 8 } },
      { type: 'spinning_light', x: 740, y: 360, config: { color: 0x00FFFF, spinSpeed: 9 } }
    ],
    effects: ['fog', 'lights', 'strobe'],
    tutorial: false,
    drummerDrinks: true,
  },
];

/**
 * Get level configuration by level number
 * @param {number} levelNum - Level number (1-based)
 * @returns {object} Level configuration
 */
export function getLevelConfig(levelNum) {
  const level = LEVELS.find(l => l.id === levelNum);
  if (!level) {
    console.warn(`Level ${levelNum} not found, returning Level 1`);
    return LEVELS[0];
  }
  return level;
}

/**
 * Get total number of levels
 * @returns {number} Total levels
 */
export function getTotalLevels() {
  console.log(`📊 getTotalLevels() called - LEVELS.length = ${LEVELS.length}`);
  return LEVELS.length;
}

/**
 * Check if level exists
 * @param {number} levelNum - Level number (1-based)
 * @returns {boolean} True if level exists
 */
export function levelExists(levelNum) {
  return levelNum >= 1 && levelNum <= LEVELS.length;
}

export default {
  LEVELS,
  getLevelConfig,
  getTotalLevels,
  levelExists,
};
