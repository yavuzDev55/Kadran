// src/config/colors.js
// Central color config. effectiveColor = task.color ?? TYPE_DEFAULT_COLORS[task.type]

export const TYPE_DEFAULT_COLORS = {
  COURSE:   '#2463a6',
  EXAM:     '#c23b3b',
  HOMEWORK: '#27864b',
  CUSTOM:   '#8a4fb0',
};

// Preset palette exposed via GET /meta/colors. Any 6-digit hex is also accepted, see isValidColor.
export const COLOR_PALETTE = [
  '#2463a6',
  '#c23b3b',
  '#27864b',
  '#8a4fb0',
  '#007c78',
  '#d46a1f',
  '#b12f72',
  '#5d6675',
];

// Custom colors must be 6-digit hex (e.g. "#1a2B3c"). Shorthand ("#fff") and named colors are rejected.
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const isValidColor = (color) =>
  typeof color === 'string' && (COLOR_PALETTE.includes(color.toLowerCase()) || HEX_COLOR.test(color));

// Stored colors are always lowercase so equal colors compare equal.
export const normalizeColor = (color) =>
  typeof color === 'string' ? color.toLowerCase() : color;