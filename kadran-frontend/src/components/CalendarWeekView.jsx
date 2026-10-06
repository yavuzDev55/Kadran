// src/components/CalendarWeekView.jsx

import React from "react";
import CalendarEventCard from "./CalendarEventCard";
import { getWeekDayLabels } from "../utils/calendarUtils";
import { formatHourLabel } from "../utils/formatTime";

const HOUR_HEIGHT = 60;

export default function CalendarWeekView({
  weekDays,
  events,
  onEventClick,
  onToggle,
  startHour = 8,
  endHour = 22,
  weekStartsOn = "MONDAY",
  timeFormat = "H24",
}) {
  const dayLabels = getWeekDayLabels(weekStartsOn);

  const eventsByDate = weekDays.reduce((acc, dateStr) => {
    acc[dateStr] = events.filter((e) => e.date === dateStr);
    return acc;
  }, {});

  // hours[i] represents the block [startHour+i, startHour+i+1)
  const hours = Array.from({ length: Math.max(1, endHour - startHour) }, (_, i) => startHour + i);
  const todayString = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">

      <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-slate-700/50 bg-slate-800/80 z-20">
        <div className="border-r border-slate-700/50"></div>
        {weekDays.map((dateStr, i) => {
          const isToday = dateStr === todayString;
          const dayNum = new Date(dateStr).getUTCDate();
          return (
            <div key={`header-${dateStr}`} className={`p-2 text-center border-r border-slate-700/50 last:border-r-0 ${isToday ? 'bg-slate-700/50' : ''}`}>
              <div className={`text-xs font-bold ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>{dayLabels[i]}</div>
              <div className={`text-lg font-light ${isToday ? 'text-blue-400' : 'text-slate-200'}`}>{dayNum}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-slate-700/50 bg-slate-800/40 z-10">
        <div className="border-r border-slate-700/50 flex items-center justify-center overflow-hidden">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold -rotate-90 whitespace-nowrap">All Day</span>
        </div>
        {weekDays.map((dateStr) => {
          const dayEvents = eventsByDate[dateStr] || [];
          const allDayEvents = dayEvents.filter((e) => e.startHourNum === null);
          return (
            <div key={`allday-${dateStr}`} className="p-1 border-r border-slate-700/50 last:border-r-0 flex flex-col gap-1 min-h-[40px]">
              {allDayEvents.map((event) => (
                <div key={event.id} className="min-h-[40px]">
                  <CalendarEventCard event={event} onClick={onEventClick} onToggle={onToggle} timeFormat={timeFormat} />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="relative bg-slate-900/40">
        <div className="grid grid-cols-[50px_repeat(7,1fr)] relative" style={{ minHeight: `${hours.length * HOUR_HEIGHT}px` }}>

          <div className="absolute inset-0 grid grid-cols-[50px_repeat(7,1fr)] pointer-events-none">
            <div className="border-r border-slate-700/50 bg-slate-900/50"></div>
            {weekDays.map((_, i) => <div key={`bg-col-${i}`} className="border-r border-slate-700/50 last:border-r-0"></div>)}
          </div>

          {hours.map((hour, index) => (
            <div key={`line-${hour}`} className="absolute w-full flex items-start pointer-events-none" style={{ top: `${index * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
              <div className="w-[50px] shrink-0 text-right pr-2 relative z-10">
                <span className="text-[10px] text-slate-500 absolute right-2 -top-2.5 bg-slate-900 px-1 rounded">
                  {formatHourLabel(hour, timeFormat)}
                </span>
              </div>
              <div className="flex-1 border-t border-slate-700/30 w-full mt-0"></div>
            </div>
          ))}

          {weekDays.map((dateStr) => {
            const dayEvents = eventsByDate[dateStr] || [];
            const timedEvents = dayEvents.filter((e) => e.startHourNum !== null);

            return (
              <div key={`timed-${dateStr}`} className="relative h-full">
                {timedEvents.map((event) => {
                  const top = Math.max(0, (event.startHourNum - startHour) * HOUR_HEIGHT);
                  const height = event.durationNum * HOUR_HEIGHT;

                  return (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 p-0.5 z-10"
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <CalendarEventCard event={event} onClick={onEventClick} onToggle={onToggle} timeFormat={timeFormat} />
                    </div>
                  );
                })}
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}