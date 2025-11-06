/**
 * Physics System using Matter.js
 * Handles all physics simulation, collision detection, and world management
 */

import Matter from 'matter-js';
import { PHYSICS_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './config/constants.js';

export class PhysicsWorld {
  constructor() {
    this.engine = null;
    this.world = null;
    this.runner = null;
    this.bodies = new Map(); // Track all physics bodies
    this.init();
  }

  /**
   * Initialize Matter.js physics engine
   */
  init() {
    // Create engine
    this.engine = Matter.Engine.create({
      gravity: PHYSICS_CONFIG.gravity,
      enableSleeping: false,
    });

    this.world = this.engine.world;

    // Create runner for physics updates
    this.runner = Matter.Runner.create();
  }

  /**
   * Start the physics simulation
   */
  start() {
    Matter.Runner.run(this.runner, this.engine);
  }

  /**
   * Stop the physics simulation
   */
  stop() {
    Matter.Runner.stop(this.runner);
  }

  /**
   * Update physics (called each frame)
   * @param {number} delta - Time since last frame (ms)
   */
  update(delta) {
    Matter.Engine.update(this.engine, delta);
  }

  /**
   * Create a ball body
   * @param {number} x - Starting x position
   * @param {number} y - Starting y position
   * @param {number} radius - Ball radius
   * @returns {Matter.Body} Ball physics body
   */
  createBall(x, y, radius) {
    const ball = Matter.Bodies.circle(x, y, radius, {
      restitution: PHYSICS_CONFIG.ballRestitution,
      friction: 0.05,
      frictionAir: PHYSICS_CONFIG.airResistance,
      density: 0.001,
      label: 'ball',
    });

    Matter.World.add(this.world, ball);
    this.bodies.set('activeBall', ball);
    return ball;
  }

  /**
   * Apply throw force to ball
   * @param {Matter.Body} ball - Ball body
   * @param {number} angle - Throw angle in degrees
   * @param {number} power - Throw power (0-100)
   */
  throwBall(ball, angle, power) {
    const angleRad = (angle * Math.PI) / 180;
    const force = (power / 100) * PHYSICS_CONFIG.throwForceMultiplier;

    const forceX = Math.cos(angleRad) * force;
    const forceY = -Math.sin(angleRad) * force; // Negative because y increases downward

    Matter.Body.applyForce(ball, ball.position, {
      x: forceX,
      y: forceY,
    });
  }

  /**
   * Create a static rectangle (walls, platforms, etc.)
   * @param {number} x - Center x
   * @param {number} y - Center y
   * @param {number} width
   * @param {number} height
   * @param {string} label - Identifier
   * @returns {Matter.Body} Static body
   */
  createStaticRect(x, y, width, height, label = 'static') {
    const rect = Matter.Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      restitution: PHYSICS_CONFIG.stageRestitution,
      friction: 0.3,
      label: label,
    });

    Matter.World.add(this.world, rect);
    this.bodies.set(label, rect);
    return rect;
  }

  /**
   * Create a static circle (for collision detection zones)
   * @param {number} x - Center x
   * @param {number} y - Center y
   * @param {number} radius
   * @param {string} label - Identifier
   * @returns {Matter.Body} Static body
   */
  createStaticCircle(x, y, radius, label = 'static') {
    const circle = Matter.Bodies.circle(x, y, radius, {
      isStatic: true,
      isSensor: true, // Pass-through for collision detection only
      label: label,
    });

    Matter.World.add(this.world, circle);
    this.bodies.set(label, circle);
    return circle;
  }

  /**
   * Create a dynamic obstacle (can be moved)
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {string} label
   * @returns {Matter.Body} Dynamic body
   */
  createDynamicRect(x, y, width, height, label = 'obstacle') {
    const rect = Matter.Bodies.rectangle(x, y, width, height, {
      isStatic: false,
      restitution: 0.6,
      friction: 0.3,
      density: 0.01,
      label: label,
    });

    Matter.World.add(this.world, rect);
    this.bodies.set(label, rect);
    return rect;
  }

  /**
   * Remove a body from the physics world
   * @param {Matter.Body} body
   */
  removeBody(body) {
    Matter.World.remove(this.world, body);

    // Remove from tracking
    for (const [key, value] of this.bodies.entries()) {
      if (value === body) {
        this.bodies.delete(key);
        break;
      }
    }
  }

  /**
   * Get body by label
   * @param {string} label
   * @returns {Matter.Body|null}
   */
  getBody(label) {
    return this.bodies.get(label) || null;
  }

  /**
   * Check if ball is out of bounds
   * @param {Matter.Body} ball
   * @returns {boolean}
   */
  isBallOutOfBounds(ball) {
    return (
      ball.position.x < -50 ||
      ball.position.x > CANVAS_WIDTH + 50 ||
      ball.position.y > CANVAS_HEIGHT + 50
    );
  }

  /**
   * Check collision between two bodies
   * @param {Matter.Body} bodyA
   * @param {Matter.Body} bodyB
   * @returns {boolean}
   */
  checkCollision(bodyA, bodyB) {
    return Matter.Collision.collides(bodyA, bodyB) !== null;
  }

  /**
   * Set up collision event listeners
   * @param {Function} onCollisionStart - Callback for collision start
   * @param {Function} onCollisionEnd - Callback for collision end
   */
  setupCollisionEvents(onCollisionStart, onCollisionEnd) {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      if (onCollisionStart) {
        onCollisionStart(event.pairs);
      }
    });

    Matter.Events.on(this.engine, 'collisionEnd', (event) => {
      if (onCollisionEnd) {
        onCollisionEnd(event.pairs);
      }
    });
  }

  /**
   * Clear all dynamic bodies (keep static boundaries)
   */
  clearDynamicBodies() {
    const bodiesToRemove = [];

    for (const body of this.world.bodies) {
      if (!body.isStatic) {
        bodiesToRemove.push(body);
      }
    }

    bodiesToRemove.forEach(body => this.removeBody(body));
  }

  /**
   * Reset physics world
   */
  reset() {
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
    this.bodies.clear();
  }

  /**
   * Get all bodies in world
   * @returns {Matter.Body[]}
   */
  getAllBodies() {
    return this.world.bodies;
  }
}

export default PhysicsWorld;
