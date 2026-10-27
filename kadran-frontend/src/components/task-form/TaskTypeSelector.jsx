import { TASK_TYPES } from "../../utils/taskRules";

export default function TaskTypeSelector({ value, disabled, onChange }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
      {TASK_TYPES.map((type) => (
        <button
          key={type.id}
          type="button"
          disabled={disabled}
          aria-pressed={value === type.id}
          onClick={() => onChange(type.id)}
          className={`p-3 rounded-lg border text-left transition disabled:cursor-not-allowed ${
            value === type.id
              ? "bg-accent border-accent text-accent-ink"
              : "bg-surface border-border/20 text-muted hover:bg-surface-muted disabled:opacity-40"
          }`}
        >
          <div className="font-bold text-sm">{type.label}</div>
          <div className="text-xs opacity-80 mt-0.5">{type.hint}</div>
        </button>
      ))}
    </div>
  );
}
