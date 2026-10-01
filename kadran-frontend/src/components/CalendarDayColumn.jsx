import React from "react";
import CalendarEventCard from "./CalendarEventCard";

const START_HOUR = 8; // 08:00
const END_HOUR = 23;  // 23:00
const HOUR_HEIGHT = 60; // 1 hour = 60px

export default function CalendarDayColumn({ dateString, dayName, events, onEventClick, onToggle }) {
  const dateObj = new Date(dateString);
  const dayNumber = dateObj.getUTCDate();
  const isToday = new Date().toISOString().slice(0, 10) === dateString;

  // Separate all-day tasks and timed tasks
  const allDayEvents = events.filter(e => e.startHourNum === null);
  const timedEvents = events.filter(e => e.startHourNum !== null);

  // Generate background lines for hours
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  return (
    <div className={`flex-1 min-w-[120px] border-r border-slate-700/50 flex flex-col ${isToday ? 'bg-slate-800/30' : ''}`}>
      {/* Header */}
      <div className="p-2 text-center border-b border-slate-700/50 bg-slate-900 sticky top-0 z-20">
        <div className={`text-xs font-bold ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>
          {dayName.substring(0, 3)}
        </div>
        <div className={`text-lg font-light ${isToday ? 'text-blue-400' : 'text-slate-200'}`}>
          {dayNumber}
        </div>
      </div>

      {/* All-Day Events Section (Top) */}
      {allDayEvents.length > 0 && (
        <div className="p-1 border-b border-slate-700/50 bg-slate-800/20 flex flex-col gap-1 z-10 relative">
          {allDayEvents.map(event => (
            <div key={event.id} className="min-h-[40px]">
              <CalendarEventCard event={event} onClick={onEventClick} onToggle={onToggle} />
            </div>
          ))}
        </div>
      )}

      {/* Timed Grid Area */}
      <div className="relative flex-1 bg-slate-900/40 custom-scrollbar" style={{ minHeight: `${hours.length * HOUR_HEIGHT}px` }}>
        {/* Background Hour Lines */}
        {hours.map(hour => (
          <div key={hour} className="absolute w-full border-b border-slate-700/30 flex items-start" style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
            <span className="text-[10px] text-slate-500 -mt-2 ml-1 bg-slate-900/80 px-1 rounded">{hour}:00</span>
          </div>
        ))}

        {/* Absolute Positioned Timed Events */}
        {timedEvents.map(event => {
          // Calculate top position. If earlier than START_HOUR, clamp it or hide it.
          const top = Math.max(0, (event.startHourNum - START_HOUR) * HOUR_HEIGHT);
          const height = event.durationNum * HOUR_HEIGHT;

          return (
            <div 
              key={event.id}
              className="absolute left-1 right-1 p-0.5 z-10"
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              <CalendarEventCard event={event} onClick={onEventClick} onToggle={onToggle} />
            </div>
          );
        })}
      </div>
    </div>
  );
}