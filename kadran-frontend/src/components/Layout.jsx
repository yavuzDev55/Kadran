import { Outlet, NavLink } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <nav className="p-4 bg-slate-800 border-b border-slate-700 flex gap-4">
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? "text-blue-400 font-bold" : "text-slate-400"}
        >
          Home
        </NavLink>
        <NavLink 
          to="/login" 
          className={({ isActive }) => isActive ? "text-blue-400 font-bold" : "text-slate-400"}
        >
          Login
        </NavLink>
      </nav>

      <main className="p-8 max-w-4xl mx-auto">
        {/* Child routes will be rendered inside this Outlet */}
        <Outlet />
      </main>
    </div>
  );
}