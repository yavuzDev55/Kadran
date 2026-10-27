// src/components/CalendarWeekView.jsx
// Week grid: header, an all-day strip with multi-day bars, and the hour grid.
//   TIMED       block over its duration
//   OPEN_ENDED  one-line marker at its start time
//   DEADLINE    one-line marker at its due time
// Items outside the visible hours are summarised at the top / bottom of their day column.

import CalendarEventCard from "./CalendarEventCard";
import CalendarSpanBar from "./CalendarSpanBar";
import { useEffect, useRef, useState } from "react";
import { MARKER_MINUTES, layoutDayEvents, placeSpans } from "../utils/calendarUtils";
import { getWeekDayLabels, parseDate } from "../utils/dateUtils";
import { formatHourLabel } from "../utils/formatTime";

const HOUR_HEIGHT = 60;
const COMPACT_HOUR_HEIGHT = 16;
const MIN_BLOCK_HEIGHT = 20;

/** Splits a day's events into those inside the visible hours and those before / after them. */
const splitByVisibleHours = (events, startMin, endMin) => {
  const visible = [];
  const before = [];
  const after = [];
  events.forEach((event) => {
    const eventEnd = event.anchorMinutes + Math.max(event.durationMinutes, MARKER_MINUTES);
    if (eventEnd <= startMin) before.push(event);
    else if (event.anchorMinutes >= endMin) after.push(event);
    else visible.push(event);
  });
  return { visible, before, after };
};

const getHourHeights = (events, startMin, endMin, compactEmptyHours) => {
  const heights = [];
  for (let hourStart = startMin; hourStart < endMin; hourStart += 60) {
    const hourEnd = hourStart + 60;
    const occupied = events.some((event) => {
      if (event.anchorMinutes === null) return false;
      const eventEnd = event.anchorMinutes + Math.max(event.durationMinutes, MARKER_MINUTES);
      return event.anchorMinutes < hourEnd && eventEnd > hourStart;
    });
    heights.push(compactEmptyHours && !occupied ? COMPACT_HOUR_HEIGHT : HOUR_HEIGHT);
  }
  return heights;
};

const getGridPosition = (minute, hourHeights, startMin, endMin) => {
  const clampedMinute = Math.min(Math.max(minute, startMin), endMin);
  const completeHours = Math.floor((clampedMinute - startMin) / 60);
  const remainingMinutes = (clampedMinute - startMin) % 60;
  const completedHeight = hourHeights.slice(0, completeHours).reduce((total, height) => total + height, 0);
  if (completeHours >= hourHeights.length) return completedHeight;
  return completedHeight + (remainingMinutes / 60) * hourHeights[completeHours];
};

const getMinuteAtPosition = (position, hourHeights, startMin, endMin) => {
  let offset = 0;
  for (let index = 0; index < hourHeights.length; index += 1) {
    const height = hourHeights[index];
    if (position <= offset + height || index === hourHeights.length - 1) {
      const fraction = Math.min(Math.max((position - offset) / height, 0), 1);
      const minute = startMin + index * 60 + Math.round((fraction * 60) / 15) * 15;
      return Math.min(Math.max(minute, startMin), endMin - 15);
    }
    offset += height;
  }
  return startMin;
};

const formatClockTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export default function CalendarWeekView({
  weekDays,
  events,
  spans,
  today,
  onEventClick,
  onToggle,
  onCreateTask,
  startHour = 8,
  endHour = 22,
  weekStartsOn = "MONDAY",
  timeFormat = "H24",
  compactEmptyHours = true,
}) {
  const dayLabels = getWeekDayLabels(weekStartsOn);
  const [isNarrow, setIsNarrow] = useState(() => window.matchMedia("(max-width: 760px)").matches);
  const [selectedDay, setSelectedDay] = useState(() => (weekDays.includes(today) ? today : weekDays[0]));
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setIsNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const activeSelectedDay = weekDays.includes(selectedDay) ? selectedDay : weekDays.includes(today) ? today : weekDays[0];
  const visibleDays = isNarrow ? [activeSelectedDay] : weekDays;
  const gridStyle = { gridTemplateColumns: `50px repeat(${visibleDays.length}, minmax(0, 1fr))` };
  const gridMinWidth = isNarrow ? "320px" : "720px";
  const startMin = startHour * 60;
  const endMin = Math.max(endHour, startHour + 1) * 60;
  const hours = Array.from({ length: endMin / 60 - startHour }, (_, i) => startHour + i);
  const hourHeights = getHourHeights(events, startMin, endMin, compactEmptyHours);
  const hourOffsets = hourHeights.map((_, index) =>
    hourHeights.slice(0, index).reduce((total, height) => total + height, 0)
  );
  const gridHeight = hourHeights.reduce((total, height) => total + height, 0);
  const dragRef = useRef(null);
  const [selection, setSelection] = useState(null);

  const { spans: bars, rowCount } = placeSpans(spans, visibleDays[0], visibleDays[visibleDays.length - 1]);

  return (
    <div
      className="w-full overflow-hidden bg-surface border border-border/20 rounded-lg"
      role="region"
      aria-label="Weekly calendar"
      tabIndex={0}
    >
      <div className="calendar-mobile-days" role="tablist" aria-label="Choose calendar day">
        {weekDays.map((dateStr, index) => (
          <button
            type="button"
            role="tab"
            key={`mobile-day-${dateStr}`}
            aria-selected={activeSelectedDay === dateStr}
            onClick={() => setSelectedDay(dateStr)}
            onKeyDown={(event) => {
              const currentIndex = weekDays.indexOf(dateStr);
              const nextIndex = event.key === "ArrowRight"
                ? (currentIndex + 1) % weekDays.length
                : event.key === "ArrowLeft"
                  ? (currentIndex - 1 + weekDays.length) % weekDays.length
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? weekDays.length - 1
                      : currentIndex;
              if (nextIndex === currentIndex) return;
              event.preventDefault();
              setSelectedDay(weekDays[nextIndex]);
              event.currentTarget.parentElement.children[nextIndex]?.focus();
            }}
          >
            <span>{dayLabels[index]}</span>
            <span>{parseDate(dateStr).getUTCDate()}</span>
          </button>
        ))}
      </div>
      <div className="overflow-x-auto overflow-y-hidden overscroll-x-contain custom-scrollbar">
      {/* Day headers */}
      <div className="grid border-b border-border/20 bg-surface-muted/60 z-20" style={{ ...gridStyle, minWidth: gridMinWidth }}>
        <div className="border-r border-border/20" />
        {visibleDays.map((dateStr) => {
          const i = weekDays.indexOf(dateStr);
          const isToday = dateStr === today;
          return (
            <div
              key={`header-${dateStr}`}
              className={`p-2 text-center border-r border-border/20 last:border-r-0 ${isToday ? "bg-accent/10" : ""}`}
            >
              <div className={`text-xs font-bold ${isToday ? "text-accent" : "text-muted"}`}>{dayLabels[i]}</div>
              <div className={`text-lg font-light ${isToday ? "text-accent" : "text-ink"}`}>
                {parseDate(dateStr).getUTCDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day strip: multi-day bars */}
      <div className="grid border-b border-border/20 bg-surface-muted/35 z-10" style={{ ...gridStyle, minWidth: gridMinWidth }}>
        <div className="border-r border-border/20 flex items-center justify-center overflow-hidden">
          <span className="text-[9px] uppercase tracking-wider text-muted font-semibold -rotate-90 whitespace-nowrap">
            All Day
          </span>
        </div>
        <div className="relative min-h-[32px]" style={{ gridColumn: `span ${visibleDays.length}` }}>
          <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))` }}>
            {visibleDays.map((dateStr) => (
              <div key={`allday-bg-${dateStr}`} className="border-r border-border/20 last:border-r-0" />
            ))}
          </div>
          <div className="relative grid auto-rows-[20px] gap-y-1 py-1.5" style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))` }}>
            {bars.map((span) => (
              <CalendarSpanBar key={span.id} span={span} onClick={onEventClick} />
            ))}
            {rowCount === 0 && <div className="h-5" style={{ gridColumn: `span ${visibleDays.length}` }} />}
          </div>
        </div>
      </div>

      {/* Hour grid */}
      <div className="calendar-cork relative overflow-y-auto overscroll-contain bg-surface" style={{ minWidth: gridMinWidth }}>
        <div className="relative grid" style={{ ...gridStyle, minWidth: gridMinWidth, height: `${gridHeight}px` }}>
          <div className="absolute inset-0 grid pointer-events-none" style={gridStyle}>
            <div className="border-r border-border/20 bg-surface-muted/35" />
            {visibleDays.map((dateStr) => (
              <div
                key={`bg-${dateStr}`}
                className={`border-r border-border/20 last:border-r-0 ${dateStr === today ? "bg-accent/5" : ""}`}
              />
            ))}
          </div>

          {hours.map((hour, index) => (
            <div
              key={`line-${hour}`}
              className="absolute w-full flex items-start pointer-events-none"
              style={{ top: `${hourOffsets[index]}px`, height: `${hourHeights[index]}px` }}
            >
              <div className="w-[50px] shrink-0 text-right pr-2 relative z-10">
                <span className="text-[10px] text-muted absolute right-2 -top-2.5 bg-surface px-1 rounded">
                  {formatHourLabel(hour, timeFormat)}
                </span>
              </div>
              <div className="flex-1 border-t border-border/20 w-full mt-0" />
            </div>
          ))}

          {/* Spacer for the hour-label column */}
          <div />

          {visibleDays.map((dateStr) => {
            const dayEvents = events.filter((e) => e.date === dateStr && e.anchorMinutes !== null);
            const { visible, before, after } = splitByVisibleHours(dayEvents, startMin, endMin);
            const getMinuteFromPointer = (element, clientY) => {
              const rect = element.getBoundingClientRect();
              return getMinuteAtPosition(clientY - rect.top, hourHeights, startMin, endMin);
            };

            return (
              <div key={`timed-${dateStr}`} className="relative h-full">
                <button
                  type="button"
                  aria-label={`Create a task on ${dateStr}; click or drag to choose its time`}
                  title="Click to create a one-hour task or drag to select its duration"
                  onPointerDown={(event) => {
                    if (!onCreateTask || event.button > 0) return;
                    event.preventDefault();
                    try {
                      event.currentTarget.setPointerCapture(event.pointerId);
                    } catch (error) {
                      if (!(error instanceof DOMException) || error.name !== "NotFoundError") throw error;
                    }
                    const start = getMinuteFromPointer(event.currentTarget, event.clientY);
                    dragRef.current = { pointerId: event.pointerId, date: dateStr, start, end: start };
                    setSelection(dragRef.current);
                  }}
                  onPointerMove={(event) => {
                    if (dragRef.current?.pointerId !== event.pointerId) return;
                    const end = getMinuteFromPointer(event.currentTarget, event.clientY);
                    dragRef.current.end = end;
                    setSelection({ ...dragRef.current });
                  }}
                  onPointerUp={(event) => {
                    if (dragRef.current?.pointerId !== event.pointerId) return;
                    const drag = dragRef.current;
                    const end = getMinuteFromPointer(event.currentTarget, event.clientY);
                    const start = Math.min(drag.start, end);
                    const endMinute = Math.max(start + 15, Math.max(drag.start, end));
                    dragRef.current = { ...drag, completedAt: Date.now() };
                    setSelection(null);
                    const duration = Math.abs(end - drag.start) >= 15 ? endMinute - start : 60;
                    const finish = Math.min(start + duration, 23 * 60 + 59);
                    onCreateTask(drag.date, formatClockTime(start), formatClockTime(finish));
                  }}
                  onClick={(event) => {
                    if (!onCreateTask || Date.now() - (dragRef.current?.completedAt || 0) < 800) return;
                    const start = event.detail === 0
                      ? startMin
                      : getMinuteFromPointer(event.currentTarget, event.clientY);
                    onCreateTask(dateStr, formatClockTime(start), formatClockTime(Math.min(start + 60, 23 * 60 + 59)));
                  }}
                  onPointerCancel={() => {
                    dragRef.current = null;
                    setSelection(null);
                  }}
                  className="absolute inset-0 z-[1] w-full touch-pan-y cursor-crosshair bg-transparent text-left hover:bg-accent/[0.03] focus-visible:bg-accent/[0.05]"
                >
                  {selection?.date === dateStr && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1 right-1 rounded border border-accent/70 bg-accent/15"
                      style={{
                        top: `${getGridPosition(Math.min(selection.start, selection.end), hourHeights, startMin, endMin)}px`,
                        height: `${Math.max(
                          15,
                          getGridPosition(Math.max(selection.start, selection.end), hourHeights, startMin, endMin) -
                            getGridPosition(Math.min(selection.start, selection.end), hourHeights, startMin, endMin)
                        )}px`,
                      }}
                    />
                  )}
                </button>
                {before.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onEventClick(before[0])}
                    className="absolute top-0 left-1 right-1 z-20 text-[10px] text-ink bg-surface-muted hover:bg-surface rounded px-1"
                    title={before.map((e) => e.title).join(", ")}
                  >
                    ↑ {before.length} earlier
                  </button>
                )}

                {layoutDayEvents(visible).map((event) => {
                  const eventEnd = event.anchorMinutes + Math.max(event.durationMinutes, MARKER_MINUTES);
                  const top = getGridPosition(event.anchorMinutes, hourHeights, startMin, endMin);
                  const bottom = getGridPosition(eventEnd, hourHeights, startMin, endMin);
                  const height = Math.max(bottom - top, MIN_BLOCK_HEIGHT);
                  const isMarker = event.durationMinutes === 0;

                  return (
                    <div
                      key={event.id}
                      className="absolute p-0.5 z-10"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `calc(${(event.lane / event.laneCount) * 100}% + 2px)`,
                        width: `calc(${100 / event.laneCount}% - 4px)`,
                      }}
                    >
                      <CalendarEventCard
                        event={event}
                        onClick={onEventClick}
                        onToggle={onToggle}
                        timeFormat={timeFormat}
                        variant={isMarker ? "marker" : "block"}
                      />
                    </div>
                  );
                })}

                {after.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onEventClick(after[0])}
                    className="absolute bottom-0 left-1 right-1 z-20 text-[10px] text-ink bg-surface-muted hover:bg-surface rounded px-1"
                    title={after.map((e) => e.title).join(", ")}
                  >
                    ↓ {after.length} later
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
