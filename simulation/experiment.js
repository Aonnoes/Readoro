/**
 * Readoro multi-trial experiment runner.
 * Reuses the existing Monte Carlo engine without changing its rules.
 * One trial contains a paired fixed/adaptive comparison of the SAME learners.
 * Parameters and results are synthetic, not empirical learner measurements.
 */
import { runTrial } from './engine.js';
import { DEFAULT_CONFIG, FIXED_DIFFICULTY, SKILLS, DIFFICULTIES } from './lib/config.js';

export const DEFAULT_EXPERIMENT = Object.freeze({
  ...DEFAULT_CONFIG,
  fixedDifficulty: FIXED_DIFFICULTY,
});

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

const average = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const pct = answers => answers.length === 0 ? null :
  100 * answers.reduce((count, answer) => count + Number(answer.correct), 0) / answers.length;

// Exact two-sided Student-t 0.975 quantiles for 1..30 degrees of freedom.
const T975 = [null,12.706205,4.302653,3.182446,2.776445,2.570582,2.446912,2.364624,
  2.306004,2.262157,2.228139,2.200985,2.178813,2.160369,2.144787,2.131450,
  2.119905,2.109816,2.100922,2.093024,2.085963,2.079614,2.073873,2.068658,
  2.063899,2.059539,2.055529,2.051831,2.048407,2.045230,2.042272];
function tCritical(df) {
  if (df <= 30) return T975[df];
  // Cornish-Fisher expansion, sufficient precision for reporting rounded 95% intervals.
  const z = 1.959963984540054;
  return z + (z**3 + z) / (4*df) + (5*z**5 + 16*z**3 + 3*z)/(96*df**2)
    + (3*z**7 + 19*z**5 + 17*z**3 - 15*z)/(384*df**3);
}

export function confidenceInterval(values) {
  if (!Array.isArray(values) || values.length < 2 ||
    values.some(value => !Number.isFinite(value))) {
    throw new RangeError('At least two finite trial-level values are required for a 95% CI');
  }
  const n = values.length;
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + (value - mean)**2, 0) / (n - 1);
  const margin = tCritical(n - 1) * Math.sqrt(variance / n);
  return { mean, low: mean - margin, high: mean + margin, margin, n };
}

function assertSettings(config) {
  for (const key of ['trials', 'learners', 'activitiesPerLearner', 'seed']) {
    if (!Number.isSafeInteger(config[key]) || config[key] < 0) throw new RangeError(`${key} must be a nonnegative integer`);
  }
  if (config.trials < 2 || config.trials > 1000) throw new RangeError('trials must be between 2 and 1000');
  if (config.learners < 1 || config.learners > 10000) throw new RangeError('learners must be between 1 and 10000');
  if (config.activitiesPerLearner > 500) throw new RangeError('activitiesPerLearner must be <= 500');
  if (config.seed > 0xffffffff || config.seed + config.trials - 1 > 0xffffffff) {
    throw new RangeError('trial seed range exceeds unsigned 32-bit limit');
  }
}

export function trialMetrics(trial, strategy) {
  const rows = trial.learners;
  const attempts = rows.flatMap(row => row[strategy].attempts);
  const answers = attempts.flatMap(attempt => attempt.answers);
  const perSkill = Object.fromEntries(SKILLS.map(skill => {
    const initial = rows.flatMap(row => row.baseline.answers.filter(a => a.skill === skill));
    const final = rows.flatMap(row => row[strategy].finalAssessment.answers.filter(a => a.skill === skill));
    return [skill, {
      baseline: pct(initial), final: pct(final),
      abilityChange: average(rows.map(row => row[strategy].finalAbilities[skill] - row.initialAbilities[skill])),
    }];
  }));
  const difficulties = Object.fromEntries(DIFFICULTIES.map(level => [level,
    attempts.length ? 100 * attempts.filter(a => a.difficulty === level).length / attempts.length : null]));
  const levels = Object.fromEntries(DIFFICULTIES.map(level => [level, {
    baseline: 100 * rows.filter(row => row.baseline.readingLevel === level).length / rows.length,
    final: 100 * rows.filter(row => row[strategy].finalAssessment.readingLevel === level).length / rows.length,
  }]));
  const activity = Array.from({length: trial.config.activitiesPerLearner}, (_, i) =>
    pct(attempts.filter(a => a.activity === i + 1).flatMap(attempt => attempt.answers)));
  return {
    baseline: average(rows.map(row => 100 * row.baseline.overall.ratio)),
    final: average(rows.map(row => 100 * row[strategy].finalAssessment.overall.ratio)),
    gain: average(rows.map(row => 100 * (row[strategy].finalAssessment.overall.ratio - row.baseline.overall.ratio))),
    practice: pct(answers),
    ability: average(rows.map(row => row[strategy].meanAbilityChange)),
    advancement: 100 * rows.filter(row => row[strategy].levelAdvanced).length / rows.length,
    skills: perSkill, difficulties, levels, activity,
  };
}

