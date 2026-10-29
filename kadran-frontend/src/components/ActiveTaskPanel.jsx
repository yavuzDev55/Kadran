// src/components/ActiveTaskPanel.jsx
// "Now" / "Up next" card (Design Tools reference ".nowp"). Only TIMED tasks (running between start
// and end) and MULTI_DAY tasks (today inside the day range) count as active. When nothing is
// active it shows the next task of today with a countdown.

import Icon from "./Icon";
import DeskIllustration from "./DeskIllustration";
import { formatTaskTime, formatTime } from "../utils/formatTime";
import { formatDuration, getMultiDayProgress } from "../utils/dashboardUtils";
import { timeToMinutes } from "../utils/dateUtils";
import { TASK_TYPES } from "../utils/taskRules";
import { getTaskDisplayColor } from "../utils/taskDisplaySettings";

const typeLabel = (type) => TASK_TYPES.find((t) => t.id === type)?.label || type;

// Minutes of the clock time that decides when an item starts (a deadline is "at" its due time).
const anchorMinutes = (item) => {
  const time = item.timeType === "DEADLINE" ? item.endTime : item.startTime;
  return time ? timeToMinutes(time) : null;
};

function describeActive(item, todayStr, nowMinutes, timeFormat) {
  if (item.timeType === "MULTI_DAY") {
    const { day, total, daysLeft } = getMultiDayProgress(item, todayStr);
    return {
      spans: [
        <span key="s">{total === 1 ? "All day" : `Day ${day} of ${total}`}</span>,
        <span key="l">{daysLeft === 0 ? "last day" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}</span>,
      ],
      progress: Math.round((day / total) * 100),
    };
  }
  const start = timeToMinutes(item.startTime);
  const end = timeToMinutes(item.endTime);
  const length = end > start ? end - start : 24 * 60 - start;
  const left = (end > start ? end : 24 * 60) - nowMinutes;
  return {
    spans: [
      <span key="s">
        {formatTime(item.startTime, timeFormat)}–{formatTime(item.endTime, timeFormat)}
      </span>,
      <span key="l">
        <b>{formatDuration(left)}</b> left
      </span>,
    ],
    progress: Math.min(100, Math.max(3, Math.round(((nowMinutes - start) / length) * 100))),
  };
}

export default function ActiveTaskPanel({ activeItems, nextItem, todayStr, nowMinutes, timeFormat, onItemClick }) {
  const current = activeItems[0] || null;
  const item = current || nextItem;

  let content;
  if (!item) {
    content = (
      <>
        <div className="k-kick">Now</div>
        <h2>Nothing planned</h2>
        <div className="k-meta">Enjoy the quiet for the rest of today, or add a task.</div>
      </>
    );
  } else {
    let spans;
    let progress = null;
    if (current) {
      ({ spans, progress } = describeActive(current, todayStr, nowMinutes, timeFormat));
    } else {
      const anchor = anchorMinutes(item);
      spans = [<span key="s">{formatTaskTime(item, timeFormat)}</span>];
      if (anchor !== null && anchor > nowMinutes) {
        spans.push(
          <span key="l">
            in <b>{formatDuration(anchor - nowMinutes)}</b>
          </span>
        );
      }
    }
    const color = getTaskDisplayColor(item);
    const others = activeItems.slice(1);

    content = (
      <>
        <div className="k-kick">
          <i />
          {current ? "Now" : "Up next"}
        </div>
        <h2>
          <button type="button" className="text-left" onClick={() => onItemClick(item)}>
            {item.title}
          </button>
        </h2>
        <div className="k-meta">
          {spans}
          <span className={`k-badge k-fill k-ty-${item.type.toLowerCase()}`} style={{ "--c": color }}>
            <span className="k-ti">
              <Icon name={item.type.toLowerCase()} />
            </span>
            {typeLabel(item.type)}
          </span>
        </div>
        {progress !== null && (
          <div
            className="k-bar"
            style={{ "--c": color }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label={`${item.title} progress`}
          >
            <i style={{ width: `${progress}%` }} />
          </div>
        )}
        {others.length > 0 && (
          <div className="k-then">
            Also running:{" "}
            {others.map((other, index) => (
              <span key={other.id}>
                {index > 0 && ", "}
                <button type="button" className="underline" onClick={() => onItemClick(other)}>
                  {other.title}
                </button>
              </span>
            ))}
          </div>
        )}
        {current && nextItem && nextItem.id !== current.id && others.length === 0 && (
          <div className="k-then">
            Then: {nextItem.title}, {formatTaskTime(nextItem, timeFormat)}
          </div>
        )}
      </>
    );
  }

  return (
    <section className="k-panel k-now" aria-live="polite" aria-label="Now and next">
      <div className="k-now__banner" aria-hidden="true">
        <DeskIllustration />
      </div>
      {content}
    </section>
  );
}
