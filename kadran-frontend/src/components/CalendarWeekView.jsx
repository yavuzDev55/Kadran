import React from "react";
import CalendarDayColumn from "./CalendarDayColumn";

const WEEK_DAYS_LABELS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function CalendarWeekView({ weekDays, events, onEventClick, onToggle }) {
  // Group all flattened events by their assigned date string
  const eventsByDate = weekDays.reduce((acc, dateStr) => {
    acc[dateStr] = events.filter(e => e.date === dateStr);
    
    // Sort events inside each day by start time
    acc[dateStr].sort((a, b) => {
      if (!a.startTime) return -1;
      if (!b.startTime) return 1;
      return a.startTime.localeCompare(b.startTime);
    });
    
    return acc;
  }, {});

  return (
    <div className="flex w-full bg-slate-900 border border-slate-700 rounded-lg overflow-x-auto shadow-xl">
      {weekDays.map((dateStr, index) => {
        // Map 0-6 index to Monday-Sunday
        const dayName = WEEK_DAYS_LABELS[index]; 
        
        return (
          <CalendarDayColumn 
            key={dateStr}
            dateString={dateStr}
            dayName={dayName}
            events={eventsByDate[dateStr] || []}
            onEventClick={onEventClick}
            onToggle={onToggle}
          />
        );
      })}
    </div>
  );
}