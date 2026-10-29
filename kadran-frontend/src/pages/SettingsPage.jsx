// src/pages/SettingsPage.jsx

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import ConfirmDialog from "../components/ConfirmDialog";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import PasswordInput from "../components/ui/PasswordInput";
import Segmented from "../components/ui/Segmented";
import Slider from "../components/ui/Slider";
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

const COMPACT_HOURS_STORAGE_KEY = "kadran_calendar_compact_hours";

// Same default as the calendar page: compact unless it was switched off.
const readCompactHours = () => {
  try {
    return localStorage.getItem(COMPACT_HOURS_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
};

const formatHour = (hour) => `${String(hour).padStart(2, "0")}:00`;

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];
const WEEK_START_OPTIONS = [
  { value: "MONDAY", label: "Monday" },
  { value: "SUNDAY", label: "Sunday" },
];
const TIME_FORMAT_OPTIONS = [
  { value: "H24", label: "24-hour" },
  { value: "H12", label: "12-hour" },
];
const VIEW_OPTIONS = [
  { value: "WEEK", label: "Week" },
  { value: "MONTH", label: "Month" },
];

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();

  const [theme, setTheme] = useState(readTheme);
  const [timeZone,      setTimeZone]      = useState(user?.timeZone      || "Europe/Istanbul");
  const [weekStartsOn,  setWeekStartsOn]  = useState(user?.weekStartsOn  || "MONDAY");
  const [dayStartHour,  setDayStartHour]  = useState(Number(user?.dayStartHour ?? 8));
  const [dayEndHour,    setDayEndHour]    = useState(Number(user?.dayEndHour ?? 22));
  const [timeFormat,    setTimeFormat]    = useState(user?.timeFormat     || "H24");
  const [defaultView,   setDefaultView]   = useState(user?.defaultView    || "WEEK");
  const [hideCompleted, setHideCompleted] = useState(user?.hideCompleted  || false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [headline, setHeadline] = useState(user?.headline || "");
  const [avatarColor, setAvatarColor] = useState(() => getTaskDisplaySettings().avatarColor);
  const [taskColors, setTaskColors] = useState(() => getTaskDisplaySettings().taskColors);
  const [compactHours, setCompactHours] = useState(readCompactHours);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [deletePassword,  setDeletePassword]  = useState("");

  const [savingProfile,  setSavingProfile]  = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
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

  // Browser-local display settings are written through to the stored copy, so changing one
  // never persists an unsaved change to another (e.g. an avatar color that was not saved yet).
  const persistDisplaySettings = (changes) => {
    try {
      saveTaskDisplaySettings({ ...getTaskDisplaySettings(), ...changes });
      window.dispatchEvent(new Event("kadran-display-settings-change"));
      return true;
    } catch {
      toast.error("This choice could not be saved in this browser.");
      return false;
    }
  };

  const handleTaskColorChange = (typeId, color) => {
    const next = { ...taskColors, [typeId]: color };
    setTaskColors(next);
    persistDisplaySettings({ taskColors: next });
  };

  const handleCompactHoursChange = (compact) => {
    setCompactHours(compact);
    try {
      localStorage.setItem(COMPACT_HOURS_STORAGE_KEY, String(compact));
    } catch {
      toast.error("This choice could not be saved in this browser.");
    }
  };

  const handleDiscardProfile = () => {
    setDisplayName(user?.displayName || "");
    setHeadline(user?.headline || "");
    setAvatarColor(getTaskDisplaySettings().avatarColor);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch("/auth/me", { displayName, headline });
      updateUser(res.data.data);
      persistDisplaySettings({ avatarColor });
      toast.success("Profile saved.");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPreferences(true);
    try {
      const res = await api.patch("/auth/me", {
        timeZone,
        weekStartsOn,
        dayStartHour,
        dayEndHour,
        timeFormat,
        defaultView,
        hideCompleted,
      });
      updateUser(res.data.data);
      toast.success("Preferences saved.");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to save preferences.");
    } finally {
      setSavingPreferences(false);
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

  const initial = (displayName || user?.email || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="settings-page">
      <h1 className="font-title text-[34px] font-normal leading-[1.05] text-ink">Settings</h1>

      {/* Profile */}
      <section className="settings-sec" aria-labelledby="settings-profile">
        <div className="settings-sec__head">
          <h2 id="settings-profile">Profile</h2>
        </div>
        <div className="settings-sec__body">
          <form onSubmit={handleSaveProfile} className="k-sgrid">
            <div className="k-who">
              <span className="me-av k-av--lg" style={{ "--c": avatarColor }} aria-hidden="true">
                {initial}
              </span>
              <div>
                <div className="k-sub">Avatar color</div>
                <div className="k-colors">
                  {DISPLAY_COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="k-cdot"
                      style={{ "--c": color }}
                      aria-label={`Set avatar color ${color}`}
                      aria-pressed={avatarColor === color}
                      onClick={() => setAvatarColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <Field label="Display name" hint="Up to 50 characters.">
              <input
                type="text"
                value={displayName}
                maxLength={50}
                autoComplete="nickname"
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we address you?"
                className="ui-field__control"
              />
            </Field>
            <Field label="Headline" hint={`Optional. ${headline.length}/80`}>
              <input
                type="text"
                value={headline}
                maxLength={80}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="For example: CS student, year 2"
                className="ui-field__control"
              />
            </Field>
            <div className="k-savebar">
              <Button type="submit" variant="primary" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save profile"}
              </Button>
              <Button type="button" onClick={handleDiscardProfile}>
                Discard
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Appearance: browser-local, applied immediately */}
      <section className="settings-sec" aria-labelledby="settings-appearance">
        <div className="settings-sec__head">
          <h2 id="settings-appearance">Appearance</h2>
        </div>
        <div className="settings-sec__body">
          <div className="k-sgrid">
            <div>
              <div className="k-rowset">
                <span>Theme</span>
                <Segmented label="Theme" options={THEME_OPTIONS} value={theme} onChange={handleThemeChange} />
              </div>
              <div className="k-rowset">
                <Switch
                  label="Compact empty hours in the week calendar"
                  checked={compactHours}
                  onChange={handleCompactHoursChange}
                />
              </div>
              <p className="ui-field__hint">These choices are saved in this browser and apply immediately.</p>
            </div>
            <div>
              <div className="k-sub">Default task colors</div>
              {TASK_TYPES.map((type) => (
                <div key={type.id} className="k-catrow">
                  <span
                    className={`k-sw k-ty-${type.id.toLowerCase()} k-fill`}
                    style={{ "--c": taskColors[type.id] }}
                    aria-hidden="true"
                  />
                  <span className="k-catrow__name">{type.label}</span>
                  <input
                    type="color"
                    value={taskColors[type.id]}
                    aria-label={`${type.label} default color`}
                    onChange={(event) => handleTaskColorChange(type.id, event.target.value)}
                    className="k-colorin"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Calendar and region */}
      <section className="settings-sec" aria-labelledby="settings-calendar">
        <div className="settings-sec__head">
          <h2 id="settings-calendar">Calendar</h2>
        </div>
        <div className="settings-sec__body">
          <form onSubmit={handleSavePreferences} className="k-sgrid">
            <Field label="Time zone">
              <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className="ui-field__control">
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </Field>
            <div className="k-rowset">
              <span>Week starts on</span>
              <Segmented label="Week starts on" options={WEEK_START_OPTIONS} value={weekStartsOn} onChange={setWeekStartsOn} />
            </div>
            <div className="k-rowset">
              <span>Time format</span>
              <Segmented label="Time format" options={TIME_FORMAT_OPTIONS} value={timeFormat} onChange={setTimeFormat} />
            </div>
            <div className="k-rowset">
              <span>Default view</span>
              <Segmented label="Default calendar view" options={VIEW_OPTIONS} value={defaultView} onChange={setDefaultView} />
            </div>
            {/* Each handle is limited by the other, so "end after start" always holds. */}
            <Slider
              label="Day starts at"
              min={0}
              max={dayEndHour - 1}
              value={dayStartHour}
              onChange={setDayStartHour}
              formatValue={formatHour}
            />
            <Slider
              label="Day ends at"
              min={dayStartHour + 1}
              max={24}
              value={dayEndHour}
              onChange={setDayEndHour}
              formatValue={formatHour}
            />
            <Switch
              label="Hide completed tasks by default"
              checked={hideCompleted}
              onChange={setHideCompleted}
            />
            <div className="k-savebar">
              <Button type="submit" variant="primary" disabled={savingPreferences}>
                {savingPreferences ? "Saving..." : "Save preferences"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Security */}
      <section className="settings-sec" aria-labelledby="settings-security">
        <div className="settings-sec__head">
          <h2 id="settings-security">Security</h2>
        </div>
        <div className="settings-sec__body">
          <form onSubmit={handleChangePassword} className="k-sgrid">
            <Field label="Current password">
              <PasswordInput
                value={currentPassword}
                required
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password" hint="At least 8 characters, with an uppercase letter and a number.">
              <PasswordInput
                value={newPassword}
                required
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <div className="k-savebar">
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Change password"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Account */}
      <section className="settings-sec" aria-labelledby="settings-account">
        <div className="settings-sec__head">
          <h2 id="settings-account">Account</h2>
        </div>
        <div className="settings-sec__body">
          <div className="k-sgrid">
            <Field label="Email" hint="Your email cannot be changed.">
              <input type="email" value={user?.email || ""} readOnly aria-readonly="true" className="ui-field__control" />
            </Field>
            <div className="k-savebar">
              <Button onClick={logout}>Log out</Button>
            </div>
            <div className="k-zone">
              <p>Deleting your account removes all tasks. This can&apos;t be undone.</p>
              <PasswordInput
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password to confirm"
                autoComplete="current-password"
                aria-label="Password to confirm account deletion"
              />
              <Button variant="danger" onClick={() => setConfirmDelete(true)} disabled={deletingAccount}>
                {deletingAccount ? "Deleting..." : "Delete account"}
              </Button>
            </div>
          </div>
        </div>
      </section>

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
