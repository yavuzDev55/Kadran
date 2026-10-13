// src/components/TagCombobox.jsx
// Tag picker that suggests existing tags while the user types (GET /tags?filter=) instead of
// listing every tag. Selected tags are shown as removable chips.

import { useEffect, useRef, useState } from "react";
import api from "../services/api";

const TAG_REGEX = /^[\p{L}0-9_\- ]{1,50}$/u;
const DEBOUNCE_MS = 300;
const SUGGESTION_LIMIT = 8;

const normalize = (value) => value.trim().toLowerCase();

export default function TagCombobox({
  selectedTags = [],
  onAdd,
  onRemove,
  placeholder = "Search or add a tag...",
  disabled = false,
  hideChips = false,
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef(null);
  const requestId = useRef(0);

  const normalizedQuery = normalize(query);
  const selectedSet = new Set(selectedTags.map(normalize));

  // Debounced lookup. Late responses of older requests are ignored.
  useEffect(() => {
    if (!normalizedQuery) return undefined;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/tags", { params: { filter: normalizedQuery, limit: SUGGESTION_LIMIT } });
        if (id === requestId.current) setSuggestions(res.data.tags || []);
      } catch {
        if (id === requestId.current) setSuggestions([]);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [normalizedQuery]);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const visible = normalizedQuery ? suggestions.filter((tag) => !selectedSet.has(normalize(tag.name))) : [];
  const exactExists =
    selectedSet.has(normalizedQuery) || visible.some((tag) => normalize(tag.name) === normalizedQuery);
  const canCreate = normalizedQuery && TAG_REGEX.test(normalizedQuery) && !exactExists;

  // Rows of the dropdown: existing matches first, then the "create" row
  const options = [
    ...visible.map((tag) => ({ key: `tag-${tag.id}`, name: tag.name, create: false })),
    ...(canCreate ? [{ key: "create", name: normalizedQuery, create: true }] : []),
  ];

  const choose = (name) => {
    if (!name || selectedSet.has(normalize(name))) return;
    onAdd(normalize(name));
    setQuery("");
    setSuggestions([]);
    setHighlight(0);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(options.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault(); // never submit the surrounding form
      const picked = options[highlight] ?? options[0];
      if (picked) choose(picked.name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {!hideChips && selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-blue-400 text-xs rounded border border-slate-600"
            >
              #{tag}
              {onRemove && !disabled && (
                <button
                  type="button"
                  onClick={() => onRemove(tag)}
                  className="text-slate-500 hover:text-red-400 leading-none"
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full p-2 text-sm rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-60"
        autoComplete="off"
      />

      {open && options.length > 0 && (
        <ul className="absolute z-40 mt-1 w-full max-h-56 overflow-y-auto bg-slate-800 border border-slate-600 rounded shadow-xl">
          {options.map((option, index) => (
            <li key={option.key}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(option.name)}
                className={`w-full text-left px-3 py-1.5 text-sm transition ${
                  index === highlight ? "bg-blue-600 text-white" : "text-slate-200 hover:bg-slate-700"
                }`}
              >
                {option.create ? (
                  <>Create tag “<span className="font-semibold">{option.name}</span>”</>
                ) : (
                  <>#{option.name}</>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
