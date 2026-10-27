// src/pages/SettingsPage.jsx

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import ConfirmDialog from "../components/ConfirmDialog";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import Switch from "../components/ui/Switch";
import {
  DISPLAY_COLOR_PALETTE,
  getTaskDisplaySettings,
  saveTaskDisplaySettings,
} from "../utils/taskDisplaySettings";
import { TASK_TYPES } from "../utils/taskRules";

const TIMEZONES = [
  { value: "Europe/Istanbul",    label: "Europe/Istanbul (GMT+3)"  },
  { value: "Europe/London",      label: "Europe/London (GMT+0)"    },
  { value: "Europe/Berlin",      label: "Europe/Berlin (GMT+1)"    },
  { value: "Europe/Paris",       label: "Europe/Paris (GMT+1)"     },
  { value: "America/New_York",   label: "America/New_York (GMT-5)" },
  { value: "America/Chicago",    label: "America/Chicago (GMT-6)"  },
  { value: "America/Los_Angeles",label: "America/Los_Angeles (GMT-8)"},
  { value: "Asia/Tokyo",         label: "Asia/Tokyo (GMT+9)"       },
  { value: "Asia/Dubai",         label: "Asia/Dubai (GMT+4)"       },
  { value: "Asia/Singapore",     label: "Asia/Singapore (GMT+8)"   },
  { value: "Australia/Sydney",   label: "Australia/Sydney (GMT+11)"},
  { value: "UTC",                label: "UTC (GMT+0)"              },
];

