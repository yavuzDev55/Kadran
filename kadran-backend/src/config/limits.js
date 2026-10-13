// src/config/limits.js
// Sanity-check thresholds for TIMED and MULTI_DAY tasks.
// Overridable via .env (see .env.example).

export const MAX_TIMED_HOURS_WARNING = Number(process.env.MAX_TIMED_HOURS_WARNING) || 24;
export const MAX_RANGE_DAYS_WARNING = Number(process.env.MAX_RANGE_DAYS_WARNING) || 30;
export const MAX_RANGE_DAYS_HARD = Number(process.env.MAX_RANGE_DAYS_HARD) || 365;
// GET /tasks paging: default page size and the largest page a client may ask for.
export const DEFAULT_LIST_LIMIT = 50;
export const MAX_LIST_LIMIT = Number(process.env.MAX_LIST_LIMIT) || 500;
