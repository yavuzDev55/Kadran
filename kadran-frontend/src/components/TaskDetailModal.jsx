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
    "px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted transition rounded border border-border/25";
  const dangerClass =
    "px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition rounded border border-danger/30";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="ui-panel w-full max-w-md flex flex-col">
        <div className="flex justify-between items-start p-4 border-b border-border/20">
          <div className="flex items-start gap-3">
            {event.isCompletable !== false && (
              <input
                type="checkbox"
                checked={event.isCompleted || false}
                onChange={() => onToggle(event)}
                className="mt-1 w-4 h-4 cursor-pointer accent-[rgb(var(--color-accent))]"
                title="Mark as completed"
              />
            )}
            <div>
              <h2
                className={`font-title text-xl font-normal ${event.isCompleted ? "line-through text-muted" : "text-ink"}`}
              >
                {event.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-muted text-ink">
                  {typeLabel(event.type)}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    event.priority === "HIGH"
                      ? "text-danger bg-danger/10"
                      : event.priority === "MEDIUM"
                        ? "text-accent bg-accent/10"
                        : "bg-surface-muted text-muted"
                  }`}
                >
                  {PRIORITY_LABELS[event.priority]}
                </span>
                {event.isCompleted && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent/10 text-accent">
                    ✓ Completed
                  </span>
                )}
                {event.isPinned && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent/10 text-accent">
                    📌 Pinned
                  </span>
                )}
                {event.isCompletable === false && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-muted text-muted border border-border/20">
                    Not completable
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition p-1 bg-surface-muted hover:bg-surface rounded shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 text-sm text-ink">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted font-semibold uppercase tracking-wider">
              {isSeries ? "This occurrence" : "Date & time"}
            </span>
            <div className="flex items-center gap-2 bg-surface-muted/60 p-2 rounded border border-border/20">
              {dateText && <span>{dateText}</span>}
              {dateText && showTimeSeparately && <span className="text-muted">•</span>}
              {showTimeSeparately && <span>{timeText}</span>}
              {task.timeType === "ANY_TIME" && <span>Any time</span>}
            </div>
          </div>

          {task.description && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted font-semibold uppercase tracking-wider">
                {isSeries ? "This occurrence's note" : "Description"}
              </span>
              <p className="bg-surface-muted/60 p-2 rounded border border-border/20 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {isSeries && series?.description && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted font-semibold uppercase tracking-wider">Series description</span>
              <p className="bg-surface-muted/60 p-2 rounded border border-border/20 whitespace-pre-wrap">
                {series.description}
              </p>
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted font-semibold uppercase tracking-wider">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {event.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-surface-muted border border-border/20 rounded text-ink">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isSeries && (
            <div className="text-xs text-muted bg-surface-muted/60 p-2 rounded border border-border/20 flex flex-col gap-1">
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

        <div className="p-4 border-t border-border/20 bg-surface-muted/30 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {event.isCompletable !== false ? (
              <button
                onClick={() => onToggle(event)}
                className={`px-4 py-2 text-sm font-medium rounded border transition ${
                  event.isCompleted
                    ? "text-ink border-border/25 hover:bg-surface"
                    : "text-accent border-accent/40 hover:bg-accent/10"
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
