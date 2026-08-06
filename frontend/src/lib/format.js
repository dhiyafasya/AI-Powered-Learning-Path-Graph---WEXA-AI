export const LEVEL_COLORS = {
  beginner: '#10b981',
  intermediate: '#0ea5e9',
  advanced: '#0f172a',
};

export function levelColor(level) {
  return LEVEL_COLORS[level] || '#94a3b8';
}

export function formatHours(hours) {
  if (hours == null) return '—';
  return `${hours}h`;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export const CATEGORY_COLORS = {
  'Web Development': '#052F4A',
  'Data Science & ML': '#4D0218',
  'Backend Engineering': '#0284c7',
};

export const CATEGORY_TINTS = {
  'Web Development': '#e6eef4',
  'Data Science & ML': '#f9e8ec',
  'Backend Engineering': '#e0f2fe',
};

export function pathTone(icon) {
  if (icon === 'code') return 'web';
  if (icon === 'chart-line') return 'data';
  return 'backend';
}

export function categoryTone(category) {
  if (category === 'Web Development') return 'web';
  if (category === 'Data Science & ML') return 'data';
  if (category === 'Backend Engineering') return 'backend';
  return '';
}
