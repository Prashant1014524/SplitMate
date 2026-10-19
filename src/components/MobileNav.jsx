import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Receipt, Users, BarChart2 } from 'lucide-react';

export default function MobileNav() {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-around py-1.5 px-2 transition-colors shadow-lg">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-all cursor-pointer ${
              isActive
                ? 'text-zinc-900 dark:text-emerald-400 font-semibold'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-zinc-900 dark:text-emerald-400 stroke-[2.2]' : 'text-zinc-400'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
