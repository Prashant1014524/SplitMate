import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, IndianRupee, Users, AlertCircle } from 'lucide-react';

export default function AddExpenseModal() {
  const {
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    groups,
    currentUser,
    addExpense,
    selectedGroupId
  } = useApp();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [groupId, setGroupId] = useState(selectedGroupId || '');
  const [splitType, setSplitType] = useState('equal');
  const [exactSplits, setExactSplits] = useState({});
  const [error, setError] = useState('');

  if (!isAddExpenseOpen) return null;

  const currentGroup = groups.find(g => g.id === groupId);

  const handleGroupChange = (e) => {
    const gid = e.target.value;
    setGroupId(gid);
    setExactSplits({});
  };

  const handleExactSplitChange = (userId, value) => {
    setExactSplits(prev => ({
      ...prev,
      [userId]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
      setError('Please provide a valid description and amount.');
      return;
    }

    let computedSplits = [];

    if (groupId && currentGroup) {
      const members = currentGroup.members;

      if (splitType === 'equal') {
        const perPerson = Math.round((numAmount / members.length) * 100) / 100;
        computedSplits = members.map(m => ({
          userId: m.id,
          amountOwed: perPerson
        }));
      } else if (splitType === 'exact') {
        let totalExact = 0;
        computedSplits = members.map(m => {
          const val = parseFloat(exactSplits[m.id]) || 0;
          totalExact += val;
          return { userId: m.id, amountOwed: val };
        });

        if (Math.abs(totalExact - numAmount) > 0.01) {
          setError(`Exact amounts sum (₹${totalExact.toFixed(2)}) must equal total expense amount (₹${numAmount.toFixed(2)}).`);
          return;
        }
      }
    }

    addExpense({
      description,
      amount: numAmount,
      payerId: currentUser.id,
      groupId: groupId || null,
      category,
      splits: computedSplits
    });

    setDescription('');
    setAmount('');
    setError('');
    setIsAddExpenseOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl max-w-md w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Add Expense
          </h2>
          <button
            onClick={() => setIsAddExpenseOpen(false)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Dinner, Groceries, Rent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-xs"
              >
                <option value="Food">Food & Dining</option>
                <option value="Travel">Travel & Trip</option>
                <option value="Bills">Utilities & Bills</option>
                <option value="Home">Rent & Home</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Fitness">Fitness</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Group (Optional)
            </label>
            <select
              value={groupId}
              onChange={handleGroupChange}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-xs"
            >
              <option value="">Personal Expense (No Split)</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Group Split Config */}
          {groupId && currentGroup && (
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Split Strategy
                </span>
                <div className="flex bg-zinc-200/60 dark:bg-zinc-900 p-0.5 rounded-md text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSplitType('equal')}
                    className={`px-2 py-0.5 rounded transition-all ${
                      splitType === 'equal' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium shadow-2xs' : 'text-zinc-500'
                    }`}
                  >
                    Equal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitType('exact')}
                    className={`px-2 py-0.5 rounded transition-all ${
                      splitType === 'exact' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium shadow-2xs' : 'text-zinc-500'
                    }`}
                  >
                    Exact
                  </button>
                </div>
              </div>

              {splitType === 'equal' && (
                <p className="text-[11px] text-zinc-500">
                  Split equally across {currentGroup.members.length} members ({amount ? `₹${(parseFloat(amount) / currentGroup.members.length).toFixed(2)}` : '₹0.00'} each).
                </p>
              )}

              {splitType === 'exact' && (
                <div className="space-y-1.5 pt-1 max-h-32 overflow-y-auto pr-1">
                  {currentGroup.members.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-700 dark:text-zinc-300">{m.name}</span>
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1.5 text-zinc-400">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={exactSplits[m.id] || ''}
                          onChange={(e) => handleExactSplitChange(m.id, e.target.value)}
                          className="w-full pl-5 pr-2 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(false)}
              className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold text-xs transition-colors shadow-2xs"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
