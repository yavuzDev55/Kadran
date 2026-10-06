// src/pages/DashboardPage.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { normalizeTasksToEvents } from "../utils/calendarUtils";
import {
  addDaysToDateStr,
  getNowMinutesInTimezone,
  getOngoingRangeItems,
  getTodayInTimezone,
  isEventActive,
  sortByDateThenTime,
  sortByTime,
  taskToItem,
  timeToMinutes,
} from "../utils/dashboardUtils";
import ActiveTaskPanel from "../components/ActiveTaskPanel";
import AgendaPanel from "../components/AgendaPanel";
import TaskListPanel from "../components/TaskListPanel";
import TaskSearchPanel from "../components/TaskSearchPanel";

const CLOCK_TICK_MS = 30 * 1000;
const WEEK_WINDOW_DAYS = 7;
const HIGH_PRIORITY_WINDOW_DAYS = 14;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const timeZone = user?.timeZone || "Europe/Istanbul";
  const timeFormat = user?.timeFormat || "H24";
  const hideCompleted = user?.hideCompleted || false;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  // Keeps "today" and the active task fresh without reloading the page
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // No from/to: recurring patterns are stored with their first date only,
        // so they must be fetched whole and expanded on the client (same as CalendarPage).
        const response = await api.get("/tasks", { params: { limit: 100, showCompleted: true } });
        setTasks(response.data.data || []);
      } catch {
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const todayStr = getTodayInTimezone(timeZone, now);
  const nowMinutes = getNowMinutesInTimezone(timeZone, now);

  const panels = useMemo(() => {
    const windowEnd = addDaysToDateStr(todayStr, HIGH_PRIORITY_WINDOW_DAYS);
    const weekEnd = addDaysToDateStr(todayStr, WEEK_WINDOW_DAYS - 1);
    const keep = (item) => !(hideCompleted && item.isCompleted);

    // Occurrences from today through the longest window (recurring tasks expanded)
    const events = normalizeTasksToEvents(tasks, todayStr, windowEnd);
    // Multi-day ranges that started earlier but are still running
    const rangeItems = getOngoingRangeItems(tasks, todayStr);

    // Today: today's occurrences + running ranges + non-recurring pinned tasks
    // (pinned = show regardless of date)
    const todayEvents = events.filter((e) => e.date === todayStr);
    const todayBase = [...todayEvents, ...rangeItems];
    const todayTaskIds = new Set(todayBase.map((e) => e.taskId));
    const pinnedItems = tasks
      .filter((t) => t.isPinned && !t.isRecurring && !todayTaskIds.has(t.id))
      .map(taskToItem);
    const today = [...pinnedItems, ...sortByTime(todayBase)].filter(keep);

    // Week agenda: everything dated from today through weekEnd
    const week = sortByDateThenTime(
      [...events.filter((e) => e.date <= weekEnd), ...rangeItems]
    ).filter(keep);

    // Active: only today's occurrences
    const activeEvents = todayEvents.filter((e) => isEventActive(e, nowMinutes));
    const nextEvent = sortByTime(
      todayEvents.filter(
        (e) => !e.isCompleted && e.startTime && timeToMinutes(e.startTime) > nowMinutes
      )
    )[0];

    // High priority: unfinished only, dated ones within the window, plus undated (ANYTIME) ones
    const anytimeItems = tasks.filter((t) => t.timeType === "ANYTIME").map(taskToItem);
    const high = sortByDateThenTime(
      [...events, ...rangeItems, ...anytimeItems].filter((i) => i.priority === "HIGH" && !i.isCompleted)
    );

    const anytime = anytimeItems.filter(keep);

    return { today, week, activeEvents, nextEvent, high, anytime };
  }, [tasks, todayStr, nowMinutes, hideCompleted]);

  // Same optimistic update + rollback strategy as CalendarPage
  const handleToggleCompletion = async (taskId, date = null) => {
    const task = tasks.find((t) => t.id === taskId);
    const isRecurring = Boolean(task?.isRecurring);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (isRecurring && date) {
          const completed = new Set(t.completedDates || []);
          if (completed.has(date)) completed.delete(date);
          else completed.add(date);
          return { ...t, completedDates: [...completed] };
        }
        return { ...t, isCompleted: !t.isCompleted };
      })
    );

    try {
      await api.patch(`/tasks/${taskId}/toggle`, isRecurring && date ? { date } : {});
    } catch {
      toast.error("Failed to update task status");
      const response = await api.get("/tasks", { params: { limit: 100, showCompleted: true } });
      setTasks(response.data.data || []);
    }
  };

  const openTask = (item) => navigate(`/tasks/edit/${item.taskId}`);

  const common = { todayStr, timeFormat, onToggle: handleToggleCompletion, onItemClick: openTask };

  return (
    <div className="p-2 md:p-4 pb-12">
      <h1 className="text-xl font-bold text-slate-100 mb-4">Dashboard</h1>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/50 z-30 flex items-center justify-center animate-pulse text-blue-400">
            Loading...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ActiveTaskPanel
              activeEvents={panels.activeEvents}
              nextEvent={panels.nextEvent}
              nowMinutes={nowMinutes}
              timeFormat={timeFormat}
              onToggle={handleToggleCompletion}
            />
          </div>

          <div className="lg:row-span-3">
            <TaskSearchPanel todayStr={todayStr} timeFormat={timeFormat} />
          </div>

          <AgendaPanel
            todayItems={panels.today}
            weekItems={panels.week}
            weekDays={WEEK_WINDOW_DAYS}
            {...common}
          />
          <TaskListPanel title="High Priority" items={panels.high} emptyMessage="No high priority tasks." showDate {...common} />
          <div className="lg:col-span-2">
            <TaskListPanel title="Anytime Tasks" items={panels.anytime} emptyMessage="No anytime tasks." {...common} />
          </div>
        </div>
      </div>
    </div>
  );
}
