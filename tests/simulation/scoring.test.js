import test from "node:test";
import assert from "node:assert/strict";
import {
  SKILLS,
  getReadingLevel,
  getReadingLevelFromRatio,
  skillPerformance,
  overallPerformance,
  getLowestSkill,
  summarize,
} from "../../simulation/lib/scoring.js";

test("reading level thresholds use unrounded ratio (mirrors Readora)", () => {
  assert.equal(getReadingLevelFromRatio(0.499), "Beginner");
  assert.equal(getReadingLevelFromRatio(0.5), "Intermediate");
  assert.equal(getReadingLevelFromRatio(0.749), "Intermediate");
  assert.equal(getReadingLevelFromRatio(0.75), "Advanced");
  assert.equal(getReadingLevelFromRatio(1.0), "Advanced");
});

test("Readora's 149/200 case stays Intermediate (ratio 0.745)", () => {
  const answers = Array.from({ length: 200 }, (_, i) => ({
    skill: "Inference",
    correct: i < 149,
  }));
  const overall = overallPerformance(answers);
  assert.equal(overall.percent, 75);
  assert.equal(summarize(answers).readingLevel, "Intermediate");
});

test("Readora's 99/200 case stays Beginner (ratio 0.495)", () => {
  const answers = Array.from({ length: 200 }, (_, i) => ({
    skill: "Inference",
    correct: i < 99,
  }));
  assert.equal(summarize(answers).readingLevel, "Beginner");
});

test("Readora's 3/4 case stays Advanced (ratio 0.75)", () => {
  const answers = Array.from({ length: 4 }, (_, i) => ({
    skill: "Inference",
    correct: i < 3,
  }));
  assert.equal(summarize(answers).readingLevel, "Advanced");
});

test("getReadingLevel returns Not Assessed for missing data", () => {
  assert.equal(getReadingLevel(null), "Not Assessed");
  assert.equal(getReadingLevel(undefined), "Not Assessed");
  assert.equal(getReadingLevelFromRatio(null), "Not Assessed");
});

test("skillPerformance counts per skill and leaves unmeasured skills null", () => {
  const stats = skillPerformance([
    { skill: "Literal Understanding", correct: true },
    { skill: "Literal Understanding", correct: false },
    { skill: "Inference", correct: true },
  ]);
  assert.equal(stats["Literal Understanding"].correct, 1);
  assert.equal(stats["Literal Understanding"].total, 2);
  assert.equal(stats["Literal Understanding"].percent, 50);
  assert.equal(stats["Inference"].percent, 100);
  assert.equal(stats["Main Idea"].percent, null);
  assert.equal(stats["Vocabulary in Context"].total, 0);
});

test("overallPerformance returns null percent for no answers", () => {
  const o = overallPerformance([]);
  assert.equal(o.correct, 0);
  assert.equal(o.total, 0);
  assert.equal(o.percent, null);
  assert.equal(o.ratio, null);
});

test("getLowestSkill ignores unmeasured skills and returns null if none", () => {
  assert.equal(getLowestSkill(skillPerformance([])), null);
  const stats = skillPerformance([
    { skill: "Literal Understanding", correct: true },
    { skill: "Inference", correct: false },
  ]);
  const weakest = getLowestSkill(stats);
  assert.equal(weakest.skill, "Inference");
  assert.equal(weakest.percent, 0);
});

test("summarize returns Not Assessed for empty history", () => {
  const s = summarize([]);
  assert.equal(s.readingLevel, "Not Assessed");
  assert.equal(s.overall.percent, null);
  assert.equal(s.weakest, null);
  assert.equal(s.answered, 0);
});

test("SKILLS matches Readora's four comprehension skills", () => {
  assert.deepEqual(SKILLS, [
    "Literal Understanding",
    "Vocabulary in Context",
    "Main Idea",
    "Inference",
  ]);
});
