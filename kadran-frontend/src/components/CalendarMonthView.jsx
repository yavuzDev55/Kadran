import React from "react";

const WEEK_DAYS_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TYPE_COLORS = {
  COURSE: "bg-blue-900/60 text-blue-200 border-blue-500",
  EXAM: "bg-red-900/60 text-red-200 border-red-500",
  HOMEWORK: "bg-green-900/60 text-green-200 border-green-500",
  CUSTOM: "bg-slate-700/60 text-slate-200 border-slate-500",
};

export default function CalendarMonthView({ monthDays, events, currentMonthString, onEventClick, onToggle }) {
  const eventsByDate = monthDays.reduce((acc, dateStr) => {
    acc[dateStr] = events.filter(e => e.date === dateStr);
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
        {WEEK_DAYS_LABELS.map(day => (
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
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick && onEventClick(event)}
                    className={`flex items-start gap-1 text-[10px] px-1 py-0.5 rounded border-l-2 cursor-pointer hover:brightness-125 transition ${TYPE_COLORS[event.type] || TYPE_COLORS.CUSTOM} ${event.isCompleted ? 'opacity-40 grayscale' : ''}`}
                    title={`${event.startTime || 'All Day'} - ${event.title}`}
                  >
                    <input 
                      type="checkbox" 
                      checked={event.isCompleted}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (onToggle) onToggle(event.taskId);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-[2px] cursor-pointer accent-green-500 w-2.5 h-2.5 shrink-0"
                    />
                    <div className={`truncate ${event.isCompleted ? 'line-through text-slate-400' : ''}`}>
                      {event.startTime && <span className="opacity-70 mr-1">{event.startTime}</span>}
                      {event.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}