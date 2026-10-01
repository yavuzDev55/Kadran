import React from "react";

const TYPE_STYLES = {
  COURSE: "bg-blue-900/80 border-blue-500 text-blue-100",
  EXAM: "bg-red-900/80 border-red-500 text-red-100",
  HOMEWORK: "bg-green-900/80 border-green-500 text-green-100",
  CUSTOM: "bg-slate-700/80 border-slate-400 text-slate-200",
};

const PRIORITY_ICON = { LOW: "◇", MEDIUM: "■", HIGH: "★" };

export default function CalendarEventCard({ event, onClick, onToggle }) {
  const styles = TYPE_STYLES[event.type] || TYPE_STYLES.CUSTOM;
  const icon = PRIORITY_ICON[event.priority] || PRIORITY_ICON.MEDIUM;

  const handleToggle = (e) => {
    e.stopPropagation(); // Kartın onClick tetiklenmesini engeller
    if (onToggle) onToggle(event.taskId);
  };

  return (
    <div 
      onClick={() => onClick && onClick(event)}
      className={`h-full w-full p-1.5 rounded border-l-4 cursor-pointer hover:brightness-110 shadow-sm flex flex-col overflow-hidden text-xs ${styles} ${event.isCompleted ? 'opacity-40 grayscale' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-1.5 overflow-hidden">
          <input 
            type="checkbox" 
            checked={event.isCompleted}
            onChange={handleToggle}
            className="mt-0.5 cursor-pointer accent-green-500"
          />
          <span className={`font-semibold truncate ${event.isCompleted ? 'line-through text-slate-400' : ''}`}>
            {event.title}
          </span>
        </div>
        <span className="shrink-0 text-[10px] ml-1">{icon}</span>
      </div>
      
      {(event.startTime || event.endTime) && (
        <div className="opacity-80 mt-1 pl-4 flex-none">
          {event.startTime} - {event.endTime}
        </div>
      )}
    </div>
  );
}