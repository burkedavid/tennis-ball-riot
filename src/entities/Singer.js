/**
 * Singer Entity
 * Represents the singer obstacle that moves across the stage
 */

import * as PIXI from 'pixi.js';
import Matter from 'matter-js';
import { ENTITIES } from '../config/constants.js';
import { randomRange, randomChoice } from '../utils.js';

export class Singer {
  constructor(physicsWorld) {
    this.physicsWorld = physicsWorld;
    this.width = ENTITIES.singer.width;
    this.height = ENTITIES.singer.height;
    this.minX = ENTITIES.singer.minX;
    this.maxX = ENTITIES.singer.maxX;
    this.y = ENTITIES.singer.y;

    // Starting position (center)
    this.x = (this.minX + this.maxX) / 2;

    // Movement
    this.baseSpeed = ENTITIES.singer.baseSpeed;
    this.speed = this.baseSpeed;
    this.direction = 1; // 1 = right, -1 = left
    this.currentPattern = 'pacing';
    this.availablePatterns = ['pacing']; // Set by game based on level

    // Pattern timing
    this.patternTimer = 0;
    this.patternDuration = randomRange(3000, 8000); // ms

    // Create physics body (for collision)
    this.body = physicsWorld.createDynamicRect(
      this.x,
      this.y - this.height / 2,
      this.width,
      this.height,
      'singer'
    );

    // Create visual representation
    this.graphics = new PIXI.Graphics();
    this.drawSinger();

    // Animation state
    this.animationFrame = 0;
    this.animationSpeed = 0.15;
  }

  /**
   * Draw the singer (IGGY POP style - wild, energetic, shirtless)
   */
  drawSinger() {
    this.graphics.clear();

    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    // WILD SPIKY HAIR (Iggy's iconic messy look) - Fixed pattern
    this.graphics.beginFill(0x1a1a1a); // Dark brown/black
    // Base hair volume
    this.graphics.drawEllipse(0, -halfHeight - 28, 24, 14);
    // Wild spikes - non-random for consistency
    this.graphics.drawCircle(-15, -halfHeight - 32, 8);
    this.graphics.drawCircle(-8, -halfHeight - 36, 7);
    this.graphics.drawCircle(0, -halfHeight - 38, 8);
    this.graphics.drawCircle(8, -halfHeight - 36, 7);
    this.graphics.drawCircle(15, -halfHeight - 32, 8);
    // Side volume
    this.graphics.drawCircle(-20, -halfHeight - 25, 9);
    this.graphics.drawCircle(20, -halfHeight - 25, 9);
    this.graphics.endFill();

    // Neck (visible, skinny)
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0xF5C79C); // Tan skin
    this.graphics.drawRect(-6, -halfHeight - 8, 12, 15);
    this.graphics.endFill();

    // Head (angular, lean face)
    this.graphics.beginFill(0xF5C79C);
    this.graphics.drawCircle(0, -halfHeight - 20, 20);
    this.graphics.endFill();

    // Jaw definition
    this.graphics.lineStyle(2, 0xD4A574, 0.5);
    this.graphics.arc(0, -halfHeight - 15, 15, Math.PI / 4, Math.PI * 3 / 4);

