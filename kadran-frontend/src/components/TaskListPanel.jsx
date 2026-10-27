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

  return (
    <section className="ui-panel p-4 flex flex-col max-h-[420px]">
      <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-3">
        {title}
        {items.length > 0 && <span className="ml-2 text-muted font-normal">({items.length})</span>}
      </h2>

      {error ? (
        <p className="text-sm text-danger py-4 text-center">Could not load this list.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted italic py-4 text-center">{emptyMessage}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2 overflow-y-auto pr-1">
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
            <Link to={viewAllTo} className="mt-3 text-xs font-semibold text-link hover:text-accent self-start">
              View all in the task list →
            </Link>
          )}
        </>
      )}
    </section>
  );
}
