import { Link } from "react-router-dom";

const PATTERN_LABELS = { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly" };

export default function TaskSeriesNotice({ seriesInfo, taskId, isOccurrence }) {
  return (
    <div className="mb-4 p-3 rounded border border-accent/30 bg-accent/10 text-sm text-ink flex flex-wrap items-center justify-between gap-2">
      <span>
        🔁 Part of a {PATTERN_LABELS[seriesInfo.pattern].toLowerCase()} series ({seriesInfo.taskCount} tasks,{" "}
        {seriesInfo.startDate} → {seriesInfo.endDate}).{" "}
        {isOccurrence
          ? "The day, time and note of this occurrence can be changed."
          : "Changes apply to every occurrence. Type, time and repeat rule cannot be changed."}
      </span>
      {isOccurrence ? (
        <Link to={`/tasks/edit/${taskId}?scope=series`} className="text-link underline hover:text-accent">
          Edit whole series
        </Link>
      ) : (
        <Link to={`/tasks/edit/${taskId}`} className="text-link underline hover:text-accent">
          Edit this occurrence
        </Link>
      )}
    </div>
  );
}
