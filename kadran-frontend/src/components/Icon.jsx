// src/components/Icon.jsx
// Line icons from the Design Tools reference (24px grid, 1.7 stroke). Decorative by default:
// put the accessible name on the button or text next to the icon.

const PATHS = {
  course: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M8 7.5h8" />
    </>
  ),
  exam: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="1.5" />
      <path d="M9 4V3h6v1M9 13l2 2 4-4" />
    </>
  ),
  homework: (
    <>
      <path d="M4 20l1-4L16 5l3 3L8 19z" />
      <path d="M14 7l3 3" />
    </>
  ),
  custom: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />,
  flag: <path d="M6 21V4M6 5h11l-2 4 2 4H6" />,
  start: <path d="M4 5h16M12 5v14M8 15l4 4 4-4" />,
  any: (
    <>
      <circle cx="12" cy="12" r="8" strokeDasharray="2.2 2.6" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  pin: (
    <>
      <path className="k-pin-fill" d="M9 4h6l-1 6 3 3H7l3-3z" />
      <path d="M12 13v7" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
};

export default function Icon({ name, className = "" }) {
  const paths = PATHS[name];
  if (!paths) return null;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths}
    </svg>
  );
}
