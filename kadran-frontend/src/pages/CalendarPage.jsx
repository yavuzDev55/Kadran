// src/pages/CalendarPage.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import CalendarWeekView from "../components/CalendarWeekView";
import CalendarMonthView from "../components/CalendarMonthView";
import TaskDetailModal from "../components/TaskDetailModal";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterSidebar from "../components/FilterSidebar";
import { setTaskPinned } from "../services/taskService";
import Switch from "../components/ui/Switch";
import DeskIllustration from "../components/DeskIllustration";
import { buildCalendarItems } from "../utils/calendarUtils";
import {
  addDays,
  getMonthDaysArray,
  getTodayInTimezone,
  getWeekDaysArray,
  parseDate,
  shiftMonth,
  startOfWeek,
} from "../utils/dateUtils";
import { DEFAULT_FILTERS } from "../utils/filters";

const VIEW_STORAGE_KEY = "kadran_calendar_view";
const COMPACT_HOURS_STORAGE_KEY = "kadran_calendar_compact_hours";

// ANY_TIME tasks never appear on the calendar, so they are not offered as a filter
const CALENDAR_TIME_TYPES = ["TIMED", "OPEN_ENDED", "MULTI_DAY", "DEADLINE"];

const readStoredView = () => {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY);
  } catch {
    return null;
  }
};

