/**
 * Glass Entity
 * The target glass on the drummer's kit
 */

import * as PIXI from 'pixi.js';
import { ENTITIES } from '../config/constants.js';
import { pointInCircle } from '../utils.js';

export class Glass {
  constructor(physicsWorld, sizeMultiplier = 1.0) {
    this.physicsWorld = physicsWorld;
    this.baseWidth = ENTITIES.glass.width;
    this.baseHeight = ENTITIES.glass.height;
    this.sizeMultiplier = sizeMultiplier;

    this.width = this.baseWidth * sizeMultiplier;
    this.height = this.baseHeight * sizeMultiplier;
    this.x = ENTITIES.glass.x;
    this.y = ENTITIES.glass.y;

    // Detection zone (circular area around glass opening)
    this.targetRadius = ENTITIES.glass.targetZoneRadius * sizeMultiplier;

    // Create physics sensor (for collision detection)
    this.sensor = physicsWorld.createStaticCircle(
      this.x,
      this.y - this.height / 2, // Top of glass
      this.targetRadius,
      'glass-sensor'
    );

    // Create visual representation
    this.graphics = new PIXI.Graphics();
    this.glowGraphics = new PIXI.Graphics(); // Separate layer for glow effect
    this.drawGlass();

    // Animation state
    this.glowIntensity = 0.6; // START with permanent glow for visibility!
    this.baseGlowIntensity = 0.6; // Always visible
    this.waterLevel = 0.3; // Glass is partially filled
    this.splashing = false;
    this.pulseTimer = 0; // For pulsing glow effect
  }

  /**
   * Draw the glass
   */
  drawGlass() {
    this.graphics.clear();

    // Glass body (trapezoid shape)
    this.graphics.beginFill(ENTITIES.glass.color, 0.3);
    this.graphics.lineStyle(3, ENTITIES.glass.color, 0.8);

    const topWidth = this.width * 0.8;
    const bottomWidth = this.width * 0.6;

    // Draw glass outline
    this.graphics.moveTo(-topWidth / 2, -this.height);
    this.graphics.lineTo(topWidth / 2, -this.height);
    this.graphics.lineTo(bottomWidth / 2, 0);
    this.graphics.lineTo(-bottomWidth / 2, 0);
    this.graphics.closePath();
    this.graphics.endFill();

    // Water inside
    const waterHeight = this.height * this.waterLevel;
    const waterTopWidth = topWidth - ((topWidth - bottomWidth) * (1 - this.waterLevel));

    this.graphics.beginFill(0x4488FF, 0.5);
    this.graphics.moveTo(-waterTopWidth / 2, -waterHeight);
    this.graphics.lineTo(waterTopWidth / 2, -waterHeight);
    this.graphics.lineTo(bottomWidth / 2, 0);
    this.graphics.lineTo(-bottomWidth / 2, 0);
    this.graphics.closePath();
    this.graphics.endFill();

    // Highlights
    this.graphics.lineStyle(2, 0xFFFFFF, 0.4);
    this.graphics.moveTo(-topWidth / 2 + 5, -this.height + 10);
    this.graphics.lineTo(-topWidth / 2 + 5, -20);

    // Position graphics
    this.graphics.x = this.x;
    this.graphics.y = this.y;

    // Glow graphics
    this.updateGlow();
  }

