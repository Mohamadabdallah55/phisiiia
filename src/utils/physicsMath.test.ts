import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveVector,
  addVectors,
  computeDotProduct,
  computeCrossProductMagnitude,
  compute1DMotion,
  computeProjectile,
  computeCircularMotion,
  computeNewtonSecond,
  computeSurfaceGravity,
  getPageSpread,
} from './physicsMath';

test('resolveVector resolves 100 N at 30 degrees accurately', () => {
  const { ax, ay } = resolveVector(100, 30);
  assert.ok(Math.abs(ax - 86.6025) < 0.01);
  assert.ok(Math.abs(ay - 50) < 0.01);
});

test('addVectors matches textbook Example 10 (A=3 at 0, B=5 at 143, C=2 at 240)', () => {
  // Textbook Example 10 uses 37 deg above -x (143 deg) and 60 deg below -x (240 deg)
  const sum = addVectors([
    { magnitude: 3, angleDeg: 0 },
    { magnitude: 5, angleDeg: 143 },
    { magnitude: 2, angleDeg: 240 },
  ]);
  assert.ok(Math.abs(sum.rx - -1.993) < 0.05);
  assert.ok(Math.abs(sum.ry - 1.277) < 0.05);
  assert.ok(Math.abs(sum.magnitude - 2.36) < 0.05);
});

test('dot and cross product match textbook formulas', () => {
  // Example 6: F = 120 N, d = 5 m, theta = 53 deg
  const work = computeDotProduct(120, 5, 53);
  assert.ok(Math.abs(work - 361.089) < 2);
  // Perpendicular vectors: A = 3, B = 8, theta = 90 deg
  assert.equal(computeDotProduct(3, 8, 90), 0);
  assert.equal(computeCrossProductMagnitude(3, 8, 90), 24);
});

test('1D motion matches textbook Example 8 (vi=0, a=5, t=6.4)', () => {
  const res = compute1DMotion(0, 5, 6.4);
  assert.equal(res.vf, 32);
  assert.equal(res.dx, 102.4);
});

test('projectile motion matches textbook Example 12 (v0=22.5, angle=53)', () => {
  const res = computeProjectile(22.5, 53, 9.8);
  assert.ok(Math.abs(res.maxHeight - 16.46) < 0.2);
  assert.ok(Math.abs(res.timeOfFlight - 3.67) < 0.05);
  assert.ok(Math.abs(res.range - 49.68) < 0.5);
});

test('circular motion and surface gravity calculations are accurate', () => {
  // Moon gravity (Example 19): m = 7.35e22 kg, r = 1.738e6 m -> ~1.62 m/s^2
  const gMoon = computeSurfaceGravity(7.35e22, 1.738e6);
  assert.equal(gMoon, 1.62);

  const circ = computeCircularMotion(10, 2);
  assert.ok(Math.abs(circ.speed - 31.4159) < 0.01);
});

test('Newton second law computes net force and acceleration', () => {
  const res = computeNewtonSecond(1000, 400, 800);
  assert.equal(res.netForce, 600);
  assert.equal(res.acceleration, 0.75);
});

test('getPageSpread returns RTL two-page spread pairs', () => {
  assert.deepEqual(getPageSpread(1, true, 88), [1]);
  assert.deepEqual(getPageSpread(2, true, 88), [2, 3]);
  assert.deepEqual(getPageSpread(3, true, 88), [2, 3]);
  assert.deepEqual(getPageSpread(10, true, 88), [10, 11]);
  assert.deepEqual(getPageSpread(10, false, 88), [10]);
});

test('allBookHotspots have valid coordinates, unique IDs, and Unit 1 & Unit 2 coverage', async () => {
  const { allBookHotspots, getHotspotsForPage } = await import('../data/bookHotspots');
  assert.ok(allBookHotspots.length >= 45);
  const seenIds = new Set<string>();
  for (const h of allBookHotspots) {
    assert.ok(!seenIds.has(h.id), `Duplicate hotspot id: ${h.id}`);
    seenIds.add(h.id);
    assert.ok(h.page >= 1 && h.page <= 88, `Invalid page ${h.page} on ${h.id}`);
    assert.ok(h.box.x >= 0 && h.box.y >= 0 && h.box.w > 0 && h.box.h > 0, `Invalid box on ${h.id}`);
    assert.ok(h.box.x + h.box.w <= 100 && h.box.y + h.box.h <= 100, `Box out of bounds on ${h.id}`);
    if (h.quiz) {
      for (const q of h.quiz) {
        assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length);
      }
    }
  }
  assert.ok(getHotspotsForPage(7).length >= 1);
  assert.ok(getHotspotsForPage(52).length >= 1);
});
