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
import TaskAppearanceFields from "../components/task-form/TaskAppearanceFields";
import TaskDetailsFields from "../components/task-form/TaskDetailsFields";
import TaskOccurrenceFields from "../components/task-form/TaskOccurrenceFields";
import TaskRecurrenceFields from "../components/task-form/TaskRecurrenceFields";
import TaskSeriesNotice from "../components/task-form/TaskSeriesNotice";
import TaskTimeFields from "../components/task-form/TaskTimeFields";
import TaskTypeSelector from "../components/task-form/TaskTypeSelector";
import Button from "../components/ui/Button";
import { addYears, formatDate, getTodayInTimezone, parseDate, sliceDate, WEEKDAYS } from "../utils/dateUtils";
import { formatTaskTime } from "../utils/formatTime";
import { getTaskTypeDisplayColor } from "../utils/taskDisplaySettings";
import {
  MAX_SERIES_YEARS,
  TASK_RULES,
  TASK_TYPES,
  canRecur,
} from "../utils/taskRules";

const DEFAULT_DEADLINE_TIME = "23:59";
const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  return formatDate(parseDate(value)) === value;
};
const isValidTime = (value) => {
  if (!/^\d{2}:\d{2}$/.test(value || "")) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours < 24 && minutes < 60;
};

const createInitialForm = (today, searchParams) => {
  const date = searchParams.get("date");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const initial = emptyForm("COURSE", isValidDate(date) ? date : today);
  if (!isValidTime(startTime)) return initial;

  const startMinutes = startTime.split(":").reduce((total, part) => total * 60 + Number(part), 0);
  const suggestedEnd = Math.min(startMinutes + 60, 23 * 60 + 59);
  const parsedEnd = isValidTime(endTime)
    ? endTime.split(":").reduce((total, part) => total * 60 + Number(part), 0)
    : null;
  const endMinutes = parsedEnd !== null && parsedEnd > startMinutes ? parsedEnd : suggestedEnd;
  return {
    ...initial,
    startTime,
    endTime: `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`,
  };
};

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
  const [form, setForm] = useState(() => createInitialForm(today, searchParams));
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
    return <div className="flex items-center justify-center h-64 text-muted">Loading task...</div>;
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
  const previewTime = form.timeType === "MULTI_DAY"
    ? `${form.rangeStartDate || "Start day"} → ${form.rangeEndDate || "End day"}`
    : formatTaskTime(form) || "Time not set";
  const previewType = TASK_TYPES.find((type) => type.id === form.type);
  const previewTimeType = form.timeType.replace(/_/g, " ").toLowerCase();
  const previewSchedule = form.recurring
    ? `Repeats ${form.pattern.toLowerCase()}${form.recStart ? ` from ${form.recStart}` : ""}${form.recEnd ? ` to ${form.recEnd}` : ""}`
    : previewTime;

  return (
    <div className="max-w-5xl mx-auto mt-8 p-4 mb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-title text-3xl text-ink">{heading}</h1>
        <Link to={isEdit ? "/tasks" : "/"} className="text-sm text-muted hover:text-ink transition">
          &larr; Back
        </Link>
      </div>

      {seriesInfo && (isOccurrence || isSeriesEdit) && (
        <TaskSeriesNotice seriesInfo={seriesInfo} taskId={id} isOccurrence={isOccurrence} />
      )}

      <TaskTypeSelector
        value={form.type}
        disabled={isOccurrence || isSeriesEdit}
        onChange={handleTypeChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)] gap-5 items-start">
        <section className="ui-panel p-4 md:p-6">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/40 text-danger rounded text-sm whitespace-pre-wrap">
              {error}
            </div>
          )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!isOccurrence && (
                <TaskDetailsFields
                  form={form}
                  set={set}
                  isSeriesEdit={isSeriesEdit}
                  allowedTimeTypes={allowedTimeTypes}
                  onTimeTypeChange={handleTimeTypeChange}
                />
              )}

              {isOccurrence && <TaskOccurrenceFields form={form} set={set} />}

              {!isSeriesEdit && !form.recurring && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-ink">When</h3>
                  <TaskTimeFields timeType={form.timeType} form={form} set={set} />
                </div>
              )}

              {showRecurrence && (
                <TaskRecurrenceFields
                  form={form}
                  set={set}
                  recurrenceMax={recurrenceMax}
                  onToggleWeekDay={toggleWeekDay}
                  onSetSlot={setSlot}
                />
              )}

              <TaskAppearanceFields
                form={form}
                set={set}
                typeDefault={getTaskTypeDisplayColor(form.type)}
                type={form.type}
                completableEditable={rule.completable.editable}
                isOccurrence={isOccurrence}
                isSeriesEdit={isSeriesEdit}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={saving}
                className="mt-4 w-full"
              >
                {submitLabel}
              </Button>
          </form>
        </section>

        <aside className="ui-panel p-4 lg:sticky lg:top-20" aria-live="polite">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Live preview</p>
            <h2 className="font-title text-xl text-ink mt-1">On your calendar</h2>
          </div>
          <div
            className={`kadran-task kadran-task-row kadran-task-card type-${form.type.toLowerCase()} priority-${form.priority.toLowerCase()} ${
              form.timeType === "DEADLINE" ? "is-deadline" : form.timeType === "OPEN_ENDED" ? "is-open-ended" : ""
            } rounded-lg p-4 pl-10`}
            style={{ "--task-color": form.color || getTaskTypeDisplayColor(form.type) }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="task-title font-semibold break-words">{form.title.trim() || "Your task title"}</p>
              {form.isPinned && <span aria-label="Pinned" title="Pinned">📌</span>}
            </div>
            <p className={`mt-2 text-sm text-muted ${form.timeType === "ANY_TIME" ? "anytime-heading" : ""}`}>
              {previewSchedule}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full border border-border/20 px-2 py-1">{previewType?.label}</span>
              <span className="rounded-full border border-border/20 px-2 py-1 capitalize">{previewTimeType}</span>
              {form.priority === "HIGH" && <span className="text-danger font-semibold">High priority</span>}
            </div>
            {form.description.trim() && (
              <p className="mt-3 text-sm text-muted break-words">{form.description}</p>
            )}
            {form.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {form.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-surface-muted px-2 py-1 text-[11px] text-muted">{tag}</span>
                ))}
              </div>
            )}
          </div>
          {form.timeType === "ANY_TIME" && (
            <p className="mt-3 text-xs text-muted">Any-time tasks stay in the dashboard list and do not appear in the calendar.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
