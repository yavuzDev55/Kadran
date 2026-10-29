// src/components/AgendaPanel.jsx
// "Tasks" panel with a Today / Next 7 days switch. The week view is grouped by day.

import { useState } from "react";
import DashboardTaskItem from "./DashboardTaskItem";
import Segmented from "./ui/Segmented";
import { formatDayHeading, groupItemsByDate } from "../utils/dashboardUtils";

export default function AgendaPanel({
  todayItems,
  weekItems,
  weekDays,
  todayStr,
  timeFormat,
  onToggle,
  onTogglePin,
  onItemClick,
}) {
  const [tab, setTab] = useState("today");

  const itemProps = { todayStr, timeFormat, onToggle, onTogglePin, onClick: onItemClick };
  const groups = tab === "week" ? groupItemsByDate(weekItems) : [];
  const isEmpty = tab === "today" ? todayItems.length === 0 : groups.length === 0;

  return (
    <section className="k-panel" aria-labelledby="agenda-heading">
      <div className="k-ph">
        <h3 id="agenda-heading">Tasks</h3>
        <Segmented
          label="Range"
          value={tab}
          onChange={setTab}
          options={[
            { value: "today", label: "Today" },
            { value: "week", label: `Next ${weekDays} days` },
          ]}
        />
      </div>

      <div className="k-pb">
        {isEmpty ? (
          <div className="k-empty">
            <h4>{tab === "today" ? "Nothing planned for today" : "Nothing planned for this period"}</h4>
            <p>Add a task, or enjoy the free time.</p>
          </div>
        ) : tab === "today" ? (
          <ul className="grid gap-[7px] p-0 m-0">
            {todayItems.map((item) => (
              <DashboardTaskItem key={item.id} item={item} {...itemProps} />
            ))}
          </ul>
        ) : (
          groups.map(({ date, items }) => (
            <div key={date} className="grid gap-[7px]">
              <h4 className="k-dh">{formatDayHeading(date, todayStr)}</h4>
              <ul className="grid gap-[7px] p-0 m-0">
                {items.map((item) => (
                  <DashboardTaskItem key={item.id} item={item} {...itemProps} />
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
