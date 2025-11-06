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

    // Long rock hair (behind head)
    this.graphics.beginFill(0x2a2a2a);
    for (let i = -2; i <= 2; i++) {
      this.graphics.drawEllipse(i * 9, -halfHeight - 22, 9, 16);
    }
    this.graphics.drawEllipse(0, -halfHeight - 28, 20, 12);
    this.graphics.endFill();

    // Neck
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0xF5C79C);
    this.graphics.drawRect(-6, -halfHeight - 8, 12, 15);
    this.graphics.endFill();

    // Head (rounder)
    this.graphics.beginFill(0xF5C79C);
    this.graphics.drawCircle(0, -halfHeight - 18, 18);
    this.graphics.endFill();

    // Headband (rock drummer style)
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0xFF0000);
    this.graphics.drawRect(-20, -halfHeight - 22, 40, 6);
    this.graphics.endFill();

    // Eyes (intense focus)
    this.graphics.beginFill(0xFFFFFF);
    this.graphics.drawCircle(-6, -halfHeight - 18, 4);
    this.graphics.drawCircle(6, -halfHeight - 18, 4);
    this.graphics.endFill();
    this.graphics.beginFill(0x000000);
    this.graphics.drawCircle(-6, -halfHeight - 17, 3);
    this.graphics.drawCircle(6, -halfHeight - 17, 3);
    this.graphics.endFill();

    // Mouth (changes based on state)
    if (this.isHappy) {
      // Big smile
      this.graphics.lineStyle(2, 0x880000);
      this.graphics.arc(0, -halfHeight - 10, 8, 0, Math.PI);
    } else {
      // Focused expression
      this.graphics.lineStyle(2, 0x880000);
      this.graphics.moveTo(-6, -halfHeight - 10);
      this.graphics.lineTo(6, -halfHeight - 10);
    }

    // Body - Tank top with organic curves (NO rectangles!)
    this.graphics.lineStyle(0);
    this.graphics.beginFill(ENTITIES.drummer.color);

    // Shoulders (circular)
    this.graphics.drawCircle(-halfWidth + 10, -halfHeight + 12, 14);
    this.graphics.drawCircle(halfWidth - 10, -halfHeight + 12, 14);

    // Upper torso (chest) - ellipse
    this.graphics.drawEllipse(0, -halfHeight + 20, halfWidth - 5, 18);

    // Mid torso - narrowing ellipse
    this.graphics.drawEllipse(0, -halfHeight + 42, halfWidth - 10, 16);

    // Lower torso (waist) - narrow ellipse
    this.graphics.drawEllipse(0, -halfHeight + 60, halfWidth - 12, 14);

    this.graphics.endFill();

    // Arms (drumsticks) - more natural with elbows
    const armOffset = Math.sin(this.animationFrame) * 10;

    this.graphics.lineStyle(8, 0xF5C79C);
    this.graphics.lineCap = 'round';

    // Left arm (upper)
    this.graphics.moveTo(-halfWidth + 10, -halfHeight + 12);
    this.graphics.lineTo(-halfWidth - 10, -halfHeight + 35 + armOffset * 0.5);
    // Left forearm
    this.graphics.moveTo(-halfWidth - 10, -halfHeight + 35 + armOffset * 0.5);
    this.graphics.lineTo(-halfWidth - 25, -halfHeight + 45 + armOffset);

    // Drumstick (left)
    this.graphics.lineStyle(4, 0x8B4513);
    this.graphics.moveTo(-halfWidth - 25, -halfHeight + 45 + armOffset);
    this.graphics.lineTo(-halfWidth - 42, -halfHeight + 50 + armOffset);
    // Stick tip
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0xFFEEDD);
    this.graphics.drawCircle(-halfWidth - 42, -halfHeight + 50 + armOffset, 4);
    this.graphics.endFill();

    // Right arm (upper)
    this.graphics.lineStyle(8, 0xF5C79C);
    this.graphics.lineCap = 'round';
    this.graphics.moveTo(halfWidth - 10, -halfHeight + 12);
    this.graphics.lineTo(halfWidth + 10, -halfHeight + 35 - armOffset * 0.5);
    // Right forearm
    this.graphics.moveTo(halfWidth + 10, -halfHeight + 35 - armOffset * 0.5);
    this.graphics.lineTo(halfWidth + 25, -halfHeight + 45 - armOffset);

    // Drumstick (right)
    this.graphics.lineStyle(4, 0x8B4513);
    this.graphics.moveTo(halfWidth + 25, -halfHeight + 45 - armOffset);
    this.graphics.lineTo(halfWidth + 42, -halfHeight + 50 - armOffset);
    // Stick tip
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0xFFEEDD);
    this.graphics.drawCircle(halfWidth + 42, -halfHeight + 50 - armOffset, 4);
    this.graphics.endFill();

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
    if (this.graphics && !this.graphics.destroyed) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }
}

export default Drummer;
