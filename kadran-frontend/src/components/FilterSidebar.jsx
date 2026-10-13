// src/components/FilterSidebar.jsx
// Left-hand filter panel shared by the list page and the calendar. Controlled: the page owns
// the filter values and passes them in. `sections` picks which groups are shown.

import { useState } from "react";
import TagCombobox from "./TagCombobox";
import { TASK_TYPES, TIME_TYPE_SHORT_LABELS } from "../utils/taskRules";
import { DEFAULT_SECTIONS, countActiveFilters } from "../utils/filters";

const PRIORITIES = [
  { id: "HIGH", label: "High" },
  { id: "MEDIUM", label: "Medium" },
  { id: "LOW", label: "Low" },
];

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</h3>
      <div className="flex flex-wrap gap-1.5">
        {[{ id: "", label: "All" }, ...options].map((option) => (
          <button
            key={option.id || "all"}
            type="button"
            onClick={() => onChange(option.id)}
            className={`px-2 py-1 text-xs rounded border transition ${
              value === option.id
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FilterSidebar({ filters, onChange, onReset, sections = {}, className = "" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const show = { ...DEFAULT_SECTIONS, ...sections };
  const active = countActiveFilters(filters);

  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <aside className={`w-full md:w-60 md:shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        className="md:hidden w-full flex items-center justify-between px-3 py-2 mb-2 bg-slate-800 border border-slate-700 rounded text-sm font-semibold text-slate-200"
      >
        <span>Filters{active > 0 ? ` (${active})` : ""}</span>
        <span>{mobileOpen ? "▲" : "▼"}</span>
      </button>

      <div
        className={`${mobileOpen ? "flex" : "hidden"} md:flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4 md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Filters</h2>
          {active > 0 && (
            <button type="button" onClick={onReset} className="text-xs text-blue-400 hover:text-blue-300">
              Clear all
            </button>
          )}
        </div>

        {show.search && (
          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search</h3>
            <input
              type="text"
              value={filters.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Title contains..."
              className="w-full p-2 text-sm rounded bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {show.type && (
          <ChipGroup
            label="Task type"
            options={TASK_TYPES.map((t) => ({ id: t.id, label: t.label }))}
            value={filters.type}
            onChange={(type) => set({ type })}
          />
        )}

        {show.timeType && (
          <ChipGroup
            label="Time type"
            options={Object.entries(TIME_TYPE_SHORT_LABELS)
              .filter(([id]) => show.timeType === true || show.timeType.includes(id))
              .map(([id, label]) => ({ id, label }))}
            value={filters.timeType}
            onChange={(timeType) => set({ timeType })}
          />
        )}

        {show.priority && (
          <ChipGroup
            label="Priority"
            options={PRIORITIES}
            value={filters.priority}
            onChange={(priority) => set({ priority })}
          />
        )}

        {show.tags && (
          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tags</h3>
            <TagCombobox
              selectedTags={filters.tags}
              onAdd={(tag) => set({ tags: [...filters.tags, tag] })}
              onRemove={(tag) => set({ tags: filters.tags.filter((t) => t !== tag) })}
              placeholder="Filter by tag..."
            />
          </div>
        )}

        {show.dates && (
          <div className="flex flex-col gap-2">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date range</h3>
            <label className="text-xs text-slate-400">
              From
              <input
                type="date"
                value={filters.from}
                onChange={(e) => set({ from: e.target.value })}
                className="mt-1 w-full p-1.5 text-sm rounded bg-slate-950 border border-slate-700 text-slate-100"
              />
            </label>
            <label className="text-xs text-slate-400">
              To
              <input
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(e) => set({ to: e.target.value })}
                className="mt-1 w-full p-1.5 text-sm rounded bg-slate-950 border border-slate-700 text-slate-100"
              />
            </label>
          </div>
        )}

        {(show.completed || show.pinned) && (
          <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
            {show.completed && (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={filters.showCompleted}
                  onChange={(e) => set({ showCompleted: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                Show completed
              </label>
            )}
            {show.pinned && (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={filters.pinnedOnly}
                  onChange={(e) => set({ pinnedOnly: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                📌 Pinned only
              </label>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
