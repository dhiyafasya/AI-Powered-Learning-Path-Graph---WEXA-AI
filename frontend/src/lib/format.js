export const LEVEL_COLORS = {
  beginner: '#10b981',
  intermediate: '#0ea5e9',
  advanced: '#8b5cf6',
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
  'Web Development': '#6366f1',
  'Data Science & ML': '#0ea5e9',
  'Backend Engineering': '#f59e0b',
};
