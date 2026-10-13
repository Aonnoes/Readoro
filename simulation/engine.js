// Member 8: Monte Carlo learner engine.
// All abilities and response outcomes are synthetic, not observations of students.
// This module intentionally uses the shared simulation primitives without editing them.
import { mulberry32, randomNormal, pick } from './lib/rng.js';
import { probCorrect, difficultyValue } from './lib/ability.js';
import { DEFAULT_CONFIG, DIFFICULTIES, FIXED_DIFFICULTY, SKILLS } from './lib/config.js';
import { summarize } from './lib/scoring.js';
import { EXERCISES } from './data/exercises.js';

const PRACTICE_QUESTIONS = 4;
const LEVEL_INDEX = Object.fromEntries(DIFFICULTIES.map((level, index) => [level, index]));
const clip = (value) => Math.max(0, Math.min(1, value));
const mean = (numbers) => numbers.reduce((total, value) => total + value, 0) / numbers.length;
const questionsOf = (exercise) => exercise.sections.flatMap((section) => section.questions);

function checkNumber(value, name, low, high, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high || (integer && !Number.isInteger(value))) {
    throw new RangeError(`${name} must be ${integer ? 'an integer' : 'a number'} between ${low} and ${high}`);
  }
}

function configuration(overrides = {}) {
  const options = { ...DEFAULT_CONFIG, ...overrides };
  options.fixedDifficulty ??= FIXED_DIFFICULTY;
  checkNumber(options.learners, 'learners', 1, 10000, true);
  checkNumber(options.activitiesPerLearner, 'activitiesPerLearner', 0, 500, true);
  checkNumber(options.seed, 'seed', 0, 4294967295, true);
  checkNumber(options.baselineQuestions, 'baselineQuestions', 4, 100, true);
  checkNumber(options.initialAbilityMean, 'initialAbilityMean', 0, 1);
  checkNumber(options.initialAbilitySd, 'initialAbilitySd', 0, 1);
  checkNumber(options.learningRate, 'learningRate', 0, 1);
  checkNumber(options.slope, 'slope', 0.001, 100);
  if (!DIFFICULTIES.includes(options.fixedDifficulty)) {
    throw new RangeError('fixedDifficulty must be Beginner, Intermediate, or Advanced');
  }
  const baseline = EXERCISES.find((exercise) => exercise.baseline);
  if (!baseline || options.baselineQuestions > questionsOf(baseline).length) {
    throw new RangeError('baselineQuestions exceeds the available baseline question metadata');
  }
  for (const level of DIFFICULTIES) {
    if (!EXERCISES.some((exercise) => !exercise.baseline && exercise.level === level && questionsOf(exercise).length >= PRACTICE_QUESTIONS)) {
      throw new Error(`No usable ${level} practice exercise is available`);
    }
  }
  return options;
}

// Stable streams separate cohort creation, initial assessment, and each scenario.
function streamSeed(seed, learnerIndex, stream) {
  return (seed ^ Math.imul(learnerIndex + 1, 0x9e3779b1) ^ Math.imul(stream + 1, 0x85ebca6b)) >>> 0;
}

export function generateVirtualLearners(overrides = {}) {
  const options = configuration(overrides);
  const rng = mulberry32(options.seed);
  return Array.from({ length: options.learners }, (_, index) => ({
    id: `L${String(index + 1).padStart(4, '0')}`,
    abilities: Object.fromEntries(SKILLS.map((skill) => [
      skill,
      clip(randomNormal(rng, options.initialAbilityMean, options.initialAbilitySd)),
    ])),
  }));
}

// Sample the same baseline question metadata for each scenario. The initial
// responses are generated ONCE per learner and copied to both scenarios.
function baselineQuestions(rng, count) {
  const baseline = EXERCISES.find((exercise) => exercise.baseline);
  const questions = questionsOf(baseline);
  const selected = SKILLS.map((skill) => pick(rng, questions.filter((q) => q.skill === skill)));
  const remaining = questions.filter((q) => !selected.includes(q));
  while (selected.length < count) {
    const index = Math.floor(rng() * remaining.length);
    selected.push(remaining.splice(index, 1)[0]);
  }
  return selected;
}

function answerQuestions(rng, abilities, questions, level, options, updateAbilities) {
  return questions.map((question) => {
    const abilityBefore = abilities[question.skill];
    const probability = probCorrect(abilityBefore, difficultyValue(level), options.slope);
    const correct = rng() < probability;
    if (updateAbilities && correct) {
      // ASSUMPTION: a correct practice answer increases the practiced skill by
      // a fixed, bounded amount. No practice penalty or spontaneous improvement.
      abilities[question.skill] = clip(abilityBefore + options.learningRate);
    }
    return { questionId: question.id, skill: question.skill, difficulty: level, correct, probability };
  });
}

function chooseExercise(rng, difficulty, focusSkill) {
  const available = EXERCISES.filter((exercise) => !exercise.baseline && exercise.level === difficulty);
  const matching = available.filter((exercise) => questionsOf(exercise).some((q) => q.skill === focusSkill));
  return pick(rng, matching.length ? matching : available);
}

