// src/components/CalendarTimeLine.jsx
// An OPEN_ENDED or DEADLINE task in the week grid, drawn as a 2px line in the task color at its
// clock minute (Design Tools reference: .ln). The line itself ignores the pointer, so the timed
// block underneath stays clickable; only the small label is interactive.
//   DEADLINE    line + cap on the right, a soft fade above it, label above the line
//   OPEN_ENDED  line + cap on the left, a soft fade below it (no end), label below the line

import { formatEventTimeLabel } from "../utils/formatTime";
import { getTaskDisplayColor } from "../utils/taskDisplaySettings";
import { PRIORITY_STYLE } from "../utils/taskRules";

export default function CalendarTimeLine({ event, top, index = 0, count = 1, onClick, onToggle, timeFormat = "H24" }) {
  const isDeadline = event.timeType === "DEADLINE";
  const done = Boolean(event.isCompleted);
  const priority = PRIORITY_STYLE[event.priority] || PRIORITY_STYLE.MEDIUM;
  const timeLabel = formatEventTimeLabel(event, timeFormat);

  // Several lines at one minute share the width so their labels do not overlap.
  const labelStyle =
    count > 1
      ? { left: `calc(${(index / count) * 100}% + 5px)`, maxWidth: `calc(${100 / count}% - 8px)` }
      : undefined;

  return (
    <div
      className={`time-line ${isDeadline ? "is-deadline" : "is-open"} ${done ? "is-completed" : ""}`}
      style={{ top: `${top}px`, "--task-color": getTaskDisplayColor(event) }}
    >
      <span className="time-line__cap" aria-hidden="true" />
      <div className="time-line__label" style={labelStyle}>
        {event.isCompletable !== false && (
          <input
            type="checkbox"
            checked={done}
            aria-label={`Mark "${event.title}" complete`}
            onChange={() => onToggle && onToggle(event)}
            onClick={(e) => e.stopPropagation()}
            className="h-3 w-3 shrink-0 cursor-pointer accent-accent"
          />
        )}
        <button
          type="button"
          onClick={() => onClick && onClick(event)}
          title={`${timeLabel} ${event.title} · ${priority.label}`.trim()}
          className="time-line__title"
        >
          {timeLabel && <span className="opacity-70">{timeLabel}</span>}
          <span className="truncate">{event.title}</span>
        </button>
      </div>
    </div>
  );
}
