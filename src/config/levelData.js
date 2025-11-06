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
      { type: 'stage_monitor', x: 470, y: 450 },  // MOVED LOWER (was 390)
      { type: 'stage_monitor', x: 570, y: 450 },  // MOVED LOWER (was 390)
      { type: 'amp_stack', x: 230, y: 430 },  // MOVED LOWER (was 370)
      { type: 'spinning_light', x: 130, y: 360, config: { color: 0xFF00FF, spinSpeed: 4 } },  // MOVED LOWER (was 300)
      { type: 'spinning_light', x: 700, y: 360, config: { color: 0x00FFFF, spinSpeed: 3 } }  // MOVED LOWER (was 300)
    ],
    effects: ['fog', 'lights', 'strobe'],
    tutorial: false,
    drummerDrinks: true,              // Drummer occasionally drinks (glass disappears)
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
