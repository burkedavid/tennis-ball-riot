/**
 * Utility Functions
 * Helper functions used throughout the game
 */

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} radians
 */
export function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians
 * @returns {number} degrees
 */
export function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Clamp a value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number} clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} start
 * @param {number} end
 * @param {number} t - interpolation factor (0-1)
 * @returns {number} interpolated value
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Get random number between min and max
 * @param {number} min
 * @param {number} max
 * @returns {number} random value
 */
export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Get random integer between min and max (inclusive)
 * @param {number} min
 * @param {number} max
 * @returns {number} random integer
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate distance between two points
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number} distance
 */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if point is inside circle
 * @param {number} px - point x
 * @param {number} py - point y
 * @param {number} cx - circle x
 * @param {number} cy - circle y
 * @param {number} radius - circle radius
 * @returns {boolean} true if inside
 */
export function pointInCircle(px, py, cx, cy, radius) {
  return distance(px, py, cx, cy) <= radius;
}

/**
 * Check if point is inside rectangle
 * @param {number} px - point x
 * @param {number} py - point y
 * @param {number} rx - rect x
 * @param {number} ry - rect y
 * @param {number} width
 * @param {number} height
 * @returns {boolean} true if inside
 */
export function pointInRect(px, py, rx, ry, width, height) {
  return px >= rx && px <= rx + width && py >= ry && py <= ry + height;
}

/**
 * Get random element from array
 * @param {Array} arr
 * @returns {*} random element
 */
export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Format number with commas
 * @param {number} num
 * @returns {string} formatted number
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Wait for specified milliseconds
 * @param {number} ms
 * @returns {Promise} resolves after delay
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Easing function - ease out cubic
 * @param {number} t - time (0-1)
 * @returns {number} eased value
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function - ease in out cubic
 * @param {number} t - time (0-1)
 * @returns {number} eased value
 */
export function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default {
  degreesToRadians,
  radiansToDegrees,
  clamp,
  lerp,
  randomRange,
  randomInt,
  distance,
  pointInCircle,
  pointInRect,
  randomChoice,
  formatNumber,
  wait,
  easeOutCubic,
  easeInOutCubic,
};
