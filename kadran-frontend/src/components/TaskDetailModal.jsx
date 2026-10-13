// src/components/TaskDetailModal.jsx
// Details of a calendar item. For one occurrence of a series the actions are split into
// "this occurrence" and "whole series".

import { formatDateRange, formatTaskTime } from "../utils/formatTime";
import { sliceDate } from "../utils/dateUtils";
import { TASK_TYPES } from "../utils/taskRules";

const PRIORITY_LABELS = {
  LOW: "Low Priority",
  MEDIUM: "Medium Priority",
  HIGH: "High Priority",
};

const PATTERN_LABELS = { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly" };

const typeLabel = (type) => TASK_TYPES.find((t) => t.id === type)?.label || type;

/**
 * @param event        calendar item (see calendarUtils.baseEvent)
 * @param onToggle     (event) => void
 * @param onTogglePin  (event, nextValue) => void   (applies to the whole series)
 * @param onEdit       (event, scope) => void       scope: "occurrence" | "series"
 * @param onDelete     (event, scope) => void       scope: "occurrence" | "series"
 */
export default function TaskDetailModal({
  event,
  onClose,
  onDelete,
  onEdit,
  onToggle,
  onTogglePin,
  timeFormat = "H24",
}) {
  if (!event) return null;

  const task = event.originalTask || event;
  const isSeries = event.seriesId != null;
  const series = task.series;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const timeText = formatTaskTime(task, timeFormat);
  const dateText =
    task.timeType === "MULTI_DAY" ? formatDateRange(task) : task.timeType === "ANY_TIME" ? "" : sliceDate(task.date);
  const showTimeSeparately = task.timeType !== "MULTI_DAY" && task.timeType !== "ANY_TIME" && timeText;

  const actionClass =
    "px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition rounded border border-slate-700";
  const dangerClass =
    "px-3 py-2 text-sm font-medium text-red-400 hover:text-white hover:bg-red-600 transition rounded border border-red-900/50";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="flex justify-between items-start p-4 border-b border-slate-700/50">
          <div className="flex items-start gap-3">
            {event.isCompletable !== false && (
              <input
                type="checkbox"
                checked={event.isCompleted || false}
                onChange={() => onToggle(event)}
                className="mt-1 w-4 h-4 cursor-pointer accent-green-500"
                title="Mark as completed"
              />
            )}
            <div>
              <h2
                className={`text-xl font-bold ${event.isCompleted ? "line-through text-slate-400" : "text-slate-100"}`}
              >
                {event.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {typeLabel(event.type)}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    event.priority === "HIGH"
                      ? "bg-red-900/50 text-red-300"
                      : event.priority === "MEDIUM"
                        ? "bg-yellow-900/50 text-yellow-300"
                        : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {PRIORITY_LABELS[event.priority]}
                </span>
                {event.isCompleted && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-900/50 text-green-300">
                    ✓ Completed
                  </span>
                )}
                {event.isPinned && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/50 text-blue-300">
                    📌 Pinned
                  </span>
                )}
                {event.isCompletable === false && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-700">
                    Not completable
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 bg-slate-700/50 hover:bg-slate-600 rounded shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 text-sm text-slate-300">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              {isSeries ? "This occurrence" : "Date & time"}
            </span>
            <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700/50">
              {dateText && <span>{dateText}</span>}
              {dateText && showTimeSeparately && <span className="text-slate-500">•</span>}
              {showTimeSeparately && <span>{timeText}</span>}
              {task.timeType === "ANY_TIME" && <span>Any time</span>}
            </div>
          </div>

          {task.description && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Description</span>
              <p className="bg-slate-900/50 p-2 rounded border border-slate-700/50 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {event.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isSeries && (
            <div className="text-xs text-slate-500 bg-slate-900/50 p-2 rounded border border-slate-700/50 flex flex-col gap-1">
              <span>
                🔁 {PATTERN_LABELS[series?.pattern] || "Recurring"} series
                {series ? ` (${sliceDate(series.startDate)} → ${sliceDate(series.endDate)})` : ""}
              </span>
              <span>
                Completing, editing the day/time or deleting affects <strong>this occurrence</strong> only. Pinning
                applies to <strong>the whole series</strong>.
              </span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-slate-900/30 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {event.isCompletable !== false ? (
              <button
                onClick={() => onToggle(event)}
                className={`px-4 py-2 text-sm font-medium rounded border transition ${
                  event.isCompleted
                    ? "text-slate-300 border-slate-600 hover:bg-slate-700"
                    : "text-green-400 border-green-900/50 hover:bg-green-700 hover:text-white"
                }`}
              >
                {event.isCompleted ? "Mark Incomplete" : "Mark Complete"}
              </button>
            ) : (
              <div />
            )}

            {onTogglePin && (
              <button onClick={() => onTogglePin(event, !event.isPinned)} className={actionClass}>
                {event.isPinned ? "Unpin" : "📌 Pin"}
                {isSeries ? " series" : ""}
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {isSeries ? (
              <>
                <button onClick={() => onEdit(event, "occurrence")} className={actionClass}>
                  Edit this
                </button>
                <button onClick={() => onEdit(event, "series")} className={actionClass}>
                  Edit series
                </button>
                <button onClick={() => onDelete(event, "occurrence")} className={dangerClass}>
                  Delete this
                </button>
                <button onClick={() => onDelete(event, "series")} className={dangerClass}>
                  Delete series
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onEdit(event, "occurrence")} className={actionClass}>
                  Edit
                </button>
                <button onClick={() => onDelete(event, "occurrence")} className={dangerClass}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
