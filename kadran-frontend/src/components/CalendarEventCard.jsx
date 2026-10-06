// src/components/CalendarEventCard.jsx

import React from "react";
import { formatTime } from "../utils/formatTime";

const PRIORITY_ICON = { LOW: "↓", MEDIUM: "•", HIGH: "↑" };

export default function CalendarEventCard({ event, onClick, onToggle, timeFormat = "H24", compact = false }) {
  const icon = PRIORITY_ICON[event.priority] || PRIORITY_ICON.MEDIUM;
  const accentColor = event.effectiveColor || "#94a3b8";

  const handleToggle = (e) => {
    e.stopPropagation();
    // Pass the occurrence date along — required for recurring tasks (per-occurrence completion)
    if (onToggle && event.isCompletable !== false) onToggle(event.taskId, event.date);
  };

  if (compact) {
    return (
      <div
        onClick={() => onClick && onClick(event)}
        style={{ borderLeftColor: accentColor }}
        className={`flex items-start gap-1 text-[10px] px-1 py-0.5 rounded border-l-2 bg-slate-800/80 cursor-pointer hover:brightness-125 transition ${event.isCompleted ? 'opacity-40 grayscale' : ''}`}
        title={`${event.startTime ? formatTime(event.startTime, timeFormat) : 'All Day'} - ${event.title}`}
      >
        {event.isCompletable !== false && (
          <input
            type="checkbox"
            checked={event.isCompleted || false}
            onChange={handleToggle}
            onClick={(e) => e.stopPropagation()}
            className="mt-[2px] cursor-pointer accent-green-500 w-2.5 h-2.5 shrink-0"
          />
        )}
        <div className={`truncate ${event.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
          {event.startTime && <span className="opacity-70 mr-1">{formatTime(event.startTime, timeFormat)}</span>}
          {event.title}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick && onClick(event)}
      style={{ borderLeftColor: accentColor }}
      className={`h-full w-full p-1.5 rounded border-l-4 cursor-pointer hover:brightness-110 shadow-sm flex flex-col overflow-hidden text-xs bg-slate-800/90 text-slate-100 ${event.isCompleted ? 'opacity-40 grayscale' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-1.5 overflow-hidden">
          {event.isCompletable !== false && (
            <input
              type="checkbox"
              checked={event.isCompleted || false}
              onChange={handleToggle}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 cursor-pointer accent-green-500"
            />
          )}
          <span className={`font-semibold truncate ${event.isCompleted ? 'line-through text-slate-400' : ''}`}>
            {event.title}
          </span>
        </div>
        <span className="shrink-0 text-[11px] font-bold opacity-70 ml-1">{icon}</span>
      </div>

      {(event.startTime || event.endTime) && (
        <div className="opacity-80 mt-1 flex-none">
          {formatTime(event.startTime, timeFormat)}
          {event.endTime ? ` - ${formatTime(event.endTime, timeFormat)}` : ''}
        </div>
      )}
    </div>
  );
}