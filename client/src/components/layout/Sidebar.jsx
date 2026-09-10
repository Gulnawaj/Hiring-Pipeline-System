import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Users, LayoutDashboard, Bell, ClipboardList, X } from 'lucide-react';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { isRecruiter, isInterviewer } = useAuth();

  const navItemClass = ({ isActive }) =>
    `flex items-center px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const closeMobileMenu = () => {
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar Content */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wider text-indigo-400">BUSY</h1>
          <button 
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={closeMobileMenu}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {isRecruiter && (
            <>
              <NavLink to="/dashboard" className={navItemClass} onClick={closeMobileMenu}>
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Dashboard
              </NavLink>
              <NavLink to="/jobs" className={navItemClass} onClick={closeMobileMenu}>
                <Briefcase className="w-5 h-5 mr-3" />
                Job Openings
              </NavLink>
              <NavLink to="/applications" className={navItemClass} onClick={closeMobileMenu}>
                <Users className="w-5 h-5 mr-3" />
                Applications
              </NavLink>
              <NavLink to="/alerts" className={navItemClass} onClick={closeMobileMenu}>
                <Bell className="w-5 h-5 mr-3" />
                Alerts
              </NavLink>
            </>
          )}
          {isInterviewer && (
            <>
              <NavLink to="/my-applications" className={navItemClass} onClick={closeMobileMenu}>
                <ClipboardList className="w-5 h-5 mr-3" />
                My Panel
              </NavLink>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Busy © 2026
        </div>
      </div>
    </>
  );
};

export default Sidebar;
