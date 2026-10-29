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
      className="ui-input text-sm"
    />
  );
}

export default function AnyTimePanel({ items, error = false, timeFormat, todayStr, onToggle, onTogglePin, onItemClick }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const needle = query.trim().toLowerCase();
  const filtered = needle ? items.filter((item) => item.title.toLowerCase().includes(needle)) : items;

  const renderList = (list, className) => (
    <ul className={`grid gap-[7px] overflow-y-auto p-0 m-0 ${className}`}>
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
    <section className="k-panel" aria-labelledby="anytime-heading">
      <div className="k-ph">
        <h3 id="anytime-heading">Any time</h3>
        {items.length > MODAL_THRESHOLD && (
          <button type="button" onClick={() => setOpen(true)} className="k-link">
            Show all →
          </button>
        )}
        {items.length > 0 && <span className="k-cnt" aria-label={`${items.length} tasks`}>{items.length}</span>}
      </div>

      <div className="k-pb">
        {error ? (
          <div className="k-empty">
            <h4>Could not load this list</h4>
            <p>Try refreshing the page.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="k-empty">
            <h4>No any-time tasks</h4>
            <p>Tasks without a date or time are kept here.</p>
          </div>
        ) : (
          <>
            {items.length > 3 && <SearchBox value={query} onChange={setQuery} />}
            {filtered.length === 0 ? (
              <div className="k-empty">
                <h4>No match</h4>
              </div>
            ) : (
              renderList(filtered, "max-h-64")
            )}
          </>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="ui-panel w-full max-w-2xl max-h-[85vh] flex flex-col p-4 gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Any-time tasks ({items.length})</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted hover:text-ink px-2"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <SearchBox value={query} onChange={setQuery} />
            {filtered.length === 0 ? (
              <p className="text-sm text-muted italic py-6 text-center">No match.</p>
            ) : (
              renderList(filtered, "flex-1")
            )}
          </div>
        </div>
      )}
    </section>
  );
}
