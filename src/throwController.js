/**
 * Throw Controller - Drag-to-Throw System
 * Handles all pointer/touch input for intuitive ball throwing
 */

import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { lerp } from './utils.js';

// Throw configuration constants
export const THROW_CONFIG = {
  // Drag limits
  MIN_DRAG_DISTANCE: 30,        // Minimum pixels to register throw
  MAX_DRAG_DISTANCE: 250,       // Maximum drag length for max power (increased for more range)

  // Power scaling - BALANCED for reachability
  MIN_THROW_FORCE: 6,           // Minimum velocity
  MAX_THROW_FORCE: 20,          // Maximum velocity - enough power to reach glass!

  // Angle constraints
  MIN_THROW_ANGLE: -85,         // Degrees (almost straight up)
  MAX_THROW_ANGLE: 85,          // Degrees (almost straight up other direction)

  // Feel adjustments
  POWER_CURVE: 1.2,             // Exponential curve for power (better feel)
  DRAG_SMOOTHING: 0.15,         // Smooth out jittery movement

  // Visual feedback
  ARROW_SCALE_MIN: 0.5,
  ARROW_SCALE_MAX: 2.0,
  TRAJECTORY_PREVIEW_POINTS: 15,
  TRAJECTORY_PREVIEW_TIME: 1.5,
};

export class ThrowController {
  constructor(ballStartX, ballStartY) {
    this.ballStartX = ballStartX;
    this.ballStartY = ballStartY;

    // Drag state
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragCurrent = { x: 0, y: 0 };
    this.dragVector = { x: 0, y: 0 };
    this.smoothedVector = { x: 0, y: 0 };

    // Scale factors for coordinate transformation (canvas to game world)
    this.scaleX = 1;
    this.scaleY = 1;

    // Visual feedback
    this.dragArrow = null;
    this.trajectoryPreview = null;

    // Callback
    this.onThrowCallback = null;
  }

  /**
   * Update scale factors when canvas/window resizes
   */
  setScaleFactors(scaleX, scaleY) {
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    console.log(`🎯 ThrowController scale updated: ${scaleX.toFixed(3)}x, ${scaleY.toFixed(3)}x`);
  }

