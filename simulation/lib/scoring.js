// Pure scoring helpers ported from Readora's server/api.js.
// Answer shape: { skill: string, correct: boolean }
// Reading level uses the UNROUNDED ratio (matches Readora behavior).

export const SKILLS = [
  "Literal Understanding",
  "Vocabulary in Context",
  "Main Idea",
  "Inference",
];

const LEVEL_BY_RATIO = (ratio) =>
  ratio < 0.5 ? "Beginner" : ratio < 0.75 ? "Intermediate" : "Advanced";

export function getReadingLevel(percent) {
  if (percent === null || percent === undefined) return "Not Assessed";
  return LEVEL_BY_RATIO(percent / 100);
}

export function getReadingLevelFromRatio(ratio) {
  if (ratio === null || ratio === undefined) return "Not Assessed";
  return LEVEL_BY_RATIO(ratio);
}

export function skillPerformance(answers) {
  const out = Object.fromEntries(
    SKILLS.map((s) => [s, { correct: 0, total: 0, percent: null }]),
  );
  for (const a of answers) {
    if (!out[a.skill]) continue;
    out[a.skill].total += 1;
    out[a.skill].correct += a.correct ? 1 : 0;
  }
  for (const s of Object.values(out)) {
    s.percent = s.total ? Math.round((100 * s.correct) / s.total) : null;
  }
  return out;
}

export function overallPerformance(answers) {
  const total = answers.length;
  const correct = answers.reduce((n, a) => n + (a.correct ? 1 : 0), 0);
  if (!total) return { correct: 0, total: 0, percent: null, ratio: null };
  const ratio = correct / total;
  return { correct, total, percent: Math.round(ratio * 100), ratio };
}

export function getLowestSkill(skillStats) {
  let weakest = null;
  for (const [skill, s] of Object.entries(skillStats)) {
    if (!s.total) continue;
    if (weakest === null || s.correct / s.total < weakest.ratio) {
      weakest = { skill, ratio: s.correct / s.total, percent: s.percent };
    }
  }
  return weakest;
}

export function summarize(answers) {
  const skills = skillPerformance(answers);
  const overall = overallPerformance(answers);
  return {
    skills,
    overall,
    readingLevel:
      overall.ratio === null ? "Not Assessed" : LEVEL_BY_RATIO(overall.ratio),
    weakest: getLowestSkill(skills),
    answered: overall.total,
  };
}
