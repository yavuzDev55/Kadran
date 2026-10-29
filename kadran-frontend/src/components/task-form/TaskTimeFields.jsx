import ClockTimeInput from "./ClockTimeInput";
import DatePicker from "./DatePicker";

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  );
}

/** Day + clock inputs for one time type (a day range for multi-day, nothing for any-time). */
export default function TaskTimeFields({ timeType, form, set }) {
  if (timeType === "MULTI_DAY") {
    const sameDay = form.rangeStartDate && form.rangeStartDate === form.rangeEndDate;
    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start day *">
            <DatePicker
              label="Start day"
              value={form.rangeStartDate}
              onChange={(rangeStartDate) => set({ rangeStartDate })}
              required
            />
          </Field>
          <Field label="End day *">
            <DatePicker
              label="End day"
              value={form.rangeEndDate}
              min={form.rangeStartDate || undefined}
              onChange={(rangeEndDate) => set({ rangeEndDate })}
              required
            />
          </Field>
        </div>
        <p className="text-[11px] text-muted">
          {sameDay
            ? "Same start and end day: a one-day task, shown as an all-day item on the calendar."
            : "Whole days only. Shown as a bar across the days on the calendar."}
        </p>
      </div>
    );
  }

  if (timeType === "ANY_TIME") {
    return (
      <div className="p-3 bg-surface-muted rounded border border-border/20 text-xs text-muted">
        No date or time. This task is listed under "Any time" on the dashboard and never appears on the calendar.
      </div>
    );
  }

  const startMinutes = form.startTime
    ? form.startTime.split(":").reduce((total, part) => total * 60 + Number(part), 0)
    : null;
  const currentDuration = startMinutes !== null && form.endTime
    ? form.endTime.split(":").reduce((total, part) => total * 60 + Number(part), 0) - startMinutes
    : null;
  const durationOptions = [30, 45, 60, 90, 120].filter(
    (minutes) => startMinutes !== null && startMinutes + minutes <= 23 * 60 + 59,
  );
  const setDuration = (minutes) => {
    const endMinutes = startMinutes + minutes;
    set({
      endTime: `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Field label="Date *">
        <DatePicker
          label="Date"
          value={form.date}
          onChange={(date) => set({ date })}
          required
        />
      </Field>
      {(timeType === "TIMED" || timeType === "OPEN_ENDED") && (
        <Field label="Start time *">
          <ClockTimeInput
            label="Start time"
            value={form.startTime}
            onChange={(startTime) => set({ startTime })}
            required
          />
        </Field>
      )}
      {timeType === "TIMED" && (
        <Field label="End time *">
          <>
            <ClockTimeInput
              label="End time"
              value={form.endTime}
              onChange={(endTime) => set({ endTime })}
              required
            />
            {durationOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Task duration">
                {durationOptions.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    aria-pressed={currentDuration === minutes}
                    onClick={() => setDuration(minutes)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                      currentDuration === minutes
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border/20 text-muted hover:border-accent/50 hover:text-ink"
                    }`}
                  >
                    {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                  </button>
                ))}
              </div>
            )}
          </>
        </Field>
      )}
      {timeType === "DEADLINE" && (
        <Field label="Due time" hint="Defaults to 23:59.">
          <ClockTimeInput
            label="Due time"
            value={form.endTime}
            onChange={(endTime) => set({ endTime })}
          />
        </Field>
      )}
    </div>
  );
}
