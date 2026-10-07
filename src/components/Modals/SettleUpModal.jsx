import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Check, AlertCircle, QrCode, ArrowUpRight, Smartphone, ShieldCheck, Copy, CheckCircle2 } from 'lucide-react';

export default function SettleUpModal() {
  const {
    isSettleUpOpen,
    setIsSettleUpOpen,
    settleUpPreset,
    setSettleUpPreset,
    groups,
    selectedGroupId,
    addSettlement,
    currentUser
  } = useApp();

  const group = groups.find(g => g.id === selectedGroupId);

  const [payerId, setPayerId] = useState('');
  const [payeeId, setPayeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isCustomUpi, setIsCustomUpi] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [desktopNotice, setDesktopNotice] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const members = group?.members || [];

  // Initialize and synchronize payer & payee when modal opens or preset changes
  useEffect(() => {
    if (isSettleUpOpen && group && members.length > 0) {
      setError('');
      setShowQR(false);
      setDesktopNotice(null);
      setCopied(false);

      if (settleUpPreset) {
        setPayerId(settleUpPreset.payerId || currentUser?.id || members[0].id);
        setPayeeId(settleUpPreset.payeeId || (members.find(m => m.id !== settleUpPreset.payerId)?.id || ''));
        setAmount(settleUpPreset.amount ? String(settleUpPreset.amount) : '');
      } else {
        const isMember = members.some(m => m.id === currentUser?.id);
        const initialPayer = isMember ? currentUser.id : members[0].id;
        setPayerId(initialPayer);

        const initialPayee = members.find(m => m.id !== initialPayer);
        setPayeeId(initialPayee ? initialPayee.id : '');
      }
    }
  }, [isSettleUpOpen, group, currentUser, settleUpPreset]);

  // Auto-fetch UPI ID when payee changes
  const payee = members.find(m => m.id === payeeId);
  useEffect(() => {
    if (payee) {
      if (payee.upiId && payee.upiId.trim()) {
        setUpiId(payee.upiId.trim());
        setIsCustomUpi(false);
      } else {
        const username = payee.email ? payee.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : payee.name.toLowerCase().replace(/\s+/g, '');
        setUpiId(`${username}@okaxis`);
        setIsCustomUpi(true);
      }
    }
  }, [payee]);

  if (!isSettleUpOpen || !group) return null;

  const payeeOptions = members.filter(m => m.id !== payerId);

  const handlePayerChange = (newPayerId) => {
    setPayerId(newPayerId);
    if (payeeId === newPayerId) {
      const remaining = members.filter(m => m.id !== newPayerId);
      setPayeeId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const handleClose = () => {
    setIsSettleUpOpen(false);
    if (setSettleUpPreset) setSettleUpPreset(null);
  };

  const numAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numAmount) && numAmount > 0;

  // Construct NPCI Standard UPI Intent URI
  const upiPayUri = upiId && isValidAmount
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payee?.name || 'Friend')}&am=${numAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`sPLIT Settlement: ${group.name}`)}`
    : '';

  const handlePayViaUPI = (appName) => {
    if (!upiId) {
      setError('Recipient has no UPI ID configured.');
      return;
    }
    if (!isValidAmount) {
      setError('Please enter a valid settlement amount.');
      return;
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const amountStr = numAmount.toFixed(2);
    const payeeName = payee?.name || 'Friend';
    const note = `sPLIT Settlement: ${group.name}`;

    const genericUpiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(note)}`;

    if (isMobile) {
      let targetUri = genericUpiUri;
      if (appName === 'GPay') {
        // Direct Google Pay / Tez deep link on mobile
        targetUri = `tez://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(note)}`;
      } else if (appName === 'PhonePe') {
        // Direct PhonePe deep link on mobile
        targetUri = `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(note)}`;
      }

      window.location.href = targetUri;

      // Fallback to generic UPI chooser if specific app protocol is not intercepted
      setTimeout(() => {
        window.location.href = genericUpiUri;
      }, 1000);
    } else {
      // Desktop / Laptop: apps cannot run on Windows/Mac, so display QR code and clear instructions
      setShowQR(true);
      setError('');
      setDesktopNotice({
        appName: appName === 'GPay' ? 'Google Pay' : appName === 'PhonePe' ? 'PhonePe' : 'UPI',
        amount: amountStr,
        upiId: upiId
      });
    }
  };

  const handleCopyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!payerId) {
      setError('Please select who paid.');
      return;
    }
    if (!payeeId) {
      setError('Please select who received the payment.');
      return;
    }
    if (!isValidAmount) {
      setError('Please enter a valid settlement amount greater than 0.');
      return;
    }

    setLoading(true);

    try {
      await addSettlement(group.id, payerId, payeeId, numAmount);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to record settlement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Settle Up & Pay
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                {group.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs overflow-y-auto">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Payer and Payee selection */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1 text-[11px]">Payer (You)</label>
              <select
                value={payerId}
                onChange={(e) => handlePayerChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === currentUser?.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1 text-[11px]">Payee (Friend)</label>
              <select
                value={payeeId}
                onChange={(e) => setPayeeId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none"
                required
              >
                <option value="">Select recipient</option>
                {payeeOptions.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === currentUser?.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1 text-[11px]">Amount to Settle (₹)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold focus:outline-none focus:border-zinc-400"
              required
            />
          </div>

          {/* Payee UPI ID Display / Input */}
          {payee?.upiId && !isCustomUpi ? (
            /* Auto-Fetched Clean Card - NO TYPING NEEDED */
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {payee.name}'s UPI
                    </span>
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold px-1.5 py-0.5 rounded shrink-0">
                      Auto-Fetched
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                    {upiId}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  title="Copy UPI ID"
                  className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomUpi(true)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>
          ) : (
            /* Editable field only if not set in profile or user clicked Edit */
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-zinc-600 dark:text-zinc-400 text-[11px] flex items-center space-x-1.5">
                  <span>{payee?.name ? `${payee.name}'s UPI ID` : 'Payee UPI ID'}</span>
                  <span className="text-[9px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded font-medium">
                    Manual Input
                  </span>
                </label>
                <span className="text-[10px] text-zinc-400">GPay / PhonePe</span>
              </div>
              <input
                type="text"
                placeholder="e.g. name@okaxis or 9876543210@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-mono focus:outline-none"
              />
            </div>
          )}

          {/* Quick UPI Instant Payment Buttons */}
          {isValidAmount && upiId && (
            <div className="pt-1 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Instant Pay via UPI
                </label>
                <span className="text-[10px] text-zinc-400">1-Click Launch</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePayViaUPI('GPay')}
                  className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center space-x-1.5 shadow-2xs group cursor-pointer"
                >
                  <span className="font-bold text-[11px] text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                    <span>Google Pay</span>
                    <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePayViaUPI('PhonePe')}
                  className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center space-x-1.5 shadow-2xs group cursor-pointer"
                >
                  <span className="font-bold text-[11px] text-purple-600 dark:text-purple-400 flex items-center space-x-1">
                    <span>PhonePe</span>
                    <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              </div>

              {/* Desktop Guidance Banner */}
              {desktopNotice && (
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300 space-y-1 animate-in fade-in">
                  <div className="flex items-center space-x-1.5 font-semibold">
                    <Smartphone className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>Testing on Desktop PC</span>
                  </div>
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed">
                    Google Pay / PhonePe apps run on mobile phones. Scan the QR code below using your phone camera or GPay app to pay <strong>₹{desktopNotice.amount}</strong> to <strong>{desktopNotice.upiId}</strong> directly!
                  </p>
                </div>
              )}

              {/* QR Code Toggle */}
              <button
                type="button"
                onClick={() => setShowQR(!showQR)}
                className="w-full py-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center space-x-1 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQR ? 'Hide UPI QR Code' : 'Scan QR Code with Phone'}</span>
              </button>

              {showQR && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center space-y-2 animate-in fade-in duration-150">
                  <div className="bg-white p-2.5 rounded-xl inline-block shadow-xs border border-zinc-200">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiPayUri)}`}
                      alt="UPI Payment QR Code"
                      className="w-36 h-36 mx-auto"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Scan with GPay, PhonePe, or Paytm to pay <strong>₹{numAmount.toFixed(2)}</strong> to <strong>{upiId}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Recording...' : 'Mark as Settled in sPLIT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
