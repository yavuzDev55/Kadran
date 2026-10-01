import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if there is no token, keeping the intended URL
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the protected component if token exists
  return children;
}