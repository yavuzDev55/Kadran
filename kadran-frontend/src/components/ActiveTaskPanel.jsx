// src/components/ActiveTaskPanel.jsx
// Slim "active now" strip. Only TIMED tasks (running between start and end) and MULTI_DAY tasks
// (today inside the day range) count. With nothing active it shows the next task of today, and
// disappears when there is nothing to show.

import { formatTime } from "../utils/formatTime";
import { getMultiDayProgress } from "../utils/dashboardUtils";
import { timeToMinutes } from "../utils/dateUtils";

function ActiveChip({ item, todayStr, nowMinutes, timeFormat, onClick }) {
  const accent = item.effectiveColor || "#3b82f6";
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
      style={{ borderLeftColor: accent }}
      className="text-left min-w-[220px] flex-1 bg-slate-800/80 border border-slate-700/60 border-l-4 rounded px-3 py-2 hover:brightness-110 transition"
    >
      <p className="text-sm font-semibold text-slate-100 truncate">{item.title}</p>
      <p className="text-xs text-slate-400 truncate">{status}</p>
      <div className="h-1 bg-slate-700 rounded-full overflow-hidden mt-1.5">
        <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </button>
  );
}

export default function ActiveTaskPanel({ activeItems, nextItem, todayStr, nowMinutes, timeFormat, onItemClick }) {
  if (activeItems.length === 0 && !nextItem) return null;

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
      <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 shrink-0">
        {activeItems.length > 0 ? "Active now" : "Up next"}
        {activeItems.length > 0 && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
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
        <button
          type="button"
          onClick={() => onItemClick(nextItem)}
          className="text-sm text-slate-300 hover:text-white text-left"
        >
          <span className="font-semibold text-slate-100">{nextItem.title}</span>
          <span className="text-slate-400">
            {" "}
            at{" "}
            {formatTime(nextItem.timeType === "DEADLINE" ? nextItem.endTime : nextItem.startTime, timeFormat)}
          </span>
        </button>
      )}
    </section>
  );
}
