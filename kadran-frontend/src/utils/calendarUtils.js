// UTC gün indeksi (0=Pazar) → gün adı (backend ile tutarlı: MONDAY..SUNDAY)
const UTC_DAY_NAMES = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

/**
 * Normalizes backend tasks into flat CalendarEvent objects suitable for UI rendering.
 * It handles recurring tasks, expanding them into individual instances.
 */
export const normalizeTasksToEvents = (tasks, viewStartDate, viewEndDate) => {
  const events = [];
  const startObj = new Date(viewStartDate);
  const endObj = new Date(viewEndDate);

  tasks.forEach((task) => {
    // 1. NON-RECURRING TASKS
    if (!task.isRecurring) {
      // Use date for TIMED/DEADLINE, or rangeStartDate for DATE_RANGE
      const targetDate = task.date 
        ? task.date.slice(0, 10) 
        : task.rangeStartDate?.slice(0, 10);

      if (targetDate && isDateInRange(targetDate, viewStartDate, viewEndDate)) {
        events.push(createEventObject(task, targetDate));
      }
      return;
    }

    // 2. RECURRING TASKS (Expanding instances)
    const recurrenceStart = new Date(task.recurrenceStart);
    const recurrenceEnd = task.recurrenceEnd ? new Date(task.recurrenceEnd) : null;
    
    // Determine the loop boundaries (intersection of view range and task recurrence range)
    let loopStart = startObj > recurrenceStart ? startObj : recurrenceStart;
    let loopEnd = recurrenceEnd && recurrenceEnd < endObj ? recurrenceEnd : endObj;

    let currentDate = new Date(loopStart);

    while (currentDate <= loopEnd) {
      const dateString = currentDate.toISOString().slice(0, 10);
      const dayName = UTC_DAY_NAMES[currentDate.getUTCDay()];

      if (task.recurrencePattern === "DAILY") {
        events.push(createEventObject(task, dateString));
      } 
      else if (task.recurrencePattern === "WEEKLY") {
        // Check if today's day name is in the recurrenceDays string/array
        const daysArray = typeof task.recurrenceDays === "string" 
          ? task.recurrenceDays.split(",") 
          : (task.recurrenceDays || []);
          
        if (daysArray.includes(dayName)) {
          events.push(createEventObject(task, dateString, dayName));
        }
      } 
      else if (task.recurrencePattern === "MONTHLY") {
        const targetDay = parseInt(task.recurrenceDay, 10);
        // Basic implementation for monthly: match the day of the month
        // -1 logic (last day of month) can be added here later
        if (currentDate.getUTCDate() === targetDay) {
          events.push(createEventObject(task, dateString));
        }
      }

      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
  });

  return events;
};

/**
 * Creates a standardized flat event object.
 */
const createEventObject = (task, dateString, dayName = null) => {
  let startTime = task.startTime;
  let endTime = task.endTime;

  if (task.isFlexibleSchedule && task.schedules && dayName) {
    const daySchedule = task.schedules.find(s => s.dayOfWeek === dayName);
    if (daySchedule) {
      startTime = daySchedule.startTime;
      endTime = daySchedule.endTime;
    }
  }

  // Calculate numeric hours for grid positioning (e.g., "09:30" -> 9.5)
  let startHourNum = null;
  let durationNum = 1; // Default duration

  if (startTime) {
    const [h, m] = startTime.split(':').map(Number);
    startHourNum = h + (m / 60);
    
    if (endTime) {
      const [eh, em] = endTime.split(':').map(Number);
      let endHourNum = eh + (em / 60);
      if (endHourNum < startHourNum) endHourNum += 24; // Handle midnight cross
      durationNum = endHourNum - startHourNum;
    }
  }

  return {
    id: `${task.id}-${dateString}`,
    taskId: task.id,
    title: task.title,
    type: task.type,
    priority: task.priority,
    isCompleted: task.isCompleted,
    date: dateString,
    startTime: startTime || null,
    endTime: endTime || null,
    startHourNum,
    durationNum,
    tags: task.tags || [],
    originalTask: task,
    effectiveColor: task.effectiveColor || task.color || null,
    isCompletable:  task.isCompletable !== false,
    isPinned:       task.isPinned || false,
    originalTask:   task, 
  };
};

/**
 * Helper: Checks if a YYYY-MM-DD string falls within a start and end YYYY-MM-DD string.
 */
const isDateInRange = (dateStr, startStr, endStr) => {
  return dateStr >= startStr && dateStr <= endStr;
};

/**
 * Helper: Generates an array of YYYY-MM-DD strings for a given week.
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
 * Generates an array of 42 YYYY-MM-DD strings (6 weeks) for a month view.
 * Ensures the grid always starts on a Monday.
 */
export const getMonthDaysArray = (year, monthIndex) => {
  // monthIndex is 0-11 (JS standard)
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const days = [];

  // Find the Monday before or on the 1st of the month
  let dayOfWeek = firstDay.getUTCDay() || 7; // Convert Sunday(0) to 7
  const startDate = new Date(firstDay);
  startDate.setUTCDate(firstDay.getUTCDate() - (dayOfWeek - 1));

  // Generate 42 days (6 full weeks to accommodate any month shape)
  for (let i = 0; i < 42; i++) {
    const current = new Date(startDate);
    current.setUTCDate(startDate.getUTCDate() + i);
    days.push(current.toISOString().slice(0, 10));
  }
  
  return days;
};