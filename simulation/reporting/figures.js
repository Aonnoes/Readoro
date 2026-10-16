// Hand-rolled SVG figures. No chart library, just arithmetic and strong opinions about whitespace.
import { DIFFICULTIES } from '../lib/config.js';

const COLORS = { ink: '#14213D', muted: '#6F7988', grid: '#DDE4EB', fixed: '#CF755D', adaptive: '#437D8D' };
const LEVEL_COLORS = ['#D1AB75', '#84A8B1', '#64886A'];
const FONT = 'font-family="Arial,sans-serif"';

const escapeXml = value => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const line = (x1, y1, x2, y2, color = COLORS.grid, width = 1) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
const label = (x, y, text, size = 15, color = COLORS.ink, anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" ${FONT} font-size="${size}" fill="${color}">${escapeXml(text)}</text>`;
const rect = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}"/>`;
const circle = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const whisker = (x, low, high, color, cap = 16, width = 2) =>
  line(x, high, x, low, color, width) + line(x - cap, high, x + cap, high, color, width) + line(x - cap, low, x + cap, low, color, width);

function frame(title, subtitle, body, height = 540) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${height}" viewBox="0 0 1000 ${height}"><rect width="1000" height="${height}" fill="#FFFFFF"/>`
    + `<text x="52" y="61" fill="${COLORS.ink}" ${FONT} font-size="26" font-weight="700">${escapeXml(title)}</text>`
    + `<text x="52" y="91" fill="${COLORS.muted}" ${FONT} font-size="15">${escapeXml(subtitle)}</text>`
    + body
    + `<text x="52" y="${height - 21}" ${FONT} font-size="12" fill="${COLORS.muted}">Source: Readoro synthetic Monte Carlo experiment · trial-level 95% confidence intervals</text></svg>`;
}

