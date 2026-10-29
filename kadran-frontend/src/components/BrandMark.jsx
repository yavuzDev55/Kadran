// The Kadran clock mark (Design Tools reference). Sized by its parent via CSS (width/height).
export default function BrandMark() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12" fill="none" stroke="rgb(var(--color-ink))" strokeWidth="1.6" />
      <path d="M14 4v3M24 14h-3M14 24v-3M4 14h3" stroke="rgb(var(--color-ink))" strokeWidth="1.6" />
      <path d="M14 14V8.5" stroke="rgb(var(--color-accent))" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 14l5 3" stroke="rgb(var(--color-ink))" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