const readStoredCompactHours = () => {
  try {
    return localStorage.getItem(COMPACT_HOURS_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const timeZone = user?.timeZone || "Europe/Istanbul";
  const weekStartsOn = user?.weekStartsOn || "MONDAY";
  const dayStartHour = user?.dayStartHour ?? 8;
  const dayEndHour = user?.dayEndHour ?? 22;
  const timeFormat = user?.timeFormat || "H24";
  const hideCompletedPref = user?.hideCompleted || false;

  // "Today" always comes from the user's own timezone, never from the browser's
  const today = getTodayInTimezone(timeZone);

  // Last view the user was on > defaultView preference > week
  const [view, setViewState] = useState(() => {
    const stored = readStoredView();
    if (stored === "week" || stored === "month") return stored;
    return user?.defaultView === "MONTH" ? "month" : "week";
  });
  const [compactEmptyHours, setCompactEmptyHours] = useState(readStoredCompactHours);

  const setView = (next) => {
    setViewState(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // storage unavailable: the view just is not remembered
    }
  };

  const updateCompactHours = (compact) => {
    setCompactEmptyHours(compact);
    try {
      localStorage.setItem(COMPACT_HOURS_STORAGE_KEY, String(compact));
    } catch {
      // The preference still applies for this page session when storage is unavailable.
    }
  };

  // The day the visible week / month is derived from ('YYYY-MM-DD')
  const [anchor, setAnchor] = useState(() => getTodayInTimezone(timeZone));
  const [selectedEvent, setSelectedEvent] = useState(null);
  // { kind: "task" | "series", id, label } while the delete dialog is open
  const [pendingDelete, setPendingDelete] = useState(null);

  const defaultFilters = useMemo(
    () => ({ ...DEFAULT_FILTERS, showCompleted: !hideCompletedPref }),
    [hideCompletedPref]
  );
  const [filters, setFilters] = useState(defaultFilters);

  // ── Visible range ──
  const weekDays = useMemo(() => getWeekDaysArray(startOfWeek(anchor, weekStartsOn)), [anchor, weekStartsOn]);
  const anchorYear = Number(anchor.slice(0, 4));
  const anchorMonthIndex = Number(anchor.slice(5, 7)) - 1;
  const monthDays = useMemo(
    () => getMonthDaysArray(anchorYear, anchorMonthIndex, weekStartsOn),
    [anchorYear, anchorMonthIndex, weekStartsOn]
  );
  const currentMonthString = anchor.slice(0, 7);

  const viewStart = view === "week" ? weekDays[0] : monthDays[0];
  const viewEnd = view === "week" ? weekDays[6] : monthDays[monthDays.length - 1];

  // ── Data ──
  // The loaded tasks remember which range they belong to; "loading" is simply "the data on
  // screen is for another range" (so nothing sets state synchronously inside the effect).
  const [reloadTick, setReloadTick] = useState(0);
  const rangeKey = `${viewStart}|${viewEnd}|${reloadTick}`;
  const [data, setData] = useState({ key: null, tasks: [] });
  const tasks = data.tasks;
  const loading = data.key !== rangeKey;

  const setTasks = (updater) =>
    setData((prev) => ({ ...prev, tasks: typeof updater === "function" ? updater(prev.tasks) : updater }));
  const reloadTasks = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await api.get("/tasks", {
          params: { from: viewStart, to: viewEnd, limit: 500, showCompleted: true },
        });
        if (!cancelled) setData({ key: rangeKey, tasks: response.data.data || [] });
      } catch {
        if (!cancelled) {
          toast.error("Failed to load tasks");
          setData({ key: rangeKey, tasks: [] });
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [viewStart, viewEnd, rangeKey]);

  // ── Actions ──
  const patchTask = (taskId, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
    setSelectedEvent((prev) => (prev && prev.taskId === taskId ? { ...prev, ...patch } : prev));
  };

  const handleToggleCompletion = async (event) => {
    const next = !event.isCompleted;
    patchTask(event.taskId, { isCompleted: next });
    try {
      await api.patch(`/tasks/${event.taskId}/toggle`);
    } catch {
      patchTask(event.taskId, { isCompleted: !next });
      toast.error("Failed to update task status");
    }
  };

  // Pinning a series pins every occurrence
  const handleTogglePin = async (event, nextValue) => {
    const apply = (value) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === event.taskId || (event.seriesId != null && t.seriesId === event.seriesId)
            ? { ...t, isPinned: value }
            : t
        )
      );
      setSelectedEvent((prev) => (prev && prev.taskId === event.taskId ? { ...prev, isPinned: value } : prev));
    };
    apply(nextValue);
    try {
      await setTaskPinned(event.taskId, nextValue);
      toast.success(nextValue ? "Pinned to dashboard" : "Unpinned");
    } catch {
      apply(!nextValue);
      toast.error("Failed to update pin");
    }
  };

  const requestDelete = (event, scope) => {
    if (scope === "series" && event.seriesId != null) {
      setPendingDelete({ kind: "series", id: event.seriesId, label: event.title });
    } else {
      setPendingDelete({ kind: "task", id: event.taskId, label: event.title, inSeries: event.seriesId != null });
    }
  };

  const confirmDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;
    try {
      if (target.kind === "series") await api.delete(`/series/${target.id}`);
      else await api.delete(`/tasks/${target.id}`);
      toast.success(target.kind === "series" ? "Series deleted" : "Task deleted");
      setSelectedEvent(null);
      reloadTasks();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleEdit = (event, scope) => {
    setSelectedEvent(null);
    navigate(scope === "series" ? `/tasks/edit/${event.taskId}?scope=series` : `/tasks/edit/${event.taskId}`);
  };

  // ── Filtering (the range is already loaded, so this is client-side) ──
  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (filters.type && task.type !== filters.type) return false;
        if (filters.timeType && task.timeType !== filters.timeType) return false;
        if (filters.priority && task.priority !== filters.priority) return false;
        if (!filters.showCompleted && task.isCompleted) return false;
        if (filters.pinnedOnly && !task.isPinned) return false;
        if (filters.tags.length > 0 && !filters.tags.some((tag) => (task.tags || []).includes(tag))) return false;
        return true;
      }),
    [tasks, filters]
  );

  const { events, spans } = useMemo(
    () => buildCalendarItems(visibleTasks, viewStart, viewEnd),
    [visibleTasks, viewStart, viewEnd]
  );

  // ── Navigation ──
  const handlePrevious = () => setAnchor((a) => (view === "week" ? addDays(a, -7) : shiftMonth(a, -1)));
  const handleNext = () => setAnchor((a) => (view === "week" ? addDays(a, 7) : shiftMonth(a, 1)));
  const handleGoToToday = () => setAnchor(today);
  const handleCreateTask = (date, startTime, endTime) => {
    const params = new URLSearchParams({ date, startTime, endTime });
    navigate(`/tasks/new?${params.toString()}`);
  };

  const navLabel =
    view === "week"
      ? `${weekDays[0]} — ${weekDays[6]}`
      : new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(parseDate(anchor));

  const deleteTitle =
    pendingDelete?.kind === "series"
      ? "Delete the whole series?"
      : pendingDelete?.inSeries
        ? "Delete this occurrence?"
        : "Delete task?";
  const deleteMessage =
    pendingDelete?.kind === "series"
      ? `“${pendingDelete?.label}” and every one of its occurrences will be permanently deleted.`
      : pendingDelete?.inSeries
        ? "Only this occurrence is removed; the rest of the series stays. This cannot be undone."
        : "This task will be permanently deleted. This cannot be undone.";

  return (
    <div className="calendar-page mx-auto w-full p-2 md:p-4 pb-12">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-4">
        <div className="calendar-heading">
          <h1 className="font-title text-3xl font-normal text-ink">Calendar</h1>
          <DeskIllustration />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-surface-muted p-1 rounded border border-border/20" role="group" aria-label="Calendar view">
            {["week", "month"].map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={`px-4 py-1.5 text-sm font-semibold rounded transition capitalize ${
                  view === option ? "bg-surface text-ink border border-border/20" : "text-muted hover:text-ink"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGoToToday}
              className="ui-button ui-button--sm"
            >
              Today
            </button>
            <div className="flex items-center bg-surface rounded border border-border/25 overflow-hidden">
              <button
                type="button"
                onClick={handlePrevious}
                className="px-3 py-1.5 text-muted hover:text-ink hover:bg-surface-muted transition"
                aria-label={view === "week" ? "Previous week" : "Previous month"}
              >
                &lt;
              </button>
              <span className="px-4 text-sm font-semibold text-ink min-w-[180px] text-center">{navLabel}</span>
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 text-muted hover:text-ink hover:bg-surface-muted transition"
                aria-label={view === "week" ? "Next week" : "Next month"}
              >
                &gt;
              </button>
            </div>
          </div>
          {view === "week" && (
            <Switch
              label="Compact empty hours"
              checked={compactEmptyHours}
              onChange={updateCompactHours}
              className="text-xs"
            />
          )}
        </div>
      </div>

      <div className="calendar-workspace flex flex-col md:flex-row gap-4 items-start">
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(defaultFilters)}
          sections={{ timeType: CALENDAR_TIME_TYPES }}
        />

        <div className="relative flex-1 min-w-0 w-full">
          {loading && (
            <div className="absolute inset-0 bg-surface/75 z-30 flex items-center justify-center animate-pulse text-accent">
              Loading...
            </div>
          )}

          {view === "week" ? (
            <CalendarWeekView
              weekDays={weekDays}
              events={events}
              spans={spans}
              today={today}
              onEventClick={setSelectedEvent}
              onToggle={handleToggleCompletion}
              onCreateTask={handleCreateTask}
              startHour={dayStartHour}
              endHour={dayEndHour}
              weekStartsOn={weekStartsOn}
              timeFormat={timeFormat}
              compactEmptyHours={compactEmptyHours}
            />
          ) : (
            <CalendarMonthView
              monthDays={monthDays}
              events={events}
              spans={spans}
              currentMonthString={currentMonthString}
              today={today}
              onEventClick={setSelectedEvent}
              onToggle={handleToggleCompletion}
              weekStartsOn={weekStartsOn}
              timeFormat={timeFormat}
            />
          )}
        </div>
      </div>

      <TaskDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={requestDelete}
        onEdit={handleEdit}
        onTogglePin={handleTogglePin}
        onToggle={handleToggleCompletion}
        timeFormat={timeFormat}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={deleteTitle}
        message={deleteMessage}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
