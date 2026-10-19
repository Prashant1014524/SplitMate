import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateNetBalances, calculateSimplifiedDebts } from '../utils/splitEngine';
import { ArrowRight, Plus, Check, Users, Trash2, Share2, ChevronLeft, LogOut, AlertTriangle, X } from 'lucide-react';
import ShareGroupModal from '../components/Modals/ShareGroupModal';

export default function Groups() {
  const {
    groups,
    selectedGroupId,
    setSelectedGroupId,
    expenses,
    settlements,
    deleteSettlement,
    currentUser,
    setIsAddExpenseOpen,
    setIsSettleUpOpen,
    openSettleUpWithData,
    setIsCreateGroupOpen,
    deleteGroup,
    leaveGroup,
    setActiveTab
  } = useApp();

  const group = groups.find(g => g.id === selectedGroupId) || groups[0];
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const isCreator = group && (group.createdById === currentUser?.id || (!group.createdById && group.members?.[0]?.id === currentUser?.id));

  const handleDeleteGroup = async () => {
    setActionLoading(true);
    setActionError('');
    const res = await deleteGroup(group.id);
    if (!res.success) {
      setActionError(res.message || 'Failed to delete group');
      setActionLoading(false);
    } else {
      setActionLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleLeaveGroup = async () => {
    setActionLoading(true);
    setActionError('');
    const res = await leaveGroup(group.id);
    if (!res.success) {
      setActionError(res.message || 'Failed to leave group');
      setActionLoading(false);
    } else {
      setActionLoading(false);
      setIsLeaveModalOpen(false);
    }
  };

  if (!group || groups.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500 space-y-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 max-w-xl mx-auto my-8 shadow-2xs">
        <Users className="w-8 h-8 mx-auto text-zinc-400 stroke-1" />
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No Groups Found</h3>
        <p className="text-xs text-zinc-500">
          You are not in any groups yet. Create your first group or ask a group creator to invite <span className="font-semibold text-zinc-700 dark:text-zinc-300">{currentUser?.email}</span>!
        </p>
        <button
          onClick={() => setIsCreateGroupOpen(true)}
          className="mt-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 font-semibold text-xs shadow-2xs inline-flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Group</span>
        </button>
      </div>
    );
  }

  const groupExpenses = expenses.filter(e => e.groupId === group.id);
  const groupSettlements = settlements.filter(s => s.groupId === group.id);

  const netBalances = calculateNetBalances(group.members, groupExpenses, groupSettlements);
  const simplifiedTransactions = calculateSimplifiedDebts(group.members, groupExpenses, groupSettlements);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back to Dashboard Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 py-1 px-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Group Switcher Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-zinc-200/80 dark:border-zinc-800">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGroupId(g.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
              selectedGroupId === g.id
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            {g.name}
          </button>
        ))}

        <button
          onClick={() => setIsCreateGroupOpen(true)}
          className="px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-medium shrink-0"
        >
          + New Group
        </button>
      </div>

      {/* Group Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{group.name}</h1>
            <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
              {group.category}
            </span>
            {isCreator && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                Creator
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Members: {group.members.map(m => m.name).join(', ')}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsShareOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Share Link</span>
          </button>

          <button
            onClick={() => setIsSettleUpOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Settle Up</span>
          </button>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-emerald-400 transition-colors flex items-center space-x-1 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>

          {/* Leave Group Action for any member */}
          <button
            onClick={() => { setActionError(''); setIsLeaveModalOpen(true); }}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center space-x-1 cursor-pointer"
            title="Leave Group"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Leave</span>
          </button>

          {/* Delete Group Action strictly for Creator */}
          {isCreator && (
            <button
              onClick={() => { setActionError(''); setIsDeleteModalOpen(true); }}
              className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center space-x-1 cursor-pointer"
              title="Delete Entire Group (Creator Only)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Debt Simplification & Member Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Simplified Debt Settlements */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Simplified Settlements
              </h2>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Min-cost transfers</span>
            </div>

            {simplifiedTransactions.length === 0 ? (
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs text-emerald-600 dark:text-emerald-400 shadow-2xs">
                All debts in this group are fully settled.
              </div>
            ) : (
              <div className="space-y-2">
                {simplifiedTransactions.map((tx, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{tx.fromUser.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{tx.toUser.name}</span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">₹{tx.amount.toFixed(2)}</span>
                      {tx.fromUser.id === currentUser?.id && (
                        <button
                          onClick={() => openSettleUpWithData({
                            payerId: tx.fromUser.id,
                            payeeId: tx.toUser.id,
                            amount: tx.amount
                          })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-semibold text-[11px] flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <span>Pay via UPI</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group Expenses History */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Expense History
            </h2>

            {groupExpenses.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                No group expenses recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
                {groupExpenses.map(exp => {
                  const payer = group.members.find(m => m.id === exp.payerId);
                  return (
                    <div key={exp.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-200">{exp.description}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Paid by {payer?.name || 'User'} • {exp.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{parseFloat(exp.amount).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Group Settlements History */}
          {groupSettlements.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Settlement History
              </h2>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
                {groupSettlements.map(st => {
                  const payer = group.members.find(m => m.id === st.payerId);
                  const payee = group.members.find(m => m.id === st.payeeId);
                  const dateStr = st.settledAt ? new Date(st.settledAt).toLocaleDateString() : 'Recent';

                  return (
                    <div key={st.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                            {payer?.name || 'Someone'} paid {payee?.name || 'Someone'}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Settled on {dateStr}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{parseFloat(st.amount).toFixed(2)}
                        </span>
                        <button
                          onClick={() => deleteSettlement(st.id)}
                          title="Undo settlement"
                          className="text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 p-1 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Member Balances (1 Col) */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Member Standings
          </h2>
          <div className="space-y-2">
            {group.members.map(member => {
              const bal = netBalances[member.id] || 0;
              const isCurrent = member.id === currentUser?.id;

              return (
                <div key={member.id} className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs shadow-2xs">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-medium text-zinc-900 dark:text-zinc-200">
                        {member.name}
                      </span>
                      {isCurrent && <span className="text-zinc-400 text-[10px]">(You)</span>}
                    </div>
                    {member.upiId ? (
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                        UPI: {member.upiId}
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-400/60 dark:text-zinc-600 mt-0.5">
                        UPI not set
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {bal > 0 ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+₹{bal.toFixed(2)}</span>
                    ) : bal < 0 ? (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">-₹{Math.abs(bal).toFixed(2)}</span>
                    ) : (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">₹0.00</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Share / Invite Modal */}
      <ShareGroupModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        group={group}
      />

      {/* Delete Group Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Delete Group?</h3>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-100">{group.name}</span>? All expenses, splits, and settlement records in this group will be permanently removed for all members.
            </p>

            {actionError && (
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
                {actionError}
              </p>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {actionLoading ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Group</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Group Confirmation Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-zinc-900 dark:text-zinc-100">
                <LogOut className="w-5 h-5 text-amber-500 shrink-0" />
                <h3 className="text-sm font-bold">Leave Group?</h3>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              You are about to leave <span className="font-semibold text-zinc-900 dark:text-zinc-100">{group.name}</span>. You won't be able to see or split future expenses in this group unless re-invited.
            </p>

            {actionError && (
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
                {actionError}
              </p>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLeaveGroup}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {actionLoading ? (
                  <span>Leaving...</span>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Leave Group</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
