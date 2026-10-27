// src/components/ActiveTaskPanel.jsx
// Slim "active now" strip. Only TIMED tasks (running between start and end) and MULTI_DAY tasks
// (today inside the day range) count. When nothing is active it shows the next task of today.

import { formatTime } from "../utils/formatTime";
import { getMultiDayProgress } from "../utils/dashboardUtils";
import { timeToMinutes } from "../utils/dateUtils";
import { getTaskDisplayColor } from "../utils/taskDisplaySettings";

function ActiveChip({ item, todayStr, nowMinutes, timeFormat, onClick }) {
  const accent = getTaskDisplayColor(item);
  let status;
  let progress;

  if (item.timeType === "MULTI_DAY") {
    const { day, total, daysLeft } = getMultiDayProgress(item, todayStr);
    status = total === 1 ? "All day" : `Day ${day} of ${total} · ${daysLeft === 0 ? "last day" : `${daysLeft} left`}`;
    progress = Math.round((day / total) * 100);
  } else {
    const start = timeToMinutes(item.startTime);
    const end = timeToMinutes(item.endTime);
    const length = end > start ? end - start : 24 * 60 - start;
    const left = (end > start ? end : 24 * 60) - nowMinutes;
    status = `${formatTime(item.startTime, timeFormat)} – ${formatTime(item.endTime, timeFormat)} · ${left} min left`;
    progress = Math.min(100, Math.max(0, Math.round(((nowMinutes - start) / length) * 100)));
  }

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      style={{ "--task-color": accent }}
      className={`kadran-task kadran-task-row has-action type-${item.type.toLowerCase()} priority-${item.priority.toLowerCase()} text-left min-w-[220px] flex-1 rounded px-3 py-2 hover:brightness-95 transition`}
    >
      <p className="task-title text-sm font-semibold text-ink truncate">{item.title}</p>
      <p className="text-xs text-muted truncate">{status}</p>
      <div className="h-1 bg-surface-muted rounded-full overflow-hidden mt-1.5">
        <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
      </div>
    </button>
  );
}

export default function ActiveTaskPanel({ activeItems, nextItem, todayStr, nowMinutes, timeFormat, onItemClick }) {
  return (
    <section className="ui-panel px-4 py-3 flex flex-wrap items-center gap-3">
      <h2 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2 shrink-0">
        {activeItems.length > 0 ? "Active now" : "Up next"}
        {activeItems.length > 0 && <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
      </h2>

      {activeItems.length > 0 ? (
        <div className="flex flex-wrap gap-2 flex-1">
          {activeItems.map((item) => (
            <ActiveChip
              key={item.id}
              item={item}
              todayStr={todayStr}
              nowMinutes={nowMinutes}
              timeFormat={timeFormat}
              onClick={onItemClick}
            />
          ))}
        </div>
      ) : (
        nextItem ? (
          <button
            type="button"
            onClick={() => onItemClick(nextItem)}
            className="text-sm text-muted hover:text-ink text-left"
          >
            <span className="font-semibold text-ink">{nextItem.title}</span>
            <span className="text-muted">
              {" "}
              at{" "}
              {formatTime(nextItem.timeType === "DEADLINE" ? nextItem.endTime : nextItem.startTime, timeFormat)}
            </span>
          </button>
        ) : (
          <p className="text-sm text-muted">Nothing scheduled for the rest of today.</p>
        )
      )}
    </section>
  );
}
