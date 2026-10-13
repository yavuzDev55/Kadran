// src/components/CalendarEventCard.jsx
// One single-day calendar item. Variants:
//   block    timed event with a duration (week grid)
//   marker   open-ended / deadline: a short one-line label at its clock time (week grid)
//   compact  one line inside a month cell

import { formatEventTimeLabel, formatTime } from "../utils/formatTime";

const PRIORITY_ICON = { LOW: "↓", MEDIUM: "•", HIGH: "↑" };

export default function CalendarEventCard({ event, onClick, onToggle, timeFormat = "H24", variant = "block" }) {
  const accentColor = event.effectiveColor || "#94a3b8";
  const done = event.isCompleted;
  const timeLabel = formatEventTimeLabel(event, timeFormat);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (onToggle && event.isCompletable !== false) onToggle(event);
  };

  const checkbox = (className) =>
    event.isCompletable !== false && (
      <input
        type="checkbox"
        checked={done || false}
        onChange={handleToggle}
        onClick={(e) => e.stopPropagation()}
        className={`cursor-pointer accent-green-500 shrink-0 ${className}`}
      />
    );

  if (variant === "compact" || variant === "marker") {
    const isCompact = variant === "compact";
    return (
      <div
        onClick={() => onClick && onClick(event)}
        style={{ borderLeftColor: accentColor }}
        className={`flex items-center gap-1 px-1 rounded border-l-2 bg-slate-800/90 cursor-pointer hover:brightness-125 transition ${
          isCompact ? "text-[10px] py-0.5" : "h-full text-[11px]"
        } ${done ? "opacity-40 grayscale" : ""}`}
        title={`${timeLabel} ${event.title}`.trim()}
      >
        {checkbox(isCompact ? "w-2.5 h-2.5" : "w-3 h-3")}
        <div className={`truncate ${done ? "line-through text-slate-400" : "text-slate-100"}`}>
          {timeLabel && <span className="opacity-70 mr-1">{timeLabel}</span>}
          {event.title}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick && onClick(event)}
      style={{ borderLeftColor: accentColor }}
      className={`h-full w-full p-1.5 rounded border-l-4 cursor-pointer hover:brightness-110 shadow-sm flex flex-col overflow-hidden text-xs bg-slate-800/90 text-slate-100 ${
        done ? "opacity-40 grayscale" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-1.5 overflow-hidden">
          {checkbox("mt-0.5")}
          <span className={`font-semibold truncate ${done ? "line-through text-slate-400" : ""}`}>{event.title}</span>
        </div>
        <span className="shrink-0 text-[11px] font-bold opacity-70 ml-1">
          {PRIORITY_ICON[event.priority] || PRIORITY_ICON.MEDIUM}
        </span>
      </div>

      {event.startTime && event.endTime && (
        <div className="opacity-80 mt-1 flex-none">
          {formatTime(event.startTime, timeFormat)} - {formatTime(event.endTime, timeFormat)}
        </div>
      )}
    </div>
  );
}
