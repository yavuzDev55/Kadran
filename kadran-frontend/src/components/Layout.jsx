import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold text-blue-500 tracking-wider">
                KADRAN
              </Link>
              
              {user && (
                <div className="hidden sm:flex items-center gap-2">
                  <Link 
                    to="/" 
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                  >
                    List View
                  </Link>
                  <Link 
                    to="/calendar" 
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/calendar') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                  >
                    Calendar
                  </Link>
                  <Link 
                    to="/tasks/new" 
                    className={`ml-2 px-3 py-1.5 rounded-md text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition`}
                  >
                    + New Task
                  </Link>
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400 hidden md:block">{user.email}</span>
                  
                  {/* Settings Link */}
                  <Link 
                    to="/settings" 
                    className={`p-2 rounded-md transition ${isActive('/settings') ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                    title="Settings"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>

                  <button 
                    onClick={logout} 
                    className="text-sm font-medium text-red-400 hover:text-red-300 transition px-3 py-2 rounded-md hover:bg-red-950/30"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white">Login</Link>
                  <Link to="/register" className="text-sm font-medium text-blue-400 hover:text-blue-300">Register</Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}