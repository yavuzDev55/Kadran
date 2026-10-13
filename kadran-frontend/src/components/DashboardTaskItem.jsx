// src/components/DashboardTaskItem.jsx

import { formatTaskTime } from "../utils/formatTime";
import { formatDateLabel } from "../utils/dashboardUtils";
import { TASK_TYPES } from "../utils/taskRules";

const PRIORITY_STYLES = {
  HIGH: "bg-red-900/50 text-red-300",
  MEDIUM: "bg-yellow-900/50 text-yellow-300",
  LOW: "bg-slate-700 text-slate-300",
};

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
  const accentColor = item.effectiveColor || "#94a3b8";
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
      style={{ borderLeftColor: accentColor }}
      className={`flex items-center gap-3 p-2.5 rounded border-l-4 bg-slate-800/80 border border-slate-700/60 ${
        onClick ? "cursor-pointer hover:brightness-110" : ""
      } ${item.isCompleted ? "opacity-50" : ""}`}
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
        <p className={`text-sm font-semibold truncate ${item.isCompleted ? "line-through text-slate-400" : "text-slate-100"}`}>
          {item.title}
        </p>
        <p className="text-xs text-slate-400 truncate">{meta}</p>
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

      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
          PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.MEDIUM
        }`}
      >
        {item.priority}
      </span>
    </li>
  );
}
