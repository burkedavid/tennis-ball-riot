/**
 * Generic Band Member Entity
 * Can be used for guitarist, bassist, etc.
 */

import * as PIXI from 'pixi.js';
import { randomRange } from '../utils.js';

export class BandMember {
  constructor(x, y, instrument = 'guitar', color = 0xFF6600) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 100;
    this.instrument = instrument;
    this.color = color;

    // Create visual representation
    this.graphics = new PIXI.Graphics();
    this.drawBandMember();

    // Animation state
    this.animationFrame = 0;
    this.animationSpeed = randomRange(0.1, 0.3);
    this.bobAmount = randomRange(3, 7);
  }

  /**
   * Draw the band member
   */
  drawBandMember() {
    this.graphics.clear();

    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    // Head
    this.graphics.beginFill(0xFFCC99);
    this.graphics.drawCircle(0, -halfHeight - 10, 15);
    this.graphics.endFill();

    // Wild hair
    this.graphics.beginFill(0x222222);
    this.graphics.drawCircle(-8, -halfHeight - 18, 10);
    this.graphics.drawCircle(0, -halfHeight - 20, 10);
    this.graphics.drawCircle(8, -halfHeight - 18, 10);
    this.graphics.endFill();

    // Eyes
    this.graphics.beginFill(0x000000);
    this.graphics.drawCircle(-5, -halfHeight - 10, 2);
    this.graphics.drawCircle(5, -halfHeight - 10, 2);
    this.graphics.endFill();

    // Body (band shirt)
    this.graphics.beginFill(this.color);
    this.graphics.drawRoundedRect(-halfWidth, -halfHeight + 5, this.width, this.height * 0.6, 5);
    this.graphics.endFill();

    // Arms
    this.graphics.lineStyle(6, 0xFFCC99);
    this.graphics.moveTo(-halfWidth + 5, -halfHeight + 20);
    this.graphics.lineTo(-halfWidth - 10, 0);
    this.graphics.moveTo(halfWidth - 5, -halfHeight + 20);
    this.graphics.lineTo(halfWidth + 10, 0);

    // Draw instrument
    if (this.instrument === 'guitar') {
      this.drawGuitar();
    } else if (this.instrument === 'bass') {
      this.drawBass();
    }

    // Position graphics
    this.graphics.x = this.x;
    this.graphics.y = this.y;
  }

  /**
   * Draw guitar
   */
  drawGuitar() {
    // Guitar body
    this.graphics.beginFill(0x8B4513);
    this.graphics.drawRoundedRect(-15, 10, 30, 35, 15);
    this.graphics.endFill();

    // Guitar neck
    this.graphics.lineStyle(8, 0x654321);
    this.graphics.moveTo(0, 10);
    this.graphics.lineTo(0, -20);

    // Strings
    this.graphics.lineStyle(1, 0xCCCCCC);
    this.graphics.moveTo(-5, -10);
    this.graphics.lineTo(-5, 35);
    this.graphics.moveTo(5, -10);
    this.graphics.lineTo(5, 35);
  }

  /**
   * Draw bass guitar
   */
  drawBass() {
    // Bass body (slightly longer)
    this.graphics.beginFill(0x2C1810);
    this.graphics.drawRoundedRect(-12, 10, 24, 40, 12);
    this.graphics.endFill();

    // Bass neck (longer)
    this.graphics.lineStyle(10, 0x654321);
    this.graphics.moveTo(0, 10);
    this.graphics.lineTo(0, -30);

    // Strings (4 strings)
    this.graphics.lineStyle(1, 0xCCCCCC);
    for (let i = -6; i <= 6; i += 4) {
      this.graphics.moveTo(i, -20);
      this.graphics.lineTo(i, 40);
    }
  }

  /**
   * Update animation
   * @param {number} deltaTime
   */
  update(deltaTime) {
    this.animationFrame += this.animationSpeed;

    // Bob up and down
    const bob = Math.sin(this.animationFrame) * this.bobAmount;
    this.graphics.y = this.y + bob;

    // Slight rotation (headbanging)
    this.graphics.rotation = Math.sin(this.animationFrame * 0.5) * 0.1;
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

export default BandMember;
