// src/pages/DashboardPage.jsx
// Top to bottom: a slim "active now" strip, the upcoming agenda (today / this week), high
// priority and pinned tasks (a handful each), and every any-time task.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { setTaskPinned } from "../services/taskService";
import {
  buildAgendaItems,
  findNextToday,
  isItemActive,
  sortByDateThenTime,
  sortByTime,
  taskToItem,
} from "../utils/dashboardUtils";
import { addDays, getNowMinutesInTimezone, getTodayInTimezone, parseDate, sliceDate } from "../utils/dateUtils";
import ActiveTaskPanel from "../components/ActiveTaskPanel";
import AgendaPanel from "../components/AgendaPanel";
import AnyTimePanel from "../components/AnyTimePanel";
import TaskListPanel from "../components/TaskListPanel";
import { getPageData, setPageData } from "../utils/pageDataCache";

const CLOCK_TICK_MS = 30 * 1000;
const WEEK_WINDOW_DAYS = 7;
const PANEL_LIMIT = 5;

// Time-of-day greeting for the heading, e.g. "Good morning, Yavuz".
const greetingForHour = (hour) => {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const EMPTY_DATA = { key: null, upcoming: [], high: [], pinned: [], anytime: [], failed: {} };

/** A high-priority task still worth showing: undated, or not over yet. */
const isCurrent = (task, todayStr) => {
  if (task.timeType === "ANY_TIME") return true;
  if (task.timeType === "MULTI_DAY") return (sliceDate(task.rangeEndDate) || "") >= todayStr;
  return (sliceDate(task.date) || "") >= todayStr;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const timeZone = user?.timeZone || "Europe/Istanbul";
  const timeFormat = user?.timeFormat || "H24";
  const hideCompleted = user?.hideCompleted || false;

  const [now, setNow] = useState(() => new Date());
  const [reloadTick, setReloadTick] = useState(0);
  const cacheKey = `dashboard:${user?.id || "anonymous"}`;
  const [data, setData] = useState(() => getPageData(cacheKey) || EMPTY_DATA);

  // Keeps "today" and the active tasks fresh without reloading the page
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const todayStr = getTodayInTimezone(timeZone, now);
  const nowMinutes = getNowMinutesInTimezone(timeZone, now);
  const weekEnd = addDays(todayStr, WEEK_WINDOW_DAYS - 1);

  // New data when the day changes or after a pin change; "loading" = data is for another key
  const loadKey = `${cacheKey}|${todayStr}|${reloadTick}`;
  const loading = data.key !== loadKey;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const requests = {
        upcoming: { from: todayStr, to: weekEnd, limit: 500 },
        high: { priority: "HIGH", showCompleted: false, collapseSeries: true, today: todayStr, limit: 200 },
        pinned: { isPinned: true, collapseSeries: true, today: todayStr, limit: 100 },
        anytime: { timeType: "ANY_TIME", showCompleted: false, limit: 500 },
      };
      const names = Object.keys(requests);
      const results = await Promise.allSettled(names.map((name) => api.get("/tasks", { params: requests[name] })));
      if (cancelled) return;

      const next = { ...EMPTY_DATA, key: loadKey, failed: {} };
      results.forEach((result, index) => {
        const name = names[index];
        if (result.status === "fulfilled") next[name] = result.value.data.data || [];
        else next.failed[name] = true;
      });
      if (Object.keys(next.failed).length === names.length) toast.error("Failed to load tasks");
      setPageData(cacheKey, next);
      setData(next);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [loadKey, todayStr, weekEnd, cacheKey]);

  const panels = useMemo(() => {
    const keep = (item) => !(hideCompleted && item.isCompleted);

    const agenda = buildAgendaItems(data.upcoming, todayStr, weekEnd);
    const todayItems = sortByTime(agenda.filter((item) => item.date === todayStr)).filter(keep);
    const weekItems = sortByDateThenTime(agenda).filter(keep);

    // Only TIMED (running now) and MULTI_DAY (today inside the range) are "active"
    const active = todayItems.filter(
      (item) =>
        (item.timeType === "TIMED" || item.timeType === "MULTI_DAY") && isItemActive(item, todayStr, nowMinutes)
    );
    const next = findNextToday(
      todayItems.filter((item) => item.timeType !== "MULTI_DAY"),
      nowMinutes
    );

    const high = sortByDateThenTime(
      data.high.filter((task) => isCurrent(task, todayStr)).map((task) => taskToItem(task))
    );

    // Unfinished first, then by date (the sort is stable)
    const pinned = sortByDateThenTime(data.pinned.map((task) => taskToItem(task)))
      .filter(keep)
      .sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));

    const anytime = data.anytime.map((task) => taskToItem(task));

    return { todayItems, weekItems, active, next, high, pinned, anytime };
  }, [data, todayStr, weekEnd, nowMinutes, hideCompleted]);

  // ── Actions: optimistic update on every list, rolled back when the request fails ──
  const patchEverywhere = (match, patch) =>
    setData((prev) => {
      const apply = (list) => list.map((task) => (match(task) ? { ...task, ...patch } : task));
      return {
        ...prev,
        upcoming: apply(prev.upcoming),
        high: apply(prev.high),
        pinned: apply(prev.pinned),
        anytime: apply(prev.anytime),
      };
    });

  const handleToggleCompletion = async (item) => {
    const next = !item.isCompleted;
    const match = (task) => task.id === item.taskId;
    patchEverywhere(match, { isCompleted: next });
    try {
      await api.patch(`/tasks/${item.taskId}/toggle`);
    } catch {
      patchEverywhere(match, { isCompleted: !next });
      toast.error("Failed to update task status");
    }
  };

  // Pinning a series pins every occurrence, so the match covers the whole series
  const handleTogglePin = async (item, nextValue) => {
    const match = (task) => task.id === item.taskId || (item.seriesId != null && task.seriesId === item.seriesId);
    patchEverywhere(match, { isPinned: nextValue });
    try {
      await setTaskPinned(item.taskId, nextValue);
      toast.success(nextValue ? "Task pinned" : "Task unpinned");
      setReloadTick((tick) => tick + 1); // the pinned list gains or loses a row
    } catch {
      patchEverywhere(match, { isPinned: !nextValue });
      toast.error("Failed to update pin");
    }
  };

  const openTask = (item) => navigate(`/tasks/edit/${item.taskId}`);

  const common = {
    todayStr,
    timeFormat,
    onToggle: handleToggleCompletion,
    onTogglePin: handleTogglePin,
    onItemClick: openTask,
  };

  return (
    <div className="k-page">
      <header className="k-phead">
        <h1>
          {user?.displayName ? `${greetingForHour(new Date().getHours())}, ${user.displayName}` : "Dashboard"}
        </h1>
        <div className="k-phead__sub">
          {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(
            parseDate(todayStr)
          )}
        </div>
      </header>

      <div className="relative grid gap-5" aria-busy={loading}>
        {loading && data.key === null && (
          <div className="absolute inset-0 z-30 flex items-start justify-center bg-[color-mix(in_srgb,var(--paper)_70%,transparent)] pt-10 text-sm text-muted">
            Loading...
          </div>
        )}

        <ActiveTaskPanel
          activeItems={panels.active}
          nextItem={panels.next}
          todayStr={todayStr}
          nowMinutes={nowMinutes}
          timeFormat={timeFormat}
          onItemClick={openTask}
        />

        <div className="k-dgrid">
          <AgendaPanel
            todayItems={panels.todayItems}
            weekItems={panels.weekItems}
            weekDays={WEEK_WINDOW_DAYS}
            {...common}
          />
          <div className="k-dcol">
            <TaskListPanel
              title="Pinned"
              items={panels.pinned}
              emptyMessage="No pinned tasks yet"
              showDate
              limit={PANEL_LIMIT}
              viewAllTo="/tasks?isPinned=true"
              error={Boolean(data.failed.pinned)}
              {...common}
            />
            <TaskListPanel
              title="High priority"
              items={panels.high}
              emptyMessage="No high priority tasks"
              showDate
              limit={PANEL_LIMIT}
              viewAllTo="/tasks?priority=HIGH"
              error={Boolean(data.failed.high)}
              {...common}
            />
            <AnyTimePanel items={panels.anytime} error={Boolean(data.failed.anytime)} {...common} />
          </div>
        </div>
      </div>
    </div>
  );
}
