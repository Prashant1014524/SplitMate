import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Receipt, Users, BarChart2, Plus } from 'lucide-react';

export default function Sidebar() {
  const { activeTab, setActiveTab, groups, selectedGroupId, setSelectedGroupId, setIsCreateGroupOpen } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Personal Expenses', icon: Receipt },
    { id: 'groups', label: 'Group Splitting', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <aside className="w-56 bg-[#FAFAFA] dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between py-5 px-3 hidden md:flex min-h-[calc(100vh-3.5rem)] transition-colors">
      <div className="space-y-6">
        {/* Navigation */}
        <nav className="space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-900 dark:text-emerald-400' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Groups List */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Groups
            </span>
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
              title="Create Group"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {groups.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-zinc-400 italic">No groups yet</p>
            ) : (
              groups.map(group => {
                const isGroupActive = activeTab === 'groups' && selectedGroupId === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActiveTab('groups');
                      setSelectedGroupId(group.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      isGroupActive
                        ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span className="truncate">{group.name}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{group.members.length}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
