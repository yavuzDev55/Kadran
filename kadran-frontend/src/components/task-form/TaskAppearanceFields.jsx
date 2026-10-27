import { useState } from "react";

const PALETTE = [
  "#3b82f6", "#ef4444", "#22c55e", "#94a3b8",
  "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#64748b", "#06b6d4", "#a3e635",
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
  // Text the user is typing; null means "show the saved value".
  const [draft, setDraft] = useState(null);

  const isCustom = value !== null && !PALETTE.includes(value);
  const shownText = draft ?? value ?? "";
  const draftInvalid = draft !== null && draft !== "" && !HEX_PATTERN.test(draft);
  const isLight = value !== null && HEX_PATTERN.test(value) && relativeLuminance(value) > LIGHT_COLOR_LUMINANCE;

  const choose = (hex, { custom = false } = {}) => {
    onChange(hex);
    setDraft(null);
    if (custom) {
      rememberRecentColor(hex);
      setRecent(readRecentColors());
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 items-center">
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
            className={`w-7 h-7 rounded-full border-2 transition ${
              value === hex ? "border-ink scale-110" : "border-transparent hover:border-ink"
            }`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <label className="flex items-center gap-2 text-sm text-muted">
          <span>Custom</span>
          <input
            type="color"
            aria-label="Pick a custom task color"
            value={isCustom ? value : HEX_PATTERN.test(typeDefault || "") ? typeDefault : "#3b82f6"}
            onChange={(e) => choose(e.target.value.toLowerCase(), { custom: true })}
            className="w-7 h-7 p-0 border-0 bg-transparent cursor-pointer"
          />
        </label>
        <input
          type="text"
          inputMode="text"
          aria-label="Custom color hex value"
          aria-invalid={draftInvalid}
          aria-describedby={draftInvalid ? "custom-color-error" : undefined}
          placeholder="#rrggbb"
          value={shownText}
          maxLength={7}
          onChange={(e) => {
            const text = e.target.value.trim();
            setDraft(text);
            if (HEX_PATTERN.test(text)) choose(text.toLowerCase(), { custom: true });
          }}
          onBlur={() => setDraft(null)}
          className={`w-24 px-2 py-1 font-mono text-xs bg-surface border rounded ${
            draftInvalid ? "border-danger" : "border-border/30"
          }`}
        />
        {recent.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => choose(hex, { custom: true })}
            aria-label={`Use recent color ${hex}`}
            title={`Recent: ${hex}`}
            className={`w-5 h-5 rounded-full border ${value === hex ? "border-ink" : "border-border/30"}`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>

      {draftInvalid && (
        <p id="custom-color-error" className="text-xs text-danger">
          Use a 6-digit hex color such as #3b82f6.
        </p>
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

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isCompletable"
              checked={form.isCompletable}
              disabled={!completableEditable}
              onChange={(e) => set({ isCompletable: e.target.checked })}
              className="w-4 h-4 accent-accent"
            />
            <label htmlFor="isCompletable" className="text-sm text-ink cursor-pointer">
              This task can be marked as complete
              {!completableEditable && (
                <span className="text-muted"> (always on for {type.toLowerCase()})</span>
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
          className="w-4 h-4 accent-accent"
        />
        <label htmlFor="isPinned" className="text-sm text-ink cursor-pointer">
          📌 Pin {isOccurrence || isSeriesEdit || form.recurring ? "the whole series" : "this task"} (listed in the
          dashboard&apos;s Pinned panel)
        </label>
      </div>
    </>
  );
}
