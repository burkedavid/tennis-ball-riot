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

    // WILD SPIKY HAIR (Iggy's iconic look)
    this.graphics.beginFill(0x222222);
    // Multiple spikes pointing up and out
    for (let i = -2; i <= 2; i++) {
      const spikeX = i * 8;
      const spikeHeight = 15 + Math.abs(i) * 3;
      this.graphics.drawCircle(spikeX, -halfHeight - 25 - spikeHeight, 8);
    }
    this.graphics.endFill();

    // Head (lean face)
    this.graphics.beginFill(0xFFCC99);
    this.graphics.drawEllipse(0, -halfHeight - 18, 18, 22);
    this.graphics.endFill();

    // Eyes (intense stare)
    this.graphics.beginFill(0x000000);
    this.graphics.drawCircle(-6, -halfHeight - 20, 3);
    this.graphics.drawCircle(6, -halfHeight - 20, 3);
    this.graphics.endFill();

    // Mouth (singing/screaming)
    this.graphics.lineStyle(2, 0x000000);
    this.graphics.arc(0, -halfHeight - 10, 6, 0, Math.PI);

    // SHIRTLESS TORSO (skinny, defined)
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0xFFCC99);
    // Skinny torso
    this.graphics.drawRoundedRect(-halfWidth * 0.6, -halfHeight + 5, this.width * 0.6, this.height * 0.5, 3);
    this.graphics.endFill();

    // Leather pants (tight)
    this.graphics.beginFill(0x111111);
    this.graphics.drawRoundedRect(-halfWidth * 0.7, -halfHeight + 5 + this.height * 0.5, this.width * 0.7, this.height * 0.3, 3);
    this.graphics.endFill();

    // Belt/waistband
    this.graphics.lineStyle(3, 0x666666);
    this.graphics.moveTo(-halfWidth * 0.7, -halfHeight + 5 + this.height * 0.5);
    this.graphics.lineTo(halfWidth * 0.7, -halfHeight + 5 + this.height * 0.5);

    // Arms (lean, energetic)
    this.graphics.lineStyle(5, 0xFFCC99);

    // Left arm (extended out with energy)
    this.graphics.moveTo(-halfWidth * 0.6, -halfHeight + 15);
    this.graphics.lineTo(-halfWidth - 15, -5);

    // Right arm holding MICROPHONE (extended forward)
    this.graphics.moveTo(halfWidth * 0.6, -halfHeight + 15);
    this.graphics.lineTo(halfWidth + 10, -8);

    // Microphone (prominent)
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0x333333);
    this.graphics.drawCircle(halfWidth + 10, -8, 8);
    this.graphics.endFill();
    // Mic highlight
    this.graphics.beginFill(0x666666);
    this.graphics.drawCircle(halfWidth + 12, -10, 3);
    this.graphics.endFill();

    // Microphone cord
    this.graphics.lineStyle(2, 0x444444);
    this.graphics.moveTo(halfWidth + 10, -8);
    this.graphics.quadraticCurveTo(halfWidth + 5, 10, halfWidth - 10, 30);

    // Legs (skinny, leather pants)
    this.graphics.lineStyle(7, 0x111111);
    this.graphics.moveTo(-8, halfHeight - this.height * 0.3);
    this.graphics.lineTo(-10, halfHeight);
    this.graphics.moveTo(8, halfHeight - this.height * 0.3);
    this.graphics.lineTo(10, halfHeight);

    // Boots
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0x000000);
    this.graphics.drawRect(-15, halfHeight - 5, 10, 8);
    this.graphics.drawRect(5, halfHeight - 5, 10, 8);
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
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }
}

export default Singer;
