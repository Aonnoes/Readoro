import test from 'node:test';
import assert from 'node:assert/strict';
import { runExperiment, runSensitivity } from '../../simulation/experiment.js';
import {
  toCsv, trialCsvRows, summaryCsvRows, sensitivityCsvRows,
  paperReport, buildFigures, resultFiles, fixed, interval,
} from '../../simulation/reporting.js';

const tiny = { trials: 3, learners: 8, activitiesPerLearner: 3, seed: 321 };
const experiment = runExperiment(tiny, { includeLearners: true });
const sensitivity = runSensitivity(tiny, experiment);
const lines = text => text.trim().split('\n');

test('formatters handle gaps and rounding', () => {
  assert.equal(fixed(null), 'N/A');
  assert.equal(fixed(undefined), 'N/A');
  assert.equal(fixed(2.345, 2), '2.35');
  assert.equal(interval(null), 'N/A');
  assert.equal(interval({ mean: 5, low: 4, high: 6 }), '5.0 [4.0–6.0]');
});

test('each CSV has one row per trial, metric or sensitivity case, plus a header', () => {
  assert.equal(lines(toCsv(trialCsvRows(experiment))).length, 1 + tiny.trials);
  assert.equal(lines(toCsv(summaryCsvRows(experiment))).length, 1 + 6);
  assert.equal(lines(toCsv(sensitivityCsvRows(sensitivity))).length, 1 + 10);
  assert.equal(lines(toCsv(experiment.learners)).length, 1 + tiny.trials * tiny.learners * 2);
});

test('trial CSV carries the seed and the paired difference', () => {
  const [row] = trialCsvRows(experiment);
  const trial = experiment.trialResults[0];
  assert.equal(row.seed, 321);
  assert.equal(row.finalDifferencePoints, trial.adaptive.final - trial.fixed.final);
});

test('summary CSV keeps blank cells for metrics that do not exist', () => {
  const idle = runExperiment({ ...tiny, activitiesPerLearner: 0 });
  const practice = summaryCsvRows(idle).find(r => r.metric === 'practice');
  assert.equal(practice.fixedMean, null);
  assert.ok(toCsv([practice]).includes(',,,'));
});

test('learner records keep the column order the paper expects', () => {
  const header = lines(toCsv(experiment.learners))[0].split(',');
  assert.deepEqual(header.slice(0, 6), ['trial', 'seed', 'learnerId', 'strategy', 'baselinePercent', 'baselineLevel']);
  assert.deepEqual(header.slice(-3), ['beginnerActivities', 'intermediateActivities', 'advancedActivities']);
});

test('the paper report quotes the experiment instead of a memory of it', () => {
  const report = paperReport(experiment, sensitivity);
  assert.ok(report.includes(fixed(experiment.summary.comparison.final.adaptive.mean)));
  assert.ok(report.includes('synthetic dataset'));
  assert.ok(report.includes(`across this simulation's ${tiny.trials} trial replicates`));
  assert.ok(report.includes(`Seed sequence: **321–323**`));
  assert.ok(report.includes('Nine one-at-a-time'));
});

test('the paper report follows the data when adaptive loses', () => {
  const flipped = structuredClone(experiment);
  flipped.summary.comparison.final.difference = { mean: -3, low: -4, high: -2, margin: 1, n: 3 };
  const report = paperReport(flipped, sensitivity);
  assert.ok(report.includes('lower final assessment average'));
  assert.ok(report.includes('underperformed'));
  assert.ok(!report.includes('outperformed'));
});

test('the paper report refuses to crown a winner when the interval straddles zero', () => {
  const tied = structuredClone(experiment);
  tied.summary.comparison.final.difference = { mean: 0.4, low: -1, high: 1.8, margin: 1.4, n: 3 };
  assert.ok(paperReport(tied, sensitivity).includes('was not distinguishable from'));
});

test('four well-formed SVG figures come out', () => {
  const figures = buildFigures(experiment, sensitivity);
  assert.deepEqual(Object.keys(figures), ['figure-4-5.svg', 'figure-4-6.svg', 'figure-4-7.svg', 'figure-4-8.svg']);
  for (const svg of Object.values(figures)) {
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
    assert.equal(svg.includes('NaN') || svg.includes('undefined'), false);
  }
});

test('a negative difference never prints as "+-"', () => {
  const flipped = structuredClone(experiment);
  flipped.summary.comparison.final.difference = { mean: -3.2, low: -4, high: -2, margin: 1, n: 3 };
  const svg = buildFigures(flipped, sensitivity)['figure-4-7.svg'];
  assert.ok(svg.includes('Paired difference: -3.2'));
  assert.ok(!svg.includes('+-'));
});

test('the sensitivity figure stretches its axis to fit wild results', () => {
  const wild = structuredClone(sensitivity);
  wild.cases[0].difference = { mean: 25, low: 20, high: 30, margin: 5, n: 3 };
  wild.cases[1].difference = { mean: -18, low: -22, high: -14, margin: 4, n: 3 };
  const svg = buildFigures(experiment, wild)['figure-4-8.svg'];
  assert.ok(svg.includes('>32<') && svg.includes('>-24<'));
});

test('the figures survive an experiment with zero practice activities', () => {
  const idle = runExperiment({ ...tiny, activitiesPerLearner: 0 }, { includeLearners: true });
  assert.doesNotThrow(() => buildFigures(idle, runSensitivity({ ...tiny, activitiesPerLearner: 0 }, idle)));
});

test('resultFiles lists all eleven outputs and insists on learner rows', () => {
  const files = resultFiles(experiment, sensitivity);
  assert.equal(Object.keys(files).length, 11);
  assert.ok(Object.values(files).every(text => typeof text === 'string' && text.length > 0));
  assert.throws(() => resultFiles(runExperiment(tiny), sensitivity), /includeLearners/);
});

test('result files are identical on every run', () => {
  assert.deepEqual(resultFiles(experiment, sensitivity),
    resultFiles(runExperiment(tiny, { includeLearners: true }), runSensitivity(tiny)));
});
