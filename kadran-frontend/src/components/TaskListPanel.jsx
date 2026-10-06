// src/components/TaskListPanel.jsx
// Generic dashboard panel: title + count + list of DashboardTaskItem.

import DashboardTaskItem from "./DashboardTaskItem";

export default function TaskListPanel({
  title,
  items,
  emptyMessage,
  todayStr,
  timeFormat,
  showDate = false,
  onToggle,
  onItemClick,
}) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col max-h-[420px]">
      <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
        {title}
        {items.length > 0 && <span className="ml-2 text-slate-500 font-normal">({items.length})</span>}
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-4 text-center">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <DashboardTaskItem
              key={item.id}
              item={item}
              todayStr={todayStr}
              timeFormat={timeFormat}
              showDate={showDate}
              onToggle={onToggle}
              onClick={onItemClick}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
