export interface VectorInput {
  magnitude: number;
  angleDeg: number;
}

export interface VectorComponents {
  ax: number;
  ay: number;
}

export interface VectorSumResult {
  rx: number;
  ry: number;
  magnitude: number;
  angleDeg: number;
}

export function resolveVector(magnitude: number, angleDeg: number): VectorComponents {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    ax: Number((magnitude * Math.cos(rad)).toFixed(4)),
    ay: Number((magnitude * Math.sin(rad)).toFixed(4)),
  };
}

export function addVectors(vectors: VectorInput[]): VectorSumResult {
  let rx = 0;
  let ry = 0;
  for (const v of vectors) {
    const { ax, ay } = resolveVector(v.magnitude, v.angleDeg);
    rx += ax;
    ry += ay;
  }
  const magnitude = Math.sqrt(rx * rx + ry * ry);
  let angleDeg = (Math.atan2(ry, rx) * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;
  return {
    rx: Number(rx.toFixed(4)),
    ry: Number(ry.toFixed(4)),
    magnitude: Number(magnitude.toFixed(4)),
    angleDeg: Number(angleDeg.toFixed(2)),
  };
}

export function computeDotProduct(a: number, b: number, angleDeg: number): number {
  const rad = (angleDeg * Math.PI) / 180;
  return Number((a * b * Math.cos(rad)).toFixed(4));
}

export function computeCrossProductMagnitude(a: number, b: number, angleDeg: number): number {
  const rad = (angleDeg * Math.PI) / 180;
  return Number(Math.abs(a * b * Math.sin(rad)).toFixed(4));
}

export function compute1DMotion(vi: number, a: number, t: number): { vf: number; dx: number } {
  const vf = vi + a * t;
  const dx = vi * t + 0.5 * a * t * t;
  return {
    vf: Number(vf.toFixed(4)),
    dx: Number(dx.toFixed(4)),
  };
}

export function computeFreeFall(vi: number, t: number, g = 9.8): { vy: number; dy: number } {
  const vy = vi - g * t;
  const dy = vi * t - 0.5 * g * t * t;
  return {
    vy: Number(vy.toFixed(4)),
    dy: Number(dy.toFixed(4)),
  };
}

export interface ProjectileMetrics {
  v0x: number;
  v0y: number;
  timeToPeak: number;
  timeOfFlight: number;
  maxHeight: number;
  range: number;
}

export function computeProjectile(v0: number, angleDeg: number, g = 9.8): ProjectileMetrics {
  const rad = (angleDeg * Math.PI) / 180;
  const v0x = v0 * Math.cos(rad);
  const v0y = v0 * Math.sin(rad);
  const timeToPeak = v0y / g;
  const timeOfFlight = 2 * timeToPeak;
  const maxHeight = (v0y * v0y) / (2 * g);
  const range = v0x * timeOfFlight;
  return {
    v0x: Number(v0x.toFixed(4)),
    v0y: Number(v0y.toFixed(4)),
    timeToPeak: Number(timeToPeak.toFixed(4)),
    timeOfFlight: Number(timeOfFlight.toFixed(4)),
    maxHeight: Number(maxHeight.toFixed(4)),
    range: Number(range.toFixed(4)),
  };
}

export function computeProjectilePointAt(
  v0: number,
  angleDeg: number,
  t: number,
  g = 9.8
): { x: number; y: number; vx: number; vy: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const v0x = v0 * Math.cos(rad);
  const v0y = v0 * Math.sin(rad);
  const x = v0x * t;
  const y = Math.max(0, v0y * t - 0.5 * g * t * t);
  const vy = v0y - g * t;
  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
    vx: Number(v0x.toFixed(4)),
    vy: Number(vy.toFixed(4)),
  };
}

export function computeCircularMotion(radius: number, period: number): {
  speed: number;
  centripetalAcceleration: number;
} {
  if (radius <= 0 || period <= 0) {
    return { speed: 0, centripetalAcceleration: 0 };
  }
  const speed = (2 * Math.PI * radius) / period;
  const centripetalAcceleration = (speed * speed) / radius;
  return {
    speed: Number(speed.toFixed(4)),
    centripetalAcceleration: Number(centripetalAcceleration.toFixed(4)),
  };
}

export function computeNewtonSecond(
  appliedForce: number,
  frictionForce: number,
  mass: number
): { netForce: number; acceleration: number } {
  if (mass <= 0) return { netForce: 0, acceleration: 0 };
  const netForce = Math.max(0, appliedForce - frictionForce);
  const acceleration = netForce / mass;
  return {
    netForce: Number(netForce.toFixed(4)),
    acceleration: Number(acceleration.toFixed(4)),
  };
}

export function computeUniversalGravity(m1: number, m2: number, r: number): number {
  const G = 6.67e-11;
  if (r <= 0) return 0;
  return (G * m1 * m2) / (r * r);
}

export function computeSurfaceGravity(planetMass: number, radius: number): number {
  const G = 6.67e-11;
  if (radius <= 0) return 0;
  return Number(((G * planetMass) / (radius * radius)).toFixed(2));
}

export function getPageSpread(currentPage: number, isSpread: boolean, totalPages: number): number[] {
  const clamped = Math.max(1, Math.min(totalPages, currentPage));
  if (!isSpread || clamped === 1) {
    return [clamped];
  }
  // In an Arabic RTL textbook:
  // Page 1 is the cover (solo).
  // Even pages (2, 4, 6...) are on the right, odd pages (3, 5, 7...) are on the left.
  const rightPage = clamped % 2 === 0 ? clamped : clamped - 1;
  const leftPage = rightPage + 1;
  if (leftPage <= totalPages) {
    return [rightPage, leftPage];
  }
  return [rightPage];
}
