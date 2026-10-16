import test from 'node:test';
import assert from 'node:assert/strict';
import { runExperiment, runSensitivity, trialMetrics, confidenceInterval, SENSITIVITY_CASES } from '../../simulation/experiment.js';
import { runTrial } from '../../simulation/engine.js';
import { average } from '../../simulation/stats.js';
import { SKILLS, DIFFICULTIES } from '../../simulation/lib/config.js';

const tiny = { trials: 3, learners: 8, activitiesPerLearner: 3, seed: 321 };
const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);

test('same settings, same experiment, down to the last decimal', () => {
  const a = runExperiment(tiny);
  assert.deepEqual(a, runExperiment(tiny));
  assert.deepEqual(a.trialResults.map(t => t.seed), [321, 322, 323]);
});

test('trials share a baseline across strategies and the headline difference is paired', () => {
  const e = runExperiment(tiny);
  for (const t of e.trialResults) close(t.fixed.baseline, t.adaptive.baseline);
  close(e.summary.comparison.baseline.difference.mean, 0);
  close(e.summary.comparison.final.difference.mean, average(e.trialResults.map(t => t.adaptive.final - t.fixed.final)));
  assert.equal(e.summary.adaptiveWins + e.summary.fixedWins + e.summary.ties, e.config.trials);
});

test('learner records pair fixed and adaptive rows for the same learner', () => {
  const e = runExperiment(tiny, { includeLearners: true });
  assert.equal(e.learners.length, tiny.trials * tiny.learners * 2);
  for (let i = 0; i < e.learners.length; i += 2) {
    const [fixed, adaptive] = [e.learners[i], e.learners[i + 1]];
    assert.equal(fixed.learnerId, adaptive.learnerId);
    assert.equal(fixed.seed, adaptive.seed);
    assert.equal(fixed.baselinePercent, adaptive.baselinePercent);
    assert.deepEqual([fixed.strategy, adaptive.strategy], ['fixed', 'adaptive']);
    assert.equal(fixed.practiceTotal, 12);
    assert.equal(adaptive.practiceTotal, 12);
  }
});

test('without includeLearners no learner rows are produced', () => {
  assert.equal(runExperiment(tiny).learners, null);
});

test('trial metrics agree with the learner-level rows they summarize', () => {
  const e = runExperiment(tiny, { includeLearners: true });
  for (const [strategy, result] of [['fixed', 'fixed'], ['adaptive', 'adaptive']]) {
    const rows = e.learners.filter(r => r.trial === 1 && r.strategy === strategy);
    const metrics = e.trialResults[0][result];
    close(metrics.final, average(rows.map(r => r.finalPercent)));
    close(metrics.gain, average(rows.map(r => r.gainPoints)));
    close(metrics.ability, average(rows.map(r => r.meanAbilityChange)));
    close(metrics.practice, 100 * rows.reduce((s, r) => s + r.practiceCorrect, 0) / rows.reduce((s, r) => s + r.practiceTotal, 0));
    close(metrics.advancement, 100 * rows.filter(r => r.levelAdvanced).length / rows.length);
  }
});

test('skill, level and difficulty shares are real percentages that add up', () => {
  const run = runTrial({ learners: 8, activitiesPerLearner: 3, seed: 321 });
  for (const strategy of ['fixed', 'adaptive']) {
    const m = trialMetrics(run, strategy);
    for (const skill of SKILLS) assert.ok(m.skills[skill].final >= 0 && m.skills[skill].final <= 100);
    close(DIFFICULTIES.reduce((s, l) => s + m.levels[l].baseline, 0), 100);
    close(DIFFICULTIES.reduce((s, l) => s + m.levels[l].final, 0), 100);
    close(DIFFICULTIES.reduce((s, l) => s + m.difficulties[l], 0), 100);
    assert.equal(m.activity.length, 3);
  }
  assert.equal(trialMetrics(run, 'fixed').difficulties.Intermediate, 100);
});

test('zero practice means null practice stats and exactly zero learning', () => {
  const e = runExperiment({ ...tiny, activitiesPerLearner: 0 });
  assert.equal(e.summary.comparison.practice.fixed, null);
  assert.equal(e.summary.activity.length, 0);
  assert.equal(e.summary.difficulty.fixed.Beginner, null);
  assert.equal(e.summary.comparison.ability.fixed.mean, 0);
  assert.equal(e.summary.comparison.ability.adaptive.mean, 0);
});

test('experiment.js still re-exports the confidence interval it always had', () => {
  close(confidenceInterval([1, 2, 3]).mean, 2);
});

test('sensitivity touches one parameter per case and reuses the seed sequence', () => {
  const s = runSensitivity(tiny);
  assert.equal(s.cases.length, SENSITIVITY_CASES.length);
  assert.ok(s.cases.every(c => Object.keys(c.overrides).length === 1));
  assert.ok(s.cases.every(c => c.trials === tiny.trials));
  assert.ok(Number.isFinite(s.cases.find(c => c.id === 'fixed-beginner').difference.mean));
  assert.equal(s.base.trials, 3);
});

test('handing sensitivity a finished experiment skips the rerun and changes nothing', () => {
  const base = runExperiment(tiny);
  const reused = runSensitivity(tiny, base);
  assert.deepEqual(reused, runSensitivity(tiny));
  assert.equal(reused.base.difference, base.summary.comparison.final.difference);
});

test('learning rate zero means no ability change at all, in either strategy', () => {
  const e = runExperiment({ ...tiny, learningRate: 0 });
  assert.equal(e.summary.comparison.ability.fixed.mean, 0);
  assert.equal(e.summary.comparison.ability.adaptive.mean, 0);
  assert.equal(e.summary.comparison.ability.difference.mean, 0);
});

test('nonsense settings are rejected with a RangeError', () => {
  const bad = [
    { trials: 1 }, { trials: 1001 }, { trials: NaN }, { trials: 2.5 },
    { seed: 0xffffffff }, { seed: -1 },
    { learners: 0 }, { learners: 10001 }, { learners: 1.5 },
    { activitiesPerLearner: -1 }, { activitiesPerLearner: 501 },
  ];
  for (const override of bad) assert.throws(() => runExperiment({ ...tiny, ...override }), RangeError, JSON.stringify(override));
});