const readTheme = () => {
  try {
    const saved = localStorage.getItem("kadran_theme");
    return ["light", "dark", "system"].includes(saved) ? saved : "light";
  } catch {
    return "light";
  }
};

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();

  const [theme, setTheme] = useState(readTheme);
  const [timeZone,      setTimeZone]      = useState(user?.timeZone      || "Europe/Istanbul");
  const [weekStartsOn,  setWeekStartsOn]  = useState(user?.weekStartsOn  || "MONDAY");
  const [dayStartHour,  setDayStartHour]  = useState(user?.dayStartHour  ?? 8);
  const [dayEndHour,    setDayEndHour]    = useState(user?.dayEndHour     ?? 22);
  const [timeFormat,    setTimeFormat]    = useState(user?.timeFormat     || "H24");
  const [defaultView,   setDefaultView]   = useState(user?.defaultView    || "WEEK");
  const [hideCompleted, setHideCompleted] = useState(user?.hideCompleted  || false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [headline, setHeadline] = useState(user?.headline || "");
  const [displaySettings, setDisplaySettings] = useState(getTaskDisplaySettings);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [deletePassword,  setDeletePassword]  = useState("");

  const [savingProfile,  setSavingProfile]  = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      document.documentElement.dataset.theme = theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    applyTheme();
    if (theme === "system") media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    try {
      localStorage.setItem("kadran_theme", nextTheme);
    } catch {
      toast.error("Theme preference could not be saved in this browser.");
    }
    window.dispatchEvent(new CustomEvent("kadran-theme-change", { detail: nextTheme }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch("/auth/me", {
        displayName,
        headline,
        timeZone,
        weekStartsOn,
        dayStartHour: Number(dayStartHour),
        dayEndHour:   Number(dayEndHour),
        timeFormat,
        defaultView,
        hideCompleted,
      });
      updateUser(res.data.data);
      try {
        saveTaskDisplaySettings(displaySettings);
        window.dispatchEvent(new Event("kadran-display-settings-change"));
      } catch {
        toast.error("Task and avatar colors could not be saved in this browser.");
      }
      toast.success("Preferences saved successfully.");
    } catch (err) {
      const msg = err.response?.data?.error?.message || "Failed to save preferences.";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.patch("/auth/me/password", { currentPassword, newPassword });
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      const details = err.response?.data?.error?.details || {};
      const msg = details.currentPassword || details.newPassword
        || err.response?.data?.error?.message
        || "Failed to update password.";
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Enter your password to confirm deletion.");
      return;
    }

    setConfirmDelete(false);
    setDeletingAccount(true);
    try {
      await api.delete("/auth/me", { data: { password: deletePassword } });
      toast.success("Account deleted.");
      logout();
    } catch (err) {
      const details = err.response?.data?.error?.details || {};
      const msg = details.password
        || err.response?.data?.error?.message
        || "Failed to delete account.";
      toast.error(msg);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-4 mb-20">
      <h1 className="font-title text-3xl font-normal text-ink mb-6">Profile & Settings</h1>

      <div className="flex flex-col gap-6">

        {/* Preferences */}
        <div className="ui-panel">
          <div className="ui-panel__heading">
            <h2 className="text-lg font-semibold text-ink">Profile & preferences</h2>
            <p className="mt-1 text-xs text-muted">Your profile, calendar display and regional settings</p>
          </div>
          <form onSubmit={handleSaveProfile} className="p-4 flex flex-col gap-4">

            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">Personal profile</h3>
              <div className="flex flex-col gap-4">
                <Field label="Avatar color" hint="Used for your initials in the navigation. Saved in this browser.">
                  <div className="flex flex-wrap gap-2">
                    {DISPLAY_COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Set avatar color ${color}`}
                        aria-pressed={displaySettings.avatarColor === color}
                        onClick={() =>
                          setDisplaySettings((current) => ({ ...current, avatarColor: color }))
                        }
                        className={`h-7 w-7 rounded-full border-2 transition ${
                          displaySettings.avatarColor === color
                            ? "border-ink scale-110"
                            : "border-transparent hover:border-ink"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </Field>
                <Field label="Display name" hint="Up to 50 characters.">
                  <input
                    type="text"
                    value={displayName}
                    maxLength={50}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How should we address you?"
                    className="ui-field__control"
                  />
                </Field>
                <Field label="Headline" hint="Optional, up to 80 characters.">
                  <input
                    type="text"
                    value={headline}
                    maxLength={80}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Computer Science, Year 3"
                    className="ui-field__control"
                  />
                </Field>
              </div>
            </div>

            <Field label="Email address" hint="Email cannot be changed.">
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="ui-field__control"
              />
            </Field>

            <Field label="Time zone">
              <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className="ui-field__control">
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Week starts on">
                <select value={weekStartsOn} onChange={(e) => setWeekStartsOn(e.target.value)} className="ui-field__control">
                  <option value="MONDAY">Monday</option>
                  <option value="SUNDAY">Sunday</option>
                </select>
              </Field>
              <Field label="Time format">
                <select value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)} className="ui-field__control">
                  <option value="H24">24-hour</option>
                  <option value="H12">12-hour</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Calendar start hour">
                <input type="number" min="0" max="23" value={dayStartHour}
                  onChange={(e) => setDayStartHour(e.target.value)}
                  className="ui-field__control"
                />
              </Field>
              <Field label="Calendar end hour">
                <input type="number" min="1" max="24" value={dayEndHour}
                  onChange={(e) => setDayEndHour(e.target.value)}
                  className="ui-field__control"
                />
              </Field>
            </div>

            <Field label="Default calendar view">
              <select value={defaultView} onChange={(e) => setDefaultView(e.target.value)} className="ui-field__control">
                <option value="WEEK">Weekly</option>
                <option value="MONTH">Monthly</option>
              </select>
            </Field>

            <Switch
              label="Hide completed tasks by default"
              checked={hideCompleted}
              onChange={setHideCompleted}
            />

            <div className="border-t border-border/20 pt-4">
              <h3 className="text-sm font-semibold text-ink mb-1">Default task colors</h3>
              <p className="text-xs text-muted mb-3">
                Used when a task has no custom color. These choices are saved in this browser.
              </p>
              <div className="flex flex-col gap-2">
                {TASK_TYPES.map((type) => (
                  <label key={type.id} className="flex items-center justify-between gap-3 text-sm text-ink">
                    <span>{type.label}</span>
                    <input
                      type="color"
                      value={displaySettings.taskColors[type.id]}
                      aria-label={`${type.label} default color`}
                      onChange={(event) =>
                        setDisplaySettings((current) => ({
                          ...current,
                          taskColors: { ...current.taskColors, [type.id]: event.target.value },
                        }))
                      }
                      className="h-9 w-12 cursor-pointer rounded border border-border/20 bg-surface p-1"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <Button type="submit" variant="primary" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save profile & preferences"}
              </Button>
            </div>
          </form>
          <div className="border-t border-border/20 p-4">
            <Field label="Theme" hint="Saved only in this browser.">
              <select value={theme} onChange={(event) => handleThemeChange(event.target.value)} className="ui-field__control">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Security */}
        <div className="ui-panel">
          <div className="ui-panel__heading">
            <h2 className="text-lg font-semibold text-ink">Security</h2>
            <p className="mt-1 text-xs text-muted">Change your password</p>
          </div>
          <form onSubmit={handleChangePassword} className="p-4 flex flex-col gap-4">
            <Field label="Current password">
              <input type="password" value={currentPassword} required
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                className="ui-field__control"
              />
            </Field>
            <Field label="New password">
              <input type="password" value={newPassword} required
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                autoComplete="new-password"
                className="ui-field__control"
              />
            </Field>
            <div>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="overflow-hidden rounded-lg border border-danger/35 bg-surface">
          <div className="border-b border-danger/20 bg-danger/5 p-4">
            <h2 className="text-lg font-semibold text-danger">Danger zone</h2>
            <p className="text-xs text-danger/75">Irreversible account actions</p>
          </div>

          <div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">Log out</h3>
              <p className="text-xs text-muted">Safely end your current session.</p>
            </div>
            <Button onClick={logout}>Log out now</Button>
          </div>

          <div className="p-4 border-t border-danger/20 flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-bold text-danger">Delete account</h3>
              <p className="text-xs text-muted">
                Permanently delete your account and all tasks. Enter your password to confirm.
              </p>
            </div>
            <input type="password" value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter password to confirm"
              autoComplete="current-password"
              aria-label="Password to confirm account deletion"
              className="ui-input max-w-xs"
            />
            <div>
              <Button variant="danger" onClick={() => setConfirmDelete(true)} disabled={deletingAccount}>
                {deletingAccount ? "Deleting..." : "Delete account"}
              </Button>
            </div>
          </div>
        </div>

      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        message="This permanently deletes your account and all tasks. This action cannot be undone."
        confirmLabel="Delete account"
        danger
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}