  /**
   * Update glow effect - ALWAYS VISIBLE TARGET with pulsing animation!
   */
  updateGlow() {
    this.glowGraphics.clear();

    const targetX = this.x;
    const targetY = this.y - this.height / 2;

    // Pulse effect (oscillates between 0.8 and 1.2)
    const pulse = 1.0 + Math.sin(this.pulseTimer) * 0.2;

    // OUTER GLOW RING - Huge, pulsing
    this.glowGraphics.beginFill(0x00FFFF, 0.15 * pulse);
    this.glowGraphics.drawCircle(targetX, targetY, this.targetRadius * 2.0 * pulse);
    this.glowGraphics.endFill();

    // MIDDLE GLOW RING
    this.glowGraphics.beginFill(0x00FFFF, 0.25 * pulse);
    this.glowGraphics.drawCircle(targetX, targetY, this.targetRadius * 1.4 * pulse);
    this.glowGraphics.endFill();

    // INNER GLOW - Bright cyan
    this.glowGraphics.beginFill(0x00FFFF, 0.45 * pulse);
    this.glowGraphics.drawCircle(targetX, targetY, this.targetRadius * 0.9);
    this.glowGraphics.endFill();

    // CORE - Bright white center
    this.glowGraphics.beginFill(0xFFFFFF, 0.85);
    this.glowGraphics.drawCircle(targetX, targetY, 12);
    this.glowGraphics.endFill();

    // PULSING YELLOW CORE
    this.glowGraphics.beginFill(0xFFFF00, 0.7 * pulse);
    this.glowGraphics.drawCircle(targetX, targetY, 8 * pulse);
    this.glowGraphics.endFill();

    // TARGET CROSSHAIR - Large, pulsing yellow
    this.glowGraphics.lineStyle(4, 0xFFFF00, 0.9);
    const crossSize = 25 * pulse;
    // Horizontal line
    this.glowGraphics.moveTo(targetX - crossSize, targetY);
    this.glowGraphics.lineTo(targetX + crossSize, targetY);
    // Vertical line
    this.glowGraphics.moveTo(targetX, targetY - crossSize);
    this.glowGraphics.lineTo(targetX, targetY + crossSize);

    // TARGET CIRCLE - Pulsing ring
    this.glowGraphics.lineStyle(3, 0x00FFFF, 0.8 * pulse);
    this.glowGraphics.drawCircle(targetX, targetY, this.targetRadius * pulse);

    // OUTER TARGET RING - Rotating indicator
    this.glowGraphics.lineStyle(2, 0xFFFFFF, 0.6);
    const ringRadius = this.targetRadius * 1.5;
    for (let i = 0; i < 4; i++) {
      const angle = (this.pulseTimer * 2 + (i * Math.PI / 2)) % (Math.PI * 2);
      const arcStart = angle;
      const arcEnd = angle + Math.PI / 6;
      this.glowGraphics.arc(targetX, targetY, ringRadius, arcStart, arcEnd);
    }

    // "AIM HERE" visual indicator - Animated brackets
    this.glowGraphics.lineStyle(5, 0xFF00FF, 0.7);
    const bracketSize = 30;
    const bracketDist = this.targetRadius * 1.8 * pulse;
    // Top bracket
    this.glowGraphics.moveTo(targetX - bracketSize / 2, targetY - bracketDist);
    this.glowGraphics.lineTo(targetX - bracketSize / 2, targetY - bracketDist - 10);
    this.glowGraphics.lineTo(targetX + bracketSize / 2, targetY - bracketDist - 10);
    this.glowGraphics.lineTo(targetX + bracketSize / 2, targetY - bracketDist);
    // Bottom bracket
    this.glowGraphics.moveTo(targetX - bracketSize / 2, targetY + bracketDist);
    this.glowGraphics.lineTo(targetX - bracketSize / 2, targetY + bracketDist + 10);
    this.glowGraphics.lineTo(targetX + bracketSize / 2, targetY + bracketDist + 10);
    this.glowGraphics.lineTo(targetX + bracketSize / 2, targetY + bracketDist);
  }

  /**
   * Check if ball is inside glass target zone
   * @param {number} ballX
   * @param {number} ballY
   * @returns {boolean}
   */
  checkBallInGlass(ballX, ballY) {
    // Check if ball is near the opening of the glass
    const glassOpeningY = this.y - this.height / 2;
    return pointInCircle(ballX, ballY, this.x, glassOpeningY, this.targetRadius);
  }

  /**
   * Animate splash when ball enters
   */
  splash() {
    this.splashing = true;
    this.waterLevel = Math.min(1.0, this.waterLevel + 0.1);

    // Redraw with new water level
    setTimeout(() => {
      this.drawGlass();
      this.splashing = false;
    }, 300);
  }

  /**
   * Update glass animation
   * @param {number} deltaTime
   */
  update(deltaTime) {
    // ALWAYS update pulse timer for constant animation
    this.pulseTimer += deltaTime * 0.003; // Smooth pulsing speed

    // Always update glow to show pulsing animation
    this.updateGlow();

    // Splash animation
    if (this.splashing) {
      // Add ripple effect or other animations here if needed
    }
  }

  /**
   * Set glow intensity (0-1)
   * @param {number} intensity
   */
  setGlow(intensity) {
    this.glowIntensity = Math.max(0, Math.min(1, intensity));
    this.updateGlow();
  }

  /**
   * Get position
   * @returns {{x: number, y: number}}
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Get target position (opening of glass)
   * @returns {{x: number, y: number}}
   */
  getTargetPosition() {
    return {
      x: this.x,
      y: this.y - this.height / 2,
    };
  }

  /**
   * Get all graphics objects
   * @returns {PIXI.Graphics[]}
   */
  getGraphics() {
    return [this.glowGraphics, this.graphics];
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.sensor) {
      this.physicsWorld.removeBody(this.sensor);
      this.sensor = null;
    }
    if (this.graphics && !this.graphics.destroyed) {
      this.graphics.destroy();
      this.graphics = null;
    }
    if (this.glowGraphics && !this.glowGraphics.destroyed) {
      this.glowGraphics.destroy();
      this.glowGraphics = null;
    }
  }
}

export default Glass;
