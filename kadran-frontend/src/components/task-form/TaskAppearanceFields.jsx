const PALETTE = [
  "#3b82f6", "#ef4444", "#22c55e", "#94a3b8",
  "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#64748b", "#06b6d4", "#a3e635",
];

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

export default function TaskAppearanceFields({
  form,
  set,
  typeDefault,
  type,
  completableEditable,
  isOccurrence,
  isSeriesEdit,
}) {
  return (
    <>
      {!isOccurrence && (
        <>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Task Color</label>
            <ColorPicker value={form.color} onChange={(color) => set({ color })} typeDefault={typeDefault} />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isCompletable"
              checked={form.isCompletable}
              disabled={!completableEditable}
              onChange={(e) => set({ isCompletable: e.target.checked })}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor="isCompletable" className="text-sm text-slate-300 cursor-pointer">
              This task can be marked as complete
              {!completableEditable && (
                <span className="text-slate-500"> (always on for {type.toLowerCase()})</span>
              )}
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
          dashboard&apos;s Pinned panel)
        </label>
      </div>
    </>
  );
}