function collectLearnerRecords(trial, trialNumber, seed) {
  return trial.learners.flatMap(row => ['fixed', 'adaptive'].map(strategy => {
    const state = row[strategy];
    const practice = state.attempts.flatMap(attempt => attempt.answers);
    return {
      trial: trialNumber, seed, learnerId: row.learnerId, strategy,
      baselinePercent: 100 * row.baseline.overall.ratio,
      baselineLevel: row.baseline.readingLevel,
      finalPercent: 100 * state.finalAssessment.overall.ratio,
      finalLevel: state.finalAssessment.readingLevel,
      gainPoints: 100 * (state.finalAssessment.overall.ratio - row.baseline.overall.ratio),
      levelAdvanced: state.levelAdvanced,
      practiceCorrect: practice.reduce((n, a) => n + Number(a.correct), 0),
      practiceTotal: practice.length, practicePercent: pct(practice),
      meanAbilityChange: state.meanAbilityChange,
      ...Object.fromEntries(SKILLS.flatMap((skill, i) => [
        [`initialSkill${i + 1}`, row.initialAbilities[skill]],
        [`finalSkill${i + 1}`, state.finalAbilities[skill]],
      ])),
      ...Object.fromEntries(DIFFICULTIES.map(level => [`${level.toLowerCase()}Activities`,
        state.attempts.filter(a => a.difficulty === level).length])),
    };
  }));
}

function summarizeTrials(trials) {
  const keyOrder = ['baseline','final','gain','practice','ability','advancement'];
  const comparison = Object.fromEntries(keyOrder.map(key => {
    const left = trials.map(t => t.fixed[key]);
    const right = trials.map(t => t.adaptive[key]);
    if (left.some(x => x === null) || right.some(x => x === null))
      return [key, {fixed:null, adaptive:null, difference:null}];
    return [key, {
      fixed: confidenceInterval(left),
      adaptive: confidenceInterval(right),
      difference: confidenceInterval(trials.map((t, i) => right[i] - left[i])),
    }];
  }));
  const bySkill = Object.fromEntries(SKILLS.map(skill => [skill,
    Object.fromEntries(['baseline','final','abilityChange'].map(metric => [metric, {
      fixed: confidenceInterval(trials.map(t => t.fixed.skills[skill][metric])),
      adaptive: confidenceInterval(trials.map(t => t.adaptive.skills[skill][metric])),
    }]))]));
  const byLevel = Object.fromEntries(DIFFICULTIES.map(level => [level, {
    baseline: confidenceInterval(trials.map(t => t.fixed.levels[level].baseline)),
    fixedFinal: confidenceInterval(trials.map(t => t.fixed.levels[level].final)),
    adaptiveFinal: confidenceInterval(trials.map(t => t.adaptive.levels[level].final)),
  }]));
  const difficulty = Object.fromEntries(['fixed','adaptive'].map(strategy => [strategy,
    Object.fromEntries(DIFFICULTIES.map(level => [level, trials[0][strategy].difficulties[level] === null ? null :
      confidenceInterval(trials.map(t => t[strategy].difficulties[level]))]))]));
  const activity = Array.from({length: trials[0].fixed.activity.length}, (_, i) => ({
    activity: i + 1,
    fixed: confidenceInterval(trials.map(t => t.fixed.activity[i])),
    adaptive: confidenceInterval(trials.map(t => t.adaptive.activity[i])),
  }));
  const differences = trials.map(t => t.adaptive.final - t.fixed.final);
  return {
    comparison, bySkill, byLevel, difficulty, activity,
    adaptiveWins: differences.filter(d => d > 0).length,
    fixedWins: differences.filter(d => d < 0).length,
    ties: differences.filter(d => d === 0).length,
    trialCount: trials.length,
  };
}

/** Run a complete experiment. includeLearners enables a synthetic learner-level CSV. */
export function runExperiment(overrides = {}, { includeLearners = false } = {}) {
  const config = {...DEFAULT_EXPERIMENT, ...overrides};
  assertSettings(config);
  const trialResults = [];
  const learners = includeLearners ? [] : null;
  for (let i = 0; i < config.trials; i++) {
    const seed = config.seed + i;
    const run = runTrial({...config, seed});
    const fixed = trialMetrics(run, 'fixed');
    const adaptive = trialMetrics(run, 'adaptive');
    trialResults.push({trial: i + 1, seed, fixed, adaptive});
    if (includeLearners) learners.push(...collectLearnerRecords(run, i + 1, seed));
  }
  return {config, trialResults, summary: summarizeTrials(trialResults), learners};
}

export function runSensitivity(config = DEFAULT_EXPERIMENT) {
  const base = runExperiment(config);
  const cases = SENSITIVITY_CASES.map(item => {
    const result = runExperiment({...config, ...item.overrides});
    return {
      id: item.id, name: item.name, overrides: item.overrides,
      fixed: result.summary.comparison.final.fixed,
      adaptive: result.summary.comparison.final.adaptive,
      difference: result.summary.comparison.final.difference,
      adaptiveWins: result.summary.adaptiveWins,
      trials: result.config.trials,
    };
  });
  return {config: base.config, base: {
    id:'default',name:'All defaults',overrides:{},
    fixed:base.summary.comparison.final.fixed,
    adaptive:base.summary.comparison.final.adaptive,
    difference:base.summary.comparison.final.difference,
    adaptiveWins:base.summary.adaptiveWins,
    trials:base.config.trials,
  },cases};
}