  /**
   * Initialize visual feedback
   */
  initVisuals(pixiContainer) {
    this.dragArrow = new DragArrowVisual(pixiContainer);
    this.trajectoryPreview = new TrajectoryPreview(pixiContainer);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners(canvasElement) {
    // Mouse events
    canvasElement.addEventListener('mousedown', (e) => this.handlePointerDown(e.clientX, e.clientY));
    canvasElement.addEventListener('mousemove', (e) => this.handlePointerMove(e.clientX, e.clientY));
    canvasElement.addEventListener('mouseup', (e) => this.handlePointerUp());

    // Touch events
    canvasElement.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handlePointerDown(touch.clientX, touch.clientY);
    });
    canvasElement.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handlePointerMove(touch.clientX, touch.clientY);
    });
    canvasElement.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handlePointerUp();
    });
  }

  /**
   * Convert screen coordinates to game world coordinates
   * Takes into account both canvas position and scaling
   */
  screenToCanvas(screenX, screenY, canvasRect) {
    // First convert to canvas-local coordinates
    const canvasX = screenX - canvasRect.left;
    const canvasY = screenY - canvasRect.top;

    // Then scale to game world coordinates (1200x800)
    return {
      x: canvasX / this.scaleX,
      y: canvasY / this.scaleY
    };
  }

  /**
   * Handle pointer down (start flick)
   */
  handlePointerDown(screenX, screenY) {
    console.log('👆 POINTER DOWN - Screen coords:', screenX, screenY);

    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.error('❌ Canvas not found!');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    console.log('📐 Canvas rect:', rect);
    console.log('📐 Scale factors:', this.scaleX, this.scaleY);

    const pos = this.screenToCanvas(screenX, screenY, rect);
    console.log('🎯 Game world coords:', pos);

    this.isDragging = true;
    this.dragStart = { x: pos.x, y: pos.y }; // CHANGED: Start from touch point, not ball
    this.dragCurrent = { x: pos.x, y: pos.y };
    this.flickStartTime = Date.now();
    this.smoothedVector = { x: 0, y: 0 };

    if (this.dragArrow) {
      this.dragArrow.show();
      console.log('✅ Drag arrow shown');
    } else {
      console.warn('⚠️ Drag arrow not initialized');
    }

    if (this.trajectoryPreview) {
      this.trajectoryPreview.show();
      console.log('✅ Trajectory preview shown');
    } else {
      console.warn('⚠️ Trajectory preview not initialized');
    }

    console.log('🎯 Flick started at:', this.dragStart);
  }

  /**
   * Handle pointer move (update drag)
   */
  handlePointerMove(screenX, screenY) {
    if (!this.isDragging) return;

    const canvas = document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    const pos = this.screenToCanvas(screenX, screenY, rect);

    this.dragCurrent = { x: pos.x, y: pos.y };

    // Calculate raw drag vector (DIRECT - flick toward target)
    // Flick UP (toward glass) = ball goes UP
    this.dragVector = {
      x: this.dragCurrent.x - this.dragStart.x,
      y: this.dragCurrent.y - this.dragStart.y
    };

    // Apply smoothing
    this.smoothedVector.x = lerp(
      this.smoothedVector.x,
      this.dragVector.x,
      THROW_CONFIG.DRAG_SMOOTHING
    );
    this.smoothedVector.y = lerp(
      this.smoothedVector.y,
      this.dragVector.y,
      THROW_CONFIG.DRAG_SMOOTHING
    );

    // Update visuals
    const force = this.calculateThrowForce();
    const velocity = this.calculateThrowVelocity();

    // Debug logging (throttled)
    if (Math.random() < 0.1) { // Log ~10% of frames
      console.log('🎯 Flicking - vector:', this.smoothedVector, 'force:', force.toFixed(1));
    }

    if (this.dragArrow) {
      this.dragArrow.update(this.dragStart, this.smoothedVector, force);
    }
    if (this.trajectoryPreview) {
      // Show trajectory from ball position, not flick start
      const ballPos = { x: this.ballStartX, y: this.ballStartY };
      this.trajectoryPreview.update(ballPos, velocity);
    }
  }

  /**
   * Handle pointer up (release flick)
   */
  handlePointerUp() {
    console.log('👆 POINTER UP - isDragging:', this.isDragging);

    if (!this.isDragging) {
      console.warn('⚠️ Not dragging, ignoring pointer up');
      return;
    }

    const dragDistance = this.getDragDistance();
    const flickDuration = Date.now() - this.flickStartTime;

    console.log(`📏 Drag distance: ${dragDistance.toFixed(0)}px, Duration: ${flickDuration}ms`);
    console.log(`📏 Min required: ${THROW_CONFIG.MIN_DRAG_DISTANCE}px`);

    // Only throw if flicked far enough
    if (dragDistance >= THROW_CONFIG.MIN_DRAG_DISTANCE) {
      const velocity = this.calculateThrowVelocity();
      const force = this.calculateThrowForce();

      console.log(`👆 THROWING! Flick: ${dragDistance.toFixed(0)}px in ${flickDuration}ms`);
      console.log(`🚀 Velocity: (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}), Force: ${force.toFixed(2)}`);

      if (this.onThrowCallback) {
        console.log('✅ Calling onThrowCallback...');
        this.onThrowCallback(velocity, force);
      } else {
        console.error('❌ No onThrowCallback set!');
      }
    } else {
      console.warn(`⚠️ Drag too short! ${dragDistance.toFixed(0)}px < ${THROW_CONFIG.MIN_DRAG_DISTANCE}px`);
    }

    this.isDragging = false;

    if (this.dragArrow) {
      this.dragArrow.hide();
    }
    if (this.trajectoryPreview) {
      this.trajectoryPreview.hide();
    }
  }

  /**
   * Get drag distance
   */
  getDragDistance() {
    return Math.sqrt(
      this.smoothedVector.x ** 2 +
      this.smoothedVector.y ** 2
    );
  }

  /**
   * Calculate throw force from drag distance
   */
  calculateThrowForce() {
    const dragDistance = this.getDragDistance();

    // Clamp to max
    const clampedDistance = Math.min(
      dragDistance,
      THROW_CONFIG.MAX_DRAG_DISTANCE
    );

    // Normalize to 0-1
    const normalizedPower = clampedDistance / THROW_CONFIG.MAX_DRAG_DISTANCE;

    // Apply power curve for better feel
    const curvedPower = Math.pow(normalizedPower, THROW_CONFIG.POWER_CURVE);

    // Map to force range
    const force =
      THROW_CONFIG.MIN_THROW_FORCE +
      (THROW_CONFIG.MAX_THROW_FORCE - THROW_CONFIG.MIN_THROW_FORCE) * curvedPower;

    return force;
  }

  /**
   * Calculate throw angle from drag direction
   */
  calculateThrowAngle() {
    // Angle from drag vector
    let angle = Math.atan2(
      this.smoothedVector.y,
      this.smoothedVector.x
    );

    // Convert to degrees
    angle = angle * (180 / Math.PI);

    // Clamp to allowed range
    angle = Math.max(
      THROW_CONFIG.MIN_THROW_ANGLE,
      Math.min(THROW_CONFIG.MAX_THROW_ANGLE, angle)
    );

    return angle;
  }

  /**
   * Calculate velocity vector for throw
   */
  calculateThrowVelocity() {
    // Use the smoothed vector directly, scaled to throw speed
    // This preserves the natural flick direction and magnitude
    const dragDistance = this.getDragDistance();

    if (dragDistance < 1) {
      return { x: 0, y: 0 };
    }

    // Simple approach: Use the flick vector directly with a small multiplier
    // The smoothedVector is already in pixels, so we just need to scale it down
    // to reasonable game velocities
    const velocityMultiplier = 0.12; // INCREASED for more power - ball can now reach glass!

    const velocity = {
      x: this.smoothedVector.x * velocityMultiplier,
      y: this.smoothedVector.y * velocityMultiplier
    };

    console.log(`🚀 Velocity calc - flickVector: (${this.smoothedVector.x.toFixed(0)}, ${this.smoothedVector.y.toFixed(0)}), result: (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)})`);

    return velocity;
  }

  /**
   * Set callback for throw event
   */
  setOnThrowCallback(callback) {
    this.onThrowCallback = callback;
  }

  /**
   * Update ball start position
   */
  updateBallPosition(x, y) {
    this.ballStartX = x;
    this.ballStartY = y;
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.dragArrow) {
      this.dragArrow.destroy();
    }
    if (this.trajectoryPreview) {
      this.trajectoryPreview.destroy();
    }
  }
}

