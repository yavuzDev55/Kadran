// src/pages/TaskCreatePage.jsx
// Create a task, or edit one. Four modes:
//   create           new task (optionally recurring: creates one real task per occurrence)
//   edit-single      a normal task: every field editable
//   edit-occurrence  one occurrence of a series: only its day and time (and the series pin)
//   edit-series      (?scope=series) the fields shared by every occurrence of a series

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import TagCombobox from "../components/TagCombobox";
import { addYears, getTodayInTimezone, sliceDate, WEEKDAYS } from "../utils/dateUtils";
import {
  MAX_SERIES_YEARS,
  TASK_RULES,
  TASK_TYPES,
  TIME_TYPE_LABELS,
  TYPE_COLORS,
  canRecur,
} from "../utils/taskRules";

const DAY_LABELS = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const PATTERN_LABELS = { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly" };

const PALETTE = [
  "#3b82f6", "#ef4444", "#22c55e", "#94a3b8",
  "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#64748b", "#06b6d4", "#a3e635",
];

const DEFAULT_DEADLINE_TIME = "23:59";

const inputClass =
  "w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-60";
const smallInputClass =
  "w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:border-blue-500";

function ColorPicker({ value, onChange, typeDefault }) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        type="button"
        onClick={() => onChange(null)}
        title="Use type default"
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition ${
          value === null ? "border-white" : "border-slate-600 hover:border-slate-400"
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
            value === hex ? "border-white scale-110" : "border-transparent hover:border-slate-400"
          }`}
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

/** Day + clock inputs for one time type (a day range for multi-day, nothing for any-time). */
function TimeFields({ timeType, form, set, showDate = true }) {
  if (timeType === "MULTI_DAY") {
    const sameDay = form.rangeStartDate && form.rangeStartDate === form.rangeEndDate;
    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start day *">
            <input
              type="date"
              value={form.rangeStartDate}
              onChange={(e) => set({ rangeStartDate: e.target.value })}
              className={smallInputClass}
              required
            />
          </Field>
          <Field label="End day *">
            <input
              type="date"
              value={form.rangeEndDate}
              min={form.rangeStartDate || undefined}
              onChange={(e) => set({ rangeEndDate: e.target.value })}
              className={smallInputClass}
              required
            />
          </Field>
        </div>
        <p className="text-[11px] text-slate-500">
          {sameDay
            ? "Same start and end day: a one-day task, shown as an all-day item on the calendar."
            : "Whole days only. Shown as a bar across the days on the calendar."}
        </p>
      </div>
    );
  }

  if (timeType === "ANY_TIME") {
    return (
      <div className="p-3 bg-slate-900/50 rounded border border-slate-700/50 text-xs text-slate-400">
        No date or time. This task is listed under "Any time" on the dashboard and never appears on the calendar.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {showDate && (
        <Field label="Date *">
          <input
            type="date"
            value={form.date}
            onChange={(e) => set({ date: e.target.value })}
            className={smallInputClass}
            required
          />
        </Field>
      )}
      {(timeType === "TIMED" || timeType === "OPEN_ENDED") && (
        <Field label="Start time *">
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => set({ startTime: e.target.value })}
            className={smallInputClass}
            required
          />
        </Field>
      )}
      {timeType === "TIMED" && (
        <Field label="End time *">
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => set({ endTime: e.target.value })}
            className={smallInputClass}
            required
          />
        </Field>
      )}
      {timeType === "DEADLINE" && (
        <Field label="Due time" hint="Defaults to 23:59.">
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => set({ endTime: e.target.value })}
            className={smallInputClass}
          />
        </Field>
      )}
    </div>
  );
}

const emptyForm = (type, today) => {
  const rule = TASK_RULES[type];
  return {
    type,
    title: "",
    description: "",
    priority: rule.priority,
    color: null,
    isCompletable: rule.completable.default,
    isPinned: false,
    tags: [],
    timeType: rule.timeTypes[0],
    date: today,
    startTime: "",
    endTime: rule.timeTypes[0] === "DEADLINE" ? DEFAULT_DEADLINE_TIME : "",
    rangeStartDate: today,
    rangeEndDate: today,
    recurring: false,
    pattern: "WEEKLY",
    recStart: today,
    recEnd: "",
    weekDays: [],
    slots: {},
    monthDay: 1,
  };
};

/** Backend validation details -> readable lines. */
const describeError = (err) => {
  const data = err.response?.data?.error;
  if (data?.details && Object.keys(data.details).length > 0) {
    return Object.entries(data.details)
      .map(([field, message]) => `${field}: ${message}`)
      .join("\n");
  }
  return data?.message || err.message || "Request failed";
};

export default function TaskCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const wantsSeriesScope = searchParams.get("scope") === "series";

  const timeZone = user?.timeZone || "Europe/Istanbul";
  const today = useMemo(() => getTodayInTimezone(timeZone), [timeZone]);

  const [mode, setMode] = useState(id ? "loading" : "create");
  const [form, setForm] = useState(() => emptyForm("COURSE", getTodayInTimezone(timeZone)));
  const [existingTags, setExistingTags] = useState([]); // tags already on the series (edit-series)
  const [loaded, setLoaded] = useState(null); // the task as loaded, to send only real changes
  const [seriesInfo, setSeriesInfo] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = mode !== "create" && mode !== "loading";
  const rule = TASK_RULES[form.type];
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  // ── Load the task when editing ──
  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api.get(`/tasks/${id}`);
        if (cancelled) return;
        const t = res.data.data;

        const base = emptyForm(t.type, today);
        const loadedForm = {
          ...base,
          title: t.title,
          description: t.description || "",
          priority: t.priority,
          color: t.color ?? null,
          isCompletable: t.isCompletable !== false,
          isPinned: t.isPinned === true,
          tags: t.tags || [],
          timeType: t.timeType,
          date: sliceDate(t.date) || "",
          startTime: t.startTime || "",
          endTime: t.endTime || "",
          rangeStartDate: sliceDate(t.rangeStartDate) || "",
          rangeEndDate: sliceDate(t.rangeEndDate) || "",
        };
        setForm(loadedForm);
        setLoaded(loadedForm);

        if (t.seriesId != null) {
          const seriesRes = await api.get(`/series/${t.seriesId}`);
          if (cancelled) return;
          const series = seriesRes.data.data;
          setSeriesInfo({ ...series, taskCount: series.tasks.length, seriesId: t.seriesId });
          setExistingTags(t.tags || []);
          if (wantsSeriesScope) setForm({ ...loadedForm, description: series.description || "" });
          setMode(wantsSeriesScope ? "edit-series" : "edit-occurrence");
        } else {
          setMode("edit-single");
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load the task.");
          navigate("/tasks");
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, today, wantsSeriesScope, navigate]);

  // ── Form behaviour ──
  const handleTypeChange = (type) => {
    setForm((prev) => {
      const prevRule = TASK_RULES[prev.type];
      const nextRule = TASK_RULES[type];
      const timeType = nextRule.timeTypes.includes(prev.timeType) ? prev.timeType : nextRule.timeTypes[0];
      return {
        ...prev,
        type,
        timeType,
        // Replace a default only if the user has not changed it
        priority: prev.priority === prevRule.priority ? nextRule.priority : prev.priority,
        isCompletable:
          prev.isCompletable === prevRule.completable.default || !nextRule.completable.editable
            ? nextRule.completable.default
            : prev.isCompletable,
        endTime: timeType === "DEADLINE" && !prev.endTime ? DEFAULT_DEADLINE_TIME : prev.endTime,
        recurring: prev.recurring && nextRule.recurrence && canRecur(type, timeType),
      };
    });
  };

  const handleTimeTypeChange = (timeType) => {
    setForm((prev) => ({
      ...prev,
      timeType,
      startTime: timeType === "DEADLINE" ? "" : prev.startTime,
      endTime:
        timeType === "DEADLINE"
          ? prev.endTime || DEFAULT_DEADLINE_TIME
          : timeType === "TIMED"
            ? prev.endTime === DEFAULT_DEADLINE_TIME && prev.timeType === "DEADLINE" ? "" : prev.endTime
            : "",
      recurring: prev.recurring && canRecur(prev.type, timeType),
    }));
  };

  const toggleWeekDay = (day) => {
    setForm((prev) => {
      const selected = prev.weekDays.includes(day);
      const weekDays = selected ? prev.weekDays.filter((d) => d !== day) : [...prev.weekDays, day];
      const slots = { ...prev.slots };
      if (selected) delete slots[day];
      else slots[day] = { startTime: prev.startTime, endTime: prev.timeType === "TIMED" ? prev.endTime : "" };
      return { ...prev, weekDays: WEEKDAYS.filter((d) => weekDays.includes(d)), slots };
    });
  };

  const setSlot = (day, patch) =>
    setForm((prev) => ({ ...prev, slots: { ...prev.slots, [day]: { ...prev.slots[day], ...patch } } }));

  const recurrenceMax = form.recStart ? addYears(form.recStart, MAX_SERIES_YEARS) : undefined;
  const showRecurrence = mode === "create" && canRecur(form.type, form.timeType);

  // ── Submit ──
  const buildTimeFields = (source) => {
    switch (source.timeType) {
      case "TIMED":
        return { date: source.date, startTime: source.startTime, endTime: source.endTime };
      case "OPEN_ENDED":
        return { date: source.date, startTime: source.startTime };
      case "DEADLINE":
        return { date: source.date, endTime: source.endTime || DEFAULT_DEADLINE_TIME };
      case "MULTI_DAY":
        return { rangeStartDate: source.rangeStartDate, rangeEndDate: source.rangeEndDate };
      default:
        return {};
    }
  };

  const showWarnings = (warnings) => {
    (warnings || []).forEach((message) => toast(message, { icon: "⚠️", duration: 6000 }));
  };

  const submitCreate = async () => {
    const payload = {
      title: form.title.trim(),
      type: form.type,
      timeType: form.timeType,
      priority: form.priority,
      color: form.color,
      isPinned: form.isPinned,
      tags: form.tags,
    };
    if (form.description.trim()) payload.description = form.description;
    if (rule.completable.editable) payload.isCompletable = form.isCompletable;

    if (form.recurring) {
      if (!form.recEnd) throw new Error("A recurring task needs an end date.");
      if (recurrenceMax && form.recEnd > recurrenceMax) {
        throw new Error("A recurring series cannot be longer than 1 year.");
      }
      if (form.pattern === "WEEKLY" && form.weekDays.length === 0) {
        throw new Error("Select at least one weekday.");
      }

      const recurrence = { pattern: form.pattern, startDate: form.recStart, endDate: form.recEnd };
      if (form.pattern === "WEEKLY") {
        recurrence.weekDays = form.weekDays;
        recurrence.slots = Object.fromEntries(
          form.weekDays.map((day) => {
            const slot = form.slots[day] || {};
            return [
              day,
              form.timeType === "TIMED"
                ? { startTime: slot.startTime, endTime: slot.endTime }
                : { startTime: slot.startTime },
            ];
          })
        );
      } else {
        Object.assign(payload, buildTimeFields({ ...form, date: form.recStart }));
        delete payload.date; // the server generates the dates
        if (form.pattern === "MONTHLY") recurrence.monthDay = Number(form.monthDay);
      }
      payload.recurrence = recurrence;
    } else {
      Object.assign(payload, buildTimeFields(form));
    }

    const res = await api.post("/tasks", payload);
    showWarnings(res.data.warnings);
    const count = res.data.meta?.series?.occurrences;
    toast.success(count ? `${count} tasks created.` : "Task created.");
  };

  const submitEditSingle = async () => {
    const payload = {
      title: form.title.trim(),
      description: form.description,
      type: form.type,
      timeType: form.timeType,
      priority: form.priority,
      color: form.color,
      isPinned: form.isPinned,
      tags: form.tags,
      ...buildTimeFields(form),
    };
    if (rule.completable.editable) payload.isCompletable = form.isCompletable;

    const res = await api.patch(`/tasks/${id}`, payload);
    showWarnings(res.data.warnings);
    toast.success("Task updated.");
  };

  const submitEditOccurrence = async () => {
    const payload = {
      ...buildTimeFields(form),
      description: form.description,
    };
    if (form.isPinned !== loaded.isPinned) payload.isPinned = form.isPinned;
    const res = await api.patch(`/tasks/${id}`, payload);
    showWarnings(res.data.warnings);
    toast.success("Occurrence updated.");
  };

  const submitEditSeries = async () => {
    const payload = {
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      color: form.color,
      isPinned: form.isPinned,
    };
    if (rule.completable.editable) payload.isCompletable = form.isCompletable;

    await api.patch(`/series/${seriesInfo.seriesId}`, payload);
    const added = form.tags.filter((tag) => !existingTags.includes(tag));
    for (const name of added) {
      await api.post(`/series/${seriesInfo.seriesId}/tags`, { name });
    }
    toast.success("Series updated.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (mode === "create") await submitCreate();
      else if (mode === "edit-single") await submitEditSingle();
      else if (mode === "edit-occurrence") await submitEditOccurrence();
      else await submitEditSeries();
      navigate("/");
    } catch (err) {
      setError(err.response ? describeError(err) : err.message);
    } finally {
      setSaving(false);
    }
  };

  if (mode === "loading") {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading task...</div>;
  }

  const isOccurrence = mode === "edit-occurrence";
  const isSeriesEdit = mode === "edit-series";
  const allowedTimeTypes = rule.timeTypes;

  const heading = {
    create: "Create New Task",
    "edit-single": "Edit Task",
    "edit-occurrence": "Edit This Occurrence",
    "edit-series": "Edit Whole Series",
  }[mode];

  const submitLabel = saving
    ? "Saving..."
    : mode === "create"
      ? form.recurring
        ? "Create Recurring Tasks"
        : `Create ${TASK_TYPES.find((t) => t.id === form.type)?.label} Task`
      : "Save Changes";

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 mb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100">{heading}</h1>
        <Link to={isEdit ? "/tasks" : "/"} className="text-sm text-slate-400 hover:text-white transition">
          &larr; Back
        </Link>
      </div>

      {seriesInfo && (isOccurrence || isSeriesEdit) && (
        <div className="mb-4 p-3 rounded border border-purple-900 bg-purple-950/40 text-sm text-purple-200 flex flex-wrap items-center justify-between gap-2">
          <span>
            🔁 Part of a {PATTERN_LABELS[seriesInfo.pattern].toLowerCase()} series ({seriesInfo.taskCount} tasks,{" "}
            {seriesInfo.startDate} → {seriesInfo.endDate}).{" "}
            {isOccurrence
              ? "The day, time and note of this occurrence can be changed."
              : "Changes apply to every occurrence. Type, time and repeat rule cannot be changed."}
          </span>
          {isOccurrence ? (
            <Link to={`/tasks/edit/${id}?scope=series`} className="text-purple-300 underline hover:text-white">
              Edit whole series
            </Link>
          ) : (
            <Link to={`/tasks/edit/${id}`} className="text-purple-300 underline hover:text-white">
              Edit this occurrence
            </Link>
          )}
        </div>
      )}

      {/* Task type */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {TASK_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            disabled={isOccurrence || isSeriesEdit}
            onClick={() => handleTypeChange(type.id)}
            className={`p-3 rounded-lg border text-left transition disabled:cursor-not-allowed ${
              form.type === type.id
                ? "bg-blue-600 border-blue-500 text-white shadow-lg"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800"
            }`}
          >
            <div className="font-bold text-sm">{type.label}</div>
            <div className="text-xs opacity-80 mt-0.5">{type.hint}</div>
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
          {/* Shared fields (not editable per occurrence) */}
          {!isOccurrence && (
            <>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="e.g. Algorithms Lecture"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  {isSeriesEdit ? "Series description" : "Description"}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Optional notes..."
                  rows="2"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Tags</label>
                <TagCombobox
                  selectedTags={form.tags}
                  onAdd={(tag) => set({ tags: [...form.tags, tag] })}
                  onRemove={(tag) => set({ tags: form.tags.filter((t) => t !== tag) })}
                  placeholder="Search or add a tag..."
                />
                {isSeriesEdit && (
                  <p className="text-[11px] text-slate-500 mt-1">Tags can be added to a series, not removed.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => set({ priority: e.target.value })}
                    className={inputClass}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                {!isSeriesEdit && allowedTimeTypes.length > 1 && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Time Type</label>
                    <select
                      value={form.timeType}
                      onChange={(e) => handleTimeTypeChange(e.target.value)}
                      className={inputClass}
                    >
                      {allowedTimeTypes.map((type) => (
                        <option key={type} value={type}>
                          {TIME_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Occurrence summary */}
          {isOccurrence && (
            <>
              <div className="p-3 bg-slate-900/50 rounded border border-slate-700/50 text-sm text-slate-300">
                <p className="font-semibold text-slate-100">{form.title}</p>
                <p className="text-xs text-slate-400 mt-1">{TIME_TYPE_LABELS[form.timeType]}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">This occurrence&apos;s note</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Note something specific about this class..."
                  rows="3"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {/* Single-day / range time fields */}
          {!isSeriesEdit && !form.recurring && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-slate-300">When</h3>
              <TimeFields timeType={form.timeType} form={form} set={set} />
            </div>
          )}

          {/* Recurrence (creation only) */}
          {showRecurrence && (
            <div className="border-t border-slate-700 pt-3 mt-1 flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) => set({ recurring: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm font-semibold text-slate-200">Repeat this task</span>
              </label>

              {form.recurring && (
                <div className="flex flex-col gap-4 p-3 bg-slate-900/50 rounded border border-slate-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Repeats">
                      <select
                        value={form.pattern}
                        onChange={(e) => set({ pattern: e.target.value })}
                        className={smallInputClass}
                      >
                        {Object.entries(PATTERN_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="First day *">
                      <input
                        type="date"
                        value={form.recStart}
                        onChange={(e) => set({ recStart: e.target.value })}
                        className={smallInputClass}
                        required
                      />
                    </Field>
                    <Field label="Last day *" hint="At most 1 year after the first day.">
                      <input
                        type="date"
                        value={form.recEnd}
                        min={form.recStart || undefined}
                        max={recurrenceMax}
                        onChange={(e) => set({ recEnd: e.target.value })}
                        className={smallInputClass}
                        required
                      />
                    </Field>
                  </div>

                  {form.pattern === "MONTHLY" && (
                    <Field label="Day of the month" hint="Days missing from a short month fall back to its last day.">
                      <select
                        value={form.monthDay}
                        onChange={(e) => set({ monthDay: Number(e.target.value) })}
                        className={smallInputClass}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                        <option value={-1}>Last day of the month</option>
                      </select>
                    </Field>
                  )}

                  {/* Default clock times: shared by daily/monthly, starting values for weekly days */}
                  {form.timeType !== "DEADLINE" && (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label={form.pattern === "WEEKLY" ? "Default start time *" : "Start time *"}>
                        <input
                          type="time"
                          value={form.startTime}
                          onChange={(e) => set({ startTime: e.target.value })}
                          className={smallInputClass}
                          required={form.pattern !== "WEEKLY"}
                        />
                      </Field>
                      {form.timeType === "TIMED" && (
                        <Field label={form.pattern === "WEEKLY" ? "Default end time *" : "End time *"}>
                          <input
                            type="time"
                            value={form.endTime}
                            onChange={(e) => set({ endTime: e.target.value })}
                            className={smallInputClass}
                            required={form.pattern !== "WEEKLY"}
                          />
                        </Field>
                      )}
                    </div>
                  )}

                  {form.pattern === "WEEKLY" && (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs text-slate-400">Days (each day can have its own time)</span>
                      <div className="flex flex-wrap gap-1.5">
                        {WEEKDAYS.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleWeekDay(day)}
                            className={`px-2.5 py-1 text-xs rounded border transition ${
                              form.weekDays.includes(day)
                                ? "bg-blue-600 border-blue-500 text-white"
                                : "bg-slate-900 border-slate-600 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {DAY_LABELS[day].slice(0, 3)}
                          </button>
                        ))}
                      </div>
                      {form.weekDays.map((day) => (
                        <div key={day} className="grid grid-cols-[90px_1fr_1fr] items-center gap-2">
                          <span className="text-xs text-slate-300">{DAY_LABELS[day]}</span>
                          <input
                            type="time"
                            value={form.slots[day]?.startTime || ""}
                            onChange={(e) => setSlot(day, { startTime: e.target.value })}
                            className={smallInputClass}
                            required
                          />
                          {form.timeType === "TIMED" ? (
                            <input
                              type="time"
                              value={form.slots[day]?.endTime || ""}
                              onChange={(e) => setSlot(day, { endTime: e.target.value })}
                              className={smallInputClass}
                              required
                            />
                          ) : (
                            <span />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Appearance and flags (not for a single occurrence) */}
          {!isOccurrence && (
            <>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Task Color</label>
                <ColorPicker value={form.color} onChange={(color) => set({ color })} typeDefault={TYPE_COLORS[form.type]} />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isCompletable"
                  checked={form.isCompletable}
                  disabled={!rule.completable.editable}
                  onChange={(e) => set({ isCompletable: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                <label htmlFor="isCompletable" className="text-sm text-slate-300 cursor-pointer">
                  This task can be marked as complete
                  {!rule.completable.editable && <span className="text-slate-500"> (always on for {form.type.toLowerCase()})</span>}
                </label>
              </div>
            </>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPinned"
              checked={form.isPinned}
              onChange={(e) => set({ isPinned: e.target.checked })}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor="isPinned" className="text-sm text-slate-300 cursor-pointer">
              📌 Pin {isOccurrence || isSeriesEdit || form.recurring ? "the whole series" : "this task"} (listed in the
              dashboard's Pinned panel)
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition disabled:bg-blue-800"
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
