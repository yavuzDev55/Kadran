import { useId } from "react";

export default function Switch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = "",
  ...props
}) {
  const generatedId = useId();
  const descriptionId = description ? `${generatedId}-description` : undefined;

  return (
    <label className={["ui-switch", className].filter(Boolean).join(" ")}>
      <input
        {...props}
        id={generatedId}
        className="ui-switch__input"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-describedby={descriptionId}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="ui-switch__track" aria-hidden="true" />
      <span className="ui-switch__label">
        {label}
        {description && (
          <span className="ui-field__hint" id={descriptionId}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
