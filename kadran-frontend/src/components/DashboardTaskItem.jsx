// src/components/DashboardTaskItem.jsx
// One task row (Design Tools reference ".trow"): a patterned icon tile in the task's color, title and
// when, then pin and complete buttons. Priority is carried by the frame and the folded corner,
// with a screen-reader label, instead of a text badge.

import Icon from "./Icon";
import { formatTaskTime } from "../utils/formatTime";
import { formatDateLabel, taskIconName } from "../utils/dashboardUtils";
import { PRIORITY_STYLE } from "../utils/taskRules";
import { getTaskDisplayColor } from "../utils/taskDisplaySettings";

const PRIORITY_CLASS = { LOW: "is-p-low", MEDIUM: "is-p-med", HIGH: "is-p-high" };

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
  const meta = [dateLabel, timeLabel, item.seriesId != null ? "↻ repeats" : ""].filter(Boolean).join(" · ");
  const priority = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.MEDIUM;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (onToggle) onToggle(item);
  };

  const handlePin = (e) => {
    e.stopPropagation();
    onTogglePin(item, !item.isPinned);
  };

  const handleKeyDown = (e) => {
    if (e.target !== e.currentTarget || !onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(item);
    }
  };

  const classes = [
    "k-row",
    `k-ty-${item.type.toLowerCase()}`,
    PRIORITY_CLASS[item.priority] || PRIORITY_CLASS.MEDIUM,
    item.timeType === "DEADLINE" && "is-dl",
    item.timeType === "OPEN_ENDED" && "is-op",
    item.isCompleted && "is-done",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li
      onClick={() => onClick && onClick(item)}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      style={{ "--c": accentColor }}
      className={classes}
    >
      {item.priority === "HIGH" && <i className="k-fold" aria-hidden="true" />}
      <span className="k-ti">
        <Icon name={taskIconName(item)} />
      </span>

      <div className="k-row__tx">
        <div className="k-row__tt">{item.title}</div>
        <div className="k-row__ts">
          {meta}
          <span className="sr-only">{meta ? ". " : ""}{priority.label}</span>
        </div>
      </div>

      {onTogglePin && (
        <button
          type="button"
          onClick={handlePin}
          aria-pressed={Boolean(item.isPinned)}
          aria-label={`${item.isPinned ? "Unpin" : "Pin"} ${item.title}`}
          title={item.isPinned ? "Unpin" : "Pin"}
          className="k-ib"
        >
          <Icon name="pin" />
        </button>
      )}

      {onToggle && item.isCompletable !== false && (
        <button
          type="button"
          onClick={handleToggle}
          aria-pressed={Boolean(item.isCompleted)}
          aria-label={`${item.isCompleted ? "Mark open" : "Mark done"}: ${item.title}`}
          title={item.isCompleted ? "Mark open" : "Mark done"}
          className="k-ib"
        >
          <span className="k-tick">
            <Icon name="check" />
          </span>
        </button>
      )}
    </li>
  );
}
