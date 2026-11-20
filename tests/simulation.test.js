import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, LEVELS, DEFAULT_AIM, ORIGIN, BALL_RADIUS } from '../src/simulation.js';

const tick = 1 / 120;

function finish(s, delta = tick) {
  for (let frames = 0; ['flight', 'settling'].includes(s.phase); frames++) {
    assert.ok(frames < Math.ceil(5 / delta), 'shot resolved within five seconds');
    s.update(delta);
  }
  return s.lastShot;
}

// A reproducible player strategy: loft the ball while the singer moves left
// across the right side of the stage. Only public controls advance the run.
function loft(s) {
  let previousX = -4;
  for (let wait = 0; s.levelIndex > 0; wait++) {
    if (s.singer.x > .75 && s.singer.x < .88 && s.singer.x < previousX &&
        !s.surge.active && !s.surge.warning) break;
    assert.ok(wait < 1800, 'a playable window opens within 15 seconds');
    previousX = s.singer.x;
    s.update(tick);
  }
  assert.equal(s.launch(69, 84), true);
  return finish(s);
}

test('all ten levels can be completed with legal throws, including the finale', () => {
  const s = new Simulation();
  s.start();
  let expectedScore = 0;
  for (let index = 0; index < LEVELS.length; index++) {
    assert.equal(s.levelIndex, index);
    assert.ok(s.level.goal <= s.level.stock);
    assert.equal(s.remaining, s.level.stock);
    assert.equal(s.combo, 0);
    for (let i = 0; i < s.level.goal; i++) {
      const shot = loft(s);
      assert.equal(shot.made, true);
      assert.equal(shot.banks, 0, 'clear arc');
      expectedScore += 100 * [1, 1.5, 2, 3][Math.min(i, 3)] + 50;
    }
    expectedScore += s.level.goal < 5 ? 100 : 0;
    assert.equal(s.score, expectedScore);
    assert.equal(s.phase, index < 9 ? 'clear' : 'victory');
    assert.equal(s.next(), index < 9);
  }
  assert.deepEqual(s.stats, { makes: 49, throws: 49, banks: 0, bestCombo: 8 });
  assert.equal(s.accuracy, 100);
});

test('the final ball can win or lose, with exactly one result and no dead end', () => {
  for (const shouldWin of [true, false]) {
    const events = [];
    const s = new Simulation(event => events.push(event.type));
    s.start();
    for (let i = 0; i < 10; i++) {
      if (i === 9 && shouldWin) s.launch();
      else s.launch(30, 30);
      assert.equal(s.launch(), false);
      finish(s);
    }
    assert.equal(s.remaining, 0);
    assert.equal(s.phase, shouldWin ? 'clear' : 'failed');
    assert.equal(s.earlyBonus, 0);
    assert.equal(events.filter(e => e === 'result').length, 1);
    s.retry();
    assert.equal(s.remaining, 10);
    assert.equal(s.score, 0);
    assert.equal(s.stats.throws, 0);
    assert.equal(s.phase, 'ready');
  }
});

test('flight and result delays freeze while paused and reset through menu', () => {
  const s = new Simulation();
  assert.equal(s.launch(), false);
  s.start(); s.launch();
  for (let i = 0; i < 22; i++) s.update(tick);
  s.pause();
  const position = { ...s.ball };
  const time = s.time;
  for (let i = 0; i < 180; i++) s.update(1);
  assert.deepEqual(s.ball, position);
  assert.equal(s.time, time);
  s.resume();
  while (s.phase === 'flight') s.update(tick);
  assert.equal(s.phase, 'settling');
  s.pause(); s.update(.1); s.resume();
  finish(s);
  assert.equal(s.phase, 'clear');
  s.menu(); assert.equal(s.phase, 'title');
  s.start(); assert.deepEqual(s.stats, { makes: 0, throws: 0, banks: 0, bestCombo: 0 });
});

test('same launch resolves identically at 30, 60 and 120 Hz', () => {
  const result = [];
  for (const fps of [30, 60, 120]) {
    const s = new Simulation();
    s.start();
    s.launch(DEFAULT_AIM.angle, DEFAULT_AIM.power);
    result.push(finish(s, 1 / fps));
    assert.equal(s.score, 250);
  }
  assert.deepEqual(result[0], result[1]); assert.deepEqual(result[1], result[2]);
});

test('preview matches the first arc during a timed surge', () => {
  const s = new Simulation();
  s.start(); s.launch(); finish(s); s.next();
  while (s.surge.amount < .14 || s.singer.x < 0) s.update(tick);
  const guide = s.preview(72, 90, 6);
  s.launch(72, 90);
  for (let i = 0; i < 21; i++) s.update(tick); // 0.175s = guide point five
  assert.ok(Math.abs(s.ball.x - guide[5].x) < 1e-8);
  assert.ok(Math.abs(s.ball.y - guide[5].y) < 1e-8);
});

test('bank, direct, lip and singer collisions produce distinct outcomes', () => {
  const e = [];
  const s = new Simulation(event => e.push(event.type));
  s.start();
  s.launch(76, 65); let shot = finish(s);
  assert.ok(shot.made); assert.equal(shot.banks, 1); assert.equal(shot.points, 125);
  assert.ok(e.includes('bank'));
  s.retry(); s.launch(32, 97.5); shot = finish(s);
  assert.equal(shot.made, false); assert.ok(shot.rim); assert.ok(e.includes('rim'));
  s.retry(); s.launch(); finish(s); s.next();
  s.launch(30, 30); shot = finish(s);
  assert.ok(shot.singer); assert.ok(e.includes('singer'));
  assert.equal(shot.points, 0);
  s.loadLevel(9); s.launch(70, 95); shot = finish(s);
  assert.ok(shot.made); assert.equal(shot.banks, 2); assert.equal(shot.bonus, 100);
});

test('a miss clears the combo; retry rolls back only the current level ledger', () => {
  const s = new Simulation();
  s.start(); s.launch(); finish(s); s.next();
  const entryScore = s.score, entryStats = { ...s.stats };
  loft(s); assert.equal(s.combo, 1);
  s.launch(20, 0); finish(s);
  assert.equal(s.combo, 0);
  assert.equal(s.makes, 1);
  s.retry();
  assert.equal(s.score, entryScore);
  assert.deepEqual(s.stats, entryStats);
  assert.equal(s.levelIndex, 1);
  assert.equal(s.makes, 0);
  assert.equal(s.ball.x, ORIGIN.x);
});

test('underside crossing and an outside wall do not count as entry', () => {
  for (const [offsetX, startY, vy] of [[0, .45, 8], [.40, 1.35, -4]]) {
    const s = new Simulation();
    s.start(); s.launch(); // Seed a precise contact just outside the vessel.
    Object.assign(s.ball, { x: s.glass.x + offsetX, y: startY, vx: .01, vy });
    const shot = finish(s);
    assert.equal(shot.made, false);
  }
  const s = new Simulation();
  assert.ok(s.glass.radius > BALL_RADIUS);
});
