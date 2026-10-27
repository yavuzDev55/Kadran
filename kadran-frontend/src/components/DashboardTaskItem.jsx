// src/components/DashboardTaskItem.jsx

import { formatTaskTime } from "../utils/formatTime";
import { formatDateLabel } from "../utils/dashboardUtils";
import { TASK_TYPES } from "../utils/taskRules";
import { getTaskDisplayColor } from "../utils/taskDisplaySettings";

const typeLabel = (type) => TASK_TYPES.find((t) => t.id === type)?.label || type;

export default function DashboardTaskItem({
  item,
  todayStr,
  timeFormat = "H24",
  showDate = false,
  onToggle,
  onTogglePin,
  onClick,
}) {
  const accentColor = getTaskDisplayColor(item);
  const timeLabel = formatTaskTime(item, timeFormat);
  // A multi-day item shows its whole range, so a separate date label would repeat it
  const dateLabel = showDate && item.timeType !== "MULTI_DAY" ? formatDateLabel(item.date, todayStr) : "";
  const meta = [dateLabel, timeLabel, typeLabel(item.type), item.seriesId != null ? "🔁" : ""]
    .filter(Boolean)
    .join(" · ");

  const handleToggle = (e) => {
    e.stopPropagation();
    if (onToggle) onToggle(item);
  };

  const handlePin = (e) => {
    e.stopPropagation();
    onTogglePin(item, !item.isPinned);
  };

  return (
    <li
      onClick={() => onClick && onClick(item)}
      style={{ "--task-color": accentColor }}
      className={`kadran-task kadran-task-row has-action type-${item.type.toLowerCase()} priority-${item.priority.toLowerCase()} ${
        item.timeType === "DEADLINE" ? "is-deadline" : item.timeType === "OPEN_ENDED" ? "is-open-ended" : ""
      } flex items-center gap-3 p-2.5 rounded ${
        onClick ? "cursor-pointer hover:border-ink/30" : ""
      } ${item.isCompleted ? "is-completed" : ""}`}
    >
      {onToggle && item.isCompletable !== false && (
        <input
          type="checkbox"
          checked={item.isCompleted}
          onChange={handleToggle}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 cursor-pointer accent-green-500 shrink-0"
        />
      )}

      <div className="min-w-0 flex-1">
        <p className={`task-title text-sm font-semibold truncate ${item.isCompleted ? "text-muted" : ""}`}>
          {item.title}
        </p>
        <p className="text-xs text-muted truncate">{meta}</p>
      </div>

      {onTogglePin && (
        <button
          type="button"
          onClick={handlePin}
          title={item.isPinned ? "Unpin" : "Pin"}
          aria-label={item.isPinned ? "Unpin task" : "Pin task"}
          className={`text-sm shrink-0 transition ${
            item.isPinned ? "opacity-100" : "opacity-30 hover:opacity-80 grayscale"
          }`}
        >
          📌
        </button>
      )}

      <span className="shrink-0 text-[10px] font-semibold text-muted">{item.priority}</span>
    </li>
  );
}
