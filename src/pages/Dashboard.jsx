import React from 'react';
import { useApp } from '../context/AppContext';
import { calculateNetBalances } from '../utils/splitEngine';
import { ChevronRight, Plus, Users, Receipt } from 'lucide-react';

export default function Dashboard() {
  const {
    currentUser,
    groups,
    expenses,
    settlements,
    setActiveTab,
    setSelectedGroupId,
    setIsAddExpenseOpen,
    setIsCreateGroupOpen
  } = useApp();

  let totalPersonalSpend = 0;
  let totalOwedToYou = 0;
  let totalYouOwe = 0;

  expenses.filter(e => !e.groupId).forEach(e => {
    totalPersonalSpend += parseFloat(e.amount) || 0;
  });

  groups.forEach(g => {
    const groupExpenses = expenses.filter(e => e.groupId === g.id);
    const groupSettlements = settlements.filter(s => s.groupId === g.id);
    const balances = calculateNetBalances(g.members, groupExpenses, groupSettlements);
    const myBalance = balances[currentUser?.id] || 0;

    if (myBalance > 0) {
      totalOwedToYou += myBalance;
    } else if (myBalance < 0) {
      totalYouOwe += Math.abs(myBalance);
    }
  });

  const netGroupBalance = totalOwedToYou - totalYouOwe;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Overview of your personal spending and group settlements.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            New Group
          </button>
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-emerald-400 transition-colors flex items-center space-x-1 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Personal Spent */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Personal Spent</span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 tracking-tight">
            ₹{totalPersonalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">Your individual expenses</span>
        </div>

        {/* You Are Owed */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">You are Owed</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
            +₹{totalOwedToYou.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600/70 dark:text-emerald-500/70 mt-0.5 block">Total friends owe you</span>
        </div>

        {/* You Owe */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">You Owe</span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 tracking-tight">
            -₹{totalYouOwe.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-rose-600/70 dark:text-rose-500/70 mt-0.5 block">Total you owe friends</span>
        </div>

        {/* Net Balance */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Net Standing</span>
          <div className={`text-2xl font-bold mt-1 tracking-tight ${netGroupBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {netGroupBalance >= 0 ? '+' : '-'}₹{Math.abs(netGroupBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">Overall balance</span>
        </div>
      </div>

      {/* Main Grid: Groups & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Groups List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Your Groups
            </h2>
            {groups.length > 0 && (
              <button
                onClick={() => setActiveTab('groups')}
                className="text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center space-x-0.5"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {groups.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2 shadow-2xs">
              <Users className="w-6 h-6 text-zinc-400 mx-auto stroke-1" />
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">No active groups yet</p>
              <p className="text-[11px] text-zinc-400">Create a group or ask a friend to add {currentUser?.email} to an existing group.</p>
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 font-semibold text-xs shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Group</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map(group => {
                const groupExpenses = expenses.filter(e => e.groupId === group.id);
                const groupSettlements = settlements.filter(s => s.groupId === group.id);
                const balances = calculateNetBalances(group.members, groupExpenses, groupSettlements);
                const myBal = balances[currentUser?.id] || 0;

                return (
                  <div
                    key={group.id}
                    onClick={() => {
                      setActiveTab('groups');
                      setSelectedGroupId(group.id);
                    }}
                    className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{group.name}</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{group.members.length} members • {group.category}</p>
                    </div>
                    <div>
                      {myBal > 0 ? (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+₹{myBal.toFixed(2)}</span>
                      ) : myBal < 0 ? (
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">-₹{Math.abs(myBal).toFixed(2)}</span>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">Settled</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Recent Activity
          </h2>
          {expenses.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1 shadow-2xs">
              <Receipt className="w-5 h-5 text-zinc-400 mx-auto stroke-1" />
              <p className="text-xs text-zinc-500">No recent transactions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.slice(0, 5).map(exp => (
                <div key={exp.id} className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs shadow-2xs">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-200">{exp.description}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{exp.groupId ? 'Group' : 'Personal'} • {exp.date}</p>
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">₹{parseFloat(exp.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
