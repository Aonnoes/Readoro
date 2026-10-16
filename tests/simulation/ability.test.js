import test from 'node:test';
import assert from 'node:assert/strict';
import { probCorrect, difficultyValue, sampleResponse } from '../../simulation/lib/ability.js';
import { mulberry32 } from '../../simulation/lib/rng.js';
import { DIFFICULTIES } from '../../simulation/lib/config.js';

const close = (actual, expected, tolerance = 1e-12) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);

test('a learner exactly at the difficulty is a coin flip', () => {
  for (const level of DIFFICULTIES) close(probCorrect(difficultyValue(level), difficultyValue(level)), 0.5);
});

test('matches the textbook logistic value', () => {
  close(probCorrect(0.55, 0.6, 6), 1 / (1 + Math.exp(0.3)));
  close(probCorrect(0.9, 0.35, 6), 1 / (1 + Math.exp(-3.3)));
});

test('smarter learners do better, harder questions do worse', () => {
  const abilities = [0, 0.2, 0.4, 0.6, 0.8, 1];
  for (let i = 1; i < abilities.length; i++) {
    assert.ok(probCorrect(abilities[i], 0.6) > probCorrect(abilities[i - 1], 0.6));
    assert.ok(probCorrect(0.6, abilities[i]) < probCorrect(0.6, abilities[i - 1]));
  }
});

test('probabilities stay strictly inside (0, 1) over the whole ability range', () => {
  for (const level of DIFFICULTIES) {
    for (let ability = 0; ability <= 1; ability += 0.05) {
      const p = probCorrect(ability, difficultyValue(level));
      assert.ok(p > 0 && p < 1, `p=${p} at ability ${ability}, ${level}`);
    }
  }
});

test('ability above difficulty and difficulty above ability mirror each other', () => {
  close(probCorrect(0.8, 0.6) + probCorrect(0.6, 0.8), 1);
});

test('a steeper slope sharpens the response curve in both directions', () => {
  assert.ok(probCorrect(0.8, 0.6, 10) > probCorrect(0.8, 0.6, 3));
  assert.ok(probCorrect(0.4, 0.6, 10) < probCorrect(0.4, 0.6, 3));
  close(probCorrect(0.9, 0.1, 0), 0.5);
});

test('difficulty labels map to the documented numbers', () => {
  assert.equal(difficultyValue('Beginner'), 0.35);
  assert.equal(difficultyValue('Intermediate'), 0.6);
  assert.equal(difficultyValue('Advanced'), 0.85);
  assert.equal(difficultyValue('Nonsense'), 0.5);
});

test('sampled responses land on the stated probability', () => {
  const rng = mulberry32(2024);
  const draws = 20000;
  for (const [ability, level] of [[0.4, 'Intermediate'], [0.55, 'Beginner'], [0.7, 'Advanced']]) {
    let correct = 0;
    for (let i = 0; i < draws; i++) correct += sampleResponse(rng, ability, level) ? 1 : 0;
    close(correct / draws, probCorrect(ability, difficultyValue(level)), 0.02);
  }
});
