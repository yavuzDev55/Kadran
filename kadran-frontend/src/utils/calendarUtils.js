// src/utils/calendarUtils.js
// Turns backend tasks into what the calendar draws. Every occurrence of a recurring task is a
// real task, so there is no recurrence expansion here any more.
//
//   TIMED       block from start to end
//   OPEN_ENDED  small marker at its start time (no duration)
//   DEADLINE    small marker at its due time
//   MULTI_DAY   a bar across whole days (one day long = a one-column bar)
//   ANY_TIME    never drawn

import { diffDays, sliceDate, timeToMinutes } from './dateUtils.js';

// Height of a marker (OPEN_ENDED / DEADLINE) when events are laid out side by side
export const MARKER_MINUTES = 30;

const baseEvent = (task, date) => ({
  id: String(task.id),
  taskId: task.id,
  seriesId: task.seriesId ?? null,
  title: task.title,
  type: task.type,
  timeType: task.timeType,
  priority: task.priority,
  isCompleted: Boolean(task.isCompleted),
  isCompletable: task.isCompletable !== false,
  isPinned: Boolean(task.isPinned),
  effectiveColor: task.effectiveColor || task.color || '#8a4fb0',
  date,
  startTime: task.startTime || null,
  endTime: task.endTime || null,
  tags: task.tags || [],
  originalTask: task,
});

/** Minute of the day at which a single-day task is drawn (null when it has no clock time). */
export const getAnchorMinutes = (task) => {
  if (task.timeType === 'TIMED' || task.timeType === 'OPEN_ENDED') {
    return task.startTime ? timeToMinutes(task.startTime) : null;
  }
  if (task.timeType === 'DEADLINE') return task.endTime ? timeToMinutes(task.endTime) : null;
  return null;
};

/**
 * @returns {{ events: object[], spans: object[] }}
 *   events: single-day tasks inside [rangeStart, rangeEnd]
 *   spans:  MULTI_DAY tasks overlapping the range (start / end are the task's real dates)
 */
export const buildCalendarItems = (tasks, rangeStart, rangeEnd) => {
  const events = [];
  const spans = [];

  tasks.forEach((task) => {
    if (task.timeType === 'ANY_TIME') return;

    if (task.timeType === 'MULTI_DAY') {
      const start = sliceDate(task.rangeStartDate);
      const end = sliceDate(task.rangeEndDate);
      if (!start || !end || end < rangeStart || start > rangeEnd) return;
      spans.push({ ...baseEvent(task, start), start, end });
      return;
    }

    const date = sliceDate(task.date);
    if (!date || date < rangeStart || date > rangeEnd) return;

    const anchorMinutes = getAnchorMinutes(task);
    let durationMinutes = 0;
    if (task.timeType === 'TIMED' && anchorMinutes !== null && task.endTime) {
      const end = timeToMinutes(task.endTime);
      durationMinutes = end > anchorMinutes ? end - anchorMinutes : 24 * 60 - anchorMinutes; // stops at midnight
    }

    events.push({ ...baseEvent(task, date), anchorMinutes, durationMinutes });
  });

  return { events, spans };
};

/**
 * Side-by-side layout for events that overlap in time within one day. Adds `lane` (0-based
 * column) and `laneCount` (columns in the overlapping group) to each timed event.
 */
