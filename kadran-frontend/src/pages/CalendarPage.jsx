import React, { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import CalendarWeekView from "../components/CalendarWeekView";
import { normalizeTasksToEvents, getWeekDaysArray } from "../utils/calendarUtils";

export default function CalendarPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const getStartOfWeek = (dateObj) => {
    const day = dateObj.getUTCDay() || 7;
    const monday = new Date(dateObj);
    if (day !== 1) monday.setUTCDate(dateObj.getUTCDate() - (day - 1));
    return monday.toISOString().slice(0, 10);
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date()));

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks", {
        params: { limit: 100, showCompleted: true }
      });
      setTasks(response.data.data || []);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  // --- YENİ: Toggle Completion API Call ---
  const handleToggleCompletion = async (taskId) => {
    // Optimistic UI update
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    ));

    try {
      await api.patch(`/tasks/${taskId}/toggle`);
    } catch (error) {
      toast.error("Failed to update task status");
      // Revert on failure
      fetchTasks();
    }
  };

  const weekDays = getWeekDaysArray(currentWeekStart);
  const viewEndDate = weekDays[6];
  const events = normalizeTasksToEvents(tasks, currentWeekStart, viewEndDate);

  const handlePreviousWeek = () => {
    const d = new Date(currentWeekStart);
    d.setUTCDate(d.getUTCDate() - 7);
    setCurrentWeekStart(d.toISOString().slice(0, 10));
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setUTCDate(d.getUTCDate() + 7);
    setCurrentWeekStart(d.toISOString().slice(0, 10));
  };

  // Make sure CalendarWeekView receives onToggle
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full mx-auto p-2 md:p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
        <h1 className="text-xl font-bold text-slate-100">Calendar</h1>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentWeekStart(getStartOfWeek(new Date()))} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition text-sm font-semibold mr-2">
            Today
          </button>
          <div className="flex items-center bg-slate-800 rounded border border-slate-600 overflow-hidden">
            <button onClick={handlePreviousWeek} className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition">&lt;</button>
            <span className="px-4 text-sm font-semibold text-slate-200 min-w-[180px] text-center">
              {currentWeekStart} — {viewEndDate}
            </span>
            <button onClick={handleNextWeek} className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition">&gt;</button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative border border-slate-700 rounded-lg">
        {loading && <div className="absolute inset-0 bg-slate-900/50 z-30 flex items-center justify-center animate-pulse text-blue-400">Loading...</div>}
        
        {/* Pass onToggle down */}
        <CalendarWeekView 
          weekDays={weekDays} 
          events={events} 
          onEventClick={(e) => toast(`Edit modal will open for: ${e.title}`)} 
          onToggle={handleToggleCompletion}
        />
      </div>
    </div>
  );
}