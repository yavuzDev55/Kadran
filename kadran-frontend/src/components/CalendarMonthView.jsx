// src/components/CalendarMonthView.jsx
// Month grid, one block per week: day numbers, multi-day bars across the cells, then the
// single-day items of each day.

import { useState } from "react";
import CalendarEventCard from "./CalendarEventCard";
import CalendarSpanBar from "./CalendarSpanBar";
import { placeSpans } from "../utils/calendarUtils";
import { getWeekDayLabels, parseDate } from "../utils/dateUtils";

const VISIBLE_PER_DAY = 3;

export default function CalendarMonthView({
  monthDays,
  events,
  spans,
  currentMonthString,
  today,
  onEventClick,
  onToggle,
  weekStartsOn = "MONDAY",
  timeFormat = "H24",
}) {
  const dayLabels = getWeekDayLabels(weekStartsOn);
  const [openDays, setOpenDays] = useState(() => new Set());

  const toggleDay = (dateStr) =>
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });

  const eventsByDate = {};
  events.forEach((event) => {
    if (!eventsByDate[event.date]) eventsByDate[event.date] = [];
    eventsByDate[event.date].push(event);
  });
  Object.values(eventsByDate).forEach((list) =>
    list.sort((a, b) => (a.anchorMinutes ?? -1) - (b.anchorMinutes ?? -1) || a.taskId - b.taskId)
  );

  const weeks = [];
  for (let i = 0; i < monthDays.length; i += 7) weeks.push(monthDays.slice(i, i + 7));

  return (
    <div className="flex flex-col w-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
      <div className="grid grid-cols-7 border-b border-slate-700 bg-slate-800/50">
        {dayLabels.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-700/50 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {weeks.map((week) => {
        const { spans: bars, rowCount } = placeSpans(spans, week[0], week[6]);

        return (
          <div key={week[0]} className="relative border-b border-slate-700/50 last:border-b-0">
            {/* Cell backgrounds and borders */}
            <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
              {week.map((dateStr) => {
                const isToday = dateStr === today;
                const inMonth = dateStr.slice(0, 7) === currentMonthString;
                return (
                  <div
                    key={`bg-${dateStr}`}
                    className={`border-r border-slate-700/50 last:border-r-0 ${
                      isToday ? "bg-slate-800/40 ring-1 ring-inset ring-blue-500/50" : !inMonth ? "bg-slate-900/80" : ""
                    }`}
                  />
                );
              })}
            </div>

            <div className="relative">
              {/* Day numbers */}
              <div className="grid grid-cols-7">
                {week.map((dateStr) => {
                  const isToday = dateStr === today;
                  const inMonth = dateStr.slice(0, 7) === currentMonthString;
                  return (
                    <div
                      key={`num-${dateStr}`}
                      className={`text-right text-sm px-2 pt-1 font-medium ${
                        isToday ? "text-blue-400" : inMonth ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {parseDate(dateStr).getUTCDate()}
                    </div>
                  );
                })}
              </div>

              {/* Multi-day bars */}
              {rowCount > 0 && (
                <div className="grid grid-cols-7 auto-rows-[20px] gap-y-0.5 py-0.5">
                  {bars.map((span) => (
                    <CalendarSpanBar key={span.id} span={span} onClick={onEventClick} />
                  ))}
                </div>
              )}

              {/* Single-day items */}
              <div className="grid grid-cols-7 min-h-[64px]">
                {week.map((dateStr) => {
                  const dayEvents = eventsByDate[dateStr] || [];
                  const open = openDays.has(dateStr);
                  const shown = open ? dayEvents : dayEvents.slice(0, VISIBLE_PER_DAY);
                  const hidden = dayEvents.length - shown.length;
                  const inMonth = dateStr.slice(0, 7) === currentMonthString;

                  return (
                    <div
                      key={`events-${dateStr}`}
                      className={`p-1 pb-2 flex flex-col gap-1 min-w-0 ${inMonth ? "" : "opacity-60"}`}
                    >
                      {shown.map((event) => (
                        <CalendarEventCard
                          key={event.id}
                          event={event}
                          onClick={onEventClick}
                          onToggle={onToggle}
                          timeFormat={timeFormat}
                          variant="compact"
                        />
                      ))}
                      {(hidden > 0 || (open && dayEvents.length > VISIBLE_PER_DAY)) && (
                        <button
                          type="button"
                          onClick={() => toggleDay(dateStr)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 text-left px-1"
                        >
                          {open ? "Show less" : `+${hidden} more`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
