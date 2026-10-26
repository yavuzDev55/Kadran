const VARIANTS = new Set(["primary", "danger"]);
const SIZES = new Set(["sm", "md", "lg"]);

export default function Button({
  children,
  variant = "default",
  size = "md",
  className = "",
  type = "button",
  ...props
}) {
  const safeVariant = VARIANTS.has(variant) ? variant : "default";
  const safeSize = SIZES.has(size) ? size : "md";
  const classes = [
    "ui-button",
    safeVariant !== "default" && `ui-button--${safeVariant}`,
    safeSize !== "md" && `ui-button--${safeSize}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}