export const layoutDayEvents = (events) => {
  const items = events
    .map((event) => ({
      event,
      start: event.anchorMinutes,
      end: event.anchorMinutes + Math.max(event.durationMinutes, MARKER_MINUTES),
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end || a.event.taskId - b.event.taskId);

  const laid = [];
  let group = [];
  let groupEnd = -1;

  const flush = () => {
    const laneEnds = [];
    group.forEach((item) => {
      let lane = laneEnds.findIndex((end) => end <= item.start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(item.end);
      } else {
        laneEnds[lane] = item.end;
      }
      item.lane = lane;
    });
    group.forEach((item) => laid.push({ ...item.event, lane: item.lane, laneCount: laneEnds.length }));
    group = [];
  };

  items.forEach((item) => {
    if (group.length > 0 && item.start >= groupEnd) {
      flush();
      groupEnd = -1;
    }
    group.push(item);
    groupEnd = Math.max(groupEnd, item.end);
  });
  if (group.length > 0) flush();

  return laid;
};

/**
 * Places multi-day bars on a 7-column window (one week row). Each bar gets CSS-grid columns
 * (colStart / colEnd, 1-based, end exclusive), a `row` so bars never overlap, and flags telling
 * whether it continues into the previous / next week.
 */
export const placeSpans = (spans, windowStart, windowEnd) => {
  const placed = spans
    .filter((span) => span.end >= windowStart && span.start <= windowEnd)
    .map((span) => {
      const start = span.start < windowStart ? windowStart : span.start;
      const end = span.end > windowEnd ? windowEnd : span.end;
      return {
        ...span,
        colStart: diffDays(windowStart, start) + 1,
        colEnd: diffDays(windowStart, end) + 2,
        continuesBefore: span.start < windowStart,
        continuesAfter: span.end > windowEnd,
      };
    })
    .sort(
      (a, b) =>
        a.colStart - b.colStart ||
        b.colEnd - b.colStart - (a.colEnd - a.colStart) ||
        a.taskId - b.taskId
    );

  const rowEnds = [];
  placed.forEach((span) => {
    let row = rowEnds.findIndex((end) => end <= span.colStart);
    if (row === -1) {
      row = rowEnds.length;
      rowEnds.push(span.colEnd);
    } else {
      rowEnds[row] = span.colEnd;
    }
    span.row = row;
  });

  return { spans: placed, rowCount: rowEnds.length };
};

// ─── Vertical grid math ───────────────────────────────────────────────────────
// The week grid has hour rows of different heights (empty hours can be compacted), so a clock
// minute maps to a y position through the cumulative row heights. These two functions are the
// only place that conversion lives; the grid, the drag selection and the event blocks all use them.

/** y position (px) of a clock minute. Minutes outside [startMin, endMin] are clamped. */
export const yForMinute = (minute, hourHeights, startMin, endMin) => {
  const clampedMinute = Math.min(Math.max(minute, startMin), endMin);
  const completeHours = Math.floor((clampedMinute - startMin) / 60);
  const remainingMinutes = (clampedMinute - startMin) % 60;
  const completedHeight = hourHeights.slice(0, completeHours).reduce((total, height) => total + height, 0);
  if (completeHours >= hourHeights.length) return completedHeight;
  return completedHeight + (remainingMinutes / 60) * hourHeights[completeHours];
};

/** Clock minute at a y position (px), snapped to 15 minutes and kept inside the visible range. */
export const minuteForY = (position, hourHeights, startMin, endMin) => {
  let offset = 0;
  for (let index = 0; index < hourHeights.length; index += 1) {
    const height = hourHeights[index];
    if (position <= offset + height || index === hourHeights.length - 1) {
      const fraction = Math.min(Math.max((position - offset) / height, 0), 1);
      const minute = startMin + index * 60 + Math.round((fraction * 60) / 15) * 15;
      return Math.min(Math.max(minute, startMin), endMin - 15);
    }
    offset += height;
  }
  return startMin;
};

// ─── Time lines (OPEN_ENDED / DEADLINE) ───────────────────────────────────────
// A task with only a start (open-ended) or only a due time (deadline) has no duration, so the
// week grid draws it as a line at that minute instead of a block. Lines sit on top of timed
// blocks and never take part in the side-by-side lane layout, so timed blocks keep full width.

export const isLineEvent = (event) => event.timeType === 'OPEN_ENDED' || event.timeType === 'DEADLINE';

/**
 * Lines at the same minute would draw their labels on top of each other. Each gets a slot
 * (`index` of `count`) so its label can be shifted sideways.
 */
export const spreadLinesByMinute = (lines) => {
  const byMinute = new Map();
  lines.forEach((event) => {
    if (!byMinute.has(event.anchorMinutes)) byMinute.set(event.anchorMinutes, []);
    byMinute.get(event.anchorMinutes).push(event);
  });

  const spread = [];
  byMinute.forEach((group) => {
    group.sort((a, b) => (a.taskId ?? 0) - (b.taskId ?? 0));
    group.forEach((event, index) => spread.push({ event, index, count: group.length }));
  });
  return spread;
};
