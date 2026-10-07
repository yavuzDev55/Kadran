import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const TASK_TYPES = [
  { id: "COURSE", label: "Course", defaultTime: "TIMED" },
  { id: "EXAM", label: "Exam", defaultTime: "TIMED" },
  { id: "HOMEWORK", label: "Homework", defaultTime: "DEADLINE" },
  { id: "CUSTOM", label: "Custom", defaultTime: "TIMED" },
];

const DAYS_OF_WEEK = [
  { id: "MONDAY", label: "Monday" },
  { id: "TUESDAY", label: "Tuesday" },
  { id: "WEDNESDAY", label: "Wednesday" },
  { id: "THURSDAY", label: "Thursday" },
  { id: "FRIDAY", label: "Friday" },
  { id: "SATURDAY", label: "Saturday" },
  { id: "SUNDAY", label: "Sunday" },
];

// Place above the TaskCreatePage function
const PALETTE = [
  '#3b82f6','#ef4444','#22c55e','#94a3b8',
  '#f59e0b','#8b5cf6','#ec4899','#14b8a6',
  '#f97316','#64748b','#06b6d4','#a3e635',
];

function ColorPicker({ value, onChange, typeDefault }) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* "Default" option */}
      <button
        type="button"
        onClick={() => onChange(null)}
        title="Use type default"
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition ${
          value === null ? 'border-white' : 'border-slate-600 hover:border-slate-400'
        }`}
        style={{ backgroundColor: typeDefault }}
      >
        {value === null && <span className="text-white font-bold">✓</span>}
      </button>
      {PALETTE.map((hex) => (
        <button
          key={hex}
          type="button"
          onClick={() => onChange(hex)}
          title={hex}
          className={`w-7 h-7 rounded-full border-2 transition ${
            value === hex ? 'border-white scale-110' : 'border-transparent hover:border-slate-400'
          }`}
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  );
}

export default function TaskCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams(); // edit modunda dolu, yeni görevde undefined
  const isEditMode = Boolean(id);
  const [loadingTask, setLoadingTask] = useState(isEditMode);
  const [selectedType, setSelectedType] = useState("COURSE");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [tagsInput, setTagsInput] = useState("");

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("WEEKLY");
  const [weeklySchedules, setWeeklySchedules] = useState({});
  const [recurrenceDay, setRecurrenceDay] = useState(1);
  const [recurrenceStart, setRecurrenceStart] = useState("");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");

  const [timeType, setTimeType] = useState("TIMED");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [rangeStartDate, setRangeStartDate] = useState("");
  const [rangeStartTime, setRangeStartTime] = useState("");
  const [rangeEndDate, setRangeEndDate] = useState("");
  const [rangeEndTime, setRangeEndTime] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const TYPE_COLORS = {
    COURSE: '#3b82f6', EXAM: '#ef4444', HOMEWORK: '#22c55e', CUSTOM: '#94a3b8',
  };

  const [color, setColor] = useState(null); // null = use type default
  const [isCompletable, setIsCompletable] = useState(true);
  const [isPinned, setIsPinned] = useState(false);

  // Edit modunda mevcut görevi yükle ve form alanlarını doldur
  useEffect(() => {
    if (!isEditMode) return;

    const fetchTask = async () => {
      try {
        const res = await api.get(`/tasks/${id}`);
        const t = res.data.data;

        setSelectedType(t.type);
        setTitle(t.title);
        setDescription(t.description || "");
        setPriority(t.priority);
        setTagsInput((t.tags || []).join(", "));
        setIsRecurring(t.isRecurring);
        setColor(t.color ?? null);
        setIsCompletable(t.isCompletable !== false);
        setIsPinned(t.isPinned === true);

        if (t.isRecurring) {
          setRecurrencePattern(t.recurrencePattern || "WEEKLY");
          setRecurrenceStart(t.recurrenceStart ? t.recurrenceStart.slice(0, 10) : "");
          setRecurrenceEnd(t.recurrenceEnd ? t.recurrenceEnd.slice(0, 10) : "");
          setRecurrenceDay(t.recurrenceDay || 1);

          if (t.isFlexibleSchedule && t.schedules) {
            const schedMap = {};
            t.schedules.forEach(s => {
              schedMap[s.dayOfWeek] = { startTime: s.startTime, endTime: s.endTime };
            });
            setWeeklySchedules(schedMap);
          } else {
            setStartTime(t.startTime || "");
            setEndTime(t.endTime || "");
          }
        } else {
          setTimeType(t.timeType);
          if (t.timeType === "TIMED" || t.timeType === "DEADLINE") {
            setDate(t.date ? t.date.slice(0, 10) : "");
            setStartTime(t.startTime || "");
            setEndTime(t.endTime || "");
          } else if (t.timeType === "DATE_RANGE") {
            setRangeStartDate(t.rangeStartDate ? t.rangeStartDate.slice(0, 10) : "");
            setRangeStartTime(t.rangeStartTime || "");
            setRangeEndDate(t.rangeEndDate ? t.rangeEndDate.slice(0, 10) : "");
            setRangeEndTime(t.rangeEndTime || "");
          }
        }
      } catch (err) {
        toast.error("Failed to load task");
        navigate("/");
      } finally {
        setLoadingTask(false);
      }
    };

    fetchTask();
  }, [id, isEditMode]);

  const handleTypeChange = (typeId) => {
    setSelectedType(typeId);
    if (typeId === "COURSE" || typeId === "EXAM") {
      setTimeType("TIMED");
    } else if (typeId === "HOMEWORK") {
      setTimeType("DEADLINE");
    } else if (typeId === "CUSTOM") {
      setTimeType("TIMED_OPEN");
    }
  };

  const handleScheduleTimeChange = (day, field, value) => {
    setWeeklySchedules(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || { startTime: "", endTime: "" }),
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formattedTags = tagsInput
        ? tagsInput.split(",").map(t => t.trim()).filter(Boolean)
        : [];

      const payload = {
        title,
        description: description || null,
        type: selectedType,
        priority,
        isRecurring,
        tags: formattedTags,
        color: color,
        isCompletable: isCompletable,
        isPinned: isPinned
      };

      if (isRecurring) {
        payload.recurrencePattern = recurrencePattern;
        payload.recurrenceStart = recurrenceStart || new Date().toISOString().slice(0, 10);
        payload.recurrenceEnd = recurrenceEnd || null;

        if (recurrencePattern === "WEEKLY") {
          const activeSchedules = Object.entries(weeklySchedules)
            .filter(([_, times]) => times.startTime && times.endTime)
            .map(([dayOfWeek, times]) => ({
              dayOfWeek,
              startTime: times.startTime,
              endTime: times.endTime
            }));

          if (activeSchedules.length > 0) {
            payload.isFlexibleSchedule = true;
            payload.schedules = activeSchedules;
            payload.timeType = "TIMED";
            payload.date = payload.recurrenceStart;
            // EKLENEN KISIM: Backend'in beklediği günler dizisi
            payload.recurrenceDays = activeSchedules.map(s => s.dayOfWeek);
          } else {
            throw new Error("Please configure at least one day with start and end times for weekly recurrence.");
          }
        } else if (recurrencePattern === "MONTHLY") {
          payload.timeType = "TIMED";
          payload.recurrenceDay = Number(recurrenceDay);
          payload.date = payload.recurrenceStart;
          payload.startTime = startTime || "09:00";
          payload.endTime = endTime || "10:00";
        } else {
          payload.timeType = "TIMED";
          payload.date = payload.recurrenceStart;
          payload.startTime = startTime || "09:00";
          payload.endTime = endTime || "10:00";
        }
      } else {
        payload.timeType = selectedType === "COURSE" || selectedType === "EXAM" ? "TIMED" : selectedType === "HOMEWORK" ? "DEADLINE" : timeType;

        if (payload.timeType === "TIMED") {
          payload.date = date;
          payload.startTime = startTime || undefined;
          payload.endTime = endTime || undefined;
        } else if (payload.timeType === "DEADLINE") {
          payload.date = date;
        } else if (payload.timeType === "DATE_RANGE") {
          payload.rangeStartDate = rangeStartDate;
          payload.rangeStartTime = rangeStartTime || null;
          payload.rangeEndDate = rangeEndDate;
          payload.rangeEndTime = rangeEndTime || null;
        }
      }

      if (isEditMode) {
        await api.patch(`/tasks/${id}`, payload);
        toast.success("Task updated successfully!");
      } else {
        await api.post("/tasks", payload);
        toast.success("Task created successfully!");
      }
      navigate("/");
      navigate("/");
    } catch (err) {
      const errDetail = err.response?.data?.error?.details;
      const errMsg = err.response?.data?.error?.message;
      setError(JSON.stringify(errDetail) || errMsg || err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  if (loadingTask) {    
    return (      
      <div className="flex items-center justify-center h-64 text-slate-400">        
        Loading task...      
      </div>    
    );  
  }
  
  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 mb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100">
          {isEditMode ? "Edit Task" : "Create New Task"}
        </h1>
        <Link to="/" className="text-sm text-slate-400 hover:text-white transition">
          &larr; Back to Tasks
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {TASK_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => handleTypeChange(type.id)}
            className={`p-3 rounded-lg border text-left transition ${
              selectedType === type.id
                ? "bg-blue-600 border-blue-500 text-white shadow-lg"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <div className="font-bold text-sm">{type.label}</div>
            <div className="text-xs opacity-80 mt-0.5">
              {type.id === "COURSE" && "Timed Lecture"}
              {type.id === "EXAM" && "Single Exam"}
              {type.id === "HOMEWORK" && "Deadline Task"}
              {type.id === "CUSTOM" && "Flexible Options"}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm whitespace-pre-wrap">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Algorithms Lecture"
              className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes..."
              rows="2"
              className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. important, midterm, project"
              className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {!isRecurring && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Time Type</label>
                <select
                  value={
                    selectedType === "COURSE" || selectedType === "EXAM"
                      ? "TIMED"
                      : selectedType === "HOMEWORK"
                      ? "DEADLINE"
                      : timeType
                  }
                  onChange={(e) => setTimeType(e.target.value)}
                  disabled={selectedType !== "CUSTOM"}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                >
                  <option value="TIMED">Timed (start + end time)</option>
                  <option value="TIMED_OPEN">Timed Open (start time only)</option>
                  <option value="DEADLINE">Deadline (date only)</option>
                  <option value="DATE_RANGE">Date Range</option>
                  <option value="ANYTIME">Anytime (no date or time)</option>
                </select>
              </div>
            )}
          </div>

          {selectedType !== "EXAM" && (
            <div className="border-t border-slate-700 pt-3 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm font-semibold text-slate-300">Repeat this task (Recurring)</span>
              </label>

              {isRecurring && (
                <div className="flex flex-col gap-3 mt-3 p-3 bg-slate-900/50 rounded border border-slate-700/50">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Pattern</label>
                    <select
                      value={recurrencePattern}
                      onChange={(e) => setRecurrencePattern(e.target.value)}
                      className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly (Custom hours per day)</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>

                  {recurrencePattern === "WEEKLY" && (
                    <div className="flex flex-col gap-2">
                      <label className="block text-xs text-slate-400 font-semibold">Select Days and Set Hours:</label>
                      {DAYS_OF_WEEK.map((day) => {
                        const daySchedule = weeklySchedules[day.id] || { startTime: "", endTime: "" };
                        const isActive = Boolean(daySchedule.startTime || daySchedule.endTime);

                        return (
                          <div key={day.id} className={`p-2 rounded border flex flex-col md:flex-row md:items-center justify-between gap-2 ${isActive ? 'bg-slate-800 border-blue-500/50' : 'bg-slate-900/40 border-slate-800'}`}>
                            <span className="text-xs font-medium text-slate-200 w-24">{day.label}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={daySchedule.startTime}
                                onChange={(e) => handleScheduleTimeChange(day.id, 'startTime', e.target.value)}
                                className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                              />
                              <span className="text-slate-400 text-xs">to</span>
                              <input
                                type="time"
                                value={daySchedule.endTime}
                                onChange={(e) => handleScheduleTimeChange(day.id, 'endTime', e.target.value)}
                                className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {recurrencePattern === "MONTHLY" && (
                    <>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Day of Month (1-31, or -1 for last day)</label>
                        <input
                          type="number"
                          min="-1"
                          max="31"
                          value={recurrenceDay}
                          onChange={(e) => setRecurrenceDay(e.target.value)}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Start Time *</label>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full p-1.5 rounded bg-slate-900 border border-slate-600 text-slate-100 text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">End Time *</label>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full p-1.5 rounded bg-slate-900 border border-slate-600 text-slate-100 text-xs"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {recurrencePattern === "DAILY" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Start Time *</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full p-1.5 rounded bg-slate-900 border border-slate-600 text-slate-100 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">End Time *</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full p-1.5 rounded bg-slate-900 border border-slate-600 text-slate-100 text-xs"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Recurrence Start *</label>
                      <input
                        type="date"
                        value={recurrenceStart}
                        onChange={(e) => setRecurrenceStart(e.target.value)}
                        className="w-full p-1.5 rounded bg-slate-900 border border-slate-600 text-slate-100 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Recurrence End (Optional)</label>
                      <input
                        type="date"
                        value={recurrenceEnd}
                        onChange={(e) => setRecurrenceEnd(e.target.value)}
                        className="w-full p-1.5 rounded bg-slate-900 border border-slate-600 text-slate-100 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isRecurring && (
            <>
              {((selectedType === "COURSE" || selectedType === "EXAM") || (selectedType === "CUSTOM" && timeType === "TIMED")) && (
                <div className="flex flex-col gap-4 p-3 bg-slate-900/50 rounded border border-slate-700/50">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Start Time *</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">End Time *</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {((selectedType === "CUSTOM" && timeType === "TIMED_OPEN")) && (
                <div className="flex flex-col gap-4 p-3 bg-slate-900/50 rounded border border-slate-700/50">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Start Time *</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500">No end time — task appears as an open-ended event.</p>
                </div>
              )}

              {(selectedType === "HOMEWORK" || (selectedType === "CUSTOM" && timeType === "DEADLINE")) && (
                <div className="p-3 bg-slate-900/50 rounded border border-slate-700/50">
                  <label className="block text-xs text-slate-400 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                    required
                  />
                </div>
              )}

              {selectedType === "CUSTOM" && timeType === "DATE_RANGE" && (
                <div className="flex flex-col gap-3 p-3 bg-slate-900/50 rounded border border-slate-700/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Start Date *</label>
                      <input
                        type="date"
                        value={rangeStartDate}
                        onChange={(e) => setRangeStartDate(e.target.value)}
                        className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={rangeStartTime}
                        onChange={(e) => setRangeStartTime(e.target.value)}
                        className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">End Date *</label>
                      <input
                        type="date"
                        value={rangeEndDate}
                        onChange={(e) => setRangeEndDate(e.target.value)}
                        className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">End Time</label>
                      <input
                        type="time"
                        value={rangeEndTime}
                        onChange={(e) => setRangeEndTime(e.target.value)}
                        className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(selectedType === "CUSTOM" && timeType === "ANYTIME") && (
                <div className="p-3 bg-slate-900/50 rounded border border-slate-700/50 text-xs text-slate-400">
                  No date or time required. This task will appear in the "Anytime" section.
                </div>
              )}
            </>
          )}

          {/* Color picker */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Task Color</label>
            <ColorPicker value={color} onChange={setColor} typeDefault={TYPE_COLORS[selectedType]} />
          </div>

          {/* Completable toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isCompletable"
              checked={isCompletable}
              onChange={(e) => setIsCompletable(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor="isCompletable" className="text-sm text-slate-300 cursor-pointer">
              This task can be marked as complete
            </label>
          </div>

          {/* Pin toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor="isPinned" className="text-sm text-slate-300 cursor-pointer">
              📌 Pin this task (listed in the dashboard's Pinned panel)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition disabled:bg-blue-800"
          >
            {loading
              ? (isEditMode ? "Saving..." : "Creating...")
              : (isEditMode ? "Save Changes" : `Create ${selectedType} Task`)}
          </button>
        </form>
      </div>
    </div>
  );
}