import test from 'node:test';
import assert from 'node:assert/strict';
import { average, percentCorrect, percentOf, tCritical, confidenceInterval } from '../../simulation/stats.js';

const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);

test('average, percentCorrect and percentOf do basic arithmetic correctly', () => {
  assert.equal(average([2, 4, 9]), 5);
  assert.equal(percentCorrect([{ correct: true }, { correct: false }, { correct: true }, { correct: true }]), 75);
  assert.equal(percentOf([1, 2, 3, 4], n => n > 3), 25);
});

test('percentages of nothing are null, never NaN or a made-up zero', () => {
  assert.equal(percentCorrect([]), null);
  assert.equal(percentOf([], () => true), null);
});

test('t critical values match published tables', () => {
  close(tCritical(1), 12.706205, 1e-6);
  close(tCritical(19), 2.093024, 1e-6);
  close(tCritical(30), 2.042272, 1e-6);
});

test('past the table, the expansion stays within rounding distance of the truth', () => {
  close(tCritical(31), 2.039513, 1e-4);
  close(tCritical(60), 2.000298, 1e-4);
  close(tCritical(120), 1.979930, 1e-4);
  assert.ok(tCritical(100000) > 1.959963 && tCritical(100000) < 1.96);
});

test('t critical values shrink as degrees of freedom grow', () => {
  for (let df = 2; df <= 200; df++) assert.ok(tCritical(df) < tCritical(df - 1), `df ${df}`);
});

test('bad degrees of freedom are rejected', () => {
  for (const df of [0, -3, 2.5, NaN]) assert.throws(() => tCritical(df), RangeError);
});

test('confidence interval for [1, 2, 3] is the hand-computed one', () => {
  const ci = confidenceInterval([1, 2, 3]);
  close(ci.mean, 2);
  close(ci.margin, 4.302653 / Math.sqrt(3));
  close(ci.low, 2 - ci.margin);
  close(ci.high, 2 + ci.margin);
  assert.equal(ci.n, 3);
});

test('identical values give a zero-width interval', () => {
  const ci = confidenceInterval([5, 5, 5, 5]);
  assert.equal(ci.margin, 0);
  assert.equal(ci.low, ci.high);
});

test('twenty trials use df = 19', () => {
  const values = Array.from({ length: 20 }, (_, i) => i);
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - 9.5) ** 2, 0) / 19);
  close(confidenceInterval(values).margin, 2.093024 * sd / Math.sqrt(20), 1e-9);
});

test('too little or unclean data is refused', () => {
  assert.throws(() => confidenceInterval([3]), RangeError);
  assert.throws(() => confidenceInterval([]), RangeError);
  assert.throws(() => confidenceInterval([1, NaN]), RangeError);
  assert.throws(() => confidenceInterval([1, Infinity]), RangeError);
  assert.throws(() => confidenceInterval('12'), RangeError);
});
