/**
 * Obstacle Entity
 * Represents various stage obstacles (monitors, amps, lights)
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';

export const OBSTACLE_TYPES = {
  STAGE_MONITOR: 'stage_monitor',
  AMP_STACK: 'amp_stack',
  SPINNING_LIGHT: 'spinning_light',
};

export class Obstacle {
  constructor(physicsWorld, type, x, y, config = {}) {
    this.physicsWorld = physicsWorld;
    this.type = type;
    this.x = x;
    this.y = y;
    this.config = config;

    // Create visual representation
    this.graphics = new PIXI.Container();
    this.graphics.x = x;
    this.graphics.y = y;

    // Create physics body based on type
    this.createObstacle();

    // Animation state
    this.animationTween = null;
  }

  /**
   * Create obstacle based on type
   */
  createObstacle() {
    switch (this.type) {
      case OBSTACLE_TYPES.STAGE_MONITOR:
        this.createStageMonitor();
        break;
      case OBSTACLE_TYPES.AMP_STACK:
        this.createAmpStack();
        break;
      case OBSTACLE_TYPES.SPINNING_LIGHT:
        this.createSpinningLight();
        break;
    }
  }

  /**
   * Create stage monitor obstacle
   * Large wedge-shaped monitor, angled for visibility
   */
  createStageMonitor() {
    this.width = 80;
    this.height = 60;

    // Create physics body (static rectangle)
    this.body = this.physicsWorld.createStaticRectangle(
      this.x,
      this.y,
      this.width,
      this.height,
      { restitution: 0.4, label: 'obstacle_monitor' }
    );

    // Visual representation
    const monitor = new PIXI.Graphics();

    // Monitor screen (dark gray)
    monitor.beginFill(0x1a1a1a);
    monitor.drawRect(-this.width / 2, -this.height / 2, this.width, this.height);
    monitor.endFill();

    // Monitor frame (darker)
    monitor.lineStyle(4, 0x000000, 0.8);
    monitor.drawRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Screen glare (cyan tint)
    monitor.beginFill(0x00ffff, 0.2);
    monitor.drawRect(-this.width / 2 + 5, -this.height / 2 + 5, this.width - 10, this.height - 10);
    monitor.endFill();

    // Stand
    monitor.lineStyle(6, 0x333333, 1);
    monitor.moveTo(0, this.height / 2);
    monitor.lineTo(0, this.height / 2 + 15);

    this.graphics.addChild(monitor);
  }

  /**
   * Create amp stack obstacle
   * Stack of amps with speaker grilles
   */
  createAmpStack() {
    this.width = 70;
    this.height = 100;

    // Create physics body (static rectangle)
    this.body = this.physicsWorld.createStaticRectangle(
      this.x,
      this.y,
      this.width,
      this.height,
      { restitution: 0.6, label: 'obstacle_amp' }
    );

    // Visual representation
    const ampStack = new PIXI.Graphics();

    // Draw 2 stacked amps
    for (let i = 0; i < 2; i++) {
      const ampY = -this.height / 2 + (i * this.height / 2) + 5;

      // Amp body (dark)
      ampStack.beginFill(0x0a0a0a);
      ampStack.drawRect(-this.width / 2, ampY, this.width, this.height / 2 - 5);
      ampStack.endFill();

      // Amp outline
      ampStack.lineStyle(2, 0x444444, 1);
      ampStack.drawRect(-this.width / 2, ampY, this.width, this.height / 2 - 5);

      // Speaker grilles (4 circles)
      ampStack.lineStyle(1, 0x666666, 0.8);
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          const cx = -this.width / 4 + (col * this.width / 2);
          const cy = ampY + 10 + (row * 15);
          ampStack.drawCircle(cx, cy, 8);
        }
      }
    }

    this.graphics.addChild(ampStack);
  }

  /**
   * Create spinning stage light obstacle
   * Rotating light that moves in a pattern
   */
  createSpinningLight() {
    this.radius = 25;
    this.spinSpeed = this.config.spinSpeed || 2; // degrees per frame
    this.orbitRadius = this.config.orbitRadius || 0;
    this.orbitSpeed = this.config.orbitSpeed || 0;

    // Create physics body (small circle)
    this.body = this.physicsWorld.createBall(
      this.x,
      this.y,
      this.radius,
      { isStatic: true, restitution: 0.8, label: 'obstacle_light' }
    );

    // Visual representation
    const light = new PIXI.Graphics();

    // Light housing (dark gray)
    light.beginFill(0x2a2a2a);
    light.drawCircle(0, 0, this.radius);
    light.endFill();

    // Light beam (glowing center)
    const beamColor = this.config.color || 0xFFFF00;
    light.beginFill(beamColor, 0.8);
    light.drawCircle(0, 0, this.radius * 0.6);
    light.endFill();

    // Glow effect
    light.beginFill(beamColor, 0.3);
    light.drawCircle(0, 0, this.radius * 1.3);
    light.endFill();

    this.graphics.addChild(light);

    // Start spinning animation
    if (this.spinSpeed > 0) {
      gsap.to(this.graphics, {
        rotation: Math.PI * 2,
        duration: 360 / this.spinSpeed / 60, // Convert to seconds
        repeat: -1,
        ease: 'none',
      });
    }

    // Orbit animation if configured
    if (this.orbitRadius > 0 && this.orbitSpeed > 0) {
      this.startOrbitAnimation();
    }
  }

  /**
   * Start orbit animation for spinning light
   */
  startOrbitAnimation() {
    const centerX = this.x;
    const centerY = this.y;
    const timeline = gsap.timeline({ repeat: -1, ease: 'none' });

    timeline.to(this.graphics, {
      duration: 360 / this.orbitSpeed / 60,
      onUpdate: () => {
        const angle = (Date.now() * this.orbitSpeed * 0.001) % (Math.PI * 2);
        const newX = centerX + Math.cos(angle) * this.orbitRadius;
        const newY = centerY + Math.sin(angle) * this.orbitRadius;

        this.graphics.x = newX;
        this.graphics.y = newY;

        // Update physics body position
        if (this.body) {
          this.physicsWorld.setBodyPosition(this.body, newX, newY);
        }
      }
    });

    this.animationTween = timeline;
  }

  /**
   * Update obstacle (for animated obstacles)
   */
  update() {
    // Sync graphics with physics body position (for moving obstacles)
    if (this.body && this.type !== OBSTACLE_TYPES.SPINNING_LIGHT) {
      this.graphics.x = this.body.position.x;
      this.graphics.y = this.body.position.y;
      this.graphics.rotation = this.body.angle;
    }
  }

  /**
   * Get PIXI graphics for rendering
   */
  getGraphics() {
    return this.graphics;
  }

  /**
   * Destroy obstacle and clean up
   */
  destroy() {
    if (this.animationTween) {
      this.animationTween.kill();
      this.animationTween = null;
    }

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

export default Obstacle;
