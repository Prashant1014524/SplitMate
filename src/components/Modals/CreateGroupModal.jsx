import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Trash2, Users } from 'lucide-react';

export default function CreateGroupModal() {
  const {
    isCreateGroupOpen,
    setIsCreateGroupOpen,
    createGroup,
    currentUser
  } = useApp();

  const [groupName, setGroupName] = useState('');
  const [category, setCategory] = useState('Travel');
  const [memberEmails, setMemberEmails] = useState([]); // Completely empty by default!

  if (!isCreateGroupOpen) return null;

  const handleAddMemberInput = () => {
    setMemberEmails(prev => [...prev, '']);
  };

  const handleMemberEmailChange = (index, value) => {
    const updated = [...memberEmails];
    updated[index] = value;
    setMemberEmails(updated);
  };

  const handleRemoveMemberInput = (index) => {
    setMemberEmails(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    // Filter out any blank emails
    const validEmails = memberEmails.filter(email => email.trim() !== '');

    createGroup(groupName.trim(), category, validEmails);
    setIsCreateGroupOpen(false);
    setGroupName('');
    setMemberEmails([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Create New Group
            </h2>
          </div>
          <button
            onClick={() => setIsCreateGroupOpen(false)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. Goa Trip, Flat 302, Weekend Party"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-xs"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700"
            >
              <option value="Travel">Travel / Trip</option>
              <option value="Home">Home / Flatmates</option>
              <option value="Event">Event / Outing</option>
              <option value="Food">Food / Dining</option>
              <option value="Project">Team / Project</option>
            </select>
          </div>

          {/* Members */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-medium text-zinc-600 dark:text-zinc-400">
                Initial Members
              </label>
              <button
                type="button"
                onClick={handleAddMemberInput}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add email invite</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={`You (${currentUser?.name || 'Creator'})`}
                  disabled
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs cursor-not-allowed font-medium"
                />
              </div>

              {memberEmails.map((email, idx) => (
                <div key={idx} className="flex items-center space-x-1.5">
                  <input
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => handleMemberEmailChange(idx, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMemberInput(idx)}
                    className="text-zinc-400 hover:text-rose-500 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-zinc-500 pt-1">
              💡 You can create the group with just yourself and use the <strong>"Share Link"</strong> button to invite friends via WhatsApp, Instagram, or direct link.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCreateGroupOpen(false)}
              className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
