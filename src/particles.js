/**
 * Particle System
 * Creates and manages particle effects for splashes, explosions, etc.
 */

import * as PIXI from 'pixi.js';
import { PARTICLES } from './config/constants.js';
import { randomRange } from './utils.js';

export class Particle {
  constructor(x, y, vx, vy, color, lifetime, size = 5) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.size = size;
    this.alpha = 1;
    this.active = true;

    // Create graphics
    this.graphics = new PIXI.Graphics();
    this.draw();
  }

  draw() {
    this.graphics.clear();
    this.graphics.beginFill(this.color, this.alpha);
    this.graphics.drawCircle(0, 0, this.size);
    this.graphics.endFill();
    this.graphics.x = this.x;
    this.graphics.y = this.y;
  }

  update(deltaTime) {
    if (!this.active) return;

    // Update position
    this.x += this.vx * (deltaTime / 16.67);
    this.y += this.vy * (deltaTime / 16.67);

    // Apply gravity
    this.vy += 0.2;

    // Update lifetime
    this.lifetime -= deltaTime / 1000;

    // Fade out
    this.alpha = this.lifetime / this.maxLifetime;

    // Update graphics
    this.graphics.x = this.x;
    this.graphics.y = this.y;
    this.graphics.alpha = this.alpha;

    // Deactivate when lifetime expires
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }
}

export class ParticleSystem {
  constructor(container) {
    this.container = container;
    this.particles = [];
  }

  /**
   * Create splash effect
   * @param {number} x
   * @param {number} y
   */
  createSplash(x, y) {
    const config = PARTICLES.splash;

    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count;
      const speed = randomRange(2, 6);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 3; // Upward bias
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      const size = randomRange(3, 7);

      const particle = new Particle(x, y, vx, vy, color, config.lifetime, size);
      this.particles.push(particle);
      this.container.addChild(particle.graphics);
    }
  }

  /**
   * Create confetti effect
   * @param {number} x
   * @param {number} y
   */
  createConfetti(x, y) {
    const config = PARTICLES.confetti;

    for (let i = 0; i < config.count; i++) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(3, 8);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 5; // Upward bias
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      const size = randomRange(4, 8);

      const particle = new Particle(x, y, vx, vy, color, config.lifetime, size);
      this.particles.push(particle);
      this.container.addChild(particle.graphics);
    }
  }

  /**
   * Create spark effect
   * @param {number} x
   * @param {number} y
   * @param {number} angle - Direction of sparks in radians
   */
  createSparks(x, y, angle = 0) {
    const config = PARTICLES.spark;

    for (let i = 0; i < config.count; i++) {
      const spreadAngle = angle + randomRange(-Math.PI / 4, Math.PI / 4);
      const speed = randomRange(4, 10);
      const vx = Math.cos(spreadAngle) * speed;
      const vy = Math.sin(spreadAngle) * speed;
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      const size = randomRange(2, 5);

      const particle = new Particle(x, y, vx, vy, color, config.lifetime, size);
      this.particles.push(particle);
      this.container.addChild(particle.graphics);
    }
  }

  /**
   * Create dust cloud
   * @param {number} x
   * @param {number} y
   */
  createDust(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(1, 3);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 2;
      const color = 0x888888;
      const size = randomRange(3, 6);

      const particle = new Particle(x, y, vx, vy, color, 0.5, size);
      this.particles.push(particle);
      this.container.addChild(particle.graphics);
    }
  }

  /**
   * Update all particles
   * @param {number} deltaTime
   */
  update(deltaTime) {
    // Update active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update(deltaTime);

      // Remove inactive particles
      if (!particle.active) {
        particle.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Clear all particles
   */
  clear() {
    for (const particle of this.particles) {
      particle.destroy();
    }
    this.particles = [];
  }

  /**
   * Clean up
   */
  destroy() {
    this.clear();
  }
}

export default ParticleSystem;
