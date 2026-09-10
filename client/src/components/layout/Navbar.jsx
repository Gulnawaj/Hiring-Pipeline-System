import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-sm sticky top-0 z-10 w-full">
      <div className="text-slate-800 font-semibold text-lg flex items-center">
        <button 
          onClick={onMenuClick}
          className="mr-3 p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-6">
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-600 bg-slate-50 px-2 sm:px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
          <User className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span className="font-medium hidden sm:inline max-w-[120px] truncate">{user?.name}</span>
          <span className="text-slate-400 capitalize hidden sm:inline">({user?.role})</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center flex-shrink-0"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
