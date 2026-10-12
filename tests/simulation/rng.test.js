import test from "node:test";
import assert from "node:assert/strict";
import {
  mulberry32,
  randomInt,
  randomFloat,
  randomNormal,
  pick,
} from "../../simulation/lib/rng.js";

test("same seed produces identical sequence", () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 200; i++) assert.equal(a(), b());
});

test("different seeds diverge", () => {
  const a = mulberry32(1);
  const b = mulberry32(2);
  let same = 0;
  for (let i = 0; i < 200; i++) if (a() === b()) same++;
  assert.ok(same < 5);
});

test("mulberry32 output is in [0, 1)", () => {
  const rng = mulberry32(7);
  for (let i = 0; i < 5000; i++) {
    const x = rng();
    assert.ok(x >= 0 && x < 1);
  }
});

test("randomInt stays within inclusive bounds", () => {
  const rng = mulberry32(3);
  for (let i = 0; i < 500; i++) {
    const x = randomInt(rng, 1, 6);
    assert.ok(Number.isInteger(x));
    assert.ok(x >= 1 && x <= 6);
  }
});

test("randomFloat stays within [min, max)", () => {
  const rng = mulberry32(11);
  for (let i = 0; i < 500; i++) {
    const x = randomFloat(rng, -2, 3);
    assert.ok(x >= -2 && x < 3);
  }
});

test("randomNormal approximates requested mean and sd", () => {
  const rng = mulberry32(99);
  const n = 5000;
  const values = Array.from({ length: n }, () => randomNormal(rng, 10, 2));
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  assert.ok(Math.abs(mean - 10) < 0.2);
  assert.ok(Math.abs(sd - 2) < 0.2);
});

test("pick returns an element from the array", () => {
  const rng = mulberry32(5);
  const arr = ["a", "b", "c"];
  for (let i = 0; i < 200; i++) assert.ok(arr.includes(pick(rng, arr)));
});
