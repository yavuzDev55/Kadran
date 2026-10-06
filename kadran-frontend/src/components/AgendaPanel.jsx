// src/components/AgendaPanel.jsx
// Tabbed panel: "Today" (flat list) and "This Week" (grouped by day).

import { useState } from "react";
import DashboardTaskItem from "./DashboardTaskItem";
import { formatDayHeading, groupItemsByDate } from "../utils/dashboardUtils";

export default function AgendaPanel({
  todayItems,
  weekItems,
  weekDays,
  todayStr,
  timeFormat,
  onToggle,
  onItemClick,
}) {
  const [tab, setTab] = useState("today");

  const tabs = [
    { id: "today", label: "Today", count: todayItems.length },
    { id: "week", label: `Next ${weekDays} Days`, count: weekItems.length },
  ];

  const itemProps = { todayStr, timeFormat, onToggle, onClick: onItemClick };
  const groups = tab === "week" ? groupItemsByDate(weekItems) : [];
  const isEmpty = tab === "today" ? todayItems.length === 0 : groups.length === 0;

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col max-h-[420px]">
      <div className="flex gap-1 mb-3 bg-slate-950 p-1 rounded border border-slate-800 self-start">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition ${
              tab === id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
            {count > 0 && <span className="ml-1.5 opacity-70">({count})</span>}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <p className="text-sm text-slate-500 italic py-4 text-center">
          {tab === "today" ? "Nothing planned for today." : "Nothing planned for this period."}
        </p>
      ) : tab === "today" ? (
        <ul className="flex flex-col gap-2 overflow-y-auto pr-1">
          {todayItems.map((item) => (
            <DashboardTaskItem key={item.id} item={item} {...itemProps} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          {groups.map(({ date, items }) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-slate-400 mb-1.5">{formatDayHeading(date, todayStr)}</h3>
              <ul className="flex flex-col gap-2">
                {items.map((item) => (
                  <DashboardTaskItem key={item.id} item={item} {...itemProps} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
