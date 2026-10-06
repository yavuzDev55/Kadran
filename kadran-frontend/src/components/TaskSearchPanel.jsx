// src/components/TaskSearchPanel.jsx
// Searches by title (q) and/or task type, server-side. Clicking a result opens the edit page.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import DashboardTaskItem from "./DashboardTaskItem";
import { taskToItem } from "../utils/dashboardUtils";

const SEARCH_DEBOUNCE_MS = 300;

export default function TaskSearchPanel({ todayStr, timeFormat }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const hasCriteria = query.trim() !== "" || type !== "";

  useEffect(() => {
    if (!hasCriteria) return;

    // `cancelled` drops responses from outdated searches (fast typing)
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const params = { limit: 20 };
        if (query.trim()) params.q = query.trim();
        if (type) params.type = type;

        const response = await api.get("/tasks", { params });
        if (!cancelled) setResults((response.data.data || []).map(taskToItem));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, type, hasCriteria]);

  const visibleResults = hasCriteria ? results : [];

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col h-full">
      <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Search</h2>

      <div className="flex flex-col gap-2 mb-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by task name..."
          className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All types</option>
          <option value="COURSE">Course</option>
          <option value="EXAM">Exam</option>
          <option value="HOMEWORK">Homework</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>

      {!hasCriteria ? (
        <p className="text-sm text-slate-500 italic text-center py-4">Type a name or pick a type.</p>
      ) : loading ? (
        <p className="text-sm text-slate-400 text-center py-4">Searching...</p>
      ) : visibleResults.length === 0 ? (
        <p className="text-sm text-slate-500 italic text-center py-4">No results found.</p>
      ) : (
        <ul className="flex flex-col gap-2 overflow-y-auto pr-1">
          {visibleResults.map((item) => (
            <DashboardTaskItem
              key={item.id}
              item={item}
              todayStr={todayStr}
              timeFormat={timeFormat}
              showDate
              onClick={() => navigate(`/tasks/edit/${item.taskId}`)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
