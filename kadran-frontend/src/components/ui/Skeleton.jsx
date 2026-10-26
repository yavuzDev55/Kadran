export default function Skeleton({
  width = "100%",
  height = 16,
  label = "Loading",
  className = "",
  style,
}) {
  return (
    <span
      className={["ui-skeleton", className].filter(Boolean).join(" ")}
      style={{ width, height, ...style }}
      role="status"
      aria-label={label}
      aria-busy="true"
    />
  );
}
