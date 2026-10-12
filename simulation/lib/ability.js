// Logistic response-probability model for virtual learners.
// P(correct) = 1 / (1 + exp(-slope * (ability - difficulty)))
// These are ASSUMED model parameters, not empirical findings.

import { DIFFICULTY_LEVELS } from "./config.js";

export function probCorrect(ability, difficulty, slope = 6) {
  return 1 / (1 + Math.exp(-slope * (ability - difficulty)));
}

export function difficultyValue(label) {
  return DIFFICULTY_LEVELS[label] ?? 0.5;
}

export function sampleResponse(rng, ability, difficultyLabel, slope = 6) {
  const p = probCorrect(ability, difficultyValue(difficultyLabel), slope);
  return rng() < p;
}
