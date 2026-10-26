import { cloneElement, isValidElement, useId } from "react";

export default function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = "",
}) {
  const generatedId = useId();
  const controlId =
    (isValidElement(children) && typeof children.props.id === "string"
      ? children.props.id
      : htmlFor ?? `${generatedId}-control`);
  const hintId = hint ? `${generatedId}-hint` : undefined;
  const errorId = error ? `${generatedId}-error` : undefined;
  const childDescription = isValidElement(children) ? children.props["aria-describedby"] : undefined;
  const describedBy = [childDescription, hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : children.props["aria-invalid"],
      })
    : children;

  return (
    <div className={["ui-field", className].filter(Boolean).join(" ")}>
      {label && <label htmlFor={controlId}>{label}</label>}
      {control}
      {hint && (
        <span className="ui-field__hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="ui-field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
