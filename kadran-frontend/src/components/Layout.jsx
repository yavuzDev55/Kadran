import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";
import { getTaskDisplaySettings } from "../utils/taskDisplaySettings";

export default function Layout() {
  const { user, logout, loading: authLoading, authError } = useAuth();
  const location = useLocation();
  const [displaySettings, setDisplaySettings] = useState(getTaskDisplaySettings);

  const isActive = (path) => location.pathname === path;
  const authenticatedUser = !authLoading && !authError && user;
  const isLightPage =
    location.pathname === "/" ||
    ["/tasks", "/calendar", "/login", "/register", "/settings"].includes(location.pathname);

  useEffect(() => {
    let media;
    let systemThemeHandler;
    const applyTheme = (theme) => {
      media?.removeEventListener("change", systemThemeHandler);
      media = null;
      systemThemeHandler = null;
      if (theme === "system") {
        media = window.matchMedia("(prefers-color-scheme: dark)");
        systemThemeHandler = () => {
          document.documentElement.dataset.theme = media.matches ? "dark" : "light";
        };
        systemThemeHandler();
        media.addEventListener("change", systemThemeHandler);
      } else {
        document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
      }
    };
    const handleThemeChange = (event) => applyTheme(event.detail);
    const applyStoredTheme = () => {
      let theme;
      try {
        theme = localStorage.getItem("kadran_theme") || "light";
      } catch {
        theme = "light";
      }
      applyTheme(theme);
    };
    applyStoredTheme();
    window.addEventListener("kadran-theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("kadran-theme-change", handleThemeChange);
      media?.removeEventListener("change", systemThemeHandler);
    };
  }, []);

  useEffect(() => {
    const updateDisplaySettings = () => setDisplaySettings(getTaskDisplaySettings());
    window.addEventListener("kadran-display-settings-change", updateDisplaySettings);
    return () => window.removeEventListener("kadran-display-settings-change", updateDisplaySettings);
  }, []);

  return (
    <div className={`min-h-screen font-sans ${isLightPage ? "bg-canvas text-ink" : "bg-slate-950 text-slate-200"}`}>
      <nav className="sticky top-0 z-50 border-b border-border/20 bg-surface/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <div className="flex items-center gap-8">
              <Link to="/" className="font-title text-xl text-ink tracking-wide">
                Kadran
              </Link>
              
              {authenticatedUser && (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/" className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive("/") ? "bg-surface-muted text-ink" : "text-muted hover:bg-surface-muted/70 hover:text-ink"
                  }`}>
                    Dashboard
                  </Link>
                  <Link to="/tasks" className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive("/tasks") ? "bg-surface-muted text-ink" : "text-muted hover:bg-surface-muted/70 hover:text-ink"
                  }`}>
                    List View
                  </Link>
                  <Link to="/calendar" className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive("/calendar") ? "bg-surface-muted text-ink" : "text-muted hover:bg-surface-muted/70 hover:text-ink"
                  }`}>
                    Calendar
                  </Link>
                  <Link to="/tasks/new" className="ui-button ui-button--primary ui-button--sm ml-2">
                    + New task
                  </Link>
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              {authenticatedUser ? (
                <div className="flex items-center gap-4">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: displaySettings.avatarColor }}
                    aria-hidden="true"
                    title={user.headline || user.email}
                  >
                    {(user.displayName || user.email || "U").trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden text-sm text-muted md:block" title={user.headline || undefined}>
                    {user.displayName || user.email}
                  </span>
                  
                  {/* Settings Link */}
                  <Link 
                    to="/settings" 
                    className={`rounded-md p-2 transition ${isActive("/settings") ? "bg-surface-muted text-accent" : "text-muted hover:bg-surface-muted/70 hover:text-ink"}`}
                    title="Settings"
                    aria-label="Settings"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>

                  <Button onClick={logout} size="sm">Log out</Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-medium text-muted hover:text-ink">Sign in</Link>
                  <Link to="/register" className="text-sm font-medium text-link hover:text-accent">Register</Link>
                </div>
              )}
            </div>

          </div>
          {authenticatedUser && (
            <div className="grid grid-cols-4 gap-1 pb-2 sm:hidden">
              <Link
                to="/"
                aria-current={isActive("/") ? "page" : undefined}
                className={`rounded-md px-1 py-2 text-center text-xs font-medium transition ${
                  isActive("/") ? "bg-surface-muted text-ink" : "text-muted hover:bg-surface-muted/70 hover:text-ink"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/tasks"
                aria-current={isActive("/tasks") ? "page" : undefined}
                className={`rounded-md px-1 py-2 text-center text-xs font-medium transition ${
                  isActive("/tasks") ? "bg-surface-muted text-ink" : "text-muted hover:bg-surface-muted/70 hover:text-ink"
                }`}
              >
                Tasks
              </Link>
              <Link
                to="/calendar"
                aria-current={isActive("/calendar") ? "page" : undefined}
                className={`rounded-md px-1 py-2 text-center text-xs font-medium transition ${
                  isActive("/calendar") ? "bg-surface-muted text-ink" : "text-muted hover:bg-surface-muted/70 hover:text-ink"
                }`}
              >
                Calendar
              </Link>
              <Link to="/tasks/new" className="ui-button ui-button--primary ui-button--sm justify-center">
                + New task
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-[1400px]">
        <Outlet />
      </main>
    </div>
  );
}