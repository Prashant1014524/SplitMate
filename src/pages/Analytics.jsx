import React from 'react';
import { useApp } from '../context/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function Analytics() {
  const { expenses, theme } = useApp();

  const categoryTotals = {};
  expenses.forEach(e => {
    const cat = e.category || 'General';
    const amt = parseFloat(e.amount) || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
  });

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

  const categoryData = Object.keys(categoryTotals).map((cat, idx) => ({
    name: cat,
    value: Math.round(categoryTotals[cat]),
    color: COLORS[idx % COLORS.length]
  }));

  const totalSpendAll = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Analytics</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Visual breakdown of your personal and shared expenses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Category Share</span>
            <span className="text-zinc-500">Total: <strong className="text-zinc-900 dark:text-zinc-100">₹{totalSpendAll.toFixed(2)}</strong></span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`₹${value}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: isDark ? '#27272a' : '#e4e4e7',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: isDark ? '#fafafa' : '#09090b',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: isDark ? '#fafafa' : '#09090b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {categoryData.map(item => (
              <div key={item.name} className="flex items-center space-x-1.5 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-zinc-600 dark:text-zinc-400 truncate">{item.name}</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">₹{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-3 shadow-2xs">
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">Category Comparison</span>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="name" stroke={isDark ? '#71717a' : '#a1a1aa'} fontSize={10} tickLine={false} />
                <YAxis stroke={isDark ? '#71717a' : '#a1a1aa'} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value) => [`₹${value}`, 'Spent']}
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: isDark ? '#27272a' : '#e4e4e7',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: isDark ? '#fafafa' : '#09090b',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: isDark ? '#fafafa' : '#09090b' }}
                />
                <Bar dataKey="value" fill={isDark ? '#10b981' : '#18181b'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
