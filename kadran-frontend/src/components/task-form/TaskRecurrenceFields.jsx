import { WEEKDAYS } from "../../utils/dateUtils";
import Switch from "../ui/Switch";
import ClockTimeInput from "./ClockTimeInput";
import DatePicker from "./DatePicker";

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
const smallInputClass =
  "ui-input text-sm";

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  );
}

export default function TaskRecurrenceFields({
  form,
  set,
  recurrenceMax,
  onToggleWeekDay,
  onSetSlot,
}) {
  return (
    <div className="border-t border-border/20 pt-3 mt-1 flex flex-col gap-3">
      <Switch
        label="Repeat this task"
        checked={form.recurring}
        onChange={(recurring) => set({ recurring })}
      />

      {form.recurring && (
        <div className="flex flex-col gap-4 p-3 bg-surface-muted rounded border border-border/20">
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
              <DatePicker
                label="First day"
                value={form.recStart}
                onChange={(recStart) => set({ recStart })}
                required
              />
            </Field>
            <Field label="Last day *" hint="At most 1 year after the first day.">
              <DatePicker
                label="Last day"
                value={form.recEnd}
                min={form.recStart || undefined}
                max={recurrenceMax}
                onChange={(recEnd) => set({ recEnd })}
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

          {form.timeType !== "DEADLINE" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label={form.pattern === "WEEKLY" ? "Default start time *" : "Start time *"}>
                <ClockTimeInput
                  label={form.pattern === "WEEKLY" ? "Default start time" : "Start time"}
                  value={form.startTime}
                  onChange={(startTime) => set({ startTime })}
                  required={form.pattern !== "WEEKLY"}
                />
              </Field>
              {form.timeType === "TIMED" && (
                <Field label={form.pattern === "WEEKLY" ? "Default end time *" : "End time *"}>
                  <ClockTimeInput
                    label={form.pattern === "WEEKLY" ? "Default end time" : "End time"}
                    value={form.endTime}
                    onChange={(endTime) => set({ endTime })}
                    required={form.pattern !== "WEEKLY"}
                  />
                </Field>
              )}
            </div>
          )}

          {form.pattern === "WEEKLY" && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">Days (each day can have its own time)</span>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onToggleWeekDay(day)}
                    aria-label={DAY_LABELS[day]}
                    aria-pressed={form.weekDays.includes(day)}
                    className={`px-2.5 py-1 text-xs rounded border transition ${
                      form.weekDays.includes(day)
                        ? "bg-accent border-accent text-accent-ink"
                        : "bg-surface border-border/20 text-muted hover:bg-canvas"
                    }`}
                  >
                    {DAY_LABELS[day].slice(0, 3)}
                  </button>
                ))}
              </div>
              {form.weekDays.map((day) => (
                <div key={day} className="grid grid-cols-1 sm:grid-cols-[90px_1fr_1fr] items-center gap-2">
                  <span className="text-xs text-muted">{DAY_LABELS[day]}</span>
                  <ClockTimeInput
                    label={`${DAY_LABELS[day]} start time`}
                    value={form.slots[day]?.startTime || ""}
                    onChange={(startTime) => onSetSlot(day, { startTime })}
                    required
                  />
                  {form.timeType === "TIMED" ? (
                    <ClockTimeInput
                      label={`${DAY_LABELS[day]} end time`}
                      value={form.slots[day]?.endTime || ""}
                      onChange={(endTime) => onSetSlot(day, { endTime })}
                      required
                    />
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
