// src/components/AnyTimePanel.jsx
// All "any time" tasks (no date, no time). The list scrolls inside a fixed-height box and has a
// title search; with many tasks a button opens the full list in a dialog.

import { useState } from "react";
import DashboardTaskItem from "./DashboardTaskItem";

const MODAL_THRESHOLD = 10;

function SearchBox({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search any-time tasks..."
      className="w-full p-1.5 text-sm rounded bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
    />
  );
}

export default function AnyTimePanel({ items, error = false, timeFormat, todayStr, onToggle, onTogglePin, onItemClick }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const needle = query.trim().toLowerCase();
  const filtered = needle ? items.filter((item) => item.title.toLowerCase().includes(needle)) : items;

  const renderList = (list, className) => (
    <ul className={`flex flex-col gap-2 overflow-y-auto pr-1 ${className}`}>
      {list.map((item) => (
        <DashboardTaskItem
          key={item.id}
          item={item}
          todayStr={todayStr}
          timeFormat={timeFormat}
          onToggle={onToggle}
          onTogglePin={onTogglePin}
          onClick={onItemClick}
        />
      ))}
    </ul>
  );

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Any time
          {items.length > 0 && <span className="ml-2 text-slate-500 font-normal">({items.length})</span>}
        </h2>
        {items.length > MODAL_THRESHOLD && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            Show all →
          </button>
        )}
      </div>

      {error ? (
        <p className="text-sm text-red-300 py-4 text-center">Could not load this list.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-4 text-center">No any-time tasks.</p>
      ) : (
        <>
          {items.length > 3 && (
            <div className="mb-2">
              <SearchBox value={query} onChange={setQuery} />
            </div>
          )}
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4 text-center">No match.</p>
          ) : (
            renderList(filtered, "max-h-64")
          )}
        </>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col p-4 gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100">Any-time tasks ({items.length})</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white px-2"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <SearchBox value={query} onChange={setQuery} />
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-6 text-center">No match.</p>
            ) : (
              renderList(filtered, "flex-1")
            )}
          </div>
        </div>
      )}
    </section>
  );
}
