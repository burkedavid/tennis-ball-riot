/**
 * Drummer Entity
 * The drummer behind the glass target
 */

import * as PIXI from 'pixi.js';
import { ENTITIES } from '../config/constants.js';

export class Drummer {
  constructor() {
    this.width = ENTITIES.drummer.width;
    this.height = ENTITIES.drummer.height;
    this.x = ENTITIES.drummer.x;
    this.y = ENTITIES.drummer.y;

    // Create visual representation
    this.graphics = new PIXI.Graphics();
    this.drawDrummer();

    // Animation state
    this.animationFrame = 0;
    this.animationSpeed = 0.2;
    this.isDrumming = true;
    this.isHappy = false;
  }

  /**
   * Draw the drum kit (behind the drummer)
   */
  drawDrumKit() {
    // Bass drum (big drum in center)
    this.graphics.beginFill(0x222222);
    this.graphics.drawCircle(0, 60, 50);
    this.graphics.endFill();
    this.graphics.beginFill(0x444444);
    this.graphics.drawCircle(0, 60, 40);
    this.graphics.endFill();

    // Snare drum (left front)
    this.graphics.beginFill(0xCCCCCC);
    this.graphics.drawCircle(-40, 40, 20);
    this.graphics.endFill();
    this.graphics.lineStyle(2, 0x666666);
    this.graphics.drawCircle(-40, 40, 18);

    // Hi-hat (right)
    this.graphics.beginFill(0xFFD700, 0.6);
    this.graphics.drawCircle(40, 20, 18);
    this.graphics.endFill();
    this.graphics.drawCircle(42, 18, 18);

    // Cymbals (top)
    this.graphics.beginFill(0xFFD700, 0.5);
    this.graphics.drawEllipse(-60, 0, 25, 8);
    this.graphics.drawEllipse(60, 0, 25, 8);
    this.graphics.endFill();

    // Cymbal stands
    this.graphics.lineStyle(3, 0x666666);
    this.graphics.moveTo(-60, 0);
    this.graphics.lineTo(-60, 50);
    this.graphics.moveTo(60, 0);
    this.graphics.lineTo(60, 50);

    // Tom drums
    this.graphics.beginFill(0x333333);
    this.graphics.drawCircle(-20, 10, 15);
    this.graphics.drawCircle(20, 10, 15);
    this.graphics.endFill();
  }

  /**
   * Draw the drummer
   */
  drawDrummer() {
    this.graphics.clear();

    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    // Draw drum kit first (behind drummer)
    this.drawDrumKit();

    // Head
    this.graphics.beginFill(0xFFCC99);
    this.graphics.drawCircle(0, -halfHeight - 15, 20);
    this.graphics.endFill();

    // Hair (wild rock hair)
    this.graphics.beginFill(0x333333);
    this.graphics.drawCircle(-10, -halfHeight - 25, 12);
    this.graphics.drawCircle(0, -halfHeight - 28, 12);
    this.graphics.drawCircle(10, -halfHeight - 25, 12);
    this.graphics.endFill();

    // Eyes
    this.graphics.beginFill(0x000000);
    this.graphics.drawCircle(-7, -halfHeight - 15, 3);
    this.graphics.drawCircle(7, -halfHeight - 15, 3);
    this.graphics.endFill();

    // Mouth (changes based on state)
    if (this.isHappy) {
      // Smile
      this.graphics.lineStyle(2, 0x000000);
      this.graphics.arc(0, -halfHeight - 8, 8, 0, Math.PI);
    } else {
      // Neutral
      this.graphics.lineStyle(2, 0x000000);
      this.graphics.moveTo(-5, -halfHeight - 5);
      this.graphics.lineTo(5, -halfHeight - 5);
    }

    // Body
    this.graphics.beginFill(ENTITIES.drummer.color);
    this.graphics.drawRoundedRect(-halfWidth, -halfHeight + 5, this.width, this.height * 0.7, 5);
    this.graphics.endFill();

    // Arms (drumsticks)
    const armOffset = Math.sin(this.animationFrame) * 10;

    // Left arm with stick
    this.graphics.lineStyle(4, 0xFFCC99);
    this.graphics.moveTo(-halfWidth + 10, -halfHeight + 20);
    this.graphics.lineTo(-halfWidth - 20, -halfHeight + 30 + armOffset);

    // Drumstick
    this.graphics.lineStyle(3, 0x8B4513);
    this.graphics.moveTo(-halfWidth - 20, -halfHeight + 30 + armOffset);
    this.graphics.lineTo(-halfWidth - 35, -halfHeight + 35 + armOffset);

    // Right arm with stick
    this.graphics.lineStyle(4, 0xFFCC99);
    this.graphics.moveTo(halfWidth - 10, -halfHeight + 20);
    this.graphics.lineTo(halfWidth + 20, -halfHeight + 30 - armOffset);

    // Drumstick
    this.graphics.lineStyle(3, 0x8B4513);
    this.graphics.moveTo(halfWidth + 20, -halfHeight + 30 - armOffset);
    this.graphics.lineTo(halfWidth + 35, -halfHeight + 35 - armOffset);

    // Position graphics
    this.graphics.x = this.x;
    this.graphics.y = this.y;
  }

  /**
   * Update drummer animation
   * @param {number} deltaTime
   */
  update(deltaTime) {
    if (this.isDrumming) {
      this.animationFrame += this.animationSpeed;
      this.drawDrummer();
    }
  }

  /**
   * Celebrate when ball goes in glass
   */
  celebrate() {
    this.isHappy = true;
    this.animationSpeed = 0.4; // Drum faster

    setTimeout(() => {
      this.isHappy = false;
      this.animationSpeed = 0.2;
      this.drawDrummer();
    }, 2000);
  }

  /**
   * React to near miss
   */
  reactToNearMiss() {
    // Could add a flinch animation or surprised expression
    this.isDrumming = false;

    setTimeout(() => {
      this.isDrumming = true;
    }, 500);
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
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }
}

export default Drummer;
