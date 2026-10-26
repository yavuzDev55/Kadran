import { TASK_TYPES } from "../../utils/taskRules";

export default function TaskTypeSelector({ value, disabled, onChange }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
      {TASK_TYPES.map((type) => (
        <button
          key={type.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(type.id)}
          className={`p-3 rounded-lg border text-left transition disabled:cursor-not-allowed ${
            value === type.id
              ? "bg-blue-600 border-blue-500 text-white shadow-lg"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800"
          }`}
        >
          <div className="font-bold text-sm">{type.label}</div>
          <div className="text-xs opacity-80 mt-0.5">{type.hint}</div>
        </button>
      ))}
    </div>
  );
}
