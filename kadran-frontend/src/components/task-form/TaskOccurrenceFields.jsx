import { TIME_TYPE_LABELS } from "../../utils/taskRules";

const inputClass =
  "ui-input disabled:opacity-60";

export default function TaskOccurrenceFields({ form, set }) {
  return (
    <>
      <div className="p-3 bg-surface-muted rounded border border-border/20 text-sm text-ink">
        <p className="font-semibold">{form.title}</p>
        <p className="text-xs text-muted mt-1">{TIME_TYPE_LABELS[form.timeType]}</p>
      </div>
      <div>
        <label className="block text-sm text-muted mb-1">This occurrence&apos;s note</label>
        <textarea
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Note something specific about this class..."
          rows="3"
          className={inputClass}
        />
      </div>
    </>
  );
}
