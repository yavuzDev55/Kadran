// src/pages/TasksPage.jsx
// List view. A recurring series is one row (collapseSeries=true) that expands into its
// occurrences; every occurrence has its own checkbox, edit and delete.

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterSidebar from "../components/FilterSidebar";
import { setTaskPinned } from "../services/taskService";
import { DEFAULT_FILTERS } from "../utils/filters";
import { formatTaskTime } from "../utils/formatTime";
import { getTodayInTimezone, sliceDate } from "../utils/dateUtils";
import { TASK_TYPES } from "../utils/taskRules";
import { getTaskDisplayColor } from "../utils/taskDisplaySettings";

const PAGE_SIZE = 50;
const FILTER_DEBOUNCE_MS = 250;
const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Title" },
  { value: "created", label: "Date created" },
  { value: "type", label: "Task type" },
];
const DEFAULT_TASK_FILTERS = { ...DEFAULT_FILTERS, sort: "date", order: "asc" };
const TASK_VIEW_STORAGE_KEY = "kadran_task_view";

const readTaskView = () => {
  try {
    return localStorage.getItem(TASK_VIEW_STORAGE_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
};

const PATTERN_LABELS = { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly" };

const typeLabel = (type) => TASK_TYPES.find((t) => t.id === type)?.label || type;

/** "2026-10-12 · 14:00 – 15:30": the day (single-day types) and the clock part. */
const describeWhen = (task, timeFormat) => {
  const time = formatTaskTime(task, timeFormat);
  if (task.timeType === "MULTI_DAY" || task.timeType === "ANY_TIME") return time;
  return [sliceDate(task.date), time].filter(Boolean).join(" · ");
};

/** Filters requested through the URL, e.g. /tasks?priority=HIGH (used by the dashboard links). */
const filtersFromSearch = (searchParams) => ({
  ...DEFAULT_TASK_FILTERS,
  priority: searchParams.get("priority") || "",
  type: searchParams.get("type") || "",
  timeType: searchParams.get("timeType") || "",
  pinnedOnly: searchParams.get("isPinned") === "true",
  sort: SORT_OPTIONS.some((option) => option.value === searchParams.get("sort"))
    ? searchParams.get("sort")
    : "date",
  order: searchParams.get("order") === "desc" ? "desc" : "asc",
});

const withoutKey = (object, key) => Object.fromEntries(Object.entries(object).filter(([k]) => k !== String(key)));

const errorMessage = (err, fallback) => err.response?.data?.error?.message || fallback;

function TagChips({ tags }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-muted text-link text-xs rounded border border-border/20"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}

function IconButton({ onClick, title, className = "", children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`ui-button ui-button--icon ${className}`}
    >
      {children}
    </button>
  );
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

/** One occurrence inside an expanded series. */
function OccurrenceRow({ task, timeFormat, onToggle, onEdit, onDelete }) {
  const accentColor = getTaskDisplayColor(task);
  return (
    <li
      style={{ "--task-color": accentColor }}
      className={`kadran-task kadran-task-row has-action type-${task.type.toLowerCase()} priority-${task.priority.toLowerCase()} ${
        task.timeType === "DEADLINE" ? "is-deadline" : task.timeType === "OPEN_ENDED" ? "is-open-ended" : ""
      } flex items-center gap-3 px-3 py-2 rounded ${task.isCompleted ? "is-completed" : ""}`}
    >
      {task.isCompletable ? (
        <input
          type="checkbox"
          checked={task.isCompleted}
          onChange={() => onToggle(task)}
          className="w-4 h-4 cursor-pointer accent-[rgb(var(--color-accent))] relative z-[1]"
        />
      ) : (
        <span className="w-4" />
      )}
      <span className={`task-title flex-1 text-sm ${task.isCompleted ? "text-muted" : ""}`}>
        <span>{describeWhen(task, timeFormat)}</span>
        {task.description && <span className="block text-xs text-muted mt-1">{task.description}</span>}
      </span>
      <button type="button" onClick={() => onEdit(task)} className="text-xs text-muted hover:text-ink px-2 py-1">
        Edit
      </button>
      <button
        type="button"
        onClick={() => onDelete(task)}
        className="text-xs text-muted hover:text-danger px-2 py-1"
      >
        Delete
      </button>
    </li>
  );
}

export default function TasksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const timeZone = user?.timeZone || "Europe/Istanbul";
  const timeFormat = user?.timeFormat || "H24";

  const [filters, setFilters] = useState(() => filtersFromSearch(searchParams));
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState(readTaskView);

  // seriesId -> { loading, tasks } for expanded series
  const [expanded, setExpanded] = useState({});
  // { kind: "task" | "series", id, label } while the delete dialog is open
  const [pendingDelete, setPendingDelete] = useState(null);

  const requestId = useRef(0);

  const buildParams = useCallback(
    (offset) => {
      const params = {
        collapseSeries: true,
        limit: PAGE_SIZE,
        offset,
        today: getTodayInTimezone(timeZone),
      };
      if (filters.q.trim()) params.q = filters.q.trim();
      if (filters.type) params.type = filters.type;
      if (filters.timeType) params.timeType = filters.timeType;
      if (filters.priority) params.priority = filters.priority;
      if (filters.tags.length > 0) params.tags = filters.tags.join(",");
      if (filters.pinnedOnly) params.isPinned = true;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      params.sort = filters.sort;
      params.order = filters.order;
      // The backend shows completed tasks unless it is told "false" explicitly
      params.showCompleted = filters.showCompleted;
      return params;
    },
    [filters, timeZone]
  );

  const updateSort = (sort) => {
    setFilters((current) => ({ ...current, sort }));
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("sort", sort);
      return next;
    }, { replace: true });
  };

  const updateOrder = () => {
    const order = filters.order === "asc" ? "desc" : "asc";
    setFilters((current) => ({ ...current, order }));
    setSearchParams((search) => {
      const next = new URLSearchParams(search);
      next.set("order", order);
      return next;
    }, { replace: true });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_TASK_FILTERS);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      ["priority", "type", "timeType", "isPinned", "sort", "order"].forEach((key) => {
        next.delete(key);
      });
      return next;
    }, { replace: true });
  };

  // Reload from the first page whenever a filter changes (debounced, so typing is cheap)
  useEffect(() => {
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/tasks", { params: buildParams(0) });
        if (id !== requestId.current) return;
        setTasks(res.data.data || []);
        setTotal(res.data.meta?.total ?? 0);
        setHasMore(Boolean(res.data.meta?.hasMore));
        setExpanded({});
      } catch {
        if (id === requestId.current) setError("Failed to load tasks.");
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [buildParams]);

  const reload = async () => {
    try {
      const res = await api.get("/tasks", { params: buildParams(0) });
      setTasks(res.data.data || []);
      setTotal(res.data.meta?.total ?? 0);
      setHasMore(Boolean(res.data.meta?.hasMore));
      setExpanded({});
    } catch {
      setError("Failed to load tasks.");
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get("/tasks", { params: buildParams(tasks.length) });
      setTasks((prev) => [...prev, ...(res.data.data || [])]);
      setHasMore(Boolean(res.data.meta?.hasMore));
    } catch {
      toast.error("Failed to load more tasks.");
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Row updates ──
  const patchTask = (taskId, patch) =>
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));

  const patchSeriesRows = (seriesId, patch) =>
    setTasks((prev) => prev.map((t) => (t.seriesId === seriesId ? { ...t, ...patch } : t)));

  const toggleCompletion = async (task) => {
    patchTask(task.id, { isCompleted: !task.isCompleted });
    try {
      await api.patch(`/tasks/${task.id}/toggle`);
    } catch {
      patchTask(task.id, { isCompleted: task.isCompleted });
      toast.error("Failed to update task status.");
    }
  };

  const togglePin = async (task) => {
    const next = !task.isPinned;
    const apply = (value) => {
      if (task.seriesId != null) {
        patchSeriesRows(task.seriesId, { isPinned: value });
        setExpanded((prev) =>
          prev[task.seriesId]?.tasks
            ? {
                ...prev,
                [task.seriesId]: {
                  ...prev[task.seriesId],
                  tasks: prev[task.seriesId].tasks.map((t) => ({ ...t, isPinned: value })),
                },
              }
            : prev
        );
      } else {
        patchTask(task.id, { isPinned: value });
      }
    };
    apply(next);
    try {
      await setTaskPinned(task.id, next);
    } catch {
      apply(!next);
      toast.error("Failed to update pin.");
    }
  };

  // ── Series expansion ──
  const toggleExpand = async (seriesId) => {
    if (expanded[seriesId]) {
      setExpanded((prev) => withoutKey(prev, seriesId));
      return;
    }
    setExpanded((prev) => ({ ...prev, [seriesId]: { loading: true, tasks: [] } }));
    try {
      const res = await api.get(`/series/${seriesId}`);
      setExpanded((prev) => ({ ...prev, [seriesId]: { loading: false, tasks: res.data.data.tasks } }));
    } catch {
      toast.error("Failed to load the series.");
      setExpanded((prev) => withoutKey(prev, seriesId));
    }
  };

  const toggleOccurrence = async (seriesId, occurrence) => {
    const setDone = (value) => {
      setExpanded((prev) => ({
        ...prev,
        [seriesId]: {
          ...prev[seriesId],
          tasks: prev[seriesId].tasks.map((t) => (t.id === occurrence.id ? { ...t, isCompleted: value } : t)),
        },
      }));
      // Keep the "n/total done" counter on the collapsed row in step
      const delta = value ? 1 : -1;
      setTasks((prev) =>
        prev.map((t) =>
          t.seriesId === seriesId && t.seriesInfo
            ? { ...t, seriesInfo: { ...t.seriesInfo, completed: t.seriesInfo.completed + delta } }
            : t
        )
      );
    };
    setDone(!occurrence.isCompleted);
    try {
      await api.patch(`/tasks/${occurrence.id}/toggle`);
    } catch {
      setDone(occurrence.isCompleted);
      toast.error("Failed to update task status.");
    }
  };

  // ── Delete ──
  const confirmDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;
    try {
      if (target.kind === "series") await api.delete(`/series/${target.id}`);
      else await api.delete(`/tasks/${target.id}`);
      toast.success(target.kind === "series" ? "Series deleted." : "Task deleted.");
      await reload(); // a removed occurrence can change which one stands for its series
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete."));
    }
  };

  const editOccurrence = (task) => navigate(`/tasks/edit/${task.id}`);

  const rows = tasks;
  const updateViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(TASK_VIEW_STORAGE_KEY, mode);
    } catch {
      toast.error("View preference could not be saved in this browser.");
    }
  };

  return (
    <div className="w-full p-2 md:p-4 pb-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-title text-3xl font-normal text-ink">Tasks</h1>
        <Link
          to="/tasks/new"
          className="ui-button ui-button--primary ui-button--sm md:hidden"
        >
          + New task
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
          sections={{ search: true, dates: true }}
        />

        <div className="flex-1 min-w-0 w-full">
          {error && <div className="p-3 mb-4 bg-danger/5 border border-danger/40 text-danger rounded">{error}</div>}

          <div className="ui-panel p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border/20 pb-3">
              <h2 className="text-xl font-semibold text-ink">
                My Tasks
                {!loading && <span className="ml-2 text-sm font-normal text-muted">({total})</span>}
              </h2>
              <div className="flex items-center gap-2 text-sm text-ink">
                <div className="flex items-center rounded-md border border-border/20 bg-surface-muted p-1" role="group" aria-label="Task layout">
                  <button
                    type="button"
                    aria-label="List view"
                    aria-pressed={viewMode === "list"}
                    onClick={() => updateViewMode("list")}
                    className={`grid h-8 w-8 place-items-center rounded transition ${
                      viewMode === "list" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                      <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Grid view"
                    aria-pressed={viewMode === "grid"}
                    onClick={() => updateViewMode("grid")}
                    className={`grid h-8 w-8 place-items-center rounded transition ${
                      viewMode === "grid" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                      <rect x="4" y="4" width="7" height="7" rx="1" />
                      <rect x="13" y="4" width="7" height="7" rx="1" />
                      <rect x="4" y="13" width="7" height="7" rx="1" />
                      <rect x="13" y="13" width="7" height="7" rx="1" />
                    </svg>
                  </button>
                </div>
                <label htmlFor="task-sort" className="text-muted">
                  Sort by
                </label>
                <select
                  id="task-sort"
                  value={filters.sort}
                  onChange={(event) => updateSort(event.target.value)}
                  className="ui-input w-auto px-2 py-1.5"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={updateOrder}
                  aria-label={`Sort ${filters.order === "asc" ? "descending" : "ascending"}`}
                  title={`Currently ${filters.order === "asc" ? "ascending" : "descending"}`}
                  className="ui-button px-2.5"
                >
                  {filters.order === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-muted text-center py-6">Loading tasks...</p>
            ) : rows.length === 0 ? (
              <p className="text-muted text-center py-6">No tasks found matching your filters.</p>
            ) : (
              <ul className={viewMode === "grid" ? "tasks-grid" : "flex flex-col gap-4"}>
                {rows.map((task) => {
                  const isSeries = task.seriesId != null;
                  const info = task.seriesInfo;
                  const open = isSeries ? expanded[task.seriesId] : null;
                  const allDone = isSeries && info ? info.completed >= info.total : task.isCompleted;
                  const accentColor = getTaskDisplayColor(task);

                  return (
                    <li
                      key={task.id}
                      style={{ "--task-color": accentColor }}
                      className={`kadran-task kadran-task-row has-action type-${task.type.toLowerCase()} priority-${task.priority.toLowerCase()} ${
                        task.timeType === "DEADLINE" ? "is-deadline" : task.timeType === "OPEN_ENDED" ? "is-open-ended" : ""
                      } p-4 rounded-md transition ${viewMode === "grid" ? "tasks-grid__card" : ""} ${allDone ? "is-completed" : ""}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-4 min-w-0">
                          {!isSeries && task.isCompletable ? (
                            <input
                              type="checkbox"
                              checked={task.isCompleted}
                              onChange={() => toggleCompletion(task)}
                              className="w-5 h-5 mt-1 cursor-pointer accent-[rgb(var(--color-accent))] relative z-[1]"
                            />
                          ) : isSeries ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(task.seriesId)}
                              className="w-5 h-5 mt-1 text-muted hover:text-ink text-xs relative z-[1]"
                              title={open ? "Hide occurrences" : "Show occurrences"}
                              aria-expanded={Boolean(open)}
                            >
                              {open ? "▼" : "▶"}
                            </button>
                          ) : (
                            <span className="w-5" />
                          )}

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={`task-title font-semibold text-base ${allDone ? "text-muted" : "text-ink"}`}
                              >
                                {task.title}
                              </p>
                              <span className="text-[10px] font-semibold text-muted">
                                {task.priority}
                              </span>
                            </div>

                            {isSeries && task.series?.description && (
                              <p className="text-sm text-muted mt-1">{task.series.description}</p>
                            )}
                            {task.description && (
                              <p className="text-sm text-muted mt-1">
                                {isSeries ? "This occurrence: " : ""}
                                {task.description}
                              </p>
                            )}

                            <div className="text-xs text-muted mt-2 flex flex-wrap gap-2 items-center">
                              <span className="uppercase font-bold text-link px-2 py-0.5 rounded border border-border/30">
                                {typeLabel(task.type)}
                              </span>
                              {isSeries && info ? (
                                <>
                                  <span className="text-link px-2 py-0.5 rounded border border-border/30 text-[10px] font-semibold">
                                    🔁 {PATTERN_LABELS[task.series?.pattern] || "Recurring"}
                                  </span>
                                  <span>
                                    {info.completed}/{info.total} done
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {info.firstDate} → {info.lastDate}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span>•</span>
                                  <span>{describeWhen(task, timeFormat) || "No date"}</span>
                                </>
                              )}
                            </div>

                            {isSeries && info && (
                              <p className="text-xs text-muted mt-1">Next: {describeWhen(task, timeFormat)}</p>
                            )}

                            <TagChips tags={task.tags} />
                          </div>
                        </div>

                        <div className="relative z-[1] flex items-center gap-1 shrink-0">
                          <IconButton
                            onClick={() => togglePin(task)}
                            title={task.isPinned ? "Unpin from dashboard" : "Pin to dashboard"}
                            className={task.isPinned ? "opacity-100" : "opacity-40 grayscale hover:opacity-90"}
                          >
                            📌
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              navigate(isSeries ? `/tasks/edit/${task.id}?scope=series` : `/tasks/edit/${task.id}`)
                            }
                            title={isSeries ? "Edit the whole series" : "Edit"}
                            className="text-muted hover:text-ink"
                          >
                            ✎
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              setPendingDelete(
                                isSeries
                                  ? { kind: "series", id: task.seriesId, label: task.title }
                                  : { kind: "task", id: task.id, label: task.title }
                              )
                            }
                            title={isSeries ? "Delete the whole series" : "Delete"}
                            className="text-muted hover:text-danger hover:bg-danger/10"
                          >
                            <TrashIcon />
                          </IconButton>
                        </div>
                      </div>

                      {isSeries && open && (
                        <div className="mt-3 pt-3 border-t border-border/20">
                          {open.loading ? (
                            <p className="text-xs text-muted">Loading occurrences...</p>
                          ) : (
                            <ul className="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-1">
                              {open.tasks.map((occurrence) => (
                                <OccurrenceRow
                                  key={occurrence.id}
                                  task={occurrence}
                                  timeFormat={timeFormat}
                                  onToggle={(o) => toggleOccurrence(task.seriesId, o)}
                                  onEdit={editOccurrence}
                                  onDelete={(o) =>
                                    setPendingDelete({
                                      kind: "task",
                                      id: o.id,
                                      label: `${task.title} (${sliceDate(o.date)})`,
                                    })
                                  }
                                />
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                    </li>
                  );
                })}
              </ul>
            )}

            {hasMore && !loading && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="ui-button disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.kind === "series" ? "Delete the whole series?" : "Delete task?"}
        message={
          pendingDelete?.kind === "series"
            ? `“${pendingDelete?.label}” and every one of its occurrences will be permanently deleted.`
            : `“${pendingDelete?.label}” will be permanently deleted. This cannot be undone.`
        }
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
