/**
 * Animation Helpers using GSAP
 * Provides reusable animation functions for game objects and UI
 */

import gsap from 'gsap';
import { ANIMATION_DURATIONS } from './config/constants.js';

/**
 * Screen shake effect
 * @param {PIXI.Container} container - Container to shake
 * @param {number} intensity - Shake intensity (default 10)
 */
export function screenShake(container, intensity = 10) {
  const originalX = container.x;
  const originalY = container.y;

  gsap.to(container, {
    duration: 0.05,
    x: originalX + gsap.utils.random(-intensity, intensity),
    y: originalY + gsap.utils.random(-intensity, intensity),
    repeat: 5,
    yoyo: true,
    onComplete: () => {
      container.x = originalX;
      container.y = originalY;
    },
  });
}

/**
 * Pulse animation
 * @param {PIXI.DisplayObject} object - Object to pulse
 * @param {number} scale - Scale to pulse to (default 1.2)
 * @param {number} duration - Duration in seconds (default 0.3)
 */
export function pulse(object, scale = 1.2, duration = 0.3) {
  const originalScaleX = object.scale.x;
  const originalScaleY = object.scale.y;

  gsap.to(object.scale, {
    x: originalScaleX * scale,
    y: originalScaleY * scale,
    duration: duration,
    yoyo: true,
    repeat: 1,
    ease: 'power2.inOut',
  });
}

/**
 * Float animation (bobbing up and down)
 * @param {PIXI.DisplayObject} object - Object to float
 * @param {number} distance - Float distance in pixels
 * @param {number} duration - Duration in seconds
 */
export function float(object, distance = 5, duration = 1) {
  const originalY = object.y;

  gsap.to(object, {
    y: originalY - distance,
    duration: duration,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
  });
}

/**
 * Fade in animation
 * @param {PIXI.DisplayObject} object - Object to fade in
 * @param {number} duration - Duration in seconds (default 0.5)
 */
export function fadeIn(object, duration = 0.5) {
  object.alpha = 0;
  gsap.to(object, {
    alpha: 1,
    duration: duration,
    ease: 'power2.out',
  });
}

/**
 * Fade out animation
 * @param {PIXI.DisplayObject} object - Object to fade out
 * @param {number} duration - Duration in seconds (default 0.5)
 * @returns {Promise} Resolves when animation completes
 */
export function fadeOut(object, duration = 0.5) {
  return new Promise((resolve) => {
    gsap.to(object, {
      alpha: 0,
      duration: duration,
      ease: 'power2.in',
      onComplete: resolve,
    });
  });
}

/**
 * Slide in from side
 * @param {PIXI.DisplayObject} object - Object to slide
 * @param {string} direction - 'left' or 'right'
 * @param {number} distance - Distance to slide from
 * @param {number} duration - Duration in seconds
 */
export function slideIn(object, direction = 'left', distance = 200, duration = 0.5) {
  const originalX = object.x;

  if (direction === 'left') {
    object.x = originalX - distance;
  } else {
    object.x = originalX + distance;
  }

  gsap.to(object, {
    x: originalX,
    duration: duration,
    ease: 'back.out(1.7)',
  });
}

/**
 * Pop in animation (scale from 0 to 1)
 * @param {PIXI.DisplayObject} object - Object to pop in
 * @param {number} duration - Duration in seconds (default 0.4)
 */
export function popIn(object, duration = 0.4) {
  object.scale.set(0);
  gsap.to(object.scale, {
    x: 1,
    y: 1,
    duration: duration,
    ease: 'back.out(2)',
  });
}

/**
 * Rotate continuously
 * @param {PIXI.DisplayObject} object - Object to rotate
 * @param {number} duration - Duration for one full rotation (seconds)
 */
export function rotateContinuous(object, duration = 2) {
  gsap.to(object, {
    rotation: Math.PI * 2,
    duration: duration,
    repeat: -1,
    ease: 'none',
  });
}

/**
 * Wiggle animation
 * @param {PIXI.DisplayObject} object - Object to wiggle
 * @param {number} amount - Rotation amount in radians
 * @param {number} duration - Duration in seconds
 */
export function wiggle(object, amount = 0.1, duration = 0.1) {
  const originalRotation = object.rotation;

  gsap.to(object, {
    rotation: originalRotation + amount,
    duration: duration,
    yoyo: true,
    repeat: 5,
    ease: 'sine.inOut',
    onComplete: () => {
      object.rotation = originalRotation;
    },
  });
}

/**
 * Flash color effect
 * @param {PIXI.Graphics} graphics - Graphics object to flash
 * @param {number} color - Color to flash to (hex)
 * @param {number} duration - Duration in seconds
 */
export function flashColor(graphics, color = 0xFFFFFF, duration = 0.2) {
  // This would require storing original colors and reapplying
  // Simplified version - just tint
  const originalTint = graphics.tint;
  graphics.tint = color;

  setTimeout(() => {
    graphics.tint = originalTint;
  }, duration * 1000);
}

/**
 * Number counter animation
 * @param {Object} object - Object with value property to animate
 * @param {number} target - Target value
 * @param {number} duration - Duration in seconds
 * @param {Function} onUpdate - Callback on each update
 */
export function animateNumber(object, target, duration = 1, onUpdate = null) {
  gsap.to(object, {
    value: target,
    duration: duration,
    ease: 'power2.out',
    onUpdate: () => {
      if (onUpdate) {
        onUpdate(Math.round(object.value));
      }
    },
  });
}

/**
 * Bounce animation
 * @param {PIXI.DisplayObject} object - Object to bounce
 * @param {number} height - Bounce height in pixels
 * @param {number} duration - Duration in seconds
 */
export function bounce(object, height = 20, duration = 0.5) {
  const originalY = object.y;

  gsap.to(object, {
    y: originalY - height,
    duration: duration / 2,
    ease: 'power2.out',
    onComplete: () => {
      gsap.to(object, {
        y: originalY,
        duration: duration / 2,
        ease: 'bounce.out',
      });
    },
  });
}

/**
 * Trail effect (multiple copies fading out)
 * @param {PIXI.DisplayObject} object - Object to create trail for
 * @param {PIXI.Container} container - Container to add trail to
 * @param {number} count - Number of trail copies
 */
export function createTrail(object, container, count = 5) {
  // This would create copies of the object that fade out
  // Implementation would depend on specific use case
  // Placeholder for now
}

/**
 * Kill all animations on an object
 * @param {PIXI.DisplayObject} object
 */
export function killAnimations(object) {
  gsap.killTweensOf(object);
  if (object.scale) {
    gsap.killTweensOf(object.scale);
  }
}

export default {
  screenShake,
  pulse,
  float,
  fadeIn,
  fadeOut,
  slideIn,
  popIn,
  rotateContinuous,
  wiggle,
  flashColor,
  animateNumber,
  bounce,
  killAnimations,
};
