// Member 10's experiment runner: many paired trials in, trial-level stats out.
// Everything here is synthetic. Nobody's actual reading level was harmed.
import { runTrial } from './engine.js';
import { DEFAULT_CONFIG, FIXED_DIFFICULTY, SKILLS, DIFFICULTIES } from './lib/config.js';
import { average, percentCorrect, percentOf, confidenceInterval } from './stats.js';

export { confidenceInterval };

export const DEFAULT_EXPERIMENT = Object.freeze({ ...DEFAULT_CONFIG, fixedDifficulty: FIXED_DIFFICULTY });

export const SENSITIVITY_CASES = Object.freeze([
  { id: 'fixed-beginner', name: 'Fixed Beginner', overrides: { fixedDifficulty: 'Beginner' } },
  { id: 'fixed-advanced', name: 'Fixed Advanced', overrides: { fixedDifficulty: 'Advanced' } },
  { id: 'learning-0', name: 'Learning rate 0', overrides: { learningRate: 0 } },
  { id: 'learning-001', name: 'Learning rate 0.01', overrides: { learningRate: 0.01 } },
  { id: 'learning-004', name: 'Learning rate 0.04', overrides: { learningRate: 0.04 } },
  { id: 'slope-3', name: 'Response slope 3', overrides: { slope: 3 } },
  { id: 'slope-10', name: 'Response slope 10', overrides: { slope: 10 } },
  { id: 'ability-040', name: 'Initial ability mean 0.40', overrides: { initialAbilityMean: 0.40 } },
  { id: 'ability-070', name: 'Initial ability mean 0.70', overrides: { initialAbilityMean: 0.70 } },
]);

const STRATEGIES = ['fixed', 'adaptive'];
const HEADLINE_METRICS = ['baseline', 'final', 'gain', 'practice', 'ability', 'advancement'];
const MAX_SEED = 0xffffffff;

function checkSettings(config) {
  const needInteger = (key, low, high) => {
    const value = config[key];
    if (!Number.isSafeInteger(value) || value < low || value > high) {
      throw new RangeError(`${key} must be an integer between ${low} and ${high}`);
    }
  };
  needInteger('trials', 2, 1000);
  needInteger('learners', 1, 10000);
  needInteger('activitiesPerLearner', 0, 500);
  needInteger('seed', 0, MAX_SEED);
  if (config.seed + config.trials - 1 > MAX_SEED) throw new RangeError('trial seed range exceeds unsigned 32-bit limit');
}

// One trial, one strategy, boiled down to the numbers the paper cares about.
export function trialMetrics(trial, strategy) {
  const rows = trial.learners;
  const runs = rows.map(row => row[strategy]);
  const attempts = runs.flatMap(run => run.attempts);
  const percentOfRatio = assessment => 100 * assessment.overall.ratio;

  const skills = Object.fromEntries(SKILLS.map(skill => [skill, {
    baseline: percentCorrect(rows.flatMap(row => row.baseline.answers).filter(a => a.skill === skill)),
    final: percentCorrect(runs.flatMap(run => run.finalAssessment.answers).filter(a => a.skill === skill)),
    abilityChange: average(rows.map(row => row[strategy].finalAbilities[skill] - row.initialAbilities[skill])),
  }]));

  const difficulties = Object.fromEntries(DIFFICULTIES.map(level =>
    [level, percentOf(attempts, attempt => attempt.difficulty === level)]));

  const levels = Object.fromEntries(DIFFICULTIES.map(level => [level, {
    baseline: percentOf(rows, row => row.baseline.readingLevel === level),
    final: percentOf(runs, run => run.finalAssessment.readingLevel === level),
  }]));

  const activity = Array.from({ length: trial.config.activitiesPerLearner }, (_, i) =>
    percentCorrect(attempts.filter(a => a.activity === i + 1).flatMap(a => a.answers)));

  return {
    baseline: average(rows.map(row => percentOfRatio(row.baseline))),
    final: average(runs.map(run => percentOfRatio(run.finalAssessment))),
    gain: average(rows.map(row => 100 * (row[strategy].finalAssessment.overall.ratio - row.baseline.overall.ratio))),
    practice: percentCorrect(attempts.flatMap(attempt => attempt.answers)),
    ability: average(runs.map(run => run.meanAbilityChange)),
    advancement: percentOf(runs, run => run.levelAdvanced),
    skills, difficulties, levels, activity,
  };
}

