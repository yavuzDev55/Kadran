import { Link } from "react-router-dom";
import AuthArt from "./AuthArt";
import BrandMark from "./BrandMark";

// Full-screen sign-in / register layout from the Design Tools reference: a dotted-paper art pane
// on the left, the form on the right (stacked, art on top, below 900px).
export default function AuthShell({ title, lead, alternateLabel, alternateTo, alternateAction, children }) {
  return (
    <div className="k-auth">
      <div className="k-auth__art" aria-hidden="true">
        <AuthArt />
      </div>
      <div className="k-auth__form">
        <Link to="/login" className="appbar-mark" aria-label="Kadran">
          <BrandMark />
          Kadran
        </Link>
        <h1>{title}</h1>
        <p className="k-auth__lead">{lead}</p>
        {children}
        <p className="k-auth__alt">
          {alternateLabel} <Link to={alternateTo}>{alternateAction}</Link>
        </p>
      </div>
    </div>
  );
}