function practiceQuestions(rng, exercise, focusSkill) {
  const all = [...questionsOf(exercise)];
  const focus = all.filter((question) => question.skill === focusSkill);
  const selected = [];
  // A small skill preference, shared by both experimental strategies.
  while (selected.length < 2 && focus.length) {
    const index = Math.floor(rng() * focus.length);
    const [question] = focus.splice(index, 1);
    selected.push(question);
    all.splice(all.indexOf(question), 1);
  }
  while (selected.length < PRACTICE_QUESTIONS) {
    const index = Math.floor(rng() * all.length);
    selected.push(all.splice(index, 1)[0]);
  }
  return selected;
}

function performScenario(learner, baseline, strategy, learnerIndex, options, assessmentQuestions) {
  const rng = mulberry32(streamSeed(options.seed, learnerIndex, strategy === 'fixed' ? 2 : 3));
  const abilities = { ...learner.abilities };
  const trainingHistory = [...baseline.answers];
  const attempts = [];
  for (let activity = 1; activity <= options.activitiesPerLearner; activity++) {
    const progress = summarize(trainingHistory);
    const difficulty = strategy === 'fixed' ? options.fixedDifficulty : progress.readingLevel;
    const focusSkill = progress.weakest?.skill ?? pick(rng, SKILLS);
    const exercise = chooseExercise(rng, difficulty, focusSkill);
    const questions = practiceQuestions(rng, exercise, focusSkill);
    const answers = answerQuestions(rng, abilities, questions, difficulty, options, true);
    trainingHistory.push(...answers);
    const score = summarize(answers);
    attempts.push({
      activity, difficulty, exerciseId: exercise.id, focusSkill,
      correct: score.overall.correct, total: score.overall.total,
      scorePercent: score.overall.percent,
      readingLevelAfter: summarize(trainingHistory).readingLevel,
      answers,
    });
  }
  // Equal-difficulty final assessment for both strategies; no learning update
  // during evaluation. The same question metadata is used as at baseline.
  const finalAnswers = answerQuestions(rng, abilities, assessmentQuestions, 'Intermediate', options, false);
  const finalScores = summarize(finalAnswers);
  const initialMean = mean(SKILLS.map((skill) => learner.abilities[skill]));
  const finalMean = mean(SKILLS.map((skill) => abilities[skill]));
  return {
    strategy,
    attempts,
    finalAbilities: abilities,
    practiceReadingLevel: summarize(trainingHistory).readingLevel,
    finalAssessment: { ...finalScores, answers: finalAnswers, difficulty: 'Intermediate' },
    meanAbilityChange: finalMean - initialMean,
    levelAdvanced: LEVEL_INDEX[finalScores.readingLevel] > LEVEL_INDEX[baseline.readingLevel],
  };
}

function summarizeScenario(rows, strategy) {
  return {
    scenario: strategy,
    learners: rows.length,
    averageBaselinePercent: mean(rows.map((row) => row.baseline.overall.ratio * 100)),
    averageFinalPercent: mean(rows.map((row) => row[strategy].finalAssessment.overall.ratio * 100)),
    averageAbilityChange: mean(rows.map((row) => row[strategy].meanAbilityChange)),
    advancedLearners: rows.filter((row) => row[strategy].levelAdvanced).length,
    levelAdvancementRate: rows.filter((row) => row[strategy].levelAdvanced).length / rows.length,
  };
}

/**
 * Run one paired fixed-versus-adaptive Monte Carlo trial.
 * Returns synthetic learner records and computed comparison metrics. Member 10
 * can call this repeatedly with different seeds for multi-trial experiments.
 * No UI, file writes, or dependency on Readora's runtime.
 */
export function runTrial(overrides = {}) {
  const options = configuration(overrides);
  const learners = generateVirtualLearners(options);
  const rows = learners.map((learner, index) => {
    const baselineRng = mulberry32(streamSeed(options.seed, index, 1));
    const questions = baselineQuestions(baselineRng, options.baselineQuestions);
    const baselineAnswers = answerQuestions(baselineRng, learner.abilities, questions, 'Intermediate', options, false);
    const baseline = { ...summarize(baselineAnswers), answers: baselineAnswers, difficulty: 'Intermediate' };
    return {
      learnerId: learner.id,
      initialAbilities: { ...learner.abilities },
      baseline,
      fixed: performScenario(learner, baseline, 'fixed', index, options, questions),
      adaptive: performScenario(learner, baseline, 'adaptive', index, options, questions),
    };
  });
  const fixed = summarizeScenario(rows, 'fixed');
  const adaptive = summarizeScenario(rows, 'adaptive');
  return {
    config: options,
    learners: rows,
    summary: {
      fixed,
      adaptive,
      adaptiveMinusFixedFinalPercent: adaptive.averageFinalPercent - fixed.averageFinalPercent,
    },
  };
}
