import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import CalendarWeekView from "../components/CalendarWeekView";
import CalendarMonthView from "../components/CalendarMonthView";
import TaskDetailModal from "../components/TaskDetailModal";
import { normalizeTasksToEvents, getWeekDaysArray, getMonthDaysArray } from "../utils/calendarUtils";

export default function CalendarPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState("week");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  
  const [selectedEvent, setSelectedEvent] = useState(null);

  // --- Filtre State'leri ---
  const [filterType, setFilterType] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [hideCompleted, setHideCompleted] = useState(false);

  const getStartOfWeek = (dateObj) => {
    const day = dateObj.getUTCDay() || 7;
    const monday = new Date(dateObj);
    if (day !== 1) monday.setUTCDate(dateObj.getUTCDate() - (day - 1));
    return monday.toISOString().slice(0, 10);
  };

  const currentWeekStart = getStartOfWeek(referenceDate);
  const weekDays = getWeekDaysArray(currentWeekStart);
  
  const currentYear = referenceDate.getUTCFullYear();
  const currentMonthIndex = referenceDate.getUTCMonth();
  const monthDays = getMonthDaysArray(currentYear, currentMonthIndex);
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
        params: { limit: 100, showCompleted: true }
      });
      setTasks(response.data.data || []);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompletion = async (taskId) => {
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    ));
    try {
      await api.patch(`/tasks/${taskId}/toggle`);
    } catch (error) {
      toast.error("Failed to update task status");
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task? (If it's recurring, all instances will be deleted)")) return;
    
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Task deleted successfully");
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      setSelectedEvent(null);
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleEditTask = (taskId) => {
    setSelectedEvent(null);
    navigate(`/tasks/edit/${taskId}`);
  };

  // 1. Önce API'den gelen veriyi takvim için normalleştir (günlere dağıt)
  const allEvents = normalizeTasksToEvents(tasks, viewStartDate, viewEndDate);

  // 2. Ardından kullanıcının seçtiği filtrelere göre filtrele
  const filteredEvents = allEvents.filter(event => {
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
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(referenceDate);
  };

  return (
    <div className="flex flex-col w-full mx-auto p-2 md:p-4 pb-12">
      {/* Üst Navigasyon */}
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
      
      {/* Filtreleme Çubuğu */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-2.5 bg-slate-800/40 border border-slate-700/60 rounded-lg">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Filters:</span>
        
        <select 
          value={filterType} 
          onChange={e => setFilterType(e.target.value)}
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
          onChange={e => setFilterPriority(e.target.value)}
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
            onChange={e => setHideCompleted(e.target.checked)}
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
          />
        ) : (
          <CalendarMonthView 
            monthDays={monthDays} 
            events={filteredEvents}
            currentMonthString={currentMonthString}
            onEventClick={setSelectedEvent} 
            onToggle={handleToggleCompletion}
          />
        )}
      </div>

      <TaskDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={handleDeleteTask}
        onEdit={handleEditTask}
        onToggle={(taskId) => {          
          handleToggleCompletion(taskId); 
          // Modalda anlık güncelleme için selectedEvent'i güncelle
          setSelectedEvent(prev =>      
            prev ? { ...prev, isCompleted: !prev.isCompleted } : prev 
          );                              
        }}                                
      />
    </div>
  );
}