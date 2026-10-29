import { useEffect, useRef, useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (value) => String(value).padStart(2, "0");

const toDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromDateString = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const shiftMonth = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);

const formatDate = (value) => {
  const date = fromDateString(value);
  return date
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)
    : "";
};

export default function DatePicker({ label, value, onChange, required = false, min, max }) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(fromDateString(value) || new Date()));
  const rootRef = useRef(null);
  const selectedDate = fromDateString(value);
  const offset = (visibleMonth.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, index) =>
    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - offset + 1),
  );
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(visibleMonth);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const showPicker = () => {
    setVisibleMonth(monthStart(selectedDate || new Date()));
    setOpen((current) => !current);
  };

  return (
    <div className="date-picker" ref={rootRef}>
      <button
        type="button"
        className="date-picker__trigger ui-input"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required || undefined}
        onClick={showPicker}
      >
        <span className={value ? "" : "date-picker__placeholder"}>
          {value ? formatDate(value) : "Choose a date"}
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="16" rx="2" />
          <path d="M7.5 3v4M16.5 3v4M3.5 10h17" />
        </svg>
      </button>
      {open && (
        <div className="date-picker__popover" role="dialog" aria-label={`${label} date picker`}>
          <div className="date-picker__header">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
            >
              ‹
            </button>
            <strong aria-live="polite">{monthLabel}</strong>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
            >
              ›
            </button>
          </div>
          <div className="date-picker__grid" role="grid" aria-label={monthLabel}>
            {WEEKDAYS.map((day) => (
              <span className="date-picker__weekday" role="columnheader" key={day}>
                {day}
              </span>
            ))}
            {days.map((date) => {
              const dateValue = toDateString(date);
              const inMonth = date.getMonth() === visibleMonth.getMonth();
              const isSelected = dateValue === value;
              const isToday = dateValue === toDateString(new Date());
              const disabled = (min && dateValue < min) || (max && dateValue > max);
              return (
                <button
                  type="button"
                  role="gridcell"
                  key={dateValue}
                  className={[
                    "date-picker__day",
                    !inMonth && "is-outside",
                    isSelected && "is-selected",
                    isToday && "is-today",
                  ].filter(Boolean).join(" ")}
                  aria-label={new Intl.DateTimeFormat("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }).format(date)}
                  aria-pressed={isSelected}
                  disabled={disabled}
                  onClick={() => {
                    onChange(dateValue);
                    setOpen(false);
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="date-picker__footer">
            {value ? (
              <button type="button" onClick={() => onChange("")}>Clear date</button>
            ) : (
              <span />
            )}
            <button type="button" onClick={() => {
              const today = toDateString(new Date());
              if ((!min || today >= min) && (!max || today <= max)) onChange(today);
              setOpen(false);
            }}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
