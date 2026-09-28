// src/config/limits.js
// v3: sanity-check thresholds for TIMED and DATE_RANGE tasks.
// Overridable via .env (see .env.example).

export const MAX_TIMED_HOURS_WARNING = Number(process.env.MAX_TIMED_HOURS_WARNING) || 24;
export const MAX_RANGE_DAYS_WARNING = Number(process.env.MAX_RANGE_DAYS_WARNING) || 30;
export const MAX_RANGE_DAYS_HARD = Number(process.env.MAX_RANGE_DAYS_HARD) || 365;