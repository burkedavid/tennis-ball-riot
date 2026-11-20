// Metres in the vertical plane of the ball. Rendering never feeds the simulation.
export const ORIGIN = Object.freeze({ x: -1.85, y: 0.44 });
export const BALL_RADIUS = 0.078;
export const DEFAULT_AIM = Object.freeze({ angle: 60, power: 70 });
const STEP = 1 / 120;
const G = 9.81;
const RIM_Y = 1.35;
const RIM_X = 1.25;
const BASE_Y = 0.85;
const LIP = 0.018;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const LEVELS = [
  ['Sound Check', 10, 1, .335],
  ['Opening Act', 10, 2, .32],
  ['Main Set', 10, 3, .31],
  ['Encore', 10, 4, .30],
  ['Legendary Show', 10, 5, .29],
  ['Raw Power', 9, 6, .28],
  ['Lust for Life', 9, 6, .27],
  ['The Passenger', 8, 7, .26],
  ['Search and Destroy', 8, 7, .255],
  ['Iggy’s Ultimate Challenge', 10, 8, .25],
].map(([name, stock, goal, radius]) => Object.freeze({ name, stock, goal, radius }));

const WEDGE = Object.freeze({ x: -.72, y: .215, width: .68, height: .43, kind: 'monitor' });
const AMP = Object.freeze({ x: 2.53, y: 1.18, width: .42, height: 2.36, kind: 'amp' });
const freshStats = () => ({ makes: 0, throws: 0, banks: 0, bestCombo: 0 });

// Find the first contact made by a moving point with a capsule. Inflate stage
// edges by the radius of the ball, so rounded corners and high speeds are safe.
function sweepEdge(x, y, dx, dy, ax, ay, bx, by, radius) {
  const ex = bx - ax, ey = by - ay;
  const length = Math.hypot(ex, ey);
  const speed2 = dx * dx + dy * dy;
  if (speed2 < 1e-12) return null;
  let nearest = null;
  function consider(t, nx, ny) {
    if (t < -1e-8 || t > 1 || (nearest && nearest.t <= t)) return;
    if (dx * nx + dy * ny >= -1e-8) return;
    nearest = { t: Math.max(0, t), nx, ny };
  }
  if (length > 1e-8) {
    const tx = ex / length, ty = ey / length;
    const normX = -ty, normY = tx;
    const distance = (x - ax) * normX + (y - ay) * normY;
    const approach = dx * normX + dy * normY;
    if (Math.abs(approach) > 1e-10) {
      const sign = approach < 0 ? 1 : -1;
      const t = (sign * radius - distance) / approach;
      const projection = (x + dx * t - ax) * tx + (y + dy * t - ay) * ty;
      if (projection >= 0 && projection <= length) consider(t, normX * sign, normY * sign);
    }
  }
  function end(cx, cy) {
    const ox = x - cx, oy = y - cy;
    const b = ox * dx + oy * dy;
    if (b >= 0) return;
    const disc = b * b - speed2 * (ox * ox + oy * oy - radius * radius);
    if (disc < 0) return;
    const t = (-b - Math.sqrt(disc)) / speed2;
    consider(t, (ox + dx * t) / radius, (oy + dy * t) / radius);
  }
  end(ax, ay);
  if (length > 1e-8) end(bx, by);
  return nearest;
}

function collisionEdges(radius, gear) {
  const edges = [];
  function add(id, kind, ax, ay, bx, by, thickness = 0) {
    edges.push({ id, kind, ax, ay, bx, by, radius: BALL_RADIUS + thickness });
  }
  add('floor', 'bank', -4, 0, 4, 0);
  for (const box of gear) {
    const l = box.x - box.width / 2, r = box.x + box.width / 2;
    const b = box.y - box.height / 2, t = box.y + box.height / 2;
    add(box.kind, 'bank', l, b, l, t);
    add(box.kind, 'bank', l, t, r, t);
    add(box.kind, 'bank', r, t, r, b);
  }
  for (const direction of [-1, 1]) {
    const x = RIM_X + direction * radius;
    add('lip', 'rim', x, RIM_Y, x, RIM_Y, LIP);
    add('glass', 'glass', x, RIM_Y - LIP, RIM_X + direction * radius * .72, BASE_Y, .008);
  }
  add('base', 'glass', RIM_X - radius * .72, BASE_Y, RIM_X + radius * .72, BASE_Y, .008);
  const caseL = RIM_X - .47, caseR = RIM_X + .47;
  add('pint stand', 'bank', caseL, 0, caseL, BASE_Y);
  add('pint stand', 'bank', caseL, BASE_Y, caseR, BASE_Y);
  add('pint stand', 'bank', caseR, BASE_Y, caseR, 0);
  return edges;
}

export class Simulation {
  constructor(onEvent = () => {}) {
    this.onEvent = onEvent;
    this.ball = { x: ORIGIN.x, y: ORIGIN.y, vx: 0, vy: 0, active: false, banks: 0 };
    this.singer = { x: 0, y: 0, width: .46, height: 2.08, active: false };
    this.surge = { warning: false, active: false, direction: 1, amount: 0 };
    this.start(false);
    this.phase = 'title';
  }

