import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Users, LayoutDashboard, Bell, ClipboardList } from 'lucide-react';

const Sidebar = () => {
  const { isRecruiter, isInterviewer } = useAuth();

  const navItemClass = ({ isActive }) =>
    `flex items-center px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-wider text-indigo-400">PIPELINE</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {isRecruiter && (
          <>
            <NavLink to="/dashboard" className={navItemClass}>
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </NavLink>
            <NavLink to="/jobs" className={navItemClass}>
              <Briefcase className="w-5 h-5 mr-3" />
              Job Openings
            </NavLink>
            <NavLink to="/applications" className={navItemClass}>
              <Users className="w-5 h-5 mr-3" />
              Applications
            </NavLink>
            <NavLink to="/alerts" className={navItemClass}>
              <Bell className="w-5 h-5 mr-3" />
              Alerts
            </NavLink>
          </>
        )}
        {isInterviewer && (
          <>
            <NavLink to="/my-applications" className={navItemClass}>
              <ClipboardList className="w-5 h-5 mr-3" />
              My Panel
            </NavLink>
          </>
        )}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        Hiring Pipeline © 2026
      </div>
    </div>
  );
};

export default Sidebar;
