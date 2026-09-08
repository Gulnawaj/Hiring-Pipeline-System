import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm sticky top-0 z-10">
      <div className="text-slate-800 font-semibold text-lg flex items-center">
        {/* Can put page title here via context or leave blank */}
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
          <User className="w-4 h-4 text-indigo-500" />
          <span className="font-medium">{user?.name}</span>
          <span className="text-slate-400 capitalize">({user?.role})</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
