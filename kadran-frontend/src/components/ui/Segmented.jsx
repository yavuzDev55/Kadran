// src/components/ui/Segmented.jsx
// One outlined group of 2-5 choices (the reference's "seg" control). The pressed segment is
// tinted and bold. Use it instead of a <select> for a few short, mutually exclusive options.

export default function Segmented({ label, options, value, onChange, className = "" }) {
  return (
    <div className={["seg", className].filter(Boolean).join(" ")} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
