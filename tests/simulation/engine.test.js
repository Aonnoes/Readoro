import test from 'node:test';
import assert from 'node:assert/strict';
import { generateVirtualLearners, runTrial } from '../../simulation/engine.js';
import { SKILLS, DIFFICULTIES } from '../../simulation/lib/config.js';
import { EXERCISES_BY_ID } from '../../simulation/data/exercises.js';

const settings = { learners: 6, activitiesPerLearner: 5, seed: 42 };

test('virtual learner creation is seeded, bounded, and four-skill', () => {
  const a = generateVirtualLearners(settings);
  assert.deepEqual(a, generateVirtualLearners(settings));
  assert.equal(a.length, 6);
  for (const learner of a) {
    assert.deepEqual(Object.keys(learner.abilities), SKILLS);
    for (const ability of Object.values(learner.abilities)) assert.ok(ability >= 0 && ability <= 1);
  }
});

test('running the same trial twice produces identical records', () => {
  assert.deepEqual(runTrial(settings), runTrial(settings));
});

test('each learner has a single common baseline for both scenarios', () => {
  const trial = runTrial(settings);
  for (const learner of trial.learners) {
    assert.equal(learner.baseline.answers.length, 8);
    assert.equal(learner.baseline.difficulty, 'Intermediate');
    for (const scenario of [learner.fixed, learner.adaptive]) {
      assert.equal(scenario.attempts.length, 5);
      assert.equal(scenario.finalAssessment.answers.length, learner.baseline.answers.length);
      assert.equal(scenario.finalAssessment.difficulty, learner.baseline.difficulty);
    }
  }
  assert.equal(trial.summary.fixed.averageBaselinePercent, trial.summary.adaptive.averageBaselinePercent);
});

test('fixed scenario stays fixed while adaptive chooses defined levels', () => {
  for (const learner of runTrial(settings).learners) {
    assert.ok(learner.fixed.attempts.every((a) => a.difficulty === 'Intermediate'));
    assert.ok(learner.adaptive.attempts.every((a) => DIFFICULTIES.includes(a.difficulty)));
    assert.equal(learner.adaptive.attempts[0].difficulty, learner.baseline.readingLevel);
    for (const scenario of [learner.fixed, learner.adaptive]) {
      for (const attempt of scenario.attempts) {
        assert.equal(attempt.total, 4);
        assert.ok(attempt.correct >= 0 && attempt.correct <= attempt.total);
        assert.ok(EXERCISES_BY_ID[attempt.exerciseId] && !EXERCISES_BY_ID[attempt.exerciseId].baseline);
        assert.ok(attempt.answers.every((q) => q.probability >= 0 && q.probability <= 1));
      }
    }
  }
});

test('practice changes only bounded abilities; no learning with rate zero', () => {
  const trial = runTrial({ ...settings, learningRate: 0 });
  for (const learner of trial.learners) {
    assert.deepEqual(learner.fixed.finalAbilities, learner.initialAbilities);
    assert.deepEqual(learner.adaptive.finalAbilities, learner.initialAbilities);
  }
  const withLearning = runTrial(settings);
  for (const learner of withLearning.learners) {
    for (const scenario of [learner.fixed, learner.adaptive]) {
      for (const skill of SKILLS) {
        assert.ok(scenario.finalAbilities[skill] >= learner.initialAbilities[skill]);
        assert.ok(scenario.finalAbilities[skill] <= 1);
      }
    }
  }
});

test('zero training activities still perform baseline and final checks', () => {
  const trial = runTrial({ ...settings, activitiesPerLearner: 0 });
  for (const learner of trial.learners) {
    assert.equal(learner.fixed.attempts.length, 0);
    assert.equal(learner.adaptive.attempts.length, 0);
    assert.deepEqual(learner.fixed.finalAbilities, learner.initialAbilities);
  }
});

test('reported summary equals values computed from learner records', () => {
  const trial = runTrial(settings);
  const average = (arr) => arr.reduce((sum, x) => sum + x, 0) / arr.length;
  for (const strategy of ['fixed', 'adaptive']) {
    assert.equal(trial.summary[strategy].averageFinalPercent,
      average(trial.learners.map((row) => row[strategy].finalAssessment.overall.ratio * 100)));
    assert.equal(trial.summary[strategy].advancedLearners,
      trial.learners.filter((row) => row[strategy].levelAdvanced).length);
  }
});

test('invalid experiment settings fail explicitly', () => {
  assert.throws(() => runTrial({ learners: 0 }), RangeError);
  assert.throws(() => runTrial({ learningRate: -0.1 }), RangeError);
  assert.throws(() => runTrial({ fixedDifficulty: 'Expert' }), RangeError);
  assert.throws(() => runTrial({ baselineQuestions: 100 }), RangeError);
});
