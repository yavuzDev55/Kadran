// src/components/CalendarSpanBar.jsx
// A multi-day task drawn as a bar across whole days. The ends are flat and carry an arrow when
// the task continues into the previous / next week.

import { getTaskDisplayColor } from "../utils/taskDisplaySettings";
import { PRIORITY_STYLE } from "../utils/taskRules";

export default function CalendarSpanBar({ span, onClick }) {
  const color = getTaskDisplayColor(span);
  const done = span.isCompleted;

  return (
    <div
      onClick={() => onClick && onClick(span)}
      title={`${span.title} · ${(PRIORITY_STYLE[span.priority] || PRIORITY_STYLE.MEDIUM).label}`}
      style={{
        gridColumn: `${span.colStart} / ${span.colEnd}`,
        gridRow: span.row + 1,
        "--task-color": color,
      }}
      className={`kadran-task kadran-task-span type-${span.type.toLowerCase()} priority-${span.priority.toLowerCase()} mx-0.5 px-1.5 h-5 flex items-center gap-1 text-[11px] border-l-2 cursor-pointer hover:brightness-95 transition overflow-hidden ${
        span.continuesBefore ? "rounded-l-none border-l-0" : "rounded-l"
      } ${span.continuesAfter ? "rounded-r-none" : "rounded-r"} ${done ? "is-completed" : ""}`}
    >
      {span.continuesBefore && <span className="text-slate-300">‹</span>}
      <span className="task-title truncate">{span.title}</span>
      {span.continuesAfter && <span className="ml-auto text-slate-300">›</span>}
    </div>
  );
}
