import { forwardRef, useState } from "react";

// Password field with a Show / Hide toggle (reference). Spreads its props onto the <input>, so it
// works with react-hook-form's register() and with the Field wrapper's id / aria props.
const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [shown, setShown] = useState(false);

  return (
    <div className="k-pwrap">
      <input {...props} ref={ref} type={shown ? "text" : "password"} className="ui-field__control" />
      <button type="button" aria-pressed={shown} aria-label={shown ? "Hide password" : "Show password"} onClick={() => setShown((value) => !value)}>
        {shown ? "Hide" : "Show"}
      </button>
    </div>
  );
});

export default PasswordInput;