function practiceAccuracy({ activity }) {
  const left = 105, right = 918, bottom = 410, top = 145;
  const x = i => left + i * (right - left) / Math.max(1, activity.length - 1);
  const y = percent => bottom - percent * (bottom - top) / 100;

  let body = '';
  for (let v = 0; v <= 100; v += 20) body += line(left, y(v), right, y(v)) + label(76, y(v) + 5, `${v}%`, 14, COLORS.muted, 'end');
  activity.forEach((a, i) => { body += label(x(i), bottom + 30, String(a.activity), 13, COLORS.muted); });

  for (const strategy of ['fixed', 'adaptive']) {
    const color = COLORS[strategy];
    const upper = activity.map((a, i) => `${x(i)},${y(a[strategy].high)}`);
    const lower = activity.map((a, i) => `${x(i)},${y(a[strategy].low)}`).reverse();
    body += `<polygon points="${upper.concat(lower).join(' ')}" fill="${color}" opacity="0.16"/>`;
    body += `<polyline points="${activity.map((a, i) => `${x(i)},${y(a[strategy].mean)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>`;
    activity.forEach((a, i) => { body += circle(x(i), y(a[strategy].mean), 4, color); });
  }
  body += label(505, 480, 'Practice activity', 15);
  body += rect(580, 108, 16, 10, COLORS.fixed) + label(605, 119, 'Fixed', 14, COLORS.ink, 'start');
  body += rect(699, 108, 16, 10, COLORS.adaptive) + label(724, 119, 'Adaptive', 14, COLORS.ink, 'start');
  return frame('Practice accuracy across activities',
    'Mean percentage correct per activity · shaded bands indicate 95% trial-level CI', body);
}

function levelDistribution({ byLevel }) {
  const rows = [
    ['Baseline', DIFFICULTIES.map(level => byLevel[level].baseline.mean)],
    ['Fixed final', DIFFICULTIES.map(level => byLevel[level].fixedFinal.mean)],
    ['Adaptive final', DIFFICULTIES.map(level => byLevel[level].adaptiveFinal.mean)],
  ];
  const px = 6.7;
  let body = '';
  for (let pct = 0; pct <= 100; pct += 20) {
    const x = 205 + pct * px;
    body += line(x, 142, x, 395) + label(x, 421, `${pct}%`, 13, COLORS.muted);
  }
  rows.forEach(([name, shares], j) => {
    const y = 171 + j * 87;
    body += label(172, y + 22, name, 17, COLORS.ink, 'end');
    let offset = 0;
    shares.forEach((share, k) => {
      const width = share * px;
      body += rect(205 + offset * px, y, width, 48, LEVEL_COLORS[k]);
      if (width > 43) body += label(205 + (offset + share / 2) * px, y + 30, `${share.toFixed(1)}%`, 14, '#FFFFFF');
      offset += share;
    });
  });
  DIFFICULTIES.forEach((level, k) => {
    body += rect(275 + k * 225, 470, 17, 12, LEVEL_COLORS[k]) + label(299 + k * 225, 482, level, 14, COLORS.ink, 'start');
  });
  return frame('Reading level distribution',
    'Share of synthetic learners classified Beginner, Intermediate, or Advanced', body, 550);
}

function finalScores({ comparison }) {
  const y = percent => 425 - percent * 2.75;
  let body = '';
  for (let v = 0; v <= 100; v += 20) body += line(115, y(v), 920, y(v)) + label(95, y(v) + 5, `${v}%`, 14, COLORS.muted, 'end');

  [['Fixed', comparison.final.fixed, COLORS.fixed], ['Adaptive', comparison.final.adaptive, COLORS.adaptive]]
    .forEach(([name, ci, color], i) => {
      const x = 350 + i * 320;
      body += rect(x - 72, y(ci.mean), 144, 425 - y(ci.mean), color);
      body += whisker(x, y(ci.low), y(ci.high), COLORS.ink);
      body += label(x, y(ci.mean) - 22, `${ci.mean.toFixed(1)}%`, 22) + label(x, 456, name, 18);
    });

  const d = comparison.final.difference;
  const sign = d.mean >= 0 ? '+' : '';
  body += label(500, 510, `Paired difference: ${sign}${d.mean.toFixed(1)} percentage points [${d.low.toFixed(1)}, ${d.high.toFixed(1)}]`, 16);
  return frame('Final assessment scores by strategy',
    'Fixed Intermediate compared with adaptive difficulty · 95% confidence intervals', body, 565);
}

function sensitivityRange(rows) {
  const low = Math.min(0, ...rows.map(r => r.difference.low));
  const high = Math.max(0, ...rows.map(r => r.difference.high));
  return { min: Math.floor(low / 4) * 4, max: Math.ceil(high / 4) * 4 };
}

function sensitivity(sens) {
  const rows = [sens.base, ...sens.cases];
  const { min, max } = sensitivityRange(rows);
  const left = 345, right = 918;
  const x = v => left + (v - min) * (right - left) / (max - min);

  let body = '';
  for (let v = min; v <= max; v += 4) {
    body += line(x(v), 139, x(v), 540, v === 0 ? '#707A84' : COLORS.grid, v === 0 ? 2 : 1) + label(x(v), 566, String(v), 13, COLORS.muted);
  }
  rows.forEach((r, i) => {
    const y = 163 + i * 40;
    const { low, mean, high } = r.difference;
    body += label(322, y + 6, r.name, 14, COLORS.ink, 'end');
    body += line(x(low), y, x(high), y, COLORS.adaptive, 3);
    body += line(x(low), y - 5, x(low), y + 5, COLORS.adaptive, 2) + line(x(high), y - 5, x(high), y + 5, COLORS.adaptive, 2);
    body += circle(x(mean), y, 5, COLORS.adaptive);
  });
  body += label(630, 600, 'Adaptive minus fixed final score (percentage points)', 15);
  return frame('Sensitivity to model assumptions',
    'One parameter changed at a time · dot: paired trial mean; whisker: 95% CI', body, 650);
}

export function buildFigures(exp, sens) {
  return {
    'figure-4-5.svg': practiceAccuracy(exp.summary),
    'figure-4-6.svg': levelDistribution(exp.summary),
    'figure-4-7.svg': finalScores(exp.summary),
    'figure-4-8.svg': sensitivity(sens),
  };
}
