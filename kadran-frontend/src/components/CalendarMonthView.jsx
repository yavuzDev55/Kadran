// src/components/CalendarMonthView.jsx
// Month grid, one block per week: day numbers, multi-day bars across the cells, then the
// single-day items of each day.

import { useState } from "react";
import CalendarEventCard from "./CalendarEventCard";
import CalendarSpanBar from "./CalendarSpanBar";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { placeSpans } from "../utils/calendarUtils";
import { getWeekDayLabels, parseDate } from "../utils/dateUtils";

const VISIBLE_PER_DAY = 3;

export default function CalendarMonthView({
  monthDays,
  events,
  spans,
  currentMonthString,
  today,
  onEventClick,
  onToggle,
  onCreateTask,
  weekStartsOn = "MONDAY",
  timeFormat = "H24",
}) {
  const dayLabels = getWeekDayLabels(weekStartsOn);
  const [openDays, setOpenDays] = useState(() => new Set());
  const [selectedDate, setSelectedDate] = useState(null);

  const toggleDay = (dateStr) =>
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });

  const eventsByDate = {};
  events.forEach((event) => {
    if (!eventsByDate[event.date]) eventsByDate[event.date] = [];
    eventsByDate[event.date].push(event);
  });
  Object.values(eventsByDate).forEach((list) =>
    list.sort((a, b) => (a.anchorMinutes ?? -1) - (b.anchorMinutes ?? -1) || a.taskId - b.taskId)
  );

  const weeks = [];
  for (let i = 0; i < monthDays.length; i += 7) weeks.push(monthDays.slice(i, i + 7));
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];
  const selectedSpans = selectedDate
    ? spans.filter((span) => span.start <= selectedDate && span.end >= selectedDate)
    : [];
  const selectedLabel = selectedDate
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(parseDate(selectedDate))
    : "";
  const handleEventClick = (event) => {
    setSelectedDate(null);
    onEventClick?.(event);
  };

  return (
    <div className="calendar-cork flex flex-col w-full bg-surface border border-border/20 rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/20 bg-surface-muted/60">
        {dayLabels.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-bold text-muted uppercase tracking-wider border-r border-border/20 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {weeks.map((week) => {
        const { spans: bars, rowCount } = placeSpans(spans, week[0], week[6]);

        return (
          <div key={week[0]} className="relative border-b border-border/20 last:border-b-0">
            {/* Cell backgrounds and borders */}
            <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
              {week.map((dateStr) => {
                const isToday = dateStr === today;
                const inMonth = dateStr.slice(0, 7) === currentMonthString;
                return (
                  <div
                    key={`bg-${dateStr}`}
                    className={`border-r border-border/20 last:border-r-0 ${
                      isToday ? "bg-accent/10 ring-1 ring-inset ring-accent/50" : !inMonth ? "bg-surface-muted/70" : ""
                    }`}
                  />
                );
              })}
            </div>

            <div className="relative">
              {/* Day numbers */}
              <div className="grid grid-cols-7">
                {week.map((dateStr) => {
                  const isToday = dateStr === today;
                  const inMonth = dateStr.slice(0, 7) === currentMonthString;
                  return (
                    <div
                      key={`num-${dateStr}`}
                      className={`text-right text-sm px-2 pt-1 font-medium ${
                        isToday ? "text-accent font-bold" : inMonth ? "text-muted" : "text-muted/50"
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={`Show events for ${dateStr}`}
                        onClick={() => setSelectedDate(dateStr)}
                        className="rounded px-1 hover:bg-accent/10 focus-visible:outline"
                      >
                        {parseDate(dateStr).getUTCDate()}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Multi-day bars */}
              {rowCount > 0 && (
                <div className="grid grid-cols-7 auto-rows-[20px] gap-y-0.5 py-0.5">
                  {bars.map((span) => (
                    <CalendarSpanBar key={span.id} span={span} onClick={handleEventClick} />
                  ))}
                </div>
              )}

              {/* Single-day items */}
              <div className="grid grid-cols-7 min-h-[64px]">
                {week.map((dateStr) => {
                  const dayEvents = eventsByDate[dateStr] || [];
                  const open = openDays.has(dateStr);
                  const shown = open ? dayEvents : dayEvents.slice(0, VISIBLE_PER_DAY);
                  const hidden = dayEvents.length - shown.length;
                  const inMonth = dateStr.slice(0, 7) === currentMonthString;

                  return (
                    <div
                      key={`events-${dateStr}`}
                      className={`p-1 pb-2 flex flex-col gap-1 min-w-0 ${inMonth ? "" : "opacity-55"}`}
                    >
                      {shown.map((event) => (
                        <CalendarEventCard
                          key={event.id}
                          event={event}
                          onClick={handleEventClick}
                          onToggle={onToggle}
                          timeFormat={timeFormat}
                          variant="compact"
                        />
                      ))}
                      {(hidden > 0 || (open && dayEvents.length > VISIBLE_PER_DAY)) && (
                        <button
                          type="button"
                          onClick={() => toggleDay(dateStr)}
                          className="text-[10px] text-link hover:text-accent text-left px-1"
                        >
                          {open ? "Show less" : `+${hidden} more`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      <Modal
        open={selectedDate !== null}
        title={selectedLabel}
        description="Events scheduled for this day."
        onClose={() => setSelectedDate(null)}
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button onClick={() => setSelectedDate(null)}>Close</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!selectedDate) return;
                onCreateTask?.(selectedDate);
                setSelectedDate(null);
              }}
            >
              + Add custom timed task
            </Button>
          </div>
        }
      >
        {selectedEvents.length === 0 && selectedSpans.length === 0 ? (
          <p className="text-sm text-muted">No events scheduled.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedSpans.map((span) => (
              <button
                type="button"
                key={span.id}
                onClick={() => handleEventClick(span)}
                className="flex items-center justify-between gap-3 rounded border border-border/20 bg-surface-muted px-3 py-2 text-left text-sm hover:bg-accent/10"
              >
                <span className="font-medium">{span.title}</span>
                <span className="shrink-0 text-xs text-muted">{span.start} – {span.end}</span>
              </button>
            ))}
            {selectedEvents.map((event) => (
              <CalendarEventCard
                key={event.id}
                event={event}
                onClick={handleEventClick}
                onToggle={onToggle}
                timeFormat={timeFormat}
                variant="compact"
              />
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
