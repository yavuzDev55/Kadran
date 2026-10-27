export default function DeskIllustration({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 130"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M170 112h448M190 112l8-18h46l-8 18zM258 112l8-18h46l-8 18z" />
        <circle cx="368" cy="78" r="28" />
        <path d="M368 57v21l13 8M341 111l-5 8M395 111l5 8" />
        <rect x="424" y="94" width="82" height="18" rx="2" />
        <rect x="432" y="76" width="66" height="18" rx="2" />
        <path d="M542 112V78l31-31M570 112V83h30v29M578 83l-7-21M585 83l2-25M593 83l9-21" />
      </g>
    </svg>
  );
}
