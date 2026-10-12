// Deterministic seeded RNG for reproducible Monte Carlo trials.
// mulberry32 by Tommy Ettinger (public domain).

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function randomFloat(rng, min, max) {
  return min + rng() * (max - min);
}

export function randomNormal(rng, mean = 0, sd = 1) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + sd * z;
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
