// src/pages/SettingsPage.jsx

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

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

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();

  const [timeZone,      setTimeZone]      = useState(user?.timeZone      || "Europe/Istanbul");
  const [weekStartsOn,  setWeekStartsOn]  = useState(user?.weekStartsOn  || "MONDAY");
  const [dayStartHour,  setDayStartHour]  = useState(user?.dayStartHour  ?? 8);
  const [dayEndHour,    setDayEndHour]    = useState(user?.dayEndHour     ?? 22);
  const [timeFormat,    setTimeFormat]    = useState(user?.timeFormat     || "H24");
  const [defaultView,   setDefaultView]   = useState(user?.defaultView    || "WEEK");
  const [hideCompleted, setHideCompleted] = useState(user?.hideCompleted  || false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [deletePassword,  setDeletePassword]  = useState("");

  const [savingProfile,  setSavingProfile]  = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAcount, setDeletingAccount] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch("/auth/me", {
        timeZone,
        weekStartsOn,
        dayStartHour: Number(dayStartHour),
        dayEndHour:   Number(dayEndHour),
        timeFormat,
        defaultView,
        hideCompleted,
      });
      updateUser(res.data.data);
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
    if (!window.confirm("This will permanently delete your account and all tasks. Are you sure?")) return;

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
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Profile & Settings</h1>

      <div className="flex flex-col gap-6">

        {/* Preferences */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-slate-200">Preferences</h2>
            <p className="text-xs text-slate-400">Calendar display and regional settings</p>
          </div>
          <form onSubmit={handleSaveProfile} className="p-4 flex flex-col gap-4">

            <div>
              <label className="block text-sm text-slate-400 mb-1">Email Address</label>
              <input
                type="email" value={user?.email || ""} disabled
                className="w-full p-2.5 rounded bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Email cannot be changed.</span>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Time Zone</label>
              <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500">
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Week Starts On</label>
                <select value={weekStartsOn} onChange={(e) => setWeekStartsOn(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500">
                  <option value="MONDAY">Monday</option>
                  <option value="SUNDAY">Sunday</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Time Format</label>
                <select value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500">
                  <option value="H24">24-hour</option>
                  <option value="H12">12-hour</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Calendar Start Hour</label>
                <input type="number" min="0" max="23" value={dayStartHour}
                  onChange={(e) => setDayStartHour(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Calendar End Hour</label>
                <input type="number" min="1" max="24" value={dayEndHour}
                  onChange={(e) => setDayEndHour(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Default View</label>
              <select value={defaultView} onChange={(e) => setDefaultView(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500">
                <option value="WEEK">Weekly</option>
                <option value="MONTH">Monthly</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="hideCompleted" checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <label htmlFor="hideCompleted" className="text-sm text-slate-300 cursor-pointer">
                Hide completed tasks by default
              </label>
            </div>

            <div className="pt-1">
              <button type="submit" disabled={savingProfile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded transition disabled:opacity-50">
                {savingProfile ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>
        </div>

        {/* Security */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-slate-200">Security</h2>
            <p className="text-xs text-slate-400">Change your password</p>
          </div>
          <form onSubmit={handleChangePassword} className="p-4 flex flex-col gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Current Password</label>
              <input type="password" value={currentPassword} required
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">New Password</label>
              <input type="password" value={newPassword} required
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <button type="submit" disabled={savingPassword}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded transition disabled:opacity-50">
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg shadow-xl overflow-hidden">
          <div className="p-4 border-b border-red-900/30 bg-red-950/30">
            <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
            <p className="text-xs text-red-300/70">Irreversible account actions</p>
          </div>

          <div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Log Out</h3>
              <p className="text-xs text-slate-400">Safely end your current session.</p>
            </div>
            <button onClick={logout}
              className="px-4 py-2 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded transition whitespace-nowrap">
              Log Out Now
            </button>
          </div>

          <div className="p-4 border-t border-red-900/30 flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-bold text-red-400">Delete Account</h3>
              <p className="text-xs text-red-300/70">
                Permanently delete your account and all tasks. Enter your password to confirm.
              </p>
            </div>
            <input type="password" value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter password to confirm"
              className="w-full p-2.5 rounded bg-slate-900 border border-red-900/50 text-slate-100 focus:outline-none focus:border-red-500 max-w-xs"
            />
            <div>
              <button onClick={handleDeleteAccount} disabled={deletingAcount}
                className="px-4 py-2 bg-red-900/80 border border-red-700 hover:bg-red-600 text-red-100 text-sm font-semibold rounded transition disabled:opacity-50 whitespace-nowrap">
                {deletingAcount ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}