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

    // Rock hair (long, wild)
    this.graphics.beginFill(0x1a1a1a);
    // Messy long hair
    for (let i = -2; i <= 2; i++) {
      const offsetX = i * 8;
      this.graphics.drawEllipse(offsetX, -halfHeight - 22, 8, 15);
    }
    // Hair volume on top
    this.graphics.drawEllipse(0, -halfHeight - 28, 18, 10);
    this.graphics.endFill();

    // Neck
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0xF5C79C);
    this.graphics.drawRect(-5, -halfHeight - 5, 10, 10);
    this.graphics.endFill();

    // Head (rounder, more human)
    this.graphics.beginFill(0xF5C79C);
    this.graphics.drawCircle(0, -halfHeight - 15, 16);
    this.graphics.endFill();

    // Eyes (sunglasses for cool factor)
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0x000000);
    this.graphics.drawEllipse(-6, -halfHeight - 16, 5, 3);
    this.graphics.drawEllipse(6, -halfHeight - 16, 5, 3);
    this.graphics.endFill();
    // Sunglasses frame
    this.graphics.lineStyle(2, 0x222222);
    this.graphics.drawEllipse(-6, -halfHeight - 16, 6, 4);
    this.graphics.drawEllipse(6, -halfHeight - 16, 6, 4);
    // Bridge
    this.graphics.moveTo(-1, -halfHeight - 16);
    this.graphics.lineTo(1, -halfHeight - 16);

    // Nose
    this.graphics.lineStyle(1, 0xD4A574);
    this.graphics.moveTo(0, -halfHeight - 14);
    this.graphics.lineTo(-1, -halfHeight - 11);

    // Mouth
    this.graphics.lineStyle(2, 0x880000);
    this.graphics.arc(0, -halfHeight - 10, 4, 0, Math.PI);

    // Body - Rock T-shirt with rounded shoulders
    this.graphics.lineStyle(0);
    this.graphics.beginFill(this.color);
    // Shoulders (rounded)
    this.graphics.drawCircle(-halfWidth + 8, -halfHeight + 10, 12);
    this.graphics.drawCircle(halfWidth - 8, -halfHeight + 10, 12);
    // Torso
    this.graphics.drawRoundedRect(-halfWidth + 5, -halfHeight + 5, this.width - 10, this.height * 0.55, 8);
    this.graphics.endFill();

    // Band logo/design on shirt
    this.graphics.lineStyle(2, 0xFFFFFF, 0.6);
    this.graphics.drawCircle(0, -halfHeight + 20, 10);
    this.graphics.moveTo(-6, -halfHeight + 20);
    this.graphics.lineTo(6, -halfHeight + 20);

    // Pants/jeans
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0x1a3a5a); // Denim blue
    this.graphics.drawRoundedRect(-halfWidth + 8, -halfHeight + 5 + this.height * 0.55, this.width - 16, this.height * 0.3, 3);
    this.graphics.endFill();

    // Belt
    this.graphics.lineStyle(3, 0x3a2a1a);
    this.graphics.moveTo(-halfWidth + 8, -halfHeight + 5 + this.height * 0.55);
    this.graphics.lineTo(halfWidth - 8, -halfHeight + 5 + this.height * 0.55);

    // Arms with elbows (more natural)
    this.graphics.lineStyle(7, 0xF5C79C);
    this.graphics.lineCap = 'round';

    // Left arm (upper arm)
    this.graphics.moveTo(-halfWidth + 8, -halfHeight + 10);
    this.graphics.lineTo(-halfWidth - 5, -halfHeight + 30);
    // Left forearm
    this.graphics.moveTo(-halfWidth - 5, -halfHeight + 30);
    this.graphics.lineTo(-halfWidth - 15, 5);

    // Right arm (upper arm)
    this.graphics.moveTo(halfWidth - 8, -halfHeight + 10);
    this.graphics.lineTo(halfWidth + 5, -halfHeight + 30);
    // Right forearm
    this.graphics.moveTo(halfWidth + 5, -halfHeight + 30);
    this.graphics.lineTo(halfWidth + 15, 5);

    // Hands
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0xF5C79C);
    this.graphics.drawCircle(-halfWidth - 15, 5, 5);
    this.graphics.drawCircle(halfWidth + 15, 5, 5);
    this.graphics.endFill();

    // Draw instrument
    if (this.instrument === 'guitar') {
      this.drawGuitar();
    } else if (this.instrument === 'bass') {
      this.drawBass();
    }

    // Legs (proper proportions)
    this.graphics.lineStyle(9, 0x1a3a5a);
    this.graphics.lineCap = 'round';
    this.graphics.moveTo(-8, halfHeight - this.height * 0.3);
    this.graphics.lineTo(-9, halfHeight - 3);
    this.graphics.moveTo(8, halfHeight - this.height * 0.3);
    this.graphics.lineTo(9, halfHeight - 3);

    // Shoes (sneakers)
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0x222222);
    this.graphics.drawRoundedRect(-16, halfHeight - 6, 12, 7, 2);
    this.graphics.drawRoundedRect(4, halfHeight - 6, 12, 7, 2);
    this.graphics.endFill();
    // Shoe highlights
    this.graphics.beginFill(0xFFFFFF, 0.3);
    this.graphics.drawRect(-14, halfHeight - 5, 3, 2);
    this.graphics.drawRect(6, halfHeight - 5, 3, 2);
    this.graphics.endFill();

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
    if (this.graphics && !this.graphics.destroyed) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }
}

export default BandMember;
