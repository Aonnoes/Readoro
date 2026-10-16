// Aon's math drawer: averages, percentages, and honest error bars.

export const average = values => values.reduce((sum, value) => sum + value, 0) / values.length;

export const percentCorrect = answers =>
  answers.length ? 100 * answers.filter(answer => answer.correct).length / answers.length : null;

export const percentOf = (items, matches) =>
  items.length ? 100 * items.filter(matches).length / items.length : null;

// Two-sided Student-t 0.975 quantiles for 1..30 degrees of freedom.
const T_975 = [null, 12.706205, 4.302653, 3.182446, 2.776445, 2.570582, 2.446912, 2.364624,
  2.306004, 2.262157, 2.228139, 2.200985, 2.178813, 2.160369, 2.144787, 2.131450,
  2.119905, 2.109816, 2.100922, 2.093024, 2.085963, 2.079614, 2.073873, 2.068658,
  2.063899, 2.059539, 2.055529, 2.051831, 2.048407, 2.045230, 2.042272];
const Z_975 = 1.959963984540054;

export function tCritical(df) {
  if (!Number.isInteger(df) || df < 1) throw new RangeError('degrees of freedom must be a positive integer');
  if (df <= 30) return T_975[df];
  // Cornish-Fisher: plenty accurate for rounded 95% intervals past the table.
  const z = Z_975;
  return z + (z ** 3 + z) / (4 * df)
    + (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df ** 2)
    + (3 * z ** 7 + 19 * z ** 5 + 17 * z ** 3 - 15 * z) / (384 * df ** 3);
}

export function confidenceInterval(values) {
  if (!Array.isArray(values) || values.length < 2 || !values.every(Number.isFinite)) {
    throw new RangeError('At least two finite trial-level values are required for a 95% CI');
  }
  const n = values.length;
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1);
  const margin = tCritical(n - 1) * Math.sqrt(variance / n);
  return { mean, low: mean - margin, high: mean + margin, margin, n };
}
