// Number formatting shared by the CLI, the browser, and every report.

export const fixed = (n, decimals = 1) =>
  n === null || n === undefined ? 'N/A' : Number(n).toFixed(decimals);

export const interval = (ci, decimals = 1) =>
  ci ? `${fixed(ci.mean, decimals)} [${fixed(ci.low, decimals)}–${fixed(ci.high, decimals)}]` : 'N/A';
