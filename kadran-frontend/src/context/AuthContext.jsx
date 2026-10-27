// src/context/AuthContext.jsx

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

const readStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored && localStorage.getItem("token") ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const initialToken = useRef(token);
  const initialVerification = useRef(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));
  const [authError, setAuthError] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setAuthError("");
    setLoading(false);
  }, []);

  const verifySession = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    setLoading(true);
    setAuthError("");
    try {
      const response = await api.get("/auth/me");
      const verifiedUser = response.data.data;
      localStorage.setItem("user", JSON.stringify(verifiedUser));
      setUser(verifiedUser);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 404) {
        logout();
      } else {
        setAuthError("We couldn't verify your saved session. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    if (!initialToken.current) return undefined;
    let active = true;
    const controller = new AbortController();
    initialVerification.current = controller;

    const verifyInitialSession = async () => {
      try {
        const response = await api.get("/auth/me", { signal: controller.signal });
        if (!active) return;
        const verifiedUser = response.data.data;
        localStorage.setItem("user", JSON.stringify(verifiedUser));
        setUser(verifiedUser);
      } catch (error) {
        if (!active || error.code === "ERR_CANCELED") return;
        if (error.response?.status === 401 || error.response?.status === 404) logout();
        else setAuthError("We couldn't verify your saved session. Check your connection and try again.");
      } finally {
        if (active && !controller.signal.aborted) setLoading(false);
      }
    };

    verifyInitialSession();
    return () => {
      active = false;
      controller.abort();
      if (initialVerification.current === controller) initialVerification.current = null;
    };
  }, [logout]);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener("kadran-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("kadran-unauthorized", handleUnauthorized);
  }, [logout]);

  const login = async (email, password) => {
    initialVerification.current?.abort();
    const response = await api.post("/auth/login", { email, password });
    // Response format: { success, data: { user, token } }
    const { user, token } = response.data.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
    setAuthError("");
    setLoading(false);
  };

  // Updates user in both state and localStorage after a settings save
  const updateUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, authError, verifySession, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);