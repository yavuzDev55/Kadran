// src/config/colors.js
// Central color config. effectiveColor = task.color ?? TYPE_DEFAULT_COLORS[task.type]

export const TYPE_DEFAULT_COLORS = {
  COURSE:   '#3b82f6', // blue-500
  EXAM:     '#ef4444', // red-500
  HOMEWORK: '#22c55e', // green-500
  CUSTOM:   '#94a3b8', // slate-400
};

// Preset palette exposed via GET /meta/colors and validated on create/update.
export const COLOR_PALETTE = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#94a3b8', // slate
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#64748b', // slate-dark
  '#06b6d4', // cyan
  '#a3e635', // lime
];

export const isValidColor = (color) => COLOR_PALETTE.includes(color);