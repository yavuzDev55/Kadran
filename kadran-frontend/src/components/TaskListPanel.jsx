// src/components/TaskListPanel.jsx
// Dashboard panel: title + count + at most `limit` rows, with a "View all" link when there are more.

import { Link } from "react-router-dom";
import DashboardTaskItem from "./DashboardTaskItem";

export default function TaskListPanel({
  title,
  items,
  emptyMessage,
  todayStr,
  timeFormat,
  showDate = false,
  limit,
  viewAllTo,
  error = false,
  onToggle,
  onTogglePin,
  onItemClick,
}) {
  const shown = limit ? items.slice(0, limit) : items;
  const hidden = items.length - shown.length;
  const headingId = `panel-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section className="k-panel" aria-labelledby={headingId}>
      <div className="k-ph">
        <h3 id={headingId}>{title}</h3>
        {items.length > 0 && <span className="k-cnt" aria-label={`${items.length} tasks`}>{items.length}</span>}
      </div>

      <div className="k-pb">
        {error ? (
          <div className="k-empty">
            <h4>Could not load this list</h4>
            <p>Try refreshing the page.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="k-empty">
            <h4>{emptyMessage}</h4>
          </div>
        ) : (
          <>
            <ul className="grid gap-[7px] p-0 m-0">
              {shown.map((item) => (
                <DashboardTaskItem
                  key={item.id}
                  item={item}
                  todayStr={todayStr}
                  timeFormat={timeFormat}
                  showDate={showDate}
                  onToggle={onToggle}
                  onTogglePin={onTogglePin}
                  onClick={onItemClick}
                />
              ))}
            </ul>
            {viewAllTo && hidden > 0 && (
              <Link to={viewAllTo} className="k-link">
                View all in the task list →
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}
