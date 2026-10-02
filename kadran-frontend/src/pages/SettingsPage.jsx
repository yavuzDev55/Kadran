import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  
  // States for form fields
  const [timeZone, setTimeZone] = useState(user?.timeZone || "Europe/Istanbul");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Placeholder for future API call (e.g., api.patch('/users/me'))
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Profile preferences saved successfully!");
    }, 800);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    
    // Placeholder for future API call
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    
    toast.success("Password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and all your tasks will be lost.")) {
      toast.error("Account deletion is not enabled in this demo.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-4 mb-20">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Profile & Settings</h1>

      <div className="flex flex-col gap-6">
        
        {/* Profile Information Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
            <h2 className="text-lg font-semibold text-slate-200">Account Information</h2>
            <p className="text-xs text-slate-400">Your basic profile details</p>
          </div>
          <div className="p-4">
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full p-2.5 rounded bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Email cannot be changed.</span>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Time Zone</label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                  <option value="Europe/London">Europe/London (GMT+0)</option>
                  <option value="America/New_York">America/New_York (GMT-4)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded transition disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
            <h2 className="text-lg font-semibold text-slate-200">Security</h2>
            <p className="text-xs text-slate-400">Manage your password and security</p>
          </div>
          <div className="p-4">
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
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
            <button
              onClick={logout}
              className="px-4 py-2 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded transition whitespace-nowrap"
            >
              Log Out Now
            </button>
          </div>
          <div className="p-4 border-t border-red-900/30 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-red-400">Delete Account</h3>
              <p className="text-xs text-red-300/70">Permanently delete your data and tasks.</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-900/80 border border-red-700 hover:bg-red-600 text-red-100 text-sm font-semibold rounded transition whitespace-nowrap"
            >
              Delete Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}