  emit(type, details = {}) { this.onEvent({ type, ...details }); }
  get accuracy() { return this.stats.throws ? Math.round(100 * this.stats.makes / this.stats.throws) : 0; }
  start(announce = true) {
    this.score = 0;
    this.stats = freshStats();
    this.loadLevel(0, announce);
  }
  loadLevel(index, announce = true) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.remaining = this.level.stock;
    this.glass = { x: RIM_X, y: RIM_Y, radius: this.level.radius, bottom: BASE_Y };
    this.gear = index >= 2 ? [WEDGE, AMP] : index === 1 ? [WEDGE] : [];
    this.edges = collisionEdges(this.level.radius, this.gear);
    this.savedScore = this.score;
    this.savedStats = { ...this.stats };
    this.combo = this.makes = this.levelBest = this.time = this.accumulator = 0;
    this.earlyBonus = 0;
    this.lastShot = null;
    this.phase = 'ready';
    this.ball.active = false;
    Object.assign(this.ball, ORIGIN);
    this.updateStage();
    if (announce) this.emit('level', { index });
  }
  menu() {
    this.phase = 'title';
    this.ball.active = false;
    this.accumulator = 0;
  }
  retry() {
    this.score = this.savedScore;
    this.stats = { ...this.savedStats };
    this.loadLevel(this.levelIndex);
  }
  next() {
    if (this.phase !== 'clear' || this.levelIndex + 1 >= LEVELS.length) return false;
    this.loadLevel(this.levelIndex + 1);
    return true;
  }
  pause() {
    if (!['ready', 'flight', 'settling'].includes(this.phase)) return;
    this.resumePhase = this.phase;
    this.phase = 'paused';
    this.emit('pause');
  }
  resume() {
    if (this.phase !== 'paused') return;
    this.phase = this.resumePhase;
    this.emit('resume');
  }

  updateStage() {
    const index = this.levelIndex;
    const period = 5.8 - index * .22;
    const cycle = this.time / period;
    const phase = cycle % 1;
    this.surge.warning = index > 0 && phase > .64 && phase <= .79;
    this.surge.active = index > 0 && phase > .79 && phase < .94;
    this.surge.direction = Math.floor(cycle) % 2 ? -1 : 1;
    this.surge.amount = this.surge.active
      ? Math.sin((phase - .79) * Math.PI / .15) * (.24 + .072 * index) : 0;
    const gait = this.time * (.95 + .115 * index);
    this.singer.active = index > 0;
    this.singer.x = index ? -.10 + 1.24 * Math.sin(gait) : -.59 + .18 * Math.sin(gait);
    this.singer.y = index >= 6 ? Math.max(0, Math.sin(gait * .5 - 1.8)) ** 9 * .62 : 0;
  }

  velocity(angle, power) {
    const theta = clamp(angle, 15, 85) * Math.PI / 180;
    const speed = 3.25 + 4.65 * clamp(power, 0, 100) / 100;
    return { vx: speed * Math.cos(theta) + this.surge.direction * this.surge.amount,
      vy: speed * Math.sin(theta) };
  }
  preview(angle = DEFAULT_AIM.angle, power = DEFAULT_AIM.power, count = 18, points = []) {
    const { vx, vy } = this.velocity(angle, power);
    points.length = count;
    for (let i = 0; i < count; i++) {
      const point = points[i] || (points[i] = { x: 0, y: 0 });
      const t = i * .035;
      point.x = ORIGIN.x + vx * t;
      point.y = ORIGIN.y + vy * t - G * t * t / 2;
    }
    return points;
  }
  launch(angle = DEFAULT_AIM.angle, power = DEFAULT_AIM.power) {
    if (this.phase !== 'ready' || this.remaining <= 0 || !Number.isFinite(angle) || !Number.isFinite(power)) return false;
    Object.assign(this.ball, ORIGIN, this.velocity(angle, power), {
      active: true, banks: 0, age: 0, lastSurface: '', lastImpact: -1, lastRim: -1,
      singerHit: false, rimHit: false,
    });
    this.remaining--;
    this.stats.throws++;
    this.phase = 'flight';
    this.emit('launch');
    return true;
  }
  update(dt) {
    if (!['ready', 'flight', 'settling'].includes(this.phase) || !Number.isFinite(dt)) return;
    this.accumulator += clamp(dt, 0, .12);
    while (this.accumulator + 1e-10 >= STEP) {
      this.accumulator -= STEP;
      this.previousSingerX = this.singer.x;
      this.previousSingerY = this.singer.y;
      this.time += STEP;
      this.updateStage();
      if (this.phase === 'flight') this.advanceBall();
      else if (this.phase === 'settling' && this.time >= this.until) this.finishShot();
      if (!['ready', 'flight', 'settling'].includes(this.phase)) { this.accumulator = 0; break; }
    }
  }

  advanceBall() {
    const b = this.ball;
    b.age += STEP;
    let remainingTime = STEP;
    // Gravity integrates exactly between contacts. Linear sweeps over the
    // 8.3 ms interval differ from the parabola by under 0.1 mm.
    for (let pass = 0; pass < 3 && remainingTime > .00001; pass++) {
      const dx = b.vx * remainingTime, dy = (b.vy - G * remainingTime / 2) * remainingTime;
      let hit = null;
      const check = (edge) => {
        const contact = sweepEdge(b.x, b.y, dx, dy, edge.ax, edge.ay, edge.bx, edge.by, edge.radius);
        if (contact && (!hit || contact.t < hit.t)) hit = { ...contact, kind: edge.kind, id: edge.id };
      };
      for (const edge of this.edges) check(edge);
      if (this.singer.active && !b.singerHit) {
        const { x, y, width, height } = this.singer;
        const sx = (x - this.previousSingerX) * remainingTime / STEP;
        const sy = (y - this.previousSingerY) * remainingTime / STEP;
        const contact = sweepEdge(b.x, b.y, dx - sx, dy - sy, x - sx, y - sy + width / 2,
          x - sx, y - sy + height - width / 2, BALL_RADIUS + width / 2);
        if (contact && (!hit || contact.t < hit.t)) hit = { ...contact, kind: 'singer', id: 'singer' };
      }
      if (dy < 0 && b.y >= RIM_Y && b.y + dy < RIM_Y) {
        const fraction = (RIM_Y - b.y) / dy;
        const crossX = b.x + dx * fraction;
        // 1 cm entry allowance; an earlier physical lip contact still wins.
        const opening = this.glass.radius - BALL_RADIUS + .01;
        if (Math.abs(crossX - RIM_X) <= opening && (!hit || fraction < hit.t)) {
          b.x = crossX; b.y = RIM_Y;
          this.resolve(true);
          return;
        }
      }
      const fraction = hit ? hit.t : 1;
      b.x += dx * fraction; b.y += dy * fraction;
      b.vy -= G * remainingTime * fraction;
      if (!hit) break;
      const tangentRetention = hit.kind === 'rim' ? .67 : .87;
      const restitution = hit.kind === 'bank' ? .79 : hit.kind === 'singer' ? .57 : .34;
      const normalSpeed = b.vx * hit.nx + b.vy * hit.ny;
      b.vx = (b.vx - normalSpeed * hit.nx) * tangentRetention - normalSpeed * hit.nx * restitution;
      b.vy = (b.vy - normalSpeed * hit.ny) * tangentRetention - normalSpeed * hit.ny * restitution;
      b.x += hit.nx * .0003; b.y += hit.ny * .0003;
      if (hit.kind === 'bank' && -normalSpeed > .45 &&
          (b.lastSurface !== hit.id || b.age - b.lastImpact > .11)) {
        b.banks++; b.lastSurface = hit.id; b.lastImpact = b.age;
        this.emit('bank', { surface: hit.id });
      } else if (hit.kind === 'singer') {
        b.singerHit = true;
        this.emit('singer');
      } else if (hit.kind === 'rim' && b.age - b.lastRim > .14) {
        b.rimHit = true; b.lastRim = b.age;
        this.emit('rim');
      }
      remainingTime *= 1 - fraction;
    }
    if (b.x < -3.55 || b.x > 3.55 || b.age >= 3.3 ||
        (b.y < BALL_RADIUS + .02 && Math.hypot(b.vx, b.vy) < .48)) this.resolve(false);
  }

  resolve(made) {
    const b = this.ball;
    b.active = false;
    this.phase = 'settling';
    this.until = this.time + (made ? .62 : .36);
    const priorCombo = this.combo;
    let base = 0, bonus = 0;
    if (made) {
      this.makes++; this.stats.makes++; this.combo++;
      this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo);
      this.levelBest = Math.max(this.levelBest, this.combo);
      if (b.banks > 0) this.stats.banks++;
      base = 100 * [1, 1.5, 2, 3][Math.min(this.combo - 1, 3)];
      bonus = b.banks === 0 ? 50 : b.banks === 1 ? 25 : 100;
    } else this.combo = 0;
    this.score += base + bonus;
    this.lastShot = { made, base, bonus, points: base + bonus, banks: b.banks,
      rim: b.rimHit, singer: b.singerHit, priorCombo };
    this.emit(made ? 'make' : 'miss', this.lastShot);
  }
  finishShot() {
    if (this.makes >= this.level.goal) {
      this.phase = this.levelIndex === LEVELS.length - 1 ? 'victory' : 'clear';
      this.earlyBonus = this.level.stock - this.remaining < 5 ? 100 : 0;
      this.score += this.earlyBonus;
    } else if (!this.remaining) this.phase = 'failed';
    else {
      this.phase = 'ready';
      this.emit('ready');
      return;
    }
    this.emit('result', { phase: this.phase, earlyBonus: this.earlyBonus });
  }
}
