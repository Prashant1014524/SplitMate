import React from 'react';
import { useApp } from '../context/AppContext';
import { Plus, LogOut, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { currentUser, setIsAddExpenseOpen, setIsProfileOpen, logoutUser, theme, toggleTheme } = useApp();

  return (
    <header className="h-14 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Brand */}
      <div className="flex items-center space-x-2.5">
        <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center font-bold text-white dark:text-zinc-950 text-xs tracking-tight shadow-sm">
          sP
        </div>
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          sPLIT
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-600" />
          )}
        </button>

        {/* Add Expense Button */}
        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold rounded-lg text-xs transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Expense</span>
        </button>

        {currentUser && (
          <div className="flex items-center space-x-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setIsProfileOpen(true)}
              title="Edit Profile & UPI"
              className="flex items-center space-x-2 hover:opacity-85 transition-opacity cursor-pointer group text-left"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
              />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                  {currentUser.name}
                </span>
                <span className={`text-[10px] font-mono leading-none ${currentUser.upiId ? 'text-zinc-400' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}`}>
                  {currentUser.upiId ? currentUser.upiId : '+ Add UPI'}
                </span>
              </div>
            </button>
            <button
              onClick={logoutUser}
              title="Logout"
              className="p-1 text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
