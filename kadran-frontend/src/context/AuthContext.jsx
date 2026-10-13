// src/context/AuthContext.jsx

import { createContext, useContext, useState } from "react";
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
  // The session is restored synchronously from localStorage, so there is no loading phase
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const loading = false;

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    // Response format: { success, data: { user, token } }
    const { user, token } = response.data.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // Updates user in both state and localStorage after a settings save
  const updateUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);