import TagCombobox from "../TagCombobox";
import { TIME_TYPE_LABELS } from "../../utils/taskRules";

const inputClass =
  "w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-60";

export default function TaskDetailsFields({
  form,
  set,
  isSeriesEdit,
  allowedTimeTypes,
  onTimeTypeChange,
}) {
  return (
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
              onChange={(e) => onTimeTypeChange(e.target.value)}
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
  );
}
