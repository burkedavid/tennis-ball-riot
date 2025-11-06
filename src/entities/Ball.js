/**
 * Ball Entity
 * Represents a tennis ball that can be thrown
 */

import * as PIXI from 'pixi.js';
import { ENTITIES } from '../config/constants.js';

export class Ball {
  constructor(physicsWorld, x, y) {
    this.physicsWorld = physicsWorld;
    this.radius = ENTITIES.ball.radius;

    // Create physics body
    this.body = physicsWorld.createBall(x, y, this.radius);

    // Create visual representation
    this.graphics = new PIXI.Graphics();
    this.drawBall();

    this.isActive = false;
    this.bounceCount = 0;
    this.hasCollided = false;
  }

  /**
   * Draw the ball graphics
   */
  drawBall() {
    this.graphics.clear();

    // Ball outer circle - BRIGHT GREEN tennis ball
    this.graphics.beginFill(0x9FCD2A); // Tennis ball green
    this.graphics.drawCircle(0, 0, this.radius);
    this.graphics.endFill();

    // Tennis ball seam lines (white curves)
    this.graphics.lineStyle(3, 0xFFFFFF, 0.8);

    // Left curve
    this.graphics.arc(0, 0, this.radius * 0.6, -Math.PI / 3, Math.PI / 3);

    // Right curve
    this.graphics.arc(0, 0, this.radius * 0.6, Math.PI * 2 / 3, Math.PI * 4 / 3);

    // Highlight for 3D effect
    this.graphics.beginFill(0xFFFFFF, 0.4);
    this.graphics.drawCircle(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.25);
    this.graphics.endFill();

    // Shadow for depth
    this.graphics.beginFill(0x000000, 0.2);
    this.graphics.drawCircle(this.radius * 0.3, this.radius * 0.3, this.radius * 0.2);
    this.graphics.endFill();
  }

  /**
   * Update ball position from physics body
   */
  update() {
    if (this.body) {
      this.graphics.x = this.body.position.x;
      this.graphics.y = this.body.position.y;
      this.graphics.rotation = this.body.angle;
    }
  }

  /**
   * Throw the ball
   * @param {number} angle - Angle in degrees
   * @param {number} power - Power 0-100
   */
  throw(angle, power) {
    this.isActive = true;
    this.bounceCount = 0;
    this.hasCollided = false;
    this.physicsWorld.throwBall(this.body, angle, power);
  }

  /**
   * Throw the ball with direct velocity
   * @param {number} vx - X velocity
   * @param {number} vy - Y velocity
   */
  throwWithVelocity(vx, vy) {
    this.isActive = true;
    this.bounceCount = 0;
    this.hasCollided = false;
    this.physicsWorld.applyVelocity(this.body, vx, vy);
  }

  /**
   * Register a bounce
   */
  registerBounce() {
    this.bounceCount++;
  }

  /**
   * Get current position
   * @returns {{x: number, y: number}}
   */
  getPosition() {
    return {
      x: this.body.position.x,
      y: this.body.position.y,
    };
  }

  /**
   * Get velocity
   * @returns {{x: number, y: number}}
   */
  getVelocity() {
    return {
      x: this.body.velocity.x,
      y: this.body.velocity.y,
    };
  }

  /**
   * Check if ball has stopped moving
   * @returns {boolean}
   */
  isStopped() {
    const vel = this.getVelocity();
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    return speed < 0.1;
  }

  /**
   * Check if ball is out of bounds
   * @returns {boolean}
   */
  isOutOfBounds() {
    return this.physicsWorld.isBallOutOfBounds(this.body);
  }

  /**
   * Destroy ball and clean up
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

  /**
   * Get PIXI graphics object for rendering
   * @returns {PIXI.Graphics}
   */
  getGraphics() {
    return this.graphics;
  }
}

export default Ball;
