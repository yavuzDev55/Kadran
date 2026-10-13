// src/utils/filters.js
// Default values and helpers for the shared FilterSidebar.

export const DEFAULT_FILTERS = {
  q: "",
  type: "",
  timeType: "",
  priority: "",
  tags: [],
  showCompleted: true,
  pinnedOnly: false,
  from: "",
  to: "",
};

export const DEFAULT_SECTIONS = {
  search: false,
  type: true,
  timeType: true,
  priority: true,
  tags: true,
  completed: true,
  pinned: true,
  dates: false,
};

/** How many filters differ from the defaults (shown on the mobile toggle). */
export const countActiveFilters = (filters) =>
  [
    filters.q,
    filters.type,
    filters.timeType,
    filters.priority,
    filters.tags.length > 0,
    !filters.showCompleted,
    filters.pinnedOnly,
    filters.from,
    filters.to,
  ].filter(Boolean).length;
