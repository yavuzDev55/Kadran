const smallInputClass =
  "w-full p-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:border-blue-500";

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
export default function TaskTimeFields({ timeType, form, set }) {
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
      <Field label="Date *">
        <input
          type="date"
          value={form.date}
          onChange={(e) => set({ date: e.target.value })}
          className={smallInputClass}
          required
        />
      </Field>
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
