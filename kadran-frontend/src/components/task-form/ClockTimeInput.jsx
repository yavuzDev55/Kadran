import { useState } from "react";

const pad = (value) => String(value).padStart(2, "0");

const timeValue = (hours, minutes) => `${pad(hours)}:${pad(minutes)}`;

export default function ClockTimeInput({ value, onChange, label, required = false }) {
  const [open, setOpen] = useState(false);
  const [part, setPart] = useState("hour");
  const [rawHours, rawMinutes] = (value || "09:00").split(":").map(Number);
  const hours = Number.isFinite(rawHours) ? rawHours : 9;
  const minutes = Number.isFinite(rawMinutes) ? rawMinutes : 0;
  const options = part === "hour"
    ? Array.from({ length: 24 }, (_, hour) => ({
        value: hour,
        label: hour === 0 ? "00" : hour > 12 ? pad(hour) : pad(hour),
        radius: hour === 0 || hour > 12 ? 48 : 84,
        active: hour === hours,
      }))
    : Array.from({ length: 12 }, (_, index) => {
        const minute = index * 5;
        return { value: minute, label: pad(minute), radius: 84, active: minute === minutes };
      });

  const choose = (selected) => {
    if (part === "hour") {
      onChange(timeValue(selected, minutes));
      setPart("minute");
    } else {
      onChange(timeValue(hours, selected));
      setPart("hour");
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={value}
          required={required}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className="clock-time-input"
        />
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Choose ${label.toLowerCase()} with clock`}
          onClick={() => setOpen((current) => !current)}
          className="clock-time-trigger"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>
      </div>
      {open && (
        <div
          className="clock-time-popover"
          role="dialog"
          aria-label={`Choose ${label.toLowerCase()}`}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          <div className="clock-time-face" aria-label={part === "hour" ? "Choose hour" : "Choose minute"}>
            <div className="clock-time-center" aria-hidden="true" />
            {options.map((option) => {
              const angle = (option.value / (part === "hour" ? 12 : 12)) * 2 * Math.PI;
              const x = Math.sin(angle) * option.radius;
              const y = -Math.cos(angle) * option.radius;
              return (
                <button
                  type="button"
                  key={option.value}
                  aria-label={part === "hour" ? `${pad(option.value)} hours` : `${pad(option.value)} minutes`}
                  aria-pressed={option.active}
                  className={`clock-time-option ${option.active ? "is-selected" : ""} ${
                    option.radius < 60 ? "is-inner" : ""
                  }`}
                  style={{ "--clock-x": `${x}px`, "--clock-y": `${y}px` }}
                  onClick={() => choose(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="clock-time-value" role="group" aria-label="Selected time">
            <button type="button" aria-pressed={part === "hour"} onClick={() => setPart("hour")}>
              {pad(hours)}
            </button>
            <span>:</span>
            <button type="button" aria-pressed={part === "minute"} onClick={() => setPart("minute")}>
              {pad(minutes)}
            </button>
          </div>
          <p className="clock-time-manual">Choose a time on the dial or use the time field.</p>
          <button type="button" className="ui-button ui-button--sm" onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
