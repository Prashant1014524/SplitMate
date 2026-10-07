import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Check, Smartphone, User, ShieldCheck } from 'lucide-react';

export default function ProfileModal() {
  const { isProfileOpen, setIsProfileOpen, currentUser, updateUserProfile } = useApp();

  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser && isProfileOpen) {
      setName(currentUser.name || '');
      setUpiId(currentUser.upiId || '');
      setPhone(currentUser.phone || '');
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [currentUser, isProfileOpen]);

  if (!isProfileOpen || !currentUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await updateUserProfile({
        name: name.trim(),
        upiId: upiId.trim(),
        phone: phone.trim()
      });

      if (res.success) {
        setSuccessMsg('Profile and UPI ID updated successfully!');
        setTimeout(() => {
          setIsProfileOpen(false);
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const username = currentUser.email
    ? currentUser.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
    : currentUser.name.toLowerCase().replace(/\s+/g, '');

  return (
    <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Profile & UPI Settings
            </h2>
          </div>
          <button
            onClick={() => setIsProfileOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* User Preview */}
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{currentUser.name}</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">{currentUser.email}</p>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
              required
            />
          </div>

          {/* UPI ID Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-zinc-600 dark:text-zinc-400 flex items-center space-x-1">
                <span>UPI ID</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">(For receiving ₹)</span>
              </label>
              <span className="text-[10px] text-zinc-400">GPay / PhonePe / Paytm</span>
            </div>
            <input
              type="text"
              placeholder="e.g. name@okhdfcbank or 9876543210@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-none focus:border-zinc-400"
            />

            {/* Quick Handle Suggestions */}
            {!upiId && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-zinc-400 mr-1 self-center">Suggestions:</span>
                {['okhdfcbank', 'okaxis', 'paytm', 'ybl'].map(vpa => (
                  <button
                    key={vpa}
                    type="button"
                    onClick={() => setUpiId(`${username}@${vpa}`)}
                    className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    @{vpa}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-1.5 flex items-start space-x-1.5 text-[10px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
              <span>
                Friends in your groups will be able to pay you directly via Google Pay / PhonePe with 1 click.
              </span>
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-zinc-600 dark:text-zinc-400">Phone Number (Optional)</label>
            </div>
            <input
              type="tel"
              placeholder="e.g. +91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsProfileOpen(false)}
              className="px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white text-white rounded-lg font-medium text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