    // Eyes (intense, wild)
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0xFFFFFF);
    this.graphics.drawCircle(-7, -halfHeight - 22, 4);
    this.graphics.drawCircle(7, -halfHeight - 22, 4);
    this.graphics.endFill();
    this.graphics.beginFill(0x000000);
    this.graphics.drawCircle(-7, -halfHeight - 21, 3);
    this.graphics.drawCircle(7, -halfHeight - 21, 3);
    this.graphics.endFill();

    // Mouth (singing/screaming - wide open)
    this.graphics.beginFill(0x330000);
    this.graphics.drawEllipse(0, -halfHeight - 12, 8, 6);
    this.graphics.endFill();

    // SHIRTLESS TORSO - Defined muscles (Iggy is ripped!)
    this.graphics.beginFill(0xF5C79C);
    // Chest/shoulders (wider at top)
    this.graphics.drawRect(-20, -halfHeight + 8, 40, 25);
    // Narrow waist
    this.graphics.drawRect(-15, -halfHeight + 33, 30, 25);
    this.graphics.endFill();

    // Muscle definition (pecs and abs)
    this.graphics.lineStyle(2, 0xD4A574, 0.6);
    // Pec lines
    this.graphics.arc(-8, -halfHeight + 15, 8, Math.PI / 3, Math.PI * 2 / 3);
    this.graphics.arc(8, -halfHeight + 15, 8, Math.PI / 3, Math.PI * 2 / 3);
    // Abs
    this.graphics.moveTo(-5, -halfHeight + 28);
    this.graphics.lineTo(-5, -halfHeight + 50);
    this.graphics.moveTo(5, -halfHeight + 28);
    this.graphics.lineTo(5, -halfHeight + 50);
    this.graphics.moveTo(-8, -halfHeight + 35);
    this.graphics.lineTo(8, -halfHeight + 35);
    this.graphics.moveTo(-8, -halfHeight + 43);
    this.graphics.lineTo(8, -halfHeight + 43);

    // Leather pants (tight, black)
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0x0a0a0a);
    this.graphics.drawRoundedRect(-18, -halfHeight + 58, 36, this.height * 0.35, 2);
    this.graphics.endFill();

    // Belt with silver buckle
    this.graphics.lineStyle(4, 0x333333);
    this.graphics.moveTo(-18, -halfHeight + 58);
    this.graphics.lineTo(18, -halfHeight + 58);
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0xAAAAAA);
    this.graphics.drawRect(-5, -halfHeight + 56, 10, 6);
    this.graphics.endFill();

    // Arms (lean, sinewy, energetic)
    this.graphics.lineStyle(8, 0xF5C79C);
    this.graphics.lineCap = 'round';

    // Left arm (raised high, rock gesture)
    this.graphics.moveTo(-20, -halfHeight + 12);
    this.graphics.lineTo(-35, -halfHeight - 10);
    // Forearm
    this.graphics.moveTo(-35, -halfHeight - 10);
    this.graphics.lineTo(-32, -halfHeight - 25);

    // Right arm holding MICROPHONE (extended dramatically)
    this.graphics.moveTo(20, -halfHeight + 12);
    this.graphics.lineTo(42, -halfHeight + 5);
    // Forearm
    this.graphics.moveTo(42, -halfHeight + 5);
    this.graphics.lineTo(50, -halfHeight - 5);

    // Hand on mic
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0xF5C79C);
    this.graphics.drawCircle(50, -halfHeight - 5, 6);
    this.graphics.endFill();

    // Microphone (chrome, prominent)
    this.graphics.beginFill(0x888888);
    this.graphics.drawRoundedRect(48, -halfHeight - 12, 12, 18, 6);
    this.graphics.endFill();
    // Mic grille
    this.graphics.beginFill(0x555555);
    this.graphics.drawCircle(54, -halfHeight - 3, 5);
    this.graphics.endFill();
    // Shine
    this.graphics.beginFill(0xDDDDDD);
    this.graphics.drawCircle(52, -halfHeight - 6, 3);
    this.graphics.endFill();

    // Microphone cord
    this.graphics.lineStyle(3, 0x222222);
    this.graphics.moveTo(50, -halfHeight - 5);
    this.graphics.quadraticCurveTo(45, 5, 35, 25);
    this.graphics.quadraticCurveTo(25, 40, 15, halfHeight - 10);

    // Legs (skinny, leather pants)
    this.graphics.lineStyle(11, 0x0a0a0a);
    this.graphics.lineCap = 'round';
    this.graphics.moveTo(-9, halfHeight - this.height * 0.35);
    this.graphics.lineTo(-11, halfHeight - 5);
    this.graphics.moveTo(9, halfHeight - this.height * 0.35);
    this.graphics.lineTo(11, halfHeight - 5);

    // Boots (chunky rock boots)
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0x000000);
    this.graphics.drawRoundedRect(-18, halfHeight - 8, 14, 10, 2);
    this.graphics.drawRoundedRect(4, halfHeight - 8, 14, 10, 2);
    this.graphics.endFill();
    // Boot shine
    this.graphics.beginFill(0x333333);
    this.graphics.drawRect(-16, halfHeight - 7, 4, 3);
    this.graphics.drawRect(6, halfHeight - 7, 4, 3);
    this.graphics.endFill();
  }

  /**
   * Set available movement patterns for current level
   * @param {string[]} patterns
   */
  setAvailablePatterns(patterns) {
    this.availablePatterns = patterns;
    this.changePattern();
  }

  /**
   * Set speed multiplier
   * @param {number} multiplier
   */
  setSpeedMultiplier(multiplier) {
    this.speed = this.baseSpeed * multiplier;
  }

  /**
   * Change to a new random pattern
   */
  changePattern() {
    this.currentPattern = randomChoice(this.availablePatterns);
    this.patternDuration = randomRange(3000, 8000);
    this.patternTimer = 0;
  }

  /**
   * Update singer position and animation
   * @param {number} deltaTime - Time since last frame (ms)
   */
  update(deltaTime) {
    // Update pattern timer
    this.patternTimer += deltaTime;
    if (this.patternTimer >= this.patternDuration) {
      this.changePattern();
    }

    // Execute current pattern
    this.executePattern(deltaTime);

    // Update physics body position
    if (this.body) {
      Matter.Body.setPosition(this.body, {
        x: this.x,
        y: this.y - this.height / 2,
      });
    }

    // Update graphics position
    this.graphics.x = this.x;
    this.graphics.y = this.y - this.height / 2;

    // Animation
    this.animationFrame += this.animationSpeed;
    this.updateAnimation();
  }

  /**
   * Execute movement based on current pattern
   * @param {number} deltaTime
   */
  executePattern(deltaTime) {
    const frameSpeed = this.speed * (deltaTime / 16.67); // Normalize to 60fps

    switch (this.currentPattern) {
      case 'pacing':
        // Simple back and forth
        this.x += this.direction * frameSpeed;
        if (this.x >= this.maxX) {
          this.x = this.maxX;
          this.direction = -1;
        } else if (this.x <= this.minX) {
          this.x = this.minX;
          this.direction = 1;
        }
        break;

      case 'jumping':
        // Jump in place occasionally
        this.x += this.direction * frameSpeed * 0.5;
        if (this.x >= this.maxX || this.x <= this.minX) {
          this.direction *= -1;
        }
        break;

      case 'running':
        // Fast movement
        this.x += this.direction * frameSpeed * 1.5;
        if (this.x >= this.maxX) {
          this.x = this.maxX;
          this.direction = -1;
        } else if (this.x <= this.minX) {
          this.x = this.minX;
          this.direction = 1;
        }
        break;

      case 'stagedive':
        // Quick rush toward audience side
        if (Math.random() < 0.01) { // Occasional dive
          this.x += this.direction * frameSpeed * 3;
        } else {
          this.x += this.direction * frameSpeed;
        }
        if (this.x >= this.maxX || this.x <= this.minX) {
          this.direction *= -1;
        }
        break;

      case 'spin':
        // Spin in place at center
        const centerX = (this.minX + this.maxX) / 2;
        if (Math.abs(this.x - centerX) > 5) {
          this.x += (centerX - this.x) * 0.05;
        }
        this.graphics.rotation += 0.1;
        break;

      default:
        // Default to pacing
        this.x += this.direction * frameSpeed;
        if (this.x >= this.maxX || this.x <= this.minX) {
          this.direction *= -1;
        }
    }

    // Clamp position
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
  }

  /**
   * Update visual animation
   */
  updateAnimation() {
    // Simple bobbing animation
    const bob = Math.sin(this.animationFrame) * 2;
    this.graphics.y = (this.y - this.height / 2) + bob;

    // Flip sprite based on direction
    this.graphics.scale.x = this.direction;
  }

  /**
   * Get collision bounds
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Get PIXI graphics object
   * @returns {PIXI.Graphics}
   */
  getGraphics() {
    return this.graphics;
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.body) {
      this.physicsWorld.removeBody(this.body);
      this.body = null;
    }
    if (this.graphics && !this.graphics.destroyed) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }
}

export default Singer;
