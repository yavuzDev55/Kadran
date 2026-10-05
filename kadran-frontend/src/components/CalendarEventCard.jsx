// src/components/CalendarEventCard.jsx

import React from "react";

const PRIORITY_ICON = { LOW: "↓", MEDIUM: "•", HIGH: "↑" };

export default function CalendarEventCard({ event, onClick, onToggle }) {
  const icon = PRIORITY_ICON[event.priority] || PRIORITY_ICON.MEDIUM;

  // Use effectiveColor from API (color ?? typeDefault), fall back to slate
  const accentColor = event.effectiveColor || '#94a3b8';

// CalendarEventCard.jsx içinde handleToggle:
const handleToggle = (e) => {
  e.stopPropagation();
  if (onToggle && event.isCompletable !== false) {
    // Pass both taskId and the occurrence date
    onToggle(event.taskId, event.date);
  }
};

  return (
    <div
      onClick={() => onClick && onClick(event)}
      style={{ borderLeftColor: accentColor }}
      className={`h-full w-full p-1.5 rounded border-l-4 cursor-pointer hover:brightness-110 shadow-sm flex flex-col overflow-hidden text-xs bg-slate-800/90 text-slate-100 ${event.isCompleted ? 'opacity-40 grayscale' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-1.5 overflow-hidden">
          {/* Only render checkbox when task is completable */}
          {event.isCompletable !== false && (
            <input
              type="checkbox"
              checked={event.isCompleted || false}
              onChange={handleToggle}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 cursor-pointer accent-green-500"
            />
          )}
          <span
            className={`font-semibold truncate ${event.isCompletable === false ? '' : 'pl-0'} ${event.isCompleted ? 'line-through text-slate-400' : ''}`}
          >
            {event.title}
          </span>
        </div>
        <span className="shrink-0 text-[11px] font-bold opacity-70 ml-1">{icon}</span>
      </div>

      {(event.startTime || event.endTime) && (
        <div className="opacity-80 mt-1 pl-0 flex-none">
          {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
        </div>
      )}
    </div>
  );
}