// src/components/CalendarSpanBar.jsx
// A multi-day task drawn as a bar across whole days. The ends are flat and carry an arrow when
// the task continues into the previous / next week.


export default function CalendarSpanBar({ span, onClick }) {
  const color = span.effectiveColor || "#94a3b8";
  const done = span.isCompleted;

  return (
    <div
      onClick={() => onClick && onClick(span)}
      title={span.title}
      style={{
        gridColumn: `${span.colStart} / ${span.colEnd}`,
        gridRow: span.row + 1,
        backgroundColor: `${color}40`,
        borderColor: color,
      }}
      className={`mx-0.5 px-1.5 h-5 flex items-center gap-1 text-[11px] border-l-2 cursor-pointer hover:brightness-125 transition overflow-hidden ${
        span.continuesBefore ? "rounded-l-none border-l-0" : "rounded-l"
      } ${span.continuesAfter ? "rounded-r-none" : "rounded-r"} ${done ? "opacity-40 grayscale" : ""}`}
    >
      {span.continuesBefore && <span className="text-slate-300">‹</span>}
      <span className={`truncate ${done ? "line-through text-slate-400" : "text-slate-100"}`}>{span.title}</span>
      {span.continuesAfter && <span className="ml-auto text-slate-300">›</span>}
    </div>
  );
}