// One audit row per learner per strategy, the stuff learner-records.csv is made of.
function learnerRecords(trial, trialNumber, seed) {
  return trial.learners.flatMap(row => STRATEGIES.map(strategy => {
    const run = row[strategy];
    const practice = run.attempts.flatMap(attempt => attempt.answers);
    return {
      trial: trialNumber, seed, learnerId: row.learnerId, strategy,
      baselinePercent: 100 * row.baseline.overall.ratio,
      baselineLevel: row.baseline.readingLevel,
      finalPercent: 100 * run.finalAssessment.overall.ratio,
      finalLevel: run.finalAssessment.readingLevel,
      gainPoints: 100 * (run.finalAssessment.overall.ratio - row.baseline.overall.ratio),
      levelAdvanced: run.levelAdvanced,
      practiceCorrect: practice.filter(answer => answer.correct).length,
      practiceTotal: practice.length,
      practicePercent: percentCorrect(practice),
      meanAbilityChange: run.meanAbilityChange,
      ...Object.fromEntries(SKILLS.flatMap((skill, i) => [
        [`initialSkill${i + 1}`, row.initialAbilities[skill]],
        [`finalSkill${i + 1}`, run.finalAbilities[skill]],
      ])),
      ...Object.fromEntries(DIFFICULTIES.map(level =>
        [`${level.toLowerCase()}Activities`, run.attempts.filter(a => a.difficulty === level).length])),
    };
  }));
}

function summarizeTrials(trials) {
  const ci = pick => confidenceInterval(trials.map(pick));
  const hasGaps = key => trials.some(t => t.fixed[key] === null || t.adaptive[key] === null);

  const comparison = Object.fromEntries(HEADLINE_METRICS.map(key => [key, hasGaps(key)
    ? { fixed: null, adaptive: null, difference: null }
    : {
      fixed: ci(t => t.fixed[key]),
      adaptive: ci(t => t.adaptive[key]),
      difference: ci(t => t.adaptive[key] - t.fixed[key]),
    }]));

  const bySkill = Object.fromEntries(SKILLS.map(skill => [skill,
    Object.fromEntries(['baseline', 'final', 'abilityChange'].map(metric => [metric, {
      fixed: ci(t => t.fixed.skills[skill][metric]),
      adaptive: ci(t => t.adaptive.skills[skill][metric]),
    }]))]));

  const byLevel = Object.fromEntries(DIFFICULTIES.map(level => [level, {
    baseline: ci(t => t.fixed.levels[level].baseline),
    fixedFinal: ci(t => t.fixed.levels[level].final),
    adaptiveFinal: ci(t => t.adaptive.levels[level].final),
  }]));

  const difficulty = Object.fromEntries(STRATEGIES.map(strategy => [strategy,
    Object.fromEntries(DIFFICULTIES.map(level => [level,
      trials[0][strategy].difficulties[level] === null ? null : ci(t => t[strategy].difficulties[level])]))]));

  const activity = trials[0].fixed.activity.map((_, i) => ({
    activity: i + 1,
    fixed: ci(t => t.fixed.activity[i]),
    adaptive: ci(t => t.adaptive.activity[i]),
  }));

  const gaps = trials.map(t => t.adaptive.final - t.fixed.final);
  return {
    comparison, bySkill, byLevel, difficulty, activity,
    adaptiveWins: gaps.filter(gap => gap > 0).length,
    fixedWins: gaps.filter(gap => gap < 0).length,
    ties: gaps.filter(gap => gap === 0).length,
    trialCount: trials.length,
  };
}

/** Runs every trial on consecutive seeds. includeLearners adds the per-learner audit rows. */
export function runExperiment(overrides = {}, { includeLearners = false } = {}) {
  const config = { ...DEFAULT_EXPERIMENT, ...overrides };
  checkSettings(config);

  const trialResults = [];
  const learners = includeLearners ? [] : null;
  for (let i = 0; i < config.trials; i++) {
    const seed = config.seed + i;
    const trial = runTrial({ ...config, seed });
    trialResults.push({
      trial: i + 1, seed,
      fixed: trialMetrics(trial, 'fixed'),
      adaptive: trialMetrics(trial, 'adaptive'),
    });
    if (includeLearners) learners.push(...learnerRecords(trial, i + 1, seed));
  }
  return { config, trialResults, summary: summarizeTrials(trialResults), learners };
}

const sensitivityRow = (id, name, overrides, result) => {
  const { fixed, adaptive, difference } = result.summary.comparison.final;
  return {
    id, name, overrides, fixed, adaptive, difference,
    adaptiveWins: result.summary.adaptiveWins,
    trials: result.config.trials,
  };
};

/** One-at-a-time sensitivity. Pass an experiment you already ran as `base` to skip re-running it. */
export function runSensitivity(config = DEFAULT_EXPERIMENT, base = runExperiment(config)) {
  const cases = SENSITIVITY_CASES.map(({ id, name, overrides }) =>
    sensitivityRow(id, name, overrides, runExperiment({ ...config, ...overrides })));
  return { config: base.config, base: sensitivityRow('default', 'All defaults', {}, base), cases };
}
