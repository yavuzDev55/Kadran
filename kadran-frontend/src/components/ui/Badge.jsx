const VARIANTS = new Set(["accent", "danger"]);

export default function Badge({ children, variant = "default", className = "" }) {
  const safeVariant = VARIANTS.has(variant) ? variant : "default";
  const classes = [
    "ui-badge",
    safeVariant !== "default" && `ui-badge--${safeVariant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