/**
 * Visual feedback for drag arrow
 */
class DragArrowVisual {
  constructor(pixiContainer) {
    this.container = new PIXI.Container();
    this.container.visible = false;

    // Arrow line
    this.line = new PIXI.Graphics();

    // Arrow head
    this.arrowHead = new PIXI.Graphics();

    // Power circle
    this.powerCircle = new PIXI.Graphics();

    this.container.addChild(this.powerCircle, this.line, this.arrowHead);
    pixiContainer.addChild(this.container);
  }

  show() {
    this.container.visible = true;
  }

  hide() {
    this.container.visible = false;
    gsap.killTweensOf(this.powerCircle.scale);
    this.powerCircle.scale.set(1);
  }

  update(dragStart, smoothedVector, force) {
    this.line.clear();
    this.arrowHead.clear();
    this.powerCircle.clear();

    // Arrow points in throw direction
    const endX = dragStart.x + smoothedVector.x;
    const endY = dragStart.y + smoothedVector.y;

    // Calculate angle for color guidance (aim toward top-left for glass at x=600)
    const angle = Math.atan2(smoothedVector.y, smoothedVector.x);
    const angleInDegrees = angle * (180 / Math.PI);

    // Good angle is upward (negative Y) and rightward (positive X) for glass target
    // Ideal range: -45 to -85 degrees (up-right diagonal to mostly vertical)
    const isGoodAngle = smoothedVector.y < 0 && angleInDegrees < -20; // Upward with some arc
    const lineColor = isGoodAngle ? 0x00FF00 : 0xFF9900; // Green = good, Orange = adjust

    // Arrow line with color feedback
    this.line.lineStyle(5, lineColor, 0.9);
    this.line.moveTo(dragStart.x, dragStart.y);
    this.line.lineTo(endX, endY);

    // Arrow head (using same angle calculated above)
    const headSize = 20;

    this.arrowHead.beginFill(lineColor, 0.9); // Match arrow color
    this.arrowHead.moveTo(endX, endY);
    this.arrowHead.lineTo(
      endX - headSize * Math.cos(angle - Math.PI / 6),
      endY - headSize * Math.sin(angle - Math.PI / 6)
    );
    this.arrowHead.lineTo(
      endX - headSize * Math.cos(angle + Math.PI / 6),
      endY - headSize * Math.sin(angle + Math.PI / 6)
    );
    this.arrowHead.closePath();
    this.arrowHead.endFill();

    // Power circle
    const normalizedPower = force / THROW_CONFIG.MAX_THROW_FORCE;
    const circleRadius = 15 + normalizedPower * 25;
    const circleColor = this.getPowerColor(normalizedPower);

    this.powerCircle.beginFill(circleColor, 0.4);
    this.powerCircle.drawCircle(dragStart.x, dragStart.y, circleRadius);
    this.powerCircle.endFill();

    // Pulse animation
    gsap.killTweensOf(this.powerCircle.scale);
    gsap.to(this.powerCircle.scale, {
      x: 1.3,
      y: 1.3,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
  }

  getPowerColor(normalized) {
    if (normalized < 0.5) {
      return 0x00FF00; // Green (low power)
    } else if (normalized < 0.8) {
      return 0xFFFF00; // Yellow (medium)
    } else {
      return 0xFF0000; // Red (max power!)
    }
  }

  destroy() {
    this.container.destroy();
  }
}

/**
 * Trajectory preview dots
 */
class TrajectoryPreview {
  constructor(pixiContainer) {
    this.container = new PIXI.Container();
    this.container.visible = false;

    this.dots = [];

    // Create preview dots (GREEN like the ball)
    for (let i = 0; i < THROW_CONFIG.TRAJECTORY_PREVIEW_POINTS; i++) {
      const dot = new PIXI.Graphics();
      const alpha = 0.8 - (i / THROW_CONFIG.TRAJECTORY_PREVIEW_POINTS) * 0.6; // Fade out
      dot.beginFill(0x9FCD2A, alpha); // Tennis ball green
      dot.drawCircle(0, 0, 5); // Slightly larger
      dot.endFill();
      this.dots.push(dot);
      this.container.addChild(dot);
    }

    pixiContainer.addChild(this.container);
  }

  show() {
    this.container.visible = true;
  }

  hide() {
    this.container.visible = false;
  }

  update(startPos, velocity) {
    const gravity = 0.3; // Match game gravity (REDUCED)
    const timeStep = THROW_CONFIG.TRAJECTORY_PREVIEW_TIME / THROW_CONFIG.TRAJECTORY_PREVIEW_POINTS;

    let x = startPos.x;
    let y = startPos.y;
    let vx = velocity.x;
    let vy = velocity.y;

    for (let i = 0; i < this.dots.length; i++) {
      // Simple physics simulation
      x += vx * timeStep * 60; // Scale by 60fps
      y += vy * timeStep * 60;
      vy += gravity * timeStep * 60; // Apply gravity

      this.dots[i].x = x;
      this.dots[i].y = y;
    }
  }

  destroy() {
    this.container.destroy();
  }
}

export default ThrowController;
