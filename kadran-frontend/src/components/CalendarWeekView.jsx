// src/components/CalendarWeekView.jsx
// Week grid: header, an all-day strip with multi-day bars, and the hour grid.
//   TIMED       block over its duration
//   OPEN_ENDED  one-line marker at its start time
//   DEADLINE    one-line marker at its due time
// Items outside the visible hours are summarised at the top / bottom of their day column.

import CalendarEventCard from "./CalendarEventCard";
import CalendarSpanBar from "./CalendarSpanBar";
import { MARKER_MINUTES, layoutDayEvents, placeSpans } from "../utils/calendarUtils";
import { getWeekDayLabels, parseDate } from "../utils/dateUtils";
import { formatHourLabel } from "../utils/formatTime";

const HOUR_HEIGHT = 60;
const MIN_BLOCK_HEIGHT = 20;
const GRID = "grid grid-cols-[50px_repeat(7,1fr)]";

/** Splits a day's events into those inside the visible hours and those before / after them. */
const splitByVisibleHours = (events, startMin, endMin) => {
  const visible = [];
  const before = [];
  const after = [];
  events.forEach((event) => {
    const eventEnd = event.anchorMinutes + Math.max(event.durationMinutes, MARKER_MINUTES);
    if (eventEnd <= startMin) before.push(event);
    else if (event.anchorMinutes >= endMin) after.push(event);
    else visible.push(event);
  });
  return { visible, before, after };
};

export default function CalendarWeekView({
  weekDays,
  events,
  spans,
  today,
  onEventClick,
  onToggle,
  startHour = 8,
  endHour = 22,
  weekStartsOn = "MONDAY",
  timeFormat = "H24",
}) {
  const dayLabels = getWeekDayLabels(weekStartsOn);
  const startMin = startHour * 60;
  const endMin = Math.max(endHour, startHour + 1) * 60;
  const hours = Array.from({ length: endMin / 60 - startHour }, (_, i) => startHour + i);
  const pxPerMinute = HOUR_HEIGHT / 60;

  const { spans: bars, rowCount } = placeSpans(spans, weekDays[0], weekDays[6]);

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
      {/* Day headers */}
      <div className={`${GRID} border-b border-slate-700/50 bg-slate-800/80 z-20`}>
        <div className="border-r border-slate-700/50" />
        {weekDays.map((dateStr, i) => {
          const isToday = dateStr === today;
          return (
            <div
              key={`header-${dateStr}`}
              className={`p-2 text-center border-r border-slate-700/50 last:border-r-0 ${isToday ? "bg-slate-700/50" : ""}`}
            >
              <div className={`text-xs font-bold ${isToday ? "text-blue-400" : "text-slate-400"}`}>{dayLabels[i]}</div>
              <div className={`text-lg font-light ${isToday ? "text-blue-400" : "text-slate-200"}`}>
                {parseDate(dateStr).getUTCDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day strip: multi-day bars */}
      <div className={`${GRID} border-b border-slate-700/50 bg-slate-800/40 z-10`}>
        <div className="border-r border-slate-700/50 flex items-center justify-center overflow-hidden">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold -rotate-90 whitespace-nowrap">
            All Day
          </span>
        </div>
        <div className="col-span-7 relative min-h-[32px]">
          <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
            {weekDays.map((dateStr) => (
              <div key={`allday-bg-${dateStr}`} className="border-r border-slate-700/50 last:border-r-0" />
            ))}
          </div>
          <div className="relative grid grid-cols-7 auto-rows-[20px] gap-y-1 py-1.5">
            {bars.map((span) => (
              <CalendarSpanBar key={span.id} span={span} onClick={onEventClick} />
            ))}
            {rowCount === 0 && <div className="col-span-7 h-5" />}
          </div>
        </div>
      </div>

      {/* Hour grid */}
      <div className="relative bg-slate-900/40">
        <div className={`${GRID} relative`} style={{ minHeight: `${hours.length * HOUR_HEIGHT}px` }}>
          <div className={`absolute inset-0 ${GRID} pointer-events-none`}>
            <div className="border-r border-slate-700/50 bg-slate-900/50" />
            {weekDays.map((dateStr) => (
              <div
                key={`bg-${dateStr}`}
                className={`border-r border-slate-700/50 last:border-r-0 ${dateStr === today ? "bg-slate-800/30" : ""}`}
              />
            ))}
          </div>

          {hours.map((hour, index) => (
            <div
              key={`line-${hour}`}
              className="absolute w-full flex items-start pointer-events-none"
              style={{ top: `${index * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              <div className="w-[50px] shrink-0 text-right pr-2 relative z-10">
                <span className="text-[10px] text-slate-500 absolute right-2 -top-2.5 bg-slate-900 px-1 rounded">
                  {formatHourLabel(hour, timeFormat)}
                </span>
              </div>
              <div className="flex-1 border-t border-slate-700/30 w-full mt-0" />
            </div>
          ))}

          {/* Spacer for the hour-label column */}
          <div />

          {weekDays.map((dateStr) => {
            const dayEvents = events.filter((e) => e.date === dateStr && e.anchorMinutes !== null);
            const { visible, before, after } = splitByVisibleHours(dayEvents, startMin, endMin);

            return (
              <div key={`timed-${dateStr}`} className="relative h-full">
                {before.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onEventClick(before[0])}
                    className="absolute top-0 left-1 right-1 z-20 text-[10px] text-slate-300 bg-slate-700/80 hover:bg-slate-600 rounded px-1"
                    title={before.map((e) => e.title).join(", ")}
                  >
                    ↑ {before.length} earlier
                  </button>
                )}

                {layoutDayEvents(visible).map((event) => {
                  const eventEnd = event.anchorMinutes + Math.max(event.durationMinutes, MARKER_MINUTES);
                  const top = (Math.max(event.anchorMinutes, startMin) - startMin) * pxPerMinute;
                  const bottom = (Math.min(eventEnd, endMin) - startMin) * pxPerMinute;
                  const height = Math.max(bottom - top, MIN_BLOCK_HEIGHT);
                  const isMarker = event.durationMinutes === 0;

                  return (
                    <div
                      key={event.id}
                      className="absolute p-0.5 z-10"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `calc(${(event.lane / event.laneCount) * 100}% + 2px)`,
                        width: `calc(${100 / event.laneCount}% - 4px)`,
                      }}
                    >
                      <CalendarEventCard
                        event={event}
                        onClick={onEventClick}
                        onToggle={onToggle}
                        timeFormat={timeFormat}
                        variant={isMarker ? "marker" : "block"}
                      />
                    </div>
                  );
                })}

                {after.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onEventClick(after[0])}
                    className="absolute bottom-0 left-1 right-1 z-20 text-[10px] text-slate-300 bg-slate-700/80 hover:bg-slate-600 rounded px-1"
                    title={after.map((e) => e.title).join(", ")}
                  >
                    ↓ {after.length} later
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
