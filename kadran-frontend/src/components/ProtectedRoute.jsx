import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";

export default function ProtectedRoute({ children }) {
  const { token, loading, authError, verifySession } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-center text-muted" role="status">Verifying your session...</div>;
  }

  if (authError) {
    return (
      <div className="mx-auto mt-12 max-w-lg ui-panel p-6 text-center">
        <h1 className="font-title text-2xl text-ink">Session unavailable</h1>
        <p className="mt-2 text-sm text-muted">{authError}</p>
        <Button className="mt-5" onClick={verifySession}>Try again</Button>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the protected component if token exists
  return children;
}