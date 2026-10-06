// src/components/TaskDetailModal.jsx

import React from "react";
import { formatTime } from "../utils/formatTime";

const PRIORITY_LABELS = {
  LOW: "Low Priority",
  MEDIUM: "Medium Priority",
  HIGH: "High Priority",
};

export default function TaskDetailModal({ event, onClose, onDelete, onEdit, onToggle, timeFormat = "H24" }) {
  if (!event) return null;

  const isRecurringOccurrence = Boolean(event.originalTask?.isRecurring);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // FIX: previously only passed event.taskId. Recurring tasks require the
  // occurrence date to toggle the correct instance — omitting it made the
  // backend reject the request (400), which reverted the optimistic UI
  // update and showed a "failed" toast right after showing "completed".
  const handleToggle = (e) => {
    e.stopPropagation();
    if (onToggle) onToggle(event.taskId, event.date);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md flex flex-col overflow-hidden">

        <div className="flex justify-between items-start p-4 border-b border-slate-700/50">
          <div className="flex items-start gap-3">
            {event.isCompletable !== false && (
              <input
                type="checkbox"
                checked={event.isCompleted || false}
                onChange={handleToggle}
                className="mt-1 w-4 h-4 cursor-pointer accent-green-500"
                title="Mark as completed"
              />
            )}
            <div>
              <h2 className={`text-xl font-bold ${event.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                {event.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {event.type}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  event.priority === 'HIGH' ? 'bg-red-900/50 text-red-300' :
                  event.priority === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-300' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {PRIORITY_LABELS[event.priority]}
                </span>
                {event.isCompleted && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-900/50 text-green-300">
                    ✓ Completed
                  </span>
                )}
                {!event.isCompletable && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-700">
                    Not completable
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 bg-slate-700/50 hover:bg-slate-600 rounded shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 text-sm text-slate-300">

          {/* This date/time block is occurrence-specific — it reflects THIS instance,
              not just the parent task's stored default time. */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              {isRecurringOccurrence ? "This Occurrence" : "Date & Time"}
            </span>
            <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700/50">
              <span>{event.date}</span>
              {event.startTime && (
                <>
                  <span className="text-slate-500">•</span>
                  <span>
                    {formatTime(event.startTime, timeFormat)}
                    {event.endTime ? ` – ${formatTime(event.endTime, timeFormat)}` : ''}
                  </span>
                </>
              )}
            </div>
          </div>

          {event.originalTask?.description && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Description</span>
              <p className="bg-slate-900/50 p-2 rounded border border-slate-700/50 whitespace-pre-wrap">
                {event.originalTask.description}
              </p>
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {event.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isRecurringOccurrence && (
            <div className="text-xs text-slate-500 bg-slate-900/50 p-2 rounded border border-slate-700/50 flex flex-col gap-1">
              <span>🔁 This is one occurrence of a recurring task.</span>
              <span>Marking it complete only affects <strong>this date</strong>. Editing or deleting affects <strong>the entire series</strong>.</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-slate-900/30 flex justify-between items-center">
          {event.isCompletable !== false ? (
            <button
              onClick={handleToggle}
              className={`px-4 py-2 text-sm font-medium rounded border transition ${
                event.isCompleted
                  ? 'text-slate-300 border-slate-600 hover:bg-slate-700'
                  : 'text-green-400 border-green-900/50 hover:bg-green-700 hover:text-white'
              }`}
            >
              {event.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              onClick={() => onDelete(event.taskId)}
              className="px-4 py-2 text-sm font-medium text-red-400 hover:text-white hover:bg-red-600 transition rounded border border-red-900/50"
            >
              {isRecurringOccurrence ? 'Delete Series' : 'Delete'}
            </button>
            <button
              onClick={() => onEdit(event.taskId)}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition rounded border border-slate-700"
            >
              {isRecurringOccurrence ? 'Edit Series' : 'Edit'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}