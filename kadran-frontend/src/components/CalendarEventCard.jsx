// src/components/CalendarEventCard.jsx
// One single-day calendar item. Variants:
//   block    timed event with a duration (week grid)
//   marker   open-ended / deadline: a short one-line label at its clock time (week grid)
//   compact  one line inside a month cell

import { formatEventTimeLabel, formatTime } from "../utils/formatTime";
import { getTaskDisplayColor } from "../utils/taskDisplaySettings";
import { PRIORITY_STYLE } from "../utils/taskRules";

export default function CalendarEventCard({ event, onClick, onToggle, timeFormat = "H24", variant = "block" }) {
  const accentColor = getTaskDisplayColor(event);
  const done = event.isCompleted;
  const timeLabel = formatEventTimeLabel(event, timeFormat);
  const taskClasses = `kadran-task type-${event.type.toLowerCase()} priority-${event.priority.toLowerCase()} ${
    event.timeType === "DEADLINE" ? "is-deadline" : event.timeType === "OPEN_ENDED" ? "is-open-ended" : ""
  } ${done ? "is-completed" : ""}`;

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
        style={{ "--task-color": accentColor }}
        className={`${taskClasses} ${
          isCompact
            ? "flex items-center gap-1 px-1 rounded cursor-pointer hover:brightness-95 transition text-[10px] py-0.5"
            : "kadran-task-marker flex h-full items-center gap-1 px-1 cursor-pointer hover:brightness-95 transition text-[11px]"
        }`}
        title={`${timeLabel} ${event.title}`.trim()}
      >
        {checkbox(isCompact ? "w-2.5 h-2.5" : "w-3 h-3")}
        <div className={`task-title truncate ${done ? "text-muted" : ""}`}>
          {timeLabel && <span className="opacity-70 mr-1">{timeLabel}</span>}
          {event.title}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick && onClick(event)}
      style={{ "--task-color": accentColor }}
      className={`${taskClasses} kadran-task-card h-full w-full p-1.5 rounded cursor-pointer hover:brightness-95 transition flex flex-col overflow-hidden text-xs`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-1.5 overflow-hidden">
          {checkbox("mt-0.5")}
          <span className="task-title font-semibold truncate">{event.title}</span>
        </div>
        <span
          className="shrink-0 text-[11px] font-bold opacity-70 ml-1"
          title={(PRIORITY_STYLE[event.priority] || PRIORITY_STYLE.MEDIUM).label}
          aria-label={(PRIORITY_STYLE[event.priority] || PRIORITY_STYLE.MEDIUM).label}
        >
          {(PRIORITY_STYLE[event.priority] || PRIORITY_STYLE.MEDIUM).icon}
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
