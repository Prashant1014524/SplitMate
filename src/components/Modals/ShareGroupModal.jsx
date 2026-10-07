import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Copy, Check, MessageSquare, Share2, Send, ExternalLink } from 'lucide-react';

export default function ShareGroupModal({ isOpen, onClose, group }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !group) return null;

  const inviteLink = `${window.location.origin}?join=${group.id}`;
  const shareMessage = `Hey! Join our "${group.name}" group on sPLIT to track and settle our expenses easily: ${inviteLink}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleInstagramOrNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${group.name} on sPLIT`,
          text: shareMessage,
          url: inviteLink,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to copy
      }
    }
    // Fallback: Copy link and open Instagram web
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    window.open('https://instagram.com/direct/inbox/', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl max-w-md w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Invite Members
              </h2>
              <p className="text-[11px] text-zinc-500">
                Share invite link for <strong className="text-zinc-700 dark:text-zinc-300">{group.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Direct Link Box */}
          <div className="space-y-1.5">
            <label className="block font-medium text-zinc-600 dark:text-zinc-400">
              Direct Invite Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none select-all font-mono"
              />
              <button
                onClick={handleCopy}
                className={`px-3 py-2 rounded-lg font-medium text-xs transition-colors shrink-0 flex items-center space-x-1.5 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Options */}
          <div className="space-y-2 pt-1">
            <label className="block font-medium text-zinc-600 dark:text-zinc-400">
              Share Via
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-zinc-50 dark:bg-zinc-950 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all flex items-center space-x-2.5 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">WhatsApp</p>
                  <p className="text-[10px] text-zinc-500">Share to chat or group</p>
                </div>
              </button>

              {/* Instagram / Direct Share */}
              <button
                onClick={handleInstagramOrNativeShare}
                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-pink-300 dark:hover:border-pink-700 bg-zinc-50 dark:bg-zinc-950 hover:bg-pink-50/40 dark:hover:bg-pink-950/20 text-left transition-all flex items-center space-x-2.5 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">Instagram</p>
                  <p className="text-[10px] text-zinc-500">Copy & open direct DM</p>
                </div>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 text-[11px] text-zinc-500 flex items-start space-x-2">
            <span className="text-emerald-500 text-xs">💡</span>
            <span>
              Anyone with this link can click to immediately join <strong>{group.name}</strong> and split expenses with you.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
