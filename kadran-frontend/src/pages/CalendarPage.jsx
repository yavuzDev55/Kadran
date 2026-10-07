// src/pages/CalendarPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import CalendarWeekView from "../components/CalendarWeekView";
import CalendarMonthView from "../components/CalendarMonthView";
import TaskDetailModal from "../components/TaskDetailModal";
import { setTaskPinned } from "../services/taskService";
import ConfirmDialog from "../components/ConfirmDialog";
import { normalizeTasksToEvents, getWeekDaysArray, getMonthDaysArray } from "../utils/calendarUtils";

const VIEW_STORAGE_KEY = "kadran_calendar_view";

const getStartOfWeek = (dateObj, weekStartsOn) => {
  const utcDay = dateObj.getUTCDay();
  const result = new Date(dateObj);
  if (weekStartsOn === "SUNDAY") {
    result.setUTCDate(dateObj.getUTCDate() - utcDay);
  } else {
    const diff = utcDay === 0 ? 6 : utcDay - 1;
    result.setUTCDate(dateObj.getUTCDate() - diff);
  }
  return result.toISOString().slice(0, 10);
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const weekStartsOn = user?.weekStartsOn || "MONDAY";
  const dayStartHour = user?.dayStartHour ?? 8;
  const dayEndHour   = user?.dayEndHour ?? 22;
  const timeFormat   = user?.timeFormat || "H24";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // FIX: view now persists across page reloads via localStorage.
  // Priority: last view the user was on > defaultView preference > "week".
  // Once the user has switched tabs at least once, that choice sticks —
  // a reload no longer snaps back to the preference.
  const [view, setViewState] = useState(() => {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "week" || stored === "month") return stored;
    return user?.defaultView === "MONTH" ? "month" : "week";
  });

  const setView = (next) => {
    setViewState(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  };

  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // FIX: browser's native confirm() replaced with an in-app dialog.
  // confirmDeleteId holds the taskId pending deletion; null means closed.
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [filterType, setFilterType] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [hideCompleted, setHideCompleted] = useState(() => user?.hideCompleted || false);

  const currentWeekStart = getStartOfWeek(referenceDate, weekStartsOn);
  const weekDays = getWeekDaysArray(currentWeekStart);

  const currentYear = referenceDate.getUTCFullYear();
  const currentMonthIndex = referenceDate.getUTCMonth();
  const monthDays = getMonthDaysArray(currentYear, currentMonthIndex, weekStartsOn);
  const currentMonthString = referenceDate.toISOString().slice(0, 7);

  const viewStartDate = view === "week" ? weekDays[0] : monthDays[0];
  const viewEndDate = view === "week" ? weekDays[6] : monthDays[41];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks", {
        params: { limit: 100, showCompleted: true },
      });
      setTasks(response.data.data || []);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompletion = async (taskId, date = null) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (t.isRecurring && date) {
          const existing = new Set(t.completedDates || []);
          if (existing.has(date)) existing.delete(date);
          else existing.add(date);
          return { ...t, completedDates: [...existing] };
        }
        return { ...t, isCompleted: !t.isCompleted };
      })
    );

    try {
      await api.patch(`/tasks/${taskId}/toggle`, date ? { date } : {});
    } catch (error) {
      toast.error("Failed to update task status");
      fetchTasks();
    }
  };

  const handleTogglePin = async (taskId, nextValue) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, isPinned: nextValue } : t)));
    setSelectedEvent((prev) => (prev && prev.taskId === taskId ? { ...prev, isPinned: nextValue } : prev));
    try {
      await setTaskPinned(taskId, nextValue);
      toast.success(nextValue ? "Pinned to dashboard" : "Unpinned");
    } catch (error) {
      toast.error("Failed to update pin");
      fetchTasks();
    }
  };

  // Opens the confirm dialog instead of deleting immediately.
  const requestDeleteTask = (taskId) => setConfirmDeleteId(taskId);

  const cancelDeleteTask = () => setConfirmDeleteId(null);

  const confirmDeleteTask = async () => {
    const taskId = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!taskId) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Task deleted successfully");
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setSelectedEvent(null);
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleEditTask = (taskId) => {
    setSelectedEvent(null);
    navigate(`/tasks/edit/${taskId}`);
  };

  const allEvents = normalizeTasksToEvents(tasks, viewStartDate, viewEndDate);

  const filteredEvents = allEvents.filter((event) => {
    if (filterType !== "ALL" && event.type !== filterType) return false;
    if (filterPriority !== "ALL" && event.priority !== filterPriority) return false;
    if (hideCompleted && event.isCompleted) return false;
    return true;
  });

  const handlePrevious = () => {
    const d = new Date(referenceDate);
    if (view === "week") d.setUTCDate(d.getUTCDate() - 7);
    else d.setUTCMonth(d.getUTCMonth() - 1);
    setReferenceDate(d);
  };

  const handleNext = () => {
    const d = new Date(referenceDate);
    if (view === "week") d.setUTCDate(d.getUTCDate() + 7);
    else d.setUTCMonth(d.getUTCMonth() + 1);
    setReferenceDate(d);
  };

  const handleGoToToday = () => setReferenceDate(new Date());

  const getNavLabel = () => {
    if (view === "week") return `${weekDays[0]} — ${weekDays[6]}`;
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(referenceDate);
  };

  // Used to tailor the confirm dialog's message for recurring series
  const taskPendingDelete = tasks.find((t) => t.id === confirmDeleteId);

  return (
    <div className="flex flex-col w-full mx-auto p-2 md:p-4 pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <h1 className="text-xl font-bold text-slate-100">Calendar</h1>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-800 p-1 rounded border border-slate-700">
            <button
              onClick={() => setView("week")}
              className={`px-4 py-1 text-sm font-semibold rounded transition ${view === "week" ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              className={`px-4 py-1 text-sm font-semibold rounded transition ${view === "month" ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Month
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleGoToToday} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition text-sm font-semibold">
              Today
            </button>
            <div className="flex items-center bg-slate-800 rounded border border-slate-600 overflow-hidden">
              <button onClick={handlePrevious} className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition">&lt;</button>
              <span className="px-4 text-sm font-semibold text-slate-200 min-w-[180px] text-center">
                {getNavLabel()}
              </span>
              <button onClick={handleNext} className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition">&gt;</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4 p-2.5 bg-slate-800/40 border border-slate-700/60 rounded-lg">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Filters:</span>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="ALL">All Types</option>
          <option value="COURSE">Course</option>
          <option value="EXAM">Exam</option>
          <option value="HOMEWORK">Homework</option>
          <option value="CUSTOM">Custom</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="ALL">All Priorities</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="LOW">Low Priority</option>
        </select>

        <label className="flex items-center gap-2 ml-auto cursor-pointer hover:bg-slate-800 p-1.5 rounded transition">
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
            className="w-4 h-4 accent-blue-500 cursor-pointer rounded"
          />
          <span className="text-sm font-medium text-slate-300">Hide Completed</span>
        </label>
      </div>

      <div className="relative mt-2">
        {loading && <div className="absolute inset-0 bg-slate-900/50 z-30 flex items-center justify-center animate-pulse text-blue-400">Loading...</div>}

        {view === "week" ? (
          <CalendarWeekView
            weekDays={weekDays}
            events={filteredEvents}
            onEventClick={setSelectedEvent}
            onToggle={handleToggleCompletion}
            startHour={dayStartHour}
            endHour={dayEndHour}
            weekStartsOn={weekStartsOn}
            timeFormat={timeFormat}
          />
        ) : (
          <CalendarMonthView
            monthDays={monthDays}
            events={filteredEvents}
            currentMonthString={currentMonthString}
            onEventClick={setSelectedEvent}
            onToggle={handleToggleCompletion}
            weekStartsOn={weekStartsOn}
            timeFormat={timeFormat}
          />
        )}
      </div>

      <TaskDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={requestDeleteTask}
        onEdit={handleEditTask}
        onTogglePin={handleTogglePin}
        timeFormat={timeFormat}
        onToggle={(taskId, date) => {
          handleToggleCompletion(taskId, date);
          setSelectedEvent((prev) =>
            prev ? { ...prev, isCompleted: !prev.isCompleted } : prev
          );
        }}
      />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title={taskPendingDelete?.isRecurring ? "Delete recurring series?" : "Delete task?"}
        message={
          taskPendingDelete?.isRecurring
            ? "This will permanently delete the entire recurring series, including all past and future occurrences. This cannot be undone."
            : "This task will be permanently deleted. This cannot be undone."
        }
        confirmLabel="Delete"
        danger
        onConfirm={confirmDeleteTask}
        onCancel={cancelDeleteTask}
      />
    </div>
  );
}