import test from "node:test";
import assert from "node:assert/strict";
import {
  EXERCISES,
  EXERCISES_BY_ID,
  ALL_QUESTIONS,
  exercisesForLevel,
  exercisesForSkill,
  questionsForSkill,
} from "../../simulation/data/exercises.js";
import { SKILLS, DIFFICULTIES } from "../../simulation/lib/config.js";

test("every exercise uses a level in the Readora difficulty list", () => {
  for (const e of EXERCISES) {
    assert.ok(DIFFICULTIES.includes(e.level), `${e.id} bad level ${e.level}`);
  }
});

test("exercise shape matches Readora (id, title, level, sections)", () => {
  for (const e of EXERCISES) {
    assert.ok(typeof e.id === "string" && e.id.length);
    assert.ok(typeof e.title === "string" && e.title.length);
    assert.ok(Array.isArray(e.sections) && e.sections.length > 0);
    for (const s of e.sections) {
      assert.ok(typeof s.id === "string" && s.id.length);
      assert.ok(Array.isArray(s.questions) && s.questions.length > 0);
      for (const q of s.questions) {
        assert.ok(typeof q.id === "string");
        assert.ok(SKILLS.includes(q.skill));
        assert.ok(Number.isInteger(q.correctIndex));
        assert.ok(q.correctIndex >= 0 && q.correctIndex <= 3);
      }
    }
  }
});

test("exactly one baseline exercise exists", () => {
  const baselines = EXERCISES.filter((e) => e.baseline);
  assert.equal(baselines.length, 1);
  assert.equal(baselines[0].id, "baseline");
});

test("baseline covers all four comprehension skills", () => {
  const baseline = EXERCISES_BY_ID.baseline;
  assert.ok(baseline);
  const covered = new Set(
    baseline.sections.flatMap((s) => s.questions.map((q) => q.skill)),
  );
  for (const s of SKILLS) assert.ok(covered.has(s), `baseline missing ${s}`);
});

test("exercise ids are unique", () => {
  const ids = EXERCISES.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("question ids are unique across all exercises", () => {
  const ids = ALL_QUESTIONS.map((q) => q.questionId);
  assert.equal(new Set(ids).size, ids.length);
});

test("ALL_QUESTIONS carries exerciseLevel and correctIndex", () => {
  for (const q of ALL_QUESTIONS) {
    assert.ok(DIFFICULTIES.includes(q.exerciseLevel));
    assert.ok(Number.isInteger(q.correctIndex));
  }
});

test("exercisesForLevel filters correctly", () => {
  const advanced = exercisesForLevel("Advanced");
  assert.ok(advanced.length > 0);
  for (const e of advanced) assert.equal(e.level, "Advanced");
});

test("exercisesForSkill and questionsForSkill agree", () => {
  for (const skill of SKILLS) {
    const qs = questionsForSkill(skill);
    assert.ok(qs.length > 0, `no questions for ${skill}`);
    assert.ok(qs.every((q) => q.skill === skill));
    assert.ok(exercisesForSkill(skill).length > 0);
  }
});
