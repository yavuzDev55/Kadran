// src/components/CalendarMonthView.jsx

import React from "react";
import CalendarEventCard from "./CalendarEventCard";
import { getWeekDayLabels } from "../utils/calendarUtils";

export default function CalendarMonthView({
  monthDays,
  events,
  currentMonthString,
  onEventClick,
  onToggle,
  weekStartsOn = "MONDAY",
  timeFormat = "H24",
}) {
  const dayLabels = getWeekDayLabels(weekStartsOn);

  const eventsByDate = monthDays.reduce((acc, dateStr) => {
    acc[dateStr] = events.filter((e) => e.date === dateStr);
    acc[dateStr].sort((a, b) => {
      if (a.startHourNum === null && b.startHourNum !== null) return -1;
      if (a.startHourNum !== null && b.startHourNum === null) return 1;
      if (a.startHourNum === b.startHourNum) return 0;
      return a.startHourNum - b.startHourNum;
    });
    return acc;
  }, {});

  const todayString = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col w-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
      <div className="grid grid-cols-7 border-b border-slate-700 bg-slate-800/50">
        {dayLabels.map((day) => (
          <div key={day} className="p-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-700/50 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {monthDays.map((dateStr) => {
          const dateObj = new Date(dateStr);
          const dayNumber = dateObj.getUTCDate();
          const isToday = dateStr === todayString;
          const isCurrentMonth = dateStr.slice(0, 7) === currentMonthString;
          const dayEvents = eventsByDate[dateStr] || [];

          return (
            <div
              key={dateStr}
              className={`min-h-[120px] border-b border-r border-slate-700/50 p-1 flex flex-col gap-1 overflow-hidden
                ${!isCurrentMonth ? 'bg-slate-900/80 opacity-60' : 'bg-slate-900'}
                ${isToday ? 'bg-slate-800/40 ring-1 ring-inset ring-blue-500/50' : ''}
              `}
            >
              <div className={`text-right text-sm mb-1 pr-1 font-medium ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>
                {dayNumber}
              </div>

              <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                {dayEvents.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                    onToggle={onToggle}
                    timeFormat={timeFormat}
                    compact
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}