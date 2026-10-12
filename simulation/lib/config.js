// Central constants for the Readoro simulation.
// SYSTEM-DEFINED values are copied verbatim from Readora.
// ASSUMED values are simulation parameters.

export const SKILLS = [
  "Literal Understanding",
  "Vocabulary in Context",
  "Main Idea",
  "Inference",
];

export const READING_LEVELS = ["Beginner", "Intermediate", "Advanced"];

export const READING_LEVEL_THRESHOLDS = {
  Beginner: [0, 50],
  Intermediate: [50, 75],
  Advanced: [75, 100],
};

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

// ASSUMED: numeric difficulty value per label (0..1).
export const DIFFICULTY_LEVELS = {
  Beginner: 0.35,
  Intermediate: 0.6,
  Advanced: 0.85,
};

// ASSUMED: default simulation configuration.
export const DEFAULT_CONFIG = {
  learners: 100,
  activitiesPerLearner: 10,
  trials: 20,
  seed: 12345,
  baselineQuestions: 8,
  learningRate: 0.02,
  slope: 6,
  initialAbilityMean: 0.55,
  initialAbilitySd: 0.15,
};

// ASSUMED: the fixed difficulty used by Scenario A.
export const FIXED_DIFFICULTY = "Intermediate";
