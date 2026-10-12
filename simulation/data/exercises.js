// Normalized exercise data for the Readoro simulation engine.
// Shape mirrors Readora's server/sourced-content.js exercise objects:
//   { id, title, level, category, description, minutes, source,
//     published, baseline, sections: [{ id, title, questions: [...] }] }
//
// Fields intentionally dropped (simulation does not need them):
//   - section.text
//   - question.prompt / question.options / question.explanation
// Only question.skill and question.correctIndex matter for simulated scoring.
//
// When Readora is forked into Readoro, this file can be replaced with a
// build-time transform reading ../content/passages.json and
// ../server/sourced-content.js. The engine depends only on the shape.
//
// Difficulty VALUE per level is resolved by lib/ability.js:
//   Beginner 0.35 | Intermediate 0.60 | Advanced 0.85

export const EXERCISES = [
  {
    id: "baseline",
    title: "Your reading starting point",
    level: "Intermediate",
    category: "Assessment",
    description:
      "A short, eight-question check across all four skills. Readoro uses this to seed a virtual learner's initial ability profile.",
    minutes: 5,
    source: "Mirrors Readora's baseline assessment (server/sourced-content.js).",
    published: true,
    baseline: true,
    sections: [
      {
        id: "baseline-s1",
        title: "Section 1",
        questions: [
          { id: "baseline-s1-q1", skill: "Literal Understanding", correctIndex: 1 },
          { id: "baseline-s1-q2", skill: "Vocabulary in Context", correctIndex: 2 },
          { id: "baseline-s1-q3", skill: "Main Idea", correctIndex: 0 },
          { id: "baseline-s1-q4", skill: "Inference", correctIndex: 3 },
        ],
      },
      {
        id: "baseline-s2",
        title: "Section 2",
        questions: [
          { id: "baseline-s2-q1", skill: "Literal Understanding", correctIndex: 2 },
          { id: "baseline-s2-q2", skill: "Vocabulary in Context", correctIndex: 0 },
          { id: "baseline-s2-q3", skill: "Main Idea", correctIndex: 1 },
          { id: "baseline-s2-q4", skill: "Inference", correctIndex: 3 },
        ],
      },
    ],
  },
  {
    id: "aesop-hare-tortoise",
    title: "The Hare and the Tortoise",
    level: "Beginner",
    category: "Aesop's fables",
    description: "Steady effort can overcome an advantage in speed.",
    minutes: 3,
    source:
      "Aesop, The Hare and the Tortoise, translated by George Fyler Townsend. Source: https://www.gutenberg.org/ebooks/21.",
    published: true,
    baseline: false,
    sections: [
      {
        id: "aesop-hare-tortoise-s1",
        title: "The Hare and the Tortoise · 1",
        questions: [
          { id: "ht-s1-q1", skill: "Literal Understanding", correctIndex: 2 },
          { id: "ht-s1-q2", skill: "Vocabulary in Context", correctIndex: 0 },
        ],
      },
      {
        id: "aesop-hare-tortoise-s2",
        title: "The Hare and the Tortoise · 2",
        questions: [
          { id: "ht-s2-q1", skill: "Inference", correctIndex: 1 },
          { id: "ht-s2-q2", skill: "Main Idea", correctIndex: 3 },
        ],
      },
    ],
  },
  {
    id: "aesop-lion-mouse",
    title: "The Lion And The Mouse",
    level: "Intermediate",
    category: "Aesop's fables",
    description: "Even someone small can repay kindness with help.",
    minutes: 3,
    source:
      "Aesop, The Lion And The Mouse, translated by George Fyler Townsend. Source: https://www.gutenberg.org/ebooks/21.",
    published: true,
    baseline: false,
    sections: [
      {
        id: "aesop-lion-mouse-s1",
        title: "The Lion And The Mouse · 1",
        questions: [
          { id: "lm-s1-q1", skill: "Literal Understanding", correctIndex: 1 },
          { id: "lm-s1-q2", skill: "Vocabulary in Context", correctIndex: 2 },
          { id: "lm-s1-q3", skill: "Main Idea", correctIndex: 0 },
          { id: "lm-s1-q4", skill: "Inference", correctIndex: 3 },
        ],
      },
      {
        id: "aesop-lion-mouse-s2",
        title: "The Lion And The Mouse · 2",
        questions: [
          { id: "lm-s2-q1", skill: "Literal Understanding", correctIndex: 2 },
          { id: "lm-s2-q2", skill: "Vocabulary in Context", correctIndex: 0 },
          { id: "lm-s2-q3", skill: "Main Idea", correctIndex: 1 },
          { id: "lm-s2-q4", skill: "Inference", correctIndex: 3 },
        ],
      },
    ],
  },
  {
    id: "aesop-crow-pitcher",
    title: "The Crow and the Pitcher",
    level: "Beginner",
    category: "Aesop's fables",
    description: "Necessity is the mother of invention.",
    minutes: 3,
    source:
      "Aesop, The Crow and the Pitcher, translated by George Fyler Townsend. Source: https://www.gutenberg.org/ebooks/21.",
    published: true,
    baseline: false,
    sections: [
      {
        id: "aesop-crow-pitcher-s1",
        title: "The Crow and the Pitcher · 1",
        questions: [
          { id: "cp-s1-q1", skill: "Literal Understanding", correctIndex: 0 },
          { id: "cp-s1-q2", skill: "Vocabulary in Context", correctIndex: 2 },
        ],
      },
      {
        id: "aesop-crow-pitcher-s2",
        title: "The Crow and the Pitcher · 2",
        questions: [
          { id: "cp-s2-q1", skill: "Inference", correctIndex: 1 },
          { id: "cp-s2-q2", skill: "Main Idea", correctIndex: 3 },
        ],
      },
    ],
  },
  {
    id: "aesop-fox-crow",
    title: "The Fox and the Crow",
    level: "Intermediate",
    category: "Aesop's fables",
    description: "Flattery can be used to exploit someone's vanity.",
    minutes: 3,
    source:
      "Aesop, The Fox and the Crow, translated by George Fyler Townsend. Source: https://www.gutenberg.org/ebooks/21.",
    published: true,
    baseline: false,
    sections: [
      {
        id: "aesop-fox-crow-s1",
        title: "The Fox and the Crow · 1",
        questions: [
          { id: "fc-s1-q1", skill: "Literal Understanding", correctIndex: 1 },
          { id: "fc-s1-q2", skill: "Vocabulary in Context", correctIndex: 2 },
        ],
      },
      {
        id: "aesop-fox-crow-s2",
        title: "The Fox and the Crow · 2",
        questions: [
          { id: "fc-s2-q1", skill: "Inference", correctIndex: 0 },
          { id: "fc-s2-q2", skill: "Main Idea", correctIndex: 3 },
        ],
      },
    ],
  },
  {
    id: "aesop-ants-grasshopper",
    title: "The Ants and the Grasshopper",
    level: "Intermediate",
    category: "Aesop's fables",
    description: "Preparing for future needs and neglecting them.",
    minutes: 3,
    source:
      "Aesop, The Ants and the Grasshopper, translated by George Fyler Townsend. Source: https://www.gutenberg.org/ebooks/21.",
    published: true,
    baseline: false,
    sections: [
      {
        id: "aesop-ants-grasshopper-s1",
        title: "The Ants and the Grasshopper · 1",
        questions: [
          { id: "ag-s1-q1", skill: "Literal Understanding", correctIndex: 1 },
          { id: "ag-s1-q2", skill: "Vocabulary in Context", correctIndex: 0 },
        ],
      },
      {
        id: "aesop-ants-grasshopper-s2",
        title: "The Ants and the Grasshopper · 2",
        questions: [
          { id: "ag-s2-q1", skill: "Inference", correctIndex: 2 },
          { id: "ag-s2-q2", skill: "Main Idea", correctIndex: 3 },
        ],
      },
    ],
  },
  {
    id: "aesop-oak-reeds",
    title: "The Oak and the Reeds",
    level: "Advanced",
    category: "Aesop's fables",
    description: "Flexibility can be more effective than rigid resistance.",
    minutes: 3,
    source:
      "Aesop, The Oak and the Reeds, translated by George Fyler Townsend. Source: https://www.gutenberg.org/ebooks/21.",
    published: true,
    baseline: false,
    sections: [
      {
        id: "aesop-oak-reeds-s1",
        title: "The Oak and the Reeds · 1",
        questions: [
          { id: "or-s1-q1", skill: "Literal Understanding", correctIndex: 0 },
          { id: "or-s1-q2", skill: "Inference", correctIndex: 2 },
        ],
      },
      {
        id: "aesop-oak-reeds-s2",
        title: "The Oak and the Reeds · 2",
        questions: [
          { id: "or-s2-q1", skill: "Vocabulary in Context", correctIndex: 1 },
          { id: "or-s2-q2", skill: "Main Idea", correctIndex: 3 },
        ],
      },
    ],
  },
  {
    id: "aesop-north-wind-sun",
    title: "The North Wind and the Sun",
    level: "Advanced",
    category: "Aesop's fables",
    description: "Persuasion is better than Force.",
    minutes: 3,
    source:
      "Aesop, The North Wind and the Sun, translated by George Fyler Townsend. Source: https://www.gutenberg.org/ebooks/21.",
    published: true,
    baseline: false,
    sections: [
      {
        id: "aesop-north-wind-sun-s1",
        title: "The North Wind and the Sun · 1",
        questions: [
          { id: "nw-s1-q1", skill: "Literal Understanding", correctIndex: 2 },
          { id: "nw-s1-q2", skill: "Inference", correctIndex: 0 },
        ],
      },
      {
        id: "aesop-north-wind-sun-s2",
        title: "The North Wind and the Sun · 2",
        questions: [
          { id: "nw-s2-q1", skill: "Vocabulary in Context", correctIndex: 1 },
          { id: "nw-s2-q2", skill: "Main Idea", correctIndex: 3 },
        ],
      },
    ],
  },
];

export const EXERCISES_BY_ID = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

export const ALL_QUESTIONS = EXERCISES.flatMap((e) =>
  e.sections.flatMap((s) =>
    s.questions.map((q) => ({
      exerciseId: e.id,
      exerciseLevel: e.level,
      sectionId: s.id,
      questionId: q.id,
      skill: q.skill,
      correctIndex: q.correctIndex,
    })),
  ),
);

export function exercisesForLevel(level) {
  return EXERCISES.filter((e) => e.level === level);
}

export function exercisesForSkill(skill) {
  return EXERCISES.filter((e) =>
    e.sections.some((s) => s.questions.some((q) => q.skill === skill)),
  );
}

export function questionsForSkill(skill) {
  return ALL_QUESTIONS.filter((q) => q.skill === skill);
}
