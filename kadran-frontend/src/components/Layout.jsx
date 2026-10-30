import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getTaskDisplaySettings } from "../utils/taskDisplaySettings";
import BrandMark from "./BrandMark";

// Line icons from the Design Tools reference (24px grid, 1.7 stroke).
function NavIcon({ children }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

const ICONS = {
  dashboard: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  tasks: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </>
  ),
  out: <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />,
  plus: <path d="M12 5v14M5 12h14" />,
};

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/calendar", label: "Calendar", icon: "calendar" },
  { to: "/tasks", label: "Tasks", icon: "tasks" },
];

const LAST_MAIN_ROUTE_KEY = "kadran_last_main_route";

export default function Layout() {
  const { user, logout, loading: authLoading, authError } = useAuth();
  const location = useLocation();
  const [displaySettings, setDisplaySettings] = useState(getTaskDisplaySettings);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const isActive = (path) => location.pathname === path;
  const authenticatedUser = !authLoading && !authError && user;
  // Sign-in and register are full-screen pages (reference): no app bar, no centered column.
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    if (!["/", "/calendar", "/tasks"].includes(location.pathname)) return;
    try {
      sessionStorage.setItem(LAST_MAIN_ROUTE_KEY, `${location.pathname}${location.search}`);
    } catch {
      // The current route still works when session storage is unavailable.
    }
  }, [location.pathname, location.search]);

  // The profile menu closes on outside press and Escape (focus returns to its button).
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

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

  const initial = (user?.displayName || user?.email || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="flex min-h-[100dvh] flex-col kadran-textured-page bg-canvas font-sans text-ink">
      {!isAuthRoute && (
      <header className="appbar sticky top-0 z-50 bg-surface/95 backdrop-blur">
        <Link to="/" className="appbar-mark">
          <BrandMark />
          Kadran
        </Link>

        {authenticatedUser && (
          <nav className="appnav order-last w-full sm:order-none sm:w-auto" aria-label="Main">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive(item.to) ? "page" : undefined}
              >
                <NavIcon>{ICONS[item.icon]}</NavIcon>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {authenticatedUser ? (
          <>
            <Link to="/tasks/new" className="ui-button ui-button--primary ui-button--sm whitespace-nowrap">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                {ICONS.plus}
              </svg>
              New task
            </Link>

            <div className="me-wrap" ref={menuRef}>
              <button
                type="button"
                ref={menuButtonRef}
                className="me"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="me-av" style={{ "--c": displaySettings.avatarColor }} aria-hidden="true">
                  {initial}
                </span>
                <span className="me-txt hidden sm:block">
                  <b>{user.displayName || user.email}</b>
                  <small>{user.headline || (user.displayName ? user.email : "No headline")}</small>
                </span>
                <span className="sr-only sm:hidden">{user.displayName || user.email}</span>
              </button>
              {menuOpen && (
                <div className="me-menu" role="menu">
                  <Link to="/settings" role="menuitem" onClick={() => setMenuOpen(false)}>
                    <NavIcon>{ICONS.user}</NavIcon>
                    Settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    <NavIcon>{ICONS.out}</NavIcon>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-muted hover:text-ink">Sign in</Link>
            <Link to="/register" className="text-sm font-medium text-link hover:text-accent">Register</Link>
          </div>
        )}
      </header>
      )}

      <main className="w-full flex-1">
        <Outlet />
      </main>
    </div>
  );
}
