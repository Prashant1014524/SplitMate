import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, Trash2 } from 'lucide-react';

export default function PersonalExpenses() {
  const { expenses, deleteExpense, setIsAddExpenseOpen } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const personalExpenses = expenses.filter(e => !e.groupId);
  const categories = ['All', 'Food', 'Travel', 'Bills', 'Home', 'Entertainment', 'Fitness', 'General'];

  const filtered = personalExpenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalSpent = filtered.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Personal Expenses</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Manage and filter your individual transactions.</p>
        </div>

        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-emerald-400 transition-colors flex items-center space-x-1 self-start sm:self-auto shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Expense</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 shadow-2xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
        <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span>{filtered.length} Transactions</span>
          <span>Filtered Total: <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">₹{totalSpent.toFixed(2)}</strong></span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
            No expenses found.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {filtered.map(exp => (
              <div key={exp.id} className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition-colors flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{exp.description}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{exp.category} • {exp.date}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{parseFloat(exp.amount).toFixed(2)}</span>
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    className="text-zinc-400 hover:text-rose-500 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
