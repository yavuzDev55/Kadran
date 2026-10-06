// src/utils/calendarUtils.js

// UTC day index (0=Sunday) → day name matching backend MONDAY..SUNDAY convention
const UTC_DAY_NAMES = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

/**
 * Normalizes backend tasks into flat CalendarEvent objects for UI rendering.
 * Recurring tasks are expanded into individual occurrence instances.
 * Per-occurrence completion is resolved from task.completedDates (array of 'YYYY-MM-DD').
 */
export const normalizeTasksToEvents = (tasks, viewStartDate, viewEndDate) => {
  const events = [];

  tasks.forEach((task) => {
    if (!task.isRecurring) {
      // ANYTIME tasks have no date — not placed on the calendar grid
      if (task.timeType === 'ANYTIME') return;

      const targetDate = task.date
        ? task.date.slice(0, 10)
        : task.rangeStartDate?.slice(0, 10);

      if (targetDate && isDateInRange(targetDate, viewStartDate, viewEndDate)) {
        events.push(createEventObject(task, targetDate));
      }
      return;
    }

    // Recurring tasks: expand occurrences within view range
    const recurrenceStart = task.recurrenceStart
      ? new Date(task.recurrenceStart)
      : new Date(viewStartDate);
    const recurrenceEnd = task.recurrenceEnd ? new Date(task.recurrenceEnd) : null;

    const viewStart = new Date(viewStartDate);
    const viewEnd   = new Date(viewEndDate);

    const loopStart = recurrenceStart > viewStart ? recurrenceStart : viewStart;
    const loopEnd   = recurrenceEnd && recurrenceEnd < viewEnd ? recurrenceEnd : viewEnd;

    const completedSet = new Set(task.completedDates || []);

    let current = new Date(loopStart);
    let iterations = 0;
    const MAX_ITER = 500; // safety cap against malformed recurrence rules

    while (current <= loopEnd && iterations < MAX_ITER) {
      iterations++;
      const dateStr = current.toISOString().slice(0, 10);
      const dayName = UTC_DAY_NAMES[current.getUTCDay()];
      let matched = false;

      if (task.recurrencePattern === 'DAILY') {
        matched = true;
      } else if (task.recurrencePattern === 'WEEKLY') {
        const daysArray = typeof task.recurrenceDays === 'string'
          ? task.recurrenceDays.split(',').map((d) => d.trim())
          : (task.recurrenceDays || []);
        matched = daysArray.includes(dayName);
      } else if (task.recurrencePattern === 'MONTHLY') {
        const targetDay = parseInt(task.recurrenceDay, 10);
        if (targetDay === -1) {
          const lastDay = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0));
          matched = current.getUTCDate() === lastDay.getUTCDate();
        } else {
          matched = current.getUTCDate() === targetDay;
        }
      }

      if (matched) {
        const isCompleted = completedSet.has(dateStr);
        events.push(createEventObject(task, dateStr, dayName, isCompleted));
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }
  });

  return events;
};

const createEventObject = (task, dateString, dayName = null, isCompletedOverride = null) => {
  let startTime = task.startTime;
  let endTime = task.endTime;

  if (task.isFlexibleSchedule && task.schedules && dayName) {
    const slot = task.schedules.find((s) => s.dayOfWeek === dayName);
    if (slot) { startTime = slot.startTime; endTime = slot.endTime; }
  }

  let startHourNum = null;
  let durationNum = 1;

  if (startTime) {
    const [h, m] = startTime.split(':').map(Number);
    startHourNum = h + m / 60;

    if (endTime) {
      const [eh, em] = endTime.split(':').map(Number);
      let endHourNum = eh + em / 60;
      if (endHourNum < startHourNum) endHourNum += 24;
      durationNum = endHourNum - startHourNum;
    } else {
      // TIMED_OPEN: render as a short fixed-duration block
      durationNum = 0.5;
    }
  }

  const isCompleted = isCompletedOverride !== null ? isCompletedOverride : (task.isCompleted || false);

  return {
    id: `${task.id}-${dateString}`,
    taskId: task.id,
    title: task.title,
    type: task.type,
    timeType: task.timeType,
    priority: task.priority,
    isCompleted,
    isCompletable: task.isCompletable !== false,
    isPinned: task.isPinned || false,
    effectiveColor: task.effectiveColor || task.color || null,
    date: dateString,
    startTime: startTime || null,
    endTime: endTime || null,
    startHourNum,
    durationNum,
    tags: task.tags || [],
    originalTask: task,
  };
};

const isDateInRange = (dateStr, startStr, endStr) =>
  dateStr >= startStr && dateStr <= endStr;

/**
 * Returns 7 consecutive 'YYYY-MM-DD' strings starting at startDateStr.
 * The caller is responsible for computing a startDateStr that already
 * respects the user's weekStartsOn preference (see getStartOfWeek in CalendarPage).
 */
export const getWeekDaysArray = (startDateStr) => {
  const days = [];
  const start = new Date(startDateStr);
  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setUTCDate(start.getUTCDate() + i);
    days.push(current.toISOString().slice(0, 10));
  }
  return days;
};

/**
 * Generates 42 'YYYY-MM-DD' strings (6 weeks) for a month grid.
 * The grid's first row starts on the weekday given by weekStartsOn.
 */
export const getMonthDaysArray = (year, monthIndex, weekStartsOn = 'MONDAY') => {
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const firstDayOfWeek = firstDay.getUTCDay(); // 0=Sunday..6=Saturday

  const offset = weekStartsOn === 'SUNDAY'
    ? firstDayOfWeek
    : (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);

  const startDate = new Date(firstDay);
  startDate.setUTCDate(firstDay.getUTCDate() - offset);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const current = new Date(startDate);
    current.setUTCDate(startDate.getUTCDate() + i);
    days.push(current.toISOString().slice(0, 10));
  }
  return days;
};

/**
 * Returns 3-letter day labels in the order matching weekStartsOn,
 * so grid headers line up with the generated day arrays above.
 */
export const getWeekDayLabels = (weekStartsOn = 'MONDAY') => {
  const mondayFirst = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (weekStartsOn === 'SUNDAY') {
    return ['Sun', ...mondayFirst.slice(0, 6)];
  }
  return mondayFirst;
};