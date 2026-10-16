// The "does the engine actually do what it says" suite: replays every learner's story from the records.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runTrial } from '../../simulation/engine.js';
import { probCorrect, difficultyValue } from '../../simulation/lib/ability.js';
import { summarize } from '../../simulation/lib/scoring.js';
import { SKILLS, DIFFICULTIES } from '../../simulation/lib/config.js';

const settings = { learners: 30, activitiesPerLearner: 8, seed: 7 };
const trial = runTrial(settings);
const { slope, learningRate } = trial.config;

const close = (actual, expected, tolerance = 1e-12) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);
const levelRank = level => DIFFICULTIES.indexOf(level);

test('every recorded probability is the logistic of the ability the learner had at that moment', () => {
  for (const learner of trial.learners) {
    for (const answer of learner.baseline.answers) {
      close(answer.probability, probCorrect(learner.initialAbilities[answer.skill], difficultyValue('Intermediate'), slope));
    }
    for (const strategy of ['fixed', 'adaptive']) {
      const abilities = { ...learner.initialAbilities };
      for (const answer of learner[strategy].attempts.flatMap(attempt => attempt.answers)) {
        close(answer.probability, probCorrect(abilities[answer.skill], difficultyValue(answer.difficulty), slope));
        if (answer.correct) abilities[answer.skill] = Math.min(1, abilities[answer.skill] + learningRate);
      }
      for (const skill of SKILLS) close(abilities[skill], learner[strategy].finalAbilities[skill]);
      for (const answer of learner[strategy].finalAssessment.answers) {
        close(answer.probability, probCorrect(abilities[answer.skill], difficultyValue('Intermediate'), slope));
      }
    }
  }
});

test('predicted probabilities and actual correct rates agree across thousands of answers', () => {
  const answers = trial.learners.flatMap(l => [l.fixed, l.adaptive]).flatMap(run => run.attempts.flatMap(a => a.answers));
  const predicted = answers.reduce((sum, a) => sum + a.probability, 0) / answers.length;
  const observed = answers.filter(a => a.correct).length / answers.length;
  assert.ok(Math.abs(predicted - observed) < 0.03, `predicted ${predicted}, observed ${observed}`);
});

test('adaptive difficulty always equals the reading level earned so far', () => {
  for (const learner of trial.learners) {
    const history = [...learner.baseline.answers];
    for (const attempt of learner.adaptive.attempts) {
      assert.equal(attempt.difficulty, summarize(history).readingLevel);
      assert.equal(attempt.focusSkill, summarize(history).weakest.skill);
      history.push(...attempt.answers);
      assert.equal(attempt.readingLevelAfter, summarize(history).readingLevel);
    }
  }
});

test('adaptive really adapts: it hands out more than one difficulty, fixed never budges', () => {
  const used = strategy => new Set(trial.learners.flatMap(l => l[strategy].attempts.map(a => a.difficulty)));
  assert.ok(used('adaptive').size > 1);
  assert.deepEqual([...used('fixed')], ['Intermediate']);
});

test('fixed difficulty obeys whichever level it is told to use', () => {
  for (const level of DIFFICULTIES) {
    const run = runTrial({ ...settings, learners: 5, fixedDifficulty: level });
    assert.ok(run.learners.every(l => l.fixed.attempts.every(a => a.difficulty === level)));
  }
});

test('level progression flags and labels are consistent with the records', () => {
  for (const learner of trial.learners) {
    for (const strategy of ['fixed', 'adaptive']) {
      const run = learner[strategy];
      const advanced = levelRank(run.finalAssessment.readingLevel) > levelRank(learner.baseline.readingLevel);
      assert.equal(run.levelAdvanced, advanced);
      const lastAttempt = run.attempts.at(-1);
      assert.equal(run.practiceReadingLevel, lastAttempt.readingLevelAfter);
    }
  }
});

test('with no practice, adaptive and fixed learners stay exactly where they started', () => {
  const idle = runTrial({ ...settings, activitiesPerLearner: 0 });
  for (const learner of idle.learners) {
    for (const strategy of ['fixed', 'adaptive']) {
      assert.equal(learner[strategy].practiceReadingLevel, learner.baseline.readingLevel);
      assert.equal(learner[strategy].meanAbilityChange, 0);
    }
  }
});

test('abilities never leave [0, 1], even with a ridiculous learning rate', () => {
  const eager = runTrial({ ...settings, learningRate: 1, learners: 10 });
  for (const learner of eager.learners) {
    for (const strategy of ['fixed', 'adaptive']) {
      for (const skill of SKILLS) {
        const ability = learner[strategy].finalAbilities[skill];
        assert.ok(ability >= 0 && ability <= 1);
      }
    }
  }
});
