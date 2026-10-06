// src/components/ActiveTaskPanel.jsx

import { formatTime } from "../utils/formatTime";
import { getEventWindow } from "../utils/dashboardUtils";

function ActiveTaskCard({ event, nowMinutes, timeFormat, onToggle }) {
  const window = getEventWindow(event);
  const accentColor = event.effectiveColor || "#3b82f6";
  const hasEnd = window.end !== null;

  const progress = hasEnd
    ? Math.min(100, Math.max(0, Math.round(((nowMinutes - window.start) / (window.end - window.start)) * 100)))
    : null;

  const statusText = hasEnd
    ? `${window.end - nowMinutes} min remaining`
    : `Started ${nowMinutes - window.start} min ago`;

  return (
    <div style={{ borderLeftColor: accentColor }} className="border-l-4 pl-3">
      <div className="flex items-center gap-3">
        {event.isCompletable !== false && (
          <input
            type="checkbox"
            checked={event.isCompleted}
            onChange={() => onToggle(event.taskId, event.date)}
            className="w-4 h-4 cursor-pointer accent-green-500"
            title="Mark as completed"
          />
        )}
        <h3 className="text-lg font-bold text-slate-100">{event.title}</h3>
      </div>

      <p className="text-xs text-slate-400 mt-1">
        {formatTime(event.startTime, timeFormat)}
        {event.endTime ? ` - ${formatTime(event.endTime, timeFormat)}` : ""} · {event.type}
      </p>

      {progress !== null && (
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-3">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      <p className="text-xs text-slate-300 mt-1.5">{statusText}</p>
    </div>
  );
}

export default function ActiveTaskPanel({ activeEvents, nextEvent, nowMinutes, timeFormat, onToggle }) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-full">
      <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
        Active Now
        {activeEvents.length > 0 && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
      </h2>

      {activeEvents.length === 0 ? (
        <div className="py-2">
          <p className="text-sm text-slate-500 italic">No active task right now.</p>
          {nextEvent && (
            <p className="text-xs text-slate-400 mt-2">
              Next: <span className="text-slate-200 font-semibold">{nextEvent.title}</span> at{" "}
              {formatTime(nextEvent.startTime, timeFormat)}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activeEvents.map((event) => (
            <ActiveTaskCard
              key={event.id}
              event={event}
              nowMinutes={nowMinutes}
              timeFormat={timeFormat}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </section>
  );
}
