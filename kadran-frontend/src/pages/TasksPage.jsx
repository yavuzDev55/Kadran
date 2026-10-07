import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import ConfirmDialog from "../components/ConfirmDialog";
import { setTaskPinned } from "../services/taskService";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tagInputs, setTagInputs] = useState({});

  const [filterType, setFilterType] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchTags();
  }, [filterType, filterPriority, filterTag, showCompleted, filterFrom, filterTo]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showCompleted) params.append("showCompleted", "true");
      if (filterType) params.append("category", filterType);
      if (filterPriority) params.append("priority", filterPriority);
      if (filterTag) params.append("tags", filterTag);
      if (filterFrom) params.append("from", filterFrom);
      if (filterTo) params.append("to", filterTo);
      params.append("limit", "50");

      const response = await api.get(`/tasks?${params.toString()}`);
      setTasks(response.data.data || []); 
    } catch (err) {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get("/tags");
      setAllTags(response.data.tags || []);
    } catch (err) {
      console.error("Failed to load tags", err);
    }
  };

  const toggleTaskCompletion = async (task) => {
    if (task.isRecurring) {
      toast.error("Recurring tasks must be completed per-occurrence from the Calendar page.");
      return;
    }
    try {
      await api.patch(`/tasks/${task.id}/toggle`);
      setTasks(tasks.map((t) =>
        t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t
      ));
    } catch (err) {
      toast.error("Failed to update task status.");
    }
  };

  const toggleTaskPin = async (task) => {
    const next = !task.isPinned;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isPinned: next } : t)));
    try {
      await setTaskPinned(task.id, next);
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isPinned: !next } : t)));
      toast.error("Failed to update pin.");
    }
  };

  const requestDeleteTask = (taskId) => setConfirmDeleteId(taskId);

  const confirmDeleteTask = async () => {
    const taskId = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!taskId) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter((task) => task.id !== taskId));
      fetchTags();
      toast.success("Task deleted.");
    } catch (err) {
      toast.error("Failed to delete task.");
    }
  };

  const handleAddTagToTask = async (taskId, tagName) => {
    const trimmedTag = tagName?.trim();
    if (!trimmedTag) return;

    try {
      const response = await api.post(`/tasks/${taskId}/tags`, { name: trimmedTag });
      const updatedTask = response.data.data;
      setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
      setTagInputs({ ...tagInputs, [taskId]: "" });
      fetchTags();
    } catch (err) {
      toast.error("Failed to add tag: " + (err.response?.data?.error?.message || "Unknown error"));
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 mb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Tasks</h1>
        {/* + New Task ve Logout butonları bu kısımdan tamamen kaldırıldı */}
      </div>

      {error && <div className="p-3 mb-4 bg-red-900/50 border border-red-500 text-red-200 rounded">{error}</div>}

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-md mb-6 flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Category</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
            >
              <option value="">All Categories</option>
              <option value="COURSE">Course</option>
              <option value="EXAM">Exam</option>
              <option value="HOMEWORK">Homework</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Priority</label>
            <select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">From Date</label>
            <input 
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">To Date</label>
            <input 
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
            />
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-700">
            <span className="text-xs text-slate-400 mr-2 font-medium">Filter by Tag:</span>
            <button
              onClick={() => setFilterTag("")}
              className={`px-2 py-0.5 text-xs rounded border transition ${!filterTag ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setFilterTag(tag.name)}
                className={`px-2 py-0.5 text-xs rounded border transition ${filterTag === tag.name ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <label className="flex items-center gap-2 cursor-pointer p-1">
            <input 
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-xs text-slate-300 font-medium">Show Completed Tasks</span>
          </label>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
        <h2 className="text-xl mb-4 border-b border-slate-600 pb-2 font-semibold text-slate-100">My Tasks</h2>
        
        {loading ? (
          <p className="text-slate-400 text-center py-6">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-slate-400 text-center py-6">No tasks found matching your filters.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {[...tasks].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)).map((task) => (
              <li key={task.id} className={`p-4 rounded-md border transition ${task.isCompleted ? 'bg-slate-900/50 border-slate-800 opacity-75' : 'bg-slate-700 border-slate-600'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <input 
                      type="checkbox" 
                      checked={task.isCompleted}
                      onChange={() => toggleTaskCompletion(task)}
                      className="w-5 h-5 mt-1 cursor-pointer accent-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-base ${task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                          {task.title}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          task.priority === 'HIGH' ? 'bg-red-900 text-red-200' :
                          task.priority === 'MEDIUM' ? 'bg-amber-900 text-amber-200' : 'bg-green-900 text-green-200'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-sm text-slate-300 mt-1">{task.description}</p>
                      )}

                      <div className="text-xs text-slate-400 mt-2 flex flex-wrap gap-2 items-center">
                        <span className="uppercase font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900">{task.type}</span>
                        <span>•</span>
                        <span>Time: {task.timeType}</span>
                        <span>•</span>
                        {task.timeType === "DATE_RANGE" ? (
                          <span>{task.rangeStartDate?.slice(0, 10)} {task.rangeStartTime || ""} &rarr; {task.rangeEndDate?.slice(0, 10)} {task.rangeEndTime || ""}</span>
                        ) : (
                          <span>{task.date ? task.date.slice(0, 10) : "No date"} {task.startTime ? `(${task.startTime} - ${task.endTime})` : ""}</span>
                        )}

                        {task.isRecurring && (
                          <span className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-900 text-[10px] font-semibold">
                            Recurring ({task.recurrencePattern})
                          </span>
                        )}
                      </div>

                      {task.schedules && task.schedules.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.schedules.map((s, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-600">
                              {s.dayOfWeek}: {s.startTime} - {s.endTime}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-900 text-blue-400 text-xs rounded border border-slate-600">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleTaskPin(task)}
                    className={`p-2 rounded transition hover:bg-slate-600/50 ${task.isPinned ? 'opacity-100' : 'opacity-40 grayscale hover:opacity-90'}`}
                    title={task.isPinned ? "Unpin from dashboard" : "Pin to dashboard"}
                  >
                    📌
                  </button>
                  <button
                    onClick={() => requestDeleteTask(task.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-600/50 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new tag (e.g. urgent)..."
                      value={tagInputs[task.id] || ""}
                      onChange={(e) => setTagInputs({ ...tagInputs, [task.id]: e.target.value })}
                      className="flex-1 p-1.5 text-sm rounded bg-slate-900 border border-slate-600 text-slate-100"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleAddTagToTask(task.id, tagInputs[task.id])}
                      className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded transition"
                    >
                      Add Tag
                    </button>
                  </div>

                  {allTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className="text-[11px] text-slate-400 mr-1">Existing tags:</span>
                      {allTags.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleAddTagToTask(task.id, t.name)}
                          className="text-[11px] px-2 py-0.5 bg-slate-900 hover:bg-blue-900/50 text-slate-300 rounded border border-slate-700 transition"
                        >
                          +{t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
        
        <ConfirmDialog
          open={confirmDeleteId !== null}
          title="Delete task?"
          message="This task will be permanently deleted. This cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteTask}
          onCancel={() => setConfirmDeleteId(null)}
        />

    </div>
  );
}