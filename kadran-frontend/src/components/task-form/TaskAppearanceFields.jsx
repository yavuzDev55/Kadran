import { useEffect, useRef, useState } from "react";
import Switch from "../ui/Switch";

const PALETTE = [
  "#2463a6", "#c23b3b", "#27864b", "#8a4fb0",
  "#007c78", "#d46a1f", "#b12f72", "#5d6675",
];

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;
const RECENT_KEY = "kadran.recentColors";
const MAX_RECENT = 5;

// Recent custom colors are a per-browser convenience; storage can be blocked or full.
const readRecentColors = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((color) => typeof color === "string" && HEX_PATTERN.test(color)).slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
};

const rememberRecentColor = (hex) => {
  try {
    const next = [hex, ...readRecentColors().filter((color) => color !== hex)].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Ignored: the color is still applied to the task.
  }
};

// WCAG relative luminance (0 = black, 1 = white) of a #rrggbb color.
const relativeLuminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Very light colors disappear on the dark theme (and are weak on the light one too).
const LIGHT_COLOR_LUMINANCE = 0.8;

function ColorPicker({ value, onChange, typeDefault }) {
  const [recent, setRecent] = useState(readRecentColors);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(typeDefault);
  const rootRef = useRef(null);

  const isCustom = value !== null && !PALETTE.includes(value);
  const draftInvalid = draft !== "" && !HEX_PATTERN.test(draft);
  const isLight = value !== null && HEX_PATTERN.test(value) && relativeLuminance(value) > LIGHT_COLOR_LUMINANCE;

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

  const choose = (hex, { custom = false } = {}) => {
    onChange(hex);
    if (custom) {
      setDraft(hex);
      rememberRecentColor(hex);
      setRecent(readRecentColors());
    }
  };

  return (
    <div className="task-color-picker" ref={rootRef}>
      <div className="task-color-picker__palette" aria-label="Task colors">
        <button
          type="button"
          onClick={() => choose(null)}
          aria-label="Use type default color"
          aria-pressed={value === null}
          title="Use type default"
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition ${
            value === null ? "border-ink" : "border-border/30 hover:border-ink"
          }`}
          style={{ backgroundColor: typeDefault }}
        >
          {value === null && <span className="text-white font-bold">✓</span>}
        </button>
        {PALETTE.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => choose(hex)}
            aria-label={`Set task color ${hex}`}
            aria-pressed={value === hex}
            title={hex}
            className={`task-color-picker__swatch ${
              value === hex ? "is-selected" : ""
            }`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>

      <div className="task-color-picker__custom-row">
        <button
          type="button"
          className={`task-color-picker__custom-trigger ${open ? "is-open" : ""}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Choose a custom task color"
          onClick={() => {
            setDraft(isCustom ? value : typeDefault);
            setOpen((current) => !current);
          }}
        >
          <span style={{ "--swatch-color": isCustom ? value : typeDefault }} />
          Custom color
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
        </button>
        {recent.slice(0, MAX_RECENT).map((hex, index) => (
          <button
            key={hex}
            type="button"
            onClick={() => choose(hex, { custom: true })}
            aria-label={`Use recent color ${hex}${index === 0 ? ", most recent" : ""}`}
            title={`Recent: ${hex}`}
            className={`task-color-picker__recent ${value === hex ? "is-selected" : ""}`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>

      {open && (
        <div className="task-color-picker__popover" role="dialog" aria-label="Custom task color">
          <div className="task-color-picker__popover-title">
            <span>Custom color</span>
            <button type="button" aria-label="Close color picker" onClick={() => setOpen(false)}>×</button>
          </div>
          <label className="task-color-picker__color-input">
            <input
              type="color"
              aria-label="Choose a color"
              value={HEX_PATTERN.test(draft) ? draft : typeDefault}
              onChange={(event) => choose(event.target.value.toLowerCase(), { custom: true })}
            />
            <span>Choose from color spectrum</span>
          </label>
          <label className="task-color-picker__hex">
            <span>Hex value</span>
            <input
              type="text"
              inputMode="text"
              aria-label="Custom color hex value"
              aria-invalid={draftInvalid}
              aria-describedby={draftInvalid ? "custom-color-error" : undefined}
              placeholder="#2463a6"
              value={draft}
              maxLength={7}
              onChange={(event) => {
                const text = event.target.value.trim();
                setDraft(text);
                if (HEX_PATTERN.test(text)) choose(text.toLowerCase(), { custom: true });
              }}
            />
          </label>
          {draftInvalid && <p id="custom-color-error" className="task-color-picker__error">Enter a 6-digit hex color.</p>}
        </div>
      )}
      {isLight && (
        <p role="status" className="text-xs text-muted">
          This color is very light and may be hard to see on the dark theme.
        </p>
      )}
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
            <label className="block text-sm text-muted mb-2">Task Color</label>
            <ColorPicker value={form.color} onChange={(color) => set({ color })} typeDefault={typeDefault} />
          </div>

          <Switch
            label="This task can be marked as complete"
            description={!completableEditable ? `Always on for ${type.toLowerCase()} tasks.` : undefined}
            checked={form.isCompletable}
            disabled={!completableEditable}
            onChange={(isCompletable) => set({ isCompletable })}
          />
        </>
      )}

      <Switch
        label={`Pin ${isOccurrence || isSeriesEdit || form.recurring ? "the whole series" : "this task"}`}
        description="Listed in the dashboard's Pinned panel."
        checked={form.isPinned}
        onChange={(isPinned) => set({ isPinned })}
      />
    </>
  );
}
