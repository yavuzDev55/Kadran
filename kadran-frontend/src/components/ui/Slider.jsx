import { useId } from "react";

export default function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  formatValue = (currentValue) => currentValue,
  disabled = false,
  ...props
}) {
  const id = useId();

  return (
    <div className="ui-slider">
      <div className="ui-slider__heading">
        <label htmlFor={id}>{label}</label>
        <output className="ui-slider__value" htmlFor={id}>
          {formatValue(value)}
        </output>
      </div>
      <input
        {...props}
